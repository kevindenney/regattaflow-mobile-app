/**
 * Quick Action Drawer Component - Phase 2
 * Swipe-up drawer with mark rounding checklists and quick actions
 *
 * Features:
 * - Mark rounding checklist
 * - Voice note recording
 * - Quick strategy reminders
 * - Emergency protocols
 * - Fleet positions (if available)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import {
  CheckSquare,
  Square,
  Mic,
  AlertTriangle,
  Users,
  Flag,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface QuickActionDrawerProps {
  isExpanded?: boolean;
  onToggle?: () => void;
  onVoiceNote?: () => void;
  onEmergency?: () => void;
  nextMark?: {
    name: string;
    distance: number; // nautical miles
    bearing: number; // degrees
  };
  fleetPositions?: {
    ahead: number;
    behind: number;
    total: number;
  };
}

export function QuickActionDrawer({
  isExpanded = false,
  onToggle,
  onVoiceNote,
  onEmergency,
  nextMark,
  fleetPositions,
}: QuickActionDrawerProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', text: 'Check mark identification', completed: false },
    { id: '2', text: 'Plan rounding maneuver', completed: false },
    { id: '3', text: 'Set up boat trim', completed: false },
    { id: '4', text: 'Clear traffic around mark', completed: false },
    { id: '5', text: 'Execute rounding', completed: false },
  ]);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = checklist.filter((item) => item.completed).length;
  const progressPercent = (completedCount / checklist.length) * 100;

  return (
    <View style={[styles.container, isExpanded && styles.expanded]}>
      {/* Drag Handle */}
      <Pressable style={styles.header} onPress={onToggle}>
        <View style={styles.dragHandle} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Quick Actions</Text>
          {isExpanded ? (
            <ChevronDown size={20} color="#6B7280" />
          ) : (
            <ChevronUp size={20} color="#6B7280" />
          )}
        </View>
      </Pressable>

      {/* Collapsed Summary */}
      {!isExpanded && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Flag size={16} color="#3B82F6" />
            <Text style={styles.summaryText}>
              {nextMark ? `${nextMark.name}: ${nextMark.distance.toFixed(2)}nm` : 'No mark set'}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <CheckSquare size={16} color="#10B981" />
            <Text style={styles.summaryText}>
              {completedCount}/{checklist.length} tasks
            </Text>
          </View>
        </View>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Next Mark Info */}
          {nextMark && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Flag size={18} color="#3B82F6" />
                <Text style={styles.cardTitle}>Next Mark: {nextMark.name}</Text>
              </View>
              <View style={styles.markInfo}>
                <View style={styles.markStat}>
                  <Text style={styles.markStatValue}>{nextMark.distance.toFixed(2)}</Text>
                  <Text style={styles.markStatLabel}>nm</Text>
                </View>
                <View style={styles.markStat}>
                  <Text style={styles.markStatValue}>{Math.round(nextMark.bearing)}</Text>
                  <Text style={styles.markStatLabel}>degrees</Text>
                </View>
              </View>
            </View>
          )}

          {/* Mark Rounding Checklist */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <CheckSquare size={18} color="#10B981" />
              <Text style={styles.cardTitle}>Mark Rounding</Text>
              <View style={styles.progressBadge}>
                <Text style={styles.progressText}>{Math.round(progressPercent)}%</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progressPercent}%` }]}
              />
            </View>
            <View style={styles.checklist}>
              {checklist.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.checklistItem}
                  onPress={() => toggleChecklistItem(item.id)}
                >
                  {item.completed ? (
                    <CheckSquare size={20} color="#10B981" />
                  ) : (
                    <Square size={20} color="#9CA3AF" />
                  )}
                  <Text
                    style={[
                      styles.checklistText,
                      item.completed && styles.checklistTextCompleted,
                    ]}
                  >
                    {item.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Fleet Position */}
          {fleetPositions && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Users size={18} color="#F59E0B" />
                <Text style={styles.cardTitle}>Fleet Position</Text>
              </View>
              <View style={styles.fleetInfo}>
                <View style={styles.fleetStat}>
                  <Text style={styles.fleetStatValue}>{fleetPositions.ahead}</Text>
                  <Text style={styles.fleetStatLabel}>Ahead</Text>
                </View>
                <View style={styles.fleetDivider} />
                <View style={styles.fleetStat}>
                  <Text style={styles.fleetStatValue}>{fleetPositions.behind}</Text>
                  <Text style={styles.fleetStatLabel}>Behind</Text>
                </View>
                <View style={styles.fleetDivider} />
                <View style={styles.fleetStat}>
                  <Text style={styles.fleetStatValue}>{fleetPositions.total}</Text>
                  <Text style={styles.fleetStatLabel}>Total</Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.actionsGrid}>
            <Pressable style={styles.actionButton} onPress={onVoiceNote}>
              <Mic size={24} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Voice Note</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.emergencyButton]}
              onPress={onEmergency}
            >
              <AlertTriangle size={24} color="#DC2626" />
              <Text style={[styles.actionButtonText, styles.emergencyText]}>
                Emergency
              </Text>
            </Pressable>
          </View>

          {/* Strategy Reminders */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Strategy Reminders</Text>
            <View style={styles.reminderList}>
              <View style={styles.reminder}>
                <View style={[styles.reminderDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.reminderText}>Stay on lifted tack</Text>
              </View>
              <View style={styles.reminder}>
                <View style={[styles.reminderDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.reminderText}>Watch for current near mark</Text>
              </View>
              <View style={styles.reminder}>
                <View style={[styles.reminderDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.reminderText}>Wide approach if congested</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  expanded: {
    maxHeight: '80%',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  progressBadge: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3730A3',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  checklist: {
    gap: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checklistText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  checklistTextCompleted: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  markInfo: {
    flexDirection: 'row',
    gap: 24,
  },
  markStat: {
    alignItems: 'center',
  },
  markStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  markStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  fleetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  fleetStat: {
    alignItems: 'center',
  },
  fleetStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  fleetStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  fleetDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  emergencyButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  emergencyText: {
    color: '#991B1B',
  },
  reminderList: {
    gap: 12,
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reminderText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
});
