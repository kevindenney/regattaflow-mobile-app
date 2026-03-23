/**
 * PersonPill — Smart people pill for brain dump with profile linking and disambiguation.
 *
 * States:
 * - resolving: shimmer/loading indicator while searching
 * - exact: linked to a platform user, shows avatar + full name
 * - ambiguous: multiple matches found, tap to pick from dropdown
 * - unmatched: no platform user found, shown as plain text
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';
import type { ResolvedPerson, ResolvedMatch } from '@/hooks/usePeopleResolver';

interface PersonPillProps {
  person: ResolvedPerson;
  onSelect: (rawName: string, match: ResolvedMatch) => void;
  onDismiss: (rawName: string) => void;
}

export function PersonPill({ person, onSelect, onDismiss }: PersonPillProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handlePillPress = useCallback(() => {
    if (person.status === 'ambiguous') {
      setShowPicker((prev) => !prev);
    }
  }, [person.status]);

  const handleSelectCandidate = useCallback(
    (match: ResolvedMatch) => {
      onSelect(person.raw_name, match);
      setShowPicker(false);
    },
    [person.raw_name, onSelect]
  );

  const handleDismiss = useCallback(() => {
    onDismiss(person.raw_name);
    setShowPicker(false);
  }, [person.raw_name, onDismiss]);

  // --- Resolving state ---
  if (person.status === 'resolving') {
    return (
      <View style={[styles.pill, styles.pillResolving]}>
        <ActivityIndicator size={10} color={STEP_COLORS.tertiaryLabel} />
        <Text style={styles.textResolving}>{person.raw_name}</Text>
      </View>
    );
  }

  // --- Exact match (linked) ---
  if (person.status === 'exact' && person.match) {
    return (
      <View style={[styles.pill, styles.pillLinked]}>
        <View
          style={[
            styles.miniAvatar,
            { backgroundColor: person.match.avatar_color || IOS_COLORS.systemGray5 },
          ]}
        >
          {person.match.avatar_emoji ? (
            <Text style={styles.miniAvatarEmoji}>{person.match.avatar_emoji}</Text>
          ) : (
            <Ionicons name="person" size={10} color="#FFFFFF" />
          )}
        </View>
        <Text style={styles.textLinked} numberOfLines={1}>
          {person.match.display_name}
        </Text>
        <Ionicons name="checkmark-circle" size={14} color={STEP_COLORS.accent} />
      </View>
    );
  }

  // --- Ambiguous (multiple matches) ---
  if (person.status === 'ambiguous' && person.candidates) {
    return (
      <View style={styles.ambiguousContainer}>
        <Pressable
          style={[styles.pill, styles.pillAmbiguous]}
          onPress={handlePillPress}
        >
          <Ionicons name="people" size={12} color={IOS_COLORS.systemOrange} />
          <Text style={styles.textAmbiguous}>{person.raw_name}</Text>
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>
              {person.candidates.length}
            </Text>
          </View>
          <Ionicons
            name={showPicker ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={IOS_COLORS.systemOrange}
          />
        </Pressable>

        {showPicker && (
          <View style={styles.dropdown}>
            <Text style={styles.dropdownLabel}>Which {person.raw_name}?</Text>
            {person.candidates.map((candidate) => (
              <Pressable
                key={candidate.user_id}
                style={styles.candidateRow}
                onPress={() => handleSelectCandidate(candidate)}
              >
                <View
                  style={[
                    styles.candidateAvatar,
                    { backgroundColor: candidate.avatar_color || IOS_COLORS.systemGray5 },
                  ]}
                >
                  {candidate.avatar_emoji ? (
                    <Text style={styles.candidateAvatarEmoji}>
                      {candidate.avatar_emoji}
                    </Text>
                  ) : (
                    <Ionicons name="person" size={14} color={IOS_COLORS.systemGray2} />
                  )}
                </View>
                <Text style={styles.candidateName} numberOfLines={1}>
                  {candidate.display_name}
                </Text>
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={STEP_COLORS.accent}
                />
              </Pressable>
            ))}
            <Pressable style={styles.keepPlainRow} onPress={handleDismiss}>
              <Ionicons
                name="person-outline"
                size={14}
                color={IOS_COLORS.tertiaryLabel}
              />
              <Text style={styles.keepPlainText}>
                Keep as "{person.raw_name}" (not on BetterAt)
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  // --- Unmatched (plain text) ---
  return (
    <View style={[styles.pill, styles.pillUnmatched]}>
      <Ionicons name="person" size={12} color={STEP_COLORS.accent} />
      <Text style={styles.textUnmatched}>{person.raw_name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillResolving: {
    backgroundColor: IOS_COLORS.systemGray6,
  },
  textResolving: {
    fontSize: 13,
    fontWeight: '500',
    color: STEP_COLORS.tertiaryLabel,
  },
  pillLinked: {
    backgroundColor: STEP_COLORS.accentLight,
  },
  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarEmoji: {
    fontSize: 10,
  },
  textLinked: {
    fontSize: 13,
    fontWeight: '600',
    color: STEP_COLORS.accent,
    maxWidth: 140,
  },
  pillAmbiguous: {
    backgroundColor: 'rgba(255,149,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,149,0,0.25)',
  },
  textAmbiguous: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.systemOrange,
  },
  matchBadge: {
    backgroundColor: IOS_COLORS.systemOrange,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ambiguousContainer: {
    position: 'relative',
  },
  dropdown: {
    marginTop: 4,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray4,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
      },
    }),
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: 0.3,
    paddingHorizontal: IOS_SPACING.sm,
    paddingTop: IOS_SPACING.sm,
    paddingBottom: 4,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: IOS_SPACING.sm,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.systemGray5,
  },
  candidateAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateAvatarEmoji: {
    fontSize: 14,
  },
  candidateName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  keepPlainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: IOS_SPACING.sm,
  },
  keepPlainText: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
  },
  pillUnmatched: {
    backgroundColor: STEP_COLORS.accentLight,
  },
  textUnmatched: {
    fontSize: 13,
    fontWeight: '600',
    color: STEP_COLORS.accent,
  },
});
