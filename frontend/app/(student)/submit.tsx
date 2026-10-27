import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  MapPin,
  Building,
  AlertTriangle,
  FileText,
  CheckCircle,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { complaintService, simulateAIVisionAnalysis } from '../../src/services/complaintService';
import { mockDepartments, mockLocations } from '../../src/data/mockData';
import { AIAnalysis, ComplaintSeverity } from '../../src/types';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Header } from '../../src/components/Header';
import { DemoBanner } from '../../src/components/DemoBanner';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function SubmitComplaintScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [imageUri, setImageUri] = useState<string | null>(
    'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80'
  );
  const [issueType, setIssueType] = useState('Broken switchboard in 2nd floor corridor');
  const [departmentId, setDepartmentId] = useState(mockDepartments[0].id);
  const [locationName, setLocationName] = useState('Hostel Block C - 2nd Floor Corridor');
  const [description, setDescription] = useState(
    'Switch plate has cracked open with exposed wiring. Needs immediate repair.'
  );
  const [severity, setSeverity] = useState<ComplaintSeverity>('high');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Camera pick
  const pickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setImageUri(result.assets[0].uri);
        triggerAIAnalysis(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Camera Error', 'Could not open camera on this device/simulator.');
    }
  };

  // Gallery pick
  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Gallery permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setImageUri(result.assets[0].uri);
        triggerAIAnalysis(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Gallery Error', 'Could not open image library.');
    }
  };

  // Trigger simulated AI Vision Analysis
  const triggerAIAnalysis = (uri?: string) => {
    setIsAnalyzingAI(true);
    setTimeout(() => {
      const dept = mockDepartments.find((d) => d.id === departmentId);
      const analysis = simulateAIVisionAnalysis(dept?.name);
      setAiAnalysis(analysis);
      setSeverity(analysis.severity);
      if (!issueType.trim()) {
        setIssueType(analysis.issue);
      }
      setIsAnalyzingAI(false);
    }, 800);
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!imageUri) {
      setErrorMessage('Please capture or select an image of the issue.');
      return;
    }
    if (!issueType.trim()) {
      setErrorMessage('Please enter a brief issue title.');
      return;
    }
    if (!locationName.trim()) {
      setErrorMessage('Please provide the location.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await complaintService.submitComplaint({
        userId: user?.id || 'usr-student-001',
        userName: user?.name || 'Nandit Sharma',
        userEmail: user?.email || 'student@campus.edu',
        departmentId,
        locationName,
        imageUri,
        issueType,
        description,
        severity,
        simulateAI: true,
      });

      Alert.alert(
        'Complaint Registered! (Demo Mode)',
        `Ticket ${result.complaint.id} has been submitted with AI Vision classification: ${result.aiAnalysis.severity.toUpperCase()} severity.`,
        [
          {
            text: 'View Ticket Details',
            onPress: () => router.replace(`/complaint/${result.complaint.id}` as any),
          },
          {
            text: 'Back to Dashboard',
            onPress: () => router.replace('/(student)/home'),
          },
        ]
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Report Campus Issue" subtitle="AI-Powered Defect Identification" />
      <DemoBanner message="Demo Submission: Saves into local state & simulates Ollama Vision triage." />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Photo Proof of Issue *</Text>
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                <View style={styles.imageActionOverlay}>
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={pickFromCamera}
                  >
                    <Camera size={14} color="#FFFFFF" />
                    <Text style={styles.actionPillText}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionPill, styles.removePill]}
                    onPress={() => setImageUri(null)}
                  >
                    <Trash2 size={14} color="#FFFFFF" />
                    <Text style={styles.actionPillText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.pickerBox}>
                <Text style={styles.pickerTitle}>No photo captured yet</Text>
                <Text style={styles.pickerSub}>
                  Upload clear image showing the fault or hazard
                </Text>
                <View style={styles.pickerBtnRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={pickFromCamera}
                    style={styles.pickerBtn}
                  >
                    <Camera size={20} color={colors.primary} />
                    <Text style={styles.pickerBtnText}>Use Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={pickFromGallery}
                    style={[styles.pickerBtn, styles.galleryBtn]}
                  >
                    <ImageIcon size={20} color={colors.textPrimary} />
                    <Text style={styles.pickerBtnTextDark}>Choose Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* AI Vision Preview Trigger */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => triggerAIAnalysis()}
              disabled={isAnalyzingAI}
              style={styles.aiTriggerBtn}
            >
              <Sparkles size={16} color={colors.aiBadge} />
              <Text style={styles.aiTriggerText}>
                {isAnalyzingAI
                  ? 'Simulating Ollama Vision Analysis...'
                  : aiAnalysis
                  ? 'Re-run AI Vision Assessment'
                  : 'Run AI Vision Pre-Screening (Local Model)'}
              </Text>
            </TouchableOpacity>

            {aiAnalysis ? (
              <View style={styles.aiResultCard}>
                <View style={styles.aiResultHeader}>
                  <Sparkles size={14} color={colors.aiBadge} />
                  <Text style={styles.aiResultTitle}>Ollama Vision Detection</Text>
                  <Text style={styles.aiConfidence}>
                    {Math.round((aiAnalysis.confidence || 0.9) * 100)}% match
                  </Text>
                </View>
                <Text style={styles.aiResultBody}>{aiAnalysis.description}</Text>
                <View style={styles.aiTagsRow}>
                  {aiAnalysis.detected_objects?.map((obj, i) => (
                    <View key={i} style={styles.detectedObjBadge}>
                      <Text style={styles.detectedObjText}>{obj}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.aiSuggestedAction}>
                  Recommended Action: {aiAnalysis.recommended_action}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Form Fields */}
          <Input
            label="Issue Summary / Title"
            required
            placeholder="e.g. Water leaking under sink"
            value={issueType}
            onChangeText={setIssueType}
            leftIcon={<FileText size={18} color={colors.textTertiary} />}
          />

          {/* Department Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Department *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
              {mockDepartments.map((dept) => {
                const isSelected = dept.id === departmentId;
                return (
                  <TouchableOpacity
                    key={dept.id}
                    onPress={() => setDepartmentId(dept.id)}
                    style={[styles.deptChip, isSelected && styles.deptChipSelected]}
                  >
                    <Building size={14} color={isSelected ? '#FFFFFF' : colors.textSecondary} />
                    <Text style={[styles.deptChipText, isSelected && styles.deptChipTextSelected]}>
                      {dept.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Location Input with quick suggestions */}
          <Input
            label="Specific Location on Campus"
            required
            placeholder="e.g. Hostel Block C - 2nd Floor Room 210"
            value={locationName}
            onChangeText={setLocationName}
            leftIcon={<MapPin size={18} color={colors.textTertiary} />}
          />
          <View style={styles.presetLocations}>
            <Text style={styles.presetLabel}>Quick Select:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {mockLocations.slice(0, 4).map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  onPress={() => setLocationName(loc.name)}
                  style={styles.presetPill}
                >
                  <Text style={styles.presetPillText}>{loc.name.split('-')[0].trim()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Description */}
          <Input
            label="Detailed Description"
            placeholder="Describe what you observed, potential hazards, and how long it has been present..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.multilineInput}
          />

          {/* Priority / Severity */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Priority Severity (AI Recommended)</Text>
            <View style={styles.severityRow}>
              {(['low', 'medium', 'high', 'critical'] as ComplaintSeverity[]).map((lvl) => {
                const isSelected = severity === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    onPress={() => setSeverity(lvl)}
                    style={[
                      styles.severityOption,
                      isSelected && styles.severityOptionSelected,
                      lvl === 'critical' && isSelected && { borderColor: colors.severityCritical },
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityOptionText,
                        isSelected && styles.severityOptionTextSelected,
                        lvl === 'critical' && isSelected && { color: colors.severityCritical },
                      ]}
                    >
                      {lvl.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title="Submit Complaint (Demo)"
            onPress={handleSubmit}
            loading={isSubmitting}
            variant="primary"
            icon={<CheckCircle size={18} color="#FFFFFF" />}
            style={styles.submitBtn}
          />
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
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs + 2,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  imagePreview: {
    width: '100%',
    height: 200,
  },
  imageActionOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radii.full,
    gap: 4,
  },
  removePill: {
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
  },
  actionPillText: {
    fontSize: typography.sizes.xs,
    color: '#FFFFFF',
    fontWeight: typography.weights.medium,
  },
  pickerBox: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  pickerSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  pickerBtnRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.xs,
  },
  galleryBtn: {
    backgroundColor: colors.surfaceAlt,
  },
  pickerBtnText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  pickerBtnTextDark: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },
  aiTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.aiBadgeBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.sm,
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  aiTriggerText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.aiBadge,
    fontWeight: typography.weights.semibold,
  },
  aiResultCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiResultTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.aiBadge,
    flex: 1,
  },
  aiConfidence: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    color: colors.aiBadge,
  },
  aiResultBody: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  aiTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.xs,
  },
  detectedObjBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  detectedObjText: {
    fontSize: 10,
    color: colors.aiBadge,
    fontWeight: typography.weights.medium,
  },
  aiSuggestedAction: {
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },
  deptScroll: {
    flexDirection: 'row',
  },
  deptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  deptChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  deptChipText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  deptChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: typography.weights.semibold,
  },
  presetLocations: {
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  presetLabel: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  presetPill: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginRight: spacing.xs,
  },
  presetPillText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.textSecondary,
  },
  multilineInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  severityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  severityOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  severityOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  severityOptionText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.bold,
    color: colors.textTertiary,
  },
  severityOptionTextSelected: {
    color: colors.primary,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
