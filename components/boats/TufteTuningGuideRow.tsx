/**
 * TufteTuningGuideRow
 *
 * Dense tuning guide row with extraction status dot and wind range tags.
 * Follows Tufte principles: data-dense, minimal chrome, typography-driven.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { IOS_COLORS } from '@/components/cards/constants';

type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed' | null;

interface TufteTuningGuideRowProps {
  title: string;
  source: string;
  year?: number;
  extractionStatus: ExtractionStatus;
  tags?: string[];
  isFleet?: boolean;
  sharedBy?: string;
  isExtracting?: boolean;
  onPress?: () => void;
  onExtract?: () => void;
  isLast?: boolean;
}

export function TufteTuningGuideRow({
  title,
  source,
  year,
  extractionStatus,
  tags = [],
  isFleet = false,
  sharedBy,
  isExtracting = false,
  onPress,
  onExtract,
  isLast = false,
}: TufteTuningGuideRowProps) {
  const isExtracted = extractionStatus === 'completed';
  const canExtract = extractionStatus !== 'completed' && !isExtracting;

  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={styles.content}>
        {/* Title and source */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {year && <Text style={styles.year}>{year}</Text>}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.source}>{source}</Text>
          {isFleet && sharedBy && (
            <Text style={styles.sharedBy}>· via {sharedBy}</Text>
          )}
        </View>

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.slice(0, 3).map((tag, idx) => (
              <Text key={idx} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Status / Action */}
      <View style={styles.statusArea}>
        {isExtracting ? (
          <ActivityIndicator size="small" color={IOS_COLORS.blue} />
        ) : isExtracted ? (
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, styles.statusDotExtracted]} />
            <Text style={styles.statusText}>extracted</Text>
          </View>
        ) : canExtract && onExtract ? (
          <TouchableOpacity
            style={styles.extractButton}
            onPress={(e) => {
              e.stopPropagation?.();
              onExtract();
            }}
          >
            <Text style={styles.extractButtonText}>Extract</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, styles.statusDotPending]} />
            <Text style={styles.statusText}>pending</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 56,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    flex: 1,
  },
  year: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  source: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  sharedBy: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusArea: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotExtracted: {
    backgroundColor: IOS_COLORS.green,
  },
  statusDotPending: {
    backgroundColor: IOS_COLORS.gray,
  },
  statusText: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  extractButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: IOS_COLORS.blue,
  },
  extractButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
