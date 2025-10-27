/**
 * DocumentViewer Component
 * PDF and image viewer with zoom/pan capabilities
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DocumentViewerProps {
  visible: boolean;
  documentName: string;
  documentType: string;
  documentUrl?: string;
  onClose: () => void;
}

export function DocumentViewer({
  visible,
  documentName,
  documentType,
  documentUrl,
  onClose,
}: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isPDF = documentType.includes('pdf');
  const isImage = documentType.includes('image');

  const handleImageLoad = () => setLoading(false);
  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons
              name={isPDF ? 'file-pdf-box' : 'file-image'}
              size={24}
              color="#3B82F6"
            />
            <Text style={styles.title} numberOfLines={1}>
              {documentName}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isPDF ? (
            <View style={styles.pdfContainer}>
              {/* TODO: Integrate react-native-pdf or WebView for PDF viewing */}
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={64}
                color="#CBD5E1"
              />
              <Text style={styles.placeholderTitle}>PDF Viewer</Text>
              <Text style={styles.placeholderText}>
                PDF viewing will be available soon.{'\n'}
                For now, documents are extracted and analyzed by AI.
              </Text>
              {documentUrl && (
                <TouchableOpacity
                  style={styles.openExternalButton}
                  onPress={() => {
                    // TODO: Open in external PDF viewer
                    console.log('Open PDF:', documentUrl);
                  }}
                >
                  <MaterialCommunityIcons
                    name="open-in-new"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.openExternalText}>Open Externally</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : isImage ? (
            <ScrollView
              maximumZoomScale={3}
              minimumZoomScale={1}
              style={styles.imageContainer}
              contentContainerStyle={styles.imageContentContainer}
            >
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Loading image...</Text>
                </View>
              )}
              {error ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={64}
                    color="#EF4444"
                  />
                  <Text style={styles.errorTitle}>Failed to load image</Text>
                  <Text style={styles.errorText}>
                    The image could not be displayed.
                  </Text>
                </View>
              ) : (
                documentUrl && (
                  <Image
                    source={{ uri: documentUrl }}
                    style={styles.image}
                    resizeMode="contain"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                )
              )}
            </ScrollView>
          ) : (
            <View style={styles.unsupportedContainer}>
              <MaterialCommunityIcons
                name="file-document"
                size={64}
                color="#CBD5E1"
              />
              <Text style={styles.unsupportedTitle}>Unsupported Format</Text>
              <Text style={styles.unsupportedText}>
                This document type cannot be previewed.
              </Text>
            </View>
          )}
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton}>
            <MaterialCommunityIcons name="share-variant" size={20} color="#3B82F6" />
            <Text style={styles.footerButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton}>
            <MaterialCommunityIcons name="download" size={20} color="#3B82F6" />
            <Text style={styles.footerButtonText}>Download</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  pdfContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  openExternalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  openExternalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  imageContainer: {
    flex: 1,
  },
  imageContentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  unsupportedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  unsupportedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  unsupportedText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
});
