/**
 * SailSelector Component
 *
 * A dropdown picker for selecting sails from boat inventory.
 * Shows sail name, manufacturer, and condition rating.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/Colors';
import type { SailInventoryItem } from '@/types/raceIntentions';
import { formatSailDisplayName, getSailConditionColor } from '@/hooks/useSailInventory';

interface SailSelectorProps {
  /** Label for the selector */
  label: string;
  /** Category of sail (for icon and empty state) */
  category: 'mainsail' | 'jib' | 'genoa' | 'spinnaker' | 'code_zero';
  /** Available sails to choose from */
  sails: SailInventoryItem[];
  /** Currently selected sail ID */
  selectedId?: string;
  /** Called when selection changes */
  onSelect: (sail: SailInventoryItem | null) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Placeholder when nothing selected */
  placeholder?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  mainsail: 'sail-boat',
  jib: 'sail-boat',
  genoa: 'sail-boat',
  spinnaker: 'weather-windy',
  code_zero: 'weather-windy',
};

const CATEGORY_LABELS: Record<string, string> = {
  mainsail: 'Mainsail',
  jib: 'Jib',
  genoa: 'Genoa',
  spinnaker: 'Spinnaker',
  code_zero: 'Code Zero',
};

export function SailSelector({
  label,
  category,
  sails,
  selectedId,
  onSelect,
  disabled = false,
  placeholder,
}: SailSelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const selectedSail = selectedId
    ? sails.find((s) => s.id === selectedId)
    : null;

  const handlePress = useCallback(() => {
    if (!disabled && sails.length > 0) {
      setIsModalVisible(true);
    }
  }, [disabled, sails.length]);

  const handleSelect = useCallback(
    (sail: SailInventoryItem | null) => {
      onSelect(sail);
      setIsModalVisible(false);
    },
    [onSelect]
  );

  const renderSailItem = useCallback(
    ({ item }: { item: SailInventoryItem }) => {
      const isSelected = item.id === selectedId;
      const displayName = formatSailDisplayName(item);

      return (
        <TouchableOpacity
          style={[styles.sailItem, isSelected && styles.sailItemSelected]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          <View style={styles.sailItemLeft}>
            <MaterialCommunityIcons
              name={CATEGORY_ICONS[category] as any}
              size={20}
              color={isSelected ? colors.primary.default : colors.text.secondary}
            />
            <View style={styles.sailItemText}>
              <Text
                style={[
                  styles.sailItemName,
                  isSelected && styles.sailItemNameSelected,
                ]}
              >
                {displayName}
              </Text>
              {item.manufacturer && item.model && (
                <Text style={styles.sailItemDetail}>
                  {item.manufacturer} {item.model}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.sailItemRight}>
            {/* Condition Badge */}
            {item.conditionRating !== undefined && (
              <View
                style={[
                  styles.conditionBadge,
                  { backgroundColor: getSailConditionColor(item.conditionRating) + '20' },
                ]}
              >
                <View
                  style={[
                    styles.conditionDot,
                    { backgroundColor: getSailConditionColor(item.conditionRating) },
                  ]}
                />
                <Text
                  style={[
                    styles.conditionText,
                    { color: getSailConditionColor(item.conditionRating) },
                  ]}
                >
                  {item.conditionRating}%
                </Text>
              </View>
            )}

            {isSelected && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary.default}
              />
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [category, selectedId, handleSelect]
  );

  const emptySailsMessage =
    placeholder || `No ${CATEGORY_LABELS[category].toLowerCase()}s in inventory`;

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Selector Button */}
      <TouchableOpacity
        style={[
          styles.selector,
          disabled && styles.selectorDisabled,
          sails.length === 0 && styles.selectorEmpty,
        ]}
        onPress={handlePress}
        activeOpacity={disabled || sails.length === 0 ? 1 : 0.7}
      >
        <View style={styles.selectorLeft}>
          <MaterialCommunityIcons
            name={CATEGORY_ICONS[category] as any}
            size={18}
            color={selectedSail ? colors.primary.default : colors.text.tertiary}
          />
          <Text
            style={[
              styles.selectorText,
              !selectedSail && styles.selectorPlaceholder,
            ]}
            numberOfLines={1}
          >
            {selectedSail
              ? formatSailDisplayName(selectedSail)
              : sails.length === 0
              ? emptySailsMessage
              : 'Select...'}
          </Text>
        </View>

        {selectedSail?.conditionRating !== undefined && (
          <View
            style={[
              styles.miniConditionBadge,
              { backgroundColor: getSailConditionColor(selectedSail.conditionRating) + '20' },
            ]}
          >
            <Text
              style={[
                styles.miniConditionText,
                { color: getSailConditionColor(selectedSail.conditionRating) },
              ]}
            >
              {selectedSail.conditionRating}%
            </Text>
          </View>
        )}

        {sails.length > 0 && (
          <Ionicons
            name="chevron-down"
            size={18}
            color={colors.text.tertiary}
          />
        )}
      </TouchableOpacity>

      {/* Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select {CATEGORY_LABELS[category]}</Text>
            <TouchableOpacity
              onPress={() => handleSelect(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.modalClear}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Sail List */}
          <FlatList
            data={sails}
            renderItem={renderSailItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.sailList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="sail-boat-sink"
                  size={48}
                  color={colors.text.tertiary}
                />
                <Text style={styles.emptyText}>
                  No {CATEGORY_LABELS[category].toLowerCase()}s found
                </Text>
                <Text style={styles.emptyHint}>
                  Add sails to your boat's inventory
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.default,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  selectorDisabled: {
    backgroundColor: colors.background.elevated,
    opacity: 0.6,
  },
  selectorEmpty: {
    borderStyle: 'dashed',
  },
  selectorLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  selectorPlaceholder: {
    color: colors.text.tertiary,
  },
  miniConditionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniConditionText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Modal styles
  modal: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  modalClear: {
    fontSize: 16,
    color: colors.error.default,
  },
  sailList: {
    padding: 16,
  },
  separator: {
    height: 8,
  },
  sailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sailItemSelected: {
    borderColor: colors.primary.default,
    backgroundColor: colors.primary.light,
  },
  sailItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sailItemText: {
    flex: 1,
  },
  sailItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sailItemNameSelected: {
    color: colors.primary.default,
  },
  sailItemDetail: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  sailItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
});
