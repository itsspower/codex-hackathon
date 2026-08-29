import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const isBrowser = typeof window !== 'undefined';

// A no-op storage used when we're not in a real browser (e.g. Node SSR/static render)
const noopStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
};

const webStorage = {
  getItem: async (key: string) => window.localStorage.getItem(key),
  setItem: async (key: string, value: string) => window.localStorage.setItem(key, value),
  removeItem: async (key: string) => window.localStorage.removeItem(key),
};

const storage =
  Platform.OS === 'web'
    ? (isBrowser ? webStorage : noopStorage)
    : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: isBrowser || Platform.OS !== 'web',
    persistSession: isBrowser || Platform.OS !== 'web',
    detectSessionInUrl: false,
  },
});