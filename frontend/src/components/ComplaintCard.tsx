import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MapPin, Sparkles, ChevronRight } from 'lucide-react-native';
import { Complaint } from '../types';
import { colors, radii, shadows, spacing, typography } from '../theme';
import { StatusBadge } from './StatusBadge';
import { SeverityBadge } from './SeverityBadge';
import { DepartmentBadge } from './DepartmentBadge';

interface ComplaintCardProps {
  complaint: Complaint;
  onPress: () => void;
  showUserInfo?: boolean;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  onPress,
  showUserInfo = false,
}) => {
  const formattedDate = new Date(complaint.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.idContainer}>
          <Text style={styles.ticketId}>{complaint.id}</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
        <StatusBadge status={complaint.status} size="sm" />
      </View>

      <View style={styles.bodyRow}>
        {complaint.image_url ? (
          <Image
            source={{ uri: complaint.image_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Text style={styles.placeholderText}>No photo</Text>
          </View>
        )}

        <View style={styles.contentCol}>
          <Text style={styles.title} numberOfLines={2}>
            {complaint.issue_type}
          </Text>

          {complaint.location_name ? (
            <View style={styles.metaLine}>
              <MapPin size={12} color={colors.textTertiary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {complaint.location_name}
              </Text>
            </View>
          ) : null}

          {showUserInfo && complaint.userName ? (
            <Text style={styles.userText} numberOfLines={1}>
              Reported by: {complaint.userName}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.badgeGroup}>
          <DepartmentBadge name={complaint.department_name} size="sm" />
          <SeverityBadge severity={complaint.severity} size="sm" />
          {complaint.ai_analysis ? (
            <View style={styles.aiTag}>
              <Sparkles size={10} color={colors.aiBadge} />
              <Text style={styles.aiTagText}>AI Analyzed</Text>
            </View>
          ) : null}
        </View>

        <ChevronRight size={18} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ticketId: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  bodyRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.md,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  userText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs + 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.aiBadgeBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
    gap: 3,
  },
  aiTagText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: colors.aiBadge,
  },
});
