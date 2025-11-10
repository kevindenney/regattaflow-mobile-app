/**
 * Tactical Coaching Display
 *
 * Shows personalized coaching feedback based on championship racing tactics
 * after post-race analysis is completed.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type {
  RaceAnalysis,
  CoachingFeedback,
  FrameworkScores,
} from '@/types/raceAnalysis';

export interface TacticalCoachingProps {
  analysis: RaceAnalysis;
  coachingFeedback: CoachingFeedback[];
  frameworkScores: FrameworkScores;
  onViewPlaybook?: () => void;
}

export function TacticalCoaching({
  analysis,
  coachingFeedback,
  frameworkScores,
  onViewPlaybook,
}: TacticalCoachingProps) {
  /**
   * Get color for score
   */
  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#4CAF50'; // Green - Championship
    if (score >= 75) return '#8BC34A'; // Light Green - Strong
    if (score >= 60) return '#FFA500'; // Orange - Developing
    return '#FF3B30'; // Red - Needs Work
  };

  /**
   * Get score label
   */
  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Championship';
    if (score >= 75) return 'Strong';
    if (score >= 60) return 'Developing';
    return 'Building';
  };

  /**
   * Get impact badge color
   */
  const getImpactColor = (impact: string): string => {
    if (impact === 'high') return '#FF3B30';
    if (impact === 'medium') return '#FFA500';
    return '#007AFF';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🏆</Text>
        <Text style={styles.headerTitle}>Tactical Analysis</Text>
        <Text style={styles.headerSubtitle}>
          Championship Racing Insights
        </Text>
      </View>

      {/* Overall Performance Score */}
      {frameworkScores.overall_framework_adoption !== undefined && (
        <View style={styles.overallScoreCard}>
          <Text style={styles.overallScoreLabel}>
            Overall Tactical Performance
          </Text>
          <View style={styles.scoreCircle}>
            <Text
              style={[
                styles.scoreValue,
                {
                  color: getScoreColor(
                    frameworkScores.overall_framework_adoption
                  ),
                },
              ]}
            >
              {frameworkScores.overall_framework_adoption}
            </Text>
            <Text style={styles.scoreOutOf}>/100</Text>
            <Text
              style={[
                styles.scoreLevelText,
                {
                  color: getScoreColor(
                    frameworkScores.overall_framework_adoption
                  ),
                },
              ]}
            >
              {getScoreLabel(frameworkScores.overall_framework_adoption)}
            </Text>
          </View>
          <Text style={styles.overallScoreDescription}>
            {frameworkScores.overall_framework_adoption >= 90
              ? '✅ Outstanding! You\'re applying championship tactics consistently.'
              : frameworkScores.overall_framework_adoption >= 75
              ? '🔥 Strong performance! Keep refining your tactical execution.'
              : frameworkScores.overall_framework_adoption >= 60
              ? '⚡ Good foundation! Focus on consistent application.'
              : '🎯 Building phase: Review key frameworks and practice application.'}
          </Text>
        </View>
      )}

      {/* Framework Performance Grid */}
      <View style={styles.scoresContainer}>
        <Text style={styles.sectionTitle}>Tactical Performance</Text>
        <View style={styles.scoresGrid}>
          {Object.entries(frameworkScores)
            .filter(([key]) => key !== 'overall_framework_adoption')
            .map(([key, score]) => (
              <FrameworkScoreCard
                key={key}
                name={formatFrameworkName(key)}
                score={score as number}
                color={getScoreColor(score as number)}
                label={getScoreLabel(score as number)}
              />
            ))}
        </View>
      </View>

      {/* Detailed Coaching Feedback */}
      <View style={styles.feedbackContainer}>
        <View style={styles.feedbackHeader}>
          <Text style={styles.sectionTitle}>Detailed Insights</Text>
          {onViewPlaybook && (
            <TouchableOpacity
              style={styles.playbookButton}
              onPress={onViewPlaybook}
            >
              <Text style={styles.playbookButtonText}>📖 Tactical Playbook</Text>
            </TouchableOpacity>
          )}
        </View>
        {coachingFeedback.map((feedback, index) => (
          <CoachingFeedbackCard
            key={index}
            feedback={feedback}
            impactColor={getImpactColor(feedback.impact)}
            scoreColor={
              feedback.execution_score
                ? getScoreColor(feedback.execution_score)
                : '#999'
            }
          />
        ))}
      </View>

      {/* Racing Intelligence Attribution */}
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>
          💡 Tactical insights powered by championship racing frameworks
        </Text>
        <Text style={styles.attributionText}>
          Based on proven techniques from Olympic and America's Cup racing
        </Text>
      </View>
    </ScrollView>
  );
}

/**
 * Framework Score Card
 */
