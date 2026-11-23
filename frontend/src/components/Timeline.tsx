import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, Clock, UserCheck, Bot } from 'lucide-react-native';
import { ComplaintHistoryItem } from '../types';
import { colors, radii, spacing, typography } from '../theme';

interface TimelineProps {
  items: ComplaintHistoryItem[];
}

export const Timeline: React.FC<TimelineProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No history records yet.</Text>
      </View>
    );
  }

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isSystem = item.updated_by_role === 'system' || item.updated_by.toLowerCase().includes('ai');
        const isAdmin = item.updated_by_role === 'admin' || item.updated_by.toLowerCase().includes('admin');

        return (
          <View key={item.id || index} style={styles.itemRow}>
            {/* Left timeline indicator */}
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.circle,
                  isAdmin ? styles.circleAdmin : isSystem ? styles.circleSystem : styles.circleDefault,
                ]}
              >
                {isSystem ? (
                  <Bot size={12} color="#7C3AED" />
                ) : isAdmin ? (
                  <UserCheck size={12} color={colors.primary} />
                ) : (
                  <Clock size={12} color={colors.textSecondary} />
                )}
              </View>
              {!isLast ? <View style={styles.line} /> : null}
            </View>

            {/* Right content */}
            <View style={[styles.contentCol, !isLast && styles.contentColWithLine]}>
              <View style={styles.metaRow}>
                <Text style={styles.updater}>{item.updated_by}</Text>
                <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
              </View>

              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {((item.status || (item as any).new_status || (item as any).old_status || 'pending') as string)
                    .replace(/_/g, ' ')
                    .toUpperCase()}
                </Text>
              </View>

              {item.comment ? (
                <Text style={styles.comment}>{item.comment}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
  },
  indicatorCol: {
    width: 28,
    alignItems: 'center',
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 1,
  },
  circleDefault: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  circleSystem: {
    backgroundColor: '#F3E8FF',
    borderColor: '#C084FC',
  },
  circleAdmin: {
    backgroundColor: '#EFF6FF',
    borderColor: '#60A5FA',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  contentCol: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingBottom: spacing.lg,
  },
  contentColWithLine: {
    paddingBottom: spacing.lg + 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  updater: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textTertiary,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 1,
    borderRadius: radii.xs,
    marginBottom: 4,
  },
  statusPillText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  comment: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 19,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: 2,
  },
});
