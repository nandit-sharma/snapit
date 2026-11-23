import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import {
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  XCircle,
  Info,
  MapPin,
  Building,
  Flame,
  ArrowRight,
  X,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../theme';

export type FeedbackType = 'success' | 'celebration' | 'error' | 'warning' | 'info';

export interface FeedbackDetailItem {
  label: string;
  value: string;
  icon?: 'location' | 'department' | 'severity' | 'id';
}

export interface FeedbackModalProps {
  visible: boolean;
  type?: FeedbackType;
  title: string;
  message?: string;
  badgeText?: string;
  details?: FeedbackDetailItem[];
  primaryButton?: {
    text: string;
    onPress: () => void;
    icon?: React.ReactNode;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
  onClose?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  type = 'success',
  title,
  message,
  badgeText,
  details,
  primaryButton,
  secondaryButton,
  onClose,
}) => {
  if (!visible) return null;

  const getHeaderTheme = () => {
    switch (type) {
      case 'celebration':
        return {
          icon: <Sparkles size={32} color="#7C3AED" />,
          bgColor: '#FAF5FF',
          borderColor: '#E9D5FF',
          accentColor: '#7C3AED',
          pillBg: '#F3E8FF',
          pillText: '#7C3AED',
        };
      case 'error':
        return {
          icon: <XCircle size={32} color={colors.error} />,
          bgColor: '#FEF2F2',
          borderColor: '#FECACA',
          accentColor: colors.error,
          pillBg: '#FEE2E2',
          pillText: colors.error,
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={32} color={colors.warning} />,
          bgColor: '#FFFBEB',
          borderColor: '#FDE68A',
          accentColor: colors.warning,
          pillBg: '#FEF3C7',
          pillText: '#B45309',
        };
      case 'info':
        return {
          icon: <Info size={32} color={colors.primaryLight} />,
          bgColor: '#EFF6FF',
          borderColor: '#BFDBFE',
          accentColor: colors.primaryLight,
          pillBg: '#DBEAFE',
          pillText: colors.primary,
        };
      case 'success':
      default:
        return {
          icon: <CheckCircle2 size={32} color={colors.success} />,
          bgColor: '#ECFDF5',
          borderColor: '#A7F3D0',
          accentColor: colors.success,
          pillBg: '#D1FAE5',
          pillText: '#065F46',
        };
    }
  };

  const theme = getHeaderTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.cardContainer}>
              {/* Close "X" Button */}
              {onClose ? (
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              ) : null}

              {/* Glowing Icon Header */}
              <View
                style={[
                  styles.iconGlow,
                  { backgroundColor: theme.bgColor, borderColor: theme.borderColor },
                ]}
              >
                {theme.icon}
              </View>

              {/* Optional Top Badge / Status */}
              {badgeText ? (
                <View
                  style={[
                    styles.badgePill,
                    { backgroundColor: theme.pillBg },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: theme.pillText }]}>
                    {badgeText}
                  </Text>
                </View>
              ) : null}

              {/* Title & Message */}
              <Text style={styles.title}>{title}</Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}

              {/* Detailed Breakdown Card (if provided) */}
              {details && details.length > 0 ? (
                <View style={styles.detailsBox}>
                  {details.map((item, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.detailRow,
                        idx < details.length - 1 && styles.detailRowBorder,
                      ]}
                    >
                      <View style={styles.detailLabelGroup}>
                        {item.icon === 'location' ? (
                          <MapPin size={14} color={colors.primary} />
                        ) : item.icon === 'department' ? (
                          <Building size={14} color={colors.textSecondary} />
                        ) : item.icon === 'severity' ? (
                          <Flame size={14} color={colors.severityHigh} />
                        ) : null}
                        <Text style={styles.detailLabel}>{item.label}</Text>
                      </View>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.actionColumn}>
                {primaryButton ? (
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      type === 'celebration'
                        ? { backgroundColor: '#7C3AED' }
                        : type === 'error'
                        ? { backgroundColor: colors.error }
                        : { backgroundColor: colors.primary },
                    ]}
                    activeOpacity={0.85}
                    onPress={primaryButton.onPress}
                  >
                    <Text style={styles.primaryBtnText}>{primaryButton.text}</Text>
                    {primaryButton.icon || <ArrowRight size={16} color="#FFFFFF" />}
                  </TouchableOpacity>
                ) : null}

                {secondaryButton ? (
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    activeOpacity={0.7}
                    onPress={secondaryButton.onPress}
                  >
                    <Text style={styles.secondaryBtnText}>
                      {secondaryButton.text}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  cardContainer: {
    width: Math.min(screenWidth - 40, 380),
    backgroundColor: colors.surface,
    borderRadius: radii.xl + 4,
    padding: spacing.xl + 4,
    alignItems: 'center',
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconGlow: {
    width: 68,
    height: 68,
    borderRadius: radii.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  badgePill: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs + 2,
  },
  message: {
    fontSize: typography.sizes.sm + 0.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 1,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  detailValue: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
    maxWidth: '55%',
  },
  actionColumn: {
    width: '100%',
    gap: spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    gap: spacing.xs + 2,
    ...shadows.sm,
  },
  primaryBtnText: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.surface,
  },
  secondaryBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
});
