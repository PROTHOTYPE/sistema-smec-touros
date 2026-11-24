export type RoleType = 
  | 'SUPER_ADMIN_TI' 
  | 'EXECUTIVO_GESTAO' 
  | 'TRIAGEM_ADMIN_RH' 
  | 'COORD_MEMBRO_SETOR';

export type SectorRole = 
  | 'DIRETOR' 
  | 'COORDENADOR' 
  | 'INTEGRANTE';

export type UserStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'inactive';

export type OriginType = 
  | 'oficio_formal' 
  | 'atribuida_admin' 
  | 'direta_setor';

export type DemandStatus = 
  | 'pendente' 
  | 'em_andamento' 
  | 'concluida' 
  | 'parcial' 
  | 'nao_concluida';

export type PriorityLevel = 
  | 'baixa' 
  | 'media' 
  | 'alta' 
  | 'urgente';

export type SectorId = 
  | 'suporte_ti' 
  | 'admin_rh' 
  | 'gabinete' 
  | 'pedagogico' 
  | 'avaliacao' 
  | 'cultura' 
  | 'multidisciplinar' 
  | 'transporte' 
  | 'alimentacao' 
  | 'esportes' 
  | 'busca_ativa' 
  | 'comunicacao' 
  | 'logistica' 
  | 'estatistica' 
  | 'prestacao_contas';

export interface Sector {
  id: SectorId;
  name: string;
  shortName: string;
  code: string;
  description: string;
  expectedLeadershipRole: string; // Cargo de chefia previsto no organograma oficial
  coordinatorName: string;
  coordinatorRole: string;
  email: string;
  phone: string;
  icon: string;
  accentColor: string;
  active: boolean;
  isConfidential?: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  name: string; // Alias sincronizado com fullName
  email: string;
  jobTitle: string; // Cargo/função pública livre (ex: Psicóloga, Cooperado, Assistente, Técnico)
  cargo: string; // Alias sincronizado com jobTitle
  sectorId: SectorId;
  sectorRole: SectorRole; // 'DIRETOR' | 'COORDENADOR' | 'INTEGRANTE'
  coordinationSubarea?: string; // Opcional para Coordenadores (ex: Ensino Infantil, EJA, Educação Integral, Convênios)
  systemRole: RoleType; // Permissão RBAC no sistema
  role: RoleType; // Alias sincronizado com systemRole
  status: UserStatus; // 'pending' | 'approved' | 'rejected' | 'inactive'
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  avatarUrl?: string;
}

export interface SectorLeadership {
  diretor: UserProfile | null;
  coordenador: UserProfile | null;
  coordenadores: UserProfile[];
  integrantes: UserProfile[];
  leaderName: string; // Nome do Diretor ou Coordenador aprovado, ou 'A definir'
  leaderRole: string; // Cargo/papel da liderança, ou 'Liderança: Vaga'
  hasLeader: boolean;
  formattedHeaderLabel: string; // Ex: 'Coordenação: Nome do Titular' ou 'Coordenação: A definir'
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUri: string;
  fileType: 'image' | 'pdf' | 'document';
  fileSize?: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Demand {
  id: string;
  protocolNumber: string;
  title: string;
  description: string;
  originType: OriginType;
  targetSectorId: SectorId;
  sourceSectorId: SectorId;
  status: DemandStatus;
  priority: PriorityLevel;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdBy: string;
  createdByName: string;
  attachments: Attachment[];
  
  // Exclusivos de Ofício Formal
  oficioNumber?: string;
  oficioSender?: string;
  oficioPhysicalDate?: string;
  oficioReceivedBy?: string;

  // Desfecho e Prestação de Contas
  resolutionSummary?: string;
  bottleneckReason?: string;
  impedimentReason?: string;

  // Flag para Ações Próprias do Setor que já entraram como executadas
  isDirectActionExecuted?: boolean;

  // Flag de sigilo para atendimentos psicossociais/AEE
  isConfidential?: boolean;
}

export interface AnnualReportFilters {
  sectorId: SectorId;
  year: number;
  originType?: OriginType | 'all';
  status?: DemandStatus | 'all';
}

export interface SectorStats {
  total: number;
  concluidas: number;
  parciais: number;
  naoConcluidas: number;
  pendentes: number;
  emAndamento: number;
  oficiosAtendidos: number;
  demandasAtribuidas: number;
  acoesProprias: number;
  taxaConclusao: number;
}

export interface AppSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isSupabaseConfigured: boolean;
  offlineMode: boolean;
  municipioNome: string;
  secretariaNome: string;
  estadoNome: string;
  versao: string;
  anoExercicio: number;
  logoPrefeituraUrl?: string;
  logoSmecUrl?: string;
}
