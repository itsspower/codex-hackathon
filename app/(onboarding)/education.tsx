import { Href, router } from 'expo-router';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton, ScreenContainer, ScreenHeader } from '@/components/relink-ui';
import { Radius, RelinkColors, Spacing, Typography } from '@/constants/theme';
import { useOnboarding } from './_layout';

export default function EducationOnboardingScreen() {
  const { profile, setProfile, loading } = useOnboarding();

  if (loading) return null;

  function continueToFinal() {
    if (!profile.name.trim() || !profile.surname.trim() || !profile.campus.trim() || !profile.course.trim()) {
      Alert.alert('Complete your education details', 'Please provide your name, surname, campus, and course.');
      return;
    }
    router.push('/(onboarding)/final' as Href);
  }

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Step 2 of 3" subtitle="Tell us about your education" onBack={() => router.back()} />
      <Text style={styles.title}>Where are you studying?</Text>
      <Text style={styles.subtitle}>Use the details already supported by your Relink student profile.</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="First name" placeholderTextColor={RelinkColors.muted} value={profile.name} onChangeText={(name) => setProfile({ name })} />
        <TextInput style={styles.input} placeholder="Surname" placeholderTextColor={RelinkColors.muted} value={profile.surname} onChangeText={(surname) => setProfile({ surname })} />
        <TextInput style={styles.input} placeholder="Campus" placeholderTextColor={RelinkColors.muted} value={profile.campus} onChangeText={(campus) => setProfile({ campus })} />
        <TextInput style={styles.input} placeholder="Course" placeholderTextColor={RelinkColors.muted} value={profile.course} onChangeText={(course) => setProfile({ course })} />
      </View>
      <PrimaryButton onPress={continueToFinal}>Next: Finish profile</PrimaryButton>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: RelinkColors.text, ...Typography.title },
  subtitle: { color: RelinkColors.muted, ...Typography.body, marginTop: Spacing.sm },
  form: { gap: Spacing.md, marginVertical: Spacing.xxl },
  input: {
    minHeight: 50,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: RelinkColors.border,
    backgroundColor: RelinkColors.surface,
    color: RelinkColors.text,
    ...Typography.body,
  },
});
