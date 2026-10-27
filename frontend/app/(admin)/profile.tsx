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
  ShieldCheck,
  Mail,
  Building,
  RotateCcw,
  LogOut,
  ChevronRight,
  GraduationCap,
  Info,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { complaintService } from '../../src/services/complaintService';
import { Header } from '../../src/components/Header';
import { Button } from '../../src/components/Button';
import { DemoBanner } from '../../src/components/DemoBanner';
import { colors, radii, shadows, spacing, typography } from '../../src/theme';

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, logout, switchRoleQuickDemo } = useAuth();

  const handleSwitchToStudent = () => {
    switchRoleQuickDemo('student');
    router.replace('/(student)/home');
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Mock Data',
      'This will restore all campus complaints and history logs to the starting demo dataset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Dataset',
          style: 'destructive',
          onPress: () => {
            complaintService.resetMockData();
            Alert.alert('Data Reset', 'All campus tickets have been reset.');
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
      <Header
        title="Admin Profile"
        subtitle="Facilities Administration"
      />
      <DemoBanner />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <ShieldCheck size={28} color="#FFFFFF" />
              </View>
            )}

            <View style={styles.nameCol}>
              <Text style={styles.name}>{user?.name || 'Dr. Nandit'}</Text>
              <Text style={styles.roleTitle}>Director of Campus Infrastructure</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>FACILITIES ADMINISTRATOR</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Mail size={16} color={colors.textTertiary} />
              <Text style={styles.infoLabel}>Official Email:</Text>
              <Text style={styles.infoVal}>
                {user?.email || 'admin.facilities@campus.edu'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Building size={16} color={colors.textTertiary} />
              <Text style={styles.infoLabel}>Division:</Text>
              <Text style={styles.infoVal}>Campus Estate & Services Directorate</Text>
            </View>
          </View>
        </View>

        {/* Demo Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Demo Testing Tools</Text>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleSwitchToStudent}
            style={styles.actionTile}
          >
            <View style={[styles.tileIconBox, { backgroundColor: colors.primarySoft }]}>
              <GraduationCap size={20} color={colors.primary} />
            </View>
            <View style={styles.tileContent}>
              <Text style={styles.tileTitle}>Switch to Student Portal</Text>
              <Text style={styles.tileSub}>
                Test complaint submission with camera, gallery, and student status view
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleResetData}
            style={styles.actionTile}
          >
            <View style={[styles.tileIconBox, { backgroundColor: '#F1F5F9' }]}>
              <RotateCcw size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.tileContent}>
              <Text style={styles.tileTitle}>Reset All Demo Tickets</Text>
              <Text style={styles.tileSub}>
                Clear custom changes and restore clean presentation tickets
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* System Architecture Notice */}
        <View style={styles.systemBox}>
          <Info size={16} color={colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.systemTitle}>SnapIT Backend & AI Architecture</Text>
            <Text style={styles.systemDesc}>
              Connected in future phase to: FastAPI REST endpoints, Supabase Auth & PostgreSQL database, and local Ollama Vision model for automated damage classification.
            </Text>
          </View>
        </View>

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
    borderWidth: 1.5,
    borderColor: colors.borderDark,
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
    borderColor: colors.primaryDark,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
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
  roleTitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    marginTop: 1,
  },
  roleTag: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
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
    width: 100,
  },
  infoVal: {
    flex: 1,
    fontSize: typography.sizes.xs + 1,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  section: {
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
  systemBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  systemTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  systemDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  logoutBtn: {
    marginBottom: spacing.xl,
  },
});
