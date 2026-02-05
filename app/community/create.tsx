/**
 * Create Community Screen
 *
 * Allows users to create a new community.
 * Communities can be general topics or linked to specific entities.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import { useCreateCommunity, useCommunityCategories } from '@/hooks/useCommunities';
import { COMMUNITY_TYPE_CONFIG, type CommunityType } from '@/types/community';

const COMMUNITY_TYPES: { type: CommunityType; description: string }[] = [
  { type: 'general', description: 'General sailing discussion' },
  { type: 'boat_class', description: 'A specific boat class (e.g., Laser, J/70)' },
  { type: 'race', description: 'A specific regatta or racing event' },
  { type: 'sailmaker', description: 'A sailmaker or sail brand' },
  { type: 'gear', description: 'Sailing gear and equipment' },
  { type: 'rules', description: 'Racing rules and regulations' },
  { type: 'tactics', description: 'Racing tactics and strategy' },
  { type: 'tuning', description: 'Boat tuning and setup' },
];

export default function CreateCommunityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [communityType, setCommunityType] = useState<CommunityType>('general');

  const { data: categories } = useCommunityCategories();
  const createCommunity = useCreateCommunity();

  const selectedTypeConfig = COMMUNITY_TYPE_CONFIG[communityType];

  // Find category for the selected type
  const getCategoryForType = useCallback((type: CommunityType) => {
    if (!categories) return null;
    const typeToCategory: Record<string, string> = {
      general: 'general',
      boat_class: 'boat_classes',
      race: 'events',
      sailmaker: 'sailmakers',
      gear: 'gear',
      rules: 'rules',
      tactics: 'rules',
      tuning: 'tuning',
      venue: 'locations',
    };
    return categories.find((c) => c.name === typeToCategory[type])?.id;
  }, [categories]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your community.');
      return;
    }

    if (name.trim().length < 3) {
      Alert.alert('Name Too Short', 'Community name must be at least 3 characters.');
      return;
    }

    try {
      triggerHaptic('impactMedium');
      const categoryId = getCategoryForType(communityType);

      const community = await createCommunity.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        community_type: communityType,
        category_id: categoryId || undefined,
      });

      triggerHaptic('notificationSuccess');

      // Navigate to the new community
      router.replace(`/community/${community.slug}`);
    } catch (error: any) {
      triggerHaptic('notificationError');
      const message = error?.message?.includes('duplicate')
        ? 'A community with this name already exists.'
        : 'Failed to create community. Please try again.';
      Alert.alert('Error', message);
    }
  }, [name, description, communityType, getCategoryForType, createCommunity, router]);

  const handleCancel = useCallback(() => {
    if (name.trim() || description.trim()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }, [name, description, router]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create Community',
          headerBackTitle: 'Cancel',
          headerLeft: () => (
            <Pressable onPress={handleCancel} hitSlop={8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleSubmit}
              disabled={createCommunity.isPending || !name.trim()}
              hitSlop={8}
            >
              {createCommunity.isPending ? (
                <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
              ) : (
                <Text
                  style={[
                    styles.submitText,
                    !name.trim() && styles.submitTextDisabled,
                  ]}
                >
                  Create
                </Text>
              )}
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          keyboardDismissMode="on-drag"
        >
          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COMMUNITY NAME</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter community name..."
              placeholderTextColor={IOS_COLORS.tertiaryLabel}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={100}
            />
            <Text style={styles.hint}>
              Choose a clear, descriptive name that people can easily find
            </Text>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="What is this community about?"
              placeholderTextColor={IOS_COLORS.tertiaryLabel}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* Community Type Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COMMUNITY TYPE</Text>
            <View style={styles.typeList}>
              {COMMUNITY_TYPES.map((item) => {
                const config = COMMUNITY_TYPE_CONFIG[item.type];
                const isSelected = communityType === item.type;
                return (
                  <Pressable
                    key={item.type}
                    style={[
                      styles.typeItem,
                      isSelected && styles.typeItemSelected,
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setCommunityType(item.type);
                    }}
                  >
                    <View
                      style={[
                        styles.typeIcon,
                        { backgroundColor: config.bgColor },
                        isSelected && { backgroundColor: config.color },
                      ]}
                    >
                      <Ionicons
                        name={config.icon as any}
                        size={20}
                        color={isSelected ? '#FFFFFF' : config.color}
                      />
                    </View>
                    <View style={styles.typeContent}>
                      <Text style={styles.typeLabel}>{config.label}</Text>
                      <Text style={styles.typeDescription}>{item.description}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={IOS_COLORS.systemBlue}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Preview */}
          {name.trim() && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PREVIEW</Text>
              <View style={styles.previewCard}>
                <View
                  style={[
                    styles.previewIcon,
                    { backgroundColor: selectedTypeConfig.bgColor },
                  ]}
                >
                  <Ionicons
                    name={selectedTypeConfig.icon as any}
                    size={24}
                    color={selectedTypeConfig.color}
                  />
                </View>
                <View style={styles.previewContent}>
                  <Text style={styles.previewName}>{name.trim()}</Text>
                  <Text style={styles.previewMeta}>
                    0 members · {selectedTypeConfig.label}
                  </Text>
                  {description.trim() && (
                    <Text style={styles.previewDescription} numberOfLines={2}>
                      {description.trim()}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  scrollContent: {
    padding: IOS_SPACING.lg,
  },
  cancelText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.systemBlue,
  },
  submitText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  submitTextDisabled: {
    color: IOS_COLORS.tertiaryLabel,
  },
  section: {
    marginBottom: IOS_SPACING.xl,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: IOS_SPACING.sm,
  },
  textInput: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: 12,
    fontSize: 16,
    color: IOS_COLORS.label,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
      default: {},
    }),
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.xs,
  },
  typeList: {
    gap: IOS_SPACING.sm,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.md,
  },
  typeItemSelected: {
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemBlue,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: IOS_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: IOS_SPACING.md,
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    ...IOS_TYPOGRAPHY.body,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  typeDescription: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.md,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: IOS_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: IOS_SPACING.md,
  },
  previewContent: {
    flex: 1,
  },
  previewName: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  previewMeta: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  previewDescription: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.xs,
  },
});
