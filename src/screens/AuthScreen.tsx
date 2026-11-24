import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Image,
  useWindowDimensions,
} from 'react-native';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { SectorId, UserStatus } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { GlassModal } from '../components/common/GlassModal';
import { SectorSelectField } from '../components/common/SectorSelectField';
import { TourosEmblem } from '../components/icons/TourosEmblem';
import { SmecLogo } from '../components/icons/SmecLogo';

interface AuthScreenProps {
  onOpenPresentation?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onOpenPresentation }) => {
  const { width } = useWindowDimensions();
  const isSmallMobile = width < 480;
  const { login, requestAccess } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Campos de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Modal de Status de Acesso (pending, rejected, inactive)
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    status: UserStatus | 'success_request';
    title: string;
    message: string;
  }>({
    visible: false,
    status: 'pending',
    title: '',
    message: '',
  });

  // Campos de Solicitação de Acesso
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState<SectorId>('pedagogico');
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async () => {
    setLoginError(null);
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Informe seu e-mail e sua senha para entrar.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        if (res.status === 'pending') {
          setStatusModal({
            visible: true,
            status: 'pending',
            title: 'Solicitação em Análise',
            message:
              'Solicitação em Análise: Seu cadastro foi recebido com sucesso e está aguardando homologação pela Coordenação de Tecnologia da Informação (TI-SMEC). Assim que seu acesso for liberado, você poderá entrar.',
          });
        } else if (res.status === 'rejected') {
          setStatusModal({
            visible: true,
            status: 'rejected',
            title: 'Solicitação Não Homologada',
            message: res.message,
          });
        } else if (res.status === 'inactive') {
          setStatusModal({
            visible: true,
            status: 'inactive',
            title: 'Acesso Temporariamente Suspenso',
            message: res.message,
          });
        } else {
          setLoginError(res.message);
        }
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    setRegError(null);
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!fullName.trim()) {
      setRegError('Por favor, informe seu Nome Completo.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setRegError('Informe um e-mail institucional ou de trabalho válido.');
      return;
    }
    if (!jobTitle.trim()) {
      setRegError('Informe seu Cargo ou Função pública na Secretaria.');
      return;
    }
    if (regPassword.trim().length < 6) {
      setRegError('A senha deve possuir no mínimo 6 caracteres.');
      return;
    }
    if (regPassword.trim() !== confirmPassword.trim()) {
      setRegError('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await requestAccess({
        fullName: fullName.trim(),
        email: cleanEmail,
        password: regPassword.trim(),
        jobTitle: jobTitle.trim(),
        sectorId: selectedSectorId,
      });

      if (!res.success) {
        setRegError(res.message);
        return;
      }

      setFullName('');
      setRegEmail('');
      setRegPassword('');
      setConfirmPassword('');
      setJobTitle('');
      setLoginEmail('');
      setLoginPassword('');
      setActiveTab('login');

      setStatusModal({
        visible: true,
        status: 'success_request',
        title: 'Solicitação de Acesso Enviada!',
        message:
          'Solicitação em Análise: Seu cadastro foi recebido com sucesso e está aguardando homologação pela Coordenação de Tecnologia da Informação (TI-SMEC). Assim que seu acesso for liberado, você poderá entrar.',
      });
    } catch (err: any) {
      setRegError(
        err?.message || 'Este e-mail já possui cadastro. Faça login na aba Entrar.'
      );
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authWrapper}>
          {/* Cabeçalho Institucional SMEC Touros • Projeto PRISMA */}
          <View style={styles.brandHeader}>
            <View style={styles.logosRow}>
              <TourosEmblem width={isSmallMobile ? 120 : 145} height={isSmallMobile ? 40 : 48} />
              <View style={styles.logoDivider} />
              <SmecLogo width={isSmallMobile ? 120 : 145} height={isSmallMobile ? 40 : 48} />
            </View>
            <Text style={styles.systemTitle}>Sistema de Gestão Interna</Text>
            <Text style={styles.systemSubtitle}>
              Secretaria Municipal de Educação e Cultura • Projeto PRISMA
            </Text>
          </View>

          {/* Card Principal de Autenticação */}
          <GlassCard variant="elevated" padding={isSmallMobile ? 18 : 26} style={styles.authCard}>
            {/* Abas: Entrar no Sistema vs Solicitar Acesso */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                onPress={() => {
                  setActiveTab('login');
                  setLoginError(null);
                }}
                activeOpacity={0.8}
                style={[styles.tabBtn, activeTab === 'login' && styles.tabBtnActive]}
              >
                <LogIn size={16} color={activeTab === 'login' ? '#1E40AF' : '#64748B'} />
                <Text style={[styles.tabBtnText, activeTab === 'login' && styles.tabBtnTextActive]}>
                  Entrar no Sistema
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setActiveTab('register');
                  setRegError(null);
                }}
                activeOpacity={0.8}
                style={[styles.tabBtn, activeTab === 'register' && styles.tabBtnActiveGold]}
              >
                <UserPlus size={16} color={activeTab === 'register' ? '#B45309' : '#64748B'} />
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'register' && styles.tabBtnTextActiveGold,
                  ]}
                >
                  Solicitar Acesso
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'login' ? (
              <View style={styles.formContainer}>
                <Text style={styles.formSectionDesc}>
                  Acesse o painel operacional e o mural exclusivo do seu setor utilizando suas credenciais homologadas.
                </Text>

                {loginError && (
                  <View style={styles.errorBanner}>
                    <AlertCircle size={16} color="#B91C1C" />
                    <Text style={styles.errorBannerText}>{loginError}</Text>
                  </View>
                )}

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>E-MAIL INSTITUCIONAL OU DE TRABALHO</Text>
                  <View style={styles.inputBox}>
                    <Mail size={16} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: servidor@touros.rn.gov.br"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={loginEmail}
                      onChangeText={setLoginEmail}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>SENHA DE ACESSO</Text>
                  <View style={styles.inputBox}>
                    <Lock size={16} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      placeholder="Digite sua senha..."
                      placeholderTextColor="#94A3B8"
                      secureTextEntry
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      onSubmitEditing={handleLogin}
                    />
                  </View>
                </View>

                <GlassButton
                  title="Acessar Painel da SMEC"
                  icon={<LogIn size={16} color="#FFFFFF" />}
                  onPress={handleLogin}
                  loading={loginLoading}
                  variant="primary"
                  size="lg"
                  style={styles.submitBtn}
                />

                {/* Aviso de Governança e Segurança de Acesso */}
                <View style={styles.quickAccessBox}>
                  <View style={styles.quickAccessLeft}>
                    <ShieldCheck size={16} color="#1E40AF" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quickAccessTitle}>
                        Autenticação Segura & Homologação
                      </Text>
                      <Text style={styles.quickAccessSub}>
                        Novos cadastros de servidores são analisados e homologados pela Coordenação de Tecnologia da Informação (TI-SMEC).
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <Text style={styles.formSectionDesc}>
                  Preencha seus dados funcionais para solicitar acesso. Novos cadastros de servidores são analisados e homologados pela Coordenação de Tecnologia da Informação (TI-SMEC).
                </Text>

                {regError && (
                  <View style={styles.errorBanner}>
                    <AlertCircle size={16} color="#B91C1C" />
                    <Text style={styles.errorBannerText}>{regError}</Text>
                  </View>
                )}

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>NOME COMPLETO DO SERVIDOR *</Text>
                  <View style={styles.inputBox}>
                    <User size={16} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Maria Clara dos Santos"
                      placeholderTextColor="#94A3B8"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>E-MAIL INSTITUCIONAL OU DE TRABALHO *</Text>
                  <View style={styles.inputBox}>
                    <Mail size={16} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: mariaclara@touros.rn.gov.br"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={regEmail}
                      onChangeText={setRegEmail}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>CARGO / FUNÇÃO PÚBLICA *</Text>
                  <View style={styles.inputBox}>
                    <Briefcase size={16} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Assistente Administrativo, Psicóloga, Coordenador..."
                      placeholderTextColor="#94A3B8"
                      value={jobTitle}
                      onChangeText={setJobTitle}
                    />
                  </View>
                </View>

                {/* Seletor de Setor de Atuação (15 setores oficiais) */}
                <SectorSelectField
                  label="SETOR DE ATUAÇÃO NA SMEC TOUROS (15 SETORES OFICIAIS) *"
                  selectedSectorId={selectedSectorId}
                  onSelect={(sectorId: SectorId) => setSelectedSectorId(sectorId)}
                  modalTitle="Selecionar Setor de Atuação"
                  modalSubtitle="Escolha seu setor oficial na Secretaria Municipal de Educação e Cultura"
                />

                <View style={[styles.rowFields, isSmallMobile && styles.rowFieldsMobile]}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.label}>SENHA *</Text>
                    <View style={styles.inputBox}>
                      <Lock size={15} color="#64748B" />
                      <TextInput
                        style={styles.input}
                        placeholder="Mínimo 6 dígitos"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry
                        value={regPassword}
                        onChangeText={setRegPassword}
                      />
                    </View>
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.label}>CONFIRMAR SENHA *</Text>
                    <View style={styles.inputBox}>
                      <Lock size={15} color="#64748B" />
                      <TextInput
                        style={styles.input}
                        placeholder="Repita a senha"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </View>
                  </View>
                </View>

                <GlassButton
                  title="Enviar Solicitação de Acesso"
                  icon={<UserPlus size={16} color="#FFFFFF" />}
                  onPress={handleRequestAccess}
                  loading={regLoading}
                  variant="primary"
                  size="lg"
                  style={styles.submitBtn}
                />
              </View>
            )}
          </GlassCard>

          {/* Rodapé Minimalista Integrado ao Fundo */}
          <View style={styles.minimalFooter}>
            <TouchableOpacity
              onPress={() => {
                if (onOpenPresentation) {
                  onOpenPresentation();
                } else if (Platform.OS === 'web' && typeof window !== 'undefined') {
                  window.location.href = '/apresentacao';
                }
              }}
              activeOpacity={0.7}
              style={styles.minimalLinkRow}
            >
              <Image
                source={require('../../assets/logo-prisma.png')}
                style={styles.prismaMiniLogo}
              />
              <Text style={styles.minimalLinkText}>Conheça o Projeto PRISMA ↗</Text>
            </TouchableOpacity>
            <Text style={styles.minimalSubCredit}>
              Iniciativa tecnológica por <Text style={styles.minimalSubCreditBold}>PROTHOTYPE</Text> • v1.2.0-prod
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal Informativo de Status (Pending, Rejected, Inactive, Success) */}
      <GlassModal
        visible={statusModal.visible}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
        title={statusModal.title}
        subtitle="Controle de Acesso & Homologação SMEC Touros"
        maxWidth={480}
      >
        <View style={styles.statusModalBody}>
          <View
            style={[
              styles.statusIconCircle,
              (statusModal.status === 'pending' || statusModal.status === 'success_request') && {
                backgroundColor: '#FEF9E7',
                borderColor: '#FDE68A',
              },
              statusModal.status === 'rejected' && {
                backgroundColor: '#FEF2F2',
                borderColor: '#FECACA',
              },
              statusModal.status === 'inactive' && {
                backgroundColor: '#EFF6FF',
                borderColor: '#BFDBFE',
              },
            ]}
          >
            {statusModal.status === 'approved' ? (
              <CheckCircle2 size={30} color="#15803D" />
            ) : statusModal.status === 'pending' || statusModal.status === 'success_request' ? (
              <Clock size={30} color="#D97706" />
            ) : statusModal.status === 'rejected' ? (
              <XCircle size={30} color="#B91C1C" />
            ) : (
              <AlertCircle size={30} color="#1E40AF" />
            )}
          </View>

          <Text style={styles.statusModalMessage}>{statusModal.message}</Text>

          <GlassButton
            title="Entendido"
            variant="primary"
            size="md"
            onPress={() => setStatusModal(prev => ({ ...prev, visible: false }))}
            style={{ width: '100%', marginTop: 10 }}
          />
        </View>
      </GlassModal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  authWrapper: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  logoDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#CBD5E1',
  },
  systemTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  systemSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  authCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 7,
  },
  tabBtnActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tabBtnActiveGold: {
    backgroundColor: '#FEF9E7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  tabBtnTextActiveGold: {
    color: '#B45309',
    fontWeight: '800',
  },
  formContainer: {
    gap: 14,
  },
  formSectionDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
    lineHeight: 17,
  },
  fieldGroup: {
    gap: 5,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  rowFieldsMobile: {
    flexDirection: 'column',
  },
  label: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    gap: 9,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  dropdownSelectedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownSelectedCode: {
    fontSize: 10.5,
    color: '#1E40AF',
    fontWeight: '700',
    marginTop: 1,
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownOptionName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  dropdownOptionCode: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  submitBtn: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E3A8A',
    marginTop: 4,
  },
  quickAccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    gap: 10,
  },
  quickAccessLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickAccessTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E40AF',
  },
  quickAccessSub: {
    fontSize: 10.5,
    color: '#475569',
    marginTop: 1,
  },
  quickFillBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  quickFillBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
  },
  minimalFooter: {
    marginTop: 24,
    alignItems: 'center',
    gap: 6,
  },
  minimalLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  prismaMiniLogo: {
    width: 20,
    height: 20,
    borderRadius: 5,
    resizeMode: 'contain',
  },
  minimalLinkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#3B82F6',
  },
  minimalSubCredit: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  minimalSubCreditBold: {
    fontWeight: '700',
    color: '#475569',
  },
  statusModalBody: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  statusIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusModalMessage: {
    fontSize: 13.5,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 20,
  },
});

