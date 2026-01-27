/**
 * SimplifiedFeedHeader
 *
 * Compact feed header with sort dropdown + filter button (replaces the 3-row
 * CommunityFeedHeader). Used by VenueFeedSegment via CommunityFeed's
 * renderHeader prop.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { POST_TYPE_CONFIG } from '@/types/community-feed';
import type { FeedSortType, PostType, TopicTag } from '@/types/community-feed';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SORT_OPTIONS: { key: FeedSortType; label: string }[] = [
  { key: 'hot', label: 'Hot' },
  { key: 'new', label: 'New' },
  { key: 'rising', label: 'Rising' },
  { key: 'top', label: 'Top' },
  { key: 'conditions_match', label: 'Conditions Match' },
];

const POST_TYPES: (PostType | 'all')[] = ['all', 'tip', 'question', 'report', 'discussion', 'safety_alert'];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SimplifiedFeedHeaderProps {
  sort: FeedSortType;
  onSortChange: (sort: FeedSortType) => void;
  selectedPostType?: PostType;
  onPostTypeChange: (type: PostType | undefined) => void;
  topicTags: TopicTag[];
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  showConditionsSort?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SimplifiedFeedHeader({
  sort,
  onSortChange,
  selectedPostType,
  onPostTypeChange,
  topicTags,
  selectedTagIds,
  onTagToggle,
  showConditionsSort = false,
}: SimplifiedFeedHeaderProps) {
  const [showFilterModal, setShowFilterModal] = useState(false);

  const sortOptions = useMemo(
    () => (showConditionsSort ? SORT_OPTIONS : SORT_OPTIONS.filter(o => o.key !== 'conditions_match')),
    [showConditionsSort],
  );

  const currentSortLabel = sortOptions.find(o => o.key === sort)?.label ?? 'Hot';

  const activeFilterCount =
    (selectedPostType ? 1 : 0) + selectedTagIds.length;

  // -- Sort picker --
  const openSortPicker = useCallback(() => {
    if (Platform.OS === 'ios') {
      const labels = sortOptions.map(o => o.label);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, 'Cancel'],
          cancelButtonIndex: labels.length,
          title: 'Sort by',
        },
        (index) => {
          if (index < sortOptions.length) {
            onSortChange(sortOptions[index].key);
          }
        },
      );
    } else {
      // On Android/web, cycle through sort options
      const currentIndex = sortOptions.findIndex(o => o.key === sort);
      const nextIndex = (currentIndex + 1) % sortOptions.length;
      onSortChange(sortOptions[nextIndex].key);
    }
  }, [sort, sortOptions, onSortChange]);

  // -- Reset filters --
  const handleResetFilters = useCallback(() => {
    onPostTypeChange(undefined);
    selectedTagIds.forEach(tagId => onTagToggle(tagId));
  }, [onPostTypeChange, selectedTagIds, onTagToggle]);

  return (
    <>
      <View style={styles.container}>
        {/* Sort selector */}
        <Pressable style={styles.sortButton} onPress={openSortPicker}>
          <Text style={styles.sortLabel}>Sort: </Text>
          <Text style={styles.sortValue}>{currentSortLabel}</Text>
          <Ionicons name="chevron-down" size={14} color={IOS_COLORS.systemBlue} />
        </Pressable>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Filter button */}
        <Pressable style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="funnel-outline" size={16} color={IOS_COLORS.secondaryLabel} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Filter modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => { /* prevent close */ }}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              {activeFilterCount > 0 && (
                <Pressable onPress={handleResetFilters}>
                  <Text style={styles.resetText}>Reset</Text>
                </Pressable>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Post type section */}
              <Text style={styles.filterSectionTitle}>POST TYPE</Text>
              <View style={styles.chipsWrap}>
                {POST_TYPES.map((type) => {
                  const isAll = type === 'all';
                  const isSelected = isAll ? !selectedPostType : selectedPostType === type;
                  const config = isAll ? null : POST_TYPE_CONFIG[type as PostType];

                  return (
                    <Pressable
                      key={type}
                      style={[
                        styles.chip,
                        isSelected && {
                          backgroundColor: isAll ? IOS_COLORS.systemBlue + '18' : (config?.bgColor || '#F3F4F6'),
                          borderColor: isAll ? IOS_COLORS.systemBlue : (config?.color || '#D1D5DB'),
                        },
                      ]}
                      onPress={() => onPostTypeChange(isAll ? undefined : type as PostType)}
                    >
                      {config && (
                        <Ionicons
                          name={config.icon as any}
                          size={13}
                          color={isSelected ? config.color : IOS_COLORS.secondaryLabel}
                        />
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && {
                            color: isAll ? IOS_COLORS.systemBlue : (config?.color || IOS_COLORS.label),
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {isAll ? 'All Types' : config?.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Topic tags section */}
              {topicTags.length > 0 && (
                <>
                  <Text style={[styles.filterSectionTitle, { marginTop: 20 }]}>TOPICS</Text>
                  <View style={styles.chipsWrap}>
                    {topicTags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <Pressable
                          key={tag.id}
                          style={[
                            styles.chip,
                            isSelected && {
                              backgroundColor: `${tag.color || IOS_COLORS.systemBlue}18`,
                              borderColor: tag.color || IOS_COLORS.systemBlue,
                            },
                          ]}
                          onPress={() => onTagToggle(tag.id)}
                        >
                          {tag.icon && (
                            <Ionicons
                              name={tag.icon as any}
                              size={13}
                              color={isSelected ? (tag.color || IOS_COLORS.systemBlue) : IOS_COLORS.secondaryLabel}
                            />
                          )}
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && {
                                color: tag.color || IOS_COLORS.systemBlue,
                                fontWeight: '600',
                              },
                            ]}
                          >
                            {tag.display_name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Done button */}
            <Pressable
              style={styles.doneButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortLabel: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: -0.08,
  },
  sortValue: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
    letterSpacing: -0.08,
  },
  spacer: {
    flex: 1,
  },
  filterButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: IOS_COLORS.systemBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: '60%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: IOS_COLORS.systemGray3,
    alignSelf: 'center',
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  resetText: {
    fontSize: 15,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },
  modalBody: {
    paddingHorizontal: 16,
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
    letterSpacing: -0.08,
  },
  doneButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.systemBlue,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SimplifiedFeedHeader;
