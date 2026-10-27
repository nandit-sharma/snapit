import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
  Building,
  GraduationCap,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  MapPin,
  User,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { complaintService } from '../../src/services/complaintService';
import { mockDepartments } from '../../src/data/mockData';
import { Complaint, ComplaintStatus, ComplaintSeverity } from '../../src/types';
import { Header } from '../../src/components/Header';
import { Input } from '../../src/components/Input';
import { FilterChips } from '../../src/components/FilterChips';
import { EmptyState } from '../../src/components/EmptyState';
import { DemoBanner } from '../../src/components/DemoBanner';
import { StatusBadge } from '../../src/components/StatusBadge';
import { SeverityBadge } from '../../src/components/SeverityBadge';
import { DepartmentBadge } from '../../src/components/DepartmentBadge';
import { colors, radii, shadows, spacing, typography } from '../../src/theme';

type AdminTab = 'unseen' | 'inprogress' | 'completed' | 'all' | 'rejected';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, switchRoleQuickDemo } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('unseen');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    const list = await complaintService.getAllComplaints();
    setComplaints(list);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Status mapping
  const matchesTab = (item: Complaint, tab: AdminTab) => {
    switch (tab) {
      case 'unseen':
        return item.status === 'submitted';
      case 'inprogress':
        return item.status === 'in_progress';
      case 'completed':
        return item.status === 'resolved';
      case 'rejected':
        return item.status === 'rejected';
      case 'all':
      default:
        return true;
    }
  };

  // Section Counts
  const unseenCount = complaints.filter((c) => c.status === 'submitted').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const completedCount = complaints.filter((c) => c.status === 'resolved').length;
  const rejectedCount = complaints.filter((c) => c.status === 'rejected').length;
  const criticalCount = complaints.filter((c) => c.severity === 'critical' && c.status !== 'resolved').length;

  // Filter complaints
  const filteredComplaints = complaints.filter((item) => {
    if (!matchesTab(item, activeTab)) return false;
    if (selectedDept !== 'all' && item.department_id !== selectedDept) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = item.id.toLowerCase().includes(q);
      const matchIssue = item.issue_type.toLowerCase().includes(q);
      const matchDept = item.department_name.toLowerCase().includes(q);
      const matchLoc = (item.location_name || '').toLowerCase().includes(q);
      const matchUser = (item.userName || '').toLowerCase().includes(q);
      return matchId || matchIssue || matchDept || matchLoc || matchUser;
    }
    return true;
  });

  // Direct Status Update Handler
  const handleUpdateStatus = async (complaintId: string, newStatus: ComplaintStatus) => {
    setUpdatingId(complaintId);
    try {
      const comment =
        newStatus === 'resolved'
          ? 'Complaint marked as completed by Facilities Admin.'
          : newStatus === 'in_progress'
          ? 'Work order dispatched to campus maintenance team.'
          : newStatus === 'rejected'
          ? 'Rejected: Out of scope or duplicate ticket.'
          : 'Complaint reopened and marked as unseen.';

      await complaintService.updateComplaintStatus(
        complaintId,
        newStatus,
        comment,
        user?.name || 'Dr. Nandit (Facilities Admin)'
      );

      await loadData();
      Alert.alert(
        'Status Changed',
        `Ticket #${complaintId} is now ${newStatus.replace('_', ' ').toUpperCase()}.`
      );
    } catch {
      Alert.alert('Error', 'Failed to update ticket status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const deptOptions = [
    { id: 'all', label: 'All Departments' },
    ...mockDepartments.map((d) => ({
      id: d.id,
      label: d.name,
    })),
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. TOP ROLE SWITCHER BANNER */}
      <View style={styles.topRoleBanner}>
        <View style={styles.roleIdentity}>
          <ShieldCheck size={16} color="#FFFFFF" />
          <Text style={styles.roleIdentityText}>ADMIN PORTAL ACTIVE</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            switchRoleQuickDemo('student');
            router.replace('/(student)/home');
          }}
          style={styles.switchRolePill}
        >
          <GraduationCap size={14} color={colors.primary} />
          <Text style={styles.switchRolePillText}>Switch to Student Portal</Text>
        </TouchableOpacity>
      </View>

      <Header
        title="Managed Complaints"
        subtitle="Campus Facilities Control & Triage"
      />

      {/* 2. FIXED PROMINENT 3 SUB-SECTIONS BAR AT TOP (OUTSIDE SCROLL) */}
      <View style={styles.fixedSubSectionsCard}>
        <Text style={styles.fixedSectionTitle}>TICKET WORKFLOW SECTIONS:</Text>
        <View style={styles.mainTabsRow}>
          {/* Sub-section 1: Unseen */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setActiveTab('unseen')}
            style={[styles.mainTabBtn, activeTab === 'unseen' && styles.mainTabBtnActive]}
          >
            <Clock size={16} color={activeTab === 'unseen' ? '#FFFFFF' : colors.statusSubmitted} />
            <Text style={[styles.mainTabText, activeTab === 'unseen' && styles.mainTabTextActive]}>
              Unseen
            </Text>
            <View style={[styles.countBadge, activeTab === 'unseen' && styles.countBadgeActive]}>
              <Text style={[styles.countBadgeText, activeTab === 'unseen' && styles.countBadgeTextActive]}>
                {unseenCount}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Sub-section 2: In Progress */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setActiveTab('inprogress')}
            style={[styles.mainTabBtn, activeTab === 'inprogress' && styles.mainTabBtnActive]}
          >
            <RefreshCw size={16} color={activeTab === 'inprogress' ? '#FFFFFF' : colors.statusInProgress} />
            <Text style={[styles.mainTabText, activeTab === 'inprogress' && styles.mainTabTextActive]}>
              In Progress
            </Text>
            <View style={[styles.countBadge, activeTab === 'inprogress' && styles.countBadgeActive]}>
              <Text style={[styles.countBadgeText, activeTab === 'inprogress' && styles.countBadgeTextActive]}>
                {inProgressCount}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Sub-section 3: Completed */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setActiveTab('completed')}
            style={[styles.mainTabBtn, activeTab === 'completed' && styles.mainTabBtnActive]}
          >
            <CheckCircle size={16} color={activeTab === 'completed' ? '#FFFFFF' : colors.statusResolved} />
            <Text style={[styles.mainTabText, activeTab === 'completed' && styles.mainTabTextActive]}>
              Completed
            </Text>
            <View style={[styles.countBadge, activeTab === 'completed' && styles.countBadgeActive]}>
              <Text style={[styles.countBadgeText, activeTab === 'completed' && styles.countBadgeTextActive]}>
                {completedCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Secondary Toggles (All, Rejected, Critical) */}
        <View style={styles.secondaryFilterRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            style={[styles.secondaryPill, activeTab === 'all' && styles.secondaryPillActive]}
          >
            <Text style={[styles.secondaryPillText, activeTab === 'all' && styles.secondaryPillTextActive]}>
              All ({complaints.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('rejected')}
            style={[styles.secondaryPill, activeTab === 'rejected' && styles.secondaryPillActive]}
          >
            <Text style={[styles.secondaryPillText, activeTab === 'rejected' && styles.secondaryPillTextActive]}>
              Rejected ({rejectedCount})
            </Text>
          </TouchableOpacity>

          {criticalCount > 0 ? (
            <View style={styles.criticalNotice}>
              <AlertTriangle size={12} color={colors.severityCritical} />
              <Text style={styles.criticalNoticeText}>{criticalCount} Critical Hazards</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* 3. SCROLLABLE COMPLAINTS LIST */}
      <FlatList
        data={filteredComplaints}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isUpdating = updatingId === item.id;
          return (
            <View style={styles.complaintCard}>
              {/* Card Header & Content */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => router.push(`/complaint/${item.id}` as any)}
                style={styles.cardMainClickable}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.ticketIdPill}>
                    <Text style={styles.ticketIdPillText}>{item.id}</Text>
                  </View>
                  <View style={styles.statusGroup}>
                    <StatusBadge status={item.status} size="sm" />
                    <SeverityBadge severity={item.severity} size="sm" />
                  </View>
                </View>

                <Text style={styles.cardTitle}>{item.issue_type}</Text>

                <View style={styles.cardMetaRow}>
                  <DepartmentBadge name={item.department_name} size="sm" />
                  <Text style={styles.metaLocText} numberOfLines={1}>
                    📍 {item.location_name || 'Campus'}
                  </Text>
                </View>

                {item.userName ? (
                  <View style={styles.reporterInfoRow}>
                    <User size={13} color={colors.textTertiary} />
                    <Text style={styles.reporterInfoText}>
                      Reported by <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{item.userName}</Text>
                    </Text>
                  </View>
                ) : null}

                {item.ai_analysis ? (
                  <View style={styles.aiBadgeBox}>
                    <Sparkles size={13} color={colors.aiBadge} />
                    <Text style={styles.aiBadgeBoxText} numberOfLines={1}>
                      AI Detection: {item.ai_analysis.issue} ({Math.round((item.ai_analysis.confidence || 0.9) * 100)}% confidence)
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>

              {/* 4. REPOSITIONED STATUS EDIT BUTTONS (PROMINENT AT CARD BOTTOM) */}
              <View style={styles.statusActionBox}>
                <Text style={styles.statusActionTitle}>UPDATE STATUS (TAP TO APPLY):</Text>
                <View style={styles.actionButtonsGrid}>
                  {/* Option 1: In Progress */}
                  <TouchableOpacity
                    disabled={isUpdating}
                    onPress={() => handleUpdateStatus(item.id, 'in_progress')}
                    style={[
                      styles.actionBtn,
                      item.status === 'in_progress' ? styles.actionBtnActiveInProgress : styles.actionBtnInactive,
                    ]}
                  >
                    <RefreshCw size={14} color={item.status === 'in_progress' ? '#FFFFFF' : colors.statusInProgress} />
                    <Text
                      style={[
                        styles.actionBtnText,
                        item.status === 'in_progress' ? styles.actionBtnTextActive : { color: colors.statusInProgress },
                      ]}
                    >
                      {item.status === 'in_progress' ? '✓ In Progress' : 'In Progress'}
                    </Text>
                  </TouchableOpacity>

                  {/* Option 2: Completed */}
                  <TouchableOpacity
                    disabled={isUpdating}
                    onPress={() => handleUpdateStatus(item.id, 'resolved')}
                    style={[
                      styles.actionBtn,
                      item.status === 'resolved' ? styles.actionBtnActiveResolved : styles.actionBtnInactive,
                    ]}
                  >
                    <CheckCircle size={14} color={item.status === 'resolved' ? '#FFFFFF' : colors.statusResolved} />
                    <Text
                      style={[
                        styles.actionBtnText,
                        item.status === 'resolved' ? styles.actionBtnTextActive : { color: colors.statusResolved },
                      ]}
                    >
                      {item.status === 'resolved' ? '✓ Completed' : 'Completed'}
                    </Text>
                  </TouchableOpacity>

                  {/* Option 3: Reject */}
                  <TouchableOpacity
                    disabled={isUpdating}
                    onPress={() => handleUpdateStatus(item.id, 'rejected')}
                    style={[
                      styles.actionBtn,
                      item.status === 'rejected' ? styles.actionBtnActiveRejected : styles.actionBtnInactive,
                    ]}
                  >
                    <XCircle size={14} color={item.status === 'rejected' ? '#FFFFFF' : colors.statusRejected} />
                    <Text
                      style={[
                        styles.actionBtnText,
                        item.status === 'rejected' ? styles.actionBtnTextActive : { color: colors.statusRejected },
                      ]}
                    >
                      {item.status === 'rejected' ? '✓ Rejected' : 'Reject'}
                    </Text>
                  </TouchableOpacity>

                  {/* Option 4: Unseen / Reopen */}
                  <TouchableOpacity
                    disabled={isUpdating}
                    onPress={() => handleUpdateStatus(item.id, 'submitted')}
                    style={[
                      styles.actionBtn,
                      item.status === 'submitted' ? styles.actionBtnActiveSubmitted : styles.actionBtnInactive,
                    ]}
                  >
                    <Clock size={14} color={item.status === 'submitted' ? '#FFFFFF' : colors.statusSubmitted} />
                    <Text
                      style={[
                        styles.actionBtnText,
                        item.status === 'submitted' ? styles.actionBtnTextActive : { color: colors.statusSubmitted },
                      ]}
                    >
                      {item.status === 'submitted' ? '✓ Unseen' : 'Unseen'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tap to view detail footer */}
              <TouchableOpacity
                onPress={() => router.push(`/complaint/${item.id}` as any)}
                style={styles.cardFooterBar}
              >
                <Text style={styles.cardFooterBarText}>View Full Details, AI Findings & Timeline</Text>
                <ChevronRight size={15} color={colors.primary} />
              </TouchableOpacity>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primaryDark]} />
        }
        ListHeaderComponent={
          <View style={styles.listHeaderComponent}>
            {/* Search Input */}
            <View style={styles.searchWrapper}>
              <Input
                placeholder="Search by student, ID, or keywords..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                leftIcon={<Search size={18} color={colors.textTertiary} />}
                style={{ height: 42 }}
              />
            </View>

            {/* Department Filter Chips */}
            <Text style={styles.deptFilterLabel}>FILTER BY DEPARTMENT:</Text>
            <FilterChips
              options={deptOptions}
              selectedId={selectedDept}
              onSelect={setSelectedDept}
            />

            <View style={styles.resultsCountHeader}>
              <Text style={styles.resultsCountText}>
                Showing {filteredComplaints.length}{' '}
                {activeTab === 'unseen'
                  ? 'Unseen / Pending'
                  : activeTab === 'inprogress'
                  ? 'In Progress'
                  : activeTab === 'completed'
                  ? 'Completed'
                  : activeTab === 'rejected'
                  ? 'Rejected'
                  : 'Total'}{' '}
                Complaints
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={`No ${activeTab} complaints`}
            description={
              searchQuery || selectedDept !== 'all'
                ? 'Try clearing your search query or department filter.'
                : `No campus tickets found in the '${activeTab}' section.`
            }
            actionTitle="View All Complaints"
            onAction={() => {
              setActiveTab('all');
              setSearchQuery('');
              setSelectedDept('all');
            }}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topRoleBanner: {
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
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
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 4,
  },
  switchRolePillText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  fixedSubSectionsCard: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderDark,
    ...shadows.sm,
  },
  fixedSectionTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  mainTabsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 5,
  },
  mainTabBtnActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
    ...shadows.sm,
  },
  mainTabText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  mainTabTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  countBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  countBadgeTextActive: {
    color: '#FFFFFF',
  },
  secondaryFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs + 4,
    gap: spacing.sm,
  },
  secondaryPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.xs,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondaryPillText: {
    fontSize: 11,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  secondaryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  criticalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.severityCriticalBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.xs,
    gap: 4,
    marginLeft: 'auto',
  },
  criticalNoticeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.severityCritical,
  },
  listHeaderComponent: {
    paddingTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  searchWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  deptFilterLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  resultsCountHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  resultsCountText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  complaintCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardMainClickable: {
    padding: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketIdPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  ticketIdPillText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  statusGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 6,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  metaLocText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  reporterInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reporterInfoText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  aiBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.aiBadgeBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.xs,
    gap: 4,
    marginTop: 6,
  },
  aiBadgeBoxText: {
    fontSize: 11,
    color: colors.aiBadge,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  statusActionBox: {
    backgroundColor: '#F1F5F9',
    borderTopWidth: 1.5,
    borderBottomWidth: 1,
    borderColor: colors.borderDark,
    padding: spacing.md,
  },
  statusActionTitle: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    gap: 5,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radii.sm,
    gap: 3,
    borderWidth: 1.5,
  },
  actionBtnInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.borderDark,
  },
  actionBtnActiveInProgress: {
    backgroundColor: colors.statusInProgress,
    borderColor: colors.statusInProgress,
  },
  actionBtnActiveResolved: {
    backgroundColor: colors.statusResolved,
    borderColor: colors.statusResolved,
  },
  actionBtnActiveRejected: {
    backgroundColor: colors.statusRejected,
    borderColor: colors.statusRejected,
  },
  actionBtnActiveSubmitted: {
    backgroundColor: colors.statusSubmitted,
    borderColor: colors.statusSubmitted,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  actionBtnTextActive: {
    color: '#FFFFFF',
  },
  cardFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  cardFooterBarText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
});
