import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Cpu,
  Building2,
  Landmark,
  Baby,
  LineChart,
  GraduationCap,
  SearchCheck,
  Trophy,
  BarChart3,
  Palette,
  Bus,
  Apple,
  HeartHandshake,
  Megaphone,
  PackageCheck,
  FileCheck2,
  ChevronDown,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react-native';
import { SECTORS } from '../../constants/sectors';
import { Sector, SectorId } from '../../types';

export const renderSectorIcon = (iconName: string, color: string, size = 18) => {
  const props = { size, color };
  switch (iconName) {
    case 'Cpu':
      return <Cpu {...props} />;
    case 'Building2':
      return <Building2 {...props} />;
    case 'Landmark':
      return <Landmark {...props} />;
    case 'HeartHandshake':
      return <HeartHandshake {...props} />;
    case 'Baby':
      return <Baby {...props} />;
    case 'LineChart':
      return <LineChart {...props} />;
    case 'GraduationCap':
      return <GraduationCap {...props} />;
    case 'SearchCheck':
      return <SearchCheck {...props} />;
    case 'Trophy':
      return <Trophy {...props} />;
    case 'BarChart3':
      return <BarChart3 {...props} />;
    case 'Palette':
      return <Palette {...props} />;
    case 'Bus':
      return <Bus {...props} />;
    case 'Apple':
      return <Apple {...props} />;
    case 'Megaphone':
      return <Megaphone {...props} />;
    case 'PackageCheck':
      return <PackageCheck {...props} />;
    case 'FileCheck2':
      return <FileCheck2 {...props} />;
    default:
      return <Building2 {...props} />;
  }
};

interface SectorPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedSectorId: SectorId;
  onSelect: (sectorId: SectorId) => void;
  title?: string;
  subtitle?: string;
}

