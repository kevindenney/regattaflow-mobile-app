/**
 * Regulatory Detail Card
 * Compact view of sailing instructions, NOR, and amendments for the detail zone
 */

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
  onPress?: () => void;
  onDocumentPress?: (doc: Document) => void;
}

export function RegulatoryDetailCard({
  raceId,
  documents = [],
  vhfChannel,
  protestDeadline,
  onPress,
  onDocumentPress,
}: RegulatoryDetailCardProps) {
  const hasDocuments = documents.length > 0;
  const hasInfo = hasDocuments || vhfChannel || protestDeadline;

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'sailing_instructions':
        return 'document-text';
      case 'nor':
        return 'newspaper';
      case 'amendment':
        return 'alert-circle';
      case 'notam':
        return 'warning';
      default:
        return 'document';
    }
  };

  const getDocumentLabel = (type: Document['type']) => {
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
  };

  // Sort documents: amendments first (most important for race day), then SI, then NOR
  const sortedDocs = [...documents].sort((a, b) => {
    const priority = { amendment: 0, notam: 1, sailing_instructions: 2, nor: 3, other: 4 };
    return (priority[a.type] ?? 4) - (priority[b.type] ?? 4);
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="documents" size={18} color="#F59E0B" />
        </View>
        <Text style={styles.headerTitle}>Race Documents</Text>
        {documents.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{documents.length}</Text>
          </View>
        )}
        <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
      </View>

      <View style={styles.content}>
        {/* Key Info Row */}
        {(vhfChannel || protestDeadline) && (
          <View style={styles.infoRow}>
            {vhfChannel && (
              <View style={styles.infoChip}>
                <MaterialCommunityIcons name="radio" size={12} color="#DC2626" />
                <Text style={styles.infoChipText}>VHF {vhfChannel}</Text>
              </View>
            )}
            {protestDeadline && (
              <View style={styles.infoChip}>
                <Ionicons name="time" size={12} color="#7C3AED" />
                <Text style={styles.infoChipText}>Protest: {protestDeadline}</Text>
              </View>
            )}
          </View>
        )}

        {/* Documents List */}
        {hasDocuments ? (
          <View style={styles.documentsList}>
            {sortedDocs.slice(0, 3).map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.documentRow}
                onPress={() => onDocumentPress?.(doc)}
                activeOpacity={0.7}
              >
                <Ionicons name={getDocumentIcon(doc.type)} size={16} color="#64748B" />
                <View style={styles.docTypeBadge}>
                  <Text style={styles.docTypeText}>{getDocumentLabel(doc.type)}</Text>
                </View>
                <Text style={styles.documentName} numberOfLines={1}>
                  {doc.name}
                </Text>
              </TouchableOpacity>
            ))}
            {documents.length > 3 && (
              <Text style={styles.moreText}>+{documents.length - 3} more documents</Text>
            )}
          </View>
        ) : (
          <View style={styles.emptyDocs}>
            <Ionicons name="folder-open-outline" size={24} color="#CBD5E1" />
            <Text style={styles.emptyText}>No documents uploaded</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  content: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  documentsList: {
    gap: 6,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  docTypeBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  docTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  documentName: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
  },
  moreText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginLeft: 52,
  },
  emptyDocs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
