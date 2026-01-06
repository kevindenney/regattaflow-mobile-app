/**
 * RegulatoryCard - Position 4
 *
 * Full-card display of race documents and regulatory info:
 * - Sailing Instructions (SI)
 * - Notice of Race (NOR)
 * - Amendments
 * - VHF channel
 * - Protest deadline
 *
 * This card helps sailors access important race documents.
 */

import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import {
  FileText,
  Radio,
  Clock,
  AlertCircle,
  AlertTriangle,
  Newspaper,
  File,
  FolderOpen,
  Download,
  ExternalLink,
} from 'lucide-react-native';

import { CardContentProps } from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface Document {
  id: string;
  name: string;
  type: 'sailing_instructions' | 'nor' | 'amendment' | 'notam' | 'other';
  uploadedAt?: string;
  url?: string;
}

interface RegulatoryData {
  documents?: Document[];
  vhfChannel?: string;
  protestDeadline?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get icon for document type
 */
function getDocumentIcon(type: Document['type']): typeof FileText {
  switch (type) {
    case 'sailing_instructions':
      return FileText;
    case 'nor':
      return Newspaper;
    case 'amendment':
      return AlertCircle;
    case 'notam':
      return AlertTriangle;
    default:
      return File;
  }
}

/**
 * Get label for document type
 */
function getDocumentLabel(type: Document['type']): string {
  switch (type) {
    case 'sailing_instructions':
      return 'Sailing Instructions';
    case 'nor':
      return 'Notice of Race';
    case 'amendment':
      return 'Amendment';
    case 'notam':
      return 'NOTAM';
    default:
      return 'Document';
  }
}

/**
 * Get short label for document type
 */
function getDocumentShortLabel(type: Document['type']): string {
  switch (type) {
    case 'sailing_instructions':
      return 'SI';
    case 'nor':
      return 'NOR';
    case 'amendment':
      return 'AMD';
    case 'notam':
      return 'NOTAM';
    default:
      return 'DOC';
  }
}

/**
 * Get color for document type
 */
function getDocumentColor(type: Document['type']): { bg: string; text: string; icon: string } {
  switch (type) {
    case 'sailing_instructions':
      return { bg: '#DBEAFE', text: '#1E40AF', icon: '#3B82F6' };
    case 'nor':
      return { bg: '#D1FAE5', text: '#065F46', icon: '#10B981' };
    case 'amendment':
      return { bg: '#FEE2E2', text: '#991B1B', icon: '#EF4444' };
    case 'notam':
      return { bg: '#FEF3C7', text: '#92400E', icon: '#F59E0B' };
    default:
      return { bg: '#F3F4F6', text: '#374151', icon: '#6B7280' };
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RegulatoryCard({
  race,
  cardType,
  isActive,
  dimensions,
}: CardContentProps) {
  // Extract regulatory data from race
  const regulatoryData: RegulatoryData = (race as any).regulatory || {};
  const vhfChannel = regulatoryData.vhfChannel || race.vhf_channel;
  const { documents = [], protestDeadline } = regulatoryData;

  const hasDocuments = documents.length > 0;
  const hasInfo = hasDocuments || vhfChannel || protestDeadline;

  // Sort documents: amendments first (most important for race day), then SI, then NOR
  const sortedDocs = [...documents].sort((a, b) => {
    const priority = { amendment: 0, notam: 1, sailing_instructions: 2, nor: 3, other: 4 };
    return (priority[a.type] ?? 4) - (priority[b.type] ?? 4);
  });

  // Separate critical updates from regular documents
  const criticalDocs = sortedDocs.filter(d => d.type === 'amendment' || d.type === 'notam');
  const regularDocs = sortedDocs.filter(d => d.type !== 'amendment' && d.type !== 'notam');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <FileText size={24} color="#F59E0B" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Documents</Text>
          <Text style={styles.subtitle}>Race documents & info</Text>
        </View>
        {documents.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{documents.length}</Text>
          </View>
        )}
      </View>

      {hasInfo ? (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Info Row */}
          {(vhfChannel || protestDeadline) && (
            <View style={styles.quickInfoRow}>
              {vhfChannel && (
                <View style={styles.quickInfoCard}>
                  <Radio size={20} color="#DC2626" />
                  <View style={styles.quickInfoContent}>
                    <Text style={styles.quickInfoLabel}>VHF Channel</Text>
                    <Text style={styles.quickInfoValue}>{vhfChannel}</Text>
                  </View>
                </View>
              )}
              {protestDeadline && (
                <View style={styles.quickInfoCard}>
                  <Clock size={20} color="#7C3AED" />
                  <View style={styles.quickInfoContent}>
                    <Text style={styles.quickInfoLabel}>Protest Deadline</Text>
                    <Text style={styles.quickInfoValue}>{protestDeadline}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Critical Updates */}
          {criticalDocs.length > 0 && (
            <View style={styles.documentsSection}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={16} color="#F59E0B" />
                <Text style={styles.sectionTitle}>Critical Updates</Text>
              </View>
              <View style={styles.documentsList}>
                {criticalDocs.map((doc) => {
                  const colors = getDocumentColor(doc.type);
                  const Icon = getDocumentIcon(doc.type);
                  return (
                    <TouchableOpacity key={doc.id} style={styles.documentCard}>
                      <View style={[styles.documentIcon, { backgroundColor: colors.bg }]}>
                        <Icon size={20} color={colors.icon} />
                      </View>
                      <View style={styles.documentContent}>
                        <View style={[styles.typeBadge, { backgroundColor: colors.bg }]}>
                          <Text style={[styles.typeText, { color: colors.text }]}>
                            {getDocumentShortLabel(doc.type)}
                          </Text>
                        </View>
                        <Text style={styles.documentName} numberOfLines={2}>
                          {doc.name}
                        </Text>
                        {doc.uploadedAt && (
                          <Text style={styles.documentDate}>
                            Updated: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      <ExternalLink size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Race Documents */}
          {regularDocs.length > 0 && (
            <View style={styles.documentsSection}>
              <Text style={styles.sectionTitleSimple}>Race Documents</Text>
              <View style={styles.documentsList}>
                {regularDocs.map((doc) => {
                  const colors = getDocumentColor(doc.type);
                  const Icon = getDocumentIcon(doc.type);
                  return (
                    <TouchableOpacity key={doc.id} style={styles.documentCard}>
                      <View style={[styles.documentIcon, { backgroundColor: colors.bg }]}>
                        <Icon size={20} color={colors.icon} />
                      </View>
                      <View style={styles.documentContent}>
                        <View style={[styles.typeBadge, { backgroundColor: colors.bg }]}>
                          <Text style={[styles.typeText, { color: colors.text }]}>
                            {getDocumentShortLabel(doc.type)}
                          </Text>
                        </View>
                        <Text style={styles.documentName} numberOfLines={2}>
                          {doc.name}
                        </Text>
                      </View>
                      <ExternalLink size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <FolderOpen size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No Documents</Text>
          <Text style={styles.emptyText}>
            Race documents like Sailing Instructions and Notice of Race will appear here
          </Text>
        </View>
      )}

      {/* Swipe indicator */}
      <View style={styles.swipeHint}>
        <View style={styles.swipeIndicator} />
      </View>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D97706',
  },

  // Scroll
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
    gap: 20,
  },

  // Quick Info Row
  quickInfoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickInfoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  quickInfoContent: {
    flex: 1,
  },
  quickInfoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },

  // Documents Section
  documentsSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleSimple: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  documentsList: {
    gap: 10,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentContent: {
    flex: 1,
    gap: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  documentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Swipe hint
  swipeHint: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
});

export default RegulatoryCard;
