import { Href, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, ScreenContainer, SecondaryButton } from '@/components/relink-ui';
import { RelinkColors, Spacing, Typography } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <ScreenContainer scroll style={styles.container}>
      <Text style={styles.logo}>RELINK</Text>
      <Text style={styles.title}>Find Your Next Career Move</Text>
      <Text style={styles.subtitle}>
        An AI-powered networking and career platform to help you discover, connect, and grow.
      </Text>

      <View style={styles.features}>
        <Card style={styles.featureCard}>
          <Text style={styles.featureTitle}>AI Career Assistant</Text>
          <Text style={styles.featureText}>Get guidance as you explore your next opportunity.</Text>
        </Card>
        <Card style={styles.featureCard}>
          <Text style={styles.featureTitle}>Application Tracking</Text>
          <Text style={styles.featureText}>Keep your career applications organised in one place.</Text>
        </Card>
        <Card style={styles.featureCard}>
          <Text style={styles.featureTitle}>Rich Profiles &amp; Feed</Text>
          <Text style={styles.featureText}>Build your profile and connect with the Relink community.</Text>
        </Card>
      </View>

      <PrimaryButton onPress={() => router.push('/(onboarding)/skills' as Href)} style={styles.button}>
        Get Started
      </PrimaryButton>
      <SecondaryButton onPress={() => router.push('/(auth)/login')} style={styles.button}>
        Login
      </SecondaryButton>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  logo: { color: RelinkColors.primary, ...Typography.label, letterSpacing: 2, textAlign: 'center' },
  title: { color: RelinkColors.text, ...Typography.display, textAlign: 'center', marginTop: Spacing.lg },
  subtitle: { color: RelinkColors.muted, ...Typography.body, textAlign: 'center', marginTop: Spacing.md },
  features: { gap: Spacing.md, marginTop: Spacing.xxl },
  featureCard: { padding: Spacing.lg },
  featureTitle: { color: RelinkColors.text, ...Typography.heading },
  featureText: { color: RelinkColors.muted, ...Typography.body, marginTop: Spacing.xs },
  button: { marginTop: Spacing.md },
});
