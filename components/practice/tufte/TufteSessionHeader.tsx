/**
 * TufteSessionHeader
 *
 * Typography-driven header following Tufte principles:
 * - Title as visual hierarchy, not decorated badge
 * - Status, duration, date as single meta line
 * - Minimal chrome, maximum information density
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IOS_COLORS, TUFTE_TEXT } from '@/components/cards/constants';
import { PracticeStatus } from '@/types/practice';

interface TufteSessionHeaderProps {
  title: string;
  status: PracticeStatus;
  durationMinutes?: number;
  date?: string | null;
  venueName?: string | null;
  aiSuggested?: boolean;
}

const STATUS_LABELS: Record<PracticeStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function TufteSessionHeader({
  title,
  status,
  durationMinutes,
  date,
  venueName,
  aiSuggested,
}: TufteSessionHeaderProps) {
  // Format date for display
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Build meta parts
  const metaParts: string[] = [];
  metaParts.push(STATUS_LABELS[status]);
  if (durationMinutes) metaParts.push(`${durationMinutes} min`);
  if (date) {
    const formatted = formatDate(date);
    if (formatted) metaParts.push(formatted);
  }

  return (
    <View style={styles.container}>
      {/* Title - large, bold, no decoration */}
      <Text style={styles.title} numberOfLines={2}>
        {title.toUpperCase()}
      </Text>

      {/* Meta line - status · duration · date */}
      <Text style={styles.meta}>
        {metaParts.join(' · ')}
        {aiSuggested && ' · AI'}
      </Text>

      {/* Venue if present - subtle secondary info */}
      {venueName && (
        <Text style={styles.venue}>{venueName}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: TUFTE_TEXT,
    letterSpacing: 0.5,
    lineHeight: 28,
  },
  meta: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },
  venue: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
  },
});

export default TufteSessionHeader;
