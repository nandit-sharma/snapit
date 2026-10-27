import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tag } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../theme';

interface DepartmentBadgeProps {
  name: string;
  size?: 'sm' | 'md';
}

export const DepartmentBadge: React.FC<DepartmentBadgeProps> = ({ name, size = 'md' }) => {
  const isSm = size === 'sm';
  return (
    <View style={[styles.badge, isSm && styles.badgeSm]}>
      <Tag size={isSm ? 10 : 12} color={colors.primary} style={styles.icon} />
      <Text style={[styles.text, isSm && styles.textSm]}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.primary,
  },
  textSm: {
    fontSize: typography.sizes.xs - 1,
  },
});
