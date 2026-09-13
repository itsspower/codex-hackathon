import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PrimaryButton,
  SecondaryButton,
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
  const [requestMessage, setRequestMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
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

  useEffect(() => {
    async function loadExistingRequest() {
      if (!id) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mentorship_requests')
        .select('status')
        .eq('student_id', user.id)
        .eq('alumni_id', id)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      if (!error && data) setRequestStatus(data.status);
    }

    void loadExistingRequest();
  }, [id]);

  async function submitMentorshipRequest() {
    if (!id || requestStatus || requesting) return;

    setRequesting(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setRequesting(false);
      Alert.alert('Unable to request mentorship', userError?.message ?? 'Please log in again.');
      return;
    }

    const { data: existingRequest, error: existingError } = await supabase
      .from('mentorship_requests')
      .select('status')
      .eq('student_id', user.id)
      .eq('alumni_id', id)
      .in('status', ['pending', 'accepted'])
      .maybeSingle();

    if (existingError) {
      setRequesting(false);
      Alert.alert('Unable to request mentorship', existingError.message);
      return;
    }

    if (existingRequest) {
      setRequesting(false);
      setRequestStatus(existingRequest.status);
      setRequestOpen(false);
      return;
    }

    const { error } = await supabase
      .from('mentorship_requests')
      .insert({
        student_id: user.id,
        alumni_id: id,
        message: requestMessage.trim() || null,
      });

    setRequesting(false);
    if (error) {
      Alert.alert('Request failed', error.message);
      return;
    }

    setRequestStatus('pending');
    setRequestMessage('');
    setRequestOpen(false);
    Alert.alert(
      'Mentorship request sent',
      'Your request is now pending.',
      [{ text: 'View requests', onPress: () => router.push('/(tabs)/mentorship') }, { text: 'Done' }]
    );
  }

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
        <View style={styles.requestAction}>
          {requestStatus ? (
            <Text style={styles.requestStatus}>Mentorship request: {requestStatus}</Text>
          ) : (
            <PrimaryButton onPress={() => setRequestOpen(true)}>Request Mentorship</PrimaryButton>
          )}
        </View>
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
      <Modal
        visible={requestOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setRequestOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <Text style={styles.heading}>Request Mentorship</Text>
            <Text style={styles.body}>
              Add an optional message to introduce yourself.
            </Text>
            <TextInput
              value={requestMessage}
              onChangeText={setRequestMessage}
              placeholder="Optional message"
              placeholderTextColor={RelinkColors.muted}
              multiline
              style={styles.messageInput}
            />
            <PrimaryButton onPress={() => void submitMentorshipRequest()} disabled={requesting}>
              {requesting ? 'Sending...' : 'Send request'}
            </PrimaryButton>
            <SecondaryButton onPress={() => setRequestOpen(false)} style={styles.cancelButton}>
              Cancel
            </SecondaryButton>
          </Card>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', marginBottom: Spacing.lg },
  requestAction: { width: '100%', marginTop: Spacing.lg },
  requestStatus: { color: RelinkColors.primary, ...Typography.bodyStrong, textAlign: 'center' },
  name: { color: RelinkColors.text, ...Typography.title, marginTop: Spacing.md },
  muted: { color: RelinkColors.muted, ...Typography.body, marginTop: 2 },
  section: { marginBottom: Spacing.lg },
  heading: { color: RelinkColors.text, ...Typography.heading, marginBottom: Spacing.md },
  body: { color: RelinkColors.muted, ...Typography.body, marginBottom: Spacing.sm },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalCard: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  messageInput: {
    minHeight: 96,
    color: RelinkColors.text,
    ...Typography.body,
    textAlignVertical: 'top',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: RelinkColors.border,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  cancelButton: { marginTop: Spacing.sm },
});
