import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenContainer,
  ScreenHeader,
  SkillChip,
} from '@/components/relink-ui';
import { RelinkColors, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type AlumniProfile = {
  first_name: string | null;
  last_name: string | null;
  graduation_year: number | null;
  qualification: string | null;
  current_job_title: string | null;
  current_company: string | null;
  industry: string | null;
  skills_interests: string[] | null;
  years_experience: number | null;
  bio: string | null;
  verification_status: string | null;
};

export default function AlumniDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!id) {
        setErrorMessage('This alumni profile could not be identified.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('alumni_profiles')
        .select('first_name, last_name, graduation_year, qualification, current_job_title, current_company, industry, skills_interests, years_experience, bio, verification_status')
        .eq('user_id', id)
        .maybeSingle();

      if (error) setErrorMessage(error.message);
      else setProfile(data as AlumniProfile | null);
      setLoading(false);
    }

    void loadProfile();
  }, [id]);

  if (loading) return <LoadingState message="Loading alumni profile..." />;
  if (errorMessage) return <ErrorState message={errorMessage} />;
  if (!profile) return <EmptyState title="Alumni profile unavailable" />;

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Alumni profile';

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Alumni profile" onBack={() => router.back()} />
      <Card style={styles.identity}>
        <Avatar label={name} size={72} />
        <Text style={styles.name}>{name}</Text>
        {profile.current_job_title ? <Text style={styles.muted}>{profile.current_job_title}</Text> : null}
        {profile.current_company ? <Text style={styles.muted}>{profile.current_company}</Text> : null}
      </Card>
      {profile.bio ? (
        <Card style={styles.section}>
          <Text style={styles.heading}>About</Text>
          <Text style={styles.body}>{profile.bio}</Text>
        </Card>
      ) : null}
      <Card style={styles.section}>
        <Text style={styles.heading}>Background</Text>
        {profile.qualification ? <Text style={styles.body}>{profile.qualification}</Text> : null}
        {profile.graduation_year ? <Text style={styles.body}>Graduated {profile.graduation_year}</Text> : null}
        {profile.industry ? <Text style={styles.body}>{profile.industry}</Text> : null}
        {profile.years_experience !== null ? (
          <Text style={styles.body}>{profile.years_experience} years of experience</Text>
        ) : null}
      </Card>
      {profile.skills_interests?.length ? (
        <Card style={styles.section}>
          <Text style={styles.heading}>Skills and interests</Text>
          {profile.skills_interests.map((skill) => <SkillChip key={skill}>{skill}</SkillChip>)}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', marginBottom: Spacing.lg },
  name: { color: RelinkColors.text, ...Typography.title, marginTop: Spacing.md },
  muted: { color: RelinkColors.muted, ...Typography.body, marginTop: 2 },
  section: { marginBottom: Spacing.lg },
  heading: { color: RelinkColors.text, ...Typography.heading, marginBottom: Spacing.md },
  body: { color: RelinkColors.muted, ...Typography.body, marginBottom: Spacing.sm },
});
