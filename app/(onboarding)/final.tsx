import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';

import { PrimaryButton, SecondaryButton, ScreenContainer, ScreenHeader } from '@/components/relink-ui';
import { Radius, RelinkColors, Spacing, Typography } from '@/constants/theme';
import { CV_MIME_TYPES, StudentCvAsset } from '@/lib/studentProfile';
import { useOnboarding } from './_layout';

export default function FinalOnboardingScreen() {
  const { profile, setProfile, setPendingCvAsset, saving, loading, saveProfile } = useOnboarding();

  if (loading) return null;

  async function selectCv() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [...CV_MIME_TYPES],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset: StudentCvAsset = result.assets[0];
    setPendingCvAsset(asset);
    setProfile({ cvFileName: asset.name });
  }

  async function finishOnboarding() {
    const error = await saveProfile();
    if (error) {
      Alert.alert('Could not save profile', error);
      return;
    }
    router.replace({ pathname: '/(tabs)', params: { onboardingComplete: '1' } });
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
      <TextInput
        style={styles.input}
        placeholder="Qualifications (optional)"
        placeholderTextColor={RelinkColors.muted}
        value={profile.qualifications}
        onChangeText={(qualifications) => setProfile({ qualifications })}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Experience (optional)"
        placeholderTextColor={RelinkColors.muted}
        value={profile.experience}
        onChangeText={(experience) => setProfile({ experience })}
        multiline
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Certifications (optional)"
        placeholderTextColor={RelinkColors.muted}
        value={profile.certifications}
        onChangeText={(certifications) => setProfile({ certifications })}
        multiline
      />
      <Text style={styles.cvStatus}>
        {profile.cvFileName ? `CV selected: ${profile.cvFileName}` : 'No CV selected yet.'}
      </Text>
      <SecondaryButton onPress={() => void selectCv()} style={styles.cvButton}>
        {profile.cvFileName ? 'Replace CV' : 'Add CV'}
      </SecondaryButton>
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
    minHeight: 50,
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
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  cvStatus: { color: RelinkColors.muted, ...Typography.body, marginBottom: Spacing.sm },
  cvButton: { marginBottom: Spacing.xl },
});
