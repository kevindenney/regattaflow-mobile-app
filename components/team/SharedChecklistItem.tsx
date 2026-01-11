/**
 * SharedChecklistItem
 *
 * A checklist item component for team racing that shows
 * who completed each item and when.
 */

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Check, Circle } from 'lucide-react-native';
import { TeamChecklistCompletion } from '@/types/teamRacing';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  teal: '#0D9488',
};

interface SharedChecklistItemProps {
  id: string;
  label: string;
  isCompleted: boolean;
  completion?: TeamChecklistCompletion;
  currentUserId?: string;
  onToggle: () => void;
  disabled?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Format relative time (e.g., "2m ago", "1h ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Get first name from full name
 */
function getFirstName(fullName: string): string {
  return fullName.split(' ')[0];
}

export function SharedChecklistItem({
  id,
  label,
  isCompleted,
  completion,
  currentUserId,
  onToggle,
  disabled = false,
  priority,
}: SharedChecklistItemProps) {
  const isCompletedByCurrentUser = completion?.completedBy === currentUserId;
  const completedByName = completion?.completedByName
    ? isCompletedByCurrentUser
      ? 'you'
      : getFirstName(completion.completedByName)
    : null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCompleted && styles.containerCompleted,
        disabled && styles.containerDisabled,
      ]}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Checkbox */}
      <View
        style={[
          styles.checkbox,
          isCompleted && styles.checkboxCompleted,
          priority === 'high' && !isCompleted && styles.checkboxHighPriority,
        ]}
      >
        {isCompleted ? (
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
        ) : (
          <Circle
            size={14}
            color={priority === 'high' ? IOS_COLORS.orange : IOS_COLORS.gray3}
            strokeWidth={1.5}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.label,
            isCompleted && styles.labelCompleted,
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>

        {/* Completion attribution */}
        {isCompleted && completion && (
          <View style={styles.attribution}>
            <View
              style={[
                styles.attributionDot,
                isCompletedByCurrentUser && styles.attributionDotYou,
              ]}
            />
            <Text style={styles.attributionText}>
              {completedByName}
              {completion.completedAt && (
                <Text style={styles.attributionTime}>
                  {' '}
                  {formatRelativeTime(completion.completedAt)}
                </Text>
              )}
            </Text>
          </View>
        )}
      </View>

      {/* Priority indicator */}
      {priority === 'high' && !isCompleted && (
        <View style={styles.priorityBadge}>
          <Text style={styles.priorityText}>!</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    gap: 12,
  },
  containerCompleted: {
    backgroundColor: `${IOS_COLORS.green}08`,
    borderColor: `${IOS_COLORS.green}30`,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxCompleted: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  checkboxHighPriority: {
    borderColor: IOS_COLORS.orange,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  labelCompleted: {
    color: IOS_COLORS.secondaryLabel,
  },
  attribution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attributionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.teal,
  },
  attributionDotYou: {
    backgroundColor: IOS_COLORS.blue,
  },
  attributionText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.teal,
  },
  attributionTime: {
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SharedChecklistItem;
