/**
 * ReflectPhaseContent
 *
 * Content for the Reflect phase (after session):
 * - Drill ratings
 * - Key learnings capture
 * - Equipment issues logging
 * - Next focus identification
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import {
  Star,
  Lightbulb,
  Wrench,
  Target,
  ChevronRight,
} from 'lucide-react-native';
import { IOS_COLORS, TUFTE_BACKGROUND, TUFTE_TEXT } from '@/components/cards/constants';
import { TufteChecklistSection } from '../tufte/TufteChecklistSection';
import { unicodeBar } from '@/lib/tufte';
import {
  getCategoriesForPracticePhase,
  getPracticeItemsGroupedByCategory,
  PracticeChecklistCompletion,
} from '@/lib/checklists/practiceChecklists';
import type { PracticeSession, PracticeSessionDrill } from '@/types/practice';

interface ReflectPhaseContentProps {
  session: PracticeSession;
  completions: Record<string, PracticeChecklistCompletion>;
  onToggleItem: (itemId: string) => void;
  onRateDrill: (drillId: string, rating: number, notes?: string) => void;
  onUpdateReflection: (reflection: {
    overallRating?: number;
    reflectionNotes?: string;
    keyLearning?: string;
    nextFocus?: string;
  }) => void;
  onLogEquipmentIssue?: (issue: string) => void;
}

function StarRating({
  rating,
  onChange,
  size = 24,
}: {
  rating: number;
  onChange: (rating: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)}>
          <Star
            size={size}
            color={star <= rating ? IOS_COLORS.orange : IOS_COLORS.gray4}
            fill={star <= rating ? IOS_COLORS.orange : 'transparent'}
          />
        </Pressable>
      ))}
    </View>
  );
}

export function ReflectPhaseContent({
  session,
  completions,
  onToggleItem,
  onRateDrill,
  onUpdateReflection,
  onLogEquipmentIssue,
}: ReflectPhaseContentProps) {
  const [overallRating, setOverallRating] = useState(session.overallRating || 0);
  const [reflectionNotes, setReflectionNotes] = useState(session.reflectionNotes || '');
  const [keyLearning, setKeyLearning] = useState('');
  const [nextFocus, setNextFocus] = useState('');
  const [equipmentIssue, setEquipmentIssue] = useState('');
  const [expandedDrill, setExpandedDrill] = useState<string | null>(null);

  // Get checklist items for reflect phase
  const categories = getCategoriesForPracticePhase('practice_reflect');
  const itemsByCategory = getPracticeItemsGroupedByCategory('practice_reflect');

  // Drill stats
  const drills = session.drills || [];
  const completedDrills = drills.filter((d) => d.completed);
  const ratedCount = completedDrills.filter((d) => d.rating).length;

  // Handle overall rating change
  const handleOverallRatingChange = (rating: number) => {
    setOverallRating(rating);
    onUpdateReflection({ overallRating: rating });
  };

  // Handle adding equipment issue
  const handleAddEquipmentIssue = () => {
    if (equipmentIssue.trim()) {
      onLogEquipmentIssue?.(equipmentIssue.trim());
      setEquipmentIssue('');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Overall Rating */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>HOW DID IT GO?</Text>
        <View style={styles.overallRatingContainer}>
          <StarRating
            rating={overallRating}
            onChange={handleOverallRatingChange}
            size={32}
          />
          <Text style={styles.ratingHint}>
            {overallRating === 0
              ? 'Tap to rate'
              : overallRating <= 2
              ? 'Needs work'
              : overallRating <= 4
              ? 'Good session'
              : 'Excellent!'}
          </Text>
        </View>
      </View>

      {/* Drill Ratings */}
      {completedDrills.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>DRILL RATINGS</Text>
            <Text style={styles.sectionMeta}>
              {ratedCount}/{completedDrills.length} rated
            </Text>
          </View>
          <View style={styles.drillsList}>
            {completedDrills.map((drill) => {
              const isExpanded = expandedDrill === drill.id;
              return (
                <View key={drill.id}>
                  <Pressable
                    style={styles.drillRow}
                    onPress={() =>
                      setExpandedDrill(isExpanded ? null : drill.id)
                    }
                  >
                    <View style={styles.drillInfo}>
                      <Text style={styles.drillName} numberOfLines={1}>
                        {drill.drill?.name || 'Drill'}
                      </Text>
                      {drill.rating ? (
                        <View style={styles.miniStars}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              color={
                                s <= drill.rating!
                                  ? IOS_COLORS.orange
                                  : IOS_COLORS.gray4
                              }
                              fill={
                                s <= drill.rating!
                                  ? IOS_COLORS.orange
                                  : 'transparent'
                              }
                            />
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.unratedText}>Not rated</Text>
                      )}
                    </View>
                    <ChevronRight
                      size={18}
                      color={IOS_COLORS.gray3}
                      style={{
                        transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                      }}
                    />
                  </Pressable>
                  {isExpanded && (
                    <View style={styles.drillExpanded}>
                      <StarRating
                        rating={drill.rating || 0}
                        onChange={(r) => onRateDrill(drill.id, r)}
                        size={28}
                      />
                      <TextInput
                        style={styles.drillNotes}
                        placeholder="Notes on this drill..."
                        placeholderTextColor={IOS_COLORS.gray3}
                        value={drill.notes || ''}
                        onChangeText={(text) =>
                          onRateDrill(drill.id, drill.rating || 0, text)
                        }
                        multiline
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Key Learning */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Lightbulb size={18} color={IOS_COLORS.orange} />
          <Text style={styles.cardLabel}>KEY LEARNING</Text>
        </View>
        <TextInput
          style={styles.cardInput}
          placeholder="What was the most important thing you learned?"
          placeholderTextColor={IOS_COLORS.gray3}
          value={keyLearning}
          onChangeText={(text) => {
            setKeyLearning(text);
            onUpdateReflection({ keyLearning: text });
          }}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Equipment Issues */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Wrench size={18} color={IOS_COLORS.gray} />
          <Text style={styles.cardLabel}>EQUIPMENT ISSUES</Text>
        </View>
        <View style={styles.issueInputRow}>
          <TextInput
            style={styles.issueInput}
            placeholder="Note any gear issues..."
            placeholderTextColor={IOS_COLORS.gray3}
            value={equipmentIssue}
            onChangeText={setEquipmentIssue}
          />
          <Pressable
            style={[
              styles.addButton,
              !equipmentIssue.trim() && styles.addButtonDisabled,
            ]}
            onPress={handleAddEquipmentIssue}
            disabled={!equipmentIssue.trim()}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
        <Text style={styles.issueHint}>
          Issues will appear in your next session's prep
        </Text>
      </View>

      {/* Next Focus */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Target size={18} color={IOS_COLORS.blue} />
          <Text style={styles.cardLabel}>NEXT FOCUS</Text>
        </View>
        <TextInput
          style={styles.cardInput}
          placeholder="What should you work on next?"
          placeholderTextColor={IOS_COLORS.gray3}
          value={nextFocus}
          onChangeText={(text) => {
            setNextFocus(text);
            onUpdateReflection({ nextFocus: text });
          }}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Reflection Notes */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>ADDITIONAL NOTES</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Any other thoughts about this session..."
          placeholderTextColor={IOS_COLORS.gray3}
          value={reflectionNotes}
          onChangeText={(text) => {
            setReflectionNotes(text);
            onUpdateReflection({ reflectionNotes: text });
          }}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Checklist Sections */}
      {categories.map((category) => {
        const items = itemsByCategory[category];
        if (!items || items.length === 0) return null;

        return (
          <TufteChecklistSection
            key={category}
            category={category}
            items={items}
            completions={completions}
            onToggleItem={onToggleItem}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },
  cardInput: {
    backgroundColor: TUFTE_BACKGROUND,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: TUFTE_TEXT,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  overallRatingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingHint: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  drillsList: {
    gap: 2,
  },
  drillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  drillInfo: {
    flex: 1,
    gap: 4,
  },
  drillName: {
    fontSize: 15,
    fontWeight: '500',
    color: TUFTE_TEXT,
  },
  miniStars: {
    flexDirection: 'row',
    gap: 2,
  },
  unratedText: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
  },
  drillExpanded: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
    backgroundColor: TUFTE_BACKGROUND,
    borderRadius: 8,
    marginBottom: 8,
  },
  drillNotes: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: TUFTE_TEXT,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  issueInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  issueInput: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: TUFTE_TEXT,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: IOS_COLORS.gray4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  issueHint: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.gray,
    fontStyle: 'italic',
  },
  notesInput: {
    backgroundColor: TUFTE_BACKGROUND,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: TUFTE_TEXT,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

export default ReflectPhaseContent;
