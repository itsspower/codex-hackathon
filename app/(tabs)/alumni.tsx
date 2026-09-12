import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenContainer,
  ScreenHeader,
  SearchInput,
} from '@/components/relink-ui';
import { RelinkColors, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type AlumniProfile = {
  user_id: string;
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
  verification_status: string | null;
};

export default function AlumniTab() {
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAlumni = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    const { data, error } = await supabase
      .from('alumni_profiles')
      .select('user_id, first_name, last_name, graduation_year, qualification, current_job_title, current_company, industry, skills_interests, years_experience, bio, verification_status')
      .order('last_name', { ascending: true });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setAlumni((data ?? []) as AlumniProfile[]);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAlumni();
    }, [loadAlumni])
  );

  const filteredAlumni = alumni.filter((person) => {
    const searchable = [
      person.first_name,
      person.last_name,
      person.current_job_title,
      person.current_company,
      person.industry,
      ...(person.skills_interests ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return searchable.includes(query.trim().toLowerCase());
  });

  if (loading && alumni.length === 0) return <LoadingState message="Loading alumni..." />;
  if (errorMessage && alumni.length === 0) return <ErrorState message={errorMessage} />;

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Alumni" subtitle="Connect with the Relink community" />
      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search alumni"
        style={styles.search}
      />
      {filteredAlumni.length === 0 ? (
        <EmptyState
          title={alumni.length === 0 ? 'No alumni profiles yet' : 'No alumni found'}
          message={alumni.length === 0 ? 'Verified alumni profiles will appear here.' : 'Try a different search.'}
        />
      ) : (
        filteredAlumni.map((person) => {
          const name = [person.first_name, person.last_name].filter(Boolean).join(' ') || 'Alumni profile';
          return (
            <Link key={person.user_id} href={`/alumni/${person.user_id}` as any} asChild>
              <Pressable>
                <Card style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Avatar label={name} />
                    <View style={styles.cardHeading}>
                      <Text style={styles.name}>{name}</Text>
                      {person.current_job_title ? (
                        <Text style={styles.muted}>{person.current_job_title}</Text>
                      ) : null}
                      {person.current_company ? (
                        <Text style={styles.muted}>{person.current_company}</Text>
                      ) : null}
                    </View>
                  </View>
                  {person.industry ? <Text style={styles.industry}>{person.industry}</Text> : null}
                  {person.skills_interests?.length ? (
                    <Text style={styles.muted} numberOfLines={2}>
                      {person.skills_interests.join(', ')}
                    </Text>
                  ) : null}
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
  search: { marginBottom: Spacing.lg },
  card: { marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardHeading: { flex: 1 },
  name: { color: RelinkColors.text, ...Typography.bodyStrong },
  muted: { color: RelinkColors.muted, ...Typography.caption, marginTop: 2 },
  industry: { color: RelinkColors.primary, ...Typography.caption, marginTop: Spacing.md },
});
