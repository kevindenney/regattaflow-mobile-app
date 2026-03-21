/**
 * MySkillsSection — User-defined skill goals dashboard for the Reflect tab.
 *
 * Shows skill goals grouped by category with progress dots (0-5 rating).
 * Users can add new goals manually. Categories are collapsible.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';
import { useSkillGoals } from '@/hooks/useSkillGoals';
import { ImportSkillsSheet } from './ImportSkillsSheet';
import type { UserSkillGoal } from '@/types/skill-goal';

// ---------------------------------------------------------------------------
// Rating dots
// ---------------------------------------------------------------------------

function RatingDots({
  rating,
  size,
  onRate,
  color,
}: {
  rating: number;
  size?: number;
  onRate?: (n: number) => void;
  color?: string;
}) {
  const dotSize = size ?? (onRate ? 12 : 10);
  const filledColor = color ?? STEP_COLORS.accent;

  return (
    <View style={s.dotsRow}>
      {[1, 2, 3, 4, 5].map((n) => {
        const dotView = (
          <View
            key={n}
            style={[
              s.dot,
              { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
              n <= rating
                ? { backgroundColor: filledColor, borderColor: filledColor }
                : s.dotEmpty,
            ]}
          />
        );

        if (onRate) {
          return (
            <Pressable
              key={n}
              onPress={() => onRate(n === rating ? 0 : n)}
              hitSlop={6}
            >
              {dotView}
            </Pressable>
          );
        }

        return dotView;
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Skill goal card
// ---------------------------------------------------------------------------

function SkillGoalCard({
  goal,
  onArchive: _onArchive,
  onRate,
}: {
  goal: UserSkillGoal;
  onArchive: (id: string) => void;
  onRate: (rating: number) => void;
}) {
  const hasCoachRating = goal.coach_rating != null;

  return (
    <View style={s.goalCard}>
      <View style={s.goalCardContent}>
        <Text style={s.goalTitle} numberOfLines={2}>{goal.title}</Text>
        {goal.description ? (
          <Text style={s.goalDescription} numberOfLines={1}>{goal.description}</Text>
        ) : null}
      </View>
      <View style={s.goalCardRight}>
        {hasCoachRating ? (
          <>
            <View style={s.dualRow}>
              <Text style={s.dualLabel}>SELF</Text>
              <RatingDots rating={goal.current_rating} onRate={onRate} />
            </View>
            <View style={s.dualRow}>
              <Text style={s.dualLabel}>COACH</Text>
              <RatingDots
                rating={goal.coach_rating!}
                color={IOS_COLORS.systemBlue}
              />
            </View>
          </>
        ) : (
          <RatingDots rating={goal.current_rating} onRate={onRate} />
        )}
        {goal.rating_count > 0 && (
          <Text style={s.ratingCount}>{goal.rating_count}x</Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Category section
// ---------------------------------------------------------------------------

function CategorySection({ category, goals, onArchive, onRate }: {
  category: string;
  goals: UserSkillGoal[];
  onArchive: (id: string) => void;
  onRate: (goalTitle: string, rating: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const ratedCount = goals.filter((g) => g.current_rating > 0).length;

  return (
    <View style={s.categorySection}>
      <Pressable style={s.categoryHeader} onPress={() => setExpanded(!expanded)}>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={14}
          color={STEP_COLORS.secondaryLabel}
        />
        <Text style={s.categoryTitle}>{category}</Text>
        <Text style={s.categoryCount}>
          {ratedCount}/{goals.length}
        </Text>
        {/* Mini progress bar */}
        <View style={s.categoryProgressBg}>
          <View
            style={[
              s.categoryProgressFill,
              { width: `${goals.length > 0 ? (ratedCount / goals.length) * 100 : 0}%` },
            ]}
          />
        </View>
      </Pressable>
      {expanded && (
        <View style={s.categoryGoals}>
          {goals.map((goal) => (
            <SkillGoalCard
              key={goal.id}
              goal={goal}
              onArchive={onArchive}
              onRate={(rating) => onRate(goal.title, rating)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function MySkillsSection() {
  const { skillGoals, byCategory, summary, isLoading, addGoal, removeGoal, rateGoal } = useSkillGoals();
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = useCallback(() => {
    if (!newTitle.trim()) return;
    addGoal.mutate({
      title: newTitle.trim(),
      category: newCategory.trim() || undefined,
    }, {
      onSuccess: () => {
        setNewTitle('');
        setNewCategory('');
        setShowAdd(false);
      },
    });
  }, [newTitle, newCategory, addGoal]);

  const handleArchive = useCallback((id: string) => {
    removeGoal.mutate(id);
  }, [removeGoal]);

  const handleRate = useCallback((title: string, rating: number) => {
    rateGoal.mutate({ title, rating });
  }, [rateGoal]);

  if (isLoading) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="small" color={STEP_COLORS.accent} />
      </View>
    );
  }

  const categoryNames = Object.keys(byCategory).sort();

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Ionicons name="fitness-outline" size={20} color={STEP_COLORS.accent} />
          <Text style={s.headerTitle}>My Skills</Text>
          {summary.total > 0 && (
            <Text style={s.headerCount}>{summary.rated}/{summary.total}</Text>
          )}
        </View>
        <View style={s.headerActions}>
          <Pressable style={s.importButton} onPress={() => setShowImport(true)}>
            <Ionicons name="download-outline" size={16} color={STEP_COLORS.accent} />
            <Text style={s.importButtonText}>Import</Text>
          </Pressable>
          <Pressable style={s.addButton} onPress={() => setShowAdd(!showAdd)}>
            <Ionicons name={showAdd ? 'close' : 'add'} size={20} color={STEP_COLORS.accent} />
          </Pressable>
        </View>
      </View>

      {/* Add form */}
      {showAdd && (
        <View style={s.addForm}>
          <TextInput
            style={s.addInput}
            placeholder="Skill name (e.g., Roll Tacking)"
            placeholderTextColor={STEP_COLORS.tertiaryLabel}
            value={newTitle}
            onChangeText={setNewTitle}
            autoFocus
          />
          <TextInput
            style={[s.addInput, s.addInputSmall]}
            placeholder="Category (optional, e.g., Boat Handling)"
            placeholderTextColor={STEP_COLORS.tertiaryLabel}
            value={newCategory}
            onChangeText={setNewCategory}
          />
          <Pressable
            style={[s.addSubmit, !newTitle.trim() && s.addSubmitDisabled]}
            onPress={handleAdd}
            disabled={!newTitle.trim() || addGoal.isPending}
          >
            {addGoal.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={s.addSubmitText}>Add Skill</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* Empty state */}
      {skillGoals.length === 0 && !showAdd && (
        <View style={s.emptyState}>
          <Ionicons name="bulb-outline" size={32} color={IOS_COLORS.systemGray3} />
          <Text style={s.emptyTitle}>No skills tracked yet</Text>
          <Text style={s.emptyBody}>
            Add skills you're developing, or they'll be created automatically when you set capability goals in your practice steps.
          </Text>
          <Pressable style={s.emptyAddButton} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={16} color={STEP_COLORS.accent} />
            <Text style={s.emptyAddText}>Add your first skill</Text>
          </Pressable>
        </View>
      )}

      {/* Skill goals by category */}
      {categoryNames.map((cat) => (
        <CategorySection
          key={cat}
          category={cat}
          goals={byCategory[cat]}
          onArchive={handleArchive}
          onRate={handleRate}
        />
      ))}

      {/* Import sheet */}
      <ImportSkillsSheet
        visible={showImport}
        onClose={() => setShowImport(false)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: {
    backgroundColor: STEP_COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: STEP_COLORS.cardBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: IOS_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: STEP_COLORS.cardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: STEP_COLORS.label,
  },
  headerCount: {
    fontSize: 13,
    fontWeight: '500',
    color: STEP_COLORS.secondaryLabel,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: STEP_COLORS.accentLight,
    borderRadius: 14,
  },
  importButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: STEP_COLORS.accent,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: STEP_COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Add form
  addForm: {
    padding: IOS_SPACING.md,
    gap: IOS_SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: STEP_COLORS.cardBorder,
    backgroundColor: STEP_COLORS.pageBg,
  },
  addInput: {
    fontSize: 15,
    color: STEP_COLORS.label,
    backgroundColor: STEP_COLORS.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STEP_COLORS.cardBorder,
    padding: IOS_SPACING.sm,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  addInputSmall: {
    fontSize: 13,
  },
  addSubmit: {
    backgroundColor: STEP_COLORS.accent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addSubmitDisabled: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  addSubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Empty state
  emptyState: {
    padding: IOS_SPACING.lg,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: STEP_COLORS.label,
  },
  emptyBody: {
    fontSize: 13,
    color: STEP_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: STEP_COLORS.accentLight,
    borderRadius: 20,
  },
  emptyAddText: {
    fontSize: 14,
    fontWeight: '600',
    color: STEP_COLORS.accent,
  },
  // Category section
  categorySection: {
    borderBottomWidth: 1,
    borderBottomColor: STEP_COLORS.cardBorder,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: STEP_COLORS.pageBg,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: STEP_COLORS.secondaryLabel,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flex: 1,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '500',
    color: STEP_COLORS.tertiaryLabel,
    marginRight: 8,
  },
  categoryProgressBg: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: IOS_COLORS.systemGray5,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: STEP_COLORS.accent,
  },
  categoryGoals: {
    paddingHorizontal: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.sm,
    gap: 6,
  },
  // Goal card
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    paddingVertical: 8,
    paddingHorizontal: IOS_SPACING.sm,
    backgroundColor: STEP_COLORS.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: STEP_COLORS.cardBorder,
  },
  goalCardContent: {
    flex: 1,
    gap: 2,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: STEP_COLORS.label,
  },
  goalDescription: {
    fontSize: 12,
    color: STEP_COLORS.secondaryLabel,
  },
  goalCardRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  ratingCount: {
    fontSize: 10,
    color: STEP_COLORS.tertiaryLabel,
  },
  // Dual rating rows
  dualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dualLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: STEP_COLORS.tertiaryLabel,
    textTransform: 'uppercase',
    width: 32,
    letterSpacing: 0.3,
  },
  // Dots
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    borderWidth: 1,
  },
  dotEmpty: {
    backgroundColor: 'transparent',
    borderColor: IOS_COLORS.systemGray4,
  },
});
