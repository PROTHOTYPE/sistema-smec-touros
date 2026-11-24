import AsyncStorage from '@react-native-async-storage/async-storage';
import { Demand, AppSettings, Sector } from '../types';
import { INITIAL_DEMANDS, INITIAL_SETTINGS } from '../constants/mockData';
import { SECTORS } from '../constants/sectors';

const KEYS = {
  LEGACY_DEMANDS_V1: '@smec_demands_v1',
  LEGACY_SECTORS_V1: '@smec_custom_sectors_v1',
  LEGACY_SECTORS_V2: '@smec_custom_sectors_v2',
  LEGACY_SECTORS_V3: '@smec_custom_sectors_v3_clean',
  DEMANDS: '@smec_demands_v2_clean',
  SETTINGS: '@smec_settings_v2',
  CUSTOM_SECTORS: '@smec_custom_sectors_v4_15sectors',
};

const LEGACY_AUTH_AND_USER_KEYS = [
  '@smec_users',
  '@smec_users_v1',
  '@smec_users_v2',
  '@smec_users_v3_clean',
  '@smec_users_v4_root',
  '@smec_users_v5_unique',
  '@smec_auth_session',
  '@smec_auth_session_v1',
  '@smec_auth_session_v2',
  '@smec_auth_session_v3_clean',
  '@smec_auth_session_v4_prod',
  '@smec_auth_session_v5_unique',
  '@smec_active_profile',
  '@smec_active_profile_v1',
  '@smec_active_profile_v2',
  '@smec_active_profile_v3_clean',
  '@smec_active_profile_v4_prod',
  '@smec_active_profile_v5_unique',
  '@smec_purge_v5_completed',
];

export const StorageService = {
  /**
   * Remove permanentemente qualquer conta, senha ou sessão legada do armazenamento local.
   * A autenticação e os perfis de usuários residem 100% no Supabase Auth + public.profiles.
   */
  async ensureTestAccountsPurged(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(LEGACY_AUTH_AND_USER_KEYS);
    } catch (error) {
      console.warn('Erro ao limpar chaves legadas do armazenamento local:', error);
    }
  },

  // Demandas
  async getDemands(): Promise<Demand[]> {
    try {
      await AsyncStorage.multiRemove([KEYS.LEGACY_DEMANDS_V1, KEYS.LEGACY_SECTORS_V1]);

      const data = await AsyncStorage.getItem(KEYS.DEMANDS);
      if (data) {
        return JSON.parse(data);
      }
      await AsyncStorage.setItem(KEYS.DEMANDS, JSON.stringify(INITIAL_DEMANDS));
      return INITIAL_DEMANDS;
    } catch (error) {
      console.warn('Erro ao carregar demandas do AsyncStorage:', error);
      return INITIAL_DEMANDS;
    }
  },

  async saveDemands(demands: Demand[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.DEMANDS, JSON.stringify(demands));
    } catch (error) {
      console.error('Erro ao salvar demandas no AsyncStorage:', error);
    }
  },

  async addDemand(demand: Demand): Promise<Demand[]> {
    const list = await this.getDemands();
    const updated = [demand, ...list];
    await this.saveDemands(updated);
    return updated;
  },

  async updateDemand(updatedDemand: Demand): Promise<Demand[]> {
    const list = await this.getDemands();
    const index = list.findIndex(d => d.id === updatedDemand.id);
    if (index !== -1) {
      list[index] = { ...updatedDemand, updatedAt: new Date().toISOString() };
      await this.saveDemands(list);
    }
    return list;
  },

  async deleteDemand(id: string): Promise<Demand[]> {
    const list = await this.getDemands();
    const filtered = list.filter(d => d.id !== id);
    await this.saveDemands(filtered);
    return filtered;
  },

  async resetToDefaultDemands(): Promise<Demand[]> {
    await AsyncStorage.multiRemove([KEYS.LEGACY_DEMANDS_V1, KEYS.DEMANDS]);
    await AsyncStorage.setItem(KEYS.DEMANDS, JSON.stringify([]));
    return [];
  },

  async clearLocalDatabase(): Promise<void> {
    await AsyncStorage.multiRemove([
      ...LEGACY_AUTH_AND_USER_KEYS,
      KEYS.LEGACY_DEMANDS_V1,
      KEYS.LEGACY_SECTORS_V1,
      KEYS.LEGACY_SECTORS_V2,
      KEYS.LEGACY_SECTORS_V3,
      KEYS.DEMANDS,
      KEYS.CUSTOM_SECTORS,
    ]);
    await AsyncStorage.setItem(KEYS.DEMANDS, JSON.stringify([]));
  },

  // Configurações
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        const supabaseUrl = parsed.supabaseUrl || INITIAL_SETTINGS.supabaseUrl;
        const supabaseAnonKey = parsed.supabaseAnonKey || INITIAL_SETTINGS.supabaseAnonKey;
        const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          supabaseUrl,
          supabaseAnonKey,
          isSupabaseConfigured,
          offlineMode: isSupabaseConfigured ? false : (parsed.offlineMode ?? true),
        };
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Setores
  async getSectors(): Promise<Sector[]> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.LEGACY_SECTORS_V1,
        KEYS.LEGACY_SECTORS_V2,
        KEYS.LEGACY_SECTORS_V3,
      ]);
      const data = await AsyncStorage.getItem(KEYS.CUSTOM_SECTORS);
      if (data) {
        return JSON.parse(data);
      }
      return SECTORS;
    } catch {
      return SECTORS;
    }
  },

  async saveSectors(sectors: Sector[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.CUSTOM_SECTORS, JSON.stringify(sectors));
  },
};
