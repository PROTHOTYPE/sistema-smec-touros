import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserProfile,
  RoleType,
  SectorId,
  SectorRole,
  UserStatus,
  SectorLeadership,
} from '../types';
import { resolveCanonicalSectorId } from '../constants/sectors';
import { StorageService } from '../services/storage';
import { getSupabaseClient } from '../services/supabaseClient';

interface RequestAccessParams {
  fullName: string;
  email: string;
  password: string;
  jobTitle: string;
  sectorId: SectorId;
}

interface ApproveUserParams {
  sectorId: SectorId;
  sectorRole: SectorRole;
  systemRole: RoleType;
  jobTitle?: string;
  coordinationSubarea?: string;
}

interface UpdateStaffParams {
  sectorId: SectorId;
  sectorRole: SectorRole;
  systemRole: RoleType;
  status: UserStatus;
  jobTitle?: string;
  coordinationSubarea?: string;
}

interface LoginResult {
  success: boolean;
  status?: UserStatus;
  message: string;
  user?: UserProfile;
}

interface RequestAccessResult {
  success: boolean;
  message: string;
}

interface AuthContextData {
  currentUser: UserProfile | null;
  setCurrentUser: (profile: UserProfile) => void;
  users: UserProfile[];
  pendingRequests: UserProfile[];
  pendingUsersCount: number;
  availableProfiles: UserProfile[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  requestAccess: (params: RequestAccessParams) => Promise<RequestAccessResult>;
  approveAccessRequest: (userId: string, params: ApproveUserParams) => Promise<void>;
  rejectAccessRequest: (userId: string) => Promise<void>;
  updateStaffMember: (userId: string, params: UpdateStaffParams) => Promise<void>;
  reloadUsers: () => Promise<void>;
  getSectorLeadership: (sectorId: SectorId) => SectorLeadership;
  canCreateOficio: boolean;
  canAssignDemand: boolean;
  canEditSystemSettings: boolean;
  canDeleteDemand: boolean;
  isExecutive: boolean;
  isSuperAdmin: boolean;
  isRhAdmin: boolean;
  selectedSectorId: SectorId;
  setSelectedSectorId: (sectorId: SectorId) => void;
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

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function sanitizeRepeatedSubarea(text?: string | null): string {
  if (!text) return '';
  // Remove repetições acidentais de parênteses idênticos ex: "(X) (X)" -> "(X)"
  return text
    .replace(/(\([^)]+\))(\s*\1)+/gi, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function mapDbRowToUserProfile(row: any): UserProfile {
  const sectorId = resolveCanonicalSectorId(row.sector_id);
  const systemRole = (row.system_role || row.role || 'COORD_MEMBRO_SETOR').toUpperCase() as RoleType;
  const sectorRole = (row.sector_role || 'INTEGRANTE').toUpperCase() as SectorRole;
  const fullName = sanitizeRepeatedSubarea(row.full_name || row.name) || 'Servidor SMEC';
  const rawJobTitle = sanitizeRepeatedSubarea(row.job_title || row.cargo) || 'Servidor Público';
  const rawSubarea = sanitizeRepeatedSubarea(row.coordination_subarea);

  // Evita que jobTitle já contenha a subárea duplicada entre parênteses
  const cleanJobTitle = rawSubarea
    ? rawJobTitle.replace(new RegExp(`\\s*\\(${rawSubarea.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'gi'), '').trim() || rawJobTitle
    : rawJobTitle;

  return {
    id: String(row.id),
    fullName,
    name: fullName,
    email: String(row.email || '').trim().toLowerCase(),
    jobTitle: cleanJobTitle,
    cargo: cleanJobTitle,
    sectorId,
    sectorRole,
    coordinationSubarea: rawSubarea || undefined,
    systemRole,
    role: systemRole,
    status: (row.status || 'pending') as UserStatus,
    createdAt: row.created_at || new Date().toISOString(),
    approvedAt: row.approved_at || null,
    approvedBy: row.approved_by || null,
    avatarUrl: row.avatar_url || undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [viewingSectorId, setViewingSectorIdState] = useState<SectorId>('suporte_ti');
  const [isAllSectorsView, setIsAllSectorsViewState] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const setViewingSectorId = useCallback((sectorId: SectorId) => {
    const canonical = resolveCanonicalSectorId(sectorId);
    setViewingSectorIdState(canonical);
    setIsAllSectorsViewState(false);
  }, []);

  const setIsAllSectorsView = useCallback((viewingAll: boolean) => {
    setIsAllSectorsViewState(viewingAll);
  }, []);

  const resetToNativeSector = useCallback(() => {
    const nativeId = resolveCanonicalSectorId(currentUser?.sectorId || 'suporte_ti');
    setViewingSectorIdState(nativeId);
    setIsAllSectorsViewState(false);
  }, [currentUser?.sectorId]);

  const toggleAdminInspectionMode = useCallback(() => {
    const nativeId = resolveCanonicalSectorId(currentUser?.sectorId || 'suporte_ti');
    const isCurrentlyInNativeSector = viewingSectorId === nativeId && !isAllSectorsView;
    if (isCurrentlyInNativeSector) {
      setIsAllSectorsViewState(true);
    } else {
      setViewingSectorIdState(nativeId);
      setIsAllSectorsViewState(false);
    }
  }, [currentUser?.sectorId, viewingSectorId, isAllSectorsView]);

  const fetchProfilesFromSupabase = useCallback(async (): Promise<UserProfile[]> => {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    try {
      const { data: rows, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !rows) {
        return [];
      }

      const mapped = rows.map(mapDbRowToUserProfile);
      setUsers(mapped);
      return mapped;
    } catch {
      return [];
    }
  }, []);

  const loadAuthData = useCallback(async () => {
    await StorageService.ensureTestAccountsPurged();

    const supabase = getSupabaseClient();
    if (!supabase) {
      setCurrentUserState(null);
      setIsAuthenticated(false);
      setUsers([]);
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setCurrentUserState(null);
        setIsAuthenticated(false);
        setUsers([]);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !profile || profile.status !== 'approved') {
        await supabase.auth.signOut();
        setCurrentUserState(null);
        setIsAuthenticated(false);
        setUsers([]);
        return;
      }

      const mappedProfile = mapDbRowToUserProfile(profile);
      setCurrentUserState(mappedProfile);
      setViewingSectorIdState(mappedProfile.sectorId);
      setIsAllSectorsViewState(false);
      setIsAuthenticated(true);
      await fetchProfilesFromSupabase();
    } catch {
      setCurrentUserState(null);
      setIsAuthenticated(false);
    }
  }, [fetchProfilesFromSupabase]);

  useEffect(() => {
    loadAuthData();
  }, [loadAuthData]);

  const setCurrentUser = (profile: UserProfile) => {
    const isSwitchingToAnotherUser = currentUser && currentUser.id !== profile.id;
    if (
      isSwitchingToAnotherUser &&
      !(typeof __DEV__ !== 'undefined' && __DEV__ && currentUser?.systemRole === 'SUPER_ADMIN_TI')
    ) {
      return;
    }

    const normalizedProfile: UserProfile = {
      ...profile,
      sectorId: resolveCanonicalSectorId(profile.sectorId),
    };
    setCurrentUserState(normalizedProfile);
    setViewingSectorIdState(normalizedProfile.sectorId);
    setIsAllSectorsViewState(false);
    setIsAuthenticated(true);
  };

  // Login 100% vinculado ao Supabase Auth + validação estrita de public.profiles
  const login = async (email: string, password: string): Promise<LoginResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      return {
        success: false,
        message: 'Informe seu e-mail e sua senha para entrar.',
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        success: false,
        message: 'Serviço de autenticação indisponível. Verifique a configuração do Supabase.',
      };
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (signInError || !data?.user) {
      return {
        success: false,
        message: 'E-mail ou senha inválidos. Verifique suas credenciais ou solicite seu acesso.',
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setCurrentUserState(null);
      setIsAuthenticated(false);
      return {
        success: false,
        status: 'pending',
        message:
          'Solicitação em Análise: Sua conta está aguardando homologação pela Coordenação de Tecnologia da Informação (TI-SMEC).',
      };
    }

    if (profile.status !== 'approved') {
      await supabase.auth.signOut();
      setCurrentUserState(null);
      setIsAuthenticated(false);

      if (profile.status === 'rejected') {
        return {
          success: false,
          status: 'rejected',
          message:
            'Sua solicitação de acesso não foi homologada. Entre em contato com a Coordenação de TI da SMEC para mais informações.',
        };
      }

      if (profile.status === 'inactive') {
        return {
          success: false,
          status: 'inactive',
          message:
            'Seu acesso encontra-se temporariamente suspenso/inativo. Procure a Coordenação de TI para regularização.',
        };
      }

      return {
        success: false,
        status: 'pending',
        message:
          'Solicitação em Análise: Seu cadastro foi recebido com sucesso e está aguardando homologação pela Coordenação de Tecnologia da Informação (TI-SMEC). Assim que seu acesso for liberado, você poderá entrar.',
      };
    }

    const mappedUser = mapDbRowToUserProfile(profile);
    setCurrentUserState(mappedUser);
    setViewingSectorIdState(mappedUser.sectorId);
    setIsAllSectorsViewState(false);
    setIsAuthenticated(true);
    await fetchProfilesFromSupabase();

    return {
      success: true,
      status: 'approved',
      message: 'Login realizado com sucesso!',
      user: mappedUser,
    };
  };

  const logout = async (): Promise<void> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignora erro de rede no signOut
      }
    }
    setCurrentUserState(null);
    setIsAuthenticated(false);
    setIsAllSectorsViewState(false);
    setUsers([]);
  };

  // Solicitação de Acesso 100% vinculada a supabase.auth.signUp (sem auto-promoção no cliente e sem escrita local)
  const requestAccess = async (params: RequestAccessParams): Promise<RequestAccessResult> => {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanFullName = params.fullName.trim();
    const cleanJobTitle = params.jobTitle.trim();
    const cleanPassword = params.password.trim();
    const canonicalSectorId = resolveCanonicalSectorId(params.sectorId);

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Serviço de autenticação indisponível. Verifique a conexão com o Supabase.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          full_name: cleanFullName,
          sector_id: canonicalSectorId,
          job_title: cleanJobTitle,
        },
      },
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (
        msg.includes('already registered') ||
        msg.includes('already exists') ||
        msg.includes('duplicate') ||
        msg.includes('unique') ||
        error.status === 422
      ) {
        throw new Error('Este e-mail já possui cadastro. Faça login na aba Entrar.');
      }
      throw new Error(error.message || 'Não foi possível concluir a solicitação de acesso.');
    }

    // Quando o e-mail já existe no Supabase Auth com confirmação ativada, identities retorna array vazio
    if (data?.user?.identities && data.user.identities.length === 0) {
      throw new Error('Este e-mail já possui cadastro. Faça login na aba Entrar.');
    }

    // Garante que nenhuma sessão ativa permaneça aberta sem passar pelo fluxo de login e verificação de homologação
    if (data?.session) {
      await supabase.auth.signOut();
    }

    return {
      success: true,
      message:
        'Solicitação registrada com sucesso! Seu cadastro aguarda homologação pela Coordenação de Tecnologia da Informação (TI-SMEC) ou já pode ser acessado na aba "Entrar no Sistema" caso homologado.',
    };
  };

  // Aprovar Solicitação de Acesso (Exclusivo Super Admin TI via RLS no Supabase)
  const approveAccessRequest = async (
    userId: string,
    params: ApproveUserParams
  ): Promise<void> => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const cleanSubarea =
      params.sectorRole === 'COORDENADOR' && params.coordinationSubarea?.trim()
        ? params.coordinationSubarea.trim()
        : null;
    const updatedJobTitle = params.jobTitle?.trim();

    const updatePayload: Record<string, any> = {
      sector_id: resolveCanonicalSectorId(params.sectorId),
      sector_role: params.sectorRole,
      coordination_subarea: cleanSubarea,
      system_role: params.systemRole,
      role: params.systemRole,
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: currentUser?.fullName || 'Super Admin TI',
    };

    if (updatedJobTitle) {
      updatePayload.job_title = updatedJobTitle;
      updatePayload.cargo = updatedJobTitle;
    }

    await supabase.from('profiles').update(updatePayload).eq('id', userId);
    await fetchProfilesFromSupabase();
  };

  // Recusar Solicitação de Acesso (Exclusivo Super Admin TI via RLS no Supabase)
  const rejectAccessRequest = async (userId: string): Promise<void> => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const target = users.find(u => u.id === userId);
    if ((target?.systemRole || target?.role) === 'SUPER_ADMIN_TI') {
      return;
    }

    await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId);
    await fetchProfilesFromSupabase();
  };

  // Atualizar Servidor Ativo (Exclusivo Super Admin TI via RLS no Supabase)
  const updateStaffMember = async (
    userId: string,
    params: UpdateStaffParams
  ): Promise<void> => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const target = users.find(u => u.id === userId);
    const isMaster = (target?.systemRole || target?.role) === 'SUPER_ADMIN_TI';
    const safeStatus: UserStatus = isMaster ? 'approved' : params.status;
    const safeSystemRole: RoleType = isMaster ? 'SUPER_ADMIN_TI' : params.systemRole;
    const cleanSubarea =
      params.sectorRole === 'COORDENADOR' && params.coordinationSubarea?.trim()
        ? params.coordinationSubarea.trim()
        : null;
    const updatedJobTitle = params.jobTitle?.trim() || target?.jobTitle || 'Servidor Público';

    await supabase
      .from('profiles')
      .update({
        sector_id: resolveCanonicalSectorId(params.sectorId),
        sector_role: params.sectorRole,
        coordination_subarea: cleanSubarea,
        system_role: safeSystemRole,
        role: safeSystemRole,
        status: safeStatus,
        job_title: updatedJobTitle,
        cargo: updatedJobTitle,
      })
      .eq('id', userId);

    const refreshed = await fetchProfilesFromSupabase();
    if (currentUser) {
      const updatedSelf = refreshed.find(u => u.id === currentUser.id);
      if (updatedSelf) {
        if (updatedSelf.status !== 'approved') {
          await supabase.auth.signOut();
          setCurrentUserState(null);
          setIsAuthenticated(false);
        } else {
          setCurrentUserState(updatedSelf);
        }
      }
    }
  };

  // Resolução Dinâmica de Liderança por Setor (Reflete estritamente os usuários homologados em `public.profiles`)
  const getSectorLeadership = useCallback(
    (sectorId: SectorId): SectorLeadership => {
      const canonicalTarget = resolveCanonicalSectorId(sectorId);
      const sectorApprovedUsers = users.filter(
        u => u.status === 'approved' && resolveCanonicalSectorId(u.sectorId) === canonicalTarget
      );

      const diretor = sectorApprovedUsers.find(u => u.sectorRole === 'DIRETOR') || null;
      const coordenadores = sectorApprovedUsers.filter(u => u.sectorRole === 'COORDENADOR');
      const coordenador = coordenadores[0] || null;
      const integrantes = sectorApprovedUsers.filter(u => u.sectorRole === 'INTEGRANTE');

      const primaryLeader = diretor || coordenador;

      if (primaryLeader) {
        const rolePrefix =
          primaryLeader.sectorRole === 'DIRETOR' ? 'Diretoria' : 'Coordenação';
        const baseJobTitle = sanitizeRepeatedSubarea(
          primaryLeader.jobTitle || `${rolePrefix} do Setor`
        );
        const cleanSubarea = sanitizeRepeatedSubarea(primaryLeader.coordinationSubarea);

        // Só adiciona subareaSuffix no cargo se ela não estiver contida no próprio jobTitle
        // e não for redundante com "Coordenação Geral"
        const shouldAppendSubarea =
          Boolean(cleanSubarea) &&
          !baseJobTitle.toLowerCase().includes(cleanSubarea.toLowerCase()) &&
          !cleanSubarea.toLowerCase().startsWith('coordenação geral');

        const subareaSuffix = shouldAppendSubarea ? ` (${cleanSubarea})` : '';
        const extraCoordsCount =
          primaryLeader.sectorRole === 'DIRETOR'
            ? coordenadores.length
            : Math.max(0, coordenadores.length - 1);
        const extraLabel =
          extraCoordsCount > 0 ? ` +${extraCoordsCount} coord.` : '';

        return {
          diretor,
          coordenador,
          coordenadores,
          integrantes,
          leaderName: `${primaryLeader.fullName}${extraLabel}`,
          leaderRole: `${baseJobTitle}${subareaSuffix}`,
          hasLeader: true,
          formattedHeaderLabel: `${rolePrefix}: ${primaryLeader.fullName}${extraLabel}`,
        };
      }

      return {
        diretor: null,
        coordenador: null,
        coordenadores: [],
        integrantes,
        leaderName: 'A definir',
        leaderRole: 'Liderança: Vaga',
        hasLeader: false,
        formattedHeaderLabel: 'Coordenação: A definir (Liderança: Vaga)',
      };
    },
    [users]
  );

  const pendingRequests = useMemo(
    () => users.filter(u => u.status === 'pending'),
    [users]
  );

  const availableProfiles = useMemo(
    () => users.filter(u => u.status === 'approved'),
    [users]
  );

  const effectiveRole = currentUser?.systemRole || currentUser?.role;

  // Apenas Admin/RH e Super Admin TI podem protocolar ofícios formais
  const canCreateOficio =
    effectiveRole === 'TRIAGEM_ADMIN_RH' || effectiveRole === 'SUPER_ADMIN_TI';

  const canAssignDemand =
    effectiveRole === 'TRIAGEM_ADMIN_RH' ||
    effectiveRole === 'SUPER_ADMIN_TI' ||
    effectiveRole === 'EXECUTIVO_GESTAO';

  const canEditSystemSettings = effectiveRole === 'SUPER_ADMIN_TI';

  const canDeleteDemand =
    effectiveRole === 'TRIAGEM_ADMIN_RH' || effectiveRole === 'SUPER_ADMIN_TI';

  const isExecutive = effectiveRole === 'EXECUTIVO_GESTAO';
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN_TI';
  const isRhAdmin = effectiveRole === 'TRIAGEM_ADMIN_RH';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        pendingRequests,
        pendingUsersCount: pendingRequests.length,
        availableProfiles,
        isAuthenticated,
        login,
        logout,
        requestAccess,
        approveAccessRequest,
        rejectAccessRequest,
        updateStaffMember,
        reloadUsers: loadAuthData,
        getSectorLeadership,
        canCreateOficio,
        canAssignDemand,
        canEditSystemSettings,
        canDeleteDemand,
        isExecutive,
        isSuperAdmin,
        isRhAdmin,
        selectedSectorId: viewingSectorId,
        setSelectedSectorId: setViewingSectorId,
        viewingSectorId,
        setViewingSectorId,
        isAllSectorsView,
        setIsAllSectorsView,
        resetToNativeSector,
        toggleAdminInspectionMode,
        activeSectorFilter: viewingSectorId,
        setActiveSectorFilter: setViewingSectorId,
        isViewingAllSectors: isAllSectorsView,
        setIsViewingAllSectors: setIsAllSectorsView,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
