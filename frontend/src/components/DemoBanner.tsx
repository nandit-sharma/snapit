import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Info } from 'lucide-react-native';
import { colors, spacing, typography, radii } from '../theme';

interface DemoBannerProps {
  message?: string;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  message = 'Prototype Mode: Local interactive mock state active (No backend connection)',
}) => {
  return (
    <View style={styles.container}>
      <Info size={14} color="#1E3A8A" style={styles.icon} />
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  icon: {
    marginRight: spacing.xs + 2,
  },
  text: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: '#1E3A8A',
    fontWeight: typography.weights.medium,
  },
});
