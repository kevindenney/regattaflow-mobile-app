/**
 * RaceStartInfoBar Component
 *
 * Compact horizontal bar displaying critical race start information:
 * - Class flag indicator
 * - Start position in sequence
 * - VHF channel
 * - Number of races
 * - Start time
 *
 * Positioned near the race timer for quick reference.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Radio, Clock, Flag, Hash } from 'lucide-react-native';
import { IOS_COLORS } from '@/components/cards/constants';

/**
 * Common class flag colors used in sailing
 */
const FLAG_COLORS: Record<string, string> = {
  // Letter flags (NATO phonetic alphabet)
  'A': '#FFFFFF', // Alpha - White/Blue
  'B': '#FF0000', // Bravo - Red
  'C': '#0000FF', // Charlie - Blue/White/Red
  'D': '#FFFF00', // Delta - Yellow/Blue
  'E': '#0000FF', // Echo - Blue/Red
  'F': '#FF0000', // Foxtrot - Red/White
  'G': '#FFFF00', // Golf - Yellow/Blue
  'H': '#FF0000', // Hotel - Red/White
  'I': '#FFFF00', // India - Yellow/Black
  'J': '#0000FF', // Juliet - Blue/White
  'K': '#FFFF00', // Kilo - Yellow/Blue
  'L': '#FFFF00', // Lima - Yellow/Black
  'M': '#0000FF', // Mike - Blue/White
  'N': '#0000FF', // November - Blue/White
  'O': '#FF0000', // Oscar - Red/Yellow
  'P': '#0000FF', // Papa - Blue
  'Q': '#FFFF00', // Quebec - Yellow
  'R': '#FF0000', // Romeo - Red/Yellow
  'S': '#FFFFFF', // Sierra - White/Blue
  'T': '#FF0000', // Tango - Red/White/Blue
  'U': '#FF0000', // Uniform - Red/White
  'V': '#FF0000', // Victor - Red/White
  'W': '#0000FF', // Whiskey - Blue/Red
  'X': '#FFFFFF', // X-ray - White/Blue
  'Y': '#FFFF00', // Yankee - Yellow/Red
  'Z': '#FFFF00', // Zulu - Yellow/Blue/Red
  // Color names
  'red': '#FF3B30',
  'blue': '#007AFF',
  'yellow': '#FFCC00',
  'green': '#34C759',
  'orange': '#FF9500',
  'purple': '#AF52DE',
  'white': '#FFFFFF',
  'black': '#000000',
  // Class identifiers
  '1': '#FF3B30',  // Red
  '2': '#007AFF',  // Blue
  '3': '#FFCC00',  // Yellow
  '4': '#34C759',  // Green
  '5': '#FF9500',  // Orange
};

/**
 * Get the color for a class flag
 */
function getFlagColor(flag?: string): string {
  if (!flag) return IOS_COLORS.gray3;

  // Try exact match first (case-insensitive)
  const normalized = flag.toLowerCase().trim();
  const exactMatch = FLAG_COLORS[normalized] || FLAG_COLORS[flag.toUpperCase()];
  if (exactMatch) return exactMatch;

  // Try to extract color from string (e.g., "Class A - Blue")
  for (const [key, color] of Object.entries(FLAG_COLORS)) {
    if (normalized.includes(key.toLowerCase())) {
      return color;
    }
  }

  // Default to a neutral color
  return IOS_COLORS.gray3;
}

export interface RaceStartInfoBarProps {
  /** VHF channel number */
  vhfChannel?: string | null;
  /** Total races for the day/series */
  numberOfRaces?: number;
  /** Your class position in start sequence (1-indexed) */
  startOrder?: number;
  /** Total classes/fleets starting */
  totalFleets?: number;
  /** Class flag identifier (color, letter, or name) */
  classFlag?: string;
  /** Your planned start time */
  startTime?: string;
  /** Warning signal time */
  warningTime?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
}

export function RaceStartInfoBar({
  vhfChannel,
  numberOfRaces,
  startOrder,
  totalFleets,
  classFlag,
  startTime,
  warningTime,
  compact = false,
}: RaceStartInfoBarProps) {
  // Only render if we have at least one piece of information to show
  const hasContent = vhfChannel || numberOfRaces || (startOrder && totalFleets) || startTime || warningTime;
  if (!hasContent) return null;

  const flagColor = getFlagColor(classFlag);
  const hasStartOrderInfo = startOrder && totalFleets && totalFleets > 1;
  const displayTime = warningTime || startTime;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Class Flag + Start Order - Only show if we have start order info */}
      {hasStartOrderInfo && (
        <View style={styles.chip}>
          {classFlag && (
            <View style={[styles.flagIndicator, { backgroundColor: flagColor }]}>
              {flagColor === '#FFFFFF' && <View style={styles.flagIndicatorBorder} />}
            </View>
          )}
          <Text style={styles.chipText}>
            Start {startOrder}/{totalFleets}
          </Text>
        </View>
      )}

      {/* VHF Channel */}
      {vhfChannel && (
        <View style={[styles.chip, styles.vhfChip]}>
          <Radio size={compact ? 12 : 14} color={IOS_COLORS.purple} strokeWidth={2.5} />
          <Text style={[styles.chipText, styles.vhfText]}>Ch {vhfChannel}</Text>
        </View>
      )}

      {/* Number of Races */}
      {numberOfRaces && numberOfRaces > 0 && (
        <View style={[styles.chip, styles.raceCountChip]}>
          <Hash size={compact ? 10 : 12} color={IOS_COLORS.orange} strokeWidth={2.5} />
          <Text style={[styles.chipText, styles.raceCountText]}>
            {numberOfRaces} {numberOfRaces === 1 ? 'race' : 'races'}
          </Text>
        </View>
      )}

      {/* Start/Warning Time */}
      {displayTime && (
        <View style={[styles.chip, styles.timeChip]}>
          <Clock size={compact ? 10 : 12} color={IOS_COLORS.blue} strokeWidth={2.5} />
          <Text style={[styles.chipText, styles.timeText]}>
            {warningTime ? 'Warn' : 'Start'} {displayTime}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    marginBottom: 12,
    // Subtle inner shadow effect
    ...Platform.select({
      web: {
        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.04)',
      },
      default: {},
    }),
  },
  containerCompact: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.systemBackground,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    // Subtle shadow for chips
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  flagIndicator: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  flagIndicatorBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray3,
    borderRadius: 3,
  },
  vhfChip: {
    backgroundColor: `${IOS_COLORS.purple}08`,
  },
  vhfText: {
    color: IOS_COLORS.purple,
    fontWeight: '700',
  },
  raceCountChip: {
    backgroundColor: `${IOS_COLORS.orange}10`,
  },
  raceCountText: {
    color: IOS_COLORS.orange,
    fontWeight: '600',
  },
  timeChip: {
    backgroundColor: `${IOS_COLORS.blue}08`,
  },
  timeText: {
    color: IOS_COLORS.blue,
    fontWeight: '600',
  },
});
