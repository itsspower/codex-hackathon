import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, StyleSheet, Text } from 'react-native';

import { Card, EmptyState, ErrorState, LoadingState, PrimaryButton, ScreenContainer, ScreenHeader } from '@/components/relink-ui';
import { RelinkColors, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { createStudentCvUrl, StudentProfile } from '@/lib/studentProfile';

export default function ProfileTab() {
  const [loggingOut, setLoggingOut] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setErrorMessage(userError?.message ?? 'Your session could not be loaded.');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('student_profiles').select('name, surname, campus, course, interests, interests_other, qualifications, experience, certifications, cv_url, cv_file_name, cv_uploaded_at').eq('user_id', user.id).maybeSingle();
    if (error) setErrorMessage(error.message);
    else {
      setProfile(data as StudentProfile | null);
      setErrorMessage(null);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void loadProfile(); }, [loadProfile]));

  async function handleLogout() {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    setLoggingOut(false);

    if (error) {
      Alert.alert('Logout failed', error.message);
      return;
    }

    router.replace('/(entry)/splash');
  }

  if (loading && !profile) return <LoadingState message="Loading your profile..." />;
  if (errorMessage && !profile) return <ErrorState message={errorMessage} />;

  async function openCv() {
    if (!profile?.cv_url) return;
    const { url, error } = await createStudentCvUrl(profile.cv_url);
    if (error || !url) {
      Alert.alert('Unable to open CV', error ?? 'The CV link could not be created.');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open CV', 'Your CV link could not be opened on this device.');
    }
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Profile" subtitle="Manage your student profile" />
      {profile ? (
        <Card style={styles.profileCard}>
          <Text style={styles.title}>{[profile.name, profile.surname].filter(Boolean).join(' ') || 'Student profile'}</Text>
          {profile.course ? <Text style={styles.body}>Course: {profile.course}</Text> : null}
          {profile.campus ? <Text style={styles.body}>Campus: {profile.campus}</Text> : null}
          {profile.interests?.length ? <Text style={styles.body}>Skills: {profile.interests.join(', ')}</Text> : null}
          {profile.qualifications ? <Text style={styles.body}>Qualifications: {profile.qualifications}</Text> : null}
          {profile.experience ? <Text style={styles.body}>Experience: {profile.experience}</Text> : null}
          {profile.certifications ? <Text style={styles.body}>Certifications: {profile.certifications}</Text> : null}
          {profile.cv_file_name ? (
            <PrimaryButton onPress={() => void openCv()} style={styles.cvButton}>Open CV: {profile.cv_file_name}</PrimaryButton>
          ) : (
            <EmptyState title="No CV uploaded" message="Add a CV from profile setup when you are ready." />
          )}
        </Card>
      ) : null}
      <Card>
        <Text style={styles.title}>Profile foundation</Text>
        <Text style={styles.body}>
          Profile presentation and completion indicators will be added in a later phase.
        </Text>
        <Link href="/(tabs)/profile-setup" asChild>
          <PrimaryButton>Open profile setup</PrimaryButton>
        </Link>
        <Link href="/(tabs)/applications" asChild>
          <PrimaryButton style={styles.secondaryButton}>View applications</PrimaryButton>
        </Link>
        <Link href="/(tabs)/mentorship" asChild>
          <PrimaryButton style={styles.secondaryButton}>View mentorship requests</PrimaryButton>
        </Link>
        <PrimaryButton
          onPress={() => void handleLogout()}
          disabled={loggingOut}
          style={styles.secondaryButton}
        >
          {loggingOut ? 'Logging out...' : 'Log out'}
        </PrimaryButton>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: RelinkColors.text, ...Typography.heading, marginBottom: Spacing.sm },
  body: { color: RelinkColors.muted, ...Typography.body, marginBottom: Spacing.lg },
  secondaryButton: { marginTop: Spacing.md },
  profileCard: { marginBottom: Spacing.lg, gap: Spacing.sm },
  cvButton: { marginTop: Spacing.md },
});
