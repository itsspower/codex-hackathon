import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RelinkColors, Spacing, Typography } from '@/constants/theme';

export default function RelinkSplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => router.replace('/(entry)/welcome'), 650);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>RELINK</Text>
      <Text style={styles.tagline}>Connect. Grow. Relink.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RelinkColors.background,
  },
  logo: { color: RelinkColors.primary, ...Typography.display, letterSpacing: 3 },
  tagline: { color: RelinkColors.muted, ...Typography.body, marginTop: Spacing.sm },
});
