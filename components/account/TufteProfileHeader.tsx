/**
 * TufteProfileHeader
 *
 * Dense profile header with avatar initials, name, email, home club/venue.
 * Supports inline editing - tap name or Edit link to edit in place.
 * No decorative elements - typography does the work.
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
import { tufteAccountStyles as styles, getInitials, formatMemberSince } from './accountStyles';
import { IOS_COLORS } from '@/components/cards/constants';
import { TufteTokens } from '@/constants/designSystem';

interface ProfileUpdates {
  full_name?: string;
  home_club?: string;
  home_venue?: string;
}

interface TufteProfileHeaderProps {
  name: string;
  email?: string;
  homeClub?: string;
  homeVenue?: string;
  memberSince?: string | Date | null;
  onSave?: (updates: ProfileUpdates) => Promise<void>;
  onEditPress?: () => void;
}

export function TufteProfileHeader({
  name,
  email,
  homeClub,
  homeVenue,
  memberSince,
  onSave,
  onEditPress,
}: TufteProfileHeaderProps) {
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

    // If unchanged, just exit edit mode
    if (trimmedValue === (currentValue || '')) {
      setEditingField(null);
      return;
    }

    setIsSaving(true);
    try {
      const updates: ProfileUpdates = {};
      if (editingField === 'name') {
        updates.full_name = trimmedValue;
      } else if (editingField === 'club') {
        updates.home_club = trimmedValue;
      } else if (editingField === 'venue') {
        updates.home_venue = trimmedValue;
      }
      await onSave(updates);
      setEditingField(null);
    } catch (error) {
      console.error('[TufteProfileHeader] Save error:', error);
      setEditingField(null);
    } finally {
      setIsSaving(false);
    }
  }, [editingField, editValue, name, homeClub, homeVenue, onSave]);

  const handleCancel = useCallback(() => {
    setEditingField(null);
    setEditValue('');
  }, []);

  // Build home location string
  const homeLocation = [homeClub, homeVenue].filter(Boolean).join(' · ');

  // Render editable field
  const renderEditableField = (
    field: 'name' | 'club' | 'venue',
    value: string | undefined,
    placeholder: string,
    textStyle: any
  ) => {
    if (editingField === field) {
      return (
        <View style={localStyles.editContainer}>
          <TextInput
            ref={inputRef}
            style={[localStyles.input, textStyle, isSaving && localStyles.inputSaving]}
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
            <ActivityIndicator
              size="small"
              color={IOS_COLORS.blue}
              style={localStyles.spinner}
            />
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => handleStartEdit(field)}
        disabled={!onSave || isSaving}
        activeOpacity={0.6}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Text style={[textStyle, !value && localStyles.placeholder]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.profileHeader}>
      <View style={styles.profileHeaderContent}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          {/* Name - editable */}
          {renderEditableField('name', name, 'Your Name', styles.profileName)}

          {/* Email - not editable */}
          {email ? <Text style={styles.profileEmail}>{email}</Text> : null}

          {/* Home location - club and venue editable */}
          {onSave ? (
            <View style={localStyles.locationContainer}>
              {/* Show combined placeholder when both empty, otherwise show individual fields */}
              {!homeClub && !homeVenue && editingField !== 'club' && editingField !== 'venue' ? (
                <TouchableOpacity
                  onPress={() => handleStartEdit('club')}
                  activeOpacity={0.6}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Text style={[localStyles.locationText, localStyles.placeholder]}>
                    Add home club & venue
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  {renderEditableField('club', homeClub, 'Home Club', localStyles.locationText)}
                  {/* Show separator only when both have values */}
                  {homeClub && homeVenue && (
                    <Text style={localStyles.locationSeparator}> · </Text>
                  )}
                  {/* Only show venue field if club has value or venue is being edited or has value */}
                  {(homeClub || homeVenue || editingField === 'venue') &&
                    renderEditableField('venue', homeVenue, 'Home Venue', localStyles.locationText)}
                </>
              )}
            </View>
          ) : homeLocation ? (
            <Text style={styles.profileMeta}>{homeLocation}</Text>
          ) : null}

          {/* Member since */}
          {memberSinceText ? <Text style={styles.profileMeta}>{memberSinceText}</Text> : null}
        </View>

        {/* Edit link - shows when not editing and either onSave or onEditPress provided */}
        {!editingField && (onSave || onEditPress) && (
          <TouchableOpacity
            onPress={() => {
              if (onSave) {
                handleStartEdit('name');
              } else if (onEditPress) {
                onEditPress();
              }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: IOS_COLORS.blue,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    minWidth: 120,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  inputSaving: {
    opacity: 0.6,
  },
  spinner: {
    marginLeft: 6,
  },
  placeholder: {
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  locationSeparator: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
  },
});
