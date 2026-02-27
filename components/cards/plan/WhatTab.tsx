/**
 * WhatTab — "What" phase of the Blank Plan Card
 *
 * Lets users define the activity: title, description, date/time, location, notes.
 */

import React, { useCallback } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { Calendar, Clock, MapPin, FileText } from 'lucide-react-native';
import type { PlanWhatData } from '@/types/planCard';

const COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#C7C7CC',
  blue: '#007AFF',
  gray6: '#F2F2F7',
};

interface WhatTabProps {
  data: PlanWhatData;
  onChange: (data: PlanWhatData) => void;
  readOnly?: boolean;
}

export function WhatTab({ data, onChange, readOnly = false }: WhatTabProps) {
  const update = useCallback(
    (patch: Partial<PlanWhatData>) => onChange({ ...data, ...patch }),
    [data, onChange],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <View style={styles.fieldGroup}>
        {readOnly ? (
          <Text style={styles.titleDisplay}>{data.title || 'Untitled'}</Text>
        ) : (
          <TextInput
            style={styles.titleInput}
            value={data.title}
            onChangeText={(t) => update({ title: t })}
            placeholder="Activity Title"
            placeholderTextColor={COLORS.tertiaryLabel}
            autoFocus={!data.title}
          />
        )}
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <Text style={styles.sectionLabel}>DESCRIPTION</Text>
        {readOnly ? (
          <Text style={styles.bodyText}>{data.description || '\u2014'}</Text>
        ) : (
          <TextInput
            style={[styles.input, styles.multiline]}
            value={data.description ?? ''}
            onChangeText={(t) => update({ description: t })}
            placeholder="What will you be doing?"
            placeholderTextColor={COLORS.tertiaryLabel}
            multiline
            textAlignVertical="top"
          />
        )}
      </View>

      {/* Date & Time row */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.fieldRow, styles.halfField]}
          disabled={readOnly}
          activeOpacity={0.7}
        >
          <Calendar size={16} color={COLORS.blue} />
          <Text style={[styles.fieldRowText, !data.date && styles.fieldRowPlaceholder]}>
            {data.date || 'Select Date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fieldRow, styles.halfField]}
          disabled={readOnly}
          activeOpacity={0.7}
        >
          <Clock size={16} color={COLORS.blue} />
          <Text style={[styles.fieldRowText, !data.time && styles.fieldRowPlaceholder]}>
            {data.time || 'Select Time'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Location */}
      <View style={styles.fieldGroup}>
        <Text style={styles.sectionLabel}>LOCATION</Text>
        <View style={styles.iconField}>
          <MapPin size={16} color={COLORS.secondaryLabel} />
          {readOnly ? (
            <Text style={styles.bodyText}>{data.location || '\u2014'}</Text>
          ) : (
            <TextInput
              style={styles.iconFieldInput}
              value={data.location ?? ''}
              onChangeText={(t) => update({ location: t })}
              placeholder="Where will this happen?"
              placeholderTextColor={COLORS.tertiaryLabel}
            />
          )}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.fieldGroup}>
        <View style={styles.sectionHeader}>
          <FileText size={14} color={COLORS.secondaryLabel} />
          <Text style={styles.sectionLabel}>NOTES</Text>
        </View>
        {readOnly ? (
          <Text style={styles.bodyText}>{data.notes || '\u2014'}</Text>
        ) : (
          <TextInput
            style={[styles.input, styles.multiline]}
            value={data.notes ?? ''}
            onChangeText={(t) => update({ notes: t })}
            placeholder="Additional notes..."
            placeholderTextColor={COLORS.tertiaryLabel}
            multiline
            textAlignVertical="top"
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  fieldGroup: { gap: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3C3C43',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    padding: 14,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
  },
  titleDisplay: { fontSize: 22, fontWeight: '700', color: '#000000', padding: 14 },
  input: { fontSize: 15, color: '#000000', padding: 12, backgroundColor: '#F2F2F7', borderRadius: 10 },
  multiline: { minHeight: 72, paddingTop: 12 },
  bodyText: { fontSize: 15, color: '#000000', lineHeight: 22, paddingHorizontal: 4 },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
  },
  fieldRowText: { fontSize: 15, color: '#000000', fontWeight: '500' },
  fieldRowPlaceholder: { color: '#C7C7CC' },
  iconField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
  },
  iconFieldInput: { flex: 1, fontSize: 15, color: '#000000' },
});

export default WhatTab;
