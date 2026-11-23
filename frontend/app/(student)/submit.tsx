import React, { useState, useCallback } from 'react';
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
import { colors, radii, spacing, typography } from '../../src/theme';

export default function SubmitComplaintScreen() {
  const router = useRouter();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Restore any pending camera result every time this screen gains focus.
  // On Android, Expo Go's JS engine can be killed while the native camera
  // activity is open (memory pressure). getPendingResultAsync() retrieves
  // the captured photo when the app resumes. Using useFocusEffect (not
  // useEffect) ensures this runs every time we come back to this screen,
  // not just on first mount.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const restorePendingImage = async () => {
        try {
          const pending = (await ImagePicker.getPendingResultAsync()) as any;
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
              setErrorMessage('');
            }
          }
        } catch (err) {
          // Not critical — ignore silently
        }
      };

      restorePendingImage();
      return () => { active = false; };
    }, [])
  );

  // Capture a photo using the camera
  const pickFromCamera = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to capture photos.'
        );
        return;
      }

      // Setting allowsEditing to false prevents Android from launching a heavy cropper activity
      // which kills Expo Go due to OS memory constraints.
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setErrorMessage('');
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      Alert.alert(
        'Camera Notice',
        'Could not open camera directly. You can also pick a photo from your gallery.'
      );
    }
  };

  // Select a photo from the gallery
  const pickFromGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission Denied',
          'Gallery permission is required to select photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setErrorMessage('');
      }
    } catch (err: any) {
      console.warn('Gallery error:', err);
      Alert.alert(
        'Gallery Notice',
        'Could not open the image library.'
      );
    }
  };

  // Capture the current GPS coordinates safely without blocking submission
  const captureGPSLocation = async (): Promise<{ latitude: number | null; longitude: number | null }> => {
    try {
      setLocationLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { latitude: null, longitude: null };
      }

      // Try fast last-known position first, then try fresh position with 5s timeout
      const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
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

      const location = await Promise.race([locationPromise, timeoutPromise]);

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

  // Submit the complaint to the backend
  const handleSubmit = async () => {
    setErrorMessage('');

    if (!imageUri) {
      setErrorMessage(
        'Please capture or select an image of the campus issue.'
      );
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const gps = await captureGPSLocation();

      const result = await complaintService.submitComplaint({
        imageUri,
        latitude: gps.latitude,
        longitude: gps.longitude,
      });

      const complaint = result.complaint;
      const severity =
        complaint.ai_analysis?.severity || complaint.severity || 'medium';

      Alert.alert(
        'Complaint Registered!',
        `Your complaint has been submitted successfully.\n\nTicket ID: ${complaint.id}\nAI-detected severity: ${String(severity).toUpperCase()}`,
        [
          {
            text: 'View Complaint',
            onPress: () =>
              router.replace(`/complaint/${complaint.id}` as any),
          },
          {
            text: 'Back to Dashboard',
            onPress: () => router.replace('/(student)/home'),
          },
        ]
      );
    } catch (error: any) {
      console.warn('Upload error:', error);
      setErrorMessage(
        error?.message || 'Failed to submit complaint. Please check your connection and try again.'
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
              <Text style={styles.errorText}>{errorMessage}</Text>
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
                    disabled={isSubmitting}
                  >
                    <Camera size={14} color="#FFFFFF" />
                    <Text style={styles.actionPillText}>Retake</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionPill, styles.removePill]}
                    onPress={() => setImageUri(null)}
                    disabled={isSubmitting}
                  >
                    <Trash2 size={14} color="#FFFFFF" />
                    <Text style={styles.actionPillText}>Remove</Text>
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
              After submission, our AI vision service will analyze
              your photograph and automatically identify the issue,
              generate its description, determine severity, and route
              to the appropriate campus department.
            </Text>
          </View>

          {/* GPS Location */}
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <MapPin size={19} color={colors.primary} />

              <View style={styles.locationTextContainer}>
                <Text style={styles.locationTitle}>
                  Automatic GPS Location
                </Text>

                <Text style={styles.locationDescription}>
                  Your current coordinates will be automatically recorded during submission.
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
                GPS coordinates will be captured when submitting.
              </Text>
            )}
          </View>

          {/* Submit Button */}
          <Button
            title="Submit Complaint"
            onPress={handleSubmit}
            loading={isSubmitting || locationLoading}
            variant="primary"
            icon={<CheckCircle size={18} color="#FFFFFF" />}
            style={styles.submitBtn}
          />

          <Text style={styles.footerNote}>
            Your photograph and coordinates will be submitted for campus complaint resolution.
          </Text>
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
