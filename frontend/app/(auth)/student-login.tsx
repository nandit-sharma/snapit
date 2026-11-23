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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, GraduationCap, Eye, EyeOff, Shield } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function StudentLoginScreen() {
  const router = useRouter();
  const { loginStudent, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Please enter your campus student email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      await loginStudent(email, password);
      router.replace('/(student)/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
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
              <GraduationCap size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>Student Portal</Text>
            <Text style={styles.subtitle}>
              Sign in with your campus credentials to report issues and track resolutions
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Input
              label="Campus Email Address"
              required
              placeholder="e.g. rollnumber@campus.edu"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={18} color={colors.textTertiary} />}
            />

            <Input
              label="Password"
              required
              placeholder="Enter your password"
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
              title="Sign In as Student"
              onPress={handleLogin}
              loading={isLoading}
              variant="primary"
              style={styles.loginBtn}
            />

            <View style={styles.registerPrompt}>
              <Text style={styles.promptText}>New student on campus? </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/student-register')}
              >
                <Text style={styles.promptLink}>Register Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Admin Switch */}
          <View style={styles.adminSwitchSection}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/admin-login')}
              style={styles.adminSwitchBtn}
            >
              <Shield size={16} color={colors.primary} />
              <Text style={styles.adminSwitchText}>
                Facilities Staff or Administrator? Go to Admin Login
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.primary,
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  promptText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  promptLink: {
    fontSize: typography.sizes.sm,
    color: colors.primaryLight,
    fontWeight: typography.weights.bold,
  },
  adminSwitchSection: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  adminSwitchBtn: {
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
  adminSwitchText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
});
