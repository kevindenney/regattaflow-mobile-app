/**
 * RaceDetailHeader Component
 *
 * Header for race detail zones with race info and management actions.
 * Shows race name, venue, date, and provides Edit button + More menu.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { CardMenu, type CardMenuItem } from '@/components/shared/CardMenu';
import { IOS_COLORS } from '@/components/cards/constants';

export interface RaceDetailHeaderProps {
  /** Race name/title */
  name: string;
  /** Venue name */
  venue?: string;
  /** Club name */
  clubName?: string;
  /** Race date (ISO string) */
  date?: string;
  /** Race start time */
  startTime?: string;
  /** Callback when edit is requested */
  onEdit?: () => void;
  /** Callback when delete is requested */
  onDelete?: () => void;
  /** Callback when duplicate is requested */
  onDuplicate?: () => void;
  /** Whether to show management actions (only for race owner) */
  canManage?: boolean;
}

export function RaceDetailHeader({
  name,
  venue,
  clubName,
  date,
  startTime,
  onEdit,
  onDelete,
  onDuplicate,
  canManage = false,
}: RaceDetailHeaderProps) {
  // Format date nicely
  const formattedDate = useMemo(() => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [date]);

  // Build subtitle parts
  const subtitleParts = useMemo(() => {
    const parts: string[] = [];
    if (clubName) parts.push(clubName);
    if (venue) parts.push(venue);
    if (formattedDate) {
      const datePart = startTime ? `${formattedDate} · ${startTime}` : formattedDate;
      parts.push(datePart);
    }
    return parts.join(' · ');
  }, [clubName, venue, formattedDate, startTime]);

  // Build menu items for secondary actions
  const menuItems = useMemo((): CardMenuItem[] => {
    const items: CardMenuItem[] = [];
    if (onDuplicate) {
      items.push({ label: 'Duplicate Race', icon: 'copy-outline', onPress: onDuplicate });
    }
    if (onDelete) {
      items.push({ label: 'Delete Race', icon: 'trash-outline', onPress: onDelete, variant: 'destructive' });
    }
    return items;
  }, [onDuplicate, onDelete]);

  const showActions = canManage && (onEdit || menuItems.length > 0);

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {name}
        </Text>
        {subtitleParts && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitleParts}
          </Text>
        )}
      </View>

      {showActions && (
        <View style={styles.actionsContainer}>
          {/* Primary Edit Button */}
          {onEdit && (
            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.editButtonPressed,
              ]}
              onPress={onEdit}
              accessibilityRole="button"
              accessibilityLabel="Edit race"
            >
              <Pencil size={14} color={IOS_COLORS.blue} strokeWidth={2.5} />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          )}

          {/* Secondary Actions Menu */}
          {menuItems.length > 0 && (
            <CardMenu items={menuItems} iconSize={20} iconColor={IOS_COLORS.gray} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${IOS_COLORS.blue}15`,
    borderRadius: 16,
  },
  editButtonPressed: {
    opacity: 0.7,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
});

export default RaceDetailHeader;
