/**
 * ObservationLog — Chronological feed of timestamped observation entries.
 * Matches Telegram's log_observation format so data flows seamlessly
 * between web and bot interfaces.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';
import type { Observation } from '@/types/step-detail';

interface ObservationLogProps {
  observations: Observation[];
  onAdd: (observation: Observation) => void;
  onRemove?: (id: string) => void;
  readOnly?: boolean;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
}

export function ObservationLog({ observations, onAdd, onRemove, readOnly }: ObservationLogProps) {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd({
      id: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: trimmed,
      timestamp: new Date().toISOString(),
    });
    setText('');
  }, [text, onAdd]);

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Ionicons name="eye-outline" size={14} color={IOS_COLORS.secondaryLabel} />
        <Text style={s.sectionTitle}>OBSERVATIONS</Text>
        <Text style={s.count}>{observations.length}</Text>
      </View>

      {/* Chronological feed */}
      {observations.map((obs) => (
        <View key={obs.id} style={s.entry}>
          <Text style={s.timestamp}>{formatTimestamp(obs.timestamp)}</Text>
          <Text style={s.entryText}>{obs.text}</Text>
          {!readOnly && onRemove && (
            <Pressable onPress={() => onRemove(obs.id)} hitSlop={8} style={s.removeBtn}>
              <Ionicons name="close-circle" size={16} color="#D1D5DB" />
            </Pressable>
          )}
        </View>
      ))}

      {observations.length === 0 && (
        <Text style={s.emptyHint}>
          Log observations as you practice. What do you notice?
        </Text>
      )}

      {/* Input */}
      {!readOnly && (
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder="What did you observe?"
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            multiline
            blurOnSubmit
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
          />
          <Pressable
            style={[s.submitBtn, !text.trim() && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!text.trim()}
          >
            <Ionicons
              name="add-circle"
              size={28}
              color={text.trim() ? STEP_COLORS.accent : '#D1D5DB'}
            />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
  },
  count: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
    fontWeight: '500',
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  timestamp: {
    fontSize: 11,
    color: STEP_COLORS.accent,
    fontWeight: '600',
    minWidth: 52,
    paddingTop: 1,
  },
  entryText: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  removeBtn: {
    paddingTop: 1,
  },
  emptyHint: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 80,
  },
  submitBtn: {
    paddingBottom: Platform.OS === 'ios' ? 4 : 2,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
});
