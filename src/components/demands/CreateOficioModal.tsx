import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Platform,
  useWindowDimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Camera, Image as ImageIcon, FileText, Trash2, ShieldAlert } from 'lucide-react-native';
import { GlassModal } from '../common/GlassModal';
import { GlassButton } from '../common/GlassButton';
import { SectorSelectField } from '../common/SectorSelectField';
import { useDemands } from '../../context/DemandsContext';
import { useAuth } from '../../context/AuthContext';
import { PriorityLevel, SectorId, Attachment } from '../../types';
import { COLORS } from '../../constants/theme';

interface CreateOficioModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateOficioModal: React.FC<CreateOficioModalProps> = ({ visible, onClose }) => {
  const { width } = useWindowDimensions();
  const isSmallMobile = width < 600;
  const { createOficioFormal } = useDemands();
  const { currentUser, canCreateOficio } = useAuth();

  const [oficioNumber, setOficioNumber] = useState('');
  const [oficioSender, setOficioSender] = useState('');
  const [oficioPhysicalDate, setOficioPhysicalDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetSectorId, setTargetSectorId] = useState<SectorId>('suporte_ti');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('alta');
  const [dueDate, setDueDate] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);

  // Se o usuário não tiver permissão de RH ou TI, exibe bloqueio
  if (!canCreateOficio) {
    return (
      <GlassModal visible={visible} onClose={onClose} title="Acesso Restrito">
        <View style={styles.restrictedContainer}>
          <ShieldAlert size={44} color="#B91C1C" />
          <Text style={styles.restrictedTitle}>Permissão Exclusiva do Administrativo / RH</Text>
          <Text style={styles.restrictedText}>
            Apenas o setor Administrativo / RH (Protocolo Central) e o Super Admin de TI podem registrar Ofícios Formais físicos no sistema.
          </Text>
          <Text style={styles.restrictedSubtext}>
            Se você for coordenador de setor, utilize a opção "Nova Demanda do Setor" ou "Registrar Ação Já Realizada".
          </Text>
          <GlassButton title="Entendido" onPress={onClose} variant="secondary" style={{ marginTop: 16 }} />
        </View>
      </GlassModal>
    );
  }

  // Tirar foto do papel físico com a Câmera
  const handleTakePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão necessária', 'É necessário autorizar o uso da câmera para digitalizar o ofício.');
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1, // Qualidade máxima sem perda
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newAtt: Attachment = {
          id: `att-${Date.now()}`,
          fileName: asset.fileName || `foto_oficio_${Date.now()}.jpg`,
          fileUri: asset.uri,
          fileType: 'image',
          fileSize: asset.fileSize || 1024000,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser?.name || 'RH SMEC',
        };
        setAttachments(prev => [...prev, newAtt]);
      }
    } catch (err) {
      console.error('Erro na câmera:', err);
    }
  };

  // Escolher foto da Galeria
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newAtt: Attachment = {
          id: `att-${Date.now()}`,
          fileName: asset.fileName || `digitalizacao_${Date.now()}.jpg`,
          fileUri: asset.uri,
          fileType: 'image',
          fileSize: asset.fileSize || 1024000,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser?.name || 'RH SMEC',
        };
        setAttachments(prev => [...prev, newAtt]);
      }
    } catch (err) {
      console.error('Erro ao escolher imagem:', err);
    }
  };

  // Anexar documento PDF
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const doc = result.assets[0];
        const newAtt: Attachment = {
          id: `att-${Date.now()}`,
          fileName: doc.name,
          fileUri: doc.uri,
          fileType: doc.mimeType?.includes('pdf') ? 'pdf' : 'document',
          fileSize: doc.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser?.name || 'RH SMEC',
        };
        setAttachments(prev => [...prev, newAtt]);
      }
    } catch (err) {
      console.error('Erro ao anexar documento:', err);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = async () => {
    if (!oficioNumber.trim() || !oficioSender.trim() || !title.trim() || !description.trim()) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha o número do ofício, o remetente, o assunto e a descrição.');
      return;
    }

    setLoading(true);
    try {
      await createOficioFormal({
        oficioNumber: oficioNumber.trim(),
        oficioSender: oficioSender.trim(),
        oficioPhysicalDate,
        targetSectorId,
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate.trim() || undefined,
        attachments,
        createdById: currentUser?.id || 'rh',
        createdByName: currentUser?.name || 'RH SMEC',
      });

      setOficioNumber('');
      setOficioSender('');
      setTitle('');
      setDescription('');
      setAttachments([]);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar ofício:', error);
      Alert.alert('Erro', 'Não foi possível cadastrar o ofício.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      title="Protocolar Ofício Formal Físico"
      subtitle="Exclusivo Setor Administrativo / RH — Protocolo Geral SMEC Touros"
      maxWidth={720}
    >
      <View style={styles.form}>
        {/* Banner de Orientações do RH */}
        <View style={styles.rhNotice}>
          <Text style={styles.rhNoticeTitle}>📄 Porta de Entrada Única de Ofícios</Text>
          <Text style={styles.rhNoticeDesc}>
            Fotografe a folha em papel timbrado ou anexe o documento digital. Ao salvar, o ofício será protocolado e despachado diretamente à fila do setor competente.
          </Text>
        </View>

        {/* Linha 1: Nº do Ofício e Órgão Remetente */}
        <View style={[styles.row, isSmallMobile && styles.rowStacked]}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Nº do Ofício Formal *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Ofício nº 142/2026-PJ/TOUROS"
              placeholderTextColor="#94A3B8"
              value={oficioNumber}
              onChangeText={setOficioNumber}
            />
          </View>
          <View style={[styles.field, { flex: isSmallMobile ? 1 : 1.2 }]}>
            <Text style={styles.label}>Órgão / Entidade Remetente *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Promotoria de Justiça / MPRN"
              placeholderTextColor="#94A3B8"
              value={oficioSender}
              onChangeText={setOficioSender}
            />
          </View>
        </View>

        {/* Linha 2: Data do Papel e Setor de Destino (Seletor Moderno com Busca) */}
        <View style={[styles.row, isSmallMobile && styles.rowStacked]}>
          <View style={[styles.field, { flex: isSmallMobile ? 1 : 0.75 }]}>
            <Text style={styles.label}>Data do Documento Físico</Text>
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-DD"
              placeholderTextColor="#94A3B8"
              value={oficioPhysicalDate}
              onChangeText={setOficioPhysicalDate}
            />
          </View>
          <View style={[styles.field, { flex: isSmallMobile ? 1 : 1.45 }]}>
            <Text style={styles.label}>Setor Responsável na SMEC *</Text>
            <SectorSelectField
              selectedSectorId={targetSectorId}
              onSelect={setTargetSectorId}
              compact
              modalTitle="Selecionar Setor de Destino do Ofício"
              modalSubtitle="Escolha para qual coordenação este ofício será despachado"
            />
          </View>
        </View>

        {/* Assunto / Título */}
        <View style={styles.field}>
          <Text style={styles.label}>Assunto / Objeto da Demanda *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Adequação da rede de computadores e internet da escola..."
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Descrição Detalhada */}
        <View style={styles.field}>
          <Text style={styles.label}>Descrição / Despacho Inicial do RH *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Transcreva ou resuma o teor da solicitação formal recebida no papel..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Linha de Prioridade */}
        <View style={styles.field}>
          <Text style={styles.label}>Grau de Prioridade</Text>
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

        {/* Upload de Anexos: Foto do Papel Físico ou PDF */}
        <View style={styles.field}>
          <Text style={styles.label}>Digitalização / Anexo do Papel Físico</Text>
          <View style={styles.uploadButtonsRow}>
            <GlassButton
              title="Câmera"
              icon={<Camera size={15} color="#1E40AF" />}
              onPress={handleTakePhoto}
              variant="secondary"
              size="sm"
            />
            <GlassButton
              title="Galeria"
              icon={<ImageIcon size={15} color="#1E40AF" />}
              onPress={handlePickImage}
              variant="secondary"
              size="sm"
            />
            <GlassButton
              title="Anexar PDF"
              icon={<FileText size={15} color="#1E40AF" />}
              onPress={handlePickDocument}
              variant="secondary"
              size="sm"
            />
          </View>

          {/* Lista de Anexos Adicionados */}
          {attachments.length > 0 && (
            <View style={styles.attachmentsList}>
              {attachments.map(att => (
                <View key={att.id} style={styles.attachmentItem}>
                  {att.fileType === 'image' ? (
                    <Image source={{ uri: att.fileUri }} style={styles.attachmentThumb} />
                  ) : (
                    <View style={styles.docIconBox}>
                      <FileText size={20} color="#1E40AF" />
                    </View>
                  )}
                  <View style={styles.attachmentMeta}>
                    <Text style={styles.attachmentFileName} numberOfLines={1}>{att.fileName}</Text>
                    <Text style={styles.attachmentSize}>
                      {att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : 'Anexo'} • {att.fileType.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveAttachment(att.id)} style={styles.removeAttBtn}>
                    <Trash2 size={16} color="#B91C1C" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Botão de Envio */}
        <View style={styles.actionsRow}>
          <GlassButton title="Cancelar" onPress={onClose} variant="ghost" style={{ flex: 1 }} />
          <GlassButton 
            title="Protocolar e Despachar ao Setor" 
            onPress={handleSubmit} 
            variant="primary" 
            loading={loading}
            style={{ flex: 2 }} 
          />
        </View>
      </View>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  rhNotice: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#1E40AF',
    padding: 10,
    borderRadius: 6,
    marginBottom: 4,
  },
  rhNoticeTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 2,
  },
  rhNoticeDesc: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowStacked: {
    flexDirection: 'column',
  },
  field: {
    gap: 4,
    flexShrink: 1,
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
    minHeight: 70,
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
    fontWeight: '600',
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
  uploadButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentsList: {
    marginTop: 8,
    gap: 6,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 7,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attachmentThumb: {
    width: 38,
    height: 38,
    borderRadius: 5,
    marginRight: 8,
  },
  docIconBox: {
    width: 38,
    height: 38,
    borderRadius: 5,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  attachmentMeta: {
    flex: 1,
  },
  attachmentFileName: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  attachmentSize: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  removeAttBtn: {
    padding: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  restrictedContainer: {
    alignItems: 'center',
    padding: 16,
    textAlign: 'center',
  },
  restrictedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B91C1C',
    marginTop: 10,
    marginBottom: 6,
  },
  restrictedText: {
    fontSize: 12.5,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  },
  restrictedSubtext: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
  },
});
