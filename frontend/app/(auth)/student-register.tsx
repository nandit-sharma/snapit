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
import {
  User,
  Mail,
  Lock,
  BadgeAlert,
  Building,
  Home,
  ArrowLeft,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function StudentRegisterScreen() {
  const router = useRouter();
  const { registerStudent, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [hostelBlock, setHostelBlock] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid campus email address.');
      return;
    }
    if (!rollNumber.trim()) {
      setErrorMessage('Please enter your student Roll/Registration Number.');
      return;
    }
    if (!department.trim()) {
      setErrorMessage('Please enter your academic department.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    try {
      await registerStudent({
        name,
        email,
        rollNumber,
        department,
        hostelBlock,
        roomNumber,
        password,
      });
      router.replace('/(student)/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
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
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
            <Text style={styles.backBtnText}>Back to Sign In</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Student Registration</Text>
            <Text style={styles.subtitle}>
              Register your campus profile to submit and monitor facility tickets
            </Text>
          </View>

          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Input
              label="Full Name"
              required
              placeholder="e.g. Priya Sharma"
              value={name}
              onChangeText={setName}
              leftIcon={<User size={18} color={colors.textTertiary} />}
            />

            <Input
              label="Campus Email"
              required
              placeholder="e.g. priya.s@campus.edu"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={18} color={colors.textTertiary} />}
            />

            <Input
              label="Student Roll / ID Number"
              required
              placeholder="e.g. CS2023-088"
              value={rollNumber}
              onChangeText={setRollNumber}
              leftIcon={<BadgeAlert size={18} color={colors.textTertiary} />}
            />

            <Input
              label="Academic Department"
              required
              placeholder="e.g. Computer Science & Engg."
              value={department}
              onChangeText={setDepartment}
              leftIcon={<Building size={18} color={colors.textTertiary} />}
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Input
                  label="Hostel Block"
                  placeholder="e.g. Block C"
                  value={hostelBlock}
                  onChangeText={setHostelBlock}
                  leftIcon={<Home size={18} color={colors.textTertiary} />}
                />
              </View>
              <View style={styles.halfCol}>
                <Input
                  label="Room No."
                  placeholder="e.g. 214"
                  value={roomNumber}
                  onChangeText={setRoomNumber}
                />
              </View>
            </View>

            <Input
              label="Password"
              required
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Lock size={18} color={colors.textTertiary} />}
            />

            <Button
              title="Complete Registration"
              onPress={handleRegister}
              loading={isLoading}
              variant="primary"
              style={styles.submitBtn}
            />
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
    paddingBottom: spacing.xxxl,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  backBtnText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  header: {
    marginBottom: spacing.xl,
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
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfCol: {
    flex: 1,
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
  submitBtn: {
    marginTop: spacing.md,
  },
});
