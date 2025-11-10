/**
 * Race Documents Card
 * Displays race-specific documents (sailing instructions, NOTAMs, amendments, etc.)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, Spacing } from '@/constants/designSystem';

export interface RaceDocument {
  id: string;
  name: string;
  type: 'sailing_instructions' | 'nor' | 'course_diagram' | 'amendment' | 'notam' | 'other';
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
  aiProcessed?: boolean;
  hasExtractedCourse?: boolean;
}

export interface RaceDocumentsCardProps {
  raceId: string;
  documents?: RaceDocument[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onUpload?: () => void;
  onDocumentPress?: (document: RaceDocument) => void;
  onShareWithFleet?: (documentId: string) => void;
}

const MOCK_DOCUMENTS: RaceDocument[] = [
  {
    id: '1',
    name: 'Sailing Instructions - Corinthian Series.pdf',
    type: 'sailing_instructions',
    size: 2458624,
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    aiProcessed: true,
    hasExtractedCourse: true,
  },
  {
    id: '2',
    name: 'Course Diagram - Port Shelter.jpg',
    type: 'course_diagram',
    size: 1024000,
    uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    aiProcessed: true,
    hasExtractedCourse: true,
  },
  {
    id: '3',
    name: 'Amendment No. 1.pdf',
    type: 'amendment',
    size: 256000,
    uploadedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    aiProcessed: false,
  },
];

export function RaceDocumentsCard({
  raceId,
  documents = MOCK_DOCUMENTS,
  isLoading,
  error,
  onRetry,
  onUpload,
  onDocumentPress,
  onShareWithFleet,
}: RaceDocumentsCardProps) {
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  const getDocumentIcon = (type: RaceDocument['type']) => {
    switch (type) {
      case 'sailing_instructions':
        return 'document-text';
      case 'nor':
        return 'newspaper';
      case 'course_diagram':
        return 'map';
      case 'amendment':
        return 'alert-circle';
      case 'notam':
        return 'warning';
      default:
        return 'document';
    }
  };

  const getDocumentTypeLabel = (type: RaceDocument['type']) => {
    switch (type) {
      case 'sailing_instructions':
        return 'Sailing Instructions';
      case 'nor':
        return 'Notice of Race';
      case 'course_diagram':
        return 'Course Diagram';
      case 'amendment':
        return 'Amendment';
      case 'notam':
        return 'NOTAM';
      default:
        return 'Document';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="documents" size={24} color={colors.primary[600]} />
          <Text style={styles.title}>Documents</Text>
        </View>
        <TouchableOpacity style={styles.uploadButton} onPress={onUpload}>
          <Ionicons name="cloud-upload" size={18} color={colors.primary[600]} />
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading documents…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <MaterialCommunityIcons name="alert-circle" size={28} color={colors.error[600]} />
          <Text style={styles.errorText}>{error}</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>No documents uploaded yet</Text>
          <Text style={styles.emptySubtext}>Upload sailing instructions, NOTAMs, or course diagrams</Text>
        </View>
      ) : (
        <ScrollView style={styles.documentsList} showsVerticalScrollIndicator={false}>
          {documents.map((doc) => (
            <View key={doc.id} style={styles.documentCard}>
              <TouchableOpacity
                style={styles.documentMain}
                onPress={() => onDocumentPress?.(doc)}
                activeOpacity={0.7}
              >
                <View style={styles.documentIconContainer}>
                  <Ionicons name={getDocumentIcon(doc.type)} size={28} color={colors.primary[600]} />
                  {doc.aiProcessed && (
                    <View style={styles.aiBadge}>
                      <MaterialCommunityIcons name="robot" size={12} color={colors.success[600]} />
                    </View>
                  )}
                </View>

                <View style={styles.documentInfo}>
                  <Text style={styles.documentName} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <View style={styles.documentMeta}>
                    <Text style={styles.documentType}>{getDocumentTypeLabel(doc.type)}</Text>
                    <Text style={styles.metaSeparator}>•</Text>
                    <Text style={styles.documentSize}>{formatFileSize(doc.size)}</Text>
                    <Text style={styles.metaSeparator}>•</Text>
                    <Text style={styles.documentTime}>{formatTimeAgo(doc.uploadedAt)}</Text>
                  </View>

                  {/* AI Processing Badges */}
                  {doc.aiProcessed && (
                    <View style={styles.badgeContainer}>
                      {doc.hasExtractedCourse && (
                        <View style={styles.extractedBadge}>
                          <MaterialCommunityIcons name="map-marker-check" size={12} color={colors.success[700]} />
                          <Text style={styles.extractedBadgeText}>Course Extracted</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}
                >
                  <Ionicons
                    name={expandedDocId === doc.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Expanded Actions */}
              {expandedDocId === doc.id && (
                <View style={styles.expandedActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="eye-outline" size={18} color={colors.primary[600]} />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="download-outline" size={18} color={colors.primary[600]} />
                    <Text style={styles.actionButtonText}>Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onShareWithFleet?.(doc.id)}
                  >
                    <MaterialCommunityIcons name="share-variant" size={18} color={colors.primary[600]} />
                    <Text style={styles.actionButtonText}>Share with Fleet</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  errorState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: colors.error[600],
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.error[50],
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error[700],
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  documentsList: {
    maxHeight: 400,
  },
  documentCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  documentMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  documentIconContainer: {
    position: 'relative',
    marginRight: Spacing.sm,
  },
  aiBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.success[100],
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  documentType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
  },
  metaSeparator: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  documentSize: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  documentTime: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  extractedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  extractedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success[700],
  },
  moreButton: {
    padding: Spacing.xs,
  },
  expandedActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[600],
  },
});
