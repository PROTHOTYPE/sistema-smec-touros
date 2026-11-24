import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Zap, ClipboardList, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { GlassModal } from '../common/GlassModal';
import { GlassButton } from '../common/GlassButton';
import { SectorSelectField } from '../common/SectorSelectField';
import { useDemands } from '../../context/DemandsContext';
import { useAuth } from '../../context/AuthContext';
import { SECTORS } from '../../constants/sectors';
import { PriorityLevel, SectorId } from '../../types';
import { COLORS } from '../../constants/theme';

interface CreateDemandModalProps {
  visible: boolean;
  onClose: () => void;
  defaultTargetSectorId?: SectorId;
}

export const CreateDemandModal: React.FC<CreateDemandModalProps> = ({
  visible,
  onClose,
  defaultTargetSectorId,
}) => {
  const { createDemand } = useDemands();
  const { currentUser, canAssignDemand } = useAuth();

  const [mode, setMode] = useState<'acao_feita' | 'nova_demanda'>('acao_feita');
  const [actionOutcome, setActionOutcome] = useState<'concluida' | 'parcial'>('concluida');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [bottleneckReason, setBottleneckReason] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('media');
  
  // Para coordenadores normais, o setor é rigidamente o seu próprio
  const [targetSectorId, setTargetSectorId] = useState<SectorId>(
    defaultTargetSectorId || currentUser?.sectorId || 'suporte_ti'
  );
  const [loading, setLoading] = useState(false);

  const isAssigningToOther = canAssignDemand && targetSectorId !== currentUser?.sectorId;

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Campos Obrigatórios', 'Por favor, informe o título e a descrição.');
      return;
    }

    if (mode === 'acao_feita' && actionOutcome === 'concluida' && !resolutionSummary.trim()) {
      Alert.alert('Relato Obrigatório', 'Por favor, descreva o que foi executado para o Relatório Anual.');
      return;
    }

    if (mode === 'acao_feita' && actionOutcome === 'parcial' && (!resolutionSummary.trim() || !bottleneckReason.trim())) {
      Alert.alert('Campos Obrigatórios', 'Informe o que já foi feito e o gargalo restante.');
      return;
    }

    setLoading(true);
    try {
      const isDirectAction = mode === 'acao_feita';
      const originType = isAssigningToOther ? 'atribuida_admin' : 'direta_setor';

      await createDemand({
        title: title.trim(),
        description: description.trim(),
        originType,
        targetSectorId,
        sourceSectorId: currentUser?.sectorId || targetSectorId,
        priority,
        createdById: currentUser?.id || 'system',
        createdByName: currentUser?.name || 'Servidor SMEC',
        isDirectActionExecuted: isDirectAction,
        status: isDirectAction ? actionOutcome : 'pendente',
        resolutionSummary: isDirectAction ? resolutionSummary.trim() : undefined,
        bottleneckReason: isDirectAction && actionOutcome === 'parcial' ? bottleneckReason.trim() : undefined,
      });

      setTitle('');
      setDescription('');
      setResolutionSummary('');
      setBottleneckReason('');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar o registro.');
    } finally {
      setLoading(false);
    }
  };

  const currentSector = SECTORS.find(s => s.id === targetSectorId);

  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      title={
        isAssigningToOther
          ? 'Atribuir Demanda a um Setor'
          : mode === 'acao_feita'
          ? '⚡ Registrar Ação Já Realizada da Equipe'
          : '📋 Abrir Nova Demanda do Setor'
      }
      subtitle={`Setor: ${currentSector?.name} (${currentSector?.code})`}
      maxWidth={680}
    >
      <View style={styles.container}>
        {/* Seletor de Modo: Ação Já Feita vs Nova Demanda */}
        {!isAssigningToOther && (
          <View style={styles.modeTabs}>
            <TouchableOpacity
              onPress={() => setMode('acao_feita')}
              style={[styles.modeTab, mode === 'acao_feita' && styles.modeTabActiveGreen]}
            >
              <Zap size={16} color={mode === 'acao_feita' ? '#15803D' : '#64748B'} />
              <View style={{ flex: 1, flexShrink: 1 }}>
                <Text style={[styles.modeTabTitle, mode === 'acao_feita' && { color: '#15803D' }]}>
                  Ação Já Realizada (Sem Burocracia)
                </Text>
                <Text style={styles.modeTabSubtitle}>
                  Documenta imediatamente o que a equipe já executou hoje
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('nova_demanda')}
              style={[styles.modeTab, mode === 'nova_demanda' && styles.modeTabActiveBlue]}
            >
              <ClipboardList size={16} color={mode === 'nova_demanda' ? '#1E40AF' : '#64748B'} />
              <View style={{ flex: 1, flexShrink: 1 }}>
                <Text style={[styles.modeTabTitle, mode === 'nova_demanda' && { color: '#1E40AF' }]}>
                  Abrir Nova Demanda
                </Text>
                <Text style={styles.modeTabSubtitle}>
                  Cria na fila como pendente para a equipe executar
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Se o usuário puder atribuir a outros setores (ex: RH ou Gabinete), permite escolher o destino com busca */}
        {canAssignDemand && (
          <View style={styles.field}>
            <SectorSelectField
              label="Setor de Destino da Demanda"
              selectedSectorId={targetSectorId}
              onSelect={setTargetSectorId}
              modalTitle="Selecionar Setor de Destino da Demanda"
              modalSubtitle="Escolha a coordenação responsável pela execução"
            />
          </View>
        )}

        {/* Título */}
        <View style={styles.field}>
          <Text style={styles.label}>
            {mode === 'acao_feita' ? 'Título da Ação Realizada *' : 'Título da Demanda *'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={
              mode === 'acao_feita'
                ? 'Ex: Manutenção preventiva de 12 computadores da E. M. Orlando Flávio'
                : 'Ex: Elaborar relatório de frequência escolar...'
            }
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Descrição */}
        <View style={styles.field}>
          <Text style={styles.label}>Descrição / Contexto da Atividade *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detalhe o contexto, o objetivo ou a escola/unidade atendida..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Campos Específicos se for "Ação Já Realizada" */}
        {mode === 'acao_feita' && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Desfecho da Execução no Relatório Anual</Text>
              <View style={styles.outcomeRow}>
                <TouchableOpacity
                  onPress={() => setActionOutcome('concluida')}
                  style={[
                    styles.outcomeBtn,
                    actionOutcome === 'concluida' && styles.outcomeBtnActiveSuccess
                  ]}
                >
                  <CheckCircle2 size={16} color={actionOutcome === 'concluida' ? '#15803D' : '#64748B'} />
                  <Text style={[styles.outcomeBtnText, actionOutcome === 'concluida' && { color: '#15803D', fontWeight: '800' }]}>
                    100% Concluída
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActionOutcome('parcial')}
                  style={[
                    styles.outcomeBtn,
                    actionOutcome === 'parcial' && styles.outcomeBtnActiveWarning
                  ]}
                >
                  <AlertTriangle size={16} color={actionOutcome === 'parcial' ? '#B45309' : '#64748B'} />
                  <Text style={[styles.outcomeBtnText, actionOutcome === 'parcial' && { color: '#B45309', fontWeight: '800' }]}>
                    Resolvida pela Metade / Parcial
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Relato do que foi feito */}
            <View style={styles.field}>
              <Text style={styles.label}>Relato do que foi Executado pela Equipe *</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: '#15803D' }]}
                placeholder="Descreva o que a equipe fez (este texto constará diretamente no Relatório Anual)..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={resolutionSummary}
                onChangeText={setResolutionSummary}
              />
            </View>

            {/* Se for parcial, pede o gargalo restante */}
            {actionOutcome === 'parcial' && (
              <View style={styles.field}>
                <Text style={styles.label}>Qual foi o motivo / gargalo restante? *</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { borderColor: '#F59E0B' }]}
                  placeholder="Ex: Aguardando remessa de peças pela distribuidora ou laudo de obras..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={2}
                  value={bottleneckReason}
                  onChangeText={setBottleneckReason}
                />
              </View>
            )}
          </>
        )}

        {/* Prioridade */}
        <View style={styles.field}>
          <Text style={styles.label}>Prioridade</Text>
          <View style={styles.priorityGroup}>
            {(['baixa', 'media', 'alta', 'urgente'] as PriorityLevel[]).map(p => {
              const isSelected = priority === p;
              const cfg = COLORS.priority[p];
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.priorityBtn,
                    isSelected && { borderColor: cfg.text, backgroundColor: cfg.bg }
                  ]}
                >
                  <Text style={[styles.priorityBtnText, isSelected && { color: cfg.text, fontWeight: '700' }]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Ações */}
        <View style={styles.actionsRow}>
          <GlassButton title="Cancelar" onPress={onClose} variant="ghost" style={{ flex: 1 }} />
          <GlassButton
            title={mode === 'acao_feita' ? 'Registrar Ação no Mural' : 'Abrir Demanda'}
            onPress={handleSubmit}
            variant={mode === 'acao_feita' ? 'success' : 'primary'}
            loading={loading}
            style={{ flex: 2 }}
          />
        </View>
      </View>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  modeTabs: {
    gap: 8,
    marginBottom: 4,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  modeTabActiveGreen: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  modeTabActiveBlue: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  modeTabTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  modeTabSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 11.5,
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
  sectorScroll: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  sectorChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    marginRight: 6,
  },
  sectorChipText: {
    fontSize: 11.5,
    color: '#475569',
  },
  outcomeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  outcomeBtn: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  outcomeBtnActiveSuccess: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  outcomeBtnActiveWarning: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  outcomeBtnText: {
    fontSize: 11.5,
    color: '#64748B',
    flexShrink: 1,
  },
  priorityGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    minWidth: 72,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  priorityBtnText: {
    fontSize: 11.5,
    color: '#475569',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
});
