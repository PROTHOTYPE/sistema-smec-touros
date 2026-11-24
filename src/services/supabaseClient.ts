import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppSettings } from '../types';

export const ENV_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
export const ENV_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

/**
 * Inicializa e retorna o cliente oficial do Supabase lendo prioritariamente
 * de EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY, ou das configurações
 * institucionais salvas pelo Super Admin TI.
 */
export const getSupabaseClient = (settings?: AppSettings): SupabaseClient | null => {
  const url = (settings?.supabaseUrl || ENV_SUPABASE_URL).trim();
  const key = (settings?.supabaseAnonKey || ENV_SUPABASE_ANON_KEY).trim();

  if (!url || !key) {
    return null;
  }

  const configKey = `${url}_${key}`;
  if (supabaseInstance && currentConfigKey === configKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, key, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    currentConfigKey = configKey;
    return supabaseInstance;
  } catch (error) {
    console.warn('Erro ao inicializar cliente Supabase:', error);
    return null;
  }
};

export const supabaseClient = getSupabaseClient();

