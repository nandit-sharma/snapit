import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Mail,
  GraduationCap,
  Building,
  Home,
  Shield,
  RotateCcw,
  LogOut,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { complaintService } from '../../src/services/complaintService';
import { Header } from '../../src/components/Header';
import { Button } from '../../src/components/Button';
import { DemoBanner } from '../../src/components/DemoBanner';
import { colors, radii, shadows, spacing, typography } from '../../src/theme';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { user, logout, switchRoleQuickDemo } = useAuth();

  const handleSwitchToAdmin = () => {
    switchRoleQuickDemo('admin');
    router.replace('/(admin)/dashboard');
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Mock Data',
      'This will reset all complaints and status changes back to the original demo dataset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            complaintService.resetMockData();
            Alert.alert('Data Reset', 'Default campus complaints restored.');
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Student Profile" subtitle="Campus Identity & Settings" />
      <DemoBanner />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'S'}</Text>
              </View>
            )}

            <View style={styles.nameCol}>
              <Text style={styles.name}>{user?.name || 'Nandit Sharma'}</Text>
              <Text style={styles.rollNumber}>{user?.rollNumber || 'CS2023-042'}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>ENROLLED STUDENT</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Mail size={16} color={colors.textTertiary} />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoVal}>{user?.email || 'Nandit.sharma@campus.edu'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Building size={16} color={colors.textTertiary} />
              <Text style={styles.infoLabel}>Department:</Text>
              <Text style={styles.infoVal}>{user?.department || 'Computer Science & Engineering'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Home size={16} color={colors.textTertiary} />
              <Text style={styles.infoLabel}>Hostel / Room:</Text>
              <Text style={styles.infoVal}>
                {user?.hostelBlock || 'Block C (Aryabhata)'} • {user?.roomNumber || 'Room 304'}
              </Text>
            </View>
          </View>
        </View>

        {/* Demo Presentation Shortcuts */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionHeader}>Demo Testing Tools</Text>

          {/* Quick switch to Admin portal */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleSwitchToAdmin}
            style={styles.actionTile}
          >
            <View style={[styles.tileIconBox, { backgroundColor: colors.primarySoft }]}>
              <Shield size={20} color={colors.primary} />
            </View>
            <View style={styles.tileContent}>
              <Text style={styles.tileTitle}>Switch to Admin Portal</Text>
              <Text style={styles.tileSub}>
                Test administrative triage, review AI confidence, and update complaint status
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Reset Mock Data */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleResetData}
            style={styles.actionTile}
          >
            <View style={[styles.tileIconBox, { backgroundColor: '#F1F5F9' }]}>
              <RotateCcw size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.tileContent}>
              <Text style={styles.tileTitle}>Reset Mock Complaints Data</Text>
              <Text style={styles.tileSub}>Restore initial 5 campus sample tickets</Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* About App Box */}
        <View style={styles.aboutBox}>
          <Info size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.aboutTitle}>SnapIT Campus v1.0.0 (UI Prototype)</Text>
            <Text style={styles.aboutText}>
              Frontend built with React Native, Expo, TypeScript & Lucide Icons. Designed for seamless integration with FastAPI backend and Ollama Vision.
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          icon={<LogOut size={16} color={colors.primary} />}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  nameCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  rollNumber: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 1,
  },
  roleTag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.lg,
  },
  infoList: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.medium,
    color: colors.textTertiary,
    width: 90,
  },
  infoVal: {
    flex: 1,
    fontSize: typography.sizes.xs + 1,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  demoSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  actionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  tileIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  tileContent: {
    flex: 1,
  },
  tileTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  tileSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  aboutBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  aboutTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  aboutText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  logoutBtn: {
    marginBottom: spacing.xl,
  },
});
