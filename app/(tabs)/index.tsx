import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PrimaryButton,
  ScreenContainer,
  ScreenHeader,
  SectionHeader,
} from '@/components/relink-ui';
import { RelinkColors, Radius, Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { profileCompletionScore } from '@/lib/studentProfile';

type StudentProfile = {
  name: string | null;
  surname: string | null;
  campus: string | null;
  course: string | null;
  interests: string[] | null;
  interests_other: string | null;
};

type MatchedOpportunity = {
  opportunity_id: string;
  title: string;
  match_count: number;
  matched_tags: string[] | null;
};

type DashboardData = {
  profile: StudentProfile;
  matches: MatchedOpportunity[];
};

export default function HomeScreen() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      setErrorMessage(userError?.message ?? 'Your session could not be loaded.');
      return;
    }

    const [{ data: profile, error: profileError }, { data: matches, error: matchesError }] =
      await Promise.all([
        supabase
          .from('student_profiles')
          .select('name, surname, campus, course, interests, interests_other')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.rpc('match_opportunities_for_student', { p_student_id: user.id }),
      ]);

    if (profileError) {
      setLoading(false);
      setErrorMessage(profileError.message);
      return;
    }

    if (matchesError) {
      setLoading(false);
      setErrorMessage(matchesError.message);
      return;
    }

    setDashboard({
      profile: profile ?? {
        name: null,
        surname: null,
        campus: null,
        course: null,
        interests: [],
        interests_other: null,
      },
      matches: ((matches ?? []) as MatchedOpportunity[]).slice(0, 3),
    });
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard])
  );

  if (loading && !dashboard) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  if (errorMessage && !dashboard) {
    return <ErrorState message={errorMessage} />;
  }

  if (!dashboard) {
    return <EmptyState title="Your dashboard is empty" message="Complete your profile to get started." />;
  }

  const { profile, matches } = dashboard;
  const firstName = profile.name?.trim() || 'there';
  const avatarLabel = profile.name?.trim() || profile.surname?.trim();
  const profileCompletion = profileCompletionScore(profile);

  return (
    <ScreenContainer scroll>
      <ScreenHeader
        title="Home"
        subtitle="Your career journey"
        right={<Avatar label={avatarLabel} size={44} />}
      />

      <View style={styles.greeting}>
        <Text style={styles.eyebrow}>RELINK</Text>
        <Text style={styles.title}>Hi, {firstName}</Text>
        <Text style={styles.subtitle}>Find your next career move with opportunities matched to your interests.</Text>
      </View>

      <Card style={styles.completionCard}>
        <SectionHeader
          title="Profile completion"
          action={<Badge tone={profileCompletion === 100 ? 'success' : 'primary'}>{profileCompletion}%</Badge>}
        />
        <View style={styles.progressTrack}>
          <View style={[styles.progressValue, { width: `${profileCompletion}%` }]} />
        </View>
        <Text style={styles.cardText}>
          {profileCompletion === 100
            ? 'Your profile has the information needed for matching.'
            : 'Add the missing profile details to improve your opportunity matches.'}
        </Text>
        {profileCompletion < 100 ? (
          <Link href="/(tabs)/profile-setup" asChild>
            <PrimaryButton>Complete profile</PrimaryButton>
          </Link>
        ) : null}
      </Card>

      <Card style={styles.assistantCard}>
        <SectionHeader title="Relink AI Assistant" />
        <Text style={styles.cardText}>
          Ask for career guidance, preparation help, or ideas for your next step.
        </Text>
        <Link href="/(tabs)/chatbot" asChild>
          <PrimaryButton>Open Relink AI</PrimaryButton>
        </Link>
      </Card>

      <View style={styles.section}>
        <SectionHeader
          title="Recommended for you"
          action={
            <Link href="/(tabs)/opportunities" asChild>
              <Pressable>
                <Text style={styles.sectionAction}>View all</Text>
              </Pressable>
            </Link>
          }
        />
        {matches.length > 0 ? (
          matches.map((match) => (
            <Link key={match.opportunity_id} href={`/opportunities/${match.opportunity_id}` as any} asChild>
              <Pressable>
                <Card style={styles.opportunityCard}>
                  <View style={styles.opportunityHeading}>
                    <Text style={styles.opportunityTitle} numberOfLines={2}>{match.title}</Text>
                    <Badge tone={match.match_count > 0 ? 'success' : 'neutral'}>
                      {match.match_count} matching {match.match_count === 1 ? 'skill' : 'skills'}
                    </Badge>
                  </View>
                  {match.matched_tags && match.matched_tags.length > 0 ? (
                    <Text style={styles.matchText} numberOfLines={2}>
                      Matched: {match.matched_tags.join(', ')}
                    </Text>
                  ) : (
                    <Text style={styles.matchText}>Open opportunity from the latest matching results.</Text>
                  )}
                </Card>
              </Pressable>
            </Link>
          ))
        ) : (
          <Card>
            <EmptyState
              title="No matching opportunities yet"
              message="Add more interests to your profile or browse all open opportunities."
            />
          </Card>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greeting: { marginBottom: Spacing.xl },
  eyebrow: { color: RelinkColors.primary, ...Typography.label, letterSpacing: 1.5 },
  title: { color: RelinkColors.text, ...Typography.display, marginTop: Spacing.sm },
  subtitle: { color: RelinkColors.muted, ...Typography.body, marginTop: Spacing.sm },
  completionCard: { marginBottom: Spacing.lg },
  assistantCard: { marginBottom: Spacing.xl },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: Radius.pill,
    backgroundColor: RelinkColors.surfaceElevated,
    marginBottom: Spacing.md,
  },
  progressValue: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: RelinkColors.primary,
  },
  cardText: { color: RelinkColors.muted, ...Typography.body, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  sectionAction: { color: RelinkColors.primary, ...Typography.label },
  opportunityCard: { marginBottom: Spacing.md },
  opportunityHeading: { gap: Spacing.sm },
  opportunityTitle: { color: RelinkColors.text, ...Typography.bodyStrong },
  matchText: { color: RelinkColors.muted, ...Typography.caption, marginTop: Spacing.md },
});
