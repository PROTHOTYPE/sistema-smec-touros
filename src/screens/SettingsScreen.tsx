import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  Alert,
  TouchableOpacity,
  Linking 
} from 'react-native';
import { 
  Database, 
  CloudSync, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  Shield,
  ExternalLink,
  Trash2
} from 'lucide-react-native';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { GlassModal } from '../components/common/GlassModal';
import { SupabaseService } from '../services/supabase';
import { TourosEmblem } from '../components/icons/TourosEmblem';
import { SmecLogo } from '../components/icons/SmecLogo';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, syncWithSupabase, clearLocalDatabase, isSyncing, lastSyncTime } = useDemands();
  const { currentUser, isSuperAdmin } = useAuth();

  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');
  const [logoPrefeituraUrl, setLogoPrefeituraUrl] = useState(settings.logoPrefeituraUrl || '');
  const [logoSmecUrl, setLogoSmecUrl] = useState(settings.logoSmecUrl || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmResetModal, setConfirmResetModal] = useState(false);

  const handleSaveConfig = async () => {
    try {
      await updateSettings({
        supabaseUrl: supabaseUrl.trim(),
        supabaseAnonKey: supabaseAnonKey.trim(),
        isSupabaseConfigured: Boolean(supabaseUrl.trim() && supabaseAnonKey.trim()),
        logoPrefeituraUrl: logoPrefeituraUrl.trim(),
        logoSmecUrl: logoSmecUrl.trim(),
      });
      Alert.alert('Sucesso', 'Configurações institucionais e de sincronização salvas com sucesso!');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar as configurações.');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await SupabaseService.testConnection({
        ...settings,
        supabaseUrl: supabaseUrl.trim(),
        supabaseAnonKey: supabaseAnonKey.trim(),
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Erro de conexão' });
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    const res = await syncWithSupabase();
    Alert.alert(res.success ? 'Sincronizado' : 'Aviso', res.message);
  };

  const handleConfirmResetDatabase = async () => {
    await clearLocalDatabase();
    setConfirmResetModal(false);
    Alert.alert('Banco Local Zerado', 'Todos os registros locais foram limpos do AsyncStorage com sucesso.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Banner Superior */}
      <GlassCard variant="elevated" padding={18} style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Configurações do Sistema SMEC</Text>
            <Text style={styles.headerSubtitle}>
              Gestão de persistência híbrida (AsyncStorage Local + Supabase) e Identidade Visual
            </Text>
          </View>
          <View style={[styles.statusPill, settings.isSupabaseConfigured ? styles.statusPillOnline : styles.statusPillOffline]}>
            <View style={[styles.statusDot, { backgroundColor: settings.isSupabaseConfigured ? '#15803D' : '#0369A1' }]} />
            <Text style={[styles.statusPillText, { color: settings.isSupabaseConfigured ? '#15803D' : '#0369A1' }]}>
              {settings.isSupabaseConfigured ? 'Nuvem Conectada' : 'Modo Local (AsyncStorage)'}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Bloqueio se não for Super Admin */}
      {!isSuperAdmin && (
        <GlassCard padding={14} variant="surface" style={styles.noticeCard}>
          <View style={styles.noticeRow}>
            <Shield size={18} color="#B45309" />
            <View style={styles.noticeTextWrapper}>
              <Text style={styles.noticeTitle}>Acesso técnico restrito à Coordenação de TI</Text>
              <Text style={styles.noticeDesc}>
                Você está utilizando o perfil <Text style={styles.boldText}>{currentUser?.name}</Text>. As credenciais em nuvem e URLs institucionais são configuradas exclusivamente pela Coordenação de TI.
              </Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* Seção Identidade Visual & Logos Oficiais */}
      <GlassCard padding={18} style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <ImageIcon size={18} color="#1E40AF" />
          <Text style={styles.sectionTitle}>Logos Institucionais (Prefeitura e SMEC)</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Por padrão, o aplicativo renderiza os brasões oficiais de Touros em vetor SVG de alta precisão (Farol do Calcanhar e brasão SMEC). Você também pode especificar URLs para logos fotográficos ou arquivos em `assets/logo-prefeitura.png` e `assets/logo-smec.png`.
        </Text>

        <View style={styles.logosPreviewRow}>
          <View style={styles.logoPreviewBox}>
            <TourosEmblem size={44} customUri={logoPrefeituraUrl} />
            <Text style={styles.logoPreviewLabel}>Prefeitura Touros</Text>
          </View>

          <View style={styles.logoPreviewBox}>
            <SmecLogo size={44} customUri={logoSmecUrl} />
            <Text style={styles.logoPreviewLabel}>SMEC Touros</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>URL DO BRASÃO DA PREFEITURA (OPCIONAL)</Text>
          <TextInput
            style={[styles.input, !isSuperAdmin && styles.inputDisabled]}
            placeholder="Ex: https://touros.rn.gov.br/brasao.png ou deixe vazio para usar SVG"
            placeholderTextColor="#94A3B8"
            value={logoPrefeituraUrl}
            onChangeText={setLogoPrefeituraUrl}
            editable={isSuperAdmin}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>URL DA LOGO DA SMEC (OPCIONAL)</Text>
          <TextInput
            style={[styles.input, !isSuperAdmin && styles.inputDisabled]}
            placeholder="Ex: https://touros.rn.gov.br/smec-logo.png ou deixe vazio para usar SVG"
            placeholderTextColor="#94A3B8"
            value={logoSmecUrl}
            onChangeText={setLogoSmecUrl}
            editable={isSuperAdmin}
            autoCapitalize="none"
          />
        </View>

        {isSuperAdmin && (
          <View style={{ marginTop: 6 }}>
            <GlassButton
              title="Salvar Configurações Visuais"
              onPress={handleSaveConfig}
              variant="primary"
              size="sm"
            />
          </View>
        )}
      </GlassCard>

      {/* Seção Supabase */}
      <GlassCard padding={18} style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Database size={18} color="#1E40AF" />
          <Text style={styles.sectionTitle}>Banco de Dados Supabase (PostgreSQL & Storage)</Text>
        </View>
        <Text style={styles.sectionDesc}>
          O aplicativo opera em modo offline-first local de alta performance. Preencha a URL e a Anon Key abaixo para sincronizar com o banco de dados remoto da SMEC.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>SUPABASE PROJECT URL</Text>
          <TextInput
            style={[styles.input, !isSuperAdmin && styles.inputDisabled]}
            placeholder="https://xyzcompany.supabase.co"
            placeholderTextColor="#94A3B8"
            value={supabaseUrl}
            onChangeText={setSupabaseUrl}
            editable={isSuperAdmin}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>SUPABASE ANON PUBLIC KEY</Text>
          <TextInput
            style={[styles.input, !isSuperAdmin && styles.inputDisabled]}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            placeholderTextColor="#94A3B8"
            value={supabaseAnonKey}
            onChangeText={setSupabaseAnonKey}
            editable={isSuperAdmin}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Feedback do Teste */}
        {testResult && (
          <View style={[styles.testBox, testResult.success ? styles.testBoxSuccess : styles.testBoxError]}>
            {testResult.success ? (
              <CheckCircle2 size={16} color="#15803D" />
            ) : (
              <AlertCircle size={16} color="#B91C1C" />
            )}
            <Text style={[styles.testBoxText, { color: testResult.success ? '#15803D' : '#B91C1C' }]}>
              {testResult.message}
            </Text>
          </View>
        )}

        {isSuperAdmin && (
          <View style={styles.buttonsRow}>
            <GlassButton
              title="Testar Conexão"
              onPress={handleTestConnection}
              loading={testing}
              variant="secondary"
              size="sm"
            />
            <GlassButton
              title="Salvar Chaves"
              onPress={handleSaveConfig}
              variant="primary"
              size="sm"
            />
            <GlassButton
              title="Sincronizar Agora"
              icon={<CloudSync size={15} color="#15803D" />}
              onPress={handleSync}
              loading={isSyncing}
              variant="success"
              size="sm"
            />
          </View>
        )}

        {lastSyncTime && (
          <Text style={styles.syncMetaText}>Última sincronização bem-sucedida: {lastSyncTime}</Text>
        )}
      </GlassCard>

      {/* Seção Manutenção de Banco Local (Exclusivo Super Admin TI) */}
      {isSuperAdmin && (
        <GlassCard padding={18} style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <RotateCcw size={18} color="#B91C1C" />
            <Text style={styles.sectionTitle}>Manutenção e Limpeza do Banco Local</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Limpe completamente o cache de demandas e ofícios do armazenamento local (`AsyncStorage`), mantendo intacta a estrutura oficial dos 13 setores da SMEC Touros/RN.
          </Text>

          <View style={{ marginTop: 10, alignSelf: 'flex-start' }}>
            <GlassButton
              title="Zerar/Resetar Banco Local"
              icon={<Trash2 size={15} color="#B91C1C" />}
              variant="danger"
              size="md"
              onPress={() => setConfirmResetModal(true)}
            />
          </View>
        </GlassCard>
      )}

      {/* Modal de Confirmação para Zerar Banco Local */}
      {isSuperAdmin && (
        <GlassModal
          visible={confirmResetModal}
          onClose={() => setConfirmResetModal(false)}
          title="Zerar/Resetar Banco Local"
          subtitle="Operação restrita à Coordenação de TI (TI-SMEC)"
          maxWidth={460}
        >
          <View style={{ gap: 12 }}>
            <Text style={styles.sectionDesc}>
              Tem certeza que deseja limpar todas as demandas e protocolos salvos localmente neste navegador/dispositivo? Os setores oficiais da SMEC serão mantidos.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <GlassButton
                title="Cancelar"
                variant="ghost"
                size="sm"
                onPress={() => setConfirmResetModal(false)}
                style={{ flex: 1 }}
              />
              <GlassButton
                title="Confirmar Limpeza"
                icon={<Trash2 size={15} color="#B91C1C" />}
                variant="danger"
                size="sm"
                onPress={handleConfirmResetDatabase}
                style={{ flex: 1.3 }}
              />
            </View>
          </View>
        </GlassModal>
      )}

      {/* Identidade Institucional */}
      <GlassCard padding={18} style={styles.sectionCard}>
        <View style={styles.institucionalRow}>
          <TourosEmblem size={44} customUri={settings.logoPrefeituraUrl} />
          <View style={styles.institucionalText}>
            <Text style={styles.instCity}>PREFEITURA MUNICIPAL DE TOUROS</Text>
            <Text style={styles.instSec}>SECRETARIA MUNICIPAL DE EDUCAÇÃO E CULTURA — SMEC</Text>
            <Text style={styles.instDesc}>
              Sistema Oficial de Gestão Interna de Demandas, Protocolo de Ofícios e Prestação de Contas.
            </Text>
            <Text style={styles.instVersion}>Projeto PRISMA • Versão 1.2.0 (Exercício 2026) • Suporte: TI-SMEC</Text>
          </View>
          <SmecLogo size={44} customUri={settings.logoSmecUrl} />
        </View>
      </GlassCard>

      {/* Assinatura do projeto */}
      <View style={styles.footerDeveloper}>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://github.com/PROTHOTYPE/sistema-smec-touros')}
          activeOpacity={0.7}
          style={styles.devCreditLink}
        >
          <Text style={styles.devCreditText}>
            Projeto PRISMA • <Text style={styles.devCreditBold}>PROTHOTYPE</Text>
          </Text>
          <ExternalLink size={12} color="#64748B" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 90,
    gap: 14,
  },
  headerCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.12)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerTitles: {
    flex: 1,
    minWidth: 260,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    gap: 6,
  },
  statusPillOnline: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusPillOffline: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noticeCard: {
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noticeTextWrapper: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#B45309',
  },
  noticeDesc: {
    fontSize: 11.5,
    color: '#92400E',
    marginTop: 1,
    lineHeight: 15,
  },
  boldText: {
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  logosPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginVertical: 4,
  },
  logoPreviewBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    minWidth: 110,
  },
  logoPreviewLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
  },
  formGroup: {
    gap: 4,
    marginTop: 4,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    color: '#0F172A',
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.7,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  testBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 7,
    gap: 6,
    marginTop: 4,
  },
  testBoxSuccess: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  testBoxError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  testBoxText: {
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  syncMetaText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
    fontStyle: 'italic',
  },
  institucionalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  institucionalText: {
    flex: 1,
    minWidth: 200,
  },
  instCity: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  instSec: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
    marginTop: 1,
  },
  instDesc: {
    fontSize: 10.5,
    color: '#475569',
    marginTop: 3,
    lineHeight: 14,
  },
  instVersion: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 3,
  },
  footerDeveloper: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  devCreditLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  devCreditText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  devCreditBold: {
    fontWeight: '700',
    color: '#1E40AF',
  },
});
