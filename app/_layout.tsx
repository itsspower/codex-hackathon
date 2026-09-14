import { Href, Stack, useGlobalSearchParams, useSegments, router } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { requiredProfileComplete } from '@/lib/studentProfile';

type Role = 'student' | 'alumni' | 'business' | 'admin';

const roleRoutes = {
  student: '/(tabs)',
  alumni: '/(alumni)',
  business: '/(business)',
  admin: '/(admin)',
} as const;

async function loadRole(userId: string): Promise<Role> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Unable to load your profile role: ${error.message}`);
  }

  if (data.role !== 'student' && data.role !== 'alumni' && data.role !== 'business' && data.role !== 'admin') {
    throw new Error('Your profile does not have a valid application role.');
  }

  return data.role;
}

async function isStudentProfileComplete(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('name, surname, campus, course')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load your student profile: ${error.message}`);
  }

  return requiredProfileComplete(data);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const { onboardingComplete } = useGlobalSearchParams<{ onboardingComplete?: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [studentProfileComplete, setStudentProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleError, setRoleError] = useState<string | null>(null);
  const studentRouteCheck = useRef<string | null>(null);
  const completedOnboardingSignal = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function resolveSession(nextSession: Session | null) {
      if (!mounted) return;

      setSession(nextSession);
      setRoleError(null);

      if (!nextSession) {
        setRole(null);
        setStudentProfileComplete(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const nextRole = await loadRole(nextSession.user.id);
        if (mounted) {
          setRole(nextRole);
          setStudentProfileComplete(
            nextRole === 'student' ? await isStudentProfileComplete(nextSession.user.id) : null
          );
        }
      } catch (error) {
        if (mounted) {
          setRole(null);
          setStudentProfileComplete(null);
          setRoleError(error instanceof Error ? error.message : 'Unable to load your profile role.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setRoleError(`Unable to load your authentication session: ${error.message}`);
        setLoading(false);
        return;
      }
      void resolveSession(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void resolveSession(nextSession);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (loading || roleError) return;

    const group = segments[0] as string | undefined;
    if (group !== '(tabs)') studentRouteCheck.current = null;

    if (!session) {
      if (group !== '(auth)' && group !== '(entry)') {
        router.replace('/(entry)/splash');
      }
      return;
    }

    if (role) {
      const completionSignal =
        typeof onboardingComplete === 'string' ? `${session.user.id}:${onboardingComplete}` : null;
      const shouldRefreshAfterOnboarding =
        role === 'student' &&
        group === '(tabs)' &&
        onboardingComplete === '1' &&
        completedOnboardingSignal.current !== completionSignal;
      const shouldRefreshOnTabsEntry =
        role === 'student' &&
        group === '(tabs)' &&
        studentRouteCheck.current !== '(tabs)';

      if (shouldRefreshAfterOnboarding || shouldRefreshOnTabsEntry) {
        if (shouldRefreshAfterOnboarding) completedOnboardingSignal.current = completionSignal;
        studentRouteCheck.current = '(tabs)';
        setStudentProfileComplete(null);
        void isStudentProfileComplete(session.user.id)
          .then((complete) => {
            if (!cancelled) setStudentProfileComplete(complete);
          })
          .catch((error) => {
            if (!cancelled) {
              setRoleError(error instanceof Error ? error.message : 'Unable to load your student profile.');
            }
          });
        return;
      }

      if (role === 'student' && studentProfileComplete === null) return;

      if (role === 'student' && !studentProfileComplete) {
        if (group !== '(onboarding)') router.replace('/(onboarding)/skills' as Href);
      } else if (
        group === '(auth)' ||
        group === '(entry)' ||
        group !== '(tabs)' &&
        group !== `(${role})` &&
        !(role === 'student' && group === 'alumni')
      ) {
        router.replace(roleRoutes[role]);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [loading, role, roleError, segments, session, studentProfileComplete, onboardingComplete]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (roleError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Unable to continue</Text>
        <Text>{roleError}</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(entry)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="alumni" />
        <Stack.Screen name="(alumni)" />
        <Stack.Screen name="(business)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  errorTitle: { fontSize: 20, fontWeight: '700' },
});