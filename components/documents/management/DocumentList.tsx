/**
 * DocumentList Component
 *
 * List of race source documents with grouping by type.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FileText } from 'lucide-react-native';
import { DocumentCard } from './DocumentCard';
import type { RaceSourceDocument, DocumentType } from '@/services/UnifiedDocumentService';

interface DocumentListProps {
  documents: RaceSourceDocument[];
  onDocumentPress?: (document: RaceSourceDocument) => void;
  onDocumentDelete?: (document: RaceSourceDocument) => void;
  onToggleShare?: (document: RaceSourceDocument) => void;
  onViewSource?: (document: RaceSourceDocument) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  groupByType?: boolean;
  emptyMessage?: string;
}

interface GroupedDocuments {
  type: DocumentType;
  label: string;
  documents: RaceSourceDocument[];
}

const TYPE_ORDER: DocumentType[] = ['nor', 'si', 'amendment', 'appendix', 'course_diagram', 'other'];

const TYPE_LABELS: Record<DocumentType, string> = {
  nor: 'Notice of Race',
  si: 'Sailing Instructions',
  amendment: 'Amendments',
  appendix: 'Appendices',
  course_diagram: 'Course Diagrams',
  other: 'Other Documents',
};

export function DocumentList({
  documents,
  onDocumentPress,
  onDocumentDelete,
  onToggleShare,
  onViewSource,
  isLoading = false,
  onRefresh,
  groupByType = true,
  emptyMessage = 'No documents yet',
}: DocumentListProps) {
  // Group documents by type
  const groupedData = useMemo(() => {
    if (!groupByType) {
      return null;
    }

    const groups = new Map<DocumentType, RaceSourceDocument[]>();

    for (const doc of documents) {
      const existing = groups.get(doc.documentType) || [];
      groups.set(doc.documentType, [...existing, doc]);
    }

    const result: GroupedDocuments[] = [];
    for (const type of TYPE_ORDER) {
      const docs = groups.get(type);
      if (docs && docs.length > 0) {
        result.push({
          type,
          label: TYPE_LABELS[type],
          documents: docs.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
        });
      }
    }

    return result;
  }, [documents, groupByType]);

  // Empty state
  if (documents.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <FileText size={32} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        <Text style={styles.emptySubtext}>
          Add documents to track NOR, SI, amendments, and more
        </Text>
      </View>
    );
  }

  // Flat list (no grouping)
  if (!groupByType) {
    return (
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DocumentCard
            document={item}
            onPress={onDocumentPress ? () => onDocumentPress(item) : undefined}
            onDelete={onDocumentDelete ? () => onDocumentDelete(item) : undefined}
            onToggleShare={onToggleShare ? () => onToggleShare(item) : undefined}
            onViewSource={onViewSource && item.sourceUrl ? () => onViewSource(item) : undefined}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
          ) : undefined
        }
      />
    );
  }

  // Grouped list
  return (
    <FlatList
      data={groupedData}
      keyExtractor={(item) => item.type}
      renderItem={({ item: group }) => (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{group.label}</Text>
          {group.documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onPress={onDocumentPress ? () => onDocumentPress(doc) : undefined}
              onDelete={onDocumentDelete ? () => onDocumentDelete(doc) : undefined}
              onToggleShare={onToggleShare ? () => onToggleShare(doc) : undefined}
              onViewSource={onViewSource && doc.sourceUrl ? () => onViewSource(doc) : undefined}
            />
          ))}
        </View>
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  group: {
    marginBottom: 24,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default DocumentList;
