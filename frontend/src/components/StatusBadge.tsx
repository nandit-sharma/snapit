import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, RefreshCw, CheckCircle2, XCircle } from 'lucide-react-native';
import { ComplaintStatus } from '../types';
import { colors, radii, spacing, typography } from '../theme';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getMeta = () => {
    switch (status) {
      case 'in_progress':
        return {
          label: 'In Progress',
          textColor: colors.statusInProgress,
          bgColor: colors.statusInProgressBg,
          Icon: RefreshCw,
        };
      case 'resolved':
        return {
          label: 'Resolved',
          textColor: colors.statusResolved,
          bgColor: colors.statusResolvedBg,
          Icon: CheckCircle2,
        };
      case 'rejected':
        return {
          label: 'Rejected',
          textColor: colors.statusRejected,
          bgColor: colors.statusRejectedBg,
          Icon: XCircle,
        };
      case 'submitted':
      default:
        return {
          label: 'Submitted',
          textColor: colors.statusSubmitted,
          bgColor: colors.statusSubmittedBg,
          Icon: Clock,
        };
    }
  };

  const meta = getMeta();
  const IconComponent = meta.Icon;
  const isSm = size === 'sm';
  const iconSize = isSm ? 12 : 14;

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
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
  },
  textSm: {
    fontSize: typography.sizes.xs - 1,
  },
});
