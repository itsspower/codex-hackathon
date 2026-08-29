import { supabase } from '@/lib/supabase';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

type Opportunity = {
  id: string;
  title: string;
  description: string | null;
  opportunity_type: string | null;
  industry: string | null;
  location: string | null;
  company_organisation: string | null;
  skills_required: string[] | null;
  application_deadline: string | null;
};

export default function OpportunitiesScreen() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function fetchOpportunities() {
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, title, description, opportunity_type, industry, location, company_organisation, skills_required, application_deadline')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg(null);
      setOpportunities(data ?? []);
    }
  }

  useEffect(() => {
    fetchOpportunities().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOpportunities();
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1F3F7A" />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Couldn't load opportunities: {errorMsg}</Text>
      </View>
    );
  }

  if (opportunities.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No open opportunities yet.</Text>
        <Text style={styles.emptySubtext}>Check back soon, or pull down to refresh.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={opportunities}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <Link href={`/opportunities/${item.id}` as any} asChild>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.company_organisation ? (
              <Text style={styles.cardSubtitle}>{item.company_organisation}</Text>
            ) : null}
            <View style={styles.tagRow}>
              {item.opportunity_type ? <Text style={styles.tag}>{item.opportunity_type}</Text> : null}
              {item.location ? <Text style={styles.tag}>{item.location}</Text> : null}
            </View>
            {item.description ? (
              <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
            ) : null}
            {item.skills_required && item.skills_required.length > 0 ? (
              <Text style={styles.skillsText}>
                Skills: {item.skills_required.slice(0, 3).join(', ')}
                {item.skills_required.length > 3 ? '...' : ''}
              </Text>
            ) : null}
          </View>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#B00020', textAlign: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#777' },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1F3F7A' },
  cardSubtitle: { fontSize: 14, color: '#555', marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  tag: {
    fontSize: 12,
    color: '#1F3F7A',
    backgroundColor: '#EAF0FB',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardDescription: { fontSize: 14, color: '#444', marginTop: 10, lineHeight: 20 },
  skillsText: { fontSize: 12, color: '#777', marginTop: 8, fontStyle: 'italic' },
});