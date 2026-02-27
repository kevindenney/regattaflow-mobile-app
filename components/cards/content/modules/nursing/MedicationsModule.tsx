/**
 * MedicationsModule
 *
 * Displays medications for assigned patients during a clinical shift.
 * Includes high-alert medication flagging (insulin, heparin, etc.),
 * a "6 Rights" reminder banner, and phase-aware views: Prep shows
 * the full med list, Clinical shows upcoming meds, Review shows
 * medications administered.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Pill,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Info,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData, RacePhase } from '@/components/cards/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MedicationsModuleProps extends ContentModuleProps<CardRaceData> {}

interface MedicationData {
  id: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  timeDue: string;
  patientInitials: string;
  room: string;
  isHighAlert: boolean;
  highAlertReason?: string;
  administered: boolean;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_MEDICATIONS: MedicationData[] = [
  {
    id: 'med-1',
    name: 'Furosemide',
    dose: '40 mg',
    route: 'IV Push',
    frequency: 'BID',
    timeDue: '0800',
    patientInitials: 'M.R.',
    room: '412-A',
    isHighAlert: false,
    administered: true,
  },
  {
    id: 'med-2',
    name: 'Heparin',
    dose: '5,000 units',
    route: 'SubQ',
    frequency: 'q12h',
    timeDue: '0900',
    patientInitials: 'M.R.',
    room: '412-A',
    isHighAlert: true,
    highAlertReason: 'Anticoagulant - verify dose with second nurse',
    administered: true,
  },
  {
    id: 'med-3',
    name: 'Ketorolac',
    dose: '15 mg',
    route: 'IV',
    frequency: 'q6h PRN',
    timeDue: '1000',
    patientInitials: 'J.T.',
    room: '414-B',
    isHighAlert: false,
    administered: false,
  },
  {
    id: 'med-4',
    name: 'Insulin Lispro',
    dose: 'per sliding scale',
    route: 'SubQ',
    frequency: 'AC meals',
    timeDue: '1130',
    patientInitials: 'J.T.',
    room: '414-B',
    isHighAlert: true,
    highAlertReason: 'Insulin - check blood glucose before admin',
    administered: false,
  },
  {
    id: 'med-5',
    name: 'Ceftriaxone',
    dose: '1 g',
    route: 'IVPB',
    frequency: 'q24h',
    timeDue: '1400',
    patientInitials: 'E.W.',
    room: '416-A',
    isHighAlert: false,
    administered: false,
  },
  {
    id: 'med-6',
    name: 'Albuterol',
    dose: '2.5 mg',
    route: 'Nebulizer',
    frequency: 'q4h PRN',
    timeDue: '1200',
    patientInitials: 'E.W.',
    room: '416-A',
    isHighAlert: false,
    administered: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACCENT_TEAL = '#0097A7';

function getMedsForPhase(phase: RacePhase): MedicationData[] {
  switch (phase) {
    case 'days_before':
      return MOCK_MEDICATIONS;
    case 'on_water':
      return MOCK_MEDICATIONS.filter((m) => !m.administered);
    case 'after_race':
      return MOCK_MEDICATIONS.filter((m) => m.administered);
    default:
      return MOCK_MEDICATIONS;
  }
}

function getPhaseLabel(phase: RacePhase): string {
  switch (phase) {
    case 'days_before':
      return 'FULL MEDICATION LIST';
    case 'on_water':
      return 'UPCOMING MEDICATIONS';
    case 'after_race':
      return 'MEDICATIONS ADMINISTERED';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function MedicationsModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: MedicationsModuleProps) {
  if (isCollapsed) return null;

  const meds = getMedsForPhase(phase);
  const highAlertCount = MOCK_MEDICATIONS.filter((m) => m.isHighAlert).length;
  const administeredCount = MOCK_MEDICATIONS.filter((m) => m.administered).length;

  return (
    <View style={styles.container}>
      {/* 6 Rights Reminder */}
      <View style={styles.rightsBanner}>
        <ShieldAlert size={14} color={ACCENT_TEAL} />
        <View style={styles.rightsBannerContent}>
          <Text style={styles.rightsBannerTitle}>6 Rights Check</Text>
          <Text style={styles.rightsBannerText}>
            Right Patient, Drug, Dose, Route, Time, Documentation
          </Text>
        </View>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Pill size={14} color={ACCENT_TEAL} />
        <Text style={styles.sectionLabel}>{getPhaseLabel(phase)}</Text>
        <View style={{ flex: 1 }} />
        {highAlertCount > 0 && (
          <View style={styles.highAlertCountBadge}>
            <AlertTriangle size={10} color="#B45309" />
            <Text style={styles.highAlertCountText}>
              {highAlertCount} high-alert
            </Text>
          </View>
        )}
      </View>

      {/* Progress (review phase) */}
      {phase === 'after_race' && (
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(administeredCount / MOCK_MEDICATIONS.length) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {administeredCount}/{MOCK_MEDICATIONS.length}
          </Text>
        </View>
      )}

      {/* Medication List */}
      {meds.length === 0 ? (
        <View style={styles.emptyState}>
          <CheckCircle2 size={20} color={IOS_COLORS.green} />
          <Text style={styles.emptyText}>All medications administered</Text>
        </View>
      ) : (
        <View style={styles.medsList}>
          {meds.map((med) => (
            <View
              key={med.id}
              style={[
                styles.medCard,
                med.isHighAlert && styles.medCardHighAlert,
              ]}
            >
              {/* High Alert Badge */}
              {med.isHighAlert && (
                <View style={styles.highAlertBadge}>
                  <AlertTriangle size={10} color="#B45309" />
                  <Text style={styles.highAlertText}>HIGH-ALERT</Text>
                </View>
              )}

              {/* Med Info Row */}
              <View style={styles.medTopRow}>
                <Text style={styles.medName}>{med.name}</Text>
                <View style={{ flex: 1 }} />
                <View style={styles.roomTag}>
                  <Text style={styles.roomTagText}>
                    {med.room} {med.patientInitials}
                  </Text>
                </View>
              </View>

              {/* Dose, Route, Frequency */}
              <View style={styles.medDetailsRow}>
                <Text style={styles.medDetail}>{med.dose}</Text>
                <View style={styles.detailDivider} />
                <Text style={styles.medDetail}>{med.route}</Text>
                <View style={styles.detailDivider} />
                <Text style={styles.medDetail}>{med.frequency}</Text>
              </View>

              {/* Time Due */}
              <View style={styles.medTimeRow}>
                <Clock size={11} color="#9CA3AF" />
                <Text style={styles.medTimeText}>Due: {med.timeDue}</Text>
                {med.administered && (
                  <View style={styles.administeredBadge}>
                    <CheckCircle2 size={11} color={IOS_COLORS.green} />
                    <Text style={styles.administeredText}>Given</Text>
                  </View>
                )}
              </View>

              {/* High Alert Reason */}
              {med.isHighAlert && med.highAlertReason && (
                <View style={styles.highAlertReasonRow}>
                  <Info size={10} color="#B45309" />
                  <Text style={styles.highAlertReasonText}>
                    {med.highAlertReason}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
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

  // Rights Banner
  rightsB: {},
  rightsBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#0097A708',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0097A7',
  },
  rightsBannerContent: {
    flex: 1,
    gap: 2,
  },
  rightsBannerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0097A7',
  },
  rightsBannerText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 15,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  highAlertCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  highAlertCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309',
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.green,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Med list
  medsList: {
    gap: 8,
  },
  medCard: {
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
  medCardHighAlert: {
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },

  // High alert badge
  highAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  highAlertText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.5,
  },

  // Med top row
  medTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  roomTag: {
    backgroundColor: '#0097A710',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roomTagText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#0097A7',
  },

  // Med details
  medDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  medDetail: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
  },
  detailDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
  },

  // Time row
  medTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  medTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    fontVariant: ['tabular-nums'],
  },
  administeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 8,
  },
  administeredText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.green,
  },

  // High alert reason
  highAlertReasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#FDE68A',
  },
  highAlertReasonText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#92400E',
    flex: 1,
    lineHeight: 15,
  },
});

export default MedicationsModule;
