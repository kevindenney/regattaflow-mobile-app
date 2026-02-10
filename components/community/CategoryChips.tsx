/**
 * CategoryChips
 *
 * Horizontal scrolling category filter chips for community discovery.
 * Inspired by Reddit's category navigation.
 */

import React from 'react';
import {
  View,
  Text,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import type { CommunityCategory } from '@/types/community';

interface CategoryChipsProps {
  categories: CommunityCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  isLoading?: boolean;
}

export function CategoryChips({
  categories,
  selectedCategoryId,
  onSelectCategory,
  isLoading = false,
}: CategoryChipsProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={IOS_COLORS.systemGray3} />
      </View>
    );
  }

  const chips = (
    <>
      {/* All chip */}
      <Pressable
        onPress={() => {
          triggerHaptic('selection');
          onSelectCategory(null);
        }}
        style={({ pressed }) => [
          styles.chip,
          selectedCategoryId === null && styles.chipSelected,
          pressed && styles.chipPressed,
        ]}
      >
        <Ionicons
          name="grid-outline"
          size={16}
          color={selectedCategoryId === null ? '#FFFFFF' : IOS_COLORS.secondaryLabel}
        />
        <Text
          style={[
            styles.chipText,
            selectedCategoryId === null && styles.chipTextSelected,
          ]}
        >
          All
        </Text>
      </Pressable>

      {/* Category chips */}
      {categories.map((category) => {
        const isSelected = selectedCategoryId === category.id;
        return (
          <Pressable
            key={category.id}
            onPress={() => {
              triggerHaptic('selection');
              onSelectCategory(category.id);
            }}
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.chipSelected,
              isSelected && category.color && { backgroundColor: category.color },
              pressed && styles.chipPressed,
            ]}
          >
            {category.icon && (
              <Ionicons
                name={category.icon as any}
                size={16}
                color={isSelected ? '#FFFFFF' : category.color || IOS_COLORS.secondaryLabel}
              />
            )}
            <Text
              style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
                !isSelected && category.color && { color: category.color },
              ]}
            >
              {category.display_name}
            </Text>
          </Pressable>
        );
      })}
    </>
  );

  // On web, wrap chips to multiple rows; on native, horizontal scroll
  if (Platform.OS === 'web') {
    return <View style={styles.containerWrap}>{chips}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {chips}
    </ScrollView>
  );
}

/**
 * CategoryChipsExpanded
 *
 * Grid layout version for expanded category view.
 */
export function CategoryChipsExpanded({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: Omit<CategoryChipsProps, 'isLoading'>) {
  return (
    <View style={expandedStyles.container}>
      {/* All chip */}
      <Pressable
        onPress={() => {
          triggerHaptic('selection');
          onSelectCategory(null);
        }}
        style={({ pressed }) => [
          expandedStyles.chip,
          selectedCategoryId === null && expandedStyles.chipSelected,
          pressed && expandedStyles.chipPressed,
        ]}
      >
        <View style={expandedStyles.iconContainer}>
          <Ionicons
            name="grid-outline"
            size={24}
            color={selectedCategoryId === null ? IOS_COLORS.systemBlue : IOS_COLORS.secondaryLabel}
          />
        </View>
        <Text
          style={[
            expandedStyles.chipText,
            selectedCategoryId === null && expandedStyles.chipTextSelected,
          ]}
        >
          All
        </Text>
      </Pressable>

      {categories.map((category) => {
        const isSelected = selectedCategoryId === category.id;
        return (
          <Pressable
            key={category.id}
            onPress={() => {
              triggerHaptic('selection');
              onSelectCategory(category.id);
            }}
            style={({ pressed }) => [
              expandedStyles.chip,
              isSelected && expandedStyles.chipSelected,
              pressed && expandedStyles.chipPressed,
            ]}
          >
            <View
              style={[
                expandedStyles.iconContainer,
                category.color && { backgroundColor: `${category.color}20` },
              ]}
            >
              {category.icon && (
                <Ionicons
                  name={category.icon as any}
                  size={24}
                  color={category.color || IOS_COLORS.secondaryLabel}
                />
              )}
            </View>
            <Text
              style={[
                expandedStyles.chipText,
                isSelected && expandedStyles.chipTextSelected,
              ]}
            >
              {category.display_name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    flexDirection: 'row',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    gap: 8,
  },
  containerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    gap: 8,
  },
  loadingContainer: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: IOS_RADIUS.full,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  chipSelected: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});

const expandedStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: IOS_SPACING.lg,
    gap: 12,
  },
  chip: {
    alignItems: 'center',
    width: 80,
    padding: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.md,
  },
  chipSelected: {
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
  },
  chipPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: IOS_RADIUS.md,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  chipTextSelected: {
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
});

export default CategoryChips;
