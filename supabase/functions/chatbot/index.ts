// @ts-ignore: Deno runtime modules are resolved by the Supabase Edge runtime.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: esm.sh modules are resolved by the Supabase Edge runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.0";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_INSTRUCTIONS = `You are the Relink AI Assistant, a career and networking assistant built specifically for the Relink platform.

Your purpose: help students find relevant opportunities, understand their application statuses, discover relevant alumni, and navigate the platform. You are not a general-purpose assistant.

Rules you must always follow:
- Only use the information provided to you in this prompt's context. Never invent opportunities, application statuses, or user information.
- If you don't have information to answer something, say so honestly rather than guessing.
- Never discuss another user's private information, application status, or profile details beyond what is explicitly provided to you as public.
- Keep your tone friendly, concise, and encouraging - like a helpful career advisor, not a generic chatbot.
- If asked something entirely unrelated to CodeX, politely redirect the conversation back to what you can help with.`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Client scoped to the calling user - respects their RLS permissions
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { message, current_screen } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get the user's role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "student";

    // Gather context the backend decides is safe to share - role-scoped
    let contextData: Record<string, unknown> = {};

    if (role === "student") {
      const { data: matches } = await supabase.rpc("match_opportunities_for_student", {
        p_student_id: user.id,
      });
      const { data: applications } = await supabase
        .from("applications")
        .select("id, status, opportunity_id, submitted_at")
        .eq("student_id", user.id);

      contextData = {
        matchedOpportunities: matches ?? [],
        ownApplications: applications ?? [],
      };
    } else if (role === "business" || role === "alumni") {
      const { data: ownOpportunities } = await supabase
        .from("opportunities")
        .select("id, title, status")
        .eq("posted_by", user.id);

      contextData = { ownOpportunities: ownOpportunities ?? [] };
    }

    // Build the prompt for Gemini
    const prompt = `${SYSTEM_INSTRUCTIONS}

Current user role: ${role}
Current screen: ${current_screen ?? "unknown"}
Context data available to you (only use this, never invent beyond it):
${JSON.stringify(contextData, null, 2)}

User's message: "${message}"

Respond naturally and helpfully, using only the context data above.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const geminiData = await geminiResponse.json();
    const aiText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Sorry, I couldn't generate a response right now.";

    // Log the conversation
    await supabase.from("chatbot_logs").insert({
      user_id: user.id,
      conversation_id: crypto.randomUUID(),
      user_message: message,
      ai_response: aiText,
    });

    return new Response(JSON.stringify({ reply: aiText }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});