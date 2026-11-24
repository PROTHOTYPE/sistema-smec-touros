import { Platform } from 'react-native';

export const COLORS = {
  // Fundos & Superfícies (Clean Light Frosted Glass)
  background: '#F4F6FA',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#F1F5F9',
  
  // Vidro Translúcido Claro (Light Frosted)
  glassSurface: 'rgba(255, 255, 255, 0.85)',
  glassSurfaceHover: 'rgba(255, 255, 255, 0.95)',
  glassSurfaceActive: 'rgba(255, 255, 255, 1.0)',
  glassBorder: 'rgba(30, 64, 175, 0.10)',
  glassBorderHighlight: 'rgba(30, 64, 175, 0.22)',
  
  // Tipografia de Alta Leitura
  textPrimary: '#0F172A',      // Azul Marinho Profundo / Slate
  textSecondary: '#475569',    // Cinza Azulado
  textMuted: '#64748B',        // Auxiliares / Legendas
  textLight: '#94A3B8',

  // Cores Institucionais de Touros (Azul Royal e Ouro)
  primary: '#1E40AF',          // Azul Royal Institucional
  primaryLight: '#2563EB',     // Azul Vivo para botões e abas ativas
  primaryGlow: 'rgba(30, 64, 175, 0.15)',
  
  accent: '#EAB308',           // Amarelo Ouro Touros
  accentSecondary: '#F59E0B',  // Âmbar
  accentGlow: 'rgba(234, 179, 8, 0.18)',

  // Destaques Auxiliares
  emerald: '#15803D',
  emeraldLight: '#DCFCE7',
  rose: '#B91C1C',
  roseLight: '#FEE2E2',
  purple: '#7E22CE',
  purpleLight: '#F3E8FF',
  
  // Status Específicos (Pastel Nítido e Limpo)
  status: {
    pendente: {
      bg: '#E0F2FE',
      border: '#BAE6FD',
      text: '#0369A1',
      label: 'Pendente'
    },
    em_andamento: {
      bg: '#DBEAFE',
      border: '#BFDBFE',
      text: '#1D4ED8',
      label: 'Em Andamento'
    },
    concluida: {
      bg: '#DCFCE7',
      border: '#BBF7D0',
      text: '#15803D',
      label: 'Concluída'
    },
    parcial: {
      bg: '#FEF3C7',
      border: '#FDE68A',
      text: '#B45309',
      label: 'Resolvida Parcialmente'
    },
    nao_concluida: {
      bg: '#FEE2E2',
      border: '#FECACA',
      text: '#B91C1C',
      label: 'Não Concluída'
    }
  },

  // Origens das Demandas (Pastel Nítido Institucional Azul & Ouro)
  origin: {
    oficio_formal: {
      bg: '#EFF6FF',
      border: '#BFDBFE',
      text: '#1E40AF',
      badge: '📄 Ofício Formal (Admin/RH)'
    },
    atribuida_admin: {
      bg: '#EFF6FF',
      border: '#BFDBFE',
      text: '#1D4ED8',
      badge: '📨 Atribuída pelo Admin/RH'
    },
    direta_setor: {
      bg: '#FEF9E7',
      border: '#FDE68A',
      text: '#B45309',
      badge: '⚡ Ação Direta da Equipe'
    }
  },

  // Prioridades
  priority: {
    baixa: {
      text: '#475569',
      bg: '#F1F5F9',
      border: '#E2E8F0',
      label: 'Baixa'
    },
    media: {
      text: '#0369A1',
      bg: '#E0F2FE',
      border: '#BAE6FD',
      label: 'Média'
    },
    alta: {
      text: '#B45309',
      bg: '#FEF3C7',
      border: '#FDE68A',
      label: 'Alta'
    },
    urgente: {
      text: '#B91C1C',
      bg: '#FEE2E2',
      border: '#FECACA',
      label: 'Urgente'
    }
  }
};

export const GLASS_STYLES = {
  container: Platform.select({
    web: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderWidth: 1,
      borderColor: 'rgba(30, 64, 175, 0.10)',
      borderRadius: 18,
      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
    },
    default: {
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      borderWidth: 1,
      borderColor: 'rgba(30, 64, 175, 0.10)',
      borderRadius: 18,
    }
  }),
  cardGlow: {
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  }
};
