import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileCheck 
} from 'lucide-react-native';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { SectorSelectField } from '../components/common/SectorSelectField';
import { SECTORS } from '../constants/sectors';
import { SectorId } from '../types';
import { generateReportHtml } from '../components/report/ReportHtmlTemplate';
import { PdfService } from '../services/pdfService';
import { TourosEmblem } from '../components/icons/TourosEmblem';
import { SmecLogo } from '../components/icons/SmecLogo';

export const AnnualReportScreen: React.FC = () => {
  const { getDemandsForSector, getSectorStats, settings } = useDemands();
  const { currentUser, selectedSectorId, isExecutive, isSuperAdmin, isRhAdmin, getSectorLeadership } = useAuth();

  const isCoordinator = currentUser?.role === 'COORD_MEMBRO_SETOR';

  // TRAVA ABSOLUTA DE ISOLAMENTO:
  // Se for coordenador de setor, trava no próprio setor sem possibilidade de selecionar outro
  const [targetSectorId, setTargetSectorId] = useState<SectorId>(
    isCoordinator ? (currentUser?.sectorId || 'pedagogico') : (isSuperAdmin ? 'suporte_ti' : selectedSectorId)
  );

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [generating, setGenerating] = useState(false);

  // Garante que se o perfil mudar, atualiza o setor alvo
  React.useEffect(() => {
    if (isCoordinator && currentUser?.sectorId) {
      setTargetSectorId(currentUser.sectorId);
    } else if (isSuperAdmin && targetSectorId !== 'suporte_ti') {
      // mantém ou deixa selecionar
    } else if (!isCoordinator && selectedSectorId) {
      setTargetSectorId(selectedSectorId);
    }
  }, [currentUser, isCoordinator, isSuperAdmin, selectedSectorId]);

  const sector = useMemo(() => {
    const baseSector = SECTORS.find(s => s.id === targetSectorId) || SECTORS[0];
    const leadership = getSectorLeadership(baseSector.id);
    const primarySigner = leadership.diretor || leadership.coordenador;
    return {
      ...baseSector,
      coordinatorName: primarySigner
        ? primarySigner.fullName
        : 'Coordenação / Diretoria Responsável pelo Setor',
      coordinatorRole: primarySigner
        ? `${primarySigner.jobTitle}${primarySigner.coordinationSubarea ? ` (${primarySigner.coordinationSubarea})` : ''}`
        : baseSector.expectedLeadershipRole || 'Assinatura Institucional do Setor',
    };
  }, [targetSectorId, getSectorLeadership]);

  const gabineteLeadership = useMemo(() => {
    return getSectorLeadership('gabinete');
  }, [getSectorLeadership]);

  const sectorDemands = useMemo(() => {
    return getDemandsForSector(targetSectorId, selectedYear);
  }, [getDemandsForSector, targetSectorId, selectedYear]);

  const stats = useMemo(() => {
    return getSectorStats(targetSectorId, selectedYear);
  }, [getSectorStats, targetSectorId, selectedYear]);

  const concluidas = useMemo(() => sectorDemands.filter(d => d.status === 'concluida'), [sectorDemands]);
  const parciais = useMemo(() => sectorDemands.filter(d => d.status === 'parcial'), [sectorDemands]);
  const naoConcluidas = useMemo(() => sectorDemands.filter(d => d.status === 'nao_concluida'), [sectorDemands]);
  const oficios = useMemo(() => sectorDemands.filter(d => d.originType === 'oficio_formal'), [sectorDemands]);

  const handleExportPdf = async () => {
    setGenerating(true);
    try {
      const html = generateReportHtml({
        sector,
        year: selectedYear,
        demands: sectorDemands,
        stats,
        municipioNome: settings.municipioNome || 'PREFEITURA MUNICIPAL DE TOUROS',
        secretariaNome: settings.secretariaNome || 'SECRETARIA MUNICIPAL DE EDUCAÇÃO E CULTURA',
        logoPrefeituraUrl: settings.logoPrefeituraUrl,
        logoSmecUrl: settings.logoSmecUrl,
        executiveLeaderName: gabineteLeadership.hasLeader
          ? (gabineteLeadership.diretor || gabineteLeadership.coordenador)?.fullName || gabineteLeadership.leaderName
          : 'Secretário(a) Municipal de Educação e Cultura',
        executiveLeaderRole: gabineteLeadership.hasLeader
          ? gabineteLeadership.leaderRole
          : 'Gabinete Executivo — SMEC Touros/RN',
      });

      await PdfService.printOrShareHtml(
        html,
        `Relatorio_Anual_${sector.code}_${selectedYear}.pdf`
      );
    } catch (err: any) {
      console.error('Erro na exportação:', err);
      Alert.alert('Erro', `Não foi possível gerar o PDF: ${err.message || 'Tente novamente'}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
    >
      {/* Barra Superior de Controles */}
      <GlassCard variant="elevated" padding={18} style={styles.controlCard}>
        <View style={styles.controlHeader}>
          <View style={{ flex: 1, minWidth: 260 }}>
            <View style={styles.badgeControl}>
              <Text style={styles.badgeControlText}>PRESTAÇÃO DE CONTAS OFICIAL</Text>
            </View>
            <Text style={styles.controlTitle}>
              Relatório Anual — {sector.name}
            </Text>
            <Text style={styles.controlSubtitle}>
              Consolidação unificada de Ofícios, Demandas Administrativas e Ações da Equipe
            </Text>
          </View>

          <GlassButton
            title="Exportar PDF Oficial (A4)"
            icon={<Printer size={16} color="#FFFFFF" />}
            onPress={handleExportPdf}
            loading={generating}
            variant="primary"
            size="md"
            style={{ backgroundColor: '#1E40AF', borderColor: '#1E3A8A' }}
          />
        </View>

        {/* Seleção do Setor com Busca em Tempo Real: APENAS visível para EXECUTIVO, RH ou SUPER ADMIN TI.
            Para COORD_MEMBRO_SETOR, fica estritamente bloqueado e invisível */}
        {(isExecutive || isSuperAdmin || isRhAdmin) && (
          <View style={styles.selectorGroup}>
            <SectorSelectField
              label="Alternar Setor (Acesso de Gestão):"
              selectedSectorId={targetSectorId}
              onSelect={setTargetSectorId}
              compact
              modalTitle="Selecionar Setor para Relatório Anual"
              modalSubtitle="Consolide e exporte a prestação de contas de qualquer setor da SMEC"
            />
          </View>
        )}

        {/* Seleção do Ano do Exercício */}
        <View style={styles.yearRow}>
          <Text style={styles.selectorLabel}>Exercício:</Text>
          <View style={styles.yearButtons}>
            {[2026, 2025, 2024].map(y => (
              <TouchableOpacity
                key={y}
                onPress={() => setSelectedYear(y)}
                style={[styles.yearBtn, selectedYear === y && styles.yearBtnActive]}
              >
                <Text style={[styles.yearBtnText, selectedYear === y && styles.yearBtnTextActive]}>
                  {y}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </GlassCard>

      {/* Pré-visualização do Relatório (A4 Clean) */}
      <View style={styles.previewContainer}>
        <GlassCard padding={24} style={styles.previewCard}>
          {/* Cabeçalho Oficial do Documento */}
          <View style={styles.officialHeader}>
            <View style={styles.emblemContainer}>
              <TourosEmblem width={55} height={55} customUri={settings.logoPrefeituraUrl} />
            </View>

            <View style={styles.officialHeaderTextContainer}>
              <Text style={styles.docCity}>PREFEITURA MUNICIPAL DE TOUROS</Text>
              <Text style={styles.docSec}>SECRETARIA MUNICIPAL DE EDUCAÇÃO E CULTURA — SMEC</Text>
              <Text style={styles.docState}>ESTADO DO RIO GRANDE DO NORTE</Text>
              <View style={styles.docPill}>
                <Text style={styles.docPillText}>
                  PRESTAÇÃO DE CONTAS ANUAL • EXERCÍCIO {selectedYear}
                </Text>
              </View>
            </View>

            <View style={styles.emblemContainer}>
              <SmecLogo width={55} height={55} customUri={settings.logoSmecUrl} />
            </View>
          </View>

          {/* Dados do Setor */}
          <View style={styles.sectorInfoBox}>
            <View style={styles.sectorInfoLeft}>
              <Text style={styles.sectorNameText}>{sector.name} ({sector.code})</Text>
              <Text style={styles.sectorCoordText}>
                Coordenador(a): <Text style={styles.boldText}>{sector.coordinatorName}</Text> — {sector.coordinatorRole}
              </Text>
              <Text style={styles.sectorDescText}>{sector.description}</Text>
            </View>
            <View style={styles.sectorInfoRight}>
              <Text style={styles.metaSmallText}>E-mail: {sector.email}</Text>
              <Text style={styles.metaSmallText}>Telefone: {sector.phone}</Text>
              <Text style={styles.metaSmallText}>Emissão: {new Date().toLocaleDateString('pt-BR')}</Text>
            </View>
          </View>

          {/* Cards de Métricas */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{stats.total}</Text>
              <Text style={styles.metricLabel}>Total Geral</Text>
            </View>
            <View style={[styles.metricCard, { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }]}>
              <Text style={[styles.metricVal, { color: '#15803D' }]}>{stats.concluidas}</Text>
              <Text style={[styles.metricLabel, { color: '#166534' }]}>100% Concluídas ({stats.taxaConclusao}%)</Text>
            </View>
            <View style={[styles.metricCard, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }]}>
              <Text style={[styles.metricVal, { color: '#B45309' }]}>{stats.parciais}</Text>
              <Text style={[styles.metricLabel, { color: '#92400E' }]}>Parciais</Text>
            </View>
            <View style={[styles.metricCard, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
              <Text style={[styles.metricVal, { color: '#B91C1C' }]}>{stats.naoConcluidas}</Text>
              <Text style={[styles.metricLabel, { color: '#991B1B' }]}>Não Concluídas</Text>
            </View>
          </View>

          {/* Submétricas: Origem das Demandas */}
          <View style={styles.originsBreakdown}>
            <View style={styles.originPill}>
              <Text style={styles.originPillText}>📄 {stats.oficiosAtendidos} Ofícios Formais do RH</Text>
            </View>
            <View style={styles.originPill}>
              <Text style={styles.originPillText}>📨 {stats.demandasAtribuidas} Atribuídas pelo RH</Text>
            </View>
            <View style={styles.originPill}>
              <Text style={styles.originPillText}>⚡ {stats.acoesProprias} Ações Próprias do Setor</Text>
            </View>
          </View>

          {/* Seção 1: 100% Concluídas */}
          <View style={styles.reportSection}>
            <View style={[styles.sectionTitleBar, { borderLeftColor: '#15803D' }]}>
              <CheckCircle2 size={16} color="#15803D" />
              <Text style={styles.sectionTitle}>1. Ações e Demandas 100% Concluídas ({concluidas.length})</Text>
            </View>
            {concluidas.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma demanda concluída no período.</Text>
            ) : (
              concluidas.map(d => (
                <View key={d.id} style={styles.itemBox}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{d.title}</Text>
                    <Text style={styles.itemProtocol}>{d.protocolNumber}</Text>
                  </View>
                  <Text style={styles.itemDesc}>{d.description}</Text>
                  {d.resolutionSummary && (
                    <View style={styles.resolutionReportBox}>
                      <Text style={styles.resolutionReportTitle}>Relato da Execução / Resultado:</Text>
                      <Text style={styles.resolutionReportText}>{d.resolutionSummary}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Seção 2: Parciais */}
          <View style={styles.reportSection}>
            <View style={[styles.sectionTitleBar, { borderLeftColor: '#F59E0B' }]}>
              <AlertTriangle size={16} color="#B45309" />
              <Text style={styles.sectionTitle}>2. Demandas com Resolução Parcial ({parciais.length})</Text>
            </View>
            {parciais.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma demanda parcial registrada no período.</Text>
            ) : (
              parciais.map(d => (
                <View key={d.id} style={styles.itemBox}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{d.title}</Text>
                    <Text style={styles.itemProtocol}>{d.protocolNumber}</Text>
                  </View>
                  <Text style={styles.itemDesc}>{d.description}</Text>
                  {d.resolutionSummary && (
                    <View style={styles.resolutionReportBox}>
                      <Text style={styles.resolutionReportTitle}>O que já foi executado:</Text>
                      <Text style={styles.resolutionReportText}>{d.resolutionSummary}</Text>
                    </View>
                  )}
                  {d.bottleneckReason && (
                    <View style={styles.bottleneckReportBox}>
                      <Text style={styles.bottleneckReportTitle}>Gargalo / Pendência Restante:</Text>
                      <Text style={styles.bottleneckReportText}>{d.bottleneckReason}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Seção 3: Não Concluídas */}
          <View style={styles.reportSection}>
            <View style={[styles.sectionTitleBar, { borderLeftColor: '#EF4444' }]}>
              <XCircle size={16} color="#B91C1C" />
              <Text style={styles.sectionTitle}>3. Demandas Não Concluídas / Impedimento Formal ({naoConcluidas.length})</Text>
            </View>
            {naoConcluidas.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum impedimento não concluído registrado no exercício.</Text>
            ) : (
              naoConcluidas.map(d => (
                <View key={d.id} style={styles.itemBox}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{d.title}</Text>
                    <Text style={styles.itemProtocol}>{d.protocolNumber}</Text>
                  </View>
                  <Text style={styles.itemDesc}>{d.description}</Text>
                  <View style={styles.impedimentReportBox}>
                    <Text style={styles.impedimentReportTitle}>Motivo Formal do Impedimento:</Text>
                    <Text style={styles.impedimentReportText}>
                      {d.impedimentReason || 'Impedimento técnico ou orçamentário registrado pelo setor.'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Seção 4: Ofícios Formais Tramitados no Setor */}
          <View style={styles.reportSection}>
            <View style={[styles.sectionTitleBar, { borderLeftColor: '#1E40AF' }]}>
              <FileCheck size={16} color="#1E40AF" />
              <Text style={styles.sectionTitle}>4. Relação de Ofícios Formais Tramitados ({oficios.length})</Text>
            </View>
            {oficios.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum ofício formal tramitado para este setor no exercício.</Text>
            ) : (
              oficios.map(o => (
                <View key={o.id} style={[styles.itemBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemTitle, { color: '#1E40AF' }]}>{o.oficioNumber || o.title}</Text>
                    <Text style={styles.itemProtocol}>{o.status.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.itemDesc}>
                    <Text style={styles.boldText}>Remetente:</Text> {o.oficioSender || 'Admin / RH'} •{' '}
                    <Text style={styles.boldText}>Data:</Text> {o.oficioPhysicalDate || new Date(o.createdAt).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text style={styles.itemDesc}>{o.title}</Text>
                </View>
              ))
            )}
          </View>

          {/* Assinaturas Oficiais */}
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>{sector.coordinatorName}</Text>
              <Text style={styles.signatureRole}>{sector.coordinatorRole}</Text>
              <Text style={styles.signatureRole}>{sector.name}</Text>
            </View>

            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>
                {gabineteLeadership.hasLeader
                  ? (gabineteLeadership.diretor || gabineteLeadership.coordenador)?.fullName || gabineteLeadership.leaderName
                  : 'Secretário(a) Municipal de Educação e Cultura'}
              </Text>
              <Text style={styles.signatureRole}>
                {gabineteLeadership.hasLeader
                  ? gabineteLeadership.leaderRole
                  : 'Gabinete Executivo — SMEC Touros/RN'}
              </Text>
              <Text style={styles.signatureRole}>Prefeitura Municipal de Touros / RN</Text>
            </View>
          </View>
        </GlassCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  content: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  controlCard: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.12)',
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  badgeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  badgeControlText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.4,
  },
  controlTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  controlSubtitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  selectorGroup: {
    gap: 6,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  selectorLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  sectorScroll: {
    flexDirection: 'row',
  },
  sectorBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  sectorBtnText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  yearButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  yearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  yearBtnActive: {
    borderColor: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  yearBtnText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  yearBtnTextActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  previewContainer: {
    width: '100%',
  },
  previewCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  officialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    width: '100%',
    borderBottomWidth: 2,
    borderBottomColor: '#1E40AF',
    paddingBottom: 14,
    marginBottom: 14,
  },
  emblemContainer: {
    width: 55,
    height: 55,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officialHeaderTextContainer: {
    flex: 1,
    flexShrink: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  docCity: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  docSec: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E40AF',
    marginTop: 2,
    textAlign: 'center',
  },
  docState: {
    fontSize: 9.5,
    color: '#475569',
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },
  docPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 999,
    marginTop: 6,
  },
  docPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  sectorInfoBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  sectorInfoLeft: {
    flex: 1,
    flexShrink: 1,
    minWidth: 200,
  },
  sectorInfoRight: {
    justifyContent: 'center',
  },
  sectorNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectorCoordText: {
    fontSize: 11.5,
    color: '#334155',
    marginTop: 2,
  },
  sectorDescText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 14,
  },
  metaSmallText: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 1,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 125,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E40AF',
  },
  metricLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 1,
    textAlign: 'center',
  },
  originsBreakdown: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  originPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  originPillText: {
    fontSize: 10.5,
    color: '#334155',
    fontWeight: '600',
  },
  reportSection: {
    marginBottom: 14,
    gap: 6,
  },
  sectionTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    paddingLeft: 6,
    gap: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  itemBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 10,
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  itemProtocol: {
    fontSize: 9.5,
    color: '#1E40AF',
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 15,
  },
  resolutionReportBox: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 2,
    borderLeftColor: '#15803D',
    padding: 6,
    borderRadius: 4,
    marginTop: 2,
  },
  resolutionReportTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#166534',
  },
  resolutionReportText: {
    fontSize: 11,
    color: '#14532D',
    marginTop: 1,
  },
  bottleneckReportBox: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 2,
    borderLeftColor: '#F59E0B',
    padding: 6,
    borderRadius: 4,
    marginTop: 2,
  },
  bottleneckReportTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
  },
  bottleneckReportText: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 1,
  },
  impedimentReportBox: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 2,
    borderLeftColor: '#EF4444',
    padding: 6,
    borderRadius: 4,
    marginTop: 2,
  },
  impedimentReportTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B91C1C',
  },
  impedimentReportText: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 1,
  },
  emptyText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    paddingLeft: 6,
  },
  signatureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 12,
    gap: 20,
  },
  signatureBox: {
    flex: 1,
    minWidth: 220,
    alignItems: 'center',
  },
  signatureLine: {
    width: '80%',
    height: 1,
    backgroundColor: '#64748B',
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  signatureRole: {
    fontSize: 9.5,
    color: '#64748B',
    textAlign: 'center',
  },
});
