import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  variant?: 'surface' | 'elevated' | 'glow' | 'accent';
  borderColor?: string;
  glowColor?: string;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 65,
  tint = 'light',
  variant = 'surface',
  borderColor,
  glowColor,
  padding = 16,
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return 'rgba(255, 255, 255, 0.94)';
      case 'glow':
        return glowColor ? `${glowColor}0D` : 'rgba(30, 64, 175, 0.04)';
      case 'accent':
        return 'rgba(235, 242, 255, 0.85)';
      case 'surface':
      default:
        return 'rgba(255, 255, 255, 0.85)';
    }
  };

  const getBorderColor = () => {
    if (borderColor) return borderColor;
    if (glowColor) return `${glowColor}40`;
    switch (variant) {
      case 'elevated':
        return 'rgba(30, 64, 175, 0.16)';
      case 'glow':
        return 'rgba(30, 64, 175, 0.25)';
      case 'accent':
        return 'rgba(37, 99, 235, 0.25)';
      default:
        return COLORS.glassBorder;
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.webGlass,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            padding,
          },
          variant === 'glow' && {
            boxShadow: `0 8px 24px 0 ${glowColor ? `${glowColor}25` : 'rgba(30, 64, 175, 0.12)'}`,
          } as any,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.nativeContainer,
        {
          borderColor: getBorderColor(),
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[
          styles.nativeBlur,
          {
            backgroundColor: getBackgroundColor(),
            padding,
          },
        ]}
      >
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  webGlass: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    // @ts-ignore - CSS Web
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
  },
  nativeContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  nativeBlur: {
    width: '100%',
    height: '100%',
  },
});
