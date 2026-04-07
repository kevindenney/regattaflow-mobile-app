/**
 * AskYourPlaybook — input card for Q&A against a playbook. Calls
 * `playbook-qa` via PlaybookAIService and renders the answer inline.
 * A "Pin" button saves the Q&A to `playbook_qa` through the hook so it
 * shows up on the Q&A tab.
 */

import React, { useState } from 'react';
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
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import {
  PlaybookAIService,
  type PlaybookQAResponse,
} from '@/services/ai/PlaybookAIService';
import { useCreatePlaybookQA } from '@/hooks/usePlaybook';
import { useAuth } from '@/providers/AuthProvider';

interface AskYourPlaybookProps {
  interestName: string;
  playbookId: string | undefined;
}

const RECENT_SUGGESTIONS = [
  'What have I been working on lately?',
  'Where am I improving the most?',
  'What should I focus on next?',
];

export function AskYourPlaybook({
  interestName,
  playbookId,
}: AskYourPlaybookProps) {
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<PlaybookQAResponse | null>(null);
  const { user } = useAuth();
  const createQA = useCreatePlaybookQA();

  const handleAsk = async () => {
    if (!question.trim() || !playbookId) return;
    setBusy(true);
    setAnswer(null);
    try {
      const res = await PlaybookAIService.ask(playbookId, question.trim());
      setAnswer(res);
    } catch (err) {
      showAlert('Ask failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const handlePin = async () => {
    if (!answer || !playbookId || !user?.id) return;
    try {
      await createQA.mutateAsync({
        playbook_id: playbookId,
        user_id: user.id,
        question: question.trim(),
        answer_md: answer.answer_md,
        sources: answer.sources,
        pinned: true,
      });
      showAlert('Pinned', 'Saved to your Q&A tab.');
    } catch (err) {
      showAlert('Pin failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBubble}>
          <Ionicons name="sparkles" size={18} color={IOS_COLORS.systemPurple} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Ask your Playbook</Text>
          <Text style={styles.subtitle}>
            Pull answers from your {interestName} concepts, resources, and
            debriefs.
          </Text>
        </View>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder={`Ask anything about your ${interestName} practice…`}
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
          onSubmitEditing={handleAsk}
          returnKeyType="search"
          editable={!busy}
          style={styles.input}
        />
        <Pressable
          onPress={handleAsk}
          disabled={busy || !playbookId}
          style={({ pressed }) => [
            styles.askButton,
            (busy || !playbookId) && styles.askButtonDisabled,
            pressed && !busy && styles.askButtonPressed,
          ]}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="arrow-up" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
      {answer && (
        <View style={styles.answerBox}>
          <Text style={styles.answerText}>{answer.answer_md}</Text>
          {answer.sources.length > 0 && (
            <View style={styles.sourcesRow}>
              {answer.sources.map((s, i) => (
                <View key={`${s.type}-${s.id}-${i}`} style={styles.sourceChip}>
                  <Text style={styles.sourceChipText}>
                    {s.type} · {s.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.answerActions}>
            <Pressable onPress={handlePin} style={styles.pinBtn}>
              <Ionicons name="bookmark-outline" size={14} color={IOS_COLORS.systemPurple} />
              <Text style={styles.pinText}>Pin to Q&A</Text>
            </Pressable>
          </View>
        </View>
      )}
      {!answer && !busy && (
        <View style={styles.chipRow}>
          {RECENT_SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setQuestion(s)}
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            >
              <Text style={styles.chipText} numberOfLines={1}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 14,
    padding: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: IOS_SPACING.md,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(175, 82, 222, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  subtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderRadius: 10,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    minHeight: 40,
    ...Platform.select({
      web: { outlineWidth: 0 } as Record<string, unknown>,
      default: {},
    }),
  },
  askButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.systemPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askButtonDisabled: {
    opacity: 0.4,
  },
  askButtonPressed: {
    opacity: 0.7,
  },
  answerBox: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderRadius: 10,
    padding: IOS_SPACING.md,
    gap: IOS_SPACING.sm,
  },
  answerText: {
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  sourceChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  sourceChipText: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  answerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  pinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(175, 82, 222, 0.1)',
  },
  pinText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.systemPurple,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.sm,
  },
  chip: {
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  chipPressed: {
    opacity: 0.6,
  },
  chipText: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
});
