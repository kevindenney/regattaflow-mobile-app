/**
 * RaceDocumentsDisplay Component
 *
 * Displays race documents grouped by source (race vs club).
 * Shows inherited club documents (SSI) separately from race-specific documents.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { RaceDisplayDocument, ClubDocumentCategory } from '@/types/documents';
import {
  getClubDocumentCategoryLabel,
  getDocumentCategoryIcon,
} from '@/types/documents';
import { DocumentViewer } from './DocumentViewer';

// iOS-style colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

interface RaceDocumentsDisplayProps {
  /** Race-specific documents */
  raceDocuments: RaceDisplayDocument[];
  /** Inherited club documents (SSI, etc.) */
  clubDocuments: RaceDisplayDocument[];
  /** Whether to show empty state when no documents */
  showEmptyState?: boolean;
  /** Compact mode for card display */
  compact?: boolean;
  /** Callback when a document is selected */
  onDocumentSelect?: (doc: RaceDisplayDocument) => void;
  /** Show upload SSI button */
  showUploadButton?: boolean;
  /** Callback when upload SSI is pressed */
  onUploadSSI?: () => void;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

/**
 * Get document type display label
 */
function getDocumentTypeLabel(doc: RaceDisplayDocument): string {
  if (doc.source === 'club' && doc.clubDocumentCategory) {
    return getClubDocumentCategoryLabel(doc.clubDocumentCategory);
  }

  // Race document types
  switch (doc.documentType) {
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
}

/**
 * Get icon for document
 */
function getIconName(doc: RaceDisplayDocument): string {
  if (doc.source === 'club' && doc.clubDocumentCategory) {
    return getDocumentCategoryIcon(doc.clubDocumentCategory);
  }
  if (doc.documentType) {
    return getDocumentCategoryIcon(doc.documentType);
  }
  return 'file-document-outline';
}

/**
 * Individual document item
 */
function DocumentItem({
  doc,
  compact,
  onPress,
}: {
  doc: RaceDisplayDocument;
  compact?: boolean;
  onPress: () => void;
}) {
  const isExternal = !!doc.externalUrl;
  const iconName = getIconName(doc);
  const typeLabel = getDocumentTypeLabel(doc);

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.compactItem,
          pressed && styles.itemPressed,
        ]}
        onPress={onPress}
      >
        <MaterialCommunityIcons
          name={iconName as any}
          size={20}
          color={doc.source === 'club' ? IOS_COLORS.purple : IOS_COLORS.blue}
        />
        <Text style={styles.compactItemTitle} numberOfLines={1}>
          {doc.title}
        </Text>
        {isExternal && (
          <MaterialCommunityIcons
            name="open-in-new"
            size={14}
            color={IOS_COLORS.gray2}
          />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.documentItem,
        pressed && styles.itemPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.itemIcon}>
        <MaterialCommunityIcons
          name={iconName as any}
          size={28}
          color={doc.source === 'club' ? IOS_COLORS.purple : IOS_COLORS.blue}
        />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {doc.title}
        </Text>
        <View style={styles.itemMeta}>
          <View
            style={[
              styles.typeBadge,
              doc.source === 'club' && styles.clubTypeBadge,
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                doc.source === 'club' && styles.clubTypeBadgeText,
              ]}
            >
              {typeLabel}
            </Text>
          </View>
          {doc.version && (
            <Text style={styles.versionText}>{doc.version}</Text>
          )}
          {doc.fileSize && (
            <Text style={styles.fileSizeText}>{formatFileSize(doc.fileSize)}</Text>
          )}
        </View>
        {doc.description && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {doc.description}
          </Text>
        )}
      </View>
      <MaterialCommunityIcons
        name={isExternal ? 'open-in-new' : 'chevron-right'}
        size={20}
        color={IOS_COLORS.gray3}
      />
    </Pressable>
  );
}

/**
 * Section header component
 */
function SectionHeader({
  title,
  count,
  collapsed,
  onToggle,
}: {
  title: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionRight}>
        <Text style={styles.sectionCount}>{count}</Text>
        <MaterialCommunityIcons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={20}
          color={IOS_COLORS.gray}
        />
      </View>
    </TouchableOpacity>
  );
}

