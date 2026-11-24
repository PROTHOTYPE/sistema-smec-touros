import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { X } from 'lucide-react-native';
import { GlassCard } from './GlassCard';

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 640,
}) => {
  const { height, width } = useWindowDimensions();
  const isSmallScreen = width < 600;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={[styles.overlay, isSmallScreen && styles.overlayMobile]}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={[styles.dialogWrapper, { maxWidth }]}>
                <GlassCard
                  variant="elevated"
                  intensity={75}
                  borderColor="rgba(30, 64, 175, 0.16)"
                  padding={0}
                  style={styles.cardContainer}
                >
                  {/* Header */}
                  <View style={[styles.header, isSmallScreen && styles.headerMobile]}>
                    <View style={styles.headerTitleContainer}>
                      <Text style={styles.title} numberOfLines={2}>
                        {title}
                      </Text>
                      {subtitle ? (
                        <Text style={styles.subtitle} numberOfLines={2}>
                          {subtitle}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeButton}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <X size={18} color="#475569" />
                    </TouchableOpacity>
                  </View>

                  {/* Body com rolagem suave e maxHeight dinâmico (90vh) */}
                  <ScrollView
                    style={[
                      styles.body,
                      { maxHeight: Math.min(height * 0.78, 720) },
                      Platform.OS === 'web' ? ({ maxHeight: '78vh', overflowY: 'auto' } as any) : null,
                    ]}
                    contentContainerStyle={[
                      styles.bodyContent,
                      isSmallScreen && styles.bodyContentMobile,
                    ]}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    {children}
                  </ScrollView>
                </GlassCard>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardWrapper: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  overlayMobile: {
    padding: 10,
  },
  dialogWrapper: {
    width: '100%',
    maxHeight: '90%',
    ...(Platform.OS === 'web' ? ({ maxHeight: '90vh' } as any) : {}),
  },
  cardContainer: {
    maxHeight: '100%',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 64, 175, 0.08)',
    backgroundColor: '#F8FAFC',
  },
  headerMobile: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerTitleContainer: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    width: '100%',
  },
  bodyContent: {
    padding: 20,
  },
  bodyContentMobile: {
    padding: 14,
  },
});
