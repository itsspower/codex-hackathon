import { supabase } from '@/lib/supabase';

export type StudentProfileWrite = {
  name: string;
  surname: string;
  campus: string;
  course: string;
  interests: string[];
  interests_other: string | null;
};

export type StudentProfileCompletionFields = {
  name?: string | null;
  surname?: string | null;
  campus?: string | null;
  course?: string | null;
  interests?: string[] | null;
};

type StudentProfileWriteMode = 'update' | 'upsert';

export async function saveStudentProfile(
  userId: string,
  profile: StudentProfileWrite,
  mode: StudentProfileWriteMode
): Promise<string | null> {
  const query =
    mode === 'upsert'
      ? supabase
          .from('student_profiles')
          .upsert({ user_id: userId, ...profile }, { onConflict: 'user_id' })
      : supabase
          .from('student_profiles')
          .update(profile)
          .eq('user_id', userId);

  const { error } = await query;
  return error?.message ?? null;
}

export function requiredProfileComplete(
  profile: StudentProfileCompletionFields | null | undefined
): boolean {
  return Boolean(
    profile?.name?.trim() &&
      profile?.surname?.trim() &&
      profile?.campus?.trim() &&
      profile?.course?.trim()
  );
}

export function profileCompletionScore(profile: StudentProfileCompletionFields): number {
  const completedFields = [
    profile.name,
    profile.surname,
    profile.campus,
    profile.course,
    profile.interests?.length ? 'interests' : null,
  ].filter(Boolean).length;

  return Math.round((completedFields / 5) * 100);
}
