import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  Clock,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  PhoneCall,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { complaintService } from '../../src/services/complaintService';
import { Complaint } from '../../src/types';
import { DemoBanner } from '../../src/components/DemoBanner';
import { ComplaintCard } from '../../src/components/ComplaintCard';
import { colors, radii, shadows, spacing, typography } from '../../src/theme';

export default function StudentHomeScreen() {
  const router = useRouter();
  const { user, switchRoleQuickDemo } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;
    const list = await complaintService.getUserComplaints(user.id);
    setComplaints(list);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Compute metrics
  const submittedCount = complaints.filter((c) => c.status === 'submitted').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const recentComplaints = complaints.slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Quick Role Switcher Banner */}
      <View style={styles.topRoleBanner}>
        <View style={styles.roleIdentity}>
          <GraduationCap size={16} color="#FFFFFF" />
          <Text style={styles.roleIdentityText}>STUDENT PORTAL</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            switchRoleQuickDemo('admin');
            router.replace('/(admin)/dashboard');
          }}
          style={styles.switchRolePill}
        >
          <ShieldCheck size={14} color={colors.primaryDark} />
          <Text style={styles.switchRolePillText}>Switch to Admin Portal</Text>
        </TouchableOpacity>
      </View>

      <DemoBanner />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <View style={styles.headerTextCol}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Student'}</Text>
            <Text style={styles.userMeta}>
              {user?.rollNumber || 'CS2023-042'} • {user?.hostelBlock || 'Hostel Block C'}
            </Text>
          </View>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {user?.name?.charAt(0) || 'S'}
              </Text>
            </View>
          )}
        </View>

        {/* Action Hero Card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push('/(student)/submit')}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <View style={styles.aiPill}>
              <Sparkles size={12} color="#FFFFFF" />
              <Text style={styles.aiPillText}>AI VISION ASSISTED</Text>
            </View>
            <Text style={styles.heroTitle}>Notice an issue on campus?</Text>
            <Text style={styles.heroSubtitle}>
              Take a photo. Our vision AI instantly analyzes the severity, detects hazards, and routes it to the right department.
            </Text>
            <View style={styles.heroButton}>
              <Camera size={18} color={colors.primary} />
              <Text style={styles.heroButtonText}>Snap & Report Now</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/(student)/complaints')}
            style={styles.statBox}
          >
            <View style={[styles.statIconBox, { backgroundColor: colors.statusSubmittedBg }]}>
              <Clock size={16} color={colors.statusSubmitted} />
            </View>
            <Text style={styles.statNumber}>{submittedCount}</Text>
            <Text style={styles.statLabel}>Submitted</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/(student)/complaints')}
            style={styles.statBox}
          >
            <View style={[styles.statIconBox, { backgroundColor: colors.statusInProgressBg }]}>
              <RefreshCw size={16} color={colors.statusInProgress} />
            </View>
            <Text style={styles.statNumber}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/(student)/complaints')}
            style={styles.statBox}
          >
            <View style={[styles.statIconBox, { backgroundColor: colors.statusResolvedBg }]}>
              <CheckCircle2 size={16} color={colors.statusResolved} />
            </View>
            <Text style={styles.statNumber}>{resolvedCount}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Complaints Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Tickets</Text>
          <TouchableOpacity
            onPress={() => router.push('/(student)/complaints')}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllText}>View All ({complaints.length})</Text>
            <ChevronRight size={16} color={colors.primaryLight} />
          </TouchableOpacity>
        </View>

        {recentComplaints.length === 0 ? (
          <View style={styles.emptyTickets}>
            <Text style={styles.emptyTicketsTitle}>No active tickets found</Text>
            <Text style={styles.emptyTicketsSub}>
              You have not submitted any complaints yet.
            </Text>
          </View>
        ) : (
          recentComplaints.map((item) => (
            <ComplaintCard
              key={item.id}
              complaint={item}
              onPress={() => router.push(`/complaint/${item.id}` as any)}
            />
          ))
        )}

        {/* Emergency / Service Desk Contacts */}
        <View style={styles.helpdeskCard}>
          <View style={styles.helpdeskHeader}>
            <ShieldAlert size={18} color={colors.primary} />
            <Text style={styles.helpdeskTitle}>Campus Emergency Helpline</Text>
          </View>
          <Text style={styles.helpdeskDesc}>
            For gas leaks, electrical fires, or acute medical emergencies, call security control immediately:
          </Text>
          <View style={styles.phoneRow}>
            <PhoneCall size={14} color={colors.primary} />
            <Text style={styles.phoneNumber}>+91 1800-CAMPUS-911 (Ext. 2400)</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topRoleBanner: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  roleIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleIdentityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  switchRolePill: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 4,
  },
  switchRolePillText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTextCol: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  userMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
  heroCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  heroContent: {
    alignItems: 'flex-start',
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    gap: 4,
    marginBottom: spacing.sm,
  },
  aiPillText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: typography.sizes.lg + 2,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: typography.sizes.xs + 1,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    gap: spacing.xs + 2,
  },
  heroButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.sm,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: typography.sizes.xs,
    color: colors.primaryLight,
    fontWeight: typography.weights.semibold,
  },
  emptyTickets: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  emptyTicketsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  emptyTicketsSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  helpdeskCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  helpdeskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: 4,
  },
  helpdeskTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  helpdeskDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  phoneNumber: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
});
