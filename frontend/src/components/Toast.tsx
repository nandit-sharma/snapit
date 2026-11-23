import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  duration = 3200,
  onDismiss,
}) => {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const getStyle = () => {
    switch (type) {
      case 'error':
        return {
          icon: <XCircle size={18} color={colors.error} />,
          borderColor: colors.error,
          bgColor: '#FEF2F2',
          textColor: '#991B1B',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={18} color="#D97706" />,
          borderColor: '#F59E0B',
          bgColor: '#FFFBEB',
          textColor: '#92400E',
        };
      case 'info':
        return {
          icon: <Info size={18} color={colors.primary} />,
          borderColor: colors.primaryLight,
          bgColor: '#EFF6FF',
          textColor: '#1E40AF',
        };
      case 'success':
      default:
        return {
          icon: <CheckCircle size={18} color={colors.success} />,
          borderColor: colors.success,
          bgColor: '#ECFDF5',
          textColor: '#065F46',
        };
    }
  };

  const style = getStyle();

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: style.bgColor,
            borderColor: style.borderColor,
          },
        ]}
      >
        <View style={styles.iconContainer}>{style.icon}</View>
        <Text style={[styles.message, { color: style.textColor }]} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity
          onPress={handleDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeBtn}
        >
          <X size={14} color={style.textColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: 50,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    ...shadows.md,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: typography.sizes.xs + 2,
    fontWeight: typography.weights.semibold,
  },
  closeBtn: {
    marginLeft: spacing.xs,
    padding: 2,
  },
});
