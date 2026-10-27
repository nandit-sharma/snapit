import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react-native';
import { ComplaintSeverity } from '../types';
import { colors, radii, spacing, typography } from '../theme';

interface SeverityBadgeProps {
  severity: ComplaintSeverity;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const getMeta = () => {
    switch (severity) {
      case 'critical':
        return {
          label: 'Critical Priority',
          textColor: colors.severityCritical,
          bgColor: colors.severityCriticalBg,
          Icon: AlertTriangle,
        };
      case 'high':
        return {
          label: 'High Priority',
          textColor: colors.severityHigh,
          bgColor: colors.severityHighBg,
          Icon: AlertTriangle,
        };
      case 'low':
        return {
          label: 'Low Priority',
          textColor: colors.severityLow,
          bgColor: colors.severityLowBg,
          Icon: Info,
        };
      case 'medium':
      default:
        return {
          label: 'Medium Priority',
          textColor: colors.severityMedium,
          bgColor: colors.severityMediumBg,
          Icon: AlertCircle,
        };
    }
  };

  const meta = getMeta();
  const IconComponent = meta.Icon;
  const isSm = size === 'sm';
  const iconSize = isSm ? 11 : 13;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.bgColor },
        isSm && styles.badgeSm,
      ]}
    >
      <IconComponent size={iconSize} color={meta.textColor} style={styles.icon} />
      <Text
        style={[
          styles.text,
          { color: meta.textColor },
          isSm && styles.textSm,
        ]}
      >
        {meta.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 2,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  textSm: {
    fontSize: typography.sizes.xs - 1,
  },
});
