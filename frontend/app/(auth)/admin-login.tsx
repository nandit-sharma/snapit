import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function AdminLoginScreen() {
  const router = useRouter();
  const { loginAdmin, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAdminLogin = async () => {
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Please enter staff/admin email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter admin password.');
      return;
    }

    try {
      await loginAdmin(email, password);
      router.replace('/(admin)/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Admin authentication failed.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <ShieldCheck size={36} color={colors.primaryDark} />
            </View>
            <Text style={styles.title}>Facilities & Admin Console</Text>
            <Text style={styles.subtitle}>
              Campus Infrastructure Management, AI Triage & Resolution Operations
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>CAMPUS OFFICIALS ONLY</Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Input
              label="Staff / Administrator Email"
              required
              placeholder="e.g. admin@campus.edu"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={18} color={colors.textTertiary} />}
            />

            <Input
              label="Secure Password"
              required
              placeholder="Enter admin password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={18} color={colors.textTertiary} />}
              rightIcon={
                showPassword ? (
                  <EyeOff size={18} color={colors.textTertiary} />
                ) : (
                  <Eye size={18} color={colors.textTertiary} />
                )
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Button
              title="Enter Admin Dashboard"
              onPress={handleAdminLogin}
              loading={isLoading}
              variant="primary"
              style={styles.loginBtn}
            />
          </View>

          {/* Footer Back to Student */}
          <View style={styles.switchSection}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/student-login')}
              style={styles.switchBtn}
            >
              <GraduationCap size={16} color={colors.primary} />
              <Text style={styles.switchText}>
                Are you a student? Switch to Student Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 310,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
  },
  adminBadge: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radii.xs,
    marginBottom: spacing.lg,
  },
  adminBadgeText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  errorBox: {
    backgroundColor: colors.severityCriticalBg,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
  },
  loginBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primaryDark,
  },
  switchSection: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
});
