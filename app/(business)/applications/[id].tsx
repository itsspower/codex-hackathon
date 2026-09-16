import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import {
  Badge,
  Card,
  ErrorState,
  LoadingState,
  PrimaryButton,
  ScreenContainer,
  ScreenHeader,
  SecondaryButton,
} from '@/components/relink-ui';
import { RelinkColors, Spacing, Typography } from '@/constants/theme';
import { createStudentCvUrl } from '@/lib/studentProfile';
import { supabase } from '@/lib/supabase';

type Application = {
  id: string;
  opportunity_id: string;
  student_id: string;
  status: string;
  submitted_at: string;
  recruiter_notes: string | null;
};
type Opportunity = { title: string };
type StudentProfile = {
  name: string | null;
  surname: string | null;
  course: string | null;
  qualifications: string | null;
  experience: string | null;
  certifications: string | null;
  cv_url: string | null;
  cv_file_name: string | null;
};
type StatusHistory = {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
};

const applicationStatuses = ['submitted', 'under_review', 'shortlisted', 'accepted', 'rejected'] as const;

export default function BusinessApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadApplication() {
      if (!id) {
        setErrorMessage('This application could not be identified.');
        setLoading(false);
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setErrorMessage(userError?.message ?? 'Your session could not be loaded.');
        setLoading(false);
        return;
      }

      const { data: applicationData, error: applicationError } = await supabase
        .from('applications')
        .select('id, opportunity_id, student_id, status, submitted_at, recruiter_notes')
        .eq('id', id)
        .maybeSingle();

      if (applicationError || !applicationData) {
        setErrorMessage(applicationError?.message ?? 'This application is not available.');
        setLoading(false);
        return;
      }

      const { data: opportunityData, error: opportunityError } = await supabase
        .from('opportunities')
        .select('title')
        .eq('id', applicationData.opportunity_id)
        .eq('posted_by', user.id)
        .maybeSingle();

      if (opportunityError || !opportunityData) {
        setErrorMessage(opportunityError?.message ?? 'You are not allowed to view this application.');
        setLoading(false);
        return;
      }

      const [
        { data: studentData, error: studentError },
        { data: historyData, error: historyError },
      ] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('name, surname, course, qualifications, experience, certifications, cv_url, cv_file_name')
          .eq('user_id', applicationData.student_id)
          .maybeSingle(),
        supabase
          .from('application_status_history')
          .select('id, status, note, created_at')
          .eq('application_id', id)
          .order('created_at', { ascending: false }),
      ]);

      if (studentError || historyError) {
        setErrorMessage(studentError?.message ?? historyError?.message ?? 'Applicant details could not be loaded.');
        setLoading(false);
        return;
      }

      setApplication(applicationData as Application);
      setOpportunity(opportunityData as Opportunity);
      setStudent(studentData as StudentProfile | null);
      setHistory((historyData ?? []) as StatusHistory[]);
      setLoading(false);
    }

    void loadApplication();
  }, [id]);

  async function openCv() {
    if (!student?.cv_url) return;
    const { url, error } = await createStudentCvUrl(student.cv_url);
    if (error || !url) {
      Alert.alert('Unable to open CV', error ?? 'The CV link could not be created.');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open CV', 'The CV link could not be opened on this device.');
    }
  }

  async function updateStatus(status: string) {
    if (!application || status === application.status || updating) return;

    setUpdating(true);
    const { data, error } = await supabase.rpc('update_business_application_status', {
      p_application_id: application.id,
      p_status: status,
    });
    setUpdating(false);

    if (error) {
      Alert.alert('Unable to update application', error.message);
      return;
    }

    const updatedApplication = Array.isArray(data) ? data[0] : data;
    setApplication((current) => current ? { ...current, status: updatedApplication?.status ?? status } : current);
    setHistory((current) => [
      {
        id: `${Date.now()}`,
        status: updatedApplication?.status ?? status,
        note: null,
        created_at: new Date().toISOString(),
      },
      ...current,
    ]);
    Alert.alert('Application updated', 'The student has been notified.');
  }

  if (loading) return <LoadingState message="Loading applicant..." />;
  if (errorMessage) return <ErrorState message={errorMessage} />;
  if (!application || !opportunity) return <ErrorState message="This application is not available." />;

  const applicantName = [student?.name, student?.surname].filter(Boolean).join(' ') || 'Student applicant';

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Applicant details" onBack={() => router.back()} />
      <Card style={styles.card}>
        <Text style={styles.title}>{applicantName}</Text>
        <Text style={styles.meta}>Applied for {opportunity.title}</Text>
        <Text style={styles.meta}>Submitted {new Date(application.submitted_at).toLocaleDateString()}</Text>
        <Badge tone="primary">{application.status}</Badge>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.heading}>Applicant profile</Text>
        {student?.course ? <Text style={styles.body}>Course: {student.course}</Text> : null}
        {student?.qualifications ? <Text style={styles.body}>Qualifications: {student.qualifications}</Text> : null}
        {student?.experience ? <Text style={styles.body}>Experience: {student.experience}</Text> : null}
        {student?.certifications ? <Text style={styles.body}>Certifications: {student.certifications}</Text> : null}
        {student?.cv_file_name ? (
          <PrimaryButton onPress={() => void openCv()} style={styles.cvButton}>Open CV: {student.cv_file_name}</PrimaryButton>
        ) : (
          <Text style={styles.meta}>No CV uploaded.</Text>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.heading}>Update status</Text>
        <View style={styles.statusList}>
          {applicationStatuses.map((status) => (
            <SecondaryButton
              key={status}
              onPress={() => void updateStatus(status)}
              disabled={updating || status === application.status}
              style={styles.statusButton}
            >
              {status === application.status ? `${status} (current)` : status}
            </SecondaryButton>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.heading}>Status history</Text>
        {history.length === 0 ? (
          <Text style={styles.meta}>No status history recorded yet.</Text>
        ) : (
          history.map((entry) => (
            <View key={entry.id} style={styles.historyRow}>
              <Text style={styles.body}>{entry.status}</Text>
              <Text style={styles.meta}>{new Date(entry.created_at).toLocaleDateString()}</Text>
            </View>
          ))
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg, gap: Spacing.sm },
  title: { color: RelinkColors.text, ...Typography.title },
  heading: { color: RelinkColors.text, ...Typography.heading },
  body: { color: RelinkColors.muted, ...Typography.body },
  meta: { color: RelinkColors.muted, ...Typography.caption },
  cvButton: { marginTop: Spacing.sm },
  statusList: { gap: Spacing.sm },
  statusButton: { alignItems: 'flex-start' },
  historyRow: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: RelinkColors.border },
});
