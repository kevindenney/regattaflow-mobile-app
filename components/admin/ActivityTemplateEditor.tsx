/**
 * ActivityTemplateEditor — Admin UI for creating/editing activity templates.
 *
 * Used by org admins and coaches to publish activity templates
 * that appear in their followers' activity catalogs.
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Save, X, Plus, Tag } from 'lucide-react-native';
import type {
  ActivityTemplate,
  CreateActivityTemplateInput,
  UpdateActivityTemplateInput,
  PublisherType,
} from '@/types/activities';

const COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#C7C7CC',
  blue: '#007AFF',
  red: '#FF3B30',
  green: '#34C759',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  systemBackground: '#FFFFFF',
};

interface ActivityTemplateEditorProps {
  /** Existing template for editing, or undefined for creating new */
  template?: ActivityTemplate;
  /** Publisher context */
  publisherType: PublisherType;
  publisherId: string;
  interestId: string;
  /** Available event types for this interest */
  eventTypes: Array<{ id: string; label: string }>;
  /** Callbacks */
  onSave: (input: CreateActivityTemplateInput | UpdateActivityTemplateInput) => Promise<void>;
  onCancel: () => void;
}

export function ActivityTemplateEditor({
  template,
  publisherType,
  publisherId,
  interestId,
  eventTypes,
  onSave,
  onCancel,
}: ActivityTemplateEditorProps) {
  const isEditing = !!template;
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(template?.title ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [eventType, setEventType] = useState(template?.eventType ?? eventTypes[0]?.id ?? '');
  const [location, setLocation] = useState(template?.location ?? '');
  const [published, setPublished] = useState(template?.published ?? true);
  const [tags, setTags] = useState<string[]>(template?.tags ?? []);
  const [newTag, setNewTag] = useState('');

  const addTag = useCallback(() => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags([...tags, newTag.trim()]);
    setNewTag('');
  }, [newTag, tags]);

  const removeTag = useCallback(
    (index: number) => setTags(tags.filter((_, i) => i !== index)),
    [tags],
  );

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isEditing) {
        const input: UpdateActivityTemplateInput = {
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          tags,
          published,
        };
        await onSave(input);
      } else {
        const input: CreateActivityTemplateInput = {
          publisherType,
          publisherId,
          interestId,
          eventType,
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          tags,
        };
        await onSave(input);
      }
    } finally {
      setSaving(false);
    }
  }, [
    isEditing, title, description, eventType, location, tags, published,
    publisherType, publisherId, interestId, onSave,
  ]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <X size={20} color={COLORS.secondaryLabel} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Template' : 'New Template'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !title.trim()}
          style={{ opacity: !title.trim() ? 0.4 : 1 }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.blue} />
          ) : (
            <Save size={20} color={COLORS.blue} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>TITLE</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Activity title"
            placeholderTextColor={COLORS.tertiaryLabel}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the activity..."
            placeholderTextColor={COLORS.tertiaryLabel}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Event type */}
        {!isEditing && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>EVENT TYPE</Text>
            <View style={styles.typeRow}>
              {eventTypes.map((et) => (
                <TouchableOpacity
                  key={et.id}
                  style={[styles.typeChip, eventType === et.id && styles.typeChipSelected]}
                  onPress={() => setEventType(et.id)}
                >
                  <Text
                    style={[styles.typeChipText, eventType === et.id && styles.typeChipTextSelected]}
                  >
                    {et.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Location */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>LOCATION</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Where?"
            placeholderTextColor={COLORS.tertiaryLabel}
          />
        </View>

        {/* Tags */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>TAGS</Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag, i) => (
              <View key={`${tag}-${i}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(i)}>
                  <X size={12} color={COLORS.secondaryLabel} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.addTagRow}>
            <TextInput
              style={[styles.input, styles.addTagInput]}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add tag..."
              placeholderTextColor={COLORS.tertiaryLabel}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addTagBtn} onPress={addTag} disabled={!newTag.trim()}>
              <Plus size={16} color={COLORS.blue} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Published toggle */}
        {isEditing && (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Published</Text>
            <Switch
              value={published}
              onValueChange={setPublished}
              trackColor={{ false: COLORS.gray5, true: COLORS.green }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.systemBackground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray5,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: COLORS.label },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 20 },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    fontSize: 15,
    color: COLORS.label,
    padding: 12,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
  },
  multiline: { minHeight: 80, paddingTop: 12 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.gray6,
    borderRadius: 8,
  },
  typeChipSelected: { backgroundColor: COLORS.blue },
  typeChipText: { fontSize: 14, fontWeight: '500', color: COLORS.label },
  typeChipTextSelected: { color: COLORS.systemBackground },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.gray6,
    borderRadius: 6,
  },
  tagText: { fontSize: 13, color: COLORS.label },
  addTagRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  addTagInput: { flex: 1 },
  addTagBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
  },
  switchLabel: { fontSize: 15, fontWeight: '500', color: COLORS.label },
});

export default ActivityTemplateEditor;
