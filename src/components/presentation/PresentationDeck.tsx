import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Polygon, Circle } from 'react-native-svg';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Send,
  ShieldCheck,
  Lock,
  HeartHandshake,
  FileSpreadsheet,
  Sparkles,
  Clock,
  UserCheck,
  Activity,
  Eye,
  Printer,
} from 'lucide-react-native';
import { SECTORS } from '../../constants/sectors';
import { Sector } from '../../types';

interface PresentationDeckProps {
  onExit: () => void;
}

const TOTAL_SLIDES = 6;

interface SimulatedSectorMetric {
  efficiency: number;
  done: number;
  total: number;
  statusLabel: '100% Concluído' | 'Fluxo em Dia' | 'Gargalo Monitorado';
  statusTone: 'emerald' | 'cyan' | 'amber';
}

const SIMULATED_SECTOR_METRICS: Record<string, SimulatedSectorMetric> = {
  suporte_ti: { efficiency: 100, done: 42, total: 42, statusLabel: '100% Concluído', statusTone: 'emerald' },
  admin_rh: { efficiency: 100, done: 68, total: 68, statusLabel: '100% Concluído', statusTone: 'emerald' },
  gabinete: { efficiency: 100, done: 35, total: 35, statusLabel: '100% Concluído', statusTone: 'emerald' },
  pedagogico: { efficiency: 94, done: 49, total: 52, statusLabel: 'Fluxo em Dia', statusTone: 'cyan' },
  avaliacao: { efficiency: 100, done: 24, total: 24, statusLabel: '100% Concluído', statusTone: 'emerald' },
  cultura: { efficiency: 92, done: 23, total: 25, statusLabel: 'Fluxo em Dia', statusTone: 'cyan' },
  multidisciplinar: { efficiency: 96, done: 44, total: 46, statusLabel: 'Fluxo em Dia', statusTone: 'cyan' },
  transporte: { efficiency: 82, done: 31, total: 38, statusLabel: 'Gargalo Monitorado', statusTone: 'amber' },
  alimentacao: { efficiency: 100, done: 39, total: 39, statusLabel: '100% Concluído', statusTone: 'emerald' },
  esportes: { efficiency: 100, done: 19, total: 19, statusLabel: '100% Concluído', statusTone: 'emerald' },
  busca_ativa: { efficiency: 95, done: 38, total: 40, statusLabel: 'Fluxo em Dia', statusTone: 'cyan' },
  comunicacao: { efficiency: 100, done: 29, total: 29, statusLabel: '100% Concluído', statusTone: 'emerald' },
  logistica: { efficiency: 84, done: 27, total: 32, statusLabel: 'Gargalo Monitorado', statusTone: 'amber' },
  estatistica: { efficiency: 100, done: 21, total: 21, statusLabel: '100% Concluído', statusTone: 'emerald' },
  prestacao_contas: { efficiency: 100, done: 33, total: 33, statusLabel: '100% Concluído', statusTone: 'emerald' },
};

const PrismaVectorEmblem: React.FC<{ size?: number }> = ({ size = 124 }) => (
  <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
    <Defs>
      <LinearGradient id="prismaLeftFace" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#38BDF8" />
        <Stop offset="55%" stopColor="#2563EB" />
        <Stop offset="100%" stopColor="#1D4ED8" />
      </LinearGradient>
      <LinearGradient id="prismaRightFace" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#3B82F6" />
        <Stop offset="55%" stopColor="#6366F1" />
        <Stop offset="100%" stopColor="#C084FC" />
      </LinearGradient>
      <LinearGradient id="prismaInnerLeft" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#0F172A" />
        <Stop offset="100%" stopColor="#1E3A8A" />
      </LinearGradient>
      <LinearGradient id="prismaInnerRight" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#1E1B4B" />
        <Stop offset="100%" stopColor="#4338CA" />
      </LinearGradient>
      <LinearGradient id="prismaBase" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#1D4ED8" />
        <Stop offset="50%" stopColor="#3B82F6" />
        <Stop offset="100%" stopColor="#9333EA" />
      </LinearGradient>
    </Defs>

    <Circle cx="80" cy="86" r="64" fill="rgba(59, 130, 246, 0.12)" />
    <Polygon points="80,18 20,132 80,82" fill="url(#prismaLeftFace)" />
    <Polygon points="80,18 140,132 80,82" fill="url(#prismaRightFace)" />
    <Polygon points="80,82 20,132 80,116" fill="url(#prismaInnerLeft)" />
    <Polygon points="80,82 140,132 80,116" fill="url(#prismaInnerRight)" />
    <Polygon points="20,132 140,132 80,116" fill="url(#prismaBase)" />
    <Path
      d="M80 18 L20 132 L140 132 Z"
      stroke="rgba(248, 250, 252, 0.38)"
      strokeWidth="1.2"
    />
    <Path
      d="M80 18 L80 116"
      stroke="rgba(248, 250, 252, 0.48)"
      strokeWidth="1.2"
    />
  </Svg>
);