export function RaceDocumentsDisplay({
  raceDocuments,
  clubDocuments,
  showEmptyState = true,
  compact = false,
  onDocumentSelect,
  showUploadButton = false,
  onUploadSSI,
}: RaceDocumentsDisplayProps) {
  const [raceCollapsed, setRaceCollapsed] = useState(false);
  const [clubCollapsed, setClubCollapsed] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<RaceDisplayDocument | null>(null);

  const handleDocumentPress = useCallback((doc: RaceDisplayDocument) => {
    // External URLs open in browser
    if (doc.externalUrl) {
      if (Platform.OS === 'web') {
        window.open(doc.externalUrl, '_blank');
      } else {
        Linking.openURL(doc.externalUrl);
      }
      return;
    }

    // Internal documents open in viewer
    if (doc.url) {
      setSelectedDocument(doc);
      setViewerVisible(true);
    }

    onDocumentSelect?.(doc);
  }, [onDocumentSelect]);

  const closeViewer = useCallback(() => {
    setViewerVisible(false);
    setSelectedDocument(null);
  }, []);

  const hasRaceDocuments = raceDocuments.length > 0;
  const hasClubDocuments = clubDocuments.length > 0;
  const hasAnyDocuments = hasRaceDocuments || hasClubDocuments;

  // Empty state
  if (!hasAnyDocuments && showEmptyState) {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons
          name="file-document-outline"
          size={40}
          color={IOS_COLORS.gray3}
        />
        <Text style={styles.emptyTitle}>No Documents</Text>
        <Text style={styles.emptyText}>
          Race documents and club sailing instructions will appear here.
        </Text>
      </View>
    );
  }

  if (!hasAnyDocuments) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        {/* Race Documents Section */}
        {hasRaceDocuments && (
          <View style={styles.section}>
            {!compact && (
              <SectionHeader
                title="Race Documents"
                count={raceDocuments.length}
                collapsed={raceCollapsed}
                onToggle={() => setRaceCollapsed(!raceCollapsed)}
              />
            )}
            {!raceCollapsed && (
              <View style={compact ? styles.compactList : styles.documentList}>
                {raceDocuments.map((doc) => (
                  <DocumentItem
                    key={doc.id}
                    doc={doc}
                    compact={compact}
                    onPress={() => handleDocumentPress(doc)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Club Documents Section (Inherited SSI) */}
        {hasClubDocuments && (
          <View style={styles.section}>
            {!compact && (
              <SectionHeader
                title="Club Documents"
                count={clubDocuments.length}
                collapsed={clubCollapsed}
                onToggle={() => setClubCollapsed(!clubCollapsed)}
              />
            )}
            {compact && hasRaceDocuments && (
              <View style={styles.compactDivider}>
                <Text style={styles.compactDividerText}>Club SSI</Text>
              </View>
            )}
            {!clubCollapsed && (
              <View style={compact ? styles.compactList : styles.documentList}>
                {clubDocuments.map((doc) => (
                  <DocumentItem
                    key={doc.id}
                    doc={doc}
                    compact={compact}
                    onPress={() => handleDocumentPress(doc)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Upload SSI Button */}
        {showUploadButton && onUploadSSI && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={onUploadSSI}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="file-upload-outline"
              size={20}
              color={IOS_COLORS.blue}
            />
            <Text style={styles.uploadButtonText}>Upload Sailing Instructions</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          visible={viewerVisible}
          documentName={selectedDocument.title}
          documentType={selectedDocument.fileType || 'application/pdf'}
          documentUrl={selectedDocument.url}
          onClose={closeViewer}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  documentList: {
    gap: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.gray5,
  },
  itemPressed: {
    opacity: 0.7,
    backgroundColor: IOS_COLORS.gray6,
  },
  itemIcon: {
    width: 40,
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clubTypeBadge: {
    backgroundColor: '#F3E8FF',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E40AF',
  },
  clubTypeBadgeText: {
    color: '#7C3AED',
  },
  versionText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },
  fileSizeText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },
  itemDescription: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },

  // Compact mode styles
  compactList: {
    gap: 4,
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: IOS_COLORS.gray6,
  },
  compactItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  compactDivider: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  compactDividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptyText: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    textAlign: 'center',
  },

  // Upload button
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: IOS_COLORS.blue,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
});

export default RaceDocumentsDisplay;
