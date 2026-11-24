import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { FileText, Plus, ShieldAlert, FileCheck, Trash2 } from 'lucide-react-native';
import { useDemands } from '../context/DemandsContext';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { GlassModal } from '../components/common/GlassModal';
import { DemandCard } from '../components/demands/DemandCard';
import { DemandDetailsModal } from '../components/demands/DemandDetailsModal';
import { CreateOficioModal } from '../components/demands/CreateOficioModal';
import { Demand } from '../types';
import { SECTORS } from '../constants/sectors';

export const ProtocolScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { demands, deleteDemand } = useDemands();
  const { canCreateOficio, currentUser } = useAuth();

  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [demandToDelete, setDemandToDelete] = useState<Demand | null>(null);

  const canDeleteRecord =
    currentUser?.role === 'TRIAGEM_ADMIN_RH' || currentUser?.role === 'SUPER_ADMIN_TI';

  // Guarda de acesso: exclusivo para RH, Super Admin TI e Gestão Executiva
  if (!currentUser || currentUser.role === 'COORD_MEMBRO_SETOR') {
    return (
      <View style={styles.restrictedContainer}>
        <GlassCard padding={24} style={styles.restrictedCard}>
          <ShieldAlert size={40} color="#1E40AF" />
          <Text style={styles.restrictedTitle}>Acesso Reservado ao RH e Gestão</Text>
          <Text style={styles.restrictedText}>
            A tela de Protocolo Central de Ofícios é restrita ao Setor Administrativo / RH e ao Gabinete Executivo.
            Os ofícios endereçados à sua coordenação são disponibilizados diretamente no seu Mural de Demandas.
          </Text>
        </GlassCard>
      </View>
    );
  }

  // Filtra apenas demandas que são Ofícios Formais
  const oficios = demands.filter(d => d.originType === 'oficio_formal');

  const stats = {
    total: oficios.length,
    concluidos: oficios.filter(d => d.status === 'concluida').length,
    parciais: oficios.filter(d => d.status === 'parcial').length,
    pendentes: oficios.filter(d => d.status === 'pendente' || d.status === 'em_andamento').length,
  };

  const listHeader = (
    <GlassCard
      variant="elevated"
      padding={isMobile ? 12 : 18}
      style={[styles.headerCard, isMobile && styles.headerCardMobile]}
    >
      <View style={[styles.headerRow, isMobile && styles.headerRowMobile]}>
        <View style={styles.headerInfo}>
          <View style={styles.badgeRH}>
            <FileText size={12} color="#1E40AF" />
            <Text style={styles.badgeRHText}>PROTOCOLO CENTRAL & RH</Text>
          </View>
          <Text style={[styles.headerTitle, isMobile && styles.headerTitleMobile]}>
            Central de Ofícios Formais Físicos
          </Text>
          <Text style={[styles.headerDesc, isMobile && styles.headerDescMobile]}>
            Única porta de entrada para digitalização e protocolo de documentos oficiais externos endereçados à SMEC Touros/RN.
          </Text>
        </View>

        {canCreateOficio && (
          <GlassButton
            title="Novo Ofício"
            icon={<Plus size={15} color="#FFFFFF" />}
            onPress={() => setCreateModalVisible(true)}
            variant="primary"
            size={isMobile ? 'sm' : 'md'}
            style={[
              { backgroundColor: '#1E40AF', borderColor: '#1E3A8A' },
              isMobile && { width: '100%' },
            ]}
          />
        )}
      </View>

      {/* Métricas dos Ofícios (Grelha 2x2 Compacta no Mobile) */}
      <View style={[styles.statsRow, isMobile && styles.statsRowMobile]}>
        <View style={[styles.statBox, isMobile && styles.statBoxMobile]}>
          <Text style={[styles.statVal, isMobile && styles.statValMobile]}>{stats.total}</Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]}>Total Tramitado</Text>
        </View>
        <View
          style={[
            styles.statBox,
            isMobile && styles.statBoxMobile,
            { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
          ]}
        >
          <Text style={[styles.statVal, isMobile && styles.statValMobile, { color: '#15803D' }]}>
            {stats.concluidos}
          </Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile, { color: '#166534' }]}>
            Atendidos 100%
          </Text>
        </View>
        <View
          style={[
            styles.statBox,
            isMobile && styles.statBoxMobile,
            { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
          ]}
        >
          <Text style={[styles.statVal, isMobile && styles.statValMobile, { color: '#B45309' }]}>
            {stats.parciais}
          </Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile, { color: '#92400E' }]}>
            Parciais
          </Text>
        </View>
        <View
          style={[
            styles.statBox,
            isMobile && styles.statBoxMobile,
            { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF' },
          ]}
        >
          <Text style={[styles.statVal, isMobile && styles.statValMobile, { color: '#0369A1' }]}>
            {stats.pendentes}
          </Text>
          <Text style={[styles.statLabel, isMobile && styles.statLabelMobile, { color: '#075985' }]}>
            Em Aberto
          </Text>
        </View>
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      {/* Lista de Ofícios com Cabeçalho Integrado (Rolagem Vertical Livre) */}
      <FlatList
        style={styles.flatList}
        data={oficios}
        keyExtractor={item => item.id}
        ListHeaderComponent={listHeader}
        showsVerticalScrollIndicator={true}
        renderItem={({ item }) => (
          <DemandCard
            demand={item}
            onPress={() => setSelectedDemand(item)}
            showDeleteButton={canDeleteRecord}
            onDeletePress={() => setDemandToDelete(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <GlassCard padding={32} style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <FileCheck size={30} color="#2563EB" />
              </View>
              <Text style={styles.emptyTitle}>Fila de trabalho em dia</Text>
              <Text style={styles.emptyDesc}>
                Nenhuma demanda ou ofício pendente para este setor no momento.
              </Text>
              {canCreateOficio && (
                <GlassButton
                  title="Protocolar Ofício"
                  icon={<FileText size={15} color="#FFFFFF" />}
                  onPress={() => setCreateModalVisible(true)}
                  variant="primary"
                  size="sm"
                  style={{ backgroundColor: '#1E40AF', borderColor: '#1E3A8A', marginTop: 14 }}
                />
              )}
            </GlassCard>
          </View>
        }
      />

      <CreateOficioModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />

      <DemandDetailsModal
        demand={selectedDemand}
        visible={!!selectedDemand}
        onClose={() => setSelectedDemand(null)}
      />

      {/* Modal de Confirmação de Exclusão / Estorno na Listagem de Protocolos */}
      {canDeleteRecord && demandToDelete && (
        <GlassModal
          visible={!!demandToDelete}
          onClose={() => setDemandToDelete(null)}
          title="Confirmar Exclusão / Estorno de Ofício"
          subtitle={`Protocolo: ${demandToDelete.protocolNumber}`}
          maxWidth={480}
        >
          <View style={styles.confirmModalBody}>
            <Text style={styles.confirmModalText}>
              Deseja realmente excluir ou cancelar o envio do ofício{' '}
              <Text style={{ fontWeight: '800', color: '#0F172A' }}>{demandToDelete.title}</Text> ({demandToDelete.protocolNumber})?
            </Text>
            <Text style={styles.confirmModalSubtext}>
              Esta ação retirará o registro da fila do setor{' '}
              <Text style={{ fontWeight: '700' }}>
                {SECTORS.find(s => s.id === demandToDelete.targetSectorId)?.name || demandToDelete.targetSectorId}
              </Text>{' '}
              para correção ou reencaminhamento pelo RH.
            </Text>

            <View style={styles.confirmModalActions}>
              <GlassButton
                title="Cancelar"
                variant="ghost"
                size="sm"
                onPress={() => setDemandToDelete(null)}
                style={{ flex: 1 }}
              />
              <GlassButton
                title="Confirmar Exclusão"
                icon={<Trash2 size={15} color="#B91C1C" />}
                variant="danger"
                size="sm"
                onPress={async () => {
                  const idToRemove = demandToDelete.id;
                  setDemandToDelete(null);
                  await deleteDemand(idToRemove);
                }}
                style={{ flex: 1.3 }}
              />
            </View>
          </View>
        </GlassModal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  flatList: {
    flex: 1,
    width: '100%',
  },
  headerCard: {
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.12)',
  },
  headerCardMobile: {
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  headerRowMobile: {
    gap: 8,
    marginBottom: 10,
  },
  headerInfo: {
    flex: 1,
    minWidth: 220,
  },
  badgeRH: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 4,
  },
  badgeRHText: {
    fontSize: 9.5,
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
  headerTitleMobile: {
    fontSize: 15,
  },
  headerDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  headerDescMobile: {
    fontSize: 11,
    lineHeight: 14.5,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 8,
  },
  statsRowMobile: {
    paddingTop: 8,
    gap: 6,
  },
  statBox: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    alignItems: 'center',
  },
  statBoxMobile: {
    flexBasis: '47%',
    minWidth: '47%',
    padding: 10,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  statValMobile: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 9.5,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: 1,
    textAlign: 'center',
  },
  statLabelMobile: {
    fontSize: 9,
  },
  listContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  emptyContainer: {
    paddingVertical: 44,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
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
