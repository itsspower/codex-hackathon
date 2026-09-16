import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { deleteStudentCv, StudentCvAsset, saveStudentProfile, uploadStudentCv } from '@/lib/studentProfile';

export type OnboardingProfile = {
  name: string;
  surname: string;
  campus: string;
  course: string;
  interests: string[];
  interestsOther: string;
  qualifications: string;
  experience: string;
  certifications: string;
  cvUrl: string;
  cvFileName: string;
  cvUploadedAt: string;
};

type OnboardingContextValue = {
  profile: OnboardingProfile;
  setProfile: (updates: Partial<OnboardingProfile>) => void;
  loading: boolean;
  saving: boolean;
  saveProfile: () => Promise<string | null>;
  setPendingCvAsset: (asset: StudentCvAsset | null) => void;
};

const emptyProfile: OnboardingProfile = {
  name: '',
  surname: '',
  campus: '',
  course: '',
  interests: [],
  interestsOther: '',
  qualifications: '',
  experience: '',
  certifications: '',
  cvUrl: '',
  cvFileName: '',
  cvUploadedAt: '',
};

const DRAFT_KEY = 'relink.student.onboarding.draft';
const OnboardingContext = createContext<OnboardingContextValue | null>(null);
type OnboardingDraft = Pick<
  OnboardingProfile,
  | 'name'
  | 'surname'
  | 'campus'
  | 'course'
  | 'interests'
  | 'interestsOther'
  | 'qualifications'
  | 'experience'
  | 'certifications'
>;

function toOnboardingDraft(profile: OnboardingProfile): OnboardingDraft {
  return {
    name: profile.name,
    surname: profile.surname,
    campus: profile.campus,
    course: profile.course,
    interests: profile.interests,
    interestsOther: profile.interestsOther,
    qualifications: profile.qualifications,
    experience: profile.experience,
    certifications: profile.certifications,
  };
}

function parseOnboardingDraft(value: unknown): Partial<OnboardingDraft> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  const draft: Partial<OnboardingDraft> = {};
  if (typeof record.name === 'string') draft.name = record.name;
  if (typeof record.surname === 'string') draft.surname = record.surname;
  if (typeof record.campus === 'string') draft.campus = record.campus;
  if (typeof record.course === 'string') draft.course = record.course;
  if (
    Array.isArray(record.interests) &&
    record.interests.every((interest) => typeof interest === 'string')
  ) {
    draft.interests = record.interests;
  }
  if (typeof record.interestsOther === 'string') draft.interestsOther = record.interestsOther;
  if (typeof record.qualifications === 'string') draft.qualifications = record.qualifications;
  if (typeof record.experience === 'string') draft.experience = record.experience;
  if (typeof record.certifications === 'string') draft.certifications = record.certifications;
  return draft;
}

function OnboardingProvider({ children }: PropsWithChildren) {
  const [profile, setProfileState] = useState<OnboardingProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingCvAsset, setPendingCvAsset] = useState<StudentCvAsset | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      let nextProfile = emptyProfile;

      if (user) {
        const { data } = await supabase
          .from('student_profiles')
          .select('name, surname, campus, course, interests, interests_other, qualifications, experience, certifications, cv_url, cv_file_name, cv_uploaded_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          nextProfile = {
            name: data.name ?? '',
            surname: data.surname ?? '',
            campus: data.campus ?? '',
            course: data.course ?? '',
            interests: data.interests ?? [],
            interestsOther: data.interests_other ?? '',
            qualifications: data.qualifications ?? '',
            experience: data.experience ?? '',
            certifications: data.certifications ?? '',
            cvUrl: data.cv_url ?? '',
            cvFileName: data.cv_file_name ?? '',
            cvUploadedAt: data.cv_uploaded_at ?? '',
          };
        }
      }

      const draft = await AsyncStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = parseOnboardingDraft(JSON.parse(draft));
          if (parsed) {
            nextProfile = { ...nextProfile, ...parsed };
            await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(toOnboardingDraft(nextProfile)));
          } else {
            await AsyncStorage.removeItem(DRAFT_KEY);
          }
        } catch {
          await AsyncStorage.removeItem(DRAFT_KEY);
        }
      }

      if (mounted) {
        setProfileState(nextProfile);
        setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  function setProfile(updates: Partial<OnboardingProfile>) {
    setProfileState((current) => {
      const next = { ...current, ...updates };
      void AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(toOnboardingDraft(next)));
      return next;
    });
  }

  async function saveProfile() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return 'Your session could not be loaded. Please log in again.';
    }

    let cvUrl = profile.cvUrl || null;
    let cvFileName = profile.cvFileName || null;
    let cvUploadedAt = profile.cvUploadedAt || null;
    let uploadedCvPath: string | null = null;

    if (pendingCvAsset) {
      const uploadResult = await uploadStudentCv(user.id, pendingCvAsset);
      if (uploadResult.error || !uploadResult.path) {
        setSaving(false);
        return uploadResult.error ?? 'The CV could not be uploaded.';
      }
      uploadedCvPath = uploadResult.path;
      cvUrl = uploadResult.path;
      cvFileName = pendingCvAsset.name;
      cvUploadedAt = new Date().toISOString();
    }

    const errorMessage = await saveStudentProfile(user.id, {
        name: profile.name.trim(),
        surname: profile.surname.trim(),
        campus: profile.campus.trim(),
        course: profile.course.trim(),
        interests: profile.interests,
        interests_other: profile.interestsOther.trim() || null,
        qualifications: profile.qualifications.trim() || null,
        experience: profile.experience.trim() || null,
        certifications: profile.certifications.trim() || null,
        cv_url: cvUrl,
        cv_file_name: cvFileName,
        cv_uploaded_at: cvUploadedAt,
      }, 'upsert');

    setSaving(false);
    if (errorMessage) {
      if (uploadedCvPath) {
        const cleanupError = await deleteStudentCv(uploadedCvPath);
        if (cleanupError) console.warn('New CV cleanup failed after profile save failure:', cleanupError);
      }
      return errorMessage;
    }
    if (uploadedCvPath && profile.cvUrl && profile.cvUrl !== uploadedCvPath) {
      const cleanupError = await deleteStudentCv(profile.cvUrl);
      if (cleanupError) console.warn('Previous CV cleanup failed:', cleanupError);
    }
    setPendingCvAsset(null);
    if (!errorMessage) await AsyncStorage.removeItem(DRAFT_KEY);
    return errorMessage;
  }

  return (
    <OnboardingContext.Provider value={{ profile, setProfile, loading, saving, saveProfile, setPendingCvAsset }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return context;
}

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </OnboardingProvider>
  );
}
