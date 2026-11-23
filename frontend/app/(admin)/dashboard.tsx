import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ArrowUpDown,
  Filter,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { complaintService } from '../../src/services/complaintService';
import { Complaint, ComplaintStatus, ComplaintSeverity, Department } from '../../src/types';
import { Header } from '../../src/components/Header';
import { Input } from '../../src/components/Input';
import { EmptyState } from '../../src/components/EmptyState';
import { StatusBadge } from '../../src/components/StatusBadge';
import { SeverityBadge } from '../../src/components/SeverityBadge';
import { colors, radii, shadows, spacing, typography } from '../../src/theme';

type AdminTab = 'all' | 'submitted' | 'in_progress' | 'resolved' | 'rejected';
type SortMode = 'newest' | 'oldest' | 'critical_first' | 'severity_low';

const STATUS_TABS: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
  { key: 'all',         label: 'All',        icon: <Filter size={13} color={colors.textSecondary} /> },
  { key: 'submitted',   label: 'Unseen',     icon: <Clock size={13} color={colors.statusSubmitted} /> },
  { key: 'in_progress', label: 'In Progress',icon: <RefreshCw size={13} color={colors.statusInProgress} /> },
  { key: 'resolved',    label: 'Resolved',   icon: <CheckCircle size={13} color={colors.statusResolved} /> },
  { key: 'rejected',    label: 'Rejected',   icon: <XCircle size={13} color={colors.statusRejected} /> },
];

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'newest',        label: 'Newest First'   },
  { key: 'oldest',        label: 'Oldest First'   },
  { key: 'critical_first',label: 'Critical First' },
  { key: 'severity_low',  label: 'Low Severity'   },
];