export const SectorPickerModal: React.FC<SectorPickerModalProps> = ({
  visible,
  onClose,
  selectedSectorId,
  onSelect,
  title = 'Selecionar Setor da SMEC Touros',
  subtitle = '15 setores oficiais • Pesquise por nome, sigla ou área de atuação',
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSectors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SECTORS;
    return SECTORS.filter(
      sec =>
        sec.name.toLowerCase().includes(q) ||
        sec.shortName.toLowerCase().includes(q) ||
        sec.code.toLowerCase().includes(q) ||
        sec.description.toLowerCase().includes(q) ||
        sec.expectedLeadershipRole.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleChoose = (id: SectorId) => {
    onSelect(id);
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isMobile ? 'slide' : 'fade'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={[styles.overlay, isMobile ? styles.overlayMobile : styles.overlayDesktop]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={[
              styles.modalContainer,
              isMobile ? styles.modalContainerMobile : styles.modalContainerDesktop,
            ]}
          >
            {isMobile && <View style={styles.bottomSheetHandle} />}

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalSubtitle}>{subtitle}</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Real-time Search Box */}
            <View style={styles.searchWrapper}>
              <View style={styles.searchBox}>
                <Search size={16} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Filtrar setor por nome, sigla (ex: ADM-RH) ou área..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Text style={styles.clearBtnText}>Limpar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Vertical Scrollable List with Visible Scrollbar */}
            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {filteredSectors.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>Nenhum setor encontrado</Text>
                  <Text style={styles.emptySub}>
                    Tente buscar por outro termo ou sigla institucional.
                  </Text>
                </View>
              ) : (
                filteredSectors.map((sec: Sector) => {
                  const isSelected = sec.id === selectedSectorId;
                  return (
                    <TouchableOpacity
                      key={sec.id}
                      activeOpacity={0.75}
                      onPress={() => handleChoose(sec.id)}
                      style={[
                        styles.sectorItem,
                        isSelected && {
                          borderColor: sec.accentColor || '#1E40AF',
                          backgroundColor: '#EFF6FF',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.itemIconCircle,
                          {
                            backgroundColor: `${sec.accentColor || '#1E40AF'}15`,
                            borderColor: `${sec.accentColor || '#1E40AF'}40`,
                          },
                        ]}
                      >
                        {renderSectorIcon(sec.icon, sec.accentColor || '#1E40AF', 19)}
                      </View>

                      <View style={styles.itemBody}>
                        <View style={styles.itemHeaderLine}>
                          <Text
                            style={[
                              styles.itemName,
                              isSelected && { color: '#1E40AF', fontWeight: '800' },
                            ]}
                            numberOfLines={1}
                          >
                            {sec.name}
                          </Text>
                          <View
                            style={[
                              styles.codeBadge,
                              {
                                backgroundColor: isSelected ? '#DBEAFE' : '#F1F5F9',
                                borderColor: isSelected ? '#93C5FD' : '#CBD5E1',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.codeBadgeText,
                                { color: isSelected ? '#1E40AF' : '#475569' },
                              ]}
                            >
                              {sec.code}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.itemDesc} numberOfLines={2}>
                          {sec.description}
                        </Text>
                      </View>

                      {isSelected && (
                        <View style={styles.checkWrapper}>
                          <CheckCircle2 size={18} color="#1E40AF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

interface SectorSelectFieldProps {
  selectedSectorId: SectorId;
  onSelect: (sectorId: SectorId) => void;
  label?: string;
  placeholder?: string;
  compact?: boolean;
  modalTitle?: string;
  modalSubtitle?: string;
  style?: any;
}

export const SectorSelectField: React.FC<SectorSelectFieldProps> = ({
  selectedSectorId,
  onSelect,
  label,
  compact = false,
  modalTitle,
  modalSubtitle,
  style,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedSector = useMemo(
    () => SECTORS.find(s => s.id === selectedSectorId) || SECTORS[0],
    [selectedSectorId]
  );

  return (
    <View style={[styles.fieldWrapper, style]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setPickerOpen(true)}
        style={[styles.triggerButton, compact && styles.triggerButtonCompact]}
      >
        <View
          style={[
            styles.triggerIconBox,
            compact && styles.triggerIconBoxCompact,
            {
              backgroundColor: `${selectedSector.accentColor || '#1E40AF'}15`,
              borderColor: `${selectedSector.accentColor || '#1E40AF'}35`,
            },
          ]}
        >
          {renderSectorIcon(
            selectedSector.icon,
            selectedSector.accentColor || '#1E40AF',
            compact ? 15 : 17
          )}
        </View>

        <View style={styles.triggerTextGroup}>
          <Text
            style={[styles.triggerTitle, compact && styles.triggerTitleCompact]}
            numberOfLines={1}
          >
            {selectedSector.name}
          </Text>
          {!compact && (
            <Text style={styles.triggerSub} numberOfLines={1}>
              {selectedSector.expectedLeadershipRole}
            </Text>
          )}
        </View>

        <View style={styles.triggerRight}>
          <View style={styles.triggerCodeBadge}>
            <Text style={styles.triggerCodeText}>{selectedSector.code}</Text>
          </View>
          <ChevronDown size={16} color="#1E40AF" />
        </View>
      </TouchableOpacity>

      <SectorPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedSectorId={selectedSectorId}
        onSelect={onSelect}
        title={modalTitle}
        subtitle={modalSubtitle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fieldWrapper: {
    width: '100%',
    gap: 5,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.3,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 10,
    width: '100%',
  },
  triggerButtonCompact: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  triggerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  triggerIconBoxCompact: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  triggerTextGroup: {
    flex: 1,
    flexShrink: 1,
  },
  triggerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  triggerTitleCompact: {
    fontSize: 12.5,
  },
  triggerSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  triggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  triggerCodeBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  triggerCodeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
  },
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  overlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  overlayMobile: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalContainerDesktop: {
    maxWidth: 580,
    maxHeight: '85%',
    borderRadius: 18,
  },
  modalContainerMobile: {
    maxHeight: '88%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  bottomSheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalTitleGroup: {
    flex: 1,
    paddingRight: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 7,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  clearBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E40AF',
  },
  listScroll: {
    maxHeight: 440,
    ...(Platform.OS === 'web' ? ({ overflowY: 'auto' } as any) : {}),
  },
  listContent: {
    padding: 14,
    gap: 8,
  },
  sectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 11,
    gap: 11,
  },
  itemIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemBody: {
    flex: 1,
    flexShrink: 1,
    gap: 3,
  },
  itemHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    flexShrink: 1,
  },
  codeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    flexShrink: 0,
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 15,
  },
  checkWrapper: {
    marginLeft: 4,
    flexShrink: 0,
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
});