export const PresentationDeck: React.FC<PresentationDeckProps> = ({ onExit }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 840;

  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedSector, setSelectedSector] = useState<Sector>(SECTORS[0]);
  const [activeTraceStep, setActiveTraceStep] = useState<number>(3);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev < TOTAL_SLIDES - 1 ? prev + 1 : prev));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : prev));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } catch {
      // Ignora bloqueio de permissão do navegador
    }
  }, []);

  // Transições cinéticas estilo Apple / Linear Keynote (fade-in + translateY: 10px -> 0px)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const styleId = 'prisma-executive-keynote-css';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        @keyframes prismaKeynoteEnter {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px);
          }
        }
        .prisma-keynote-stage {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          animation: prismaKeynoteEnter 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  // Controles de Teclado: ArrowRight / Space, ArrowLeft, F e ESC
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (typeof document !== 'undefined' && document.fullscreenElement) {
          document.exitFullscreen?.();
          setIsFullscreen(false);
        } else {
          onExit();
        }
      }
    };

    const handleFullscreenChange = () => {
      if (typeof document !== 'undefined') {
        setIsFullscreen(Boolean(document.fullscreenElement));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [nextSlide, prevSlide, toggleFullscreen, onExit]);

  const progressPercentage = ((currentSlide + 1) / TOTAL_SLIDES) * 100;
  const formattedSlideCounter = `${String(currentSlide + 1).padStart(2, '0')} / ${String(
    TOTAL_SLIDES
  ).padStart(2, '0')}`;

  const renderSlideContent = () => {
    switch (currentSlide) {
      // =====================================================================
      // SLIDE 1: CAPA INSTITUCIONAL
      // =====================================================================
      case 0:
        return (
          <View style={styles.slideCenterContainer}>
            <View style={styles.coverEmblemBox}>
              <PrismaVectorEmblem size={isMobile ? 104 : 132} />
            </View>

            <View style={styles.chancelaPill}>
              <Sparkles size={13} color="#38BDF8" />
              <Text style={styles.chancelaPillText}>
                Secretaria Municipal de Educação e Cultura • Touros/RN
              </Text>
            </View>

            <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
              PROJETO <Text style={styles.accentRoyalText}>PRISMA</Text>
            </Text>

            <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
              Governança Digital & Controle Executivo em Tempo Real
            </Text>

            {/* Réplica Vetorial de Indicadores Executivos */}
            <View style={[styles.coverReplicaStrip, isMobile && styles.coverReplicaStripMobile]}>
              <View style={styles.coverReplicaItem}>
                <View style={styles.replicaLiveDot} />
                <View>
                  <Text style={styles.coverReplicaValue}>15 Coordenações</Text>
                  <Text style={styles.coverReplicaLabel}>Monitoradas em Tela Única</Text>
                </View>
              </View>

              <View style={styles.coverReplicaDivider} />

              <View style={styles.coverReplicaItem}>
                <ShieldCheck size={18} color="#3B82F6" />
                <View>
                  <Text style={styles.coverReplicaValue}>100% Rastreável</Text>
                  <Text style={styles.coverReplicaLabel}>Protocolo Nominal & SLA</Text>
                </View>
              </View>

              <View style={styles.coverReplicaDivider} />

              <View style={styles.coverReplicaItem}>
                <FileSpreadsheet size={18} color="#38BDF8" />
                <View>
                  <Text style={styles.coverReplicaValue}>Relatório A4 Oficial</Text>
                  <Text style={styles.coverReplicaLabel}>Exportação Instantânea TCE</Text>
                </View>
              </View>
            </View>

            <Text style={styles.coverFooterCredit}>
              Engenharia e Infraestrutura por{' '}
              <Text style={styles.coverFooterCreditBold}>PROTHOTYPE</Text> • Exercício 2026
            </Text>
          </View>
        );

      // =====================================================================
      // SLIDE 2: O DIAGNÓSTICO DA GESTÃO (O PROBLEMA DO "LIMBO")
      // =====================================================================
      case 1:
        return (
          <View style={styles.slideBlockContainer}>
            <View style={styles.slideHeaderBlock}>
              <Text style={styles.slideKicker}>02 • DIAGNÓSTICO DA GESTÃO</Text>
              <Text style={[styles.slideTitle, isMobile && styles.slideTitleMobile]}>
                O Fim da <Text style={styles.accentRoyalText}>Cegueira Operacional</Text>
              </Text>
              <Text style={styles.slideLead}>
                Elimine o "limbo administrativo" onde demandas urgentes desaparecem entre mesas e
                mensagens informais sem retorno formal ao Gabinete.
              </Text>
            </View>

            <View style={[styles.comparisonGrid, isMobile && styles.comparisonGridMobile]}>
              {/* Bloco 1: Antes (Fluxo Fragmentado) */}
              <View style={[styles.comparisonCard, styles.comparisonCardLegacy]}>
                <View style={styles.comparisonCardHeader}>
                  <View style={styles.legacyIconBadge}>
                    <AlertTriangle size={18} color="#F87171" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.comparisonTagLegacy}>ANTES • FLUXO FRAGMENTADO</Text>
                    <Text style={styles.comparisonCardTitle}>O Limbo Informacional</Text>
                  </View>
                </View>

                {/* Réplica Vetorial de Demanda Perdida */}
                <View style={styles.mockCardLegacy}>
                  <View style={styles.mockCardRowBetween}>
                    <Text style={styles.mockLegacyProto}>OFÍCIO FÍSICO S/N</Text>
                    <View style={styles.mockBadgeDanger}>
                      <Text style={styles.mockBadgeDangerText}>PARADO HÁ 14 DIAS</Text>
                    </View>
                  </View>
                  <Text style={styles.mockLegacyDesc}>
                    "Encaminhado no grupo de WhatsApp — sem responsável nominal definido."
                  </Text>
                </View>

                <View style={styles.comparisonList}>
                  {[
                    'Ofícios em papel sem rastreamento de quem recebeu ou onde está parado.',
                    'Demandas críticas perdidas em conversas de WhatsApp sem valor de protocolo.',
                    'Cobrança reativa e desgastante, sem histórico formal para prestação de contas.',
                  ].map((item, idx) => (
                    <View key={idx} style={styles.comparisonItemRow}>
                      <View style={styles.bulletDotRed} />
                      <Text style={styles.comparisonItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Bloco 2: Com o PRISMA (Controle Ativo) */}
              <View style={[styles.comparisonCard, styles.comparisonCardPrisma]}>
                <View style={styles.comparisonCardHeader}>
                  <View style={styles.prismaIconBadge}>
                    <CheckCircle2 size={18} color="#38BDF8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.comparisonTagPrisma}>COM O PRISMA • CONTROLE ATIVO</Text>
                    <Text style={styles.comparisonCardTitle}>Visibilidade Total do Gabinete</Text>
                  </View>
                </View>

                {/* Réplica Vetorial de Card Homologado no Sistema */}
                <View style={styles.mockCardPrisma}>
                  <View style={styles.mockCardRowBetween}>
                    <Text style={styles.mockPrismaProto}>PROTO SMEC-2026-0142</Text>
                    <View style={styles.mockBadgeSuccess}>
                      <CheckCircle2 size={11} color="#34D399" />
                      <Text style={styles.mockBadgeSuccessText}>100% HOMOLOGADO</Text>
                    </View>
                  </View>
                  <Text style={styles.mockPrismaDesc}>
                    Setor Destino: Pedagógico (PED-SMEC) • Parecer Técnico Arquivado
                  </Text>
                </View>

                <View style={styles.comparisonList}>
                  {[
                    'Central única com protocolo digital gerado na entrada (Setor Administrativo/RH).',
                    'Responsáveis formais designados em cada uma das 15 coordenações da SMEC.',
                    'Prazos transparentes, registro de gargalos e auditoria em tempo real.',
                  ].map((item, idx) => (
                    <View key={idx} style={styles.comparisonItemRow}>
                      <View style={styles.bulletDotBlue} />
                      <Text style={styles.comparisonItemTextHighlight}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        );

      // =====================================================================
      // SLIDE 3: O PAINEL DE CONTROLE DOS 15 SETORES
      // =====================================================================
      case 2: {
        const selectedMetrics =
          SIMULATED_SECTOR_METRICS[selectedSector.id] || SIMULATED_SECTOR_METRICS.suporte_ti;

        return (
          <View style={styles.slideBlockContainer}>
            <View style={styles.slideHeaderBlock}>
              <Text style={styles.slideKicker}>03 • PANORAMA EM TEMPO REAL DOS 15 SETORES</Text>
              <Text style={[styles.slideTitle, isMobile && styles.slideTitleMobile]}>
                A Secretaria Inteira em <Text style={styles.accentRoyalText}>Uma Única Tela</Text>
              </Text>
              <Text style={styles.slideLead}>
                O Secretário bate o olho e identifica imediatamente quais setores estão com{' '}
                <Text style={{ color: '#38BDF8', fontWeight: '700' }}>100% Concluído</Text> e onde
                existem gargalos ou pendências — sem precisar ligar ou convocar reunião de emergência.
              </Text>
            </View>

            {/* Grid Vetorial Estilizado dos 15 Setores com Barras de Eficiência */}
            <View style={styles.sectorsMosaicGrid}>
              {SECTORS.map(sec => {
                const isSelected = selectedSector.id === sec.id;
                const metric =
                  SIMULATED_SECTOR_METRICS[sec.id] || SIMULATED_SECTOR_METRICS.suporte_ti;
                const barColor =
                  metric.statusTone === 'emerald'
                    ? '#10B981'
                    : metric.statusTone === 'cyan'
                    ? '#38BDF8'
                    : '#F59E0B';

                return (
                  <TouchableOpacity
                    key={sec.id}
                    activeOpacity={0.82}
                    onPress={() => setSelectedSector(sec)}
                    style={[styles.sectorTile, isSelected && styles.sectorTileActive]}
                  >
                    <View style={styles.sectorTileHeader}>
                      <Text
                        style={[
                          styles.sectorTileCode,
                          isSelected && { color: '#38BDF8' },
                        ]}
                      >
                        {sec.code}
                      </Text>
                      <Text style={[styles.sectorTileEff, { color: barColor }]}>
                        {metric.efficiency}%
                      </Text>
                    </View>

                    <Text style={styles.sectorTileName} numberOfLines={1}>
                      {sec.shortName}
                    </Text>

                    <View style={styles.sectorMiniBarTrack}>
                      <View
                        style={[
                          styles.sectorMiniBarFill,
                          { width: `${metric.efficiency}%`, backgroundColor: barColor },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Réplica Vetorial do Card de Inspeção do Setor Selecionado */}
            <View style={styles.sectorInspectorBar}>
              <View style={styles.sectorInspectorLeft}>
                <View style={styles.sectorInspectorTopRow}>
                  <View style={styles.sectorInspectorBadge}>
                    <Eye size={14} color="#38BDF8" />
                    <Text style={styles.sectorInspectorCode}>{selectedSector.code}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPillReplica,
                      selectedMetrics.statusTone === 'emerald' && styles.statusPillEmerald,
                      selectedMetrics.statusTone === 'cyan' && styles.statusPillCyan,
                      selectedMetrics.statusTone === 'amber' && styles.statusPillAmber,
                    ]}
                  >
                    <Text style={styles.statusPillReplicaText}>
                      {selectedMetrics.statusLabel} ({selectedMetrics.done}/{selectedMetrics.total})
                    </Text>
                  </View>
                </View>
                <Text style={styles.sectorInspectorTitle}>{selectedSector.name}</Text>
                <Text style={styles.sectorInspectorDesc}>{selectedSector.description}</Text>
              </View>

              <View style={styles.sectorInspectorRight}>
                <Text style={styles.inspectorEfficiencyNumber}>{selectedMetrics.efficiency}%</Text>
                <Text style={styles.inspectorEfficiencyCaption}>TAXA DE RESOLUÇÃO</Text>
              </View>
            </View>
          </View>
        );
      }

      // =====================================================================
      // SLIDE 4: RASTREABILIDADE NOMINAL DE OFÍCIOS
      // =====================================================================
      case 3: {
        const traceSteps = [
          {
            step: '01',
            title: 'Entrada no Protocolo',
            actor: 'Setor Administrativo / RH (ADM-RH)',
            timestamp: '10/03/2026 às 08:42',
            detail:
              'Ofício externo ou demanda cadastrada com anexo PDF original e número único SMEC-2026-0184.',
            icon: FileText,
          },
          {
            step: '02',
            title: 'Despacho Nominal ao Setor',
            actor: 'Triagem Central ➔ Coordenação Destino',
            timestamp: '10/03/2026 às 08:45',
            detail:
              'Vinculação imediata ao mural exclusivo da coordenação responsável com nível de prioridade definido.',
            icon: Send,
          },
          {
            step: '03',
            title: 'Responsável Assumido',
            actor: 'Coordenação Titular do Setor',
            timestamp: '10/03/2026 às 09:15',
            detail:
              'Ciência registrada automaticamente. Caso exista impedimento externo, o gargalo é justificado formalmente.',
            icon: UserCheck,
          },
          {
            step: '04',
            title: 'Atendimento 100% Homologado',
            actor: 'Parecer Técnico & Baixa Auditável',
            timestamp: '11/03/2026 às 14:20',
            detail:
              'Demanda concluída com relato técnico, data/hora exata e integração imediata ao Relatório Anual.',
            icon: CheckCircle2,
          },
        ];

        const currentTrace = traceSteps[activeTraceStep];

        return (
          <View style={styles.slideBlockContainer}>
            <View style={styles.slideHeaderBlock}>
              <Text style={styles.slideKicker}>04 • RASTREABILIDADE NOMINAL DE OFÍCIOS</Text>
              <Text style={[styles.slideTitle, isMobile && styles.slideTitleMobile]}>
                Rastreabilidade Absoluta:{' '}
                <Text style={styles.accentRoyalText}>Fim do "Ninguém me Avisou"</Text>
              </Text>
              <Text style={styles.slideLead}>
                Cada documento oficial percorre uma linha de custódia transparente onde toda ação
                registra data, hora e servidor responsável.
              </Text>
            </View>

            {/* Esteira Interativa de 4 Passos */}
            <View style={[styles.timelineRow, isMobile && styles.timelineRowMobile]}>
              {traceSteps.map((st, idx) => {
                const IconComp = st.icon;
                const isSelected = idx === activeTraceStep;
                return (
                  <TouchableOpacity
                    key={st.step}
                    activeOpacity={0.85}
                    onPress={() => setActiveTraceStep(idx)}
                    style={[
                      styles.timelineStepCard,
                      isSelected && styles.timelineStepCardActive,
                    ]}
                  >
                    <View style={styles.timelineStepTop}>
                      <Text
                        style={[
                          styles.timelineStepBadge,
                          isSelected && { color: '#38BDF8' },
                        ]}
                      >
                        ETAPA {st.step}
                      </Text>
                      <View
                        style={[
                          styles.timelineIconCircle,
                          isSelected && styles.timelineIconCircleActive,
                        ]}
                      >
                        <IconComp size={15} color={isSelected ? '#F8FAFC' : '#94A3B8'} />
                      </View>
                    </View>
                    <Text style={styles.timelineStepTitle}>{st.title}</Text>
                    <Text style={styles.timelineStepTime}>{st.timestamp}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Réplica Vetorial do Registro de Auditoria Nominal */}
            <View style={styles.lifecycleSpotlightCard}>
              <View style={styles.lifecycleSpotlightLeft}>
                <View style={styles.auditHeaderRow}>
                  <View style={styles.auditStampPill}>
                    <Clock size={12} color="#38BDF8" />
                    <Text style={styles.auditStampText}>REGISTRO OFICIAL • {currentTrace.timestamp}</Text>
                  </View>
                  <View style={styles.auditVerifiedBadge}>
                    <ShieldCheck size={12} color="#34D399" />
                    <Text style={styles.auditVerifiedText}>ASSINATURA DE SESSÃO VERIFICADA</Text>
                  </View>
                </View>

                <Text style={styles.lifecycleSpotlightTitle}>{currentTrace.title}</Text>
                <Text style={styles.lifecycleActorText}>
                  Agente Responsável: <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>{currentTrace.actor}</Text>
                </Text>
                <Text style={styles.lifecycleSpotlightDesc}>{currentTrace.detail}</Text>
              </View>
            </View>
          </View>
        );
      }

      // =====================================================================
      // SLIDE 5: PRESTAÇÃO DE CONTAS & GOVERNANÇA DE ACESSO EXECUTIVO
      // =====================================================================
      case 4:
        return (
          <View style={styles.slideBlockContainer}>
            <View style={styles.slideHeaderBlock}>
              <Text style={styles.slideKicker}>05 • PRESTAÇÃO DE CONTAS & GOVERNANÇA DE DADOS</Text>
              <Text style={[styles.slideTitle, isMobile && styles.slideTitleMobile]}>
                Auditoria Contínua & <Text style={styles.accentRoyalText}>Comando Executivo</Text>
              </Text>
              <Text style={styles.slideLead}>
                Respaldo documental imediato para órgãos externos aliado a uma arquitetura segura de
                permissões com visão global dedicada ao Secretário e ao Secretário Adjunto.
              </Text>
            </View>

            <View style={[styles.comparisonGrid, isMobile && styles.comparisonGridMobile]}>
              {/* Card 1: Relatório Anual A4 Instantâneo */}
              <View style={[styles.securityFeatureCard, styles.securityCardHighlight]}>
                <View style={styles.securityFeatureTop}>
                  <View style={styles.securityIconBox}>
                    <Printer size={20} color="#38BDF8" />
                  </View>
                  <View style={styles.securityMetricBadge}>
                    <Text style={styles.securityMetricBadgeText}>EXPORTAÇÃO EM 1 CLIQUE</Text>
                  </View>
                </View>

                <Text style={styles.securityCardTitle}>Relatório Anual A4 Instantâneo</Text>
                <Text style={styles.securityCardDesc}>
                  Consolidação imediata das ações executadas, ofícios atendidos e taxas de eficiência
                  em formato oficial timbrado para o TCE/RN, Ministério Público e Conselhos Municipais
                  (FUNDEB e CAE).
                </Text>

                {/* Réplica Vetorial de Folha Oficial A4 */}
                <View style={styles.a4ReplicaBox}>
                  <View style={styles.a4ReplicaHeader}>
                    <FileSpreadsheet size={15} color="#3B82F6" />
                    <Text style={styles.a4ReplicaTitle}>
                      RELATÓRIO ANUAL DE GESTÃO — SMEC TOUROS/RN (A4 PDF)
                    </Text>
                  </View>
                  <View style={styles.a4ReplicaStatsRow}>
                    <Text style={styles.a4ReplicaStatPill}>✓ Timbre Oficial</Text>
                    <Text style={styles.a4ReplicaStatPill}>✓ KPIs por Coordenação</Text>
                    <Text style={styles.a4ReplicaStatPill}>✓ Assinatura Titular</Text>
                  </View>
                </View>
              </View>

              {/* Card 2: Segurança de Dados & Acesso Executivo do Secretário e Adjunto */}
              <View style={styles.securityFeatureCard}>
                <View style={styles.securityFeatureTop}>
                  <View style={styles.securityIconBox}>
                    <Lock size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.securityMetricBadge}>
                    <ShieldCheck size={11} color="#93C5FD" />
                    <Text style={styles.securityMetricBadgeText}>CREDENCIAIS HIERÁRQUICAS RLS</Text>
                  </View>
                </View>

                <Text style={styles.securityCardTitle}>
                  Segurança de Dados & Visão do Secretário e Adjunto
                </Text>
                <Text style={styles.securityCardDesc}>
                  Cada coordenação opera em seu ambiente exclusivo sem interferência externa, enquanto
                  o Secretário Municipal e o Secretário Adjunto contam com acesso administrativo de
                  supervisão global sobre toda a Secretaria.
                </Text>

                {/* Réplica Vetorial de Governança de Acesso Executivo */}
                <View style={styles.a4ReplicaBox}>
                  <View style={styles.a4ReplicaHeader}>
                    <ShieldCheck size={15} color="#34D399" />
                    <Text style={styles.a4ReplicaTitle}>
                      GOVERNANÇA DE ACESSO & CRIPTOGRAFIA EM NUVEM
                    </Text>
                  </View>
                  <View style={styles.a4ReplicaStatsRow}>
                    <Text style={styles.a4ReplicaStatPill}>✓ Supervisão Secretário & Adjunto</Text>
                    <Text style={styles.a4ReplicaStatPill}>✓ Isolamento por Setor</Text>
                    <Text style={styles.a4ReplicaStatPill}>✓ Homologação TI-SMEC</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );

      // =====================================================================
      // SLIDE 6: CONCLUSÃO EXECUTIVA
      // =====================================================================
      case 5:
        return (
          <View style={styles.slideBlockContainer}>
            <View style={styles.slideHeaderBlock}>
              <Text style={styles.slideKicker}>06 • CONCLUSÃO EXECUTIVA</Text>
              <Text style={[styles.slideTitle, isMobile && styles.slideTitleMobile]}>
                Educação Conectada. <Text style={styles.accentRoyalText}>Gestão Sob Controle.</Text>
              </Text>
              <Text style={styles.slideLead}>
                Menos tempo administrando ruído interno, mais agilidade para as decisões pedagógicas e
                estruturais do município de Touros/RN.
              </Text>
            </View>

            <View style={[styles.impactKpiGrid, isMobile && styles.impactKpiGridMobile]}>
              <View style={styles.impactKpiCard}>
                <Activity size={20} color="#38BDF8" />
                <Text style={styles.impactKpiValue}>Tempo Real</Text>
                <Text style={styles.impactKpiLabel}>Visão Executiva Imediata</Text>
                <Text style={styles.impactKpiSub}>
                  Acompanhamento simultâneo das 15 coordenações da SMEC sem depender de relatórios manuais.
                </Text>
              </View>

              <View style={styles.impactKpiCard}>
                <CheckCircle2 size={20} color="#3B82F6" />
                <Text style={styles.impactKpiValue}>Zero Limbo</Text>
                <Text style={styles.impactKpiLabel}>Responsabilidade Nominal</Text>
                <Text style={styles.impactKpiSub}>
                  Todo ofício protocolado possui setor de destino, prazo e histórico auditável de ponta a ponta.
                </Text>
              </View>

              <View style={styles.impactKpiCard}>
                <ShieldCheck size={20} color="#34D399" />
                <Text style={styles.impactKpiValue}>100% Seguro</Text>
                <Text style={styles.impactKpiLabel}>Memória Institucional</Text>
                <Text style={styles.impactKpiSub}>
                  Acervo digital permanente na nuvem com conformidade LGPD e relatórios prontos para o TCE.
                </Text>
              </View>
            </View>

            <View style={styles.ctaConclusionBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaConclusionTitle}>
                  Projeto PRISMA — Pronto para Operação Executiva
                </Text>
                <Text style={styles.ctaConclusionSub}>
                  Secretaria Municipal de Educação e Cultura de Touros/RN • PROTHOTYPE
                </Text>
              </View>

              <TouchableOpacity
                onPress={onExit}
                activeOpacity={0.85}
                style={styles.ctaLaunchButton}
              >
                <Text style={styles.ctaLaunchButtonText}>🚀 Abrir Painel Operacional</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.deckRoot}>
      {/* Iluminação Ambiente Difusa em Azul Marinho (#1E3A8A) */}
      <View style={styles.ambientGlowTop} pointerEvents="none" />
      <View style={styles.ambientGlowBottom} pointerEvents="none" />

      {/* Barra de Progresso Linear Discreta no Topo */}
      <View style={styles.topProgressTrack}>
        <View style={[styles.topProgressFill, { width: `${progressPercentage}%` }]} />
      </View>

      {/* Cabeçalho Minimalista de Keynote */}
      <View style={styles.deckTopBar}>
        <View style={styles.deckTopBrand}>
          <View style={styles.deckBrandDot} />
          <Text style={styles.deckBrandText}>PROJETO PRISMA • KEYNOTE EXECUTIVO</Text>
        </View>

        <View style={styles.deckTopControls}>
          <View style={styles.slideCounterPill}>
            <Text style={styles.slideCounterText}>{formattedSlideCounter}</Text>
          </View>

          {Platform.OS === 'web' && (
            <TouchableOpacity
              onPress={toggleFullscreen}
              style={styles.iconControlBtn}
              activeOpacity={0.75}
            >
              {isFullscreen ? (
                <Minimize2 size={15} color="#94A3B8" />
              ) : (
                <Maximize2 size={15} color="#94A3B8" />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onExit}
            style={styles.exitDeckBtn}
            activeOpacity={0.8}
          >
            <X size={14} color="#F8FAFC" />
            <Text style={styles.exitDeckBtnText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Palco Central com Transição Cinética */}
      <ScrollView
        key={`slide-${currentSlide}`}
        style={styles.stageScroll}
        contentContainerStyle={styles.stageScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={styles.slideViewport}
          // @ts-ignore - classe CSS web para animação cubic-bezier(0.16, 1, 0.3, 1)
          className="prisma-keynote-stage"
        >
          {renderSlideContent()}
        </View>
      </ScrollView>

      {/* Barra Inferior Mínima de Apoio */}
      <View style={styles.deckBottomBar}>
        <Text style={styles.shortcutHintText}>
          [←] [→] Navegar • [F] Tela Cheia • [ESC] Sair
        </Text>

        <View style={styles.navArrowsGroup}>
          <TouchableOpacity
            onPress={prevSlide}
            disabled={currentSlide === 0}
            style={[
              styles.navArrowBtn,
              currentSlide === 0 && styles.navArrowBtnDisabled,
            ]}
          >
            <ChevronLeft size={18} color={currentSlide === 0 ? '#475569' : '#F8FAFC'} />
          </TouchableOpacity>

          <View style={styles.dotsIndicatorRow}>
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setCurrentSlide(idx)}
                style={[
                  styles.slideDot,
                  idx === currentSlide && styles.slideDotActive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={nextSlide}
            disabled={currentSlide === TOTAL_SLIDES - 1}
            style={[
              styles.navArrowBtn,
              currentSlide === TOTAL_SLIDES - 1 && styles.navArrowBtnDisabled,
            ]}
          >
            <ChevronRight
              size={18}
              color={currentSlide === TOTAL_SLIDES - 1 ? '#475569' : '#F8FAFC'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  deckRoot: {
    flex: 1,
    backgroundColor: '#0B1120',
    position: 'relative',
    overflow: 'hidden',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -180,
    left: '14%',
    width: 640,
    height: 420,
    borderRadius: 320,
    backgroundColor: '#1E3A8A',
    opacity: 0.3,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(115px)' } as any) : {}),
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -200,
    right: '10%',
    width: 580,
    height: 380,
    borderRadius: 290,
    backgroundColor: '#1E3A8A',
    opacity: 0.24,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(120px)' } as any) : {}),
  },
  topProgressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(148, 163, 184, 0.14)',
    zIndex: 20,
  },
  topProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    ...(Platform.OS === 'web'
      ? ({ transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' } as any)
      : {}),
  },
  deckTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.10)',
    zIndex: 10,
  },
  deckTopBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deckBrandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  deckBrandText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.1,
  },
  deckTopControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slideCounterPill: {
    backgroundColor: 'rgba(30, 58, 138, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.38)',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 999,
  },
  slideCounterText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.7,
  },
  iconControlBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitDeckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
  },
  exitDeckBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  stageScroll: {
    flex: 1,
  },
  stageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  slideViewport: {
    width: '100%',
    maxWidth: 1080,
    justifyContent: 'center',
  },
  slideCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  coverEmblemBox: {
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chancelaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(30, 58, 138, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  chancelaPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#BAE6FD',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 54,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -1.2,
    textAlign: 'center',
    marginBottom: 10,
  },
  heroTitleMobile: {
    fontSize: 36,
  },
  accentRoyalText: {
    color: '#3B82F6',
  },
  heroSubtitle: {
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 29,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 720,
    marginBottom: 30,
  },
  heroSubtitleMobile: {
    fontSize: 16,
    lineHeight: 23,
  },
  coverReplicaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.28)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 22,
    gap: 20,
    marginBottom: 26,
  },
  coverReplicaStripMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    gap: 12,
  },
  coverReplicaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  replicaLiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  coverReplicaValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  coverReplicaLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  coverReplicaDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
  },
  coverFooterCredit: {
    fontSize: 12,
    color: '#64748B',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  coverFooterCreditBold: {
    color: '#94A3B8',
    fontWeight: '800',
  },
  slideBlockContainer: {
    width: '100%',
    gap: 20,
  },
  slideHeaderBlock: {
    gap: 6,
  },
  slideKicker: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.2,
  },
  slideTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.6,
  },
  slideTitleMobile: {
    fontSize: 25,
  },
  slideLead: {
    fontSize: 15,
    lineHeight: 23,
    color: '#94A3B8',
    maxWidth: 850,
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: 18,
  },
  comparisonGridMobile: {
    flexDirection: 'column',
  },
  comparisonCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  comparisonCardLegacy: {
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  comparisonCardPrisma: {
    backgroundColor: 'rgba(30, 58, 138, 0.26)',
    borderColor: 'rgba(59, 130, 246, 0.45)',
  },
  comparisonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legacyIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(248, 113, 113, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prismaIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonTagLegacy: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F87171',
    letterSpacing: 0.8,
  },
  comparisonTagPrisma: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  comparisonCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  mockCardLegacy: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.28)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  mockCardPrisma: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  mockCardRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  mockLegacyProto: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
  },
  mockBadgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mockBadgeDangerText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FCA5A5',
  },
  mockLegacyDesc: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  mockPrismaProto: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#38BDF8',
  },
  mockBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mockBadgeSuccessText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  mockPrismaDesc: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  comparisonList: {
    gap: 11,
  },
  comparisonItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F87171',
    marginTop: 7,
  },
  bulletDotBlue: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginTop: 7,
  },
  comparisonItemText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#94A3B8',
  },
  comparisonItemTextHighlight: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  sectorsMosaicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  sectorTile: {
    width: '18.8%',
    minWidth: 165,
    flexGrow: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.74)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 5,
  },
  sectorTileActive: {
    backgroundColor: 'rgba(30, 58, 138, 0.42)',
    borderColor: '#38BDF8',
  },
  sectorTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectorTileCode: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  sectorTileEff: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  sectorTileName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  sectorMiniBarTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
    overflow: 'hidden',
    marginTop: 2,
  },
  sectorMiniBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  sectorInspectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.38)',
    borderRadius: 14,
    padding: 16,
  },
  sectorInspectorLeft: {
    flex: 1,
    minWidth: 240,
    gap: 4,
  },
  sectorInspectorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectorInspectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 58, 138, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7,
  },
  sectorInspectorCode: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  statusPillReplica: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  statusPillEmerald: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  statusPillCyan: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  statusPillAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusPillReplicaText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  sectorInspectorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  sectorInspectorDesc: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
  },
  sectorInspectorRight: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 58, 138, 0.32)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  inspectorEfficiencyNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#38BDF8',
  },
  inspectorEfficiencyCaption: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.7,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineRowMobile: {
    flexDirection: 'column',
  },
  timelineStepCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    borderRadius: 14,
    padding: 15,
    gap: 7,
  },
  timelineStepCardActive: {
    backgroundColor: 'rgba(30, 58, 138, 0.38)',
    borderColor: '#38BDF8',
  },
  timelineStepTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineStepBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  timelineIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconCircleActive: {
    backgroundColor: '#2563EB',
  },
  timelineStepTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  timelineStepTime: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  lifecycleSpotlightCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.38)',
    borderRadius: 16,
    padding: 20,
  },
  lifecycleSpotlightLeft: {
    gap: 6,
  },
  auditHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  auditStampPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 58, 138, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  auditStampText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#BAE6FD',
    letterSpacing: 0.5,
  },
  auditVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  auditVerifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6EE7B7',
  },
  lifecycleSpotlightTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  lifecycleActorText: {
    fontSize: 13.5,
    color: '#38BDF8',
    fontWeight: '600',
  },
  lifecycleSpotlightDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: '#94A3B8',
    marginTop: 2,
  },
  securityFeatureCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.74)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  securityCardHighlight: {
    backgroundColor: 'rgba(30, 58, 138, 0.28)',
    borderColor: 'rgba(59, 130, 246, 0.45)',
  },
  securityFeatureTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securityIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityMetricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(30, 58, 138, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  securityMetricBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#BAE6FD',
    letterSpacing: 0.6,
  },
  securityCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  securityCardDesc: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#94A3B8',
  },
  a4ReplicaBox: {
    backgroundColor: 'rgba(11, 17, 32, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  a4ReplicaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  a4ReplicaTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.4,
  },
  a4ReplicaStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  a4ReplicaStatPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  impactKpiGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  impactKpiGridMobile: {
    flexDirection: 'column',
  },
  impactKpiCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.32)',
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  impactKpiValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#3B82F6',
    letterSpacing: -0.6,
    marginTop: 4,
  },
  impactKpiLabel: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  impactKpiSub: {
    fontSize: 13,
    lineHeight: 19,
    color: '#94A3B8',
  },
  ctaConclusionBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    backgroundColor: 'rgba(30, 58, 138, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    borderRadius: 16,
    padding: 22,
  },
  ctaConclusionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  ctaConclusionSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 3,
  },
  ctaLaunchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderWidth: 1,
    borderColor: '#60A5FA',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 10,
  },
  ctaLaunchButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  deckBottomBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.10)',
    gap: 12,
    zIndex: 10,
  },
  shortcutHintText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  navArrowsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowBtnDisabled: {
    opacity: 0.45,
  },
  dotsIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slideDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
  },
  slideDotActive: {
    width: 22,
    backgroundColor: '#3B82F6',
  },
});
