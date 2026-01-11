/**
 * Regulatory Detail Card
 * Expandable card showing race documents, SI, NOR, amendments
 * Collapsed: Header + document count + VHF channel
 * Expanded: Full document list with download actions
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/components/cards/constants';

interface Document {
  id: string;
  name: string;
  type: 'sailing_instructions' | 'nor' | 'amendment' | 'notam' | 'other';
  uploadedAt?: string;
}

interface RegulatoryDetailCardProps {
  raceId: string;
  documents?: Document[];
  vhfChannel?: string;
  protestDeadline?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  onDocumentPress?: (doc: Document) => void;
}

export function RegulatoryDetailCard({
  documents = [],
  vhfChannel,
  protestDeadline,
  onDocumentPress,
}: RegulatoryDetailCardProps) {
  const hasDocuments = documents.length > 0;

  // Sort documents: amendments first, then SI, then NOR
  const sortedDocs = [...documents].sort((a, b) => {
    const priority = { amendment: 0, notam: 1, sailing_instructions: 2, nor: 3, other: 4 };
    return (priority[a.type] ?? 4) - (priority[b.type] ?? 4);
  });

  // No expansion needed - all data shown directly (Tufte principle: no hidden data)
  return (
    <View style={styles.card}>
      {/* Header - Tufte typography-only */}
      <View style={styles.tufteHeader}>
        <Text style={styles.tufteHeaderTitle}>DOCUMENTS</Text>
        <Text style={styles.tufteHeaderSubtitle}>
          {documents.length > 0 ? `${documents.length} files` : 'Race documents'}
        </Text>
      </View>

      {/* Content - ALL data shown (no expansion needed) */}
      <View style={styles.tufteCollapsedContent}>
        {/* Key info summary */}
        <Text style={styles.tufteCollapsedData}>
          {[
            vhfChannel && `VHF Ch ${vhfChannel}`,
            protestDeadline && `Protest by ${protestDeadline}`,
          ].filter(Boolean).join(' · ') || ''}
        </Text>

        {/* Documents List - directly accessible */}
        {hasDocuments ? (
          <View style={styles.tufteDocumentsList}>
            {sortedDocs.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.tufteDocumentRow}
                onPress={() => onDocumentPress?.(doc)}
                activeOpacity={0.7}
              >
                <Text style={styles.tufteDocumentName} numberOfLines={1}>
                  {doc.name}
                </Text>
                {(doc.type === 'amendment' || doc.type === 'notam') && (
                  <Text style={styles.tufteDocumentAlert}>!</Text>
                )}
                <MaterialCommunityIcons name="download" size={16} color={IOS_COLORS.blue} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.tufteNoDocsText}>
            No documents available
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${IOS_COLORS.orange}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: `${IOS_COLORS.orange}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: IOS_COLORS.orange,
  },

  // Collapsed content
  collapsedContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  noDocsText: {
    fontSize: 13,
    color: IOS_COLORS.gray,
  },

  // Expanded content
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray6,
    gap: 16,
  },
  keyInfoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  keyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  keyInfoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyInfoLabel: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  keyInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  documentsSection: {
    gap: 8,
  },
  // Tufte-style documents list (no type badges, full names)
  tufteDocumentsList: {
    gap: 4,
  },
  tufteDocumentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray6,
  },
  tufteDocumentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  tufteDocumentAlert: {
    fontSize: 14,
    fontWeight: '700',
    color: IOS_COLORS.red,
    width: 16,
    textAlign: 'center',
  },
  noDocsContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  noDocsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  noDocsSubtext: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },

  // ==========================================================================
  // TUFTE STYLES - Typography-only, flat design
  // ==========================================================================
  tufteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tufteHeaderTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tufteHeaderSubtitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  tufteCollapsedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  tufteCollapsedData: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  tufteKeyInfoGrid: {
    gap: 8,
  },
  tufteKeyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tufteKeyInfoLabel: {
    width: 50,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tufteKeyInfoValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  tufteNoDocsText: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
