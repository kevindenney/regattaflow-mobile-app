/**
 * PhotoCaptureModal
 *
 * Modal for capturing sail inspection photos via camera or library.
 * Includes guidance overlays for each zone.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X, Check, RotateCcw, Info } from 'lucide-react-native';
import { SailZone } from '@/services/ai/SailAnalysisAIService';

// =============================================================================
// Types
// =============================================================================

interface PhotoCaptureModalProps {
  visible: boolean;
  zone: SailZone;
  onCapture: (photoUri: string) => void;
  onCancel: () => void;
  isAnalyzing?: boolean;
}

// =============================================================================
// Zone Guidance
// =============================================================================

const ZONE_GUIDANCE: Record<SailZone, { title: string; tips: string[] }> = {
  head: {
    title: 'Head (Top) Area',
    tips: [
      'Include the headboard and halyard attachment',
      'Show reinforcement patches clearly',
      'Capture UV-exposed areas near the top',
      'Good lighting on the upper sail',
    ],
  },
  leech: {
    title: 'Leech (Back Edge)',
    tips: [
      'Capture the full trailing edge',
      'Show leech tape and telltale patches',
      'Include any flutter damage areas',
      'Photograph against a contrasting background',
    ],
  },
  foot: {
    title: 'Foot (Bottom Edge)',
    tips: [
      'Show tack and clew corners',
      'Include reef points if present',
      'Capture outhaul area clearly',
      'Show foot tape condition',
    ],
  },
  luff: {
    title: 'Luff (Front Edge)',
    tips: [
      'Show hanks, slides, or bolt rope',
      'Include cunningham area',
      'Capture luff tape condition',
      'Show entry shape if possible',
    ],
  },
  battens: {
    title: 'Batten Pockets',
    tips: [
      'Show pocket entries clearly',
      'Include batten caps/ends',
      'Capture stitching around pockets',
      'Show any wear or chafe marks',
    ],
  },
  cloth: {
    title: 'Sail Cloth (Body)',
    tips: [
      'Show representative area of sail body',
      'Capture panel seams if visible',
      'Include any staining or discoloration',
      'Show surface texture',
    ],
  },
  overview: {
    title: 'Overview Shot',
    tips: [
      'Capture the entire sail',
      'Good overall lighting',
      'Show general condition',
      'Stand back for full view',
    ],
  },
  detail: {
    title: 'Detail Shot',
    tips: [
      'Close-up of specific area',
      'Focus on the issue or concern',
      'Good lighting on detail',
      'Steady hand for clarity',
    ],
  },
};

// =============================================================================
// Component
// =============================================================================

export function PhotoCaptureModal({
  visible,
  zone,
  onCapture,
  onCancel,
  isAnalyzing = false,
}: PhotoCaptureModalProps) {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showGuidance, setShowGuidance] = useState(true);

  const guidance = ZONE_GUIDANCE[zone];

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera access to take inspection photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestLibraryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please grant photo library access to select inspection photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleCamera = useCallback(async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setCapturedPhoto(result.assets[0].uri);
        setShowGuidance(false);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  }, []);

  const handleLibrary = useCallback(async () => {
    const hasPermission = await requestLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setCapturedPhoto(result.assets[0].uri);
        setShowGuidance(false);
      }
    } catch (error) {
      console.error('Library error:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  }, []);

  const handleRetake = useCallback(() => {
    setCapturedPhoto(null);
    setShowGuidance(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      setCapturedPhoto(null);
      setShowGuidance(true);
    }
  }, [capturedPhoto, onCapture]);

  const handleClose = useCallback(() => {
    setCapturedPhoto(null);
    setShowGuidance(true);
    onCancel();
  }, [onCancel]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>{guidance.title}</Text>
          <TouchableOpacity
            onPress={() => setShowGuidance(!showGuidance)}
            style={styles.infoButton}
          >
            <Info size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Guidance Panel */}
          {showGuidance && !capturedPhoto && (
            <View style={styles.guidancePanel}>
              <Text style={styles.guidanceTitle}>Photo Tips for {guidance.title}</Text>
              {guidance.tips.map((tip, index) => (
                <View key={index} style={styles.guidanceTip}>
                  <Text style={styles.bulletPoint}>{'\u2022'}</Text>
                  <Text style={styles.guidanceText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Photo Preview */}
          {capturedPhoto ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: capturedPhoto }}
                style={styles.previewImage}
                resizeMode="contain"
              />

              {/* Analyzing Overlay */}
              {isAnalyzing && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.analyzingText}>Analyzing photo...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <View style={styles.placeholder}>
                <Camera size={64} color="#9CA3AF" />
                <Text style={styles.placeholderText}>
                  Take or select a photo of the {zone} area
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {capturedPhoto ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.retakeButton]}
                onPress={handleRetake}
                disabled={isAnalyzing}
              >
                <RotateCcw size={20} color="#374151" />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={handleConfirm}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Check size={20} color="#fff" />
                )}
                <Text style={styles.confirmButtonText}>
                  {isAnalyzing ? 'Analyzing...' : 'Use Photo'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.cameraButton]}
                onPress={handleCamera}
              >
                <Camera size={24} color="#fff" />
                <Text style={styles.cameraButtonText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.libraryButton]}
                onPress={handleLibrary}
              >
                <ImageIcon size={24} color="#3B82F6" />
                <Text style={styles.libraryButtonText}>Library</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  infoButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  guidancePanel: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  guidanceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  guidanceTip: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#3B82F6',
    marginRight: 8,
    width: 12,
  },
  guidanceText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    alignItems: 'center',
    padding: 32,
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cameraButton: {
    backgroundColor: '#3B82F6',
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  libraryButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  libraryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  retakeButton: {
    backgroundColor: '#F3F4F6',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PhotoCaptureModal;
