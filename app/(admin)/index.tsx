import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import {
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
type Opportunity = {
  id: string;
  title: string;
  description: string | null;
  posted_by: string | null;
  created_at: string;
  status: string;
};

type User = {
  id: string;
  role: string;
  displayName: string;
};

function displayNameForRole(role: string, profile: Record<string, unknown> | undefined) {
  if (!profile) return 'Name not provided';
  if (role === 'student') {
    return [profile.name, profile.surname].filter((value): value is string => Boolean(value)).join(' ') || 'Name not provided';
  }
  if (role === 'alumni') {
    return [profile.first_name, profile.last_name].filter((value): value is string => Boolean(value)).join(' ') || 'Name not provided';
  }
  if (role === 'business') return typeof profile.business_name === 'string' && profile.business_name ? profile.business_name : 'Name not provided';
  return 'Administrator';
}

export default function AdminDashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadDashboard = useCallback(async () => {
    const [opportunitiesResult, profilesResult, studentsResult, alumniResult, businessesResult] = await Promise.all([
      supabase
        .from('opportunities')
        .select('id, title, description, posted_by, created_at, status')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, role').order('created_at', { ascending: false }),
      supabase.from('student_profiles').select('user_id, name, surname'),
      supabase.from('alumni_profiles').select('user_id, first_name, last_name'),
      supabase.from('business_profiles').select('user_id, business_name'),
    ]);

    const firstError = [
      opportunitiesResult.error,
      profilesResult.error,
      studentsResult.error,
      alumniResult.error,
      businessesResult.error,
    ].find(Boolean);
    if (firstError) {
      setErrorMessage(firstError.message);
      return;
    }

    const profileByUserId = new Map<string, Record<string, unknown>>();
    for (const profile of studentsResult.data ?? []) profileByUserId.set(profile.user_id, profile);
    for (const profile of alumniResult.data ?? []) profileByUserId.set(profile.user_id, profile);
    for (const profile of businessesResult.data ?? []) profileByUserId.set(profile.user_id, profile);

    setAllOpportunities(opportunitiesResult.data ?? []);
    setOpportunities((opportunitiesResult.data ?? []).filter((opportunity) => opportunity.status === 'pending'));
    setUsers(
      (profilesResult.data ?? []).map((profile) => ({
        id: profile.id,
        role: profile.role,
        displayName: displayNameForRole(profile.role, profileByUserId.get(profile.id)),
      }))
    );
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    void loadDashboard().finally(() => setLoading(false));
  }, [loadDashboard]);

  async function updateOpportunityStatus(id: string, status: 'open' | 'rejected') {
    setUpdatingId(id);
    const { error } = await supabase.from('opportunities').update({ status }).eq('id', id);
    setUpdatingId(null);
    if (error) {
      Alert.alert('Unable to update opportunity', error.message);
      return;
    }
    setAllOpportunities((current) =>
      current.map((opportunity) => opportunity.id === id ? { ...opportunity, status } : opportunity)
    );
    setOpportunities((current) => current.filter((opportunity) => opportunity.id !== id));
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

  if (loading) return <LoadingState message="Loading admin dashboard..." />;
  if (errorMessage) return <ErrorState message={errorMessage} />;

  const roleCounts = ['student', 'alumni', 'business', 'admin'].map((role) => ({
    label: role,
    count: users.filter((user) => user.role === role).length,
  }));
  const opportunityCounts = ['pending', 'open', 'rejected', 'closed', 'filled'].map((status) => ({
    label: status,
    count: allOpportunities.filter((opportunity) => opportunity.status === status).length,
  }));

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Admin Dashboard" subtitle="Review opportunities and view users" />

      <Text style={styles.sectionTitle}>Platform overview</Text>
      <Card style={styles.statsCard}>
        <Text style={styles.statsLabel}>Users by role</Text>
        <View style={styles.statRow}>
          {roleCounts.map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Badge tone="neutral">{stat.count}</Badge>
              <Text style={styles.statText}>{stat.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.statsLabel}>Opportunities by status</Text>
        <View style={styles.statRow}>
          {opportunityCounts.map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Badge tone={stat.label === 'open' ? 'success' : stat.label === 'rejected' ? 'danger' : 'primary'}>
                {stat.count}
              </Badge>
              <Text style={styles.statText}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Pending opportunities</Text>
      {opportunities.length === 0 ? (
        <EmptyState title="No pending opportunities" message="New business posts will appear here for review." />
      ) : (
        opportunities.map((opportunity) => (
          <Card key={opportunity.id} style={styles.card}>
            <Text style={styles.cardTitle}>{opportunity.title}</Text>
            {opportunity.description ? <Text style={styles.body}>{opportunity.description}</Text> : null}
            <View style={styles.actionRow}>
              <PrimaryButton
                onPress={() => void updateOpportunityStatus(opportunity.id, 'open')}
                disabled={updatingId === opportunity.id}
                style={styles.actionButton}
              >
                Approve
              </PrimaryButton>
              <SecondaryButton
                onPress={() => void updateOpportunityStatus(opportunity.id, 'rejected')}
                disabled={updatingId === opportunity.id}
                style={styles.actionButton}
              >
                Reject
              </SecondaryButton>
            </View>
          </Card>
        ))
      )}

      <Text style={styles.sectionTitle}>Users</Text>
      {users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        users.map((user) => (
          <Card key={user.id} style={styles.userCard}>
            <View style={styles.userDetails}>
              <Text style={styles.cardTitle}>{user.displayName}</Text>
              <Badge tone="neutral">{user.role}</Badge>
            </View>
          </Card>
        ))
      )}
      <PrimaryButton onPress={() => void handleLogout()} disabled={loggingOut} style={styles.logoutButton}>
        {loggingOut ? 'Logging out...' : 'Log out'}
      </PrimaryButton>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: RelinkColors.text, ...Typography.heading, marginTop: Spacing.lg, marginBottom: Spacing.md },
  card: { gap: Spacing.md, marginBottom: Spacing.md },
  userCard: { marginBottom: Spacing.sm },
  cardTitle: { color: RelinkColors.text, ...Typography.bodyStrong },
  body: { color: RelinkColors.muted, ...Typography.body },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionButton: { flex: 1 },
  userDetails: { gap: Spacing.sm },
  statsCard: { gap: Spacing.md, marginBottom: Spacing.md },
  statsLabel: { color: RelinkColors.muted, ...Typography.label },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statItem: { minWidth: 58, alignItems: 'center', gap: Spacing.xs },
  statText: { color: RelinkColors.muted, ...Typography.caption, textTransform: 'capitalize' },
  logoutButton: { marginTop: Spacing.xl },
});
