import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { saveStudentProfile } from '@/lib/studentProfile';

export type OnboardingProfile = {
  name: string;
  surname: string;
  campus: string;
  course: string;
  interests: string[];
  interestsOther: string;
};

type OnboardingContextValue = {
  profile: OnboardingProfile;
  setProfile: (updates: Partial<OnboardingProfile>) => void;
  loading: boolean;
  saving: boolean;
  saveProfile: () => Promise<string | null>;
};

const emptyProfile: OnboardingProfile = {
  name: '',
  surname: '',
  campus: '',
  course: '',
  interests: [],
  interestsOther: '',
};

const DRAFT_KEY = 'relink.student.onboarding.draft';
const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function OnboardingProvider({ children }: PropsWithChildren) {
  const [profile, setProfileState] = useState<OnboardingProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      let nextProfile = emptyProfile;

      if (user) {
        const { data } = await supabase
          .from('student_profiles')
          .select('name, surname, campus, course, interests, interests_other')
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
          };
        }
      }

      const draft = await AsyncStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft) as Partial<OnboardingProfile>;
        nextProfile = { ...nextProfile, ...parsed };
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
      void AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(next));
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

    const errorMessage = await saveStudentProfile(user.id, {
        name: profile.name.trim(),
        surname: profile.surname.trim(),
        campus: profile.campus.trim(),
        course: profile.course.trim(),
        interests: profile.interests,
        interests_other: profile.interestsOther.trim() || null,
      }, 'upsert');

    setSaving(false);
    if (!errorMessage) await AsyncStorage.removeItem(DRAFT_KEY);
    return errorMessage;
  }

  return (
    <OnboardingContext.Provider value={{ profile, setProfile, loading, saving, saveProfile }}>
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
