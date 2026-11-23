import React, { useState, useCallback } from 'react';
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
import { Search, Plus, Filter } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { complaintService } from '../../src/services/complaintService';
import { Complaint, ComplaintSeverity, ComplaintStatus } from '../../src/types';
import { Header } from '../../src/components/Header';
import { Input } from '../../src/components/Input';
import { FilterChips } from '../../src/components/FilterChips';
import { ComplaintCard } from '../../src/components/ComplaintCard';
import { EmptyState } from '../../src/components/EmptyState';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function MyComplaintsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadComplaints = async () => {
    if (!user) return;
    const list = await complaintService.getUserComplaints(user.id);
    setComplaints(list);
  };

  useFocusEffect(
    useCallback(() => {
      loadComplaints();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadComplaints();
    setRefreshing(false);
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((item) => {
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    if (selectedSeverity !== 'all' && item.severity !== selectedSeverity) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = item.id.toLowerCase().includes(q);
      const matchIssue = item.issue_type.toLowerCase().includes(q);
      const matchDept = item.department_name.toLowerCase().includes(q);
      const matchLoc = (item.location_name || '').toLowerCase().includes(q);
      return matchId || matchIssue || matchDept || matchLoc;
    }
    return true;
  });

  const statusOptions = [
    { id: 'all', label: 'All Statuses', count: complaints.length },
    {
      id: 'submitted',
      label: 'Submitted',
      count: complaints.filter((c) => c.status === 'submitted').length,
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      count: complaints.filter((c) => c.status === 'in_progress').length,
    },
    {
      id: 'resolved',
      label: 'Resolved',
      count: complaints.filter((c) => c.status === 'resolved').length,
    },
    {
      id: 'rejected',
      label: 'Rejected',
      count: complaints.filter((c) => c.status === 'rejected').length,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="My Complaints"
        subtitle={`${complaints.length} tickets recorded`}
        rightAction={
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => router.push('/(student)/submit')}
          >
            <Plus size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by ID, keyword, or location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={colors.textTertiary} />}
          style={styles.searchInput}
        />
      </View>

      {/* Status Chips */}
      <FilterChips
        options={statusOptions}
        selectedId={selectedStatus}
        onSelect={setSelectedStatus}
      />

      {/* Severity Sub-filters */}
      <View style={styles.severityBar}>
        <Text style={styles.severityBarLabel}>Priority:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.severityScroll}>
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => {
            const isSelected = selectedSeverity === sev;
            return (
              <TouchableOpacity
                key={sev}
                onPress={() => setSelectedSeverity(sev)}
                style={[
                  styles.sevPill,
                  isSelected && styles.sevPillSelected,
                  sev === 'critical' && isSelected && { backgroundColor: colors.severityCritical },
                ]}
              >
                <Text
                  style={[
                    styles.sevPillText,
                    isSelected && styles.sevPillTextSelected,
                  ]}
                >
                  {sev.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Complaints List */}
      <FlatList
        data={filteredComplaints}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ComplaintCard
            complaint={item}
            onPress={() => router.push(`/complaint/${item.id}` as any)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No complaints match filters"
            description={
              searchQuery || selectedStatus !== 'all' || selectedSeverity !== 'all'
                ? 'Try clearing your search keyword or selected filters to see more results.'
                : 'You have not submitted any complaints yet. Report an issue on campus anytime.'
            }
            actionTitle="Report Campus Issue"
            onAction={() => router.push('/(student)/submit')}
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
  headerActionBtn: {
    backgroundColor: colors.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
  },
  searchInput: {
    height: 42,
  },
  severityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  severityBarLabel: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    color: colors.textTertiary,
    marginRight: spacing.sm,
    textTransform: 'uppercase',
  },
  severityScroll: {
    flexGrow: 0,
  },
  sevPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.xs,
  },
  sevPillSelected: {
    backgroundColor: colors.primary,
  },
  sevPillText: {
    fontSize: 10,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  sevPillTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
