import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, radii, shadows, spacing } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'elevated' | 'flat' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
}) => {
  const getCardStyle = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1.2,
          borderColor: colors.border,
        };
      case 'flat':
        return {
          backgroundColor: colors.surfaceAlt,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadows.sm,
        };
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        style={[styles.base, getCardStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.base, getCardStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
});
