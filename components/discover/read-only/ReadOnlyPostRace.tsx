/**
 * ReadOnlyPostRace Component
 *
 * Displays sailor's post-race results and learnings in read-only mode.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react-native';
import { RaceResult } from '@/hooks/usePublicSailorRaceJourney';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

interface ReadOnlyPostRaceProps {
  results: RaceResult[] | null;
  postRaceNotes?: string | null;
  lessonsLearned?: string[] | null;
}

/**
 * Get ordinal suffix for a number
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Result card component
 */
function ResultCard({ result }: { result: RaceResult }) {
  const position = result.position;
  const totalBoats = result.total_boats;
  const ratingChange = result.rating_change;

  // Determine position color
  const getPositionColor = () => {
    if (!position) return IOS_COLORS.systemGray;
    if (position === 1) return IOS_COLORS.systemYellow;
    if (position === 2) return IOS_COLORS.systemGray2;
    if (position === 3) return '#CD7F32'; // Bronze
    if (position <= 5) return IOS_COLORS.systemGreen;
    return IOS_COLORS.label;
  };

  return (
    <View style={styles.resultCard}>
      {/* Position */}
      <View style={styles.positionSection}>
        {position ? (
          <>
            <View style={[styles.positionBadge, { backgroundColor: `${getPositionColor()}20` }]}>
              <Trophy size={18} color={getPositionColor()} />
            </View>
            <Text style={[styles.positionText, { color: getPositionColor() }]}>
              {getOrdinalSuffix(position)}
            </Text>
            {totalBoats && (
              <Text style={styles.totalBoatsText}>of {totalBoats}</Text>
            )}
          </>
        ) : (
          <Text style={styles.noPositionText}>Position not recorded</Text>
        )}
      </View>

      {/* Rating Change */}
      {ratingChange !== undefined && ratingChange !== null && ratingChange !== 0 && (
        <View style={styles.ratingChangeContainer}>
          {ratingChange > 0 ? (
            <TrendingUp size={14} color={IOS_COLORS.systemGreen} />
          ) : (
            <TrendingDown size={14} color={IOS_COLORS.systemRed} />
          )}
          <Text
            style={[
              styles.ratingChangeText,
              { color: ratingChange > 0 ? IOS_COLORS.systemGreen : IOS_COLORS.systemRed },
            ]}
          >
            {ratingChange > 0 ? '+' : ''}{ratingChange}
          </Text>
        </View>
      )}

      {/* Result Notes */}
      {result.notes && (
        <Text style={styles.resultNotes}>{result.notes}</Text>
      )}
    </View>
  );
}

export function ReadOnlyPostRace({
  results,
  postRaceNotes,
  lessonsLearned,
}: ReadOnlyPostRaceProps) {
  const hasResults = results && results.length > 0;
  const hasPostRaceNotes = Boolean(postRaceNotes?.trim());
  const hasLessons = Array.isArray(lessonsLearned) && lessonsLearned.length > 0;

  if (!hasResults && !hasPostRaceNotes && !hasLessons) {
    return (
      <Text style={styles.emptyText}>No post-race content shared</Text>
    );
  }

  return (
    <View style={styles.container}>
      {/* Race Results */}
      {hasResults && (
        <View style={styles.resultsSection}>
          {results!.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))}
        </View>
      )}

      {/* Post-Race Notes */}
      {hasPostRaceNotes && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{postRaceNotes}</Text>
        </View>
      )}

      {/* Lessons Learned */}
      {hasLessons && (
        <View style={styles.lessonsSection}>
          <Text style={styles.sectionTitle}>Lessons Learned</Text>
          <View style={styles.lessonsList}>
            {lessonsLearned!.map((lesson, index) => (
              <View key={index} style={styles.lessonRow}>
                <View style={styles.lessonBullet}>
                  <Text style={styles.bulletText}>{index + 1}</Text>
                </View>
                <Text style={styles.lessonText}>{lesson}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  resultsSection: {
    gap: 10,
  },
  resultCard: {
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  positionSection: {
    alignItems: 'center',
    gap: 4,
  },
  positionBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  positionText: {
    fontSize: 28,
    fontWeight: '700',
  },
  totalBoatsText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  noPositionText: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
  ratingChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
  },
  ratingChangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultNotes: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  notesSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  notesText: {
    fontSize: 15,
    color: IOS_COLORS.label,
    lineHeight: 22,
  },
  lessonsSection: {
    gap: 10,
  },
  lessonsList: {
    gap: 12,
  },
  lessonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  lessonBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.systemGreen}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.systemGreen,
  },
  lessonText: {
    fontSize: 15,
    color: IOS_COLORS.label,
    lineHeight: 22,
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
});

export default ReadOnlyPostRace;
