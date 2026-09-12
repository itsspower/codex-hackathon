import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, RelinkColors, Spacing, Typography } from '@/constants/theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export function ScreenContainer({
  children,
  scroll = false,
  style,
}: PropsWithChildren<{ scroll?: boolean; style?: StyleProp<ViewStyle> }>) {
  const insets = useSafeAreaInsets();
  const contentStyle = [
    styles.screen,
    { paddingTop: Math.max(insets.top, Spacing.lg), paddingBottom: Math.max(insets.bottom, Spacing.lg) },
    style,
  ];

  if (scroll) {
    return <ScrollView contentContainerStyle={contentStyle}>{children}</ScrollView>;
  }

  return <View style={contentStyle}>{children}</View>;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeading}>
        {onBack ? <IconButton icon="arrow-back" label="Go back" onPress={onBack} /> : null}
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

export function PrimaryButton({
  children,
  onPress,
  disabled = false,
  style,
}: PropsWithChildren<{ onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle> }>) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={styles.primaryButtonText}>{children}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  children,
  onPress,
  disabled = false,
  style,
}: PropsWithChildren<{ onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle> }>) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={styles.secondaryButtonText}>{children}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  style,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, style]}
    >
      <MaterialIcons name={icon} size={22} color={RelinkColors.text} />
    </Pressable>
  );
}

export function SearchInput({
  style,
  ...props
}: Omit<TextInputProps, 'style'> & { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.searchContainer, style]}>
      <MaterialIcons name="search" size={21} color={RelinkColors.muted} />
      <TextInput
        {...props}
        placeholderTextColor={RelinkColors.muted}
        style={styles.searchInput}
      />
    </View>
  );
}

export function SkillChip({
  children,
  selected = false,
  onPress,
}: PropsWithChildren<{ selected?: boolean; onPress?: () => void }>) {
  const content = <Text style={[styles.chipText, selected && styles.selectedChipText]}>{children}</Text>;
  return onPress ? (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.selectedChip]}>
      {content}
    </Pressable>
  ) : (
    <View style={[styles.chip, selected && styles.selectedChip]}>{content}</View>
  );
}

export function Badge({
  children,
  tone = 'primary',
}: PropsWithChildren<{ tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' }>) {
  return (
    <View style={[styles.badge, styles[`badge_${tone}`]]}>
      <Text style={[styles.badgeText, tone === 'neutral' && styles.neutralBadgeText]}>{children}</Text>
    </View>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function Avatar({ label, size = 48 }: { label?: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{label?.slice(0, 1).toUpperCase() ?? '?'}</Text>
    </View>
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={RelinkColors.primary} />
      <Text style={styles.stateText}>{message}</Text>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.state}>
      <Text style={styles.stateTitle}>{title}</Text>
      {message ? <Text style={styles.stateText}>{message}</Text> : null}
    </View>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <View style={styles.state}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.stateText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    backgroundColor: RelinkColors.background,
    paddingHorizontal: Spacing.screen,
  },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerLeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: { color: RelinkColors.text, ...Typography.title },
  headerSubtitle: { color: RelinkColors.muted, ...Typography.caption, marginTop: 2 },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    backgroundColor: RelinkColors.primary,
  },
  primaryButtonText: { color: '#081426', ...Typography.button },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: RelinkColors.border,
    borderRadius: Radius.md,
    backgroundColor: RelinkColors.surface,
  },
  secondaryButtonText: { color: RelinkColors.text, ...Typography.button },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: RelinkColors.surface,
  },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.45 },
  searchContainer: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: RelinkColors.surface,
    borderWidth: 1,
    borderColor: RelinkColors.border,
  },
  searchInput: { flex: 1, color: RelinkColors.text, ...Typography.body },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: RelinkColors.surfaceElevated,
  },
  selectedChip: { backgroundColor: RelinkColors.primary },
  chipText: { color: RelinkColors.text, ...Typography.caption },
  selectedChipText: { color: '#081426', fontWeight: '700' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.pill },
  badge_primary: { backgroundColor: RelinkColors.primary },
  badge_success: { backgroundColor: RelinkColors.success },
  badge_warning: { backgroundColor: RelinkColors.warning },
  badge_danger: { backgroundColor: RelinkColors.danger },
  badge_neutral: { backgroundColor: RelinkColors.surfaceElevated },
  badgeText: { color: '#081426', ...Typography.caption, fontWeight: '700' },
  neutralBadgeText: { color: RelinkColors.text },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: RelinkColors.surface,
    borderWidth: 1,
    borderColor: RelinkColors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: { color: RelinkColors.text, ...Typography.heading },
  avatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: RelinkColors.primary },
  avatarText: { color: '#081426', fontWeight: '700' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  stateTitle: { color: RelinkColors.text, ...Typography.heading, textAlign: 'center' },
  errorTitle: { color: RelinkColors.danger, ...Typography.heading, textAlign: 'center' },
  stateText: { color: RelinkColors.muted, ...Typography.body, textAlign: 'center' },
});
