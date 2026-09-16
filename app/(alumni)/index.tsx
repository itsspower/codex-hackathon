import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PrimaryButton,
  ScreenContainer,
  ScreenHeader,
  SecondaryButton,
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
  mentorship_interests: string[] | null;
  verification_status: string | null;
};

type MentorshipRequest = {
  id: string;
  student_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  studentName: string;
};

type StudentProfileName = {
  user_id: string;
  name: string | null;
  surname: string | null;
};

const profileFields = [
  ['Qualification', (profile: AlumniProfile) => profile.qualification],
  ['Graduation year', (profile: AlumniProfile) => profile.graduation_year?.toString()],
  ['Current role', (profile: AlumniProfile) => profile.current_job_title],
  ['Company', (profile: AlumniProfile) => profile.current_company],
  ['Industry', (profile: AlumniProfile) => profile.industry],
  ['Experience', (profile: AlumniProfile) =>
    profile.years_experience === null ? null : `${profile.years_experience} years`],
] as const;

function getName(firstName: string | null | undefined, lastName: string | null | undefined, fallback: string) {
  return [firstName, lastName].filter(Boolean).join(' ') || fallback;
}

export default function AlumniDashboard() {
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [welcomeName, setWelcomeName] = useState('Alumni');
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setErrorMessage(userError?.message ?? 'Your session could not be loaded. Please log in again.');
      setLoading(false);
      return;
    }

    const metadata = user.user_metadata as { full_name?: string; name?: string } | undefined;
    setWelcomeName(metadata?.full_name ?? metadata?.name ?? user.email?.split('@')[0] ?? 'Alumni');

    const [{ data: role, error: roleError }, { data: alumniProfile, error: profileError }, { data: requestRows, error: requestsError }] =
      await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
        supabase
          .from('alumni_profiles')
          .select('first_name, last_name, graduation_year, qualification, current_job_title, current_company, industry, skills_interests, years_experience, bio, mentorship_interests, verification_status')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('mentorship_requests')
          .select('id, student_id, message, status, created_at')
          .eq('alumni_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

    if (roleError || role?.role !== 'alumni') {
      setErrorMessage(roleError?.message ?? 'This dashboard is only available to alumni accounts.');
      setLoading(false);
      return;
    }
    if (profileError || requestsError) {
      setErrorMessage(profileError?.message ?? requestsError?.message ?? 'Your alumni dashboard could not be loaded.');
      setLoading(false);
      return;
    }

    const rows = (requestRows ?? []) as Omit<MentorshipRequest, 'studentName'>[];
    const studentIds = [...new Set(rows.map((request) => request.student_id))];
    let studentsById = new Map<string, string>();

    if (studentIds.length > 0) {
      const { data: studentProfiles } = await supabase
        .from('student_profiles')
        .select('user_id, name, surname')
        .in('user_id', studentIds);

      studentsById = new Map(
        ((studentProfiles ?? []) as StudentProfileName[]).map((student) => [
          student.user_id,
          getName(student.name, student.surname, 'Student profile unavailable'),
        ])
      );
    }

    setProfile(alumniProfile as AlumniProfile | null);
    setRequests(
      rows.map((request) => ({
        ...request,
        studentName: studentsById.get(request.student_id) ?? 'Student profile unavailable',
      }))
    );
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard])
  );

  async function updateRequest(requestId: string, status: 'accepted' | 'declined') {
    if (updatingRequestId) return;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      Alert.alert('Unable to update request', userError?.message ?? 'Your session could not be loaded.');
      return;
    }

    setUpdatingRequestId(requestId);
    const { data, error } = await supabase
      .from('mentorship_requests')
      .update({ status })
      .eq('id', requestId)
      .eq('alumni_id', user.id)
      .eq('status', 'pending')
      .select('id, status')
      .maybeSingle();
    setUpdatingRequestId(null);

    if (error) {
      Alert.alert('Unable to update request', error.message);
      return;
    }
    if (!data) {
      Alert.alert('Request was not updated', 'This request may already have been handled.');
      await loadDashboard();
      return;
    }

    setRequests((current) =>
      current.map((request) =>
        request.id === requestId ? { ...request, status } : request
      )
    );
  }

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

  if (loading && !profile) return <LoadingState message="Loading alumni dashboard..." />;
  if (errorMessage && !profile) return <ErrorState message={errorMessage} />;

  const profileName = profile
    ? getName(profile.first_name, profile.last_name, welcomeName)
    : welcomeName;

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Alumni Dashboard" subtitle={`Welcome, ${profileName}`} />

      <Card style={styles.welcomeCard}>
        <Avatar label={profileName} size={64} />
        <View style={styles.welcomeCopy}>
          <Text style={styles.eyebrow}>Welcome back</Text>
          <Text style={styles.welcomeName}>{profileName}</Text>
          <Text style={styles.body}>Stay connected and support the next generation of Relink students.</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Profile summary</Text>
        {profile ? (
          <>
            {profileFields.map(([label, getValue]) => {
              const value = getValue(profile);
              return value ? <Text key={label} style={styles.body}>{label}: {value}</Text> : null;
            })}
            {profile.bio ? <Text style={styles.body}>Bio: {profile.bio}</Text> : null}
            {profile.skills_interests?.length ? (
              <Text style={styles.body}>Skills: {profile.skills_interests.join(', ')}</Text>
            ) : null}
            {profile.mentorship_interests?.length ? (
              <Text style={styles.body}>Mentorship interests: {profile.mentorship_interests.join(', ')}</Text>
            ) : null}
            <Badge
              tone={
                profile.verification_status === 'verified'
                  ? 'success'
                  : profile.verification_status === 'rejected'
                    ? 'danger'
                    : 'warning'
              }
            >
              {profile.verification_status
                ? `Profile: ${profile.verification_status}`
                : 'Profile status unavailable'}
            </Badge>
          </>
        ) : (
          <EmptyState title="Profile details unavailable" message="Your account is signed in, but no alumni profile has been saved yet." />
        )}
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mentorship requests</Text>
        <Text style={styles.count}>{requests.length}</Text>
      </View>
      {errorMessage ? <Text style={styles.inlineError}>{errorMessage}</Text> : null}
      {requests.length === 0 ? (
        <Card style={styles.card}>
          <EmptyState title="No mentorship requests" message="New requests from students will appear here." />
        </Card>
      ) : (
        requests.map((request) => (
          <Card key={request.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <Text style={styles.requestName}>{request.studentName}</Text>
              <Badge tone={request.status === 'accepted' ? 'success' : request.status === 'declined' ? 'danger' : 'warning'}>
                {request.status}
              </Badge>
            </View>
            {request.message ? <Text style={styles.body}>{request.message}</Text> : null}
            <Text style={styles.meta}>Received {new Date(request.created_at).toLocaleDateString()}</Text>
            {request.status === 'pending' ? (
              <View style={styles.actions}>
                <PrimaryButton
                  onPress={() => void updateRequest(request.id, 'accepted')}
                  disabled={updatingRequestId !== null}
                  style={styles.actionButton}
                >
                  {updatingRequestId === request.id ? 'Updating...' : 'Accept'}
                </PrimaryButton>
                <SecondaryButton
                  onPress={() => void updateRequest(request.id, 'declined')}
                  disabled={updatingRequestId !== null}
                  style={styles.actionButton}
                >
                  Decline
                </SecondaryButton>
              </View>
            ) : null}
          </Card>
        ))
      )}

      <SecondaryButton onPress={() => void handleLogout()} disabled={loggingOut} style={styles.logoutButton}>
        {loggingOut ? 'Logging out...' : 'Log out'}
      </SecondaryButton>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  welcomeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  welcomeCopy: { flex: 1 },
  eyebrow: { color: RelinkColors.primary, ...Typography.caption, marginBottom: Spacing.xs },
  welcomeName: { color: RelinkColors.text, ...Typography.heading, marginBottom: Spacing.xs },
  card: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionTitle: { color: RelinkColors.text, ...Typography.heading },
  count: { color: RelinkColors.primary, ...Typography.bodyStrong },
  body: { color: RelinkColors.muted, ...Typography.body, marginBottom: Spacing.sm },
  requestCard: { marginBottom: Spacing.md },
  requestHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md },
  requestName: { flex: 1, color: RelinkColors.text, ...Typography.bodyStrong },
  meta: { color: RelinkColors.muted, ...Typography.caption, marginTop: Spacing.sm },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  actionButton: { flex: 1, paddingHorizontal: Spacing.sm },
  inlineError: { color: RelinkColors.danger, ...Typography.body, marginBottom: Spacing.md },
  logoutButton: { marginTop: Spacing.md, marginBottom: Spacing.lg },
});
