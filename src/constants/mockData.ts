import { Demand, AppSettings } from '../types';

const hasEnvSupabase = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

export const INITIAL_SETTINGS: AppSettings = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  isSupabaseConfigured: hasEnvSupabase,
  offlineMode: !hasEnvSupabase,
  municipioNome: 'Prefeitura Municipal de Touros',
  secretariaNome: 'Secretaria Municipal de Educação e Cultura',
  estadoNome: 'Rio Grande do Norte',
  versao: '1.2.0',
  anoExercicio: 2026,
  logoPrefeituraUrl: '',
  logoSmecUrl: '',
};

export const INITIAL_DEMANDS: Demand[] = [];
