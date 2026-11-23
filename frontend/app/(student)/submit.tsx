
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  Camera,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  MapPin,
  CheckCircle,
} from 'lucide-react-native';

import { complaintService } from '../../src/services/complaintService';
import { Button } from '../../src/components/Button';
import { Header } from '../../src/components/Header';
import {
  FeedbackModal,
  FeedbackModalProps,
} from '../../src/components/FeedbackModal';
import { colors, radii, spacing, typography } from '../../src/theme';

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

export default function SubmitComplaintScreen() {
  const router = useRouter();

  const [imageUri, setImageUri] = useState<string | null>(null);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackModal, setFeedbackModal] =
    useState<FeedbackModalProps | null>(null);

  // AI analysis and editable student values
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);

  const [issueType, setIssueType] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [severity, setSeverity] = useState<string>('medium');
  const [description, setDescription] = useState('');

  // Capture GPS when the screen opens
  useEffect(() => {
    (async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }).catch(() => null);

          if (loc?.coords) {
            setLatitude(loc.coords.latitude);
            setLongitude(loc.coords.longitude);
          }
        }
      } catch {
        // GPS is optional
      }
    })();
  }, []);

  // Restore a pending camera result when returning to this screen
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const restorePendingImage = async () => {
        try {
          const pending =
            (await ImagePicker.getPendingResultAsync()) as any;

          if (
            active &&
            pending &&
            !pending.error &&
            !pending.canceled &&
            Array.isArray(pending.assets) &&
            pending.assets.length > 0
          ) {
            const firstAsset = pending.assets[0];

            if (firstAsset?.uri) {
              setImageUri(firstAsset.uri);
              resetAnalysis();
              setErrorMessage('');
            }
          }
        } catch {
          // Ignore pending camera restoration errors
        }
      };

      restorePendingImage();

      return () => {
        active = false;
      };
    }, [])
  );

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setIssueType('');
    setDepartmentName('');
    setDepartmentId('');
    setSeverity('medium');
    setDescription('');
  };

  // Camera
  const pickFromCamera = async () => {
    try {
      console.log('CAMERA: requesting permission');
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        setFeedbackModal({
          visible: true,
          type: 'warning',
          title: 'Camera Permission',
          message:
            'Camera permission is required to capture campus issues.',
          primaryButton: {
            text: 'Got It',
            onPress: () => setFeedbackModal(null),
          },
        });
        return;
      }
      console.log('CAMERA: launching native camera');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });
      console.log('CAMERA: returned from native camera', result);
      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0].uri);
        resetAnalysis();
        setErrorMessage('');
      }
    } catch (err) {
      console.error('CAMERA ERROR:', err);
      console.warn('Camera error:', err);

      Alert.alert(
        'Camera Notice',
        'Could not open camera directly. You can also select a photo from your gallery.'
      );
    }
  };

  // Gallery
  const pickFromGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setFeedbackModal({
          visible: true,
          type: 'warning',
          title: 'Gallery Permission',
          message:
            'Gallery permission is required to select a photo.',
          primaryButton: {
            text: 'Got It',
            onPress: () => setFeedbackModal(null),
          },
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0].uri);
        resetAnalysis();
        setErrorMessage('');
      }
    } catch (err) {
      console.warn('Gallery error:', err);

      Alert.alert(
        'Gallery Notice',
        'Could not open the image library.'
      );
    }
  };

  // Capture GPS coordinates
  const captureGPSLocation = async (): Promise<{
    latitude: number | null;
    longitude: number | null;
  }> => {
    try {
      setLocationLoading(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        return { latitude: null, longitude: null };
      }

      const lastKnown =
        await Location.getLastKnownPositionAsync().catch(() => null);

      if (lastKnown) {
        setLatitude(lastKnown.coords.latitude);
        setLongitude(lastKnown.coords.longitude);
      }

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 5000)
      );

      const location = await Promise.race([
        locationPromise,
        timeoutPromise,
      ]);

      if (location && 'coords' in location) {
        const lat = location.coords.latitude;
        const long = location.coords.longitude;

        setLatitude(lat);
        setLongitude(long);

        return { latitude: lat, longitude: long };
      }

      if (lastKnown) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        };
      }

      return { latitude: null, longitude: null };
    } catch {
      return { latitude: null, longitude: null };
    } finally {
      setLocationLoading(false);
    }
  };

  // Analyze image using backend and Ollama
  const handleAnalyze = async () => {
    setErrorMessage('');

    if (!imageUri) {
      setErrorMessage(
        'Please capture or select an image first.'
      );
      return;
    }

    if (isAnalyzing) return;

    setIsAnalyzing(true);

    try {
      // Load department list for validating student edits
      const departmentList =
        await complaintService.getDepartments();

      setDepartments(departmentList || []);

      const gps = await captureGPSLocation();

      const result = await complaintService.analyzeComplaint({
        imageUri,
        latitude: gps.latitude ?? undefined,
        longitude: gps.longitude ?? undefined,
      });

      setAnalysisResult(result);

      const ai = result.ai_analysis as {
        issue?: string;
        issue_type?: string;
        category?: string;
        department?: string;
        description?: string;
        severity?: string;
        confidence?: number | string;
      };

      const detectedDepartment =
        ai.category ||
        ai.department ||
        'General Maintenance';

      setIssueType(ai.issue || ai.issue_type || '');
      setDepartmentName(detectedDepartment);
      setDepartmentId(result.department_id || '');
      setSeverity(
        String(ai.severity || 'medium').toLowerCase()
      );
      setDescription(ai.description || '');

    } catch (error: any) {
      console.warn('AI analysis error:', error);

      setErrorMessage(
        error?.message ||
          'Could not analyze the image. Please check your connection and try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Resolve the department ID from the editable department name
  const getSelectedDepartmentId = () => {
    const selected = departments.find((department) => {
      const name = String(
        department.name || department.department_name || ''
      );

      return (
        name.trim().toLowerCase() ===
        departmentName.trim().toLowerCase()
      );
    });

    return selected?.id || departmentId;
  };

  // Submit student-confirmed complaint
  const handleSubmit = async () => {
    setErrorMessage('');

    if (!imageUri || !analysisResult?.image_url) {
      setErrorMessage(
        'Please select an image and analyze it before submitting.'
      );
      return;
    }

    if (!issueType.trim()) {
      setErrorMessage('Please enter the issue type.');
      return;
    }

    if (!departmentName.trim()) {
      setErrorMessage('Please enter the department.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Please enter a description.');
      return;
    }

    if (!SEVERITIES.includes(severity as any)) {
      setErrorMessage('Please select a valid severity.');
      return;
    }

    const selectedDepartmentId = getSelectedDepartmentId();

    if (!selectedDepartmentId) {
      setErrorMessage(
        'The selected department could not be matched. Please choose a valid department name.'
      );
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const gps = await captureGPSLocation();

      const result = await complaintService.submitComplaint({
        image_url: analysisResult.image_url,
        department_id: selectedDepartmentId,
        issue_type: issueType.trim(),
        description: description.trim(),
        severity: severity.toLowerCase(),
        ai_analysis: analysisResult.ai_analysis,
        latitude: gps.latitude,
        longitude: gps.longitude,
      });

      // Support either a direct complaint response or wrapped response
      const complaint = result.complaint || result;

      const locationLabel =
        gps.latitude !== null && gps.longitude !== null
          ? `Lat: ${gps.latitude.toFixed(4)}, Long: ${gps.longitude.toFixed(4)}`
          : 'Campus Grounds';

      setFeedbackModal({
        visible: true,
        type: 'celebration',
        title: 'Complaint Registered! 🎉',
        message:
          'Your complaint has been submitted successfully.',
        badgeText: 'Ticket Created',
        details: [
          {
            label: 'Ticket ID',
            value: `#${String(complaint.id).slice(0, 10)}`,
            icon: 'id',
          },
          {
            label: 'Department',
            value: departmentName,
            icon: 'department',
          },
          {
            label: 'Priority',
            value: severity.toUpperCase(),
            icon: 'severity',
          },
          {
            label: 'Location Mark',
            value: locationLabel,
            icon: 'location',
          },
        ],
        primaryButton: {
          text: 'View Complaint Details',
          onPress: () => {
            setFeedbackModal(null);
            router.push(`/complaint/${complaint.id}` as any);
          },
        },
        secondaryButton: {
          text: 'Back to Dashboard',
          onPress: () => {
            setFeedbackModal(null);
            router.replace('/(student)/home');
          },
        },
      });
    } catch (error: any) {
      console.warn('Complaint submission error:', error);

      setErrorMessage(
        error?.message ||
          'Failed to submit complaint. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Report Campus Issue"
        subtitle="AI-Powered Defect Identification"
      />

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
              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Photo Proof of Issue *
            </Text>

            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />

                <View style={styles.imageActionOverlay}>
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={pickFromCamera}
                    disabled={isAnalyzing || isSubmitting}
                  >
                    <Camera size={14} color="#FFFFFF" />
                    <Text style={styles.actionPillText}>
                      Retake
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionPill, styles.removePill]}
                    onPress={() => {
                      setImageUri(null);
                      resetAnalysis();
                    }}
                    disabled={isAnalyzing || isSubmitting}
                  >
                    <Trash2 size={14} color="#FFFFFF" />
                    <Text style={styles.actionPillText}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.pickerBox}>
                <Text style={styles.pickerTitle}>
                  No photo captured yet
                </Text>

                <Text style={styles.pickerSub}>
                  Upload a clear image showing the campus fault or hazard.
                </Text>

                <View style={styles.pickerBtnRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={pickFromCamera}
                    style={styles.pickerBtn}
                    disabled={isAnalyzing || isSubmitting}
                  >
                    <Camera size={20} color={colors.primary} />
                    <Text style={styles.pickerBtnText}>
                      Use Camera
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={pickFromGallery}
                    style={[styles.pickerBtn, styles.galleryBtn]}
                    disabled={isAnalyzing || isSubmitting}
                  >
                    <ImageIcon
                      size={20}
                      color={colors.textPrimary}
                    />
                    <Text style={styles.pickerBtnTextDark}>
                      Choose Gallery
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* AI Information */}
          <View style={styles.aiInfoCard}>
            <View style={styles.aiInfoHeader}>
              <Sparkles size={18} color={colors.aiBadge} />
              <Text style={styles.aiInfoTitle}>
                AI-Powered Issue Detection
              </Text>
            </View>

            <Text style={styles.aiInfoDescription}>
              Analyze your photograph using AI. Review and edit the
              detected issue before submitting your complaint.
            </Text>
          </View>

          {/* Analyze Button */}
          <Button
            title="Analyze with AI"
            onPress={handleAnalyze}
            loading={isAnalyzing}
            disabled={!imageUri || isSubmitting}
            variant="primary"
            icon={<Sparkles size={18} color="#FFFFFF" />}
            style={styles.submitBtn}
          />

          {/* Editable AI Results */}
          {analysisResult ? (
            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <Sparkles size={18} color={colors.aiBadge} />
                <Text style={styles.analysisTitle}>
                  AI Analysis Results
                </Text>
              </View>
            <View style={styles.rawResponseBox}>
              <Text style={styles.rawResponseTitle}>
                Complete AI Response
              </Text>

              <Text selectable style={styles.rawResponseText}>
                {JSON.stringify(
                  analysisResult.ai_analysis ?? analysisResult,
                  null,
                  2
                )}
              </Text>
            </View>
              <Text style={styles.editHint}>
                Review the AI predictions. You can edit these details
                before submitting.
              </Text>

              <Text style={styles.fieldLabel}>Issue Type</Text>
              <TextInput
                value={issueType}
                onChangeText={setIssueType}
                placeholder="Enter issue type"
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>Department</Text>
              <TextInput
                value={departmentName}
                onChangeText={setDepartmentName}
                placeholder="Enter department name"
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>Severity</Text>
              <View style={styles.severityRow}>
                {SEVERITIES.map((item) => {
                  const selected =
                    severity.toLowerCase() === item;

                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setSeverity(item)}
                      style={[
                        styles.severityButton,
                        selected && styles.severityButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityButtonText,
                          selected &&
                            styles.severityButtonTextSelected,
                        ]}
                      >
                        {item.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the campus issue"
                multiline
                textAlignVertical="top"
                style={[styles.textInput, styles.descriptionInput]}
              />

              {analysisResult.ai_analysis?.confidence !== undefined ? (
                <Text style={styles.confidenceText}>
                  AI Confidence: {
                    typeof analysisResult.ai_analysis.confidence === 'number'
                      ? `${Math.round(
                          analysisResult.ai_analysis.confidence <= 1
                            ? analysisResult.ai_analysis.confidence * 100
                            : analysisResult.ai_analysis.confidence
                        )}%`
                      : String(analysisResult.ai_analysis.confidence)
                  }
                </Text>
              ) : null}

              <Button
                title="Confirm & Submit Complaint"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isAnalyzing}
                variant="primary"
                icon={
                  <CheckCircle size={18} color="#FFFFFF" />
                }
                style={styles.submitBtn}
              />
            </View>
          ) : null}

          {/* GPS Location */}
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <MapPin size={19} color={colors.primary} />

              <View style={styles.locationTextContainer}>
                <Text style={styles.locationTitle}>
                  Automatic GPS Location
                </Text>

                <Text style={styles.locationDescription}>
                  Your current coordinates will be recorded with your complaint.
                </Text>
              </View>
            </View>

            {locationLoading ? (
              <Text style={styles.locationStatus}>
                Fetching your location...
              </Text>
            ) : latitude !== null && longitude !== null ? (
              <Text style={styles.locationStatus}>
                Location detected: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </Text>
            ) : (
              <Text style={styles.locationPending}>
                GPS coordinates will be captured when needed.
              </Text>
            )}
          </View>

          <Text style={styles.footerNote}>
            Your photograph and confirmed complaint details will be
            submitted for campus complaint resolution.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {feedbackModal ? (
        <FeedbackModal
          {...feedbackModal}
          visible={Boolean(feedbackModal)}
          onClose={() => setFeedbackModal(null)}
        />
      ) : null}
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
  rawResponseBox: {
  backgroundColor: '#F8FAFC',
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radii.md,
  padding: spacing.md,
  marginBottom: spacing.md,
},

rawResponseTitle: {
  fontSize: typography.sizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.textPrimary,
  marginBottom: spacing.sm,
},

rawResponseText: {
  fontSize: typography.sizes.xs,
  color: colors.textSecondary,
  lineHeight: 20,
  fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
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
  aiInfoCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  aiInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  aiInfoTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.aiBadge,
  },
  aiInfoDescription: {
    fontSize: typography.sizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  analysisCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  analysisTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  editHint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
  },
  descriptionInput: {
    minHeight: 100,
  },
  severityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  severityButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  severityButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  severityButtonText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  severityButtonTextSelected: {
    color: '#FFFFFF',
  },
  confidenceText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.md,
  },
  locationCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  locationDescription: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  locationStatus: {
    fontSize: typography.sizes.xs,
    color: colors.success || colors.primary,
    marginTop: spacing.sm,
  },
  locationPending: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  footerNote: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.md,
  },
});
