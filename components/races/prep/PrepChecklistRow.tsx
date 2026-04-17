/**
 * PrepChecklistRow - Single checklist item for the prep tab
 *
 * Apple-style interaction pattern:
 * - Checkbox toggles completion (left side, separate tap target)
 * - Tapping the row body opens the tool sheet (if hasTool)
 * - Wrench disclosure icon on the right signals "opens a tool"
 * - Expandable sub-items with indented checkboxes
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Check, Wrench, ChevronDown, ChevronRight } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface SubItem {
  id: string;
  label: string;
  isCompleted: boolean;
}

interface PrepChecklistRowProps {
  label: string;
  isCompleted: boolean;
  onToggle: () => void;
  onOpenTool?: () => void;
  /** Compact status text shown to the right of the label */
  statusText?: string;
  statusColor?: string;
  /** Sub-items rendered as indented checklist rows */
  subItems?: SubItem[];
  onToggleSubItem?: (subItemId: string) => void;
  /** Whether this is the last item in the section */
  isLast?: boolean;
  /** Whether the item has a tool to open */
  hasTool?: boolean;
}

export function PrepChecklistRow({
  label,
  isCompleted,
  onToggle,
  onOpenTool,
  statusText,
  statusColor = '#8E8E93',
  subItems,
  onToggleSubItem,
  isLast = false,
  hasTool = false,
}: PrepChecklistRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasSubItems = subItems && subItems.length > 0;

  const handleToggle = useCallback(() => {
    triggerHaptic('impactLight');
    onToggle();
  }, [onToggle]);

  const handleOpenTool = useCallback(() => {
    triggerHaptic('impactLight');
    onOpenTool?.();
  }, [onOpenTool]);

  const handleToggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const handleSubItemToggle = useCallback(
    (subItemId: string) => {
      triggerHaptic('impactLight');
      onToggleSubItem?.(subItemId);
    },
    [onToggleSubItem],
  );

  return (
    <View>
      <View style={[styles.row, !isLast && !expanded && styles.rowBorder]}>
        {/* Checkbox */}
        <Pressable
          onPress={handleToggle}
          style={styles.checkboxHit}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
        >
          <View style={[styles.checkbox, isCompleted && styles.checkboxChecked]}>
            {isCompleted && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
          </View>
        </Pressable>

        {/* Label + status — tapping opens tool if available */}
        <Pressable
          onPress={hasTool ? handleOpenTool : handleToggle}
          style={({ pressed }) => [
            styles.labelArea,
            hasTool && pressed && styles.labelAreaPressed,
          ]}
          accessibilityLabel={hasTool ? `Open ${label} tool` : label}
          accessibilityRole={hasTool ? 'button' : 'none'}
        >
          <Text
            style={[styles.label, isCompleted && styles.labelCompleted]}
            numberOfLines={2}
          >
            {label}
          </Text>
          {statusText ? (
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}14` }]}>
              <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1}>
                {statusText}
              </Text>
            </View>
          ) : !isCompleted && hasTool ? (
            <Text style={styles.hintText}>Tap to open</Text>
          ) : null}
        </Pressable>

        {/* Sub-item expand chevron — only when no tool (tool handles sub-items) */}
        {hasSubItems && !hasTool && (
          <Pressable onPress={handleToggleExpand} style={styles.chevronHit}>
            {expanded ? (
              <ChevronDown size={16} color="#8E8E93" />
            ) : (
              <ChevronRight size={16} color="#C7C7CC" />
            )}
          </Pressable>
        )}

        {/* Tool disclosure — wrench icon, tapping opens tool */}
        {hasTool && onOpenTool && (
          <Pressable
            onPress={handleOpenTool}
            style={styles.toolDisclosure}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          >
            <Wrench
              size={14}
              color={isCompleted ? '#C7C7CC' : '#007AFF'}
              strokeWidth={2}
            />
          </Pressable>
        )}
      </View>

      {/* Sub-items */}
      {hasSubItems && expanded && (
        <View style={styles.subItemsContainer}>
          {subItems.map((sub, idx) => (
            <View
              key={sub.id}
              style={[
                styles.subItemRow,
                idx < subItems.length - 1 && styles.subItemBorder,
              ]}
            >
              <Pressable
                onPress={() => handleSubItemToggle(sub.id)}
                style={styles.checkboxHit}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: sub.isCompleted }}
              >
                <View
                  style={[
                    styles.subCheckbox,
                    sub.isCompleted && styles.checkboxChecked,
                  ]}
                >
                  {sub.isCompleted && (
                    <Check size={10} color="#FFFFFF" strokeWidth={3} />
                  )}
                </View>
              </Pressable>
              <Text
                style={[
                  styles.subLabel,
                  sub.isCompleted && styles.labelCompleted,
                ]}
                numberOfLines={1}
              >
                {sub.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  gray: '#8E8E93',
  gray5: '#E5E5EA',
  label: '#000000',
  secondaryLabel: '#3C3C43',
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 8,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F2F2F7',
  },
  checkboxHit: {
    padding: 10,
    margin: -6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  subCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  labelArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  labelAreaPressed: {
    backgroundColor: '#F2F2F7',
  },
  label: {
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.label,
    flexShrink: 1,
    flexGrow: 1,
  },
  labelCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.gray,
  },
  hintText: {
    fontSize: 12,
    color: '#C7C7CC',
    fontWeight: '400',
    flexShrink: 0,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
    maxWidth: 120,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chevronHit: {
    padding: 4,
  },
  toolDisclosure: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subItemsContainer: {
    marginLeft: 40,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E5EA',
    marginBottom: 4,
  },
  subItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 8,
  },
  subItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F2F2F7',
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.secondaryLabel,
    flex: 1,
  },
});
