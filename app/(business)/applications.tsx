import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenContainer,
  ScreenHeader,
} from '@/components/relink-ui';
import { RelinkColors, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Opportunity = { id: string; title: string };
type Application = {
  id: string;
  opportunity_id: string;
  student_id: string;
  status: string;
  submitted_at: string;
};
type StudentProfile = {
  user_id: string;
  name: string | null;
  surname: string | null;
  course: string | null;
  qualifications: string | null;
};

const statusTone = {
  submitted: 'neutral',
  under_review: 'primary',
  shortlisted: 'success',
  accepted: 'success',
  rejected: 'danger',
} as const;

export default function BusinessApplicationsScreen() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setErrorMessage(userError?.message ?? 'Your session could not be loaded.');
      setLoading(false);
      return;
    }

    const { data: opportunityData, error: opportunityError } = await supabase
      .from('opportunities')
      .select('id, title')
      .eq('posted_by', user.id)
      .order('created_at', { ascending: false });

    if (opportunityError) {
      setErrorMessage(opportunityError.message);
      setLoading(false);
      return;
    }

    const ownedOpportunities = (opportunityData ?? []) as Opportunity[];
    const opportunityIds = ownedOpportunities.map((opportunity) => opportunity.id);
    if (opportunityIds.length === 0) {
      setOpportunities([]);
      setApplications([]);
      setStudents([]);
      setLoading(false);
      return;
    }

    const { data: applicationData, error: applicationError } = await supabase
      .from('applications')
      .select('id, opportunity_id, student_id, status, submitted_at')
      .in('opportunity_id', opportunityIds)
      .order('submitted_at', { ascending: false });

    if (applicationError) {
      setErrorMessage(applicationError.message);
      setLoading(false);
      return;
    }

    const ownedApplications = (applicationData ?? []) as Application[];
    const studentIds = [...new Set(ownedApplications.map((application) => application.student_id))];
    const { data: studentData, error: studentError } = studentIds.length
      ? await supabase
          .from('student_profiles')
          .select('user_id, name, surname, course, qualifications')
          .in('user_id', studentIds)
      : { data: [], error: null };

    if (studentError) {
      setErrorMessage(studentError.message);
      setLoading(false);
      return;
    }

    setOpportunities(ownedOpportunities);
    setApplications(ownedApplications);
    setStudents((studentData ?? []) as StudentProfile[]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadApplications();
    }, [loadApplications])
  );

  if (loading && applications.length === 0) return <LoadingState message="Loading applicants..." />;
  if (errorMessage && applications.length === 0) return <ErrorState message={errorMessage} />;

  const opportunityById = new Map(opportunities.map((opportunity) => [opportunity.id, opportunity]));
  const studentById = new Map(students.map((student) => [student.user_id, student]));

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Applicants" subtitle="Review applications for your opportunities" />
      {applications.length === 0 ? (
        <EmptyState title="No applicants yet" message="Applications for your opportunities will appear here." />
      ) : (
        applications.map((application) => {
          const student = studentById.get(application.student_id);
          const name = [student?.name, student?.surname].filter(Boolean).join(' ') || 'Student applicant';
          const opportunity = opportunityById.get(application.opportunity_id);

          return (
            <Link key={application.id} href={`/(business)/applications/${application.id}` as any} asChild>
              <Pressable>
                <Card style={styles.card}>
                  <View style={styles.header}>
                    <Text style={styles.name}>{name}</Text>
                    <Badge tone={statusTone[application.status as keyof typeof statusTone] ?? 'neutral'}>
                      {application.status}
                    </Badge>
                  </View>
                  <Text style={styles.meta}>{opportunity?.title ?? 'Opportunity'}</Text>
                  {student?.course ? <Text style={styles.body}>Course: {student.course}</Text> : null}
                  {student?.qualifications ? <Text style={styles.body}>Qualification: {student.qualifications}</Text> : null}
                  <Text style={styles.meta}>
                    Submitted {new Date(application.submitted_at).toLocaleDateString()}
                  </Text>
                </Card>
              </Pressable>
            </Link>
          );
        })
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md },
  name: { flex: 1, color: RelinkColors.text, ...Typography.bodyStrong },
  body: { color: RelinkColors.muted, ...Typography.body, marginTop: Spacing.sm },
  meta: { color: RelinkColors.muted, ...Typography.caption, marginTop: Spacing.sm },
});
