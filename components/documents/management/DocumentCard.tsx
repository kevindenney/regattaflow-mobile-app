/**
 * DocumentCard Component
 *
 * Card displaying a single race source document with status,
 * extraction info, and actions.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import {
  FileText,
  ScrollText,
  FilePlus,
  FileStack,
  Map,
  File,
  Link,
  ClipboardPaste,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreVertical,
  ExternalLink,
  Trash2,
  Share2,
} from 'lucide-react-native';
import { format } from 'date-fns';
import type { RaceSourceDocument, DocumentType, ExtractionStatus } from '@/services/UnifiedDocumentService';
import { IOS_COLORS } from '@/components/cards/constants';

interface DocumentCardProps {
  document: RaceSourceDocument;
  onPress?: () => void;
  onDelete?: () => void;
  onToggleShare?: () => void;
  onViewSource?: () => void;
  showActions?: boolean;
}

const DOCUMENT_TYPE_ICONS: Record<DocumentType, React.ReactNode> = {
  nor: <FileText size={20} color="#3B82F6" />,
  si: <ScrollText size={20} color="#8B5CF6" />,
  amendment: <FilePlus size={20} color="#F59E0B" />,
  appendix: <FileStack size={20} color="#6B7280" />,
  course_diagram: <Map size={20} color="#10B981" />,
  other: <File size={20} color="#6B7280" />,
};

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  nor: 'Notice of Race',
  si: 'Sailing Instructions',
  amendment: 'Amendment',
  appendix: 'Appendix',
  course_diagram: 'Course Diagram',
  other: 'Document',
};

const SOURCE_TYPE_ICONS: Record<string, React.ReactNode> = {
  url: <Link size={12} color="#6B7280" />,
  paste: <ClipboardPaste size={12} color="#6B7280" />,
  upload: <Upload size={12} color="#6B7280" />,
};

function getStatusIndicator(status: ExtractionStatus) {
  switch (status) {
    case 'pending':
      return <Clock size={14} color="#F59E0B" />;
    case 'processing':
      return <ActivityIndicator size="small" color="#3B82F6" />;
    case 'completed':
      return <CheckCircle size={14} color="#10B981" />;
    case 'failed':
      return <AlertCircle size={14} color="#EF4444" />;
    default:
      return null;
  }
}

function getStatusLabel(status: ExtractionStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Extracting...';
    case 'completed':
      return 'Extracted';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

export function DocumentCard({
  document,
  onPress,
  onDelete,
  onToggleShare,
  onViewSource,
  showActions = true,
}: DocumentCardProps) {
  const typeIcon = DOCUMENT_TYPE_ICONS[document.documentType] || DOCUMENT_TYPE_ICONS.other;
  const typeLabel = DOCUMENT_TYPE_LABELS[document.documentType] || 'Document';
  const sourceIcon = SOURCE_TYPE_ICONS[document.sourceType] || SOURCE_TYPE_ICONS.url;

  const extractedFieldCount = document.contributedFields?.length || 0;

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Left: Icon */}
      <View style={styles.iconContainer}>
        {typeIcon}
      </View>

      {/* Center: Info */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {document.title}
          </Text>
          {document.versionNumber > 1 && (
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v{document.versionNumber}</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{typeLabel}</Text>
          </View>

          <View style={styles.sourceIndicator}>
            {sourceIcon}
            <Text style={styles.sourceText}>
              {document.sourceType === 'url' ? 'URL' : document.sourceType === 'paste' ? 'Pasted' : 'Uploaded'}
            </Text>
          </View>

          <View style={styles.statusIndicator}>
            {getStatusIndicator(document.extractionStatus)}
            <Text style={[
              styles.statusText,
              document.extractionStatus === 'failed' && styles.statusTextError,
              document.extractionStatus === 'completed' && styles.statusTextSuccess,
            ]}>
              {getStatusLabel(document.extractionStatus)}
            </Text>
          </View>
        </View>

        {document.extractionStatus === 'completed' && extractedFieldCount > 0 && (
          <Text style={styles.extractedCount}>
            {extractedFieldCount} fields extracted
          </Text>
        )}

        {document.extractionStatus === 'failed' && document.extractionError && (
          <Text style={styles.errorText} numberOfLines={1}>
            {document.extractionError}
          </Text>
        )}

        <Text style={styles.dateText}>
          Added {format(new Date(document.createdAt), 'MMM d, yyyy')}
        </Text>
      </View>

      {/* Right: Actions */}
      {showActions && (
        <View style={styles.actions}>
          {document.isShared && (
            <View style={styles.sharedBadge}>
              <Share2 size={10} color="#3B82F6" />
            </View>
          )}

          {document.sourceUrl && onViewSource && (
            <Pressable
              style={styles.actionButton}
              onPress={onViewSource}
              hitSlop={8}
            >
              <ExternalLink size={16} color="#6B7280" />
            </Pressable>
          )}

          {onDelete && (
            <Pressable
              style={styles.actionButton}
              onPress={onDelete}
              hitSlop={8}
            >
              <Trash2 size={16} color="#EF4444" />
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  versionBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  sourceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#6B7280',
  },
  statusTextError: {
    color: '#EF4444',
  },
  statusTextSuccess: {
    color: '#10B981',
  },
  extractedCount: {
    fontSize: 12,
    color: '#10B981',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  sharedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    padding: 4,
  },
});

export default DocumentCard;
