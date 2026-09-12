import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card, PrimaryButton, ScreenContainer, ScreenHeader } from '@/components/relink-ui';
import { RelinkColors, Spacing, Typography } from '@/constants/theme';

export default function ProfileTab() {
  return (
    <ScreenContainer>
      <ScreenHeader title="Profile" subtitle="Manage your student profile" />
      <Card>
        <Text style={styles.title}>Profile foundation</Text>
        <Text style={styles.body}>
          Profile presentation and completion indicators will be added in a later phase.
        </Text>
        <Link href="/(tabs)/profile-setup" asChild>
          <PrimaryButton>Open profile setup</PrimaryButton>
        </Link>
        <Link href="/(tabs)/applications" asChild>
          <PrimaryButton style={styles.secondaryButton}>View applications</PrimaryButton>
        </Link>
        <Link href="/(tabs)/mentorship" asChild>
          <PrimaryButton style={styles.secondaryButton}>View mentorship requests</PrimaryButton>
        </Link>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: RelinkColors.text, ...Typography.heading, marginBottom: Spacing.sm },
  body: { color: RelinkColors.muted, ...Typography.body, marginBottom: Spacing.lg },
  secondaryButton: { marginTop: Spacing.md },
});
