/**
 * HistoricalSummaryCard - Collapsible summary card for historical data
 *
 * Displays a summary with icon and title, optionally expandable
 * to show full details. Used in past race phase views.
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const IOS_COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#8E8E93',
  gray: '#8E8E93',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  background: '#FFFFFF',
  cardBackground: '#FAFAFA',
};

export interface HistoricalSummaryCardProps {
  /** Icon component to display */
  icon: React.ComponentType<{ size: number; color: string }>;
  /** Icon color */
  iconColor?: string;
  /** Card title */
  title: string;
  /** Summary content (shown when collapsed) */
  summary: React.ReactNode;
  /** Detailed content (shown when expanded) */
  details?: React.ReactNode;
  /** Whether to show expand/collapse capability */
  expandable?: boolean;
  /** Initial expanded state */
  initialExpanded?: boolean;
  /** Empty state - no data captured */
  isEmpty?: boolean;
  /** Message to show when empty */
  emptyMessage?: string;
}

export function HistoricalSummaryCard({
  icon: Icon,
  iconColor = IOS_COLORS.secondaryLabel,
  title,
  summary,
  details,
  expandable = true,
  initialExpanded = false,
  isEmpty = false,
  emptyMessage = 'No data recorded',
}: HistoricalSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const handleToggle = useCallback(() => {
    if (expandable && details) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsExpanded((prev) => !prev);
    }
  }, [expandable, details]);

  const showExpander = expandable && details && !isEmpty;

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.header,
          pressed && showExpander && styles.headerPressed,
        ]}
        onPress={handleToggle}
        disabled={!showExpander}
      >
        <View style={styles.iconContainer}>
          <Icon size={18} color={iconColor} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {isEmpty ? (
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          ) : (
            <View style={styles.summaryContainer}>{summary}</View>
          )}
        </View>
        {showExpander && (
          <View style={styles.expanderIcon}>
            {isExpanded ? (
              <ChevronUp size={16} color={IOS_COLORS.gray} />
            ) : (
              <ChevronDown size={16} color={IOS_COLORS.gray} />
            )}
          </View>
        )}
      </Pressable>

      {isExpanded && details && (
        <View style={styles.detailsContainer}>{details}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  headerPressed: {
    backgroundColor: IOS_COLORS.gray6,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryContainer: {
    marginTop: 2,
  },
  emptyText: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
  expanderIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailsContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
    marginTop: 4,
    backgroundColor: IOS_COLORS.background,
  },
});

export default HistoricalSummaryCard;
