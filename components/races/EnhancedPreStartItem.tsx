/**
 * EnhancedPreStartItem
 *
 * Enhanced pre-start checklist item that allows users to specify HOW they will
 * accomplish each check, providing more context for race execution.
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Check, Edit3, X } from 'lucide-react-native';
import { getPreStartPlaceholder } from '@/lib/checklists/onWaterHelpers';
import type { PreStartSpecification } from '@/types/raceIntentions';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

interface EnhancedPreStartItemProps {
  /** Unique ID for this checklist item */
  itemId: string;
  /** Display label for the item */
  label: string;
  /** Whether the item is checked/completed */
  isCompleted: boolean;
  /** Current specification if set */
  specification?: PreStartSpecification;
  /** Called when checkbox is toggled */
  onToggle: (itemId: string) => void;
  /** Called when specification is updated */
  onUpdateSpecification: (itemId: string, spec: string) => void;
}

export function EnhancedPreStartItem({
  itemId,
  label,
  isCompleted,
  specification,
  onToggle,
  onUpdateSpecification,
}: EnhancedPreStartItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState(specification?.specification || '');

  const handleToggle = useCallback(() => {
    onToggle(itemId);
  }, [itemId, onToggle]);

  const handleExpandToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!isExpanded) {
      // Opening - reset input to current specification
      setInputValue(specification?.specification || '');
    }
    setIsExpanded(!isExpanded);
  }, [isExpanded, specification?.specification]);

  const handleSaveSpec = useCallback(() => {
    const trimmed = inputValue.trim();
    onUpdateSpecification(itemId, trimmed);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(false);
  }, [inputValue, itemId, onUpdateSpecification]);

  const handleClearSpec = useCallback(() => {
    setInputValue('');
    onUpdateSpecification(itemId, '');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(false);
  }, [itemId, onUpdateSpecification]);

  const hasSpecification = !!specification?.specification;
  const placeholder = getPreStartPlaceholder(itemId);

  return (
    <View style={styles.container}>
      {/* Main row */}
      <View style={styles.mainRow}>
        {/* Checkbox */}
        <Pressable onPress={handleToggle} hitSlop={8}>
          <View style={[styles.checkbox, isCompleted && styles.checkboxDone]}>
            {isCompleted && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </View>
        </Pressable>

        {/* Label and specification preview */}
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.label,
              isCompleted && styles.labelDone,
            ]}
          >
            {label}
          </Text>
          {hasSpecification && !isExpanded && (
            <Text style={styles.specificationPreview} numberOfLines={1}>
              → {specification!.specification}
            </Text>
          )}
        </View>

        {/* Edit/pencil button */}
        <Pressable
          onPress={handleExpandToggle}
          style={[
            styles.editButton,
            isExpanded && styles.editButtonActive,
            hasSpecification && !isExpanded && styles.editButtonWithSpec,
          ]}
          hitSlop={8}
        >
          {isExpanded ? (
            <X size={14} color={IOS_COLORS.gray} />
          ) : (
            <Edit3
              size={14}
              color={hasSpecification ? IOS_COLORS.blue : IOS_COLORS.gray}
            />
          )}
        </Pressable>
      </View>

      {/* Expanded input area */}
      {isExpanded && (
        <View style={styles.expandedArea}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={placeholder}
            placeholderTextColor={IOS_COLORS.gray}
            multiline={false}
            autoFocus={true}
            returnKeyType="done"
            onSubmitEditing={handleSaveSpec}
          />
          <View style={styles.buttonRow}>
            {hasSpecification && (
              <Pressable
                style={styles.clearButton}
                onPress={handleClearSpec}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.saveButton,
                !inputValue.trim() && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveSpec}
              disabled={!inputValue.trim() && !hasSpecification}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  !inputValue.trim() && styles.saveButtonTextDisabled,
                ]}
              >
                Save
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  contentContainer: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  labelDone: {
    color: IOS_COLORS.gray,
    textDecorationLine: 'line-through',
  },
  specificationPreview: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonActive: {
    backgroundColor: IOS_COLORS.gray5,
  },
  editButtonWithSpec: {
    backgroundColor: `${IOS_COLORS.blue}15`,
  },
  expandedArea: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  input: {
    fontSize: 15,
    fontWeight: '400',
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.gray6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.red,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.blue,
  },
  saveButtonDisabled: {
    backgroundColor: IOS_COLORS.gray5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    color: IOS_COLORS.gray,
  },
});

export default EnhancedPreStartItem;
