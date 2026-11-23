import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  MapPin,
  Clock,
  Sparkles,
  Calendar,
  Send,
  Building,
  CheckCircle,
  RefreshCw,
  XCircle,
  AlertTriangle,
  User,
  ExternalLink,
  Navigation,
} from 'lucide-react-native';
import { complaintService } from '../../src/services/complaintService';
import { useAuth } from '../../src/context/AuthContext';
import { Complaint, ComplaintSeverity, ComplaintStatus } from '../../src/types';
import { mockDepartments } from '../../src/data/mockData';
import { Header } from '../../src/components/Header';
import { StatusBadge } from '../../src/components/StatusBadge';
import { SeverityBadge } from '../../src/components/SeverityBadge';
import { DepartmentBadge } from '../../src/components/DepartmentBadge';
import { Timeline } from '../../src/components/Timeline';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Toast, ToastType } from '../../src/components/Toast';
import { colors, radii, shadows, spacing, typography } from '../../src/theme';

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, role } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const isAdmin = role === 'admin' || user?.role === 'admin';

  // Smart back navigation with fallback if stack history is missing
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(isAdmin ? '/(admin)/dashboard' : '/(student)/home');
    }
  };

  // Hardware back button and swipe back gesture handling for Android
  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isAdmin]);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ visible: true, message, type });
  };

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    const data = await complaintService.getComplaintById(id);
    setComplaint(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Attempt reverse-geocoding if coordinates exist
  useEffect(() => {
    if (complaint?.latitude && complaint?.longitude) {
      Location.reverseGeocodeAsync({
        latitude: Number(complaint.latitude),
        longitude: Number(complaint.longitude),
      })
        .then((places) => {
          if (places && places.length > 0) {
            const p = places[0];
            const parts = [p.name, p.street, p.district, p.city].filter(Boolean);
            if (parts.length > 0) {
              setResolvedAddress(parts.join(', '));
            }
          }
        })
        .catch(() => {});
    }
  }, [complaint?.latitude, complaint?.longitude]);

  // Open location coordinates in Maps app
  const handleOpenMaps = () => {
    if (!complaint?.latitude || !complaint?.longitude) return;
    const lat = complaint.latitude;
    const lng = complaint.longitude;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => {});
  };

  // Handle Status Update (Admin or quick action)
  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    if (!complaint) return;
    setIsSubmitting(true);

    try {
      const defaultComment =
        newStatus === 'resolved'
          ? 'Complaint marked as completed by Facilities Admin.'
          : newStatus === 'in_progress'
          ? 'Work order assigned to maintenance team.'
          : newStatus === 'rejected'
          ? 'Rejected: Out of scope or duplicate ticket.'
          : 'Complaint reopened / marked as unseen for review.';

      const note = commentText.trim() || defaultComment;
      const updated = await complaintService.updateComplaintStatus(
        complaint.id,
        newStatus,
        note,
        user?.name || (isAdmin ? 'Facilities Admin' : 'Student')
      );

      setComplaint(updated);
      setCommentText('');
      showToast(
        `Ticket #${complaint.id.slice(0, 8)} status changed to ${newStatus.replace('_', ' ').toUpperCase()}`,
        'success'
      );
    } catch {
      showToast('Failed to update status. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Student Follow-up Note
  const handleAddStudentComment = async () => {
    if (!commentText.trim() || !complaint) return;
    setIsSubmitting(true);

    try {
      const updated = await complaintService.updateComplaintStatus(
        complaint.id,
        complaint.status,
        `Student Note: ${commentText.trim()}`,
        `${user?.name || 'Student'}`
      );
      setComplaint(updated);
      setCommentText('');
      showToast('Your note has been added to the ticket history timeline.', 'success');
    } catch {
      showToast('Could not add note. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reassign Department (Admin)
  const handleDepartmentChange = async (deptId: string, deptName: string) => {
    if (!complaint) return;
    try {
      const updated = await complaintService.reassignDepartment(complaint.id, deptId, deptName);
      setComplaint(updated);
      showToast(`Department reassigned to ${deptName}.`, 'info');
    } catch {
      showToast('Failed to reassign department.', 'error');
    }
  };

  // Change Severity Priority (Admin)
  const handlePriorityChange = async (newSev: ComplaintSeverity) => {
    if (!complaint) return;
    try {
      const updated = await complaintService.updateComplaintPriority(complaint.id, newSev);
      setComplaint(updated);
      showToast(`Priority adjusted to ${newSev.toUpperCase()}.`, 'info');
    } catch {
      showToast('Failed to update priority.', 'error');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Complaint Details" showBack onBack={handleBack} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading complaint #{id}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!complaint) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Complaint Details" showBack onBack={handleBack} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Complaint Not Found</Text>
          <Text style={styles.errorSub}>The complaint ticket #{id} was not found.</Text>
          <Button
            title="Go Back"
            onPress={handleBack}
            variant="outline"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = new Date(complaint.created_at).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const hasCoordinates =
    complaint.latitude !== undefined &&
    complaint.latitude !== null &&
    !isNaN(complaint.latitude) &&
    complaint.longitude !== undefined &&
    complaint.longitude !== null &&
    !isNaN(complaint.longitude);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={`Ticket #${complaint.id}`}
        subtitle={complaint.department_name}
        showBack
        onBack={handleBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo View with Badges & Location Overlay */}
        <View style={styles.imageCard}>
          <Image
            source={{ uri: complaint.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.badgesOverlay}>
            <StatusBadge status={complaint.status} />
            <SeverityBadge severity={complaint.severity} />
          </View>

          {/* Location Chip on Image */}
          <View style={styles.imageLocationChip}>
            <MapPin size={12} color="#FFFFFF" />
            <Text style={styles.imageLocationChipText} numberOfLines={1}>
              {complaint.location_name
                ? complaint.location_name
                : hasCoordinates
                ? `GPS: ${Number(complaint.latitude).toFixed(4)}, ${Number(complaint.longitude).toFixed(4)}`
                : 'Campus Location'}
            </Text>
          </View>
        </View>

        {/* Current Status Highlights Box */}
        <View style={styles.statusHighlightBox}>
          <View style={styles.statusHighlightRow}>
            <Text style={styles.statusHighlightLabel}>Current Ticket Status:</Text>
            <StatusBadge status={complaint.status} />
          </View>
          <Text style={styles.statusHighlightHint}>
            {complaint.status === 'submitted'
              ? 'Status: Unseen / Pending Admin Review'
              : complaint.status === 'in_progress'
              ? 'Status: In Progress (Work Order Dispatched)'
              : complaint.status === 'resolved'
              ? 'Status: Completed & Verified'
              : 'Status: Rejected'}
          </Text>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.title}>{complaint.issue_type}</Text>

          <View style={styles.metaRow}>
            <Calendar size={14} color={colors.textTertiary} />
            <Text style={styles.metaItemText}>{formattedDate}</Text>
          </View>

          <View style={styles.deptRow}>
            <DepartmentBadge name={complaint.department_name} />
          </View>

          {/* Location Mark Section for Each Complaint */}
          <View style={styles.locationMarkCard}>
            <View style={styles.locationMarkHeader}>
              <View style={styles.locationMarkPill}>
                <MapPin size={14} color={colors.primary} />
                <Text style={styles.locationMarkPillText}>Campus Location Mark</Text>
              </View>
              {hasCoordinates ? (
                <View style={styles.gpsVerifiedBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.gpsVerifiedText}>GPS Captured</Text>
                </View>
              ) : (
                <Text style={styles.locationPendingBadge}>Campus Grounds</Text>
              )}
            </View>

            <Text style={styles.locationMainTitle}>
              {complaint.location_name
                ? complaint.location_name
                : hasCoordinates
                ? 'Captured GPS Site Coordinates'
                : 'Campus Facilities Zone'}
            </Text>

            {resolvedAddress ? (
              <Text style={styles.resolvedAddressText}>📍 {resolvedAddress}</Text>
            ) : null}

            {hasCoordinates ? (
              <View style={styles.coordsRow}>
                <View style={styles.coordPill}>
                  <Text style={styles.coordLabel}>LAT:</Text>
                  <Text style={styles.coordValue}>{Number(complaint.latitude).toFixed(6)}</Text>
                </View>
                <View style={styles.coordPill}>
                  <Text style={styles.coordLabel}>LONG:</Text>
                  <Text style={styles.coordValue}>{Number(complaint.longitude).toFixed(6)}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noCoordsHint}>
                GPS coordinates were not available during submission (default campus zone applied).
              </Text>
            )}

            {hasCoordinates ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.openMapsBtn}
                onPress={handleOpenMaps}
              >
                <ExternalLink size={14} color="#FFFFFF" />
                <Text style={styles.openMapsBtnText}>Open in Google Maps</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={styles.sectionHeader}>Issue Description</Text>
          <Text style={styles.descriptionText}>
            {complaint.description || 'No detailed description provided.'}
          </Text>

          {complaint.userName ? (
            <View style={styles.reporterBox}>
              <User size={14} color={colors.textTertiary} />
              <Text style={styles.reporterText}>
                Submitted by: <Text style={{ fontWeight: '600' }}>{complaint.userName}</Text> ({complaint.userEmail})
              </Text>
            </View>
          ) : null}
        </View>

        {/* AI Vision Analysis Section */}
        {complaint.ai_analysis ? (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiPill}>
                <Sparkles size={14} color="#7C3AED" />
                <Text style={styles.aiPillText}>Ollama Vision AI Breakdown</Text>
              </View>
              <Text style={styles.aiConfidenceBadge}>
                {Math.round((complaint.ai_analysis.confidence || 0.9) * 100)}% Confidence
              </Text>
            </View>

            <Text style={styles.aiIssueTitle}>
              Classification: {complaint.ai_analysis.issue}
            </Text>
            <Text style={styles.aiDescription}>
              {complaint.ai_analysis.description}
            </Text>

            {complaint.ai_analysis.detected_objects && complaint.ai_analysis.detected_objects.length > 0 ? (
              <View style={styles.aiObjectsSection}>
                <Text style={styles.aiObjectsLabel}>Detected Objects & Risk Factors:</Text>
                <View style={styles.aiObjectsWrap}>
                  {complaint.ai_analysis.detected_objects.map((obj, i) => (
                    <View key={i} style={styles.objChip}>
                      <Text style={styles.objChipText}>{obj}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {complaint.ai_analysis.recommended_action ? (
              <View style={styles.aiRecommendationBox}>
                <Text style={styles.aiRecTitle}>Recommended Triage Action:</Text>
                <Text style={styles.aiRecText}>
                  {complaint.ai_analysis.recommended_action}
                </Text>
              </View>
            ) : null}

            {complaint.ai_analysis.estimated_resolution_time ? (
              <View style={styles.etaRow}>
                <Clock size={12} color="#7C3AED" />
                <Text style={styles.etaText}>
                  Estimated SLA: {complaint.ai_analysis.estimated_resolution_time}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ADMIN ACTIONS: Change Status, Department, Priority */}
        {isAdmin ? (
          <View style={styles.adminActionCard}>
            <Text style={styles.adminActionHeader}>Admin Status & Triage Controls</Text>

            {/* Status Change Buttons */}
            <Text style={styles.controlSubLabel}>Change Status:</Text>
            <View style={styles.statusBtnGrid}>
              <TouchableOpacity
                onPress={() => handleStatusChange('in_progress')}
                disabled={isSubmitting}
                style={[
                  styles.adminStatusBtn,
                  complaint.status === 'in_progress' ? styles.adminStatusBtnActiveInProgress : styles.adminStatusBtnInactive,
                ]}
              >
                <RefreshCw size={14} color={complaint.status === 'in_progress' ? '#FFFFFF' : colors.statusInProgress} />
                <Text style={[styles.adminStatusBtnText, complaint.status === 'in_progress' && { color: '#FFFFFF' }]}>
                  {complaint.status === 'in_progress' ? '✓ In Progress' : 'In Progress'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStatusChange('resolved')}
                disabled={isSubmitting}
                style={[
                  styles.adminStatusBtn,
                  complaint.status === 'resolved' ? styles.adminStatusBtnActiveResolved : styles.adminStatusBtnInactive,
                ]}
              >
                <CheckCircle size={14} color={complaint.status === 'resolved' ? '#FFFFFF' : colors.statusResolved} />
                <Text style={[styles.adminStatusBtnText, complaint.status === 'resolved' && { color: '#FFFFFF' }]}>
                  {complaint.status === 'resolved' ? '✓ Completed' : 'Completed'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStatusChange('rejected')}
                disabled={isSubmitting}
                style={[
                  styles.adminStatusBtn,
                  complaint.status === 'rejected' ? styles.adminStatusBtnActiveRejected : styles.adminStatusBtnInactive,
                ]}
              >
                <XCircle size={14} color={complaint.status === 'rejected' ? '#FFFFFF' : colors.statusRejected} />
                <Text style={[styles.adminStatusBtnText, complaint.status === 'rejected' && { color: '#FFFFFF' }]}>
                  {complaint.status === 'rejected' ? '✓ Rejected' : 'Reject'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleStatusChange('submitted')}
                disabled={isSubmitting}
                style={[
                  styles.adminStatusBtn,
                  complaint.status === 'submitted' ? styles.adminStatusBtnActiveSubmitted : styles.adminStatusBtnInactive,
                ]}
              >
                <Clock size={14} color={complaint.status === 'submitted' ? '#FFFFFF' : colors.statusSubmitted} />
                <Text style={[styles.adminStatusBtnText, complaint.status === 'submitted' && { color: '#FFFFFF' }]}>
                  {complaint.status === 'submitted' ? '✓ Unseen' : 'Unseen'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Department Reassignment */}
            <Text style={[styles.controlSubLabel, { marginTop: spacing.md }]}>Department Reassignment:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xs }}>
              {mockDepartments.map((dept) => {
                const isCurrent = dept.id === complaint.department_id;
                return (
                  <TouchableOpacity
                    key={dept.id}
                    onPress={() => handleDepartmentChange(dept.id, dept.name)}
                    style={[styles.deptPill, isCurrent && styles.deptPillActive]}
                  >
                    <Building size={12} color={isCurrent ? '#FFFFFF' : colors.textSecondary} />
                    <Text style={[styles.deptPillText, isCurrent && styles.deptPillTextActive]}>
                      {dept.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Priority Adjustment */}
            <Text style={[styles.controlSubLabel, { marginTop: spacing.sm }]}>Adjust Priority Severity:</Text>
            <View style={styles.priorityRow}>
              {(['low', 'medium', 'high', 'critical'] as ComplaintSeverity[]).map((sev) => {
                const isSelected = complaint.severity === sev;
                return (
                  <TouchableOpacity
                    key={sev}
                    onPress={() => handlePriorityChange(sev)}
                    style={[
                      styles.sevBtn,
                      isSelected && styles.sevBtnActive,
                      sev === 'critical' && isSelected && { backgroundColor: colors.severityCritical },
                    ]}
                  >
                    <Text style={[styles.sevBtnText, isSelected && { color: '#FFFFFF' }]}>
                      {sev.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional Comment Input */}
            <Text style={[styles.controlSubLabel, { marginTop: spacing.sm }]}>Add Supervisor Remark:</Text>
            <Input
              placeholder="e.g. Electrical crew completed work order..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              numberOfLines={2}
            />
          </View>
        ) : null}

        {/* Status History & Audit Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionHeader}>Status History & Audit Log</Text>
          <Timeline items={complaint.history || []} />

          {/* Student Comment Input (if not admin) */}
          {!isAdmin ? (
            <View style={styles.commentSection}>
              <Text style={styles.commentPrompt}>Need to add an update or follow-up note?</Text>
              <Input
                placeholder="e.g. The leak has gotten worse this morning..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
                numberOfLines={2}
              />
              <Button
                title="Add Note to History"
                onPress={handleAddStudentComment}
                loading={isSubmitting}
                variant="secondary"
                size="sm"
                icon={<Send size={14} color={colors.primary} />}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  errorTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  errorSub: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  imageCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    position: 'relative',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  image: {
    width: '100%',
    height: 230,
  },
  badgesOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageLocationChip: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 4,
  },
  imageLocationChipText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: typography.weights.medium,
  },
  statusHighlightBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  statusHighlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusHighlightLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statusHighlightHint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    lineHeight: 26,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.md,
  },
  metaItemText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  deptRow: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs + 2,
  },
  descriptionText: {
    fontSize: typography.sizes.sm + 1,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  reporterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  reporterText: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  aiCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#7C3AED',
  },
  aiConfidenceBadge: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#7C3AED',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  aiIssueTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  aiDescription: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  aiObjectsSection: {
    marginBottom: spacing.md,
  },
  aiObjectsLabel: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textTertiary,
    fontWeight: typography.weights.semibold,
    marginBottom: 4,
  },
  aiObjectsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  objChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  objChipText: {
    fontSize: 11,
    color: '#6D28D9',
    fontWeight: typography.weights.medium,
  },
  aiRecommendationBox: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
    padding: spacing.sm,
    borderRadius: radii.xs,
    marginBottom: spacing.sm,
  },
  aiRecTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: '#7C3AED',
    marginBottom: 2,
  },
  aiRecText: {
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  etaText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.semibold,
    color: '#7C3AED',
  },
  adminActionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  adminActionHeader: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  controlSubLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  statusBtnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  adminStatusBtn: {
    flexBasis: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1.5,
    gap: 4,
  },
  adminStatusBtnInactive: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  adminStatusBtnActiveInProgress: {
    backgroundColor: colors.statusInProgress,
    borderColor: colors.statusInProgress,
  },
  adminStatusBtnActiveResolved: {
    backgroundColor: colors.statusResolved,
    borderColor: colors.statusResolved,
  },
  adminStatusBtnActiveRejected: {
    backgroundColor: colors.statusRejected,
    borderColor: colors.statusRejected,
  },
  adminStatusBtnActiveSubmitted: {
    backgroundColor: colors.statusSubmitted,
    borderColor: colors.statusSubmitted,
  },
  adminStatusBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  deptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.full,
    marginRight: spacing.xs + 2,
    gap: 4,
  },
  deptPillActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  deptPillText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  deptPillTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  sevBtn: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  sevBtnActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  sevBtnText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  timelineCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  commentSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  commentPrompt: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
});
