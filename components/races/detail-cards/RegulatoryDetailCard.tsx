/**
 * Regulatory Detail Card
 * Expandable card showing race documents, SI, NOR, amendments
 * Collapsed: Header + document count + VHF channel
 * Expanded: Full document list with download actions
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { CARD_EXPAND_DURATION, CARD_COLLAPSE_DURATION } from '@/constants/navigationAnimations';
import { IOS_COLORS } from '@/components/cards/constants';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  raceId,
  documents = [],
  vhfChannel,
  protestDeadline,
  isExpanded = false,
  onToggle,
  onPress,
  onDocumentPress,
}: RegulatoryDetailCardProps) {
  const hasDocuments = documents.length > 0;
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  // Update rotation when isExpanded changes
  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 1 : 0, {
      duration: isExpanded ? CARD_EXPAND_DURATION : CARD_COLLAPSE_DURATION,
    });
  }, [isExpanded, rotation]);

  // Animated chevron rotation
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 90])}deg` }],
  }));

  const handlePress = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: isExpanded ? CARD_COLLAPSE_DURATION : CARD_EXPAND_DURATION,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });

    if (onToggle) {
      onToggle();
    } else if (onPress) {
      onPress();
    }
  }, [isExpanded, onToggle, onPress]);

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'sailing_instructions': return 'document-text';
      case 'nor': return 'newspaper';
      case 'amendment': return 'alert-circle';
      case 'notam': return 'warning';
      default: return 'document';
    }
  };

  const getDocumentLabel = (type: Document['type']) => {
    switch (type) {
      case 'sailing_instructions': return 'SI';
      case 'nor': return 'NOR';
      case 'amendment': return 'AMD';
      case 'notam': return 'NOTAM';
      default: return 'DOC';
    }
  };

  const getDocumentColor = (type: Document['type']) => {
    switch (type) {
      case 'amendment': return IOS_COLORS.red;
      case 'notam': return IOS_COLORS.orange;
      default: return IOS_COLORS.indigo;
    }
  };

  // Sort documents: amendments first, then SI, then NOR
  const sortedDocs = [...documents].sort((a, b) => {
    const priority = { amendment: 0, notam: 1, sailing_instructions: 2, nor: 3, other: 4 };
    return (priority[a.type] ?? 4) - (priority[b.type] ?? 4);
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header - Tufte typography-only */}
      <View style={styles.tufteHeader}>
        <Text style={styles.tufteHeaderTitle}>DOCUMENTS</Text>
        <Text style={styles.tufteHeaderSubtitle}>
          {documents.length > 0 ? `${documents.length} files` : 'Race documents'}
        </Text>
        <Animated.View style={chevronStyle}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={IOS_COLORS.gray} />
        </Animated.View>
      </View>

      {/* Content */}
      <>
        {/* Collapsed: Tufte flat typography */}
        {!isExpanded && (
          <View style={styles.tufteCollapsedContent}>
            <Text style={styles.tufteCollapsedData}>
              {[
                vhfChannel && `VHF Ch ${vhfChannel}`,
                protestDeadline && `Protest by ${protestDeadline}`,
                hasDocuments && `${documents.length} document${documents.length !== 1 ? 's' : ''}`,
              ].filter(Boolean).join(' · ') || 'No documents available'}
            </Text>
          </View>
        )}

        {/* Expanded: Tufte flat content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Key Info - Tufte flat rows */}
            {(vhfChannel || protestDeadline) && (
              <View style={styles.tufteKeyInfoGrid}>
                {vhfChannel && (
                  <View style={styles.tufteKeyInfoRow}>
                    <Text style={styles.tufteKeyInfoLabel}>VHF</Text>
                    <Text style={styles.tufteKeyInfoValue}>Channel {vhfChannel}</Text>
                  </View>
                )}
                {protestDeadline && (
                  <View style={styles.tufteKeyInfoRow}>
                    <Text style={styles.tufteKeyInfoLabel}>Protest</Text>
                    <Text style={styles.tufteKeyInfoValue}>by {protestDeadline}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Documents List - Tufte style: full names, minimal icons */}
            {hasDocuments ? (
              <View style={styles.documentsSection}>
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
                      <MaterialCommunityIcons name="download" size={16} color={IOS_COLORS.gray} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.noDocsContainer}>
                <Ionicons name="folder-open-outline" size={28} color={IOS_COLORS.gray3} />
                <Text style={styles.noDocsTitle}>No Documents</Text>
                <Text style={styles.noDocsSubtext}>Race documents will appear here when available</Text>
              </View>
            )}
          </View>
        )}
      </>
    </TouchableOpacity>
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
});
