import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenContainer,
  ScreenHeader,
} from '@/components/relink-ui';
import { RelinkColors, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Application = {
  id: string;
  status: string;
  submitted_at: string;
  opportunity: { title: string } | null;
};

type ApplicationRow = Omit<Application, 'opportunity'> & {
  opportunity: { title: string }[] | null;
};

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<Application[]>([]);
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

    const { data, error } = await supabase
      .from('applications')
      .select('id, status, submitted_at, opportunity:opportunities(title)')
      .eq('student_id', user.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setApplications(
        ((data ?? []) as ApplicationRow[]).map((application) => ({
          ...application,
          opportunity: application.opportunity?.[0] ?? null,
        }))
      );
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadApplications();
    }, [loadApplications])
  );

  if (loading && applications.length === 0) return <LoadingState message="Loading applications..." />;
  if (errorMessage && applications.length === 0) return <ErrorState message={errorMessage} />;

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Applications" subtitle="Track your opportunity applications" />
      {applications.length === 0 ? (
        <EmptyState title="No applications yet" message="Applications you submit will appear here." />
      ) : (
        applications.map((application) => (
          <Card key={application.id} style={styles.card}>
            <Text style={styles.title}>{application.opportunity?.title ?? 'Opportunity'}</Text>
            <Text style={styles.status}>Status: {application.status}</Text>
            <Text style={styles.meta}>
              Submitted {new Date(application.submitted_at).toLocaleDateString()}
            </Text>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  title: { color: RelinkColors.text, ...Typography.bodyStrong },
  status: { color: RelinkColors.primary, ...Typography.body, marginTop: Spacing.sm },
  meta: { color: RelinkColors.muted, ...Typography.caption, marginTop: Spacing.sm },
});
