import { router } from 'expo-router';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';

import { PrimaryButton, ScreenContainer, ScreenHeader } from '@/components/relink-ui';
import { Radius, RelinkColors, Spacing, Typography } from '@/constants/theme';
import { useOnboarding } from './_layout';

export default function FinalOnboardingScreen() {
  const { profile, setProfile, saving, loading, saveProfile } = useOnboarding();

  if (loading) return null;

  async function finishOnboarding() {
    const error = await saveProfile();
    if (error) {
      if (error === 'Please log in or register before finishing your profile.') {
        Alert.alert('Sign in to finish', error, [
          { text: 'Login', onPress: () => router.replace('/(auth)/login') },
          { text: 'Register', onPress: () => router.replace('/(auth)/register') },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Could not save profile', error);
      }
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Step 3 of 3" subtitle="Finish your profile" onBack={() => router.back()} />
      <Text style={styles.title}>Anything else to add?</Text>
      <Text style={styles.subtitle}>
        Add an optional skill or interest. Your selected skills and education details are ready to save.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Other skill or interest (optional)"
        placeholderTextColor={RelinkColors.muted}
        value={profile.interestsOther}
        onChangeText={(interestsOther) => setProfile({ interestsOther })}
        multiline
      />
      <PrimaryButton onPress={finishOnboarding} disabled={saving}>
        {saving ? 'Saving...' : 'Finish and continue'}
      </PrimaryButton>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: RelinkColors.text, ...Typography.title },
  subtitle: { color: RelinkColors.muted, ...Typography.body, marginTop: Spacing.sm, marginBottom: Spacing.xxl },
  input: {
    minHeight: 110,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: RelinkColors.border,
    backgroundColor: RelinkColors.surface,
    color: RelinkColors.text,
    textAlignVertical: 'top',
    ...Typography.body,
  },
});
