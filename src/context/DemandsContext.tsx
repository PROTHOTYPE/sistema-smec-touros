import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Demand, Sector, AppSettings, DemandStatus, OriginType, PriorityLevel, SectorId, SectorStats, Attachment } from '../types';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabase';
import { SECTORS } from '../constants/sectors';
import { useAuth } from './AuthContext';

interface CreateOficioParams {
  title: string;
  description: string;
  targetSectorId: SectorId;
  priority: PriorityLevel;
  dueDate?: string;
  oficioNumber: string;
  oficioSender: string;
  oficioPhysicalDate?: string;
  attachments: Attachment[];
  createdById: string;
  createdByName: string;
  isConfidential?: boolean;
}

interface CreateDemandParams {
  title: string;
  description: string;
  originType: 'atribuida_admin' | 'direta_setor';
  targetSectorId: SectorId;
  sourceSectorId: SectorId;
  priority: PriorityLevel;
  dueDate?: string;
  createdById: string;
  createdByName: string;
  isDirectActionExecuted?: boolean;
  resolutionSummary?: string;
  status?: DemandStatus;
  bottleneckReason?: string;
  impedimentReason?: string;
  attachments?: Attachment[];
  isConfidential?: boolean;
}

interface UpdateStatusParams {
  demandId: string;
  status: DemandStatus;
  resolvedByName: string;
  resolutionSummary?: string;
  bottleneckReason?: string;
  impedimentReason?: string;
}

interface DemandsContextData {
  demands: Demand[];
  sectors: Sector[];
  settings: AppSettings;
  loading: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  createOficioFormal: (params: CreateOficioParams) => Promise<Demand>;
  createDemand: (params: CreateDemandParams) => Promise<Demand>;
  updateDemandStatus: (params: UpdateStatusParams) => Promise<void>;
  deleteDemand: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  syncWithSupabase: () => Promise<{ success: boolean; message: string }>;
  resetDemoData: () => Promise<void>;
  clearLocalDatabase: () => Promise<void>;
  getSectorStats: (sectorId: SectorId, year?: number) => SectorStats;
  getDemandsForSector: (sectorId: SectorId, year?: number) => Demand[];
  viewingSectorId: SectorId;
  setViewingSectorId: (sectorId: SectorId) => void;
  isAllSectorsView: boolean;
  setIsAllSectorsView: (viewingAll: boolean) => void;
  resetToNativeSector: () => void;
  toggleAdminInspectionMode: () => void;
  activeSectorFilter: SectorId;
  setActiveSectorFilter: (sectorId: SectorId) => void;
  isViewingAllSectors: boolean;
  setIsViewingAllSectors: (viewingAll: boolean) => void;
}

const DemandsContext = createContext<DemandsContextData>({} as DemandsContextData);

