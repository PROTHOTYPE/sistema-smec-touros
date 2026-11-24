import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle, 
  StyleProp, 
  Platform,
  View 
} from 'react-native';
import { COLORS } from '../../constants/theme';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getButtonStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#1E40AF',
          borderColor: '#1E3A8A',
          borderWidth: 1,
        };
      case 'secondary':
        return {
          backgroundColor: '#FFFFFF',
          borderColor: 'rgba(30, 64, 175, 0.16)',
          borderWidth: 1,
        };
      case 'success':
        return {
          backgroundColor: '#DCFCE7',
          borderColor: '#BBF7D0',
          borderWidth: 1,
        };
      case 'warning':
        return {
          backgroundColor: '#FEF3C7',
          borderColor: '#FDE68A',
          borderWidth: 1,
        };
      case 'danger':
        return {
          backgroundColor: '#FEE2E2',
          borderColor: '#FECACA',
          borderWidth: 1,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'glass':
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.90)',
          borderColor: 'rgba(30, 64, 175, 0.12)',
          borderWidth: 1,
        };
    }
  };

  const getTextColor = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return { color: '#FFFFFF' };
      case 'secondary':
        return { color: '#1E40AF' };
      case 'success':
        return { color: '#15803D' };
      case 'warning':
        return { color: '#B45309' };
      case 'danger':
        return { color: '#B91C1C' };
      case 'ghost':
        return { color: '#1E40AF' };
      case 'glass':
      default:
        return { color: '#0F172A' };
    }
  };

  const getPadding = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 };
      case 'lg':
        return { paddingVertical: 13, paddingHorizontal: 22, borderRadius: 14 };
      case 'md':
      default:
        return { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 10 };
    }
  };

  const getFontSize = (): TextStyle => {
    switch (size) {
      case 'sm':
        return { fontSize: 12, fontWeight: '600' };
      case 'lg':
        return { fontSize: 15, fontWeight: '700' };
      case 'md':
      default:
        return { fontSize: 13, fontWeight: '600' };
    }
  };

  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        getButtonStyles(),
        getPadding(),
        disabled && styles.disabled,
        Platform.OS === 'web' && ({ cursor: disabled ? 'not-allowed' : 'pointer' } as any),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? '#FFFFFF' : '#1E40AF'} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.text, getFontSize(), getTextColor(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    letterSpacing: 0.1,
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
  disabled: {
    opacity: 0.45,
  },
});
