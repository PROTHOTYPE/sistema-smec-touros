import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { 
  Calendar, 
  Paperclip, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Building2,
  Hash,
  FileText,
  UserCheck,
  Trash2
} from 'lucide-react-native';
import { Demand, DemandStatus } from '../../types';
import { GlassCard } from '../common/GlassCard';
import { OriginBadge, StatusBadge, PriorityBadge } from '../common/Badge';
import { SECTORS } from '../../constants/sectors';
import { useAuth } from '../../context/AuthContext';

interface DemandCardProps {
  demand: Demand;
  onPress: () => void;
  onQuickAction?: () => void;
  onDeletePress?: () => void;
  showDeleteButton?: boolean;
  isCoordinatorOfSector?: boolean;
  canViewConfidential?: boolean;
}

const STATUS_INDICATOR_COLORS: Record<DemandStatus, string> = {
  concluida: '#15803D',
  parcial: '#D97706',
  nao_concluida: '#B91C1C',
  em_andamento: '#2563EB',
  pendente: '#0284C7',
};

export const DemandCard: React.FC<DemandCardProps> = ({
  demand,
  onPress,
  onDeletePress,
  showDeleteButton = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { getSectorLeadership } = useAuth();
  const targetSector = SECTORS.find(s => s.id === demand.targetSectorId);
  const targetLeadership = getSectorLeadership(demand.targetSectorId);
  const responsibleDisplay =
    demand.resolvedBy || (targetLeadership.hasLeader ? targetLeadership.leaderName : 'Coordenação: A definir');

  const formattedDate = new Date(demand.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const hasAttachments = demand.attachments && demand.attachments.length > 0;
  const statusColor = STATUS_INDICATOR_COLORS[demand.status] || '#1E40AF';

  return (
    <TouchableOpacity 
      activeOpacity={0.85} 
      onPress={onPress} 
      style={[
        styles.container,
        isHovered && styles.containerHovered
      ]}
      // @ts-ignore - Web hover events
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <GlassCard 
        padding={16} 
        variant="surface"
        style={styles.card}
      >
        {/* Barra Vertical Fina (4px) com a Cor do Status */}
        <View style={[styles.statusBarIndicator, { backgroundColor: statusColor }]} />

        {/* Top Badges Row */}
        <View style={styles.topRow}>
          <OriginBadge origin={demand.originType} size="sm" />
          <View style={styles.rightBadges}>
            <PriorityBadge priority={demand.priority} size="sm" />
            <StatusBadge status={demand.status} size="sm" />
          </View>
        </View>

        {/* Title com Hierarquia Visual */}
        <Text style={styles.title} numberOfLines={2}>
          {demand.title}
        </Text>

        {/* Linha Limpa de Chips de Metadados: Protocolo, Ofício nº, Remetente, Data, Responsável */}
        <View style={styles.metaChipsRow}>
          <View style={styles.metaChip}>
            <Hash size={11} color="#1E40AF" />
            <Text style={[styles.metaChipText, styles.metaChipTextBold]}>{demand.protocolNumber}</Text>
          </View>

          {demand.originType === 'oficio_formal' && demand.oficioNumber ? (
            <View style={[styles.metaChip, styles.metaChipOficio]}>
              <FileText size={11} color="#1E40AF" />
              <Text style={[styles.metaChipText, styles.metaChipTextHighlight]} numberOfLines={1}>
                {demand.oficioNumber}
              </Text>
            </View>
          ) : null}

          {demand.oficioSender ? (
            <View style={styles.metaChip}>
              <Building2 size={11} color="#64748B" />
              <Text style={styles.metaChipText} numberOfLines={1}>
                {demand.oficioSender}
              </Text>
            </View>
          ) : null}

          <View style={styles.metaChip}>
            <Calendar size={11} color="#64748B" />
            <Text style={styles.metaChipText}>{formattedDate}</Text>
          </View>

          <View style={styles.metaChip}>
            <UserCheck size={11} color="#64748B" />
            <Text style={styles.metaChipText} numberOfLines={1}>
              {responsibleDisplay}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {demand.description}
        </Text>

        {/* Parcial or Não Concluída Alerts */}
        {demand.status === 'parcial' && demand.bottleneckReason && (
          <View style={styles.alertParcial}>
            <Clock size={13} color="#B45309" />
            <Text style={styles.alertParcialText} numberOfLines={2}>
              <Text style={styles.boldText}>Gargalo restante: </Text>
              {demand.bottleneckReason}
            </Text>
          </View>
        )}

        {demand.status === 'nao_concluida' && demand.impedimentReason && (
          <View style={styles.alertImpediment}>
            <AlertCircle size={13} color="#B91C1C" />
            <Text style={styles.alertImpedimentText} numberOfLines={2}>
              <Text style={styles.boldText}>Impedimento formal: </Text>
              {demand.impedimentReason}
            </Text>
          </View>
        )}

        {/* Target Sector & Attachments Footer */}
        <View style={styles.footerRow}>
          <View style={styles.sectorTag}>
            <Building2 size={13} color={targetSector?.accentColor || '#1E40AF'} />
            <Text style={[styles.sectorTagText, { color: targetSector?.accentColor || '#1E40AF' }]}>
              {targetSector?.shortName || demand.targetSectorId}
            </Text>
          </View>

          <View style={styles.footerRight}>
            {hasAttachments && (
              <View style={styles.attachmentPill}>
                <Paperclip size={12} color="#1E40AF" />
                <Text style={styles.attachmentPillText}>
                  {demand.attachments.length} {demand.attachments.length === 1 ? 'anexo' : 'anexos'}
                </Text>
              </View>
            )}

            {showDeleteButton && onDeletePress && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onDeletePress();
                }}
                activeOpacity={0.75}
                style={styles.deleteCardBtn}
              >
                <Trash2 size={12} color="#B91C1C" />
                <Text style={styles.deleteCardBtnText}>Excluir Registro</Text>
              </TouchableOpacity>
            )}

            <View style={styles.detailsAction}>
              <Text style={styles.detailsActionText}>Ver Detalhes</Text>
              <ArrowRight size={13} color="#1E40AF" />
            </View>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: 'relative',
    ...(Platform.OS === 'web' ? ({ transition: 'all 0.2s ease' } as any) : {}),
  },
  containerHovered: {
    transform: [{ translateY: -2 }],
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 24px rgba(30, 64, 175, 0.08)' } as any) : {}),
  },
  card: {
    borderRadius: 14,
    paddingLeft: 20, // Espaço confortável após a barra de 4px
    position: 'relative',
    overflow: 'hidden',
  },
  statusBarIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  rightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 23,
    marginBottom: 8,
  },
  metaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    gap: 4,
    maxWidth: 240,
  },
  metaChipOficio: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  metaChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  metaChipTextBold: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.2,
  },
  metaChipTextHighlight: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  alertParcial: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 5,
    marginBottom: 8,
    gap: 6,
  },
  alertParcialText: {
    fontSize: 11,
    color: '#78350F',
    flex: 1,
  },
  alertImpediment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 5,
    marginBottom: 8,
    gap: 6,
  },
  alertImpedimentText: {
    fontSize: 11,
    color: '#7F1D1D',
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 2,
  },
  sectorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
    flexShrink: 1,
  },
  sectorTagText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    gap: 4,
  },
  attachmentPillText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '700',
  },
  deleteCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  deleteCardBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  detailsAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailsActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
});