export const DemandsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentUser,
    reloadUsers,
    viewingSectorId,
    setViewingSectorId,
    isAllSectorsView,
    setIsAllSectorsView,
    resetToNativeSector,
    toggleAdminInspectionMode,
    activeSectorFilter,
    setActiveSectorFilter,
    isViewingAllSectors,
    setIsViewingAllSectors,
  } = useAuth();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [sectors, setSectors] = useState<Sector[]>(SECTORS);
  const [settings, setSettings] = useState<AppSettings>({} as AppSettings);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Carregar dados iniciais
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [savedSettings, savedSectors, savedDemands] = await Promise.all([
        StorageService.getSettings(),
        StorageService.getSectors(),
        StorageService.getDemands(),
      ]);

      setSettings(savedSettings);
      setSectors(savedSectors);
      setDemands(savedDemands);

      // Se o Supabase estiver configurado, tenta sincronizar em background
      if (SupabaseService.isConfigured(savedSettings)) {
        syncSupabaseData(savedSettings, savedDemands);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Sincronização com o Supabase
  const syncSupabaseData = async (cfg: AppSettings, localDemands: Demand[]) => {
    setIsSyncing(true);
    try {
      const remoteDemands = await SupabaseService.syncFetchDemands(cfg);
      if (remoteDemands && remoteDemands.length > 0) {
        setDemands(remoteDemands);
        await StorageService.saveDemands(remoteDemands);
      } else if (localDemands && localDemands.length > 0) {
        // Se a nuvem estiver vazia, sobe os dados locais
        for (const dem of localDemands) {
          await SupabaseService.syncUpsertDemand(dem, cfg);
        }
      }
      setLastSyncTime(new Date().toLocaleTimeString('pt-BR'));
    } catch (err) {
      console.warn('Falha na sincronização com Supabase:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncWithSupabase = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncing(true);
    try {
      const test = await SupabaseService.testConnection(settings);
      if (!test.success) {
        setIsSyncing(false);
        return test;
      }
      await syncSupabaseData(settings, demands);
      return { success: true, message: 'Dados sincronizados com o banco de dados do Supabase com sucesso!' };
    } catch (err: any) {
      return { success: false, message: `Erro ao sincronizar: ${err.message}` };
    } finally {
      setIsSyncing(false);
    }
  };

  // Gerador de protocolo
  const generateProtocol = (type: OriginType): string => {
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const prefix = type === 'oficio_formal' ? 'OF' : type === 'atribuida_admin' ? 'DEM' : 'ACT';
    return `${prefix}-${year}/${randomSeq}`;
  };

  // 1. Criar Ofício Formal (Exclusivo Admin/RH e Super Admin)
  const createOficioFormal = async (params: CreateOficioParams): Promise<Demand> => {
    const newDemand: Demand = {
      id: `dem-${Date.now()}`,
      protocolNumber: generateProtocol('oficio_formal'),
      title: params.title,
      description: params.description,
      originType: 'oficio_formal',
      targetSectorId: params.targetSectorId,
      sourceSectorId: 'admin_rh',
      status: 'pendente',
      priority: params.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: params.dueDate,
      createdBy: params.createdById,
      createdByName: params.createdByName,
      oficioNumber: params.oficioNumber,
      oficioSender: params.oficioSender,
      oficioPhysicalDate: params.oficioPhysicalDate || new Date().toISOString().split('T')[0],
      oficioReceivedBy: params.createdByName,
      attachments: params.attachments,
      isConfidential: params.isConfidential ?? (params.targetSectorId === 'multidisciplinar'),
    };

    const updated = await StorageService.addDemand(newDemand);
    setDemands(updated);

    if (SupabaseService.isConfigured(settings)) {
      SupabaseService.syncUpsertDemand(newDemand, settings);
    }

    return newDemand;
  };

  // 2. Criar Demanda Atribuída ou Demanda Direta / Ação do Setor
  const createDemand = async (params: CreateDemandParams): Promise<Demand> => {
    const isDirectAction = params.isDirectActionExecuted || false;
    const initialStatus: DemandStatus = isDirectAction 
      ? (params.status || 'concluida') 
      : 'pendente';

    const newDemand: Demand = {
      id: `dem-${Date.now()}`,
      protocolNumber: generateProtocol(params.originType),
      title: params.title,
      description: params.description,
      originType: params.originType,
      targetSectorId: params.targetSectorId,
      sourceSectorId: params.sourceSectorId,
      status: initialStatus,
      priority: params.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: params.dueDate,
      resolvedAt: isDirectAction ? new Date().toISOString() : undefined,
      resolvedBy: isDirectAction ? params.createdByName : undefined,
      createdBy: params.createdById,
      createdByName: params.createdByName,
      isDirectActionExecuted: isDirectAction,
      resolutionSummary: params.resolutionSummary,
      bottleneckReason: params.bottleneckReason,
      impedimentReason: params.impedimentReason,
      attachments: params.attachments || [],
      isConfidential: params.isConfidential ?? (params.targetSectorId === 'multidisciplinar'),
    };

    const updated = await StorageService.addDemand(newDemand);
    setDemands(updated);

    if (SupabaseService.isConfigured(settings)) {
      SupabaseService.syncUpsertDemand(newDemand, settings);
    }

    return newDemand;
  };

  // Atualizar Status (Concluída, Parcial ou Não Concluída com justificativa)
  const updateDemandStatus = async (params: UpdateStatusParams): Promise<void> => {
    const existing = demands.find(d => d.id === params.demandId);
    if (!existing) return;

    const updatedDemand: Demand = {
      ...existing,
      status: params.status,
      resolvedBy: params.resolvedByName,
      resolvedAt: ['concluida', 'parcial', 'nao_concluida'].includes(params.status) 
        ? new Date().toISOString() 
        : undefined,
      resolutionSummary: params.resolutionSummary || existing.resolutionSummary,
      bottleneckReason: params.bottleneckReason || existing.bottleneckReason,
      impedimentReason: params.impedimentReason || existing.impedimentReason,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = await StorageService.updateDemand(updatedDemand);
    setDemands(updatedList);

    if (SupabaseService.isConfigured(settings)) {
      SupabaseService.syncUpsertDemand(updatedDemand, settings);
    }
  };

  // Excluir demanda (GOVERNANÇA ESTRITA: Apenas TRIAGEM_ADMIN_RH e SUPER_ADMIN_TI)
  const deleteDemand = async (id: string): Promise<void> => {
    const normalizedRole = (currentUser?.role || '').toLowerCase();
    const isAllowed =
      normalizedRole === 'triagem_admin_rh' || normalizedRole === 'super_admin_ti';

    if (!isAllowed) {
      Alert.alert(
        'Operação Bloqueada por Governança',
        'Setores executores não têm permissão para excluir demandas ou ofícios. Caso a demanda não possa ser executada, marque-a como "Não Concluída" e informe o motivo formal do impedimento.'
      );
      return;
    }

    const updated = await StorageService.deleteDemand(id);
    setDemands(updated);

    if (SupabaseService.isConfigured(settings)) {
      SupabaseService.syncDeleteDemand(id, settings);
    }
  };

  // Atualizar configurações
  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await StorageService.saveSettings(updated);
  };

  // Reset / Limpeza do banco local
  const resetDemoData = async (): Promise<void> => {
    const resetList = await StorageService.resetToDefaultDemands();
    setDemands(resetList);
  };

  // Zerar/Resetar Banco Local (Exclusivo Super Admin TI)
  const clearLocalDatabase = async (): Promise<void> => {
    await StorageService.clearLocalDatabase();
    setDemands([]);
    setSectors(SECTORS);
    await reloadUsers();
  };

  // Filtrar demandas consolidadas do setor para o relatório anual
  const getDemandsForSector = useCallback((sectorId: SectorId, year: number = 2026): Demand[] => {
    return demands.filter(d => {
      const demandYear = new Date(d.createdAt).getFullYear();
      const matchesYear = demandYear === year;
      // Consolida tanto o que o setor recebeu para fazer quanto o que o setor registrou diretamente
      const matchesSector = d.targetSectorId === sectorId;
      return matchesYear && matchesSector;
    });
  }, [demands]);

  // Estatísticas consolidadas do setor
  const getSectorStats = useCallback((sectorId: SectorId, year: number = 2026): SectorStats => {
    const sectorDemands = getDemandsForSector(sectorId, year);
    const total = sectorDemands.length;

    const concluidas = sectorDemands.filter(d => d.status === 'concluida').length;
    const parciais = sectorDemands.filter(d => d.status === 'parcial').length;
    const naoConcluidas = sectorDemands.filter(d => d.status === 'nao_concluida').length;
    const pendentes = sectorDemands.filter(d => d.status === 'pendente').length;
    const emAndamento = sectorDemands.filter(d => d.status === 'em_andamento').length;

    const oficiosAtendidos = sectorDemands.filter(d => d.originType === 'oficio_formal').length;
    const demandasAtribuidas = sectorDemands.filter(d => d.originType === 'atribuida_admin').length;
    const acoesProprias = sectorDemands.filter(d => d.originType === 'direta_setor').length;

    const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    return {
      total,
      concluidas,
      parciais,
      naoConcluidas,
      pendentes,
      emAndamento,
      oficiosAtendidos,
      demandasAtribuidas,
      acoesProprias,
      taxaConclusao,
    };
  }, [getDemandsForSector]);

  return (
    <DemandsContext.Provider
      value={{
        demands,
        sectors,
        settings,
        loading,
        isSyncing,
        lastSyncTime,
        createOficioFormal,
        createDemand,
        updateDemandStatus,
        deleteDemand,
        updateSettings,
        syncWithSupabase,
        resetDemoData,
        clearLocalDatabase,
        getSectorStats,
        getDemandsForSector,
        viewingSectorId,
        setViewingSectorId,
        isAllSectorsView,
        setIsAllSectorsView,
        resetToNativeSector,
        toggleAdminInspectionMode,
        activeSectorFilter,
        setActiveSectorFilter,
        isViewingAllSectors,
        setIsViewingAllSectors,
      }}
    >
      {children}
    </DemandsContext.Provider>
  );
};

export const useDemands = () => useContext(DemandsContext);

