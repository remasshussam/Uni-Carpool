import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const memoryStorage: SupportedStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => undefined,
  removeItem: async (_key: string) => undefined,
};

const authStorage: SupportedStorage =
  Platform.OS === 'web' ? memoryStorage : AsyncStorage;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  '';

export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseKey.length > 0;

export const SUPABASE_UNCONFIGURED = 'supabase_unconfigured';

export const SUPABASE_CONFIG_ERROR =
  'This action waits until Supabase is connected in the next phase.';

export const supabase = createClient(supabaseUrl || 'https://example.supabase.co', supabaseKey || 'public-anon-key', {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (isSupabaseConfigured) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
