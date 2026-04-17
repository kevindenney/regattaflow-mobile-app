/**
 * PrepChecklistSection - Section wrapper for checklist-based prep items
 *
 * Replaces TileSection + TileGrid with a vertical checklist layout.
 * Features a colored accent header with progress pill and completion state.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react-native';
import { PrepChecklistRow, SubItem } from './PrepChecklistRow';
import type { ChecklistItemWithState } from '@/hooks/useRaceChecklist';

export interface PrepChecklistItemConfig {
  item: ChecklistItemWithState;
  /** Compact status text shown inline */
  statusText?: string;
  statusColor?: string;
  /** Sub-items to display */
  subItems?: SubItem[];
  onToggleSubItem?: (subItemId: string) => void;
  /** Whether this item has a tool to open */
  hasTool?: boolean;
}

interface PrepChecklistSectionProps {
  title: string;
  subtitle: string;
  items: PrepChecklistItemConfig[];
  onToggle: (itemId: string) => void;
  onOpenTool: (item: ChecklistItemWithState) => void;
  isComplete: boolean;
  visible?: boolean;
  /** Extra content below the checklist (e.g., ConditionsBriefCard, CourseMapTile) */
  children?: React.ReactNode;
  /** Accent color for the section header (defaults to system blue) */
  accentColor?: string;
  /** Start collapsed (header-only). User can tap the header to expand. */
  defaultCollapsed?: boolean;
}

export function PrepChecklistSection({
  title,
  subtitle,
  items,
  onToggle,
  onOpenTool,
  isComplete,
  visible = true,
  children,
  accentColor = '#007AFF',
  defaultCollapsed = false,
}: PrepChecklistSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (!visible) return null;

  // Filter out null items (when findItem returns null)
  const validItems = items.filter((cfg) => cfg.item != null);
  if (validItems.length === 0 && !children) return null;

  // Compute progress
  const completedCount = validItems.filter((cfg) => cfg.item.isCompleted).length;
  const totalCount = validItems.length;

  // Auto-expand once the section has any progress — a collapsed section with
  // completed items would be misleading and hide state from the user.
  const isCollapsed = collapsed && completedCount === 0 && !isComplete;

  const renderHeader = () => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.accentDot, { backgroundColor: isComplete ? '#34C759' : accentColor }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
        {isComplete ? (
          <CheckCircle2 size={15} color="#34C759" />
        ) : totalCount > 0 ? (
          <View style={[styles.progressPill, completedCount > 0 && styles.progressPillActive]}>
            <Text style={[styles.progressPillText, completedCount > 0 && styles.progressPillTextActive]}>
              {completedCount}/{totalCount}
            </Text>
          </View>
        ) : null}
        {isCollapsed ? (
          <ChevronRight size={15} color="#8E8E93" />
        ) : (
          <ChevronDown size={15} color="#8E8E93" />
        )}
      </View>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.section}>
      {/* Section header (tappable) — collapses/expands the body */}
      <Pressable
        onPress={() => setCollapsed((c) => !c)}
        accessibilityRole="button"
        accessibilityLabel={`${title} section, ${isCollapsed ? 'expand' : 'collapse'}`}
        hitSlop={6}
      >
        {renderHeader()}
      </Pressable>

      {/* Body (checklist + extras) — hidden when collapsed */}
      {!isCollapsed && (
        <>
          {validItems.length > 0 && (
            <View style={[styles.checklistCard, isComplete && styles.checklistCardComplete]}>
              {validItems.map((cfg, idx) => (
                <PrepChecklistRow
                  key={cfg.item.id}
                  label={cfg.item.label}
                  isCompleted={cfg.item.isCompleted}
                  onToggle={() => onToggle(cfg.item.id)}
                  onOpenTool={() => onOpenTool(cfg.item)}
                  statusText={cfg.statusText}
                  statusColor={cfg.statusColor}
                  subItems={cfg.subItems}
                  onToggleSubItem={cfg.onToggleSubItem}
                  isLast={idx === validItems.length - 1}
                  hasTool={cfg.hasTool ?? !!cfg.item.toolId}
                />
              ))}
            </View>
          )}

          {/* Extra content below checklist */}
          {children}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionHeader: {
    gap: 3,
    paddingBottom: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  progressPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  progressPillActive: {
    backgroundColor: '#E8F5E9',
  },
  progressPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
  },
  progressPillTextActive: {
    color: '#2E7D32',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
    marginLeft: 15,
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D1D6',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  checklistCardComplete: {
    backgroundColor: '#F7FEF7',
    borderColor: '#D1FAE5',
  },
});
