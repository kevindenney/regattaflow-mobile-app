/**
 * PatientOverviewModule
 *
 * Displays assigned patients for a clinical shift with HIPAA-compliant
 * identifiers (initials + room number only). Shows key vitals summary
 * and phase-aware content: Prep shows anticipated interventions,
 * Clinical shows real-time status, Review shows shift summary.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Heart,
  Activity,
  Thermometer,
  Wind,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData, RacePhase } from '@/components/cards/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PatientOverviewModuleProps extends ContentModuleProps<CardRaceData> {}

interface PatientVitals {
  hr: number;
  bp: string;
  spo2: number;
  temp: number;
}

interface PatientData {
  id: string;
  room: string;
  initials: string;
  age: number;
  primaryDiagnosis: string;
  codeStatus: 'Full Code' | 'DNR' | 'DNR/DNI' | 'Comfort Care';
  vitals: PatientVitals;
  anticipatedInterventions: string[];
  clinicalStatus: 'stable' | 'guarded' | 'critical';
  medsAdministered: number;
  totalMeds: number;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_PATIENTS: PatientData[] = [
  {
    id: 'pt-1',
    room: '412-A',
    initials: 'M.R.',
    age: 67,
    primaryDiagnosis: 'CHF Exacerbation',
    codeStatus: 'Full Code',
    vitals: { hr: 88, bp: '142/86', spo2: 94, temp: 98.4 },
    anticipatedInterventions: ['Daily weight', 'I&O monitoring', 'Diuretic admin'],
    clinicalStatus: 'guarded',
    medsAdministered: 3,
    totalMeds: 5,
  },
  {
    id: 'pt-2',
    room: '414-B',
    initials: 'J.T.',
    age: 52,
    primaryDiagnosis: 'Post-op R Hip Arthroplasty (POD 1)',
    codeStatus: 'Full Code',
    vitals: { hr: 76, bp: '128/74', spo2: 97, temp: 99.1 },
    anticipatedInterventions: ['Pain assessment q4h', 'Ambulation assist', 'Dressing check'],
    clinicalStatus: 'stable',
    medsAdministered: 4,
    totalMeds: 4,
  },
  {
    id: 'pt-3',
    room: '416-A',
    initials: 'E.W.',
    age: 81,
    primaryDiagnosis: 'Pneumonia / COPD',
    codeStatus: 'DNR',
    vitals: { hr: 102, bp: '108/62', spo2: 91, temp: 100.8 },
    anticipatedInterventions: ['O2 titration', 'Resp assessment q2h', 'ABx admin'],
    clinicalStatus: 'critical',
    medsAdministered: 2,
    totalMeds: 6,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACCENT_TEAL = '#0097A7';

function getStatusColor(status: PatientData['clinicalStatus']): string {
  switch (status) {
    case 'stable':
      return IOS_COLORS.green;
    case 'guarded':
      return IOS_COLORS.orange;
    case 'critical':
      return IOS_COLORS.red;
  }
}

function getStatusLabel(status: PatientData['clinicalStatus']): string {
  switch (status) {
    case 'stable':
      return 'Stable';
    case 'guarded':
      return 'Guarded';
    case 'critical':
      return 'Critical';
  }
}

function getCodeStatusColor(code: PatientData['codeStatus']): string {
  if (code === 'Full Code') return '#6B7280';
  if (code === 'Comfort Care') return IOS_COLORS.purple;
  return IOS_COLORS.orange;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function VitalsRow({ vitals }: { vitals: PatientVitals }) {
  const spo2Warning = vitals.spo2 < 93;
  const tempWarning = vitals.temp >= 100.4;
  const hrWarning = vitals.hr > 100 || vitals.hr < 50;

  return (
    <View style={styles.vitalsRow}>
      <View style={styles.vitalItem}>
        <Heart size={11} color={hrWarning ? IOS_COLORS.red : '#9CA3AF'} />
        <Text style={[styles.vitalValue, hrWarning && styles.vitalWarning]}>
          {vitals.hr}
        </Text>
      </View>
      <View style={styles.vitalItem}>
        <Activity size={11} color="#9CA3AF" />
        <Text style={styles.vitalValue}>{vitals.bp}</Text>
      </View>
      <View style={styles.vitalItem}>
        <Wind size={11} color={spo2Warning ? IOS_COLORS.red : '#9CA3AF'} />
        <Text style={[styles.vitalValue, spo2Warning && styles.vitalWarning]}>
          {vitals.spo2}%
        </Text>
      </View>
      <View style={styles.vitalItem}>
        <Thermometer size={11} color={tempWarning ? IOS_COLORS.red : '#9CA3AF'} />
        <Text style={[styles.vitalValue, tempWarning && styles.vitalWarning]}>
          {vitals.temp}°
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function PatientOverviewModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: PatientOverviewModuleProps) {
  if (isCollapsed) return null;

  const patients = MOCK_PATIENTS;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ClipboardList size={14} color={ACCENT_TEAL} />
        <Text style={styles.headerTitle}>ASSIGNED PATIENTS</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{patients.length}</Text>
        </View>
      </View>

      {/* Patient Cards */}
      {patients.map((patient) => (
        <View key={patient.id} style={styles.patientCard}>
          {/* Top Row: Room, Initials, Diagnosis, Code Status */}
          <View style={styles.patientTopRow}>
            <View style={styles.roomBadge}>
              <Text style={styles.roomText}>{patient.room}</Text>
            </View>
            <Text style={styles.patientInitials}>{patient.initials}</Text>
            <Text style={styles.patientAge}>{patient.age}y</Text>
            <View style={{ flex: 1 }} />
            <View
              style={[
                styles.codeStatusBadge,
                { borderColor: getCodeStatusColor(patient.codeStatus) },
              ]}
            >
              <Text
                style={[
                  styles.codeStatusText,
                  { color: getCodeStatusColor(patient.codeStatus) },
                ]}
              >
                {patient.codeStatus}
              </Text>
            </View>
          </View>

          {/* Diagnosis */}
          <Text style={styles.diagnosisText} numberOfLines={1}>
            {patient.primaryDiagnosis}
          </Text>

          {/* Vitals */}
          <VitalsRow vitals={patient.vitals} />

          {/* Phase-specific content */}
          {phase === 'days_before' && (
            <View style={styles.phaseSection}>
              <Text style={styles.phaseSectionLabel}>ANTICIPATED INTERVENTIONS</Text>
              {patient.anticipatedInterventions.map((intervention, idx) => (
                <View key={idx} style={styles.interventionRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.interventionText}>{intervention}</Text>
                </View>
              ))}
            </View>
          )}

          {phase === 'on_water' && (
            <View style={styles.phaseSection}>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: getStatusColor(patient.clinicalStatus) },
                  ]}
                />
                <Text style={styles.statusText}>
                  {getStatusLabel(patient.clinicalStatus)}
                </Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.medProgressText}>
                  Meds: {patient.medsAdministered}/{patient.totalMeds}
                </Text>
              </View>
            </View>
          )}

          {phase === 'after_race' && (
            <View style={styles.phaseSection}>
              <View style={styles.summaryRow}>
                {patient.medsAdministered === patient.totalMeds ? (
                  <CheckCircle2 size={13} color={IOS_COLORS.green} />
                ) : (
                  <AlertTriangle size={13} color={IOS_COLORS.orange} />
                )}
                <Text style={styles.summaryText}>
                  {patient.medsAdministered}/{patient.totalMeds} meds administered
                </Text>
              </View>
            </View>
          )}
        </View>
      ))}
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

  // Patient card
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  patientTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomBadge: {
    backgroundColor: '#0097A715',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roomText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0097A7',
  },
  patientInitials: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  patientAge: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  codeStatusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  codeStatusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  diagnosisText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#1F2937',
  },

  // Vitals
  vitalsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
    paddingBottom: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vitalValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
  },
  vitalWarning: {
    color: IOS_COLORS.red,
    fontWeight: '600',
  },

  // Phase sections
  phaseSection: {
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
    gap: 4,
  },
  phaseSectionLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  interventionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0097A7',
  },
  interventionText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Clinical status
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  medProgressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
  },

  // Review summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
});

export default PatientOverviewModule;
