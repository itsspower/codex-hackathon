import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

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

type Application = {
  id: string;
  status: string;
  submitted_at: string;
  opportunity: { title: string } | null;
  warmWelcome: WarmWelcomeMatch | null;
};

type ApplicationRow = Omit<Application, 'opportunity'> & {
  opportunity: { title: string }[] | null;
};

type WarmWelcomeMatch = {
  application_id: string;
  alumni_id: string | null;
  queue_position: number | null;
  status: 'no_alumni_available' | 'matched';
  alumniName?: string | null;
};

type AlumniName = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
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
      const applicationRows = (data ?? []) as ApplicationRow[];
      const applicationIds = applicationRows.map((application) => application.id);
      const { data: warmWelcomeData, error: warmWelcomeError } = applicationIds.length
        ? await supabase
            .from('warm_welcome_matches')
            .select('application_id, alumni_id, queue_position, status')
            .in('application_id', applicationIds)
        : { data: [], error: null };

      if (warmWelcomeError) {
        console.warn('Warm Welcome data could not be loaded:', warmWelcomeError);
      }

      const warmWelcomeMatches = (warmWelcomeData ?? []) as WarmWelcomeMatch[];
      const alumniIds = warmWelcomeMatches
        .map((match) => match.alumni_id)
        .filter((alumniId): alumniId is string => Boolean(alumniId));
      const { data: alumniData, error: alumniError } = alumniIds.length
        ? await supabase
            .from('alumni_profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', alumniIds)
        : { data: [], error: null };

      if (alumniError) {
        console.warn('Warm Welcome alumni names could not be loaded:', alumniError);
      }

      const matchByApplicationId = new Map(
        warmWelcomeMatches.map((match) => [match.application_id, match])
      );
      const alumniById = new Map(
        ((alumniData ?? []) as AlumniName[]).map((alumni) => [alumni.user_id, alumni])
      );

      setApplications(
        applicationRows.map((application) => {
          const warmWelcome = matchByApplicationId.get(application.id) ?? null;
          const alumni = warmWelcome?.alumni_id ? alumniById.get(warmWelcome.alumni_id) : undefined;

          return {
            ...application,
            opportunity: application.opportunity?.[0] ?? null,
            warmWelcome:
              warmWelcome?.status === 'matched'
                ? {
                    ...warmWelcome,
                    alumniName: alumni
                      ? [alumni.first_name, alumni.last_name].filter(Boolean).join(' ')
                      : null,
                  }
                : warmWelcome,
          };
        })
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
            {application.warmWelcome?.status === 'no_alumni_available' ? (
              <Badge tone="neutral">No alumni connection available yet.</Badge>
            ) : null}
            {application.warmWelcome?.status === 'matched' ? (
              <>
                <Badge tone="success">
                  Matched with {application.warmWelcome.alumniName ?? 'an alumnus'}
                </Badge>
                {application.warmWelcome.queue_position !== null ? (
                  <Text style={styles.meta}>Position {application.warmWelcome.queue_position}</Text>
                ) : null}
              </>
            ) : null}
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
