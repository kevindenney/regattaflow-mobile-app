/**
 * ProceduresModule
 *
 * Lists clinical procedures expected for the shift, linked to the
 * competency framework. Shows supervised/independent status, priority,
 * and a "Log Attempt" button that navigates to the self-assessment flow.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Stethoscope,
  Shield,
  ChevronRight,
  ClipboardCheck,
} from 'lucide-react-native';
import { router } from 'expo-router';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProceduresModuleProps extends ContentModuleProps<CardRaceData> {}

interface ProcedureData {
  id: string;
  name: string;
  competencyNumber: string;
  competencyId: string;
  supervised: boolean;
  priority: 'high' | 'medium' | 'low';
  competencyStatus: 'not_started' | 'learning' | 'practicing' | 'checkoff_ready' | 'validated' | null;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_PROCEDURES: ProcedureData[] = [
  {
    id: 'proc-1',
    name: 'Peripheral IV Insertion',
    competencyNumber: 'CP-3.2',
    competencyId: 'comp-iv-insert',
    supervised: true,
    priority: 'high',
    competencyStatus: 'practicing',
  },
  {
    id: 'proc-2',
    name: 'Foley Catheter Insertion',
    competencyNumber: 'CP-4.1',
    competencyId: 'comp-foley',
    supervised: true,
    priority: 'medium',
    competencyStatus: 'learning',
  },
  {
    id: 'proc-3',
    name: 'Wound Assessment & Dressing Change',
    competencyNumber: 'CP-2.5',
    competencyId: 'comp-wound',
    supervised: false,
    priority: 'medium',
    competencyStatus: 'checkoff_ready',
  },
  {
    id: 'proc-4',
    name: 'Blood Glucose Monitoring',
    competencyNumber: 'AS-1.3',
    competencyId: 'comp-bg-monitor',
    supervised: false,
    priority: 'low',
    competencyStatus: 'validated',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACCENT_TEAL = '#0097A7';

function getPriorityColor(priority: ProcedureData['priority']): string {
  switch (priority) {
    case 'high':
      return IOS_COLORS.red;
    case 'medium':
      return IOS_COLORS.orange;
    case 'low':
      return '#6B7280';
  }
}

function getPriorityLabel(priority: ProcedureData['priority']): string {
  switch (priority) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Med';
    case 'low':
      return 'Low';
  }
}

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
}

function getCompetencyStatusConfig(
  status: ProcedureData['competencyStatus'],
): StatusConfig | null {
  switch (status) {
    case 'not_started':
      return { label: 'Not Started', color: '#9CA3AF', bg: '#F3F4F6' };
    case 'learning':
      return { label: 'Learning', color: '#2563EB', bg: '#EFF6FF' };
    case 'practicing':
      return { label: 'Practicing', color: '#7C3AED', bg: '#F5F3FF' };
    case 'checkoff_ready':
      return { label: 'Ready', color: '#D97706', bg: '#FFFBEB' };
    case 'validated':
      return { label: 'Validated', color: '#059669', bg: '#ECFDF5' };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ProceduresModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: ProceduresModuleProps) {
  if (isCollapsed) return null;

  const procedures = MOCK_PROCEDURES;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Stethoscope size={14} color={ACCENT_TEAL} />
        <Text style={styles.headerTitle}>CLINICAL PROCEDURES</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{procedures.length}</Text>
        </View>
      </View>

      {/* Procedure List */}
      <View style={styles.proceduresList}>
        {procedures.map((proc) => {
          const statusConfig = getCompetencyStatusConfig(proc.competencyStatus);

          return (
            <View key={proc.id} style={styles.procedureCard}>
              {/* Top Row */}
              <View style={styles.procTopRow}>
                {/* Priority dot */}
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: getPriorityColor(proc.priority) },
                  ]}
                />

                {/* Competency number badge */}
                <View style={styles.compNumberBadge}>
                  <Text style={styles.compNumberText}>
                    {proc.competencyNumber}
                  </Text>
                </View>

                {/* Supervised icon */}
                {proc.supervised && (
                  <View style={styles.supervisedBadge}>
                    <Shield size={11} color="#7C3AED" />
                    <Text style={styles.supervisedText}>Supervised</Text>
                  </View>
                )}
              </View>

              {/* Procedure Name */}
              <Text style={styles.procName} numberOfLines={2}>
                {proc.name}
              </Text>

              {/* Bottom Row: Status + Log Button */}
              <View style={styles.procBottomRow}>
                {/* Competency status badge */}
                {statusConfig && (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusConfig.bg },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: statusConfig.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusLabel,
                        { color: statusConfig.color },
                      ]}
                    >
                      {statusConfig.label}
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }} />

                {/* Log Attempt Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.logButton,
                    pressed && styles.logButtonPressed,
                  ]}
                  onPress={() =>
                    router.push(
                      `/self-assessment?competencyId=${proc.competencyId}`,
                    )
                  }
                >
                  <ClipboardCheck size={12} color={ACCENT_TEAL} />
                  <Text style={styles.logButtonText}>Log Attempt</Text>
                  <ChevronRight size={12} color={ACCENT_TEAL} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  countBadge: {
    backgroundColor: '#0097A710',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0097A7',
  },

  // Procedure list
  proceduresList: {
    gap: 8,
  },
  procedureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  // Top row
  procTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compNumberBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  compNumberText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },
  supervisedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F5F3FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  supervisedText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7C3AED',
  },

  // Procedure name
  procName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },

  // Bottom row
  procBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Log button
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0097A708',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#0097A720',
  },
  logButtonPressed: {
    opacity: 0.7,
    backgroundColor: '#0097A715',
  },
  logButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0097A7',
  },
});

export default ProceduresModule;
