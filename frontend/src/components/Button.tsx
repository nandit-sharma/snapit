import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = { ...styles.base };

    // Size
    if (size === 'sm') {
      base = { ...base, paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md };
    } else if (size === 'lg') {
      base = { ...base, paddingVertical: spacing.lg - 2, paddingHorizontal: spacing.xxl };
    } else {
      base = { ...base, paddingVertical: spacing.md, paddingHorizontal: spacing.xl };
    }

    // Variant
    switch (variant) {
      case 'secondary':
        base = { ...base, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border };
        break;
      case 'outline':
        base = { ...base, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
        break;
      case 'danger':
        base = { ...base, backgroundColor: colors.error };
        break;
      case 'ghost':
        base = { ...base, backgroundColor: 'transparent' };
        break;
      case 'primary':
      default:
        base = { ...base, backgroundColor: colors.primary };
        break;
    }

    if (disabled || loading) {
      base = { ...base, opacity: 0.6 };
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let base: TextStyle = {
      fontSize: size === 'sm' ? typography.sizes.sm : typography.sizes.md,
      fontWeight: typography.weights.semibold,
    };

    switch (variant) {
      case 'secondary':
        base = { ...base, color: colors.textPrimary };
        break;
      case 'outline':
        base = { ...base, color: colors.primary };
        break;
      case 'ghost':
        base = { ...base, color: colors.primary };
        break;
      case 'danger':
      case 'primary':
      default:
        base = { ...base, color: colors.textInverse };
        break;
    }

    return base;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' ? <>{icon}</> : null}
          <Text
            style={[
              getTextStyle(),
              icon && iconPosition === 'left' ? styles.textWithLeftIcon : undefined,
              icon && iconPosition === 'right' ? styles.textWithRightIcon : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' ? <>{icon}</> : null}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    minHeight: 48,
  },
  textWithLeftIcon: {
    marginLeft: spacing.sm,
  },
  textWithRightIcon: {
    marginRight: spacing.sm,
  },
});