const SEVERITY_RANK: Record<ComplaintSeverity, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return iso;
  }
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [complaints, setComplaints]       = useState<Complaint[]>([]);
  const [departments, setDepartments]     = useState<Department[]>([]);
  const [activeTab, setActiveTab]         = useState<AdminTab>('all');
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedDept, setSelectedDept]   = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [sortMode, setSortMode]           = useState<SortMode>('newest');
  const [showSortMenu, setShowSortMenu]   = useState(false);
  const [refreshing, setRefreshing]       = useState(false);

  const loadData = async () => {
    const [list, depts] = await Promise.all([
      complaintService.getAllComplaints().catch(() => []),
      complaintService.getDepartments().catch(() => []),
    ]);
    setComplaints(list);
    setDepartments(depts);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Counts for tab badges ──────────────────────────────────────────────
  const tabCount = (tab: AdminTab) =>
    tab === 'all' ? complaints.length : complaints.filter(c => c.status === tab).length;

  const criticalCount = complaints.filter(
    c => c.severity === 'critical' && c.status !== 'resolved'
  ).length;

  // ── Filter + sort ──────────────────────────────────────────────────────
  const filtered = complaints
    .filter(item => {
      if (activeTab !== 'all' && item.status !== activeTab) return false;
      if (selectedDept !== 'all' && item.department_id !== selectedDept) return false;
      if (selectedSeverity !== 'all' && item.severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.id.toLowerCase().includes(q) ||
          (item.issue_type || '').toLowerCase().includes(q) ||
          (item.department_name || '').toLowerCase().includes(q) ||
          (item.userName || '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortMode) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'critical_first':
          return (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0);
        case 'severity_low':
          return (SEVERITY_RANK[a.severity] || 0) - (SEVERITY_RANK[b.severity] || 0);
        default:
          return 0;
      }
    });

  // ── Compact complaint row ──────────────────────────────────────────────
  const renderItem = ({ item }: { item: Complaint }) => (
    <TouchableOpacity
      activeOpacity={0.78}
      style={styles.row}
      onPress={() => router.push(`/complaint/${item.id}` as any)}
    >
      {/* Left severity stripe */}
      <View style={[styles.stripe, { backgroundColor: severityColor(item.severity) }]} />

      {/* Main content */}
      <View style={styles.rowBody}>
        {/* Line 1: Issue type + badges */}
        <View style={styles.rowTop}>
          <Text style={styles.issueType} numberOfLines={1}>{item.issue_type}</Text>
          <View style={styles.badgeGroup}>
            <SeverityBadge severity={item.severity} size="sm" />
            <StatusBadge   status={item.status}    size="sm" />
          </View>
        </View>

        {/* Line 2: Dept + date */}
        <View style={styles.rowMid}>
          <Text style={styles.deptText} numberOfLines={1}>🏢 {item.department_name}</Text>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>

        {/* Line 3: Reporter + ticket id */}
        <View style={styles.rowBot}>
          {item.userName ? (
            <Text style={styles.reporterText} numberOfLines={1}>👤 {item.userName}</Text>
          ) : (
            <Text style={styles.reporterText}>—</Text>
          )}
          <Text style={styles.ticketId}>#{item.id.slice(0, 8)}</Text>
        </View>
      </View>

      <ChevronRight size={16} color={colors.textTertiary} style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Admin Dashboard" subtitle="Campus Complaint Triage" />

      {/* ── Status Tabs ─────────────────────────────────────────────── */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {STATUS_TABS.map(tab => {
            const active = activeTab === tab.key;
            const count  = tabCount(tab.key);
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabPill, active && styles.tabPillActive]}
              >
                {tab.icon}
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {criticalCount > 0 && (
            <View style={styles.criticalPill}>
              <AlertTriangle size={12} color={colors.severityCritical} />
              <Text style={styles.criticalPillText}>{criticalCount} Critical</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── FlatList with filters in header ─────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primaryDark]} />
        }
        ListHeaderComponent={
          <View>
            {/* Search */}
            <View style={styles.searchRow}>
              <View style={styles.searchFlex}>
                <Input
                  placeholder="Search by name, ID, issue…"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  leftIcon={<Search size={16} color={colors.textTertiary} />}
                  style={{ height: 40 }}
                />
              </View>

              {/* Sort button */}
              <TouchableOpacity
                style={styles.sortBtn}
                onPress={() => setShowSortMenu(v => !v)}
              >
                <ArrowUpDown size={15} color={colors.primary} />
                <Text style={styles.sortBtnText}>Sort</Text>
              </TouchableOpacity>
            </View>

            {/* Sort menu */}
            {showSortMenu && (
              <View style={styles.sortMenu}>
                {SORT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => { setSortMode(opt.key); setShowSortMenu(false); }}
                    style={[styles.sortOption, sortMode === opt.key && styles.sortOptionActive]}
                  >
                    <Text style={[styles.sortOptionText, sortMode === opt.key && styles.sortOptionTextActive]}>
                      {sortMode === opt.key ? '✓ ' : ''}{opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Severity filter chips */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>SEVERITY:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['all', 'critical', 'high', 'medium', 'low'].map(sev => (
                  <TouchableOpacity
                    key={sev}
                    onPress={() => setSelectedSeverity(sev)}
                    style={[styles.chip, selectedSeverity === sev && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selectedSeverity === sev && styles.chipTextActive]}>
                      {sev === 'all' ? 'All Severity' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Department filter chips */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>DEPT:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => setSelectedDept('all')}
                  style={[styles.chip, selectedDept === 'all' && styles.chipActive]}
                >
                  <Text style={[styles.chipText, selectedDept === 'all' && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                {departments.map(d => (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => setSelectedDept(d.id)}
                    style={[styles.chip, selectedDept === d.id && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selectedDept === d.id && styles.chipTextActive]} numberOfLines={1}>
                      {d.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Results count + active sort */}
            <View style={styles.resultsRow}>
              <Text style={styles.resultsText}>
                {filtered.length} complaint{filtered.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.sortIndicator}>
                {SORT_OPTIONS.find(o => o.key === sortMode)?.label}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No complaints found"
            description={
              searchQuery || selectedDept !== 'all' || selectedSeverity !== 'all'
                ? 'Try clearing your filters.'
                : `No complaints in '${activeTab}' section.`
            }
            actionTitle="Clear Filters"
            onAction={() => {
              setActiveTab('all');
              setSearchQuery('');
              setSelectedDept('all');
              setSelectedSeverity('all');
            }}
          />
        }
      />
    </SafeAreaView>
  );
}

function severityColor(severity: ComplaintSeverity): string {
  switch (severity) {
    case 'critical': return colors.severityCritical;
    case 'high':     return '#F97316';
    case 'medium':   return '#F59E0B';
    case 'low':      return '#22C55E';
    default:         return colors.border;
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  // ── Status tabs ───────────────────────────────────────────────────────
  tabsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
    ...shadows.sm,
  },
  tabsScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    gap: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabPillActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  tabLabelActive: { color: '#FFFFFF' },
  tabBadge: {
    backgroundColor: colors.border,
    borderRadius: radii.full,
    minWidth: 18,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignItems: 'center',
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText: { fontSize: 10, fontWeight: typography.weights.bold, color: colors.textSecondary },
  tabBadgeTextActive: { color: '#FFFFFF' },
  criticalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.severityCriticalBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.severityCritical,
  },
  criticalPillText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.severityCritical,
  },

  // ── Filters in list header ────────────────────────────────────────────
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  searchFlex: { flex: 1 },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 9,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  sortMenu: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: radii.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  sortOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  sortOptionActive: { backgroundColor: colors.primarySoft },
  sortOptionText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  sortOptionTextActive: { color: colors.primary, fontWeight: typography.weights.bold },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  filterLabel: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.textTertiary,
    letterSpacing: 0.6,
    minWidth: 36,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: {
    fontSize: 11,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  chipTextActive: { color: '#FFFFFF', fontWeight: typography.weights.bold },

  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  resultsText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  sortIndicator: {
    fontSize: 11,
    color: colors.textTertiary,
  },

  listContent: {
    paddingBottom: spacing.xxxl,
  },

  // ── Compact complaint row ─────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  stripe: {
    width: 4,
    minHeight: 70,
  },
  rowBody: {
    flex: 1,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    gap: 3,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  issueType: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 4,
    flexShrink: 0,
  },
  rowMid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  deptText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: 10,
    color: colors.textTertiary,
    flexShrink: 0,
  },
  rowBot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reporterText: {
    fontSize: 11,
    color: colors.textTertiary,
    flex: 1,
  },
  ticketId: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  chevron: {
    alignSelf: 'center',
    marginRight: spacing.sm,
  },
});
