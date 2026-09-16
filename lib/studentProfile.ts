import { supabase } from '@/lib/supabase';

export const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024;
export const CV_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type StudentCvAsset = {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string | null;
};

export type StudentProfileWrite = {
  name?: string;
  surname?: string;
  campus?: string;
  course?: string;
  interests?: string[];
  interests_other?: string | null;
  qualifications?: string | null;
  experience?: string | null;
  certifications?: string | null;
  cv_url?: string | null;
  cv_file_name?: string | null;
  cv_uploaded_at?: string | null;
};

export type StudentProfileCompletionFields = {
  name?: string | null;
  surname?: string | null;
  campus?: string | null;
  course?: string | null;
  interests?: string[] | null;
};

export type StudentProfile = StudentProfileCompletionFields & {
  interests_other: string | null;
  qualifications: string | null;
  experience: string | null;
  certifications: string | null;
  cv_url: string | null;
  cv_file_name: string | null;
  cv_uploaded_at: string | null;
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
  return Boolean(profile?.campus?.trim() && profile?.course?.trim());
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

export async function uploadStudentCv(
  userId: string,
  asset: StudentCvAsset
): Promise<{ error: string | null; path: string | null }> {
  if (asset.size !== undefined && asset.size <= 0) {
    return { error: 'Your CV cannot be empty.', path: null };
  }

  if (asset.size !== undefined && asset.size > MAX_CV_SIZE_BYTES) {
    return { error: 'Your CV must be 5 MB or smaller.', path: null };
  }

  const mimeType = asset.mimeType ?? 'application/octet-stream';
  if (!(CV_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return { error: 'Please select a PDF, DOC, or DOCX file.', path: null };
  }

  const { data: bucket, error: bucketError } = await supabase.storage.getBucket('cvs');
  if (bucketError || !bucket) {
    return {
      error: 'CV storage is not configured yet. Please try again after the private cvs bucket is set up.',
      path: null,
    };
  }

  let fileBody: Blob;
  try {
    const response = await fetch(asset.uri);
    if (!response.ok) throw new Error('CV file request failed');
    fileBody = await response.blob();
  } catch {
    return { error: 'The selected CV could not be read.', path: null };
  }

  if (fileBody.size <= 0) {
    return { error: 'Your CV cannot be empty.', path: null };
  }

  if (fileBody.size > MAX_CV_SIZE_BYTES) {
    return { error: 'Your CV must be 5 MB or smaller.', path: null };
  }

  const safeName = asset.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('cvs').upload(path, fileBody, {
    contentType: mimeType,
    upsert: false,
  });

  return { error: error?.message ?? null, path: error ? null : path };
}

export async function deleteStudentCv(path: string): Promise<string | null> {
  const { error } = await supabase.storage.from('cvs').remove([path]);
  return error?.message ?? null;
}

// cv_url stores a private Storage object path, not a public URL.
export async function createStudentCvUrl(path: string): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage.from('cvs').createSignedUrl(path, 300);
  return { url: data?.signedUrl ?? null, error: error?.message ?? null };
}
