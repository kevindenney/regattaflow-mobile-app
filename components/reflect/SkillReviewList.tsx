/**
 * SkillReviewList — Review extracted skills before importing.
 *
 * Shows skills grouped by category with checkboxes.
 * Already-existing skills are marked and deselected.
 * Titles are editable on tap.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import type { ExtractedSkill } from '@/services/ai/SkillExtractionService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReviewableSkill extends ExtractedSkill {
  /** Unique key for list identity */
  key: string;
  /** Whether the user has selected this skill for import */
  selected: boolean;
  /** Whether this skill already exists in the user's goals */
  alreadyExists: boolean;
}

interface SkillReviewListProps {
  skills: ReviewableSkill[];
  sourceSummary?: string;
  onToggle: (key: string) => void;
  onToggleAll: () => void;
  onEditTitle: (key: string, newTitle: string) => void;
}

// ---------------------------------------------------------------------------
// Skill Row
// ---------------------------------------------------------------------------

function SkillRow({
  skill,
  onToggle,
  onEditTitle,
}: {
  skill: ReviewableSkill;
  onToggle: () => void;
  onEditTitle: (newTitle: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(skill.title);

  const handleCommitEdit = useCallback(() => {
    setEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== skill.title) {
      onEditTitle(trimmed);
    } else {
      setEditValue(skill.title);
    }
  }, [editValue, skill.title, onEditTitle]);

  const disabled = skill.alreadyExists;

  return (
    <Pressable
      style={[styles.skillRow, disabled && styles.skillRowDisabled]}
      onPress={disabled ? undefined : onToggle}
    >
      {/* Checkbox */}
      <View style={styles.checkBox}>
        {disabled ? (
          <Ionicons name="checkmark-circle" size={22} color={IOS_COLORS.systemGray4} />
        ) : skill.selected ? (
          <Ionicons name="checkmark-circle" size={22} color={IOS_COLORS.systemBlue} />
        ) : (
          <Ionicons name="ellipse-outline" size={22} color={IOS_COLORS.systemGray3} />
        )}
      </View>

      {/* Content */}
      <View style={styles.skillContent}>
        {editing ? (
          <TextInput
            style={styles.editInput}
            value={editValue}
            onChangeText={setEditValue}
            onBlur={handleCommitEdit}
            onSubmitEditing={handleCommitEdit}
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <Pressable onLongPress={disabled ? undefined : () => setEditing(true)}>
            <Text style={[styles.skillTitle, disabled && styles.skillTitleDisabled]} numberOfLines={2}>
              {skill.title}
            </Text>
          </Pressable>
        )}
        {skill.description ? (
          <Text style={styles.skillDescription} numberOfLines={2}>
            {skill.description}
          </Text>
        ) : null}
        {disabled && (
          <Text style={styles.alreadyTracked}>(already tracked)</Text>
        )}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SkillReviewList({
  skills,
  sourceSummary,
  onToggle,
  onToggleAll,
  onEditTitle,
}: SkillReviewListProps) {
  // Group by category
  const categories = skills.reduce<Record<string, ReviewableSkill[]>>((acc, skill) => {
    const cat = skill.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  const selectedCount = skills.filter((s) => s.selected && !s.alreadyExists).length;
  const selectableCount = skills.filter((s) => !s.alreadyExists).length;
  const allSelected = selectableCount > 0 && selectedCount === selectableCount;
  const categoryNames = Object.keys(categories).sort();

  return (
    <View style={styles.container}>
      {/* Source attribution */}
      {sourceSummary ? (
        <View style={styles.sourceRow}>
          <Ionicons name="document-text-outline" size={14} color={IOS_COLORS.secondaryLabel} />
          <Text style={styles.sourceText} numberOfLines={2}>From: {sourceSummary}</Text>
        </View>
      ) : null}

      {/* Select all toggle */}
      <Pressable style={styles.selectAllRow} onPress={onToggleAll}>
        <Ionicons
          name={allSelected ? 'checkbox' : 'square-outline'}
          size={20}
          color={allSelected ? IOS_COLORS.systemBlue : IOS_COLORS.systemGray3}
        />
        <Text style={styles.selectAllText}>
          {allSelected ? 'Deselect All' : 'Select All'} ({selectedCount} of {skills.length})
        </Text>
      </Pressable>

      {/* Skills by category */}
      {categoryNames.map((cat) => (
        <View key={cat} style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <View style={styles.categoryLine} />
            <Text style={styles.categoryTitle}>{cat}</Text>
            <View style={styles.categoryLine} />
          </View>
          {categories[cat].map((skill) => (
            <SkillRow
              key={skill.key}
              skill={skill}
              onToggle={() => onToggle(skill.key)}
              onEditTitle={(newTitle) => onEditTitle(skill.key, newTitle)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: IOS_SPACING.sm,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.xs,
    backgroundColor: 'rgba(0,122,255,0.06)',
    borderRadius: 8,
  },
  sourceText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    fontStyle: 'italic',
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: IOS_SPACING.xs,
    paddingHorizontal: IOS_SPACING.sm,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  categorySection: {
    gap: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 4,
  },
  categoryLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.systemGray4,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: IOS_SPACING.sm,
    paddingVertical: 8,
    paddingHorizontal: IOS_SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray5,
  },
  skillRowDisabled: {
    opacity: 0.5,
    backgroundColor: IOS_COLORS.systemGray6,
  },
  checkBox: {
    paddingTop: 1,
  },
  skillContent: {
    flex: 1,
    gap: 2,
  },
  skillTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  skillTitleDisabled: {
    color: IOS_COLORS.secondaryLabel,
  },
  skillDescription: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  alreadyTracked: {
    fontSize: 11,
    color: IOS_COLORS.systemGray,
    fontStyle: 'italic',
    marginTop: 2,
  },
  editInput: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemBlue,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
});
