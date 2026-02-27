/**
 * WhoTab — "Who" phase of the Blank Plan Card
 *
 * Lets users add people involved in the activity with roles.
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { Users, UserPlus, X } from 'lucide-react-native';
import type { PlanWhoData, PlanWhoPerson } from '@/types/planCard';

const COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#C7C7CC',
  blue: '#007AFF',
  red: '#FF3B30',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  systemBackground: '#FFFFFF',
};

interface WhoTabProps {
  data: PlanWhoData;
  onChange: (data: PlanWhoData) => void;
  readOnly?: boolean;
}

export function WhoTab({ data, onChange, readOnly = false }: WhoTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');

  const addPerson = useCallback(() => {
    if (!newName.trim()) return;
    const person: PlanWhoPerson = {
      name: newName.trim(),
      role: newRole.trim() || undefined,
      isExternal: true,
    };
    onChange({ ...data, people: [...data.people, person] });
    setNewName('');
    setNewRole('');
    setIsAdding(false);
  }, [data, onChange, newName, newRole]);

  const removePerson = useCallback(
    (index: number) => {
      const updated = data.people.filter((_, i) => i !== index);
      onChange({ ...data, people: updated });
    },
    [data, onChange],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.sectionHeader}>
        <Users size={14} color={COLORS.secondaryLabel} />
        <Text style={styles.sectionLabel}>
          PEOPLE{data.people.length > 0 ? ` (${data.people.length})` : ''}
        </Text>
      </View>

      {/* People list */}
      {data.people.length === 0 && !isAdding && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No people added yet</Text>
        </View>
      )}

      {data.people.map((person, index) => (
        <View key={`${person.name}-${index}`} style={styles.personRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {person.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.personInfo}>
            <Text style={styles.personName}>{person.name}</Text>
            {person.role ? (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{person.role}</Text>
              </View>
            ) : null}
          </View>
          {!readOnly && (
            <TouchableOpacity
              onPress={() => removePerson(index)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={COLORS.red} />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Add person form */}
      {!readOnly && !isAdding && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAdding(true)}
          activeOpacity={0.7}
        >
          <UserPlus size={16} color={COLORS.blue} />
          <Text style={styles.addButtonText}>Add Person</Text>
        </TouchableOpacity>
      )}

      {!readOnly && isAdding && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.addInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Name"
            placeholderTextColor={COLORS.tertiaryLabel}
            autoFocus
          />
          <TextInput
            style={styles.addInput}
            value={newRole}
            onChangeText={setNewRole}
            placeholder="Role (optional)"
            placeholderTextColor={COLORS.tertiaryLabel}
          />
          <View style={styles.addFormActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setIsAdding(false); setNewName(''); setNewRole(''); }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !newName.trim() && styles.confirmBtnDisabled]}
              onPress={addPerson}
              disabled={!newName.trim()}
            >
              <Text style={styles.confirmBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
  },
  emptyText: { fontSize: 14, color: COLORS.tertiaryLabel },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '600', color: COLORS.systemBackground },
  personInfo: { flex: 1, gap: 2 },
  personName: { fontSize: 15, fontWeight: '500', color: COLORS.label },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.gray5,
    borderRadius: 6,
  },
  roleText: { fontSize: 11, fontWeight: '500', color: COLORS.secondaryLabel },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${COLORS.blue}30`,
    borderStyle: 'dashed',
  },
  addButtonText: { fontSize: 15, fontWeight: '500', color: COLORS.blue },
  addForm: {
    gap: 8,
    padding: 14,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
  },
  addInput: {
    fontSize: 15,
    color: COLORS.label,
    padding: 10,
    backgroundColor: COLORS.systemBackground,
    borderRadius: 8,
  },
  addFormActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  cancelBtnText: { fontSize: 14, color: COLORS.secondaryLabel, fontWeight: '500' },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.blue,
    borderRadius: 8,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.systemBackground },
});

export default WhoTab;
