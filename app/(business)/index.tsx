import { Link, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PrimaryButton,
  ScreenContainer,
  ScreenHeader,
} from '@/components/relink-ui';
import { Radius, RelinkColors, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Opportunity = {
  id: string;
  title: string;
  description: string | null;
  opportunity_type: string | null;
  skills_required: string[] | null;
  location: string | null;
  work_arrangement: string | null;
  application_deadline: string | null;
  status: string;
};

type BusinessProfile = {
  business_name: string | null;
  location: string | null;
  business_phone: string | null;
  business_website: string | null;
  industry_category: string | null;
  company_description: string | null;
  contact_person_name: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | null;
};

const statusTone = {
  pending: 'warning',
  open: 'success',
  rejected: 'danger',
  closed: 'neutral',
  filled: 'primary',
} as const;

export default function BusinessDashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [opportunityType, setOpportunityType] = useState('');
  const [skillsRequired, setSkillsRequired] = useState('');
  const [location, setLocation] = useState('');
  const [workArrangement, setWorkArrangement] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');

  const loadOpportunities = useCallback(async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setErrorMessage(userError?.message ?? 'Your session could not be loaded.');
      return;
    }
    setUserId(user.id);

    const [{ data, error }, { data: profile, error: profileError }] = await Promise.all([
      supabase
      .from('opportunities')
      .select('id, title, description, opportunity_type, skills_required, location, work_arrangement, application_deadline, status')
      .eq('posted_by', user.id)
      .order('created_at', { ascending: false }),
      supabase
        .from('business_profiles')
        .select('business_name, location, business_phone, business_website, industry_category, company_description, contact_person_name, verification_status')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);
    if (error || profileError) {
      setErrorMessage(error?.message ?? profileError?.message ?? 'Your business profile could not be loaded.');
      return;
    }
    setOpportunities(data ?? []);
    setBusinessProfile(profile);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    void loadOpportunities().finally(() => setLoading(false));
  }, [loadOpportunities]);

  async function createOpportunity() {
    if (!userId) {
      Alert.alert('Unable to post opportunity', 'Your session could not be loaded.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please provide an opportunity title.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('opportunities').insert({
      posted_by: userId,
      title: title.trim(),
      description: description.trim() || null,
      opportunity_type: opportunityType.trim() || null,
      skills_required: skillsRequired.split(',').map((skill) => skill.trim()).filter(Boolean),
      location: location.trim() || null,
      work_arrangement: workArrangement.trim() || null,
      application_deadline: applicationDeadline.trim() || null,
    });
    setSaving(false);

    if (error) {
      Alert.alert('Unable to post opportunity', error.message);
      return;
    }

    setTitle('');
    setDescription('');
    setOpportunityType('');
    setSkillsRequired('');
    setLocation('');
    setWorkArrangement('');
    setApplicationDeadline('');
    await loadOpportunities();
    Alert.alert('Submitted for approval', 'Your opportunity is pending administrator approval.');
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

  if (loading) return <LoadingState message="Loading business dashboard..." />;
  if (errorMessage) return <ErrorState message={errorMessage} />;

  const statusCounts = ['pending', 'open', 'rejected', 'closed', 'filled'].map((status) => ({
    label: status,
    count: opportunities.filter((opportunity) => opportunity.status === status).length,
  }));

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Business Dashboard" subtitle="Post and track your opportunities" />

      <Card style={styles.profileCard}>
        <Text style={styles.sectionTitle}>Company profile</Text>
        {businessProfile?.business_name ? <Text style={styles.cardTitle}>{businessProfile.business_name}</Text> : null}
        {businessProfile?.location ? <Text style={styles.body}>Address: {businessProfile.location}</Text> : null}
        {businessProfile?.business_phone ? <Text style={styles.body}>Phone: {businessProfile.business_phone}</Text> : null}
        {businessProfile?.business_website ? <Text style={styles.body}>Website: {businessProfile.business_website}</Text> : null}
        {businessProfile?.industry_category ? <Text style={styles.body}>Industry: {businessProfile.industry_category}</Text> : null}
        {businessProfile?.contact_person_name ? <Text style={styles.body}>Contact: {businessProfile.contact_person_name}</Text> : null}
        <Badge tone={businessProfile?.verification_status === 'verified' ? 'success' : businessProfile?.verification_status === 'rejected' ? 'danger' : 'warning'}>
          {businessProfile?.verification_status === 'verified'
            ? 'Verified'
            : businessProfile?.verification_status === 'rejected'
              ? 'Rejected'
              : 'Pending'}
        </Badge>
      </Card>

      <Card style={styles.statsCard}>
        <Text style={styles.statsLabel}>Opportunity status</Text>
        <View style={styles.statRow}>
          {statusCounts.map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Badge tone={stat.label === 'open' ? 'success' : stat.label === 'rejected' ? 'danger' : 'primary'}>
                {stat.count}
              </Badge>
              <Text style={styles.statText}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Link href="/(business)/applications" asChild>
        <PrimaryButton style={styles.applicationsButton}>Review applicants</PrimaryButton>
      </Link>

      <Text style={styles.sectionTitle}>Your opportunities</Text>
      {opportunities.length === 0 ? (
        <EmptyState title="No opportunities yet" message="Create your first opportunity below." />
      ) : (
        opportunities.map((opportunity) => (
          <Card key={opportunity.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{opportunity.title}</Text>
              <Badge tone={statusTone[opportunity.status as keyof typeof statusTone] ?? 'neutral'}>
                {opportunity.status}
              </Badge>
            </View>
            {opportunity.opportunity_type ? <Text style={styles.body}>{opportunity.opportunity_type}</Text> : null}
            {opportunity.location ? <Text style={styles.body}>{opportunity.location}</Text> : null}
          </Card>
        ))
      )}

      <Text style={styles.sectionTitle}>Post an opportunity</Text>
      <Card style={styles.formCard}>
        <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput style={styles.input} placeholder="Opportunity type" value={opportunityType} onChangeText={setOpportunityType} />
        <TextInput
          style={styles.input}
          placeholder="Skills required (comma separated)"
          value={skillsRequired}
          onChangeText={setSkillsRequired}
        />
        <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />
        <TextInput
          style={styles.input}
          placeholder="Work arrangement"
          value={workArrangement}
          onChangeText={setWorkArrangement}
        />
        <TextInput
          style={styles.input}
          placeholder="Application deadline (YYYY-MM-DD)"
          value={applicationDeadline}
          onChangeText={setApplicationDeadline}
        />
        <PrimaryButton onPress={() => void createOpportunity()} disabled={saving}>
          {saving ? 'Submitting...' : 'Submit for approval'}
        </PrimaryButton>
      </Card>
      <PrimaryButton onPress={() => void handleLogout()} disabled={loggingOut} style={styles.logoutButton}>
        {loggingOut ? 'Logging out...' : 'Log out'}
      </PrimaryButton>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: RelinkColors.text, ...Typography.heading, marginTop: Spacing.lg, marginBottom: Spacing.md },
  card: { gap: Spacing.sm, marginBottom: Spacing.md },
  formCard: { gap: Spacing.md, marginBottom: Spacing.xxl },
  profileCard: { gap: Spacing.sm, marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  cardTitle: { flex: 1, color: RelinkColors.text, ...Typography.bodyStrong },
  body: { color: RelinkColors.muted, ...Typography.body },
  statsCard: { gap: Spacing.md, marginBottom: Spacing.md },
  applicationsButton: { marginBottom: Spacing.md },
  statsLabel: { color: RelinkColors.muted, ...Typography.label },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statItem: { minWidth: 58, alignItems: 'center', gap: Spacing.xs },
  statText: { color: RelinkColors.muted, ...Typography.caption, textTransform: 'capitalize' },
  input: {
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: RelinkColors.border,
    backgroundColor: RelinkColors.surface,
    color: RelinkColors.text,
    ...Typography.body,
  },
  multiline: { minHeight: 96, paddingTop: Spacing.md, textAlignVertical: 'top' },
  logoutButton: { marginTop: Spacing.xl },
});
