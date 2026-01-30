/**
 * ProfileCard
 *
 * Apple ID-style profile card rendered inside an IOSListSection.
 * Shows avatar initials, name, email, home club/venue, and a chevron.
 * Supports inline editing — tap the card row to start editing fields.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_TYPOGRAPHY, IOS_SPACING } from '@/lib/design-tokens-ios';
import { accountStyles, getInitials, formatMemberSince } from './accountStyles';
import { IOSListSection } from '@/components/ui/ios/IOSListSection';

interface ProfileUpdates {
  full_name?: string;
  home_club?: string;
  home_venue?: string;
}

interface ProfileCardProps {
  name: string;
  email?: string;
  homeClub?: string;
  homeVenue?: string;
  memberSince?: string | Date | null;
  onSave?: (updates: ProfileUpdates) => Promise<void>;
}

export function TufteProfileHeader({
  name,
  email,
  homeClub,
  homeVenue,
  memberSince,
  onSave,
}: ProfileCardProps) {
  const initials = getInitials(name);
  const memberSinceText = formatMemberSince(memberSince);

  // Inline editing state
  const [editingField, setEditingField] = useState<'name' | 'club' | 'venue' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleStartEdit = useCallback((field: 'name' | 'club' | 'venue') => {
    if (!onSave) return;
    const currentValue = field === 'name' ? name : field === 'club' ? homeClub : homeVenue;
    setEditValue(currentValue || '');
    setEditingField(field);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [name, homeClub, homeVenue, onSave]);

  const handleSave = useCallback(async () => {
    if (!editingField || !onSave) return;

    const trimmedValue = editValue.trim();
    const currentValue = editingField === 'name' ? name : editingField === 'club' ? homeClub : homeVenue;

    if (trimmedValue === (currentValue || '')) {
      setEditingField(null);
      return;
    }

    setIsSaving(true);
    try {
      const updates: ProfileUpdates = {};
      if (editingField === 'name') updates.full_name = trimmedValue;
      else if (editingField === 'club') updates.home_club = trimmedValue;
      else if (editingField === 'venue') updates.home_venue = trimmedValue;
      await onSave(updates);
      setEditingField(null);
    } catch (error) {
      console.error('[ProfileCard] Save error:', error);
      setEditingField(null);
    } finally {
      setIsSaving(false);
    }
  }, [editingField, editValue, name, homeClub, homeVenue, onSave]);

  const handleCardPress = useCallback(() => {
    if (onSave && !editingField) {
      handleStartEdit('name');
    }
  }, [onSave, editingField, handleStartEdit]);

  // Build subtitle
  const homeLocation = [homeClub, homeVenue].filter(Boolean).join(' \u00b7 ');
  const subtitleParts: string[] = [];
  if (email) subtitleParts.push(email);
  if (homeLocation) {
    subtitleParts.push(homeLocation);
  } else if (onSave) {
    subtitleParts.push('Add home club & venue');
  }

  // Render editing inline field
  const renderEditField = (field: 'name' | 'club' | 'venue', placeholder: string) => {
    if (editingField !== field) return null;
    return (
      <View style={localStyles.editContainer}>
        <TextInput
          ref={inputRef}
          style={[localStyles.editInput, isSaving && localStyles.editInputSaving]}
          value={editValue}
          onChangeText={setEditValue}
          onBlur={handleSave}
          onSubmitEditing={handleSave}
          placeholder={placeholder}
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
          returnKeyType="done"
          autoCapitalize="words"
          editable={!isSaving}
          selectTextOnFocus
        />
        {isSaving && (
          <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} style={{ marginLeft: 6 }} />
        )}
      </View>
    );
  };

  return (
    <IOSListSection footer={memberSinceText || undefined}>
      <TouchableOpacity
        style={accountStyles.profileCardRow}
        onPress={handleCardPress}
        activeOpacity={0.6}
        disabled={!!editingField}
      >
        {/* Avatar */}
        <View style={accountStyles.profileAvatar}>
          <Text style={accountStyles.profileAvatarText}>{initials}</Text>
        </View>

        {/* Text content */}
        <View style={accountStyles.profileTextContainer}>
          {editingField === 'name' ? (
            renderEditField('name', 'Your Name')
          ) : (
            <Text style={accountStyles.profileName} numberOfLines={1}>{name}</Text>
          )}

          {subtitleParts.map((part, i) => (
            <Text
              key={i}
              style={[
                accountStyles.profileSubtitle,
                part === 'Add home club & venue' && accountStyles.profilePlaceholder,
              ]}
              numberOfLines={1}
            >
              {part}
            </Text>
          ))}

          {/* Inline edit fields for club/venue when editing */}
          {editingField === 'club' && renderEditField('club', 'Home Club')}
          {editingField === 'venue' && renderEditField('venue', 'Home Venue')}
        </View>

        {/* Trailing chevron */}
        {!editingField && (
          <Ionicons name="chevron-forward" size={20} color={IOS_COLORS.tertiaryLabel} />
        )}
      </TouchableOpacity>
    </IOSListSection>
  );
}

const localStyles = StyleSheet.create({
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  editInput: {
    flex: 1,
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    color: IOS_COLORS.label,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemBlue,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  editInputSaving: {
    opacity: 0.6,
  },
});
