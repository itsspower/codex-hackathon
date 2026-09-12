import { Href, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, ScreenHeader, SearchInput, SecondaryButton, SkillChip } from '@/components/relink-ui';
import { RelinkColors, Spacing, Typography } from '@/constants/theme';
import { SKILL_TAGS } from '@/constants/skills';
import { useOnboarding } from './_layout';

export default function SkillsOnboardingScreen() {
  const { profile, setProfile, loading } = useOnboarding();
  const [query, setQuery] = useState('');

  const filteredSkills = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return SKILL_TAGS.filter((skill) => skill.toLowerCase().includes(normalized));
  }, [query]);

  function toggleSkill(skill: string) {
    setProfile({
      interests: profile.interests.includes(skill)
        ? profile.interests.filter((selected) => selected !== skill)
        : [...profile.interests, skill],
    });
  }

  if (loading) return null;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Step 1 of 3"
        subtitle="Build your Relink profile"
        onBack={() => router.replace('/(entry)/welcome' as Href)}
      />
      <FlatList
        data={filteredSkills}
        keyExtractor={(skill) => skill}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>What are your skills?</Text>
            <Text style={styles.subtitle}>Choose the skills you want to use for opportunity matching.</Text>
            <SearchInput value={query} onChangeText={setQuery} placeholder="Search skills" />
            <Text style={styles.sectionTitle}>Selected skills</Text>
            <Card style={styles.selectedCard}>
              {profile.interests.length > 0 ? (
                <View style={styles.chipWrap}>
                  {profile.interests.map((skill) => (
                    <SkillChip key={skill} selected onPress={() => toggleSkill(skill)}>{skill}</SkillChip>
                  ))}
                </View>
              ) : (
                <Text style={styles.muted}>No skills selected yet.</Text>
              )}
            </Card>
            <Text style={styles.sectionTitle}>Suggested skills</Text>
          </>
        }
        renderItem={({ item }) => (
          <SkillChip selected={profile.interests.includes(item)} onPress={() => toggleSkill(item)}>
            {item}
          </SkillChip>
        )}
        columnWrapperStyle={styles.chipRow}
        numColumns={2}
        ListFooterComponent={
          <View style={styles.footer}>
            <PrimaryButton onPress={() => router.push('/(onboarding)/education' as Href)}>Next: Education</PrimaryButton>
            <SecondaryButton onPress={() => router.push('/(onboarding)/education' as Href)}>
              Skip for now
            </SecondaryButton>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: RelinkColors.background, paddingHorizontal: Spacing.screen },
  content: { paddingBottom: Spacing.xxl, gap: Spacing.md },
  title: { color: RelinkColors.text, ...Typography.title },
  subtitle: { color: RelinkColors.muted, ...Typography.body },
  sectionTitle: { color: RelinkColors.text, ...Typography.heading, marginTop: Spacing.md },
  selectedCard: { minHeight: 68, justifyContent: 'center' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chipRow: { gap: Spacing.sm },
  muted: { color: RelinkColors.muted, ...Typography.body },
  footer: { gap: Spacing.md, marginTop: Spacing.xl },
});