function FrameworkScoreCard({
  name,
  score,
  color,
  label,
}: {
  name: string;
  score: number;
  color: string;
  label: string;
}) {
  return (
    <View style={styles.scoreCard}>
      <Text style={styles.scoreCardName}>{name}</Text>
      <Text style={[styles.scoreCardValue, { color }]}>{score}</Text>
      <Text style={[styles.scoreCardLabel, { color }]}>{label}</Text>
      <View style={styles.scoreCardBar}>
        <View
          style={[
            styles.scoreCardBarFill,
            { width: `${score}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Coaching Feedback Card
 */
function CoachingFeedbackCard({
  feedback,
  impactColor,
  scoreColor,
}: {
  feedback: CoachingFeedback;
  impactColor: string;
  scoreColor: string;
}) {
  return (
    <View style={styles.feedbackCard}>
      {/* Header with Execution Score */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.feedbackPhase}>{formatPhase(feedback.phase)}</Text>
          <View style={[styles.impactBadge, { backgroundColor: impactColor }]}>
            <Text style={styles.impactBadgeText}>
              {feedback.impact.toUpperCase()}
            </Text>
          </View>
        </View>
        {feedback.execution_score !== undefined && (
          <View style={styles.executionScoreBadge}>
            <Text style={[styles.executionScoreValue, { color: scoreColor }]}>
              {feedback.execution_score}
            </Text>
            <Text style={styles.executionScoreLabel}>execution</Text>
          </View>
        )}
      </View>

      {/* Framework Tag */}
      <View style={styles.frameworkTag}>
        <Text style={styles.frameworkTagText}>
          📚 {feedback.playbook_framework}
        </Text>
      </View>

      {/* Your Approach */}
      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackSectionLabel}>Your Approach:</Text>
        <Text style={styles.feedbackSectionText}>{feedback.your_approach}</Text>
      </View>

      {/* Tactical Analysis */}
      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackSectionLabel}>Tactical Analysis:</Text>
        <Text style={styles.tacticalRecommendation}>
          {feedback.playbook_recommendation}
        </Text>
      </View>

      {/* Execution Guidance */}
      {feedback.execution_feedback && (
        <View style={[styles.feedbackSection, styles.executionSection]}>
          <Text style={styles.executionSectionLabel}>
            ⚙️ Execution Guidance
          </Text>
          <Text style={styles.executionFeedbackText}>
            {feedback.execution_feedback}
          </Text>
        </View>
      )}

      {/* Champion Story */}
      {feedback.champion_story && (
        <View style={styles.championStoryBox}>
          <Text style={styles.championStoryLabel}>🏅 Championship Example:</Text>
          <Text style={styles.championStoryText}>{feedback.champion_story}</Text>
        </View>
      )}

      {/* Next Race Focus */}
      <View style={styles.nextFocusBox}>
        <Text style={styles.nextFocusLabel}>🎯 Next Race Focus:</Text>
        <Text style={styles.nextFocusText}>{feedback.next_race_focus}</Text>
      </View>
    </View>
  );
}

/**
 * Format framework name for display
 */
function formatFrameworkName(key: string): string {
  const names: Record<string, string> = {
    puff_response: 'Puff Response',
    shift_awareness: 'Shift Awareness',
    delayed_tack_usage: 'Delayed Tack',
    downwind_detection: 'Downwind Detection',
    getting_in_phase: 'Getting In Phase',
    covering_tactics: 'Covering Tactics',
  };
  return names[key] || key;
}

/**
 * Format phase name for display
 */
function formatPhase(phase: string): string {
  const phases: Record<string, string> = {
    equipment: 'Equipment',
    planning: 'Planning',
    prestart: 'Pre-Start',
    start: 'Start',
    upwind: 'Upwind',
    windward_mark: 'Windward Mark',
    downwind: 'Downwind',
    leeward_mark: 'Leeward Mark',
    finish: 'Finish',
    overall: 'Overall',
  };
  return phases[phase] || phase;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 24,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  overallScoreCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overallScoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 52,
    fontWeight: 'bold',
    lineHeight: 56,
  },
  scoreOutOf: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  scoreLevelText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overallScoreDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  scoresContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scoreCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreCardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  scoreCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  scoreCardBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreCardBarFill: {
    height: 4,
    borderRadius: 2,
  },
  feedbackContainer: {
    padding: 16,
    paddingTop: 0,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  playbookButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  playbookButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  feedbackCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackPhase: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  impactBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  executionScoreBadge: {
    alignItems: 'center',
  },
  executionScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  executionScoreLabel: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  frameworkTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  frameworkTagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  feedbackSection: {
    marginBottom: 12,
  },
  feedbackSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  feedbackSectionText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  tacticalRecommendation: {
    fontSize: 14,
    color: '#000',
    lineHeight: 22,
  },
  executionSection: {
    backgroundColor: '#F0F4FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  executionSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#005BBB',
    marginBottom: 6,
  },
  executionFeedbackText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  championStoryBox: {
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFA500',
    marginBottom: 12,
  },
  championStoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F57C00',
    marginBottom: 6,
  },
  championStoryText: {
    fontSize: 13,
    color: '#5D4037',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  nextFocusBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  nextFocusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  nextFocusText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  attribution: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  attributionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
});
