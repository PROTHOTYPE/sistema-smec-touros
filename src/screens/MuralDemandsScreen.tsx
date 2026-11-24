import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ScrollView, 
  Platform,
  useWindowDimensions,
} from 'react-native';
import { 
  Search, 
  FileText, 
  Zap, 
  Layers, 
  Eye, 
  EyeOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Inbox
} from 'lucide-react-native';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';
import { DemandCard } from '../components/demands/DemandCard';
import { DemandDetailsModal } from '../components/demands/DemandDetailsModal';
import { CreateOficioModal } from '../components/demands/CreateOficioModal';
import { CreateDemandModal } from '../components/demands/CreateDemandModal';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { SectorSelectField } from '../components/common/SectorSelectField';
import { Demand, OriginType, DemandStatus } from '../types';
import { SECTORS } from '../constants/sectors';
import { COLORS } from '../constants/theme';

export const MuralDemandsScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobileButtons = width < 600;
  const {
    demands,
    viewingSectorId,
    setViewingSectorId,
    isAllSectorsView,
    setIsAllSectorsView,
    resetToNativeSector,
    toggleAdminInspectionMode,
  } = useDemands();
  const {
    currentUser,
    canCreateOficio,
    isExecutive,
    isSuperAdmin,
    isRhAdmin,
    getSectorLeadership,
  } = useAuth();

  const [searchText, setSearchText] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState<OriginType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<DemandStatus | 'all'>('all');

  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [oficioModalVisible, setOficioModalVisible] = useState(false);
  const [demandModalVisible, setDemandModalVisible] = useState(false);

  const isCoordinator = currentUser?.role === 'COORD_MEMBRO_SETOR';
  const canUseAdminInspector = isSuperAdmin || isRhAdmin || isExecutive;
  const nativeSectorId = currentUser?.sectorId || 'suporte_ti';
  const nativeSector = SECTORS.find(s => s.id === nativeSectorId);
  const nativeShortLabel = nativeSectorId === 'suporte_ti' ? 'TI' : nativeSector?.code || 'Meu Setor';

  // Estados derivados da visualização do mural:
  // setor nativo, inspeção de setor específico ou visão consolidada
  const isNativeSectorState = viewingSectorId === nativeSectorId && !isAllSectorsView;
  const isSpecificSectorInspectionState =
    canUseAdminInspector && viewingSectorId !== nativeSectorId && !isAllSectorsView;
  const isInspectionOrOverviewActive =
    canUseAdminInspector && (isAllSectorsView || viewingSectorId !== nativeSectorId);

  const scopedDemands = useMemo(() => {
    return demands.filter(d => {
      // Coordenador de setor: NUNCA vê outros setores
      if (isCoordinator) {
        return d.targetSectorId === nativeSectorId;
      }

      // Visão Geral Consolidada (Todos os Setores)
      if (canUseAdminInspector && isAllSectorsView) {
        return true;
      }

      // Setor Nativo ou Inspeção de Setor Específico
      return d.targetSectorId === (viewingSectorId || nativeSectorId);
    });
  }, [
    demands,
    isCoordinator,
    canUseAdminInspector,
    isAllSectorsView,
    viewingSectorId,
    nativeSectorId,
  ]);

  // Filtragem adicional de busca e tags sobre o conjunto isolado
  const filteredDemands = useMemo(() => {
    return scopedDemands.filter(d => {
      // Filtro por origem
      if (selectedOrigin !== 'all' && d.originType !== selectedOrigin) {
        return false;
      }

      // Filtro por status
      if (selectedStatus !== 'all' && d.status !== selectedStatus) {
        return false;
      }

      // Filtro por texto
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const matchesTitle = d.title.toLowerCase().includes(query);
        const matchesDesc = d.description.toLowerCase().includes(query);
        const matchesProto = d.protocolNumber.toLowerCase().includes(query);
        const matchesOficio = d.oficioNumber ? d.oficioNumber.toLowerCase().includes(query) : false;
        const matchesSender = d.oficioSender ? d.oficioSender.toLowerCase().includes(query) : false;
        return matchesTitle || matchesDesc || matchesProto || matchesOficio || matchesSender;
      }

      return true;
    });
  }, [scopedDemands, selectedOrigin, selectedStatus, searchText]);

  // Contagens para os filtros rápidos
  const counts = useMemo(() => {
    return {
      all: scopedDemands.length,
      oficio: scopedDemands.filter(d => d.originType === 'oficio_formal').length,
      admin: scopedDemands.filter(d => d.originType === 'atribuida_admin').length,
      direta: scopedDemands.filter(d => d.originType === 'direta_setor').length,
      pendente: scopedDemands.filter(d => d.status === 'pendente').length,
      concluida: scopedDemands.filter(d => d.status === 'concluida').length,
      parcial: scopedDemands.filter(d => d.status === 'parcial').length,
    };
  }, [scopedDemands]);

  // Mini-Cards de KPIs em Tempo Real do Setor
  const kpiData = useMemo(() => {
    return {
      total: scopedDemands.length,
      pendentes: scopedDemands.filter(d => d.status === 'pendente' || d.status === 'em_andamento').length,
      concluidas: scopedDemands.filter(d => d.status === 'concluida').length,
      parciais: scopedDemands.filter(d => d.status === 'parcial').length,
    };
  }, [scopedDemands]);

  const resolvedTargetSectorId = isCoordinator
    ? nativeSectorId
    : viewingSectorId || nativeSectorId;

  const activeSector = SECTORS.find(s => s.id === resolvedTargetSectorId);
  const activeLeadership = activeSector ? getSectorLeadership(activeSector.id) : null;

  const listHeader = (
    <View style={styles.headerWrapper}>
      {/* Tarja de Aviso quando em Inspeção de Setor Específico */}
      {isSpecificSectorInspectionState && activeSector && (
        <View style={styles.inspectionNoticeBanner}>
          <View style={styles.inspectionNoticeTextWrap}>
            <Text style={styles.inspectionNoticeTitle}>
              👁️ Inspecionando Setor: {activeSector.name} (Acesso Administrativo)
            </Text>
            <Text style={styles.inspectionNoticeSub}>
              Exibindo exclusivamente as demandas e ofícios destinados a {activeSector.code} ({activeLeadership?.formattedHeaderLabel || 'Coordenação: A definir'}).
            </Text>
          </View>
          <TouchableOpacity
            onPress={resetToNativeSector}
            style={styles.returnToTiBtn}
          >
            <Text style={styles.returnToTiBtnText}>Sair da Inspeção</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Banner Superior com Identificação do Setor, Ações e KPIs em Azul Royal & Ouro */}
      <View style={styles.actionBanner}>
        <View style={styles.bannerTopRow}>
          <View style={styles.actionBannerLeft}>
            <View style={styles.sectorBadgeRow}>
              <View style={[styles.sectorTagClean, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <Text style={styles.sectorTagCleanText}>
                  {isAllSectorsView && canUseAdminInspector ? 'TODOS OS SETORES' : activeSector?.code}
                </Text>
              </View>
              {canUseAdminInspector && (
                <TouchableOpacity
                  onPress={toggleAdminInspectionMode}
                  style={[
                    styles.adminTogglePill,
                    isAllSectorsView && styles.adminTogglePillActive,
                    isSpecificSectorInspectionState && styles.adminTogglePillInspecting,
                  ]}
                >
                  <Text
                    style={[
                      styles.adminToggleText,
                      isAllSectorsView && { color: '#1E40AF', fontWeight: '800' },
                      isSpecificSectorInspectionState && { color: '#92400E', fontWeight: '800' },
                    ]}
                  >
                    {isNativeSectorState
                      ? '⚙️ Ativar Inspeção / Modo Admin'
                      : isAllSectorsView
                      ? `🔙 Sair da Visão Geral (Voltar para ${nativeShortLabel})`
                      : `🔙 Voltar para Meu Setor (${nativeShortLabel})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.bannerTitle}>
              {isCoordinator
                ? activeSector?.name
                : isAllSectorsView && canUseAdminInspector
                ? 'Visão Geral — Todos os Setores da SMEC'
                : isNativeSectorState
                ? isSuperAdmin
                  ? 'Fila de Trabalho — Coordenação de TI & Suporte (TI-SMEC)'
                  : isRhAdmin
                  ? 'Mural Interno — Setor Administrativo / RH'
                  : activeSector?.name
                : `Mural do Setor — ${activeSector?.name}`}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {isCoordinator
                ? `${activeLeadership?.formattedHeaderLabel || 'Coordenação: A definir'} • ${activeLeadership?.leaderRole || 'Liderança: Vaga'}`
                : isAllSectorsView && canUseAdminInspector
                ? 'Exibindo demandas e ofícios consolidados de todas as 15 coordenações da SMEC Touros/RN'
                : isNativeSectorState
                ? isSuperAdmin
                  ? `Exibindo chamados, ofícios e ações diretas de TI • ${activeLeadership?.formattedHeaderLabel || 'Coordenação de TI (TI-SMEC)'}`
                  : `${activeLeadership?.formattedHeaderLabel || 'Coordenação: A definir'} • ${activeLeadership?.leaderRole || 'Liderança: Vaga'}`
                : `Inspeção dedicada do setor ${activeSector?.shortName} • ${activeLeadership?.formattedHeaderLabel || 'Coordenação: A definir'}`}
            </Text>
          </View>

          <View style={[styles.actionButtons, isMobileButtons && styles.actionButtonsMobile]}>
            {/* Botão de Ofício Formal: Apenas Admin/RH e Super Admin TI (Azul Royal Institucional) */}
            {canCreateOficio && (
              <GlassButton
                title="Protocolar Ofício (RH)"
                icon={<FileText size={15} color="#FFFFFF" />}
                onPress={() => setOficioModalVisible(true)}
                variant="primary"
                size="sm"
                style={[
                  { backgroundColor: '#1E40AF', borderColor: '#1E3A8A' },
                  isMobileButtons && styles.actionButtonFullMobile,
                ]}
              />
            )}

            {/* Botão de Demanda/Ação do Setor (Amarelo Ouro Institucional) */}
            <GlassButton
              title="Registrar Ação da Equipe"
              icon={<Zap size={15} color="#B45309" />}
              onPress={() => setDemandModalVisible(true)}
              variant="secondary"
              size="sm"
              style={[
                { backgroundColor: '#FEF9E7', borderColor: '#FDE68A' },
                isMobileButtons && styles.actionButtonFullMobile,
              ]}
            />
          </View>
        </View>

        {/* 4 Mini-Cards de Resumo / KPIs no Topo do Mural */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Layers size={17} color="#1E40AF" />
            </View>
            <View style={styles.kpiTextGroup}>
              <Text style={[styles.kpiValue, { color: '#1E40AF' }]}>{kpiData.total}</Text>
              <Text style={styles.kpiLabel}>Total de Registros</Text>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' }]}>
              <Clock size={17} color="#2563EB" />
            </View>
            <View style={styles.kpiTextGroup}>
              <Text style={[styles.kpiValue, { color: '#2563EB' }]}>{kpiData.pendentes}</Text>
              <Text style={styles.kpiLabel}>Pendentes / Em Andamento</Text>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#FEF9E7', borderColor: '#FDE68A' }]}>
              <CheckCircle2 size={17} color="#D97706" />
            </View>
            <View style={styles.kpiTextGroup}>
              <Text style={[styles.kpiValue, { color: '#D97706' }]}>{kpiData.concluidas}</Text>
              <Text style={styles.kpiLabel}>Concluídas (100%)</Text>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrapper, { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }]}>
              <AlertTriangle size={17} color="#B45309" />
            </View>
            <View style={styles.kpiTextGroup}>
              <Text style={[styles.kpiValue, { color: '#B45309' }]}>{kpiData.parciais}</Text>
              <Text style={styles.kpiLabel}>Parciais / Com Gargalo</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Busca e Filtros */}
      <View style={styles.filterSection}>
        {/* Barra de Busca */}
        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por assunto, nº de ofício, protocolo ou remetente..."
            placeholderTextColor="#94A3B8"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.clearSearchText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Seletor de Setores com Busca em Tempo Real: visível APENAS quando o Modo Admin / Inspeção está ativo */}
        {isInspectionOrOverviewActive && (
          <View style={styles.sectorFilterRow}>
            <SectorSelectField
              selectedSectorId={viewingSectorId}
              onSelect={(secId) => {
                setIsAllSectorsView(false);
                setViewingSectorId(secId);
              }}
              compact
              modalTitle="Alternar Setor Inspecionado no Mural"
              modalSubtitle="Selecione qualquer um dos 15 setores oficiais da SMEC Touros"
            />
          </View>
        )}

        {/* Filtros de Origem (Layout Responsivo com Wrap para Mouse + Touch) */}
        <View style={styles.originFilterWrap}>
          <TouchableOpacity
            onPress={() => setSelectedOrigin('all')}
            style={[styles.originChip, selectedOrigin === 'all' && styles.originChipActive]}
          >
            <Text style={[styles.originChipText, selectedOrigin === 'all' && styles.originChipTextActive]}>
              Todas ({counts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedOrigin('oficio_formal')}
            style={[
              styles.originChip,
              selectedOrigin === 'oficio_formal' && { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }
            ]}
          >
            <Text style={[styles.originChipText, selectedOrigin === 'oficio_formal' && { color: '#1E40AF', fontWeight: '800' }]}>
              📄 Ofícios Formais ({counts.oficio})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedOrigin('atribuida_admin')}
            style={[
              styles.originChip,
              selectedOrigin === 'atribuida_admin' && { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' }
            ]}
          >
            <Text style={[styles.originChipText, selectedOrigin === 'atribuida_admin' && { color: '#1D4ED8', fontWeight: '800' }]}>
              📨 Do Admin/RH ({counts.admin})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedOrigin('direta_setor')}
            style={[
              styles.originChip,
              selectedOrigin === 'direta_setor' && { borderColor: '#FDE68A', backgroundColor: '#FEF9E7' }
            ]}
          >
            <Text style={[styles.originChipText, selectedOrigin === 'direta_setor' && { color: '#B45309', fontWeight: '800' }]}>
              ⚡ Ações Diretas ({counts.direta})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filtros de Status (Layout Responsivo com Wrap para Mouse + Touch) */}
        <View style={styles.statusFilterWrap}>
          {(['all', 'pendente', 'em_andamento', 'concluida', 'parcial', 'nao_concluida'] as (DemandStatus | 'all')[]).map(st => {
            const isSelected = selectedStatus === st;
            const label = st === 'all' ? 'Todos os Status' : COLORS.status[st]?.label || st;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => setSelectedStatus(st)}
                style={[
                  styles.statusChip,
                  isSelected && styles.statusChipActive
                ]}
              >
                <Text style={[styles.statusChipText, isSelected && styles.statusChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Lista de Demandas com Cabeçalho Integrado (Rolagem Vertical Contínua) */}
      <FlatList
        style={styles.flatList}
        data={filteredDemands}
        keyExtractor={item => item.id}
        ListHeaderComponent={listHeader}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <DemandCard
            demand={item}
            onPress={() => setSelectedDemand(item)}
            isCoordinatorOfSector={currentUser?.sectorId === item.targetSectorId}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <GlassCard padding={32} style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Inbox size={30} color="#2563EB" />
              </View>
              <Text style={styles.emptyTitle}>Fila de trabalho em dia</Text>
              <Text style={styles.emptySubtitle}>
                Nenhuma demanda ou ofício pendente para este setor no momento.
              </Text>
              <View style={styles.emptyActionsRow}>
                {isRhAdmin ? (
                  <GlassButton
                    title="Protocolar Ofício"
                    icon={<FileText size={15} color="#FFFFFF" />}
                    onPress={() => setOficioModalVisible(true)}
                    variant="primary"
                    size="sm"
                    style={{ backgroundColor: '#1E40AF', borderColor: '#1E3A8A' }}
                  />
                ) : (
                  <GlassButton
                    title="Registrar Ação da Equipe"
                    icon={<Zap size={15} color="#B45309" />}
                    onPress={() => setDemandModalVisible(true)}
                    variant="secondary"
                    size="sm"
                    style={{ backgroundColor: '#FEF9E7', borderColor: '#FDE68A' }}
                  />
                )}
              </View>
            </GlassCard>
          </View>
        }
        ListFooterComponent={
          <View style={styles.subtlePageSignature}>
            <Text style={styles.subtlePageSignatureText}>Projeto PRISMA • PROTHOTYPE</Text>
          </View>
        }
      />

      {/* Modais */}
      <CreateOficioModal
        visible={oficioModalVisible}
        onClose={() => setOficioModalVisible(false)}
      />

      <CreateDemandModal
        visible={demandModalVisible}
        onClose={() => setDemandModalVisible(false)}
        defaultTargetSectorId={resolvedTargetSectorId}
      />

      <DemandDetailsModal
        demand={selectedDemand}
        visible={!!selectedDemand}
        onClose={() => setSelectedDemand(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  flatList: {
    flex: 1,
    width: '100%',
  },
  headerWrapper: {
    width: '100%',
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
  inspectionNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: '#FEF9E7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  inspectionNoticeTextWrap: {
    flex: 1,
    minWidth: 220,
    gap: 2,
  },
  inspectionNoticeTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#92400E',
  },
  inspectionNoticeSub: {
    fontSize: 11.5,
    color: '#B45309',
    fontWeight: '600',
  },
  returnToTiBtn: {
    backgroundColor: '#1E40AF',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  returnToTiBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionBanner: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.12)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionBannerLeft: {
    flex: 1,
    flexShrink: 1,
    minWidth: 200,
  },
  sectorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  sectorTagClean: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  sectorTagCleanText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
  },
  adminTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  adminTogglePillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#60A5FA',
  },
  adminTogglePillInspecting: {
    backgroundColor: '#FEF9E7',
    borderColor: '#F59E0B',
  },
  adminToggleText: {
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '600',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  actionButtonsMobile: {
    flexDirection: 'column',
    width: '100%',
    alignItems: 'stretch',
    gap: 8,
  },
  actionButtonFullMobile: {
    width: '100%',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  kpiIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiTextGroup: {
    flex: 1,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  kpiLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  filterSection: {
    gap: 8,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
  },
  clearSearchText: {
    fontSize: 11.5,
    color: '#1E40AF',
    fontWeight: '700',
  },
  sectorFilterRow: {
    width: '100%',
  },
  originFilterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  originChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  originChipActive: {
    borderColor: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  originChipText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  originChipTextActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  statusFilterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  statusChipActive: {
    borderColor: '#1E3A8A',
    backgroundColor: '#1E3A8A',
  },
  statusChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyContainer: {
    paddingVertical: 44,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
