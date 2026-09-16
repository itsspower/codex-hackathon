import { supabase } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton } from '@/components/relink-ui';
import { RelinkColors, Spacing, Typography } from '@/constants/theme';

type OpportunityDetail = {
  id: string;
  title: string;
  description: string | null;
  opportunity_type: string | null;
  industry: string | null;
  experience_level: string | null;
  location: string | null;
  work_arrangement: string | null;
  company_organisation: string | null;
  skills_required: string[] | null;
  application_deadline: string | null;
  application_instructions: string | null;
};

export default function OpportunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setErrorMsg(error.message);
      } else {
        setOpportunity(data);
      }
      setLoading(false);
    }

    if (id) fetchDetail();
  }, [id]);

  useEffect(() => {
    async function fetchApplication() {
      if (!id) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('applications')
        .select('status')
        .eq('student_id', user.id)
        .eq('opportunity_id', id)
        .maybeSingle();

      if (data) setApplicationStatus(data.status);
    }

    void fetchApplication();
  }, [id]);

  async function applyToOpportunity() {
    if (!id || applicationStatus || applying) return;
    setApplying(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setApplying(false);
      Alert.alert('Unable to apply', userError?.message ?? 'Please log in again.');
      return;
    }

    const { data: existingApplication, error: existingError } = await supabase
      .from('applications')
      .select('status')
      .eq('student_id', user.id)
      .eq('opportunity_id', id)
      .maybeSingle();

    if (existingError) {
      setApplying(false);
      Alert.alert('Unable to apply', existingError.message);
      return;
    }

    if (existingApplication) {
      setApplying(false);
      setApplicationStatus(existingApplication.status);
      return;
    }

    const { data, error } = await supabase
      .from('applications')
      .insert({ student_id: user.id, opportunity_id: id })
      .select('id, status')
      .single();

    setApplying(false);
    if (error) {
      Alert.alert(
        error.code === '23505'
          ? "You've already applied to this opportunity."
          : 'Application failed',
        error.code === '23505' ? undefined : error.message
      );
      return;
    }

    const { error: warmWelcomeError } = await supabase.rpc('process_warm_welcome', {
      application_id: data.id,
    });

    if (warmWelcomeError) {
      console.warn('Warm Welcome processing failed:', warmWelcomeError);
    }

    setApplicationStatus(data.status);
    Alert.alert('Application submitted', 'Your application was submitted successfully.');
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1F3F7A" />
      </View>
    );
  }

  if (errorMsg || !opportunity) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Couldn&apos;t load this opportunity{errorMsg ? `: ${errorMsg}` : '.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>{opportunity.title}</Text>
      {opportunity.company_organisation ? (
        <Text style={styles.company}>{opportunity.company_organisation}</Text>
      ) : null}

      <View style={styles.tagRow}>
        {opportunity.opportunity_type ? <Text style={styles.tag}>{opportunity.opportunity_type}</Text> : null}
        {opportunity.location ? <Text style={styles.tag}>{opportunity.location}</Text> : null}
        {opportunity.work_arrangement ? <Text style={styles.tag}>{opportunity.work_arrangement}</Text> : null}
        {opportunity.experience_level ? <Text style={styles.tag}>{opportunity.experience_level}</Text> : null}
      </View>

      {opportunity.description ? (
        <>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.body}>{opportunity.description}</Text>
        </>
      ) : null}

      {opportunity.skills_required && opportunity.skills_required.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Skills Required</Text>
          <View style={styles.tagRow}>
            {opportunity.skills_required.map((skill) => (
              <Text key={skill} style={styles.skillTag}>{skill}</Text>
            ))}
          </View>
        </>
      ) : null}

      {opportunity.application_deadline ? (
        <>
          <Text style={styles.sectionTitle}>Application Deadline</Text>
          <Text style={styles.body}>{opportunity.application_deadline}</Text>
        </>
      ) : null}

      {opportunity.application_instructions ? (
        <>
          <Text style={styles.sectionTitle}>How to Apply</Text>
          <Text style={styles.body}>{opportunity.application_instructions}</Text>
        </>
      ) : null}

      <Card style={styles.applicationCard}>
        {applicationStatus ? (
          <Text style={styles.applicationStatus}>Application status: {applicationStatus}</Text>
        ) : (
          <PrimaryButton onPress={() => void applyToOpportunity()} disabled={applying}>
            {applying ? 'Submitting...' : 'Apply to opportunity'}
          </PrimaryButton>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#B00020', textAlign: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#1F3F7A' },
  company: { fontSize: 15, color: '#555', marginTop: 4 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  tag: {
    fontSize: 12, color: '#1F3F7A', backgroundColor: '#EAF0FB',
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, overflow: 'hidden',
  },
  skillTag: {
    fontSize: 12, color: '#fff', backgroundColor: '#1F3F7A',
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, overflow: 'hidden',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 6, color: '#333' },
  body: { fontSize: 14, color: '#444', lineHeight: 20 },
  applicationCard: { marginTop: Spacing.xl, marginBottom: Spacing.xl },
  applicationStatus: { color: RelinkColors.primary, ...Typography.bodyStrong },
});
