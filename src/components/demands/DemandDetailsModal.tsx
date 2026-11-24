import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Linking 
} from 'react-native';
import { 
  Building2, 
  Paperclip, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  PlayCircle, 
  Trash2, 
  ExternalLink 
} from 'lucide-react-native';
import { Demand, DemandStatus } from '../../types';
import { GlassModal } from '../common/GlassModal';
import { GlassButton } from '../common/GlassButton';
import { OriginBadge, StatusBadge, PriorityBadge } from '../common/Badge';
import { useDemands } from '../../context/DemandsContext';
import { useAuth } from '../../context/AuthContext';
import { SECTORS } from '../../constants/sectors';

interface DemandDetailsModalProps {
  demand: Demand | null;
  visible: boolean;
  onClose: () => void;
}

export const DemandDetailsModal: React.FC<DemandDetailsModalProps> = ({
  demand,
  visible,
  onClose,
}) => {
  const { updateDemandStatus, deleteDemand } = useDemands();
  const { currentUser, isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'details' | 'resolve'>('details');
  const [newStatus, setNewStatus] = useState<DemandStatus>('concluida');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [bottleneckReason, setBottleneckReason] = useState('');
  const [impedimentReason, setImpedimentReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  if (!demand) return null;

  const targetSector = SECTORS.find(s => s.id === demand.targetSectorId);
  const sourceSector = SECTORS.find(s => s.id === demand.sourceSectorId);

  const canEditStatus = 
    currentUser?.sectorId === demand.targetSectorId || 
    isSuperAdmin;

  // GOVERNANÇA DE EXCLUSÃO:
  // Estritamente permitido apenas para TRIAGEM_ADMIN_RH (estorno/correção de envio) e SUPER_ADMIN_TI.
  // Bloqueado absolutamente para COORD_MEMBRO_SETOR e EXECUTIVO_GESTAO.
  const canDeleteRecord =
    currentUser?.role === 'TRIAGEM_ADMIN_RH' || currentUser?.role === 'SUPER_ADMIN_TI';

  const handleSaveResolution = async () => {
    if (newStatus === 'concluida' && !resolutionSummary.trim()) {
      Alert.alert('Relato Obrigatório', 'Por favor, descreva em poucas palavras o que foi executado pela equipe.');
      return;
    }

    if (newStatus === 'parcial' && (!resolutionSummary.trim() || !bottleneckReason.trim())) {
      Alert.alert('Campos Obrigatórios', 'Informe o que a equipe já executou e o motivo/gargalo restante.');
      return;
    }

    if (newStatus === 'nao_concluida' && !impedimentReason.trim()) {
      Alert.alert('Justificativa Obrigatória', 'Informe o motivo formal do impedimento.');
      return;
    }

    setLoading(true);
    try {
      await updateDemandStatus({
        demandId: demand.id,
        status: newStatus,
        resolvedByName: currentUser?.name || 'Servidor SMEC',
        resolutionSummary: resolutionSummary.trim() || undefined,
        bottleneckReason: bottleneckReason.trim() || undefined,
        impedimentReason: impedimentReason.trim() || undefined,
      });
      setActiveTab('details');
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      Alert.alert('Erro', 'Não foi possível atualizar o status da demanda.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!canDeleteRecord) return;
    setConfirmDeleteVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!canDeleteRecord) return;
    setConfirmDeleteVisible(false);
    await deleteDemand(demand.id);
    onClose();
  };

  const handleOpenAttachment = (uri: string) => {
    Linking.openURL(uri).catch(() => {
      setPreviewImageUri(uri);
    });
  };

  return (
    <>
      <GlassModal
        visible={visible}
        onClose={onClose}
        title={demand.title}
        subtitle={`Protocolo: ${demand.protocolNumber}`}
        maxWidth={700}
      >
        <View style={styles.container}>
          {/* Tabs: Detalhes vs Baixa */}
          {canEditStatus && (
            <View style={styles.tabBar}>
              <TouchableOpacity
                onPress={() => setActiveTab('details')}
                style={[styles.tabBtn, activeTab === 'details' && styles.tabBtnActive]}
              >
                <Text style={[styles.tabBtnText, activeTab === 'details' && styles.tabBtnTextActive]}>
                  Visão Geral & Anexos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setActiveTab('resolve');
                  setNewStatus(demand.status === 'pendente' ? 'concluida' : demand.status);
                  setResolutionSummary(demand.resolutionSummary || '');
                  setBottleneckReason(demand.bottleneckReason || '');
                  setImpedimentReason(demand.impedimentReason || '');
                }}
                style={[styles.tabBtn, activeTab === 'resolve' && styles.tabBtnActive]}
              >
                <Text style={[styles.tabBtnText, activeTab === 'resolve' && styles.tabBtnTextActive]}>
                  Dar Baixa / Desfecho
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'details' ? (
            <View style={styles.tabContent}>
              {/* Badges e Status */}
              <View style={styles.badgeRow}>
                <OriginBadge origin={demand.originType} />
                <StatusBadge status={demand.status} />
                <PriorityBadge priority={demand.priority} />
              </View>

              {/* Informações de Ofício Formal (se houver) */}
              {demand.originType === 'oficio_formal' && (
                <View style={styles.oficioBox}>
                  <Text style={styles.oficioBoxTitle}>📄 Dados do Ofício Formal</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Nº DO OFÍCIO:</Text>
                      <Text style={styles.infoValHighlight}>{demand.oficioNumber || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>ÓRGÃO REMETENTE:</Text>
                      <Text style={styles.infoVal}>{demand.oficioSender || 'Admin / RH'}</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>DATA DO PAPEL:</Text>
                      <Text style={styles.infoVal}>{demand.oficioPhysicalDate || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>RECEBIDO POR:</Text>
                      <Text style={styles.infoVal}>{demand.oficioReceivedBy || demand.createdByName}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Tramitação: Origem e Destino */}
              <View style={styles.tramitacaoBox}>
                <View style={styles.tramitacaoItem}>
                  <Building2 size={16} color="#64748B" />
                  <View>
                    <Text style={styles.tramitacaoLabel}>SETOR DE ORIGEM</Text>
                    <Text style={styles.tramitacaoVal}>{sourceSector?.name || 'Administrativo / RH'}</Text>
                  </View>
                </View>

                <View style={styles.tramitacaoItem}>
                  <Building2 size={16} color={targetSector?.accentColor || '#1E40AF'} />
                  <View>
                    <Text style={styles.tramitacaoLabel}>SETOR RESPONSÁVEL</Text>
                    <Text style={[styles.tramitacaoVal, { color: targetSector?.accentColor || '#1E40AF', fontWeight: '800' }]}>
                      {targetSector?.name || demand.targetSectorId}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Descrição Completa */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Descrição da Demanda</Text>
                <Text style={styles.descriptionText}>
                  {demand.description}
                </Text>
              </View>

              {/* Desfecho Registrado */}
              {demand.resolutionSummary && (
                <View style={styles.resolutionBox}>
                  <Text style={styles.resolutionBoxTitle}>
                    {demand.status === 'concluida' ? '✅ Relato da Execução (Concluída)' : '⚡ O Que Foi Executado (Parcial)'}
                  </Text>
                  <Text style={styles.resolutionBoxText}>{demand.resolutionSummary}</Text>
                  {demand.resolvedBy && (
                    <Text style={styles.resolvedByText}>
                      Executado por: {demand.resolvedBy} • {demand.resolvedAt ? new Date(demand.resolvedAt).toLocaleDateString('pt-BR') : ''}
                    </Text>
                  )}
                </View>
              )}

              {demand.bottleneckReason && (
                <View style={styles.bottleneckBox}>
                  <Text style={styles.bottleneckBoxTitle}>⏳ Gargalo / Pendência Restante</Text>
                  <Text style={styles.bottleneckBoxText}>{demand.bottleneckReason}</Text>
                </View>
              )}

              {demand.impedimentReason && (
                <View style={styles.impedimentBox}>
                  <Text style={styles.impedimentBoxTitle}>⛔ Motivo Formal do Impedimento</Text>
                  <Text style={styles.impedimentBoxText}>{demand.impedimentReason}</Text>
                </View>
              )}

              {/* Anexos */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Anexos e Documentos ({demand.attachments ? demand.attachments.length : 0})
                </Text>
                {(!demand.attachments || demand.attachments.length === 0) ? (
                  <Text style={styles.emptyAttText}>Nenhum anexo adicionado a este registro.</Text>
                ) : (
                  <View style={styles.attGrid}>
                    {demand.attachments.map(att => (
                      <TouchableOpacity
                        key={att.id}
                        onPress={() => handleOpenAttachment(att.fileUri)}
                        style={styles.attCard}
                      >
                        {att.fileType === 'image' ? (
                          <Image source={{ uri: att.fileUri }} style={styles.attImg} />
                        ) : (
                          <View style={styles.attFileIcon}>
                            <Paperclip size={20} color="#1E40AF" />
                          </View>
                        )}
                        <View style={styles.attCardInfo}>
                          <Text style={styles.attCardName} numberOfLines={1}>{att.fileName}</Text>
                          <Text style={styles.attCardMeta}>Clique para visualizar documento</Text>
                        </View>
                        <ExternalLink size={14} color="#1E40AF" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Aviso de Governança para Setores Executores */}
              {!canDeleteRecord && (
                <View style={styles.governanceNotice}>
                  <Text style={styles.governanceNoticeText}>
                    🔒 <Text style={{ fontWeight: '800' }}>Auditoria e Governança:</Text> Setores executores não podem excluir demandas recebidas. Caso não seja possível concluir a demanda, utilize a aba "Dar Baixa / Desfecho" e marque como "Não Concluída" informando o motivo formal do impedimento.
                  </Text>
                </View>
              )}

              {/* Botões do Rodapé */}
              <View style={styles.footerActions}>
                {canDeleteRecord && (
                  <GlassButton
                    title="Excluir Registro"
                    icon={<Trash2 size={15} color="#B91C1C" />}
                    variant="danger"
                    size="sm"
                    onPress={handleDelete}
                  />
                )}
                <View style={{ flex: 1 }} />
                {canEditStatus && (
                  <GlassButton
                    title="Atualizar Status / Baixa"
                    onPress={() => setActiveTab('resolve')}
                    variant="primary"
                    size="sm"
                  />
                )}
              </View>
            </View>
          ) : (
            /* Tab de Resolução */
            <View style={styles.tabContent}>
              <Text style={styles.resolveIntro}>
                Selecione o desfecho da demanda para alimentar o Relatório Anual do setor:
              </Text>

              {/* Seletor de Status */}
              <View style={styles.statusOptions}>
                <TouchableOpacity
                  onPress={() => setNewStatus('concluida')}
                  style={[
                    styles.statusOptionBtn,
                    newStatus === 'concluida' && styles.statusBtnActiveSuccess
                  ]}
                >
                  <CheckCircle2 size={18} color={newStatus === 'concluida' ? '#15803D' : '#64748B'} />
                  <View style={{ flex: 1, flexShrink: 1 }}>
                    <Text style={[styles.statusOptionTitle, newStatus === 'concluida' && { color: '#15803D' }]}>
                      100% Concluída
                    </Text>
                    <Text style={styles.statusOptionDesc}>A equipe realizou o serviço integralmente</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setNewStatus('parcial')}
                  style={[
                    styles.statusOptionBtn,
                    newStatus === 'parcial' && styles.statusBtnActiveWarning
                  ]}
                >
                  <AlertTriangle size={18} color={newStatus === 'parcial' ? '#B45309' : '#64748B'} />
                  <View style={{ flex: 1, flexShrink: 1 }}>
                    <Text style={[styles.statusOptionTitle, newStatus === 'parcial' && { color: '#B45309' }]}>
                      Resolvida pela Metade (Parcial)
                    </Text>
                    <Text style={styles.statusOptionDesc}>Parte foi feita, mas resta algum gargalo</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setNewStatus('nao_concluida')}
                  style={[
                    styles.statusOptionBtn,
                    newStatus === 'nao_concluida' && styles.statusBtnActiveDanger
                  ]}
                >
                  <XCircle size={18} color={newStatus === 'nao_concluida' ? '#B91C1C' : '#64748B'} />
                  <View style={{ flex: 1, flexShrink: 1 }}>
                    <Text style={[styles.statusOptionTitle, newStatus === 'nao_concluida' && { color: '#B91C1C' }]}>
                      Não Concluída (Impedimento Formal)
                    </Text>
                    <Text style={styles.statusOptionDesc}>Não pôde ser feita por motivo legal ou orçamentário</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setNewStatus('em_andamento')}
                  style={[
                    styles.statusOptionBtn,
                    newStatus === 'em_andamento' && styles.statusBtnActiveIndigo
                  ]}
                >
                  <PlayCircle size={18} color={newStatus === 'em_andamento' ? '#1D4ED8' : '#64748B'} />
                  <View style={{ flex: 1, flexShrink: 1 }}>
                    <Text style={[styles.statusOptionTitle, newStatus === 'em_andamento' && { color: '#1D4ED8' }]}>
                      Em Andamento
                    </Text>
                    <Text style={styles.statusOptionDesc}>Equipe está trabalhando na execução</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Campos dinâmicos baseados no status */}
              {(newStatus === 'concluida' || newStatus === 'parcial') && (
                <View style={styles.field}>
                  <Text style={styles.label}>Relato do que foi executado pela equipe *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { borderColor: '#15803D' }]}
                    placeholder="Descreva as ações práticas que a equipe executou (vai para o relatório oficial)..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    value={resolutionSummary}
                    onChangeText={setResolutionSummary}
                  />
                </View>
              )}

              {newStatus === 'parcial' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Qual foi o motivo / gargalo restante? *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { borderColor: '#F59E0B' }]}
                    placeholder="Ex: Falta de material pelo fornecedor, aguardando parecer de obras..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={2}
                    value={bottleneckReason}
                    onChangeText={setBottleneckReason}
                  />
                </View>
              )}

              {newStatus === 'nao_concluida' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Motivo Formal do Impedimento *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { borderColor: '#EF4444' }]}
                    placeholder="Ex: Falta de dotação orçamentária, cancelamento judicial, impossibilidade física..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    value={impedimentReason}
                    onChangeText={setImpedimentReason}
                  />
                </View>
              )}

              <View style={styles.actionsRow}>
                <GlassButton title="Voltar" onPress={() => setActiveTab('details')} variant="ghost" style={{ flex: 1 }} />
                <GlassButton
                  title="Salvar Desfecho no Relatório"
                  onPress={handleSaveResolution}
                  variant="primary"
                  loading={loading}
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          )}
        </View>
      </GlassModal>

      {/* Modal de Confirmação de Exclusão / Estorno (Exclusivo RH e Super Admin TI) */}
      {canDeleteRecord && (
        <GlassModal
          visible={confirmDeleteVisible}
          onClose={() => setConfirmDeleteVisible(false)}
          title="Confirmar Exclusão / Estorno de Registro"
          subtitle={`Protocolo: ${demand.protocolNumber}`}
          maxWidth={480}
        >
          <View style={styles.confirmModalBody}>
            <Text style={styles.confirmModalText}>
              Deseja realmente excluir ou cancelar o envio do registro{' '}
              <Text style={{ fontWeight: '800', color: '#0F172A' }}>{demand.title}</Text> ({demand.protocolNumber})?
            </Text>
            <Text style={styles.confirmModalSubtext}>
              Esta ação retirará imediatamente a demanda da fila do setor{' '}
              <Text style={{ fontWeight: '700' }}>{targetSector?.name || demand.targetSectorId}</Text> para que o RH possa redirecioná-la ou corrigi-la.
            </Text>

            <View style={styles.confirmModalActions}>
              <GlassButton
                title="Cancelar"
                variant="ghost"
                size="sm"
                onPress={() => setConfirmDeleteVisible(false)}
                style={{ flex: 1 }}
              />
              <GlassButton
                title="Confirmar Exclusão"
                icon={<Trash2 size={15} color="#B91C1C" />}
                variant="danger"
                size="sm"
                onPress={handleConfirmDelete}
                style={{ flex: 1.3 }}
              />
            </View>
          </View>
        </GlassModal>
      )}

      {/* Modal de Prévia de Imagem */}
      {previewImageUri && (
        <GlassModal visible={!!previewImageUri} onClose={() => setPreviewImageUri(null)} title="Visualização do Documento">
          <View style={{ alignItems: 'center', padding: 10 }}>
            <Image source={{ uri: previewImageUri }} style={{ width: '100%', height: 420, borderRadius: 12, resizeMode: 'contain' }} />
            <GlassButton title="Fechar" onPress={() => setPreviewImageUri(null)} variant="secondary" style={{ marginTop: 14 }} />
          </View>
        </GlassModal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 6,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#1E40AF',
  },
  tabBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  tabContent: {
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  oficioBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 10,
  },
  oficioBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 6,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoCol: {
    flex: 1,
    minWidth: 135,
  },
  infoLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1E40AF',
  },
  infoVal: {
    fontSize: 11.5,
    color: '#1E293B',
    marginTop: 1,
  },
  infoValHighlight: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '800',
    marginTop: 1,
  },
  tramitacaoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 8,
  },
  tramitacaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tramitacaoLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tramitacaoVal: {
    fontSize: 12,
    color: '#0F172A',
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  descriptionText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
  },
  resolutionBox: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#15803D',
    borderRadius: 6,
    padding: 10,
  },
  resolutionBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2,
  },
  resolutionBoxText: {
    fontSize: 12,
    color: '#14532D',
    lineHeight: 17,
  },
  resolvedByText: {
    fontSize: 10.5,
    color: '#15803D',
    marginTop: 4,
    fontStyle: 'italic',
  },
  bottleneckBox: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    borderRadius: 6,
    padding: 10,
  },
  bottleneckBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 2,
  },
  bottleneckBoxText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
  impedimentBox: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    borderRadius: 6,
    padding: 10,
  },
  impedimentBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B91C1C',
    marginBottom: 2,
  },
  impedimentBoxText: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 17,
  },
  emptyAttText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  attGrid: {
    gap: 6,
  },
  attCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
  },
  attImg: {
    width: 38,
    height: 38,
    borderRadius: 5,
    marginRight: 8,
  },
  attFileIcon: {
    width: 38,
    height: 38,
    borderRadius: 5,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  attCardInfo: {
    flex: 1,
  },
  attCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  attCardMeta: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  governanceNotice: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  governanceNoticeText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  confirmModalBody: {
    gap: 10,
  },
  confirmModalText: {
    fontSize: 13.5,
    color: '#1E293B',
    lineHeight: 20,
  },
  confirmModalSubtext: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  confirmModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  footerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  resolveIntro: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  statusOptions: {
    gap: 6,
  },
  statusOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  statusBtnActiveSuccess: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  statusBtnActiveWarning: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  statusBtnActiveDanger: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  statusBtnActiveIndigo: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  statusOptionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusOptionDesc: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 65,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
});
