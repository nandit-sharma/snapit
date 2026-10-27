import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { colors, spacing, typography, radii } from '../src/theme';
import { ShieldCheck, GraduationCap, ArrowRight } from 'lucide-react-native';
import { Button } from '../src/components/Button';
import { DemoBanner } from '../src/components/DemoBanner';

export default function IndexScreen() {
  const router = useRouter();
  const { user, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user && role === 'student') {
        router.replace('/(student)/home');
      } else if (user && role === 'admin') {
        router.replace('/(admin)/dashboard');
      }
    }
  }, [user, role, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading SnapIT...</Text>
      </View>
    );
  }

  // Welcome / Entrance Screen if unauthenticated
  return (
    <View style={styles.container}>
      <DemoBanner message="Academic Project Demonstration • Interactive Mock State" />
      
      <View style={styles.content}>
        <View style={styles.brandingBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>SnapIT</Text>
          </View>
          <Text style={styles.title}>Intelligent Campus Service Platform</Text>
          <Text style={styles.subtitle}>
            AI-powered campus maintenance & automated issue resolution system
          </Text>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.cardHeader}>Select Portal to Enter:</Text>

          <Button
            title="Student Portal"
            variant="primary"
            icon={<GraduationCap size={20} color="#FFFFFF" />}
            onPress={() => router.push('/(auth)/student-login')}
            style={styles.portalButton}
          />

          <Button
            title="Admin & Facilities Portal"
            variant="secondary"
            icon={<ShieldCheck size={20} color={colors.primaryDark} />}
            onPress={() => router.push('/(auth)/admin-login')}
            style={styles.portalButton}
          />

          <View style={styles.demoNotice}>
            <Text style={styles.demoNoticeText}>
              Preloaded with realistic mock campus data & local AI vision findings.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
  },
  brandingBox: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoBadge: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  logoBadgeText: {
    color: colors.textInverse,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: typography.sizes.xl + 2,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  actionsCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  portalButton: {
    marginBottom: spacing.md,
  },
  demoNotice: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.xs,
  },
  demoNoticeText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
