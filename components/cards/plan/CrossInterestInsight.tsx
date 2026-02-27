/**
 * CrossInterestInsight — Displays an AI-generated cross-interest suggestion.
 *
 * Shown in the Plan tab when the AI finds a relevant transfer opportunity
 * from another interest the user is active in.
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import {
  Lightbulb,
  ArrowRight,
  X,
  Bookmark,
  Check,
} from 'lucide-react-native';
import type { AISuggestion } from '@/services/ai/crossInterestSuggestions';

const COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#C7C7CC',
  blue: '#007AFF',
  orange: '#FF9500',
  green: '#34C759',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  systemBackground: '#FFFFFF',
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  skill_transfer: { label: 'Skill Transfer', color: '#007AFF' },
  mental_model: { label: 'Mental Model', color: '#AF52DE' },
  practice_method: { label: 'Practice Method', color: '#34C759' },
  recovery_insight: { label: 'Recovery Insight', color: '#FF9500' },
  metacognitive: { label: 'Metacognitive', color: '#5856D6' },
};

interface CrossInterestInsightProps {
  suggestion: AISuggestion;
  onApply: (suggestion: AISuggestion) => void;
  onDismiss: (suggestion: AISuggestion) => void;
  onSave: (suggestion: AISuggestion) => void;
}

export function CrossInterestInsight({
  suggestion,
  onApply,
  onDismiss,
  onSave,
}: CrossInterestInsightProps) {
  const [actionTaken, setActionTaken] = useState<'applied' | 'saved' | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const typeConfig = TYPE_LABELS[suggestion.suggestionType] ?? {
    label: 'Insight',
    color: COLORS.blue,
  };

  const handleApply = useCallback(() => {
    setActionTaken('applied');
    onApply(suggestion);
  }, [suggestion, onApply]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss(suggestion);
  }, [suggestion, onDismiss]);

  const handleSave = useCallback(() => {
    setActionTaken('saved');
    onSave(suggestion);
  }, [suggestion, onSave]);

  if (dismissed) return null;

  if (actionTaken) {
    return (
      <View style={[styles.container, styles.containerConfirm]}>
        <View style={styles.confirmContent}>
          <Check size={16} color={COLORS.green} />
          <Text style={styles.confirmText}>
            {actionTaken === 'applied' ? 'Applied to plan' : 'Saved for later'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: typeConfig.color + '18' }]}>
            <Lightbulb size={14} color={typeConfig.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerLabel}>Cross-Interest Insight</Text>
            <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '18' }]}>
              <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                {typeConfig.label}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color={COLORS.tertiaryLabel} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>{suggestion.title}</Text>

      {/* Body */}
      <Text style={styles.body}>{suggestion.body}</Text>

      {/* Source evidence */}
      {suggestion.sourceEvidence?.recentActivities?.[0] && (
        <View style={styles.evidenceRow}>
          <Text style={styles.evidenceLabel}>Based on:</Text>
          <Text style={styles.evidenceText}>
            {suggestion.sourceEvidence.recentActivities[0].title}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Apply to Plan</Text>
          <ArrowRight size={14} color={COLORS.systemBackground} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Bookmark size={14} color={COLORS.blue} />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.orange + '08',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.orange + '20',
    padding: 14,
    gap: 10,
  },
  containerConfirm: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.green,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.label,
    lineHeight: 20,
  },
  body: {
    fontSize: 14,
    color: COLORS.secondaryLabel,
    lineHeight: 20,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  evidenceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.tertiaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  evidenceText: {
    fontSize: 12,
    color: COLORS.secondaryLabel,
    fontStyle: 'italic',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.blue,
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.systemBackground,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.blue + '12',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.blue,
  },
});

export default CrossInterestInsight;
