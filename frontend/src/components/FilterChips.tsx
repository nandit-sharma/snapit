import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterChipsProps {
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  options,
  selectedId,
  onSelect,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {options.map((option) => {
        const isSelected = option.id === selectedId;
        return (
          <TouchableOpacity
            key={option.id}
            activeOpacity={0.75}
            onPress={() => onSelect(option.id)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {option.label}
            </Text>
            {typeof option.count === 'number' ? (
              <View
                style={[
                  styles.countBadge,
                  isSelected && styles.countBadgeSelected,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    isSelected && styles.countTextSelected,
                  ]}
                >
                  {option.count}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: radii.full,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  labelSelected: {
    color: colors.textInverse,
    fontWeight: typography.weights.semibold,
  },
  countBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
    marginLeft: 6,
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textSecondary,
    fontWeight: typography.weights.bold,
  },
  countTextSelected: {
    color: colors.textInverse,
  },
});
