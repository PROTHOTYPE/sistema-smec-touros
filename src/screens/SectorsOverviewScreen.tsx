import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { 
  Cpu, 
  Building2, 
  Landmark, 
  Baby, 
  LineChart, 
  GraduationCap, 
  SearchCheck, 
  Trophy, 
  BarChart3, 
  Palette, 
  Bus, 
  Apple, 
  HeartHandshake, 
  Megaphone,
  PackageCheck,
  FileCheck2,
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileText,
  ShieldAlert,
  Search,
  X
} from 'lucide-react-native';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/common/GlassCard';
import { SECTORS } from '../constants/sectors';
import { SectorId } from '../types';

interface SectorsOverviewScreenProps {
  onNavigateToMural: (sectorId: SectorId) => void;
  onNavigateToReport: (sectorId: SectorId) => void;
}

export const SectorsOverviewScreen: React.FC<SectorsOverviewScreenProps> = ({
  onNavigateToMural,
  onNavigateToReport,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { getSectorStats, setActiveSectorFilter, setIsViewingAllSectors } = useDemands();
  const { currentUser, isExecutive, isSuperAdmin, isRhAdmin, getSectorLeadership } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSectors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SECTORS;
    return SECTORS.filter(sec => {
      const leadership = getSectorLeadership(sec.id);
      return (
        sec.name.toLowerCase().includes(q) ||
        sec.shortName.toLowerCase().includes(q) ||
        sec.code.toLowerCase().includes(q) ||
        leadership.leaderName.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, getSectorLeadership]);

  // Guarda de permissão: exclusivo para SUPER_ADMIN_TI, EXECUTIVO_GESTAO e TRIAGEM_ADMIN_RH.
  // Bloqueia estritamente COORD_MEMBRO_SETOR.
  const hasOverviewAccess = isSuperAdmin || isExecutive || isRhAdmin;

  if (!hasOverviewAccess || !currentUser || currentUser.role === 'COORD_MEMBRO_SETOR') {
    return (
      <View style={styles.restrictedContainer}>
        <GlassCard padding={24} style={styles.restrictedCard}>
          <ShieldAlert size={40} color="#1E40AF" />
          <Text style={styles.restrictedTitle}>Acesso Restrito à Gestão, TI e RH</Text>
          <Text style={styles.restrictedText}>
            O Panorama Geral dos Setores é exclusivo do Gabinete Executivo, Setor Administrativo / RH e Super Admin de TI.
          </Text>
        </GlassCard>
      </View>
    );
  }

  const getIcon = (iconName: string, color: string) => {
    const props = { size: 22, color };
    switch (iconName) {
      case 'Cpu': return <Cpu {...props} />;
      case 'Building2': return <Building2 {...props} />;
      case 'Landmark': return <Landmark {...props} />;
      case 'HeartHandshake': return <HeartHandshake {...props} />;
      case 'Baby': return <Baby {...props} />;
      case 'LineChart': return <LineChart {...props} />;
      case 'GraduationCap': return <GraduationCap {...props} />;
      case 'SearchCheck': return <SearchCheck {...props} />;
      case 'Trophy': return <Trophy {...props} />;
      case 'BarChart3': return <BarChart3 {...props} />;
      case 'Palette': return <Palette {...props} />;
      case 'Bus': return <Bus {...props} />;
      case 'Apple': return <Apple {...props} />;
      case 'Megaphone': return <Megaphone {...props} />;
      case 'PackageCheck': return <PackageCheck {...props} />;
      case 'FileCheck2': return <FileCheck2 {...props} />;
      default: return <Building2 {...props} />;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
      <GlassCard variant="elevated" padding={18} style={styles.headerCard}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            {isExecutive
              ? 'PAINEL DO GABINETE EXECUTIVO'
              : isRhAdmin
              ? 'MONITORAMENTO DE TRAMITAÇÃO — ADMINISTRATIVO / RH'
              : 'VISÃO GERAL INTERSETORIAL'}
          </Text>
        </View>
        <Text style={styles.headerTitle}>Monitoramento em Tempo Real dos Setores</Text>
        <Text style={styles.headerSubtitle}>
          {isRhAdmin
            ? 'Acompanhe o andamento e a execução dos ofícios e demandas distribuídos pelo Setor Administrativo / RH para cada coordenação da SMEC Touros/RN.'
            : 'Acompanhe o volume de ofícios tramitados, ações executadas e taxas de resolução em todas as coordenações da Secretaria Municipal de Educação e Cultura de Touros/RN.'}
        </Text>

        {/* Barra de Pesquisa Rápida */}
        <View style={styles.searchBox}>
          <Search size={15} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Filtrar setor por nome, sigla (ex: TI-SMEC) ou coordenador..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>

      <View style={isMobile ? styles.mobileStackList : styles.desktopGrid}>
        {filteredSectors.map(sec => {
          const stats = getSectorStats(sec.id, 2026);
          const leadership = getSectorLeadership(sec.id);

          return (
            <View
              key={sec.id}
              style={isMobile ? styles.cardWrapperMobile : styles.cardWrapperDesktop}
            >
              <GlassCard 
                padding={16} 
                variant="surface"
                style={styles.card}
              >
                {/* Header do Card */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: `${sec.accentColor}15`, borderColor: sec.accentColor }]}>
                    {getIcon(sec.icon, sec.accentColor)}
                  </View>
                  <View style={styles.cardTitles}>
                    <Text style={styles.cardName} numberOfLines={1}>{sec.name}</Text>
                    <Text style={styles.cardCode}>{sec.code} • {leadership.leaderRole}</Text>
                  </View>
                </View>

                {/* Coordenador / Liderança Dinâmica */}
                <Text style={styles.cardCoord} numberOfLines={1}>
                  {leadership.hasLeader ? (
                    <>
                      {leadership.formattedHeaderLabel.split(':')[0]}:{' '}
                      <Text style={styles.boldText}>{leadership.leaderName}</Text>
                    </>
                  ) : (
                    <Text style={{ color: '#64748B', fontStyle: 'italic' }}>
                      Coordenação: A definir (Liderança Vaga)
                    </Text>
                  )}
                </Text>

                {/* Barra de Progresso / Taxa de Conclusão */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Taxa de Eficiência</Text>
                    <Text style={[styles.progressVal, { color: '#1E40AF' }]}>
                      {stats.taxaConclusao}% ({stats.concluidas}/{stats.total})
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${Math.max(stats.taxaConclusao, 4)}%`, backgroundColor: sec.accentColor }
                      ]} 
                    />
                  </View>
                </View>

                {/* Microestatísticas */}
                <View style={styles.statsRow}>
                  <View style={styles.statPill}>
                    <CheckCircle2 size={12} color="#15803D" />
                    <Text style={[styles.statPillText, { color: '#15803D' }]}>{stats.concluidas} Feitas</Text>
                  </View>
                  <View style={styles.statPill}>
                    <Clock size={12} color="#B45309" />
                    <Text style={[styles.statPillText, { color: '#B45309' }]}>{stats.parciais} Parciais</Text>
                  </View>
                  <View style={styles.statPill}>
                    <FileText size={12} color="#7E22CE" />
                    <Text style={[styles.statPillText, { color: '#7E22CE' }]}>{stats.oficiosAtendidos} Ofícios</Text>
                  </View>
                </View>

                {/* Ações */}
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    onPress={() => {
                      setActiveSectorFilter(sec.id);
                      setIsViewingAllSectors(false);
                      onNavigateToMural(sec.id);
                    }}
                    style={styles.actionBtnOutline}
                  >
                    <Text style={styles.actionBtnText}>Ver Mural</Text>
                    <ArrowRight size={13} color="#1E40AF" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => onNavigateToReport(sec.id)}
                    style={styles.actionBtnSecondary}
                  >
                    <Text style={styles.actionBtnSecText}>Relatório Anual</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </View>
          );
        })}
      </View>

      <View style={styles.subtlePageSignature}>
        <Text style={styles.subtlePageSignatureText}>Projeto PRISMA • PROTHOTYPE</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 110,
  },
  subtlePageSignature: {
    paddingTop: 20,
    paddingBottom: 8,
    alignItems: 'center',
  },
  subtlePageSignatureText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 7,
    gap: 8,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  headerCard: {
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.12)',
    flexShrink: 0,
  },
  headerBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  mobileStackList: {
    flexDirection: 'column',
    width: '100%',
  },
  cardWrapperDesktop: {
    flex: 1,
    minWidth: 310,
    maxWidth: '100%',
  },
  cardWrapperMobile: {
    width: '100%',
    marginBottom: 12,
    flexShrink: 0,
  },
  card: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    flexShrink: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitles: {
    flex: 1,
    flexShrink: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardCode: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  cardCoord: {
    fontSize: 11.5,
    color: '#334155',
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  progressContainer: {
    gap: 3,
    marginTop: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  progressVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    gap: 4,
  },
  statPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 2,
  },
  actionBtnOutline: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    gap: 5,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E40AF',
  },
  actionBtnSecondary: {
    flex: 1,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  actionBtnSecText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  restrictedContainer: {
    flex: 1,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictedCard: {
    alignItems: 'center',
    maxWidth: 440,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  restrictedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 4,
  },
  restrictedText: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
