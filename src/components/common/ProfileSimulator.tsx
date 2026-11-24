import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import {
  UserCheck,
  ChevronDown,
  Shield,
  FileText,
  CheckCircle2,
  User,
  HeartHandshake,
  LogOut,
  Info,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from './GlassCard';
import { SECTORS } from '../../constants/sectors';

interface ProfileSimulatorProps {
  compact?: boolean;
  headerMode?: boolean;
  style?: any;
}

export const ProfileSimulator: React.FC<ProfileSimulatorProps> = ({
  compact = false,
  headerMode = false,
  style,
}) => {
  const { currentUser, setCurrentUser, availableProfiles, logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  const getRoleBadge = (role: string, sectorId?: string, sectorRole?: string) => {
    const sec = SECTORS.find(s => s.id === sectorId || s.code === sectorId);
    const secCode = sec?.code || sectorId?.toUpperCase() || '';

    switch (role) {
      case 'SUPER_ADMIN_TI':
        return {
          label: `SUPER ADMIN TI • ${secCode}`,
          color: '#1E40AF',
          bg: '#EFF6FF',
          border: '#BFDBFE',
        };
      case 'EXECUTIVO_GESTAO':
        return {
          label: `GABINETE EXECUTIVO • ${secCode}`,
          color: '#B45309',
          bg: '#FEF3C7',
          border: '#FDE68A',
        };
      case 'TRIAGEM_ADMIN_RH':
        return {
          label: `ADMIN / RH • ${secCode}`,
          color: '#1E40AF',
          bg: '#EFF6FF',
          border: '#BFDBFE',
        };
      case 'COORD_MEMBRO_SETOR':
      default:
        return {
          label: `${sectorRole || 'SETOR'} • ${secCode}`,
          color: '#15803D',
          bg: '#DCFCE7',
          border: '#BBF7D0',
        };
    }
  };

  if (!currentUser) return null;

  const canSimulateProfile =
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    (currentUser.systemRole === 'SUPER_ADMIN_TI' || currentUser.role === 'SUPER_ADMIN_TI');

  if (!canSimulateProfile) {
    return null;
  }

  const currentBadge = getRoleBadge(
    currentUser.systemRole || currentUser.role,
    currentUser.sectorId,
    currentUser.sectorRole
  );

  const renderProfileModal = () => (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalCardWrapper}
          onPress={e => e.stopPropagation()}
        >
          <GlassCard variant="elevated" padding={20} intensity={70} style={styles.modalGlass}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Simular Perfil de Servidor Aprovado</Text>
                <Text style={styles.modalSubtitle}>
                  Alterne rapidamente entre Pedro Carlos (Super Admin TI) e os servidores homologados:
                </Text>
              </View>
            </View>

            {availableProfiles.length <= 1 && (
              <View style={styles.infoHintBox}>
                <Info size={15} color="#1E40AF" />
                <Text style={styles.infoHintText}>
                  No momento, apenas o usuário mestre <Text style={{ fontWeight: '800' }}>Pedro Carlos (TI)</Text> está cadastrado. À medida que novos servidores solicitarem acesso e forem homologados na aba <Text style={{ fontWeight: '800' }}>"Solicitações de Acesso"</Text>, eles aparecerão automaticamente nesta lista para simulação rápida.
                </Text>
              </View>
            )}

            <ScrollView style={styles.profilesList} showsVerticalScrollIndicator={false}>
              {availableProfiles.map(p => {
                const isSelected = p.id === currentUser.id;
                const b = getRoleBadge(p.systemRole || p.role, p.sectorId, p.sectorRole);
                const sec = SECTORS.find(s => s.id === p.sectorId || s.code === p.sectorId);

                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      setCurrentUser(p);
                      setModalVisible(false);
                    }}
                    activeOpacity={0.75}
                    style={[
                      styles.profileOption,
                      isSelected && { borderColor: b.color, backgroundColor: '#F8FAFC' },
                    ]}
                  >
                    <View
                      style={[
                        styles.optionAvatar,
                        { backgroundColor: b.bg, borderColor: b.color },
                      ]}
                    >
                      {p.sectorId === 'multidisciplinar' ? (
                        <HeartHandshake size={18} color={b.color} />
                      ) : (
                        <User size={18} color={b.color} />
                      )}
                    </View>

                    <View style={styles.optionInfo}>
                      <View style={styles.optionTopRow}>
                        <Text style={styles.optionName}>{p.fullName || p.name}</Text>
                        <View
                          style={[
                            styles.roleTag,
                            { backgroundColor: b.bg, borderColor: b.border },
                          ]}
                        >
                          <Text style={[styles.roleText, { color: b.color }]}>{b.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.optionCargo}>
                        {p.jobTitle || p.cargo} • {sec?.name || p.sectorId}
                      </Text>

                      <View style={styles.permissionTagsRow}>
                        {(p.systemRole || p.role) === 'TRIAGEM_ADMIN_RH' && (
                          <View style={styles.permPill}>
                            <FileText size={11} color="#7E22CE" />
                            <Text style={[styles.permPillText, { color: '#7E22CE' }]}>
                              Protocolo Central de Ofícios + Panorama dos Setores
                            </Text>
                          </View>
                        )}
                        {(p.systemRole || p.role) === 'SUPER_ADMIN_TI' && (
                          <View style={styles.permPill}>
                            <Shield size={11} color="#1E40AF" />
                            <Text style={[styles.permPillText, { color: '#1E40AF' }]}>
                              Pedro Carlos: Homologação de Acessos, TI & Administração Geral
                            </Text>
                          </View>
                        )}
                        {(p.systemRole || p.role) === 'EXECUTIVO_GESTAO' && (
                          <View style={styles.permPill}>
                            <CheckCircle2 size={11} color="#B45309" />
                            <Text style={[styles.permPillText, { color: '#B45309' }]}>
                              Visão Panorâmica do Gabinete Executivo
                            </Text>
                          </View>
                        )}
                        {(p.systemRole || p.role) === 'COORD_MEMBRO_SETOR' && (
                          <View style={styles.permPill}>
                            <CheckCircle2 size={11} color="#15803D" />
                            <Text style={[styles.permPillText, { color: '#15803D' }]}>
                              Papel no setor: {p.sectorRole || 'INTEGRANTE'} • Isolado no próprio setor
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {isSelected && (
                      <View style={[styles.selectedCheck, { backgroundColor: b.color }]}>
                        <CheckCircle2 size={15} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </GlassCard>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  if (headerMode) {
    return (
      <>
        <View style={[styles.headerContainer, style]}>
          <View style={styles.headerUserBlock}>
            <View
              style={[
                styles.headerAvatar,
                { borderColor: currentBadge.border, backgroundColor: currentBadge.bg },
              ]}
            >
              <UserCheck size={17} color={currentBadge.color} />
            </View>

            <View style={styles.headerUserTextCol}>
              <Text style={styles.headerUserName}>{currentUser.fullName || currentUser.name}</Text>
              <View style={styles.headerBadgeRow}>
                <View
                  style={[
                    styles.headerRoleTag,
                    { backgroundColor: currentBadge.bg, borderColor: currentBadge.border },
                  ]}
                >
                  <Text style={[styles.headerRoleText, { color: currentBadge.color }]}>
                    {currentBadge.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
            style={styles.headerSwitchBtn}
          >
            <Text style={styles.headerSwitchBtnText}>Simular Perfil</Text>
            <ChevronDown size={14} color="#1E40AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={logout}
            activeOpacity={0.8}
            style={styles.headerLogoutBtn}
          >
            <LogOut size={14} color="#B91C1C" />
            <Text style={styles.headerLogoutBtnText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {renderProfileModal()}
      </>
    );
  }

  return (
    <>
      <View style={[styles.mobileWrapper, style]}>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
          style={[styles.pillButton, compact && styles.pillButtonCompact, { flex: 1 }]}
        >
          <GlassCard
            padding={compact ? 8 : 10}
            variant="elevated"
            borderColor={currentBadge.border}
            style={[styles.card, compact && styles.cardCompact]}
          >
            <View style={[styles.pillContent, compact && styles.pillContentCompact]}>
              <View
                style={[
                  styles.avatarCircle,
                  compact && styles.avatarCircleCompact,
                  { borderColor: currentBadge.color, backgroundColor: currentBadge.bg },
                ]}
              >
                <UserCheck size={compact ? 14 : 16} color={currentBadge.color} />
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.userName, compact && styles.userNameCompact]}>
                  {currentUser.fullName || currentUser.name}
                </Text>
                <View
                  style={[
                    styles.roleTag,
                    compact && styles.roleTagCompact,
                    { backgroundColor: currentBadge.bg, borderColor: currentBadge.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      compact && styles.roleTextCompact,
                      { color: currentBadge.color },
                    ]}
                  >
                    {currentBadge.label}
                  </Text>
                </View>
              </View>

              <View style={[styles.switchPrompt, compact && styles.switchPromptCompact]}>
                <Text style={[styles.switchText, compact && styles.switchTextCompact]}>
                  Simular Perfil
                </Text>
                <ChevronDown size={13} color="#1E40AF" />
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity onPress={logout} activeOpacity={0.8} style={styles.mobileLogoutBtn}>
          <LogOut size={15} color="#B91C1C" />
          <Text style={styles.headerLogoutBtnText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {renderProfileModal()}
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  headerUserBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 4,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerUserTextCol: {
    justifyContent: 'center',
  },
  headerUserName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerRoleTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  headerRoleText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  headerSwitchBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E40AF',
  },
  headerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  headerLogoutBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#B91C1C',
  },
  mobileWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 4,
    marginBottom: 8,
  },
  pillButton: {
    marginBottom: 12,
  },
  pillButtonCompact: {
    marginBottom: 8,
  },
  card: {
    borderRadius: 14,
  },
  cardCompact: {
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillContentCompact: {
    gap: 8,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarCircleCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.2,
    marginRight: 4,
  },
  textContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  userNameCompact: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  roleTagCompact: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  roleTextCompact: {
    fontSize: 9,
    fontWeight: '700',
  },
  switchPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
    gap: 4,
  },
  switchPromptCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
    gap: 3,
  },
  switchText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '700',
  },
  switchTextCompact: {
    fontSize: 10,
    color: '#1E40AF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCardWrapper: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
  },
  modalGlass: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.16)',
  },
  modalHeader: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  infoHintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  infoHintText: {
    flex: 1,
    fontSize: 11.5,
    color: '#1E3A8A',
    lineHeight: 16,
  },
  profilesList: {
    maxHeight: 460,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  optionAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionCargo: {
    fontSize: 12,
    color: '#64748B',
  },
  permissionTagsRow: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 6,
    flexWrap: 'wrap',
  },
  permPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 4,
  },
  permPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  selectedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
