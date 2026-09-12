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

type MentorshipRequest = {
  id: string;
  alumni_id: string;
  message: string | null;
  status: string;
  created_at: string;
  alumniName: string;
};

type AlumniName = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
};

export default function MentorshipScreen() {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setErrorMessage(userError?.message ?? 'Your session could not be loaded.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('mentorship_requests')
      .select('id, alumni_id, message, status, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    const requestRows = (data ?? []) as Omit<MentorshipRequest, 'alumniName'>[];
    const alumniIds = [...new Set(requestRows.map((request) => request.alumni_id))];
    let alumniById = new Map<string, string>();

    if (alumniIds.length > 0) {
      const { data: alumni, error: alumniError } = await supabase
        .from('alumni_profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', alumniIds);

      if (alumniError) {
        setErrorMessage(alumniError.message);
        setLoading(false);
        return;
      }

      alumniById = new Map(
        ((alumni ?? []) as AlumniName[]).map((profile) => [
          profile.user_id,
          [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Alumni profile',
        ])
      );
    }

    setRequests(
      requestRows.map((request) => ({
        ...request,
        alumniName: alumniById.get(request.alumni_id) ?? 'Alumni profile',
      }))
    );
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests])
  );

  if (loading && requests.length === 0) return <LoadingState message="Loading mentorship requests..." />;
  if (errorMessage && requests.length === 0) return <ErrorState message={errorMessage} />;

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Mentorship" subtitle="Track your mentorship requests" />
      {requests.length === 0 ? (
        <EmptyState
          title="No mentorship requests yet"
          message="Your mentorship activity will appear here when requests are available."
        />
      ) : (
        requests.map((request) => (
          <Card key={request.id} style={styles.card}>
            <Text style={styles.name}>{request.alumniName}</Text>
            <Text style={styles.status}>Status: {request.status}</Text>
            {request.message ? <Text style={styles.message}>{request.message}</Text> : null}
            <Text style={styles.meta}>
              Created {new Date(request.created_at).toLocaleDateString()}
            </Text>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  name: { color: RelinkColors.text, ...Typography.bodyStrong },
  status: { color: RelinkColors.primary, ...Typography.body, marginTop: Spacing.sm },
  message: { color: RelinkColors.muted, ...Typography.body, marginTop: Spacing.sm },
  meta: { color: RelinkColors.muted, ...Typography.caption, marginTop: Spacing.sm },
});
