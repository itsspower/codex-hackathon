/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#F7F9FC',
    background: '#081426',
    surface: '#10233D',
    surfaceElevated: '#163253',
    border: '#244365',
    muted: '#91A1B6',
    tint: '#F28C28',
    primary: '#F28C28',
    primaryPressed: '#D9771B',
    icon: '#91A1B6',
    tabIconDefault: '#91A1B6',
    tabIconSelected: '#F28C28',
    success: '#43C78A',
    warning: '#F5C451',
    danger: '#F26B6B',
  },
  dark: {
    text: '#F7F9FC',
    background: '#081426',
    surface: '#10233D',
    surfaceElevated: '#163253',
    border: '#244365',
    muted: '#91A1B6',
    tint: '#F28C28',
    primary: '#F28C28',
    primaryPressed: '#D9771B',
    icon: '#91A1B6',
    tabIconDefault: '#91A1B6',
    tabIconSelected: '#F28C28',
    success: '#43C78A',
    warning: '#F5C451',
    danger: '#F26B6B',
  },
};

export const RelinkColors = Colors.dark;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screen: 20,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const Typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  button: { fontSize: 15, lineHeight: 20, fontWeight: '700' as const },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
