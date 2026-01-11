/**
 * Marginalia - Tufte-inspired annotation component
 *
 * Coach feedback and annotations appear as marginalia directly on the data
 * they reference, just like annotations in Tufte's books. This integrates
 * communication into the data display rather than separating it.
 *
 * Design principles:
 * - Indented to show subordination to main content
 * - Uses └─ connector to visually link to parent field
 * - Subtle typography that doesn't compete with data
 * - "NEW" indicator for unread feedback (not a badge)
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
};

export interface MarginaliaProps {
  /** Author of the annotation (e.g., "Coach", "Sarah Chen") */
  author: string;
  /** The annotation content */
  comment: string;
  /** Optional date of the annotation */
  date?: Date;
  /** Whether this is unread/new */
  isNew?: boolean;
  /** Optional variant for different contexts */
  variant?: 'default' | 'compact';
}

/**
 * Format relative date for marginalia
 */
function formatMarginaliaDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Marginalia({
  author,
  comment,
  date,
  isNew = false,
  variant = 'default',
}: MarginaliaProps) {
  const isCompact = variant === 'compact';

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <Text style={[styles.connector, isCompact && styles.connectorCompact]}>└─ </Text>
      <View style={styles.content}>
        <Text style={[styles.text, isCompact && styles.textCompact]}>
          <Text style={styles.author}>{author}</Text>
          {date && <Text style={styles.date}> ({formatMarginaliaDate(date)})</Text>}
          <Text style={styles.comment}>: "{comment}"</Text>
          {isNew && <Text style={styles.newIndicator}> NEW</Text>}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginLeft: 16,
    marginTop: 4,
    paddingRight: 8,
  },
  containerCompact: {
    marginLeft: 12,
    marginTop: 2,
  },
  connector: {
    fontSize: 14,
    color: IOS_COLORS.gray3,
    fontWeight: '300',
  },
  connectorCompact: {
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: IOS_COLORS.secondaryLabel,
  },
  textCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  author: {
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  date: {
    fontWeight: '400',
    color: IOS_COLORS.gray2,
    fontStyle: 'italic',
  },
  comment: {
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  newIndicator: {
    fontSize: 10,
    fontWeight: '700',
    color: IOS_COLORS.blue,
    letterSpacing: 0.5,
  },
});

export default Marginalia;
