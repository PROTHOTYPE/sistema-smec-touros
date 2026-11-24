import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  UserCheck,
  UserX,
  Users,
  Clock,
  ShieldAlert,
  Building2,
  Mail,
  Briefcase,
  Calendar,
  CheckCircle2,
  Award,
  Settings2,
  Ban,
  RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { SECTORS, resolveCanonicalSectorId } from '../constants/sectors';
import { UserProfile, SectorId, SectorRole, RoleType, UserStatus } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { GlassModal } from '../components/common/GlassModal';
import { SectorSelectField } from '../components/common/SectorSelectField';

export const AccessRequestsScreen: React.FC = () => {
  const {
    users,
    pendingRequests,
    isSuperAdmin,
    approveAccessRequest,
    rejectAccessRequest,
    updateStaffMember,
    getSectorLeadership,
  } = useAuth();

  // Modal de Homologação (Aprovar Solicitação Pendente)
  const [approvingUser, setApprovingUser] = useState<UserProfile | null>(null);
  const [approvalSectorId, setApprovalSectorId] = useState<SectorId>('pedagogico');
  const [approvalSectorRole, setApprovalSectorRole] = useState<SectorRole>('INTEGRANTE');
  const [approvalSystemRole, setApprovalSystemRole] = useState<RoleType>('COORD_MEMBRO_SETOR');
  const [approvalJobTitle, setApprovalJobTitle] = useState('');
  const [approvalSubarea, setApprovalSubarea] = useState('');

  // Modal de Confirmação de Recusa
  const [rejectingUser, setRejectingUser] = useState<UserProfile | null>(null);

  // Modal de Edição de Servidor Ativo
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);
  const [editSectorId, setEditSectorId] = useState<SectorId>('suporte_ti');
  const [editSectorRole, setEditSectorRole] = useState<SectorRole>('INTEGRANTE');
  const [editSystemRole, setEditSystemRole] = useState<RoleType>('COORD_MEMBRO_SETOR');
  const [editStatus, setEditStatus] = useState<UserStatus>('approved');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editSubarea, setEditSubarea] = useState('');

  if (!isSuperAdmin) {
    return (
      <View style={styles.restrictedContainer}>
        <GlassCard padding={28} style={styles.restrictedCard}>
          <ShieldAlert size={42} color="#1E40AF" />
          <Text style={styles.restrictedTitle}>
            Acesso Exclusivo da Coordenação de Tecnologia da Informação (TI-SMEC)
          </Text>
          <Text style={styles.restrictedText}>
            A homologação de solicitações de acesso e o gerenciamento da liderança dos setores são atribuições exclusivas da Coordenação de Suporte e Manutenção de TI.
          </Text>
        </GlassCard>
      </View>
    );
  }

  const handleOpenApproveModal = (user: UserProfile) => {
    setApprovingUser(user);
    setApprovalSectorId(user.sectorId);
    setApprovalJobTitle(user.jobTitle);
    setApprovalSubarea(user.coordinationSubarea || '');

    // Sugestão inteligente de permissão baseada no setor escolhido
    if (user.sectorId === 'admin_rh') {
      setApprovalSystemRole('TRIAGEM_ADMIN_RH');
    } else if (user.sectorId === 'gabinete') {
      setApprovalSystemRole('EXECUTIVO_GESTAO');
    } else {
      setApprovalSystemRole('COORD_MEMBRO_SETOR');
    }

    // Se o setor ainda não tiver líder aprovado, sugere COORDENADOR por padrão
    const leadership = getSectorLeadership(user.sectorId);
    setApprovalSectorRole(leadership.hasLeader ? 'INTEGRANTE' : 'COORDENADOR');
  };

  const handleConfirmApproval = async () => {
    if (!approvingUser) return;
    await approveAccessRequest(approvingUser.id, {
      sectorId: approvalSectorId,
      sectorRole: approvalSectorRole,
      systemRole: approvalSystemRole,
      jobTitle: approvalJobTitle,
      coordinationSubarea:
        approvalSectorRole === 'COORDENADOR' ? approvalSubarea.trim() : undefined,
    });
    setApprovingUser(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    await rejectAccessRequest(rejectingUser.id);
    setRejectingUser(null);
  };

  const handleOpenEditStaff = (staff: UserProfile) => {
    setEditingStaff(staff);
    setEditSectorId(staff.sectorId);
    setEditSectorRole(staff.sectorRole);
    setEditSystemRole(staff.systemRole || staff.role);
    setEditStatus(staff.status);
    setEditJobTitle(staff.jobTitle || staff.cargo);
    setEditSubarea(staff.coordinationSubarea || '');
  };

  const handleSaveStaffEdit = async () => {
    if (!editingStaff) return;
    await updateStaffMember(editingStaff.id, {
      sectorId: editSectorId,
      sectorRole: editSectorRole,
      systemRole: editSystemRole,
      status: editStatus,
      jobTitle: editJobTitle,
      coordinationSubarea:
        editSectorRole === 'COORDENADOR' ? editSubarea.trim() : undefined,
    });
    setEditingStaff(null);
  };

  const activeAndInactiveStaff = users.filter(
    u => u.status === 'approved' || u.status === 'inactive'
  );

  const getSectorRoleBadge = (sectorRole: SectorRole) => {
    switch (sectorRole) {
      case 'DIRETOR':
        return { label: 'DIRETOR(A)', color: '#B45309', bg: '#FEF9E7', border: '#FDE68A' };
      case 'COORDENADOR':
        return { label: 'COORDENADOR(A)', color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' };
      case 'INTEGRANTE':
      default:
        return { label: 'INTEGRANTE DA EQUIPE', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' };
    }
  };

  const getSystemRoleLabel = (role: RoleType) => {
    switch (role) {
      case 'SUPER_ADMIN_TI':
        return 'Super Admin TI';
      case 'EXECUTIVO_GESTAO':
        return 'Gabinete Executivo';
      case 'TRIAGEM_ADMIN_RH':
        return 'Admin / RH (Protocolo)';
      case 'COORD_MEMBRO_SETOR':
      default:
        return 'Membro / Coord. de Setor';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
    >
      {/* Banner Superior */}
      <GlassCard variant="elevated" padding={18} style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <View style={styles.badgeTI}>
              <Users size={13} color="#1E40AF" />
              <Text style={styles.badgeTIText}>GOVERNANÇA DE ACESSOS & LIDERANÇA — TI</Text>
            </View>
            <Text style={styles.headerTitle}>
              Solicitações de Acesso e Quadro de Servidores
            </Text>
            <Text style={styles.headerDesc}>
              Homologue o cadastro de novos servidores e defina dinamicamente os Coordenadores, Diretores e Integrantes de cada setor da SMEC Touros/RN.
            </Text>
          </View>

          <View style={styles.summaryCounters}>
            <View style={[styles.counterBox, { backgroundColor: '#FEF9E7', borderColor: '#FDE68A' }]}>
              <Text style={[styles.counterValue, { color: '#B45309' }]}>
                {pendingRequests.length}
              </Text>
              <Text style={styles.counterLabel}>Pendentes</Text>
            </View>
            <View style={[styles.counterBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Text style={[styles.counterValue, { color: '#1E40AF' }]}>
                {activeAndInactiveStaff.filter(u => u.status === 'approved').length}
              </Text>
              <Text style={styles.counterLabel}>Servidores Ativos</Text>
            </View>
          </View>
        </View>
      </GlassCard>

      {/* SEÇÃO 1: SOLICITAÇÕES PENDENTES DE HOMOLOGAÇÃO */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Clock size={17} color="#B45309" />
          <Text style={styles.sectionTitle}>
            Solicitações Aguardando Homologação ({pendingRequests.length})
          </Text>
        </View>

        {pendingRequests.length === 0 ? (
          <GlassCard padding={24} style={styles.emptyPendingCard}>
            <CheckCircle2 size={26} color="#15803D" />
            <Text style={styles.emptyPendingTitle}>Nenhuma solicitação pendente</Text>
            <Text style={styles.emptyPendingSub}>
              Todos os pedidos de acesso enviados pelos servidores já foram analisados pela Coordenação de TI.
            </Text>
          </GlassCard>
        ) : (
          <View style={styles.pendingGrid}>
            {pendingRequests.map(req => {
              const requestedSector = SECTORS.find(s => s.id === req.sectorId);
              const formattedDate = new Date(req.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <GlassCard key={req.id} padding={16} style={styles.pendingCard}>
                  <View style={styles.pendingCardTop}>
                    <View style={styles.pendingAvatar}>
                      <Text style={styles.pendingAvatarInitials}>
                        {req.fullName
                          .split(' ')
                          .slice(0, 2)
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pendingName}>{req.fullName}</Text>
                      <View style={styles.pendingMetaLine}>
                        <Mail size={12} color="#64748B" />
                        <Text style={styles.pendingMetaText}>{req.email}</Text>
                      </View>
                    </View>
                    <View style={styles.pendingBadge}>
                      <Clock size={11} color="#B45309" />
                      <Text style={styles.pendingBadgeText}>AGUARDANDO TI</Text>
                    </View>
                  </View>

                  <View style={styles.pendingInfoChips}>
                    <View style={styles.infoChip}>
                      <Briefcase size={12} color="#1E40AF" />
                      <Text style={styles.infoChipText}>Cargo: {req.jobTitle}</Text>
                    </View>
                    <View style={[styles.infoChip, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                      <Building2 size={12} color="#1E40AF" />
                      <Text style={[styles.infoChipText, { color: '#1E40AF', fontWeight: '800' }]}>
                        Setor Solicitado: {requestedSector?.name || req.sectorId}
                      </Text>
                    </View>
                    <View style={styles.infoChip}>
                      <Calendar size={12} color="#64748B" />
                      <Text style={styles.infoChipText}>Pedido em {formattedDate}</Text>
                    </View>
                  </View>

                  <View style={styles.pendingActionsRow}>
                    <GlassButton
                      title="Recusar"
                      icon={<UserX size={15} color="#B91C1C" />}
                      variant="danger"
                      size="sm"
                      onPress={() => setRejectingUser(req)}
                    />
                    <GlassButton
                      title="Aprovar Acesso & Definir Papel"
                      icon={<UserCheck size={15} color="#FFFFFF" />}
                      variant="primary"
                      size="sm"
                      onPress={() => handleOpenApproveModal(req)}
                      style={{ backgroundColor: '#1E40AF', borderColor: '#1E3A8A', flex: 1 }}
                    />
                  </View>
                </GlassCard>
              );
            })}
          </View>
        )}
      </View>

      {/* SEÇÃO 2: GERENCIADOR DE SERVIDORES ATIVOS E LIDERANÇA POR SETOR */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <Award size={17} color="#1E40AF" />
          <Text style={styles.sectionTitle}>
            Quadro de Servidores Ativos e Liderança por Setor (15 Setores Oficiais)
          </Text>
        </View>

        <View style={styles.sectorsStaffList}>
          {SECTORS.map(sec => {
            const leadership = getSectorLeadership(sec.id);
            const sectorUsers = activeAndInactiveStaff.filter(
              u => resolveCanonicalSectorId(u.sectorId) === sec.id
            );

            return (
              <GlassCard key={sec.id} padding={16} style={styles.sectorGroupCard}>
                <View style={styles.sectorGroupHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.sectorTitleLine}>
                      <View style={[styles.sectorCodeBadge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                        <Text style={styles.sectorCodeText}>{sec.code}</Text>
                      </View>
                      <Text style={styles.sectorGroupName}>{sec.name}</Text>
                    </View>
                    <Text
                      style={[
                        styles.sectorLeadershipStatus,
                        leadership.hasLeader ? { color: '#15803D' } : { color: '#B45309' },
                      ]}
                    >
                      {leadership.hasLeader
                        ? `✓ ${leadership.formattedHeaderLabel} • ${leadership.leaderRole}`
                        : `• Coordenação: A definir (${sec.expectedLeadershipRole})`}
                    </Text>
                  </View>

                  <View style={styles.memberCountBadge}>
                    <Text style={styles.memberCountText}>
                      {sectorUsers.length} {sectorUsers.length === 1 ? 'servidor' : 'servidores'}
                    </Text>
                  </View>
                </View>

                {sectorUsers.length === 0 ? (
                  <Text style={styles.emptySectorStaffText}>
                    Nenhum servidor homologado neste setor até o momento (Lotação Aberta).
                  </Text>
                ) : (
                  <View style={styles.staffRowsContainer}>
                    {sectorUsers.map(member => {
                      const roleBadge = getSectorRoleBadge(member.sectorRole);
                      const isMaster = (member.systemRole || member.role) === 'SUPER_ADMIN_TI';
                      const isInactive = member.status === 'inactive';

                      return (
                        <View
                          key={member.id}
                          style={[styles.staffRow, isInactive && styles.staffRowInactive]}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={styles.staffNameLine}>
                              <Text style={styles.staffName}>{member.fullName}</Text>
                              <View
                                style={[
                                  styles.sectorRolePill,
                                  { backgroundColor: roleBadge.bg, borderColor: roleBadge.border },
                                ]}
                              >
                                <Text style={[styles.sectorRolePillText, { color: roleBadge.color }]}>
                                  {roleBadge.label}
                                  {member.coordinationSubarea &&
                                  !member.coordinationSubarea.toLowerCase().startsWith('coordenação geral') &&
                                  !member.jobTitle?.toLowerCase().includes(member.coordinationSubarea.toLowerCase())
                                    ? ` — ${member.coordinationSubarea.toUpperCase()}`
                                    : ''}
                                </Text>
                              </View>
                              {isInactive && (
                                <View style={styles.inactivePill}>
                                  <Text style={styles.inactivePillText}>ACESSO SUSPENSO</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.staffSubMeta}>
                              {member.jobTitle} • {member.email} • Permissão:{' '}
                              <Text style={{ fontWeight: '700', color: '#1E40AF' }}>
                                {getSystemRoleLabel(member.systemRole || member.role)}
                              </Text>
                            </Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => handleOpenEditStaff(member)}
                            style={styles.manageStaffBtn}
                          >
                            <Settings2 size={14} color="#1E40AF" />
                            <Text style={styles.manageStaffBtnText}>
                              {isMaster ? 'Ver Cargo' : 'Gerenciar'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </GlassCard>
            );
          })}
        </View>
      </View>

      {/* MODAL 1: APROVAÇÃO INTELIGENTE DE SOLICITAÇÃO */}
      {approvingUser && (
        <GlassModal
          visible={!!approvingUser}
          onClose={() => setApprovingUser(null)}
          title="Homologar Solicitação de Acesso"
          subtitle={`Servidor(a): ${approvingUser.fullName} (${approvingUser.email})`}
          maxWidth={600}
        >
          <View style={styles.modalForm}>
            {/* Cargo / Função Pública */}
            <View style={styles.field}>
              <Text style={styles.label}>CARGO / FUNÇÃO PÚBLICA DO SERVIDOR</Text>
              <TextInput
                style={styles.input}
                value={approvalJobTitle}
                onChangeText={setApprovalJobTitle}
                placeholder="Ex: Coordenadora de Educação Infantil, Psicóloga..."
              />
            </View>

            {/* Setor de Lotação */}
            <SectorSelectField
              label="CONFIRMAR OU REDEFINIR SETOR DE LOTAÇÃO"
              selectedSectorId={approvalSectorId}
              onSelect={(sectorId: SectorId) => {
                setApprovalSectorId(sectorId);
                if (sectorId === 'admin_rh') {
                  setApprovalSystemRole('TRIAGEM_ADMIN_RH');
                } else if (sectorId === 'gabinete') {
                  setApprovalSystemRole('EXECUTIVO_GESTAO');
                } else {
                  setApprovalSystemRole('COORD_MEMBRO_SETOR');
                }
              }}
              modalTitle="Selecionar Setor de Lotação"
              modalSubtitle="Confirme ou altere o setor oficial de lotação do servidor"
            />

            {/* Papel no Setor (sectorRole) */}
            <View style={styles.field}>
              <Text style={styles.label}>PAPEL HIERÁRQUICO NO SETOR (LIDERANÇA)</Text>
              <View style={styles.optionsColumn}>
                {(
                  [
                    {
                      role: 'COORDENADOR',
                      title: 'Coordenador(a) do Setor ou Subárea',
                      desc: 'Assume a coordenação oficial do setor (ou subárea) e assina o Relatório Anual (PDF).',
                    },
                    {
                      role: 'DIRETOR',
                      title: 'Diretor(a) do Setor',
                      desc: 'Para setores que possuem diretoria própria (Pedagógico, Cultura, Avaliação, RH, Gabinete).',
                    },
                    {
                      role: 'INTEGRANTE',
                      title: 'Integrante da Equipe',
                      desc: 'Membro regular da equipe técnica ou operacional do setor (Lotação Aberta).',
                    },
                  ] as { role: SectorRole; title: string; desc: string }[]
                ).map(opt => {
                  const selected = approvalSectorRole === opt.role;
                  return (
                    <TouchableOpacity
                      key={opt.role}
                      onPress={() => setApprovalSectorRole(opt.role)}
                      style={[styles.roleOptionCard, selected && styles.roleOptionCardActive]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.roleOptionTitle,
                            selected && { color: '#1E40AF' },
                          ]}
                        >
                          {opt.title}
                        </Text>
                        <Text style={styles.roleOptionDesc}>{opt.desc}</Text>
                      </View>
                      {selected && <CheckCircle2 size={17} color="#1E40AF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Subárea de Coordenação (Opcional — para Coordenadores) */}
            {approvalSectorRole === 'COORDENADOR' && (
              <View style={styles.field}>
                <Text style={styles.label}>SUBÁREA DE COORDENAÇÃO (OPCIONAL)</Text>
                <TextInput
                  style={styles.input}
                  value={approvalSubarea}
                  onChangeText={setApprovalSubarea}
                  placeholder="Ex: Ensino Infantil, Ensino Fundamental / EJA, Educação Integral..."
                />
                <View style={styles.subareaChipsWrap}>
                  {[
                    'Ensino Infantil (DEI)',
                    'Ensino Fundamental / EJA',
                    'Educação Integral',
                    'Prestação de Contas e Convênios',
                    'Avaliação de Desempenho',
                  ].map(sub => (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => setApprovalSubarea(sub)}
                      style={[
                        styles.sectorChip,
                        approvalSubarea === sub && styles.sectorChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sectorChipText,
                          approvalSubarea === sub && styles.sectorChipTextActive,
                        ]}
                      >
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Permissão no Sistema (systemRole) */}
            <View style={styles.field}>
              <Text style={styles.label}>PERMISSÃO NO SISTEMA (RBAC)</Text>
              <View style={styles.optionsColumn}>
                {(
                  [
                    {
                      role: 'COORD_MEMBRO_SETOR',
                      title: 'Setor Executor (COORD_MEMBRO_SETOR)',
                      desc: 'Acesso restrito exclusivamente ao Mural e Relatório Anual do próprio setor.',
                    },
                    {
                      role: 'TRIAGEM_ADMIN_RH',
                      title: 'Administrativo / RH (TRIAGEM_ADMIN_RH)',
                      desc: 'Acesso ao Protocolo Central de Ofícios, Panorama dos Setores e estorno.',
                    },
                    {
                      role: 'EXECUTIVO_GESTAO',
                      title: 'Gabinete Executivo (EXECUTIVO_GESTAO)',
                      desc: 'Visão panorâmica de todos os setores para Secretário(a) e Adjunto(a).',
                    },
                  ] as { role: RoleType; title: string; desc: string }[]
                ).map(opt => {
                  const selected = approvalSystemRole === opt.role;
                  return (
                    <TouchableOpacity
                      key={opt.role}
                      onPress={() => setApprovalSystemRole(opt.role)}
                      style={[styles.roleOptionCard, selected && styles.roleOptionCardActive]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.roleOptionTitle,
                            selected && { color: '#1E40AF' },
                          ]}
                        >
                          {opt.title}
                        </Text>
                        <Text style={styles.roleOptionDesc}>{opt.desc}</Text>
                      </View>
                      {selected && <CheckCircle2 size={17} color="#1E40AF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.modalActions}>
              <GlassButton
                title="Cancelar"
                variant="ghost"
                size="sm"
                onPress={() => setApprovingUser(null)}
                style={{ flex: 1 }}
              />
              <GlassButton
                title="Homologar e Liberar Acesso"
                icon={<UserCheck size={15} color="#FFFFFF" />}
                variant="primary"
                size="sm"
                onPress={handleConfirmApproval}
                style={{ flex: 1.5, backgroundColor: '#1E40AF', borderColor: '#1E3A8A' }}
              />
            </View>
          </View>
        </GlassModal>
      )}

      {/* MODAL 2: CONFIRMAÇÃO DE RECUSA DE SOLICITAÇÃO */}
      {rejectingUser && (
        <GlassModal
          visible={!!rejectingUser}
          onClose={() => setRejectingUser(null)}
          title="Recusar Solicitação de Acesso"
          subtitle={rejectingUser.fullName}
          maxWidth={440}
        >
          <View style={{ gap: 12 }}>
            <Text style={styles.headerDesc}>
              Deseja recusar a solicitação de acesso enviada por{' '}
              <Text style={{ fontWeight: '800', color: '#0F172A' }}>{rejectingUser.fullName}</Text> ({rejectingUser.email})?
            </Text>
            <View style={styles.modalActions}>
              <GlassButton
                title="Voltar"
                variant="ghost"
                size="sm"
                onPress={() => setRejectingUser(null)}
                style={{ flex: 1 }}
              />
              <GlassButton
                title="Confirmar Recusa"
                icon={<UserX size={15} color="#B91C1C" />}
                variant="danger"
                size="sm"
                onPress={handleConfirmReject}
                style={{ flex: 1.2 }}
              />
            </View>
          </View>
        </GlassModal>
      )}

      {/* MODAL 3: GERENCIAR SERVIDOR ATIVO (TRANSFERIR SETOR, PROMOVER LIDERANÇA OU DESATIVAR) */}
      {editingStaff && (
        <GlassModal
          visible={!!editingStaff}
          onClose={() => setEditingStaff(null)}
          title="Gerenciar Servidor e Liderança"
          subtitle={`${editingStaff.fullName} • ${editingStaff.email}`}
          maxWidth={600}
        >
          <View style={styles.modalForm}>
            <View style={styles.field}>
              <Text style={styles.label}>CARGO / FUNÇÃO PÚBLICA</Text>
              <TextInput
                style={styles.input}
                value={editJobTitle}
                onChangeText={setEditJobTitle}
              />
            </View>

            {/* Transferência de Setor */}
            <SectorSelectField
              label="TRANSFERIR OU MANTER SETOR DE LOTAÇÃO"
              selectedSectorId={editSectorId}
              onSelect={(sectorId: SectorId) => setEditSectorId(sectorId)}
              modalTitle="Transferir Setor de Lotação"
              modalSubtitle="Selecione o setor oficial de destino para o servidor"
            />

            {/* Alterar Papel no Setor */}
            <View style={styles.field}>
              <Text style={styles.label}>PAPEL NO SETOR (DIRETOR / COORDENADOR / INTEGRANTE)</Text>
              <View style={styles.rowChips}>
                {(['COORDENADOR', 'DIRETOR', 'INTEGRANTE'] as SectorRole[]).map(sr => {
                  const selected = editSectorRole === sr;
                  return (
                    <TouchableOpacity
                      key={sr}
                      onPress={() => setEditSectorRole(sr)}
                      style={[styles.sectorChip, { flex: 1, alignItems: 'center' }, selected && styles.sectorChipActive]}
                    >
                      <Text style={[styles.sectorChipText, selected && styles.sectorChipTextActive]}>
                        {sr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Subárea de Coordenação (Opcional — para Coordenadores) */}
            {editSectorRole === 'COORDENADOR' && (
              <View style={styles.field}>
                <Text style={styles.label}>SUBÁREA DE COORDENAÇÃO (OPCIONAL)</Text>
                <TextInput
                  style={styles.input}
                  value={editSubarea}
                  onChangeText={setEditSubarea}
                  placeholder="Ex: Ensino Infantil, Ensino Fundamental / EJA, Educação Integral..."
                />
              </View>
            )}

            {/* Permissão RBAC (exceto para o Super Admin TI que é fixo) */}
            {(editingStaff.systemRole || editingStaff.role) !== 'SUPER_ADMIN_TI' && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>PERMISSÃO NO SISTEMA</Text>
                  <View style={styles.rowChips}>
                    {(
                      [
                        { r: 'COORD_MEMBRO_SETOR', l: 'Setor Executor' },
                        { r: 'TRIAGEM_ADMIN_RH', l: 'Admin / RH' },
                        { r: 'EXECUTIVO_GESTAO', l: 'Gabinete' },
                      ] as { r: RoleType; l: string }[]
                    ).map(item => {
                      const selected = editSystemRole === item.r;
                      return (
                        <TouchableOpacity
                          key={item.r}
                          onPress={() => setEditSystemRole(item.r)}
                          style={[
                            styles.sectorChip,
                            { flex: 1, alignItems: 'center' },
                            selected && styles.sectorChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.sectorChipText,
                              selected && styles.sectorChipTextActive,
                            ]}
                          >
                            {item.l}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Status de Acesso (Ativo vs Suspenso/Inativo) */}
                <View style={styles.field}>
                  <Text style={styles.label}>STATUS DE ACESSO DO SERVIDOR</Text>
                  <View style={styles.rowChips}>
                    <TouchableOpacity
                      onPress={() => setEditStatus('approved')}
                      style={[
                        styles.statusToggleBtn,
                        editStatus === 'approved' && styles.statusToggleBtnActive,
                      ]}
                    >
                      <RefreshCw
                        size={14}
                        color={editStatus === 'approved' ? '#15803D' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.statusToggleText,
                          editStatus === 'approved' && { color: '#15803D', fontWeight: '800' },
                        ]}
                      >
                        Acesso Ativo (Aprovado)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setEditStatus('inactive')}
                      style={[
                        styles.statusToggleBtn,
                        editStatus === 'inactive' && styles.statusToggleBtnDanger,
                      ]}
                    >
                      <Ban
                        size={14}
                        color={editStatus === 'inactive' ? '#B91C1C' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.statusToggleText,
                          editStatus === 'inactive' && { color: '#B91C1C', fontWeight: '800' },
                        ]}
                      >
                        Suspender Acesso (Inativo)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <GlassButton
                title="Cancelar"
                variant="ghost"
                size="sm"
                onPress={() => setEditingStaff(null)}
                style={{ flex: 1 }}
              />
              <GlassButton
                title="Salvar Alterações"
                variant="primary"
                size="sm"
                onPress={handleSaveStaffEdit}
                style={{ flex: 1.4, backgroundColor: '#1E40AF', borderColor: '#1E3A8A' }}
              />
            </View>
          </View>
        </GlassModal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 90,
    gap: 18,
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
    gap: 14,
  },
  headerInfo: {
    flex: 1,
    minWidth: 240,
  },
  badgeTI: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 5,
    marginBottom: 6,
  },
  badgeTIText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  headerDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  summaryCounters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  counterBox: {
    minWidth: 105,
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  counterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyPendingCard: {
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  emptyPendingTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyPendingSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  pendingGrid: {
    gap: 10,
  },
  pendingCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 12,
  },
  pendingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  pendingAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAvatarInitials: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  pendingName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  pendingMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  pendingMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9E7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  pendingBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },
  pendingInfoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  infoChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  pendingActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  sectorsStaffList: {
    gap: 10,
  },
  sectorGroupCard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  sectorGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  sectorTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectorCodeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  sectorCodeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
  },
  sectorGroupName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectorLeadershipStatus: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 3,
  },
  memberCountBadge: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  memberCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  emptySectorStaffText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  staffRowsContainer: {
    gap: 8,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  staffRowInactive: {
    opacity: 0.65,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  staffNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  staffName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectorRolePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  sectorRolePillText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  inactivePill: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  inactivePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B91C1C',
  },
  staffSubMeta: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 3,
  },
  manageStaffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    gap: 5,
  },
  manageStaffBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E40AF',
  },
  modalForm: {
    gap: 12,
  },
  field: {
    gap: 5,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  subareaChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 2,
  },
  sectorChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  sectorChipActive: {
    borderColor: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  sectorChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  sectorChipTextActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
  optionsColumn: {
    gap: 6,
  },
  roleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    padding: 10,
    gap: 10,
  },
  roleOptionCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  roleOptionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rowChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusToggleBtn: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 8,
    gap: 6,
  },
  statusToggleBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  statusToggleBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  statusToggleText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  restrictedContainer: {
    flex: 1,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictedCard: {
    alignItems: 'center',
    maxWidth: 440,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  restrictedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 4,
  },
  restrictedText: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});

