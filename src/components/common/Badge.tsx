import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OriginType, DemandStatus, PriorityLevel } from '../../types';
import { COLORS } from '../../constants/theme';

interface OriginBadgeProps {
  origin: OriginType;
  size?: 'sm' | 'md';
}

export const OriginBadge: React.FC<OriginBadgeProps> = ({ origin, size = 'md' }) => {
  const config = COLORS.origin[origin] || COLORS.origin.direta_setor;

  return (
    <View
      style={[
        styles.badgeBase,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        size === 'sm' && styles.smBadge,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: config.text },
          size === 'sm' && styles.smText,
        ]}
      >
        {config.badge}
      </Text>
    </View>
  );
};

interface StatusBadgeProps {
  status: DemandStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = COLORS.status[status] || COLORS.status.pendente;

  return (
    <View
      style={[
        styles.badgeBase,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        size === 'sm' && styles.smBadge,
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: config.text }]} />
      <Text
        style={[
          styles.badgeText,
          { color: config.text },
          size === 'sm' && styles.smText,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

interface PriorityBadgeProps {
  priority: PriorityLevel;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const config = COLORS.priority[priority] || COLORS.priority.media;

  return (
    <View
      style={[
        styles.badgeBase,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        size === 'sm' && styles.smBadge,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: config.text },
          size === 'sm' && styles.smText,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  smBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  smText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
