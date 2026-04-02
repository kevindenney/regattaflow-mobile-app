/**
 * CompetencyHeatmap - Color-coded grid of AACN domains × students.
 *
 * Y-axis: AACN domains
 * X-axis: Students
 * Cells: Color by domain achievement %
 *   Green (#10B981): ≥80%
 *   Yellow (#F59E0B): 50-79%
 *   Orange (#F97316): 25-49%
 *   Red (#EF4444): 1-24%
 *   Gray (#E5E7EB): 0%
 */

import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { CohortCompetencyMatrix } from '@/types/cohortCompetency';
import {
  achievementColor as cellColor,
  achievementTextColor as cellTextColor,
  statusCellColor as statusColor,
  statusAbbrev,
} from '@/lib/utils/competencyColors';

interface CompetencyHeatmapProps {
  matrix: CohortCompetencyMatrix;
  onStudentPress?: (userId: string) => void;
}

const CELL_SIZE = 28;
const LABEL_WIDTH = 140;

/** Wrap children with a native browser tooltip on web; passthrough on native. */
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  // On web, render a <div> with title attribute for native browser tooltip
  return React.createElement('div', { title: label, style: { display: 'contents' } }, children);
}

function initials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export function CompetencyHeatmap({ matrix, onStudentPress }: CompetencyHeatmapProps) {
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  if (matrix.students.length === 0 || matrix.domains.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No data to display</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color="#10B981" label="≥80%" />
        <LegendItem color="#F59E0B" label="50-79%" />
        <LegendItem color="#F97316" label="25-49%" />
        <LegendItem color="#EF4444" label="1-24%" />
        <LegendItem color="#E5E7EB" label="0%" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Student header row */}
          <View style={styles.headerRow}>
            <View style={[styles.labelCell, { width: LABEL_WIDTH }]} />
            {matrix.students.map(s => (
              <Tooltip key={s.userId} label={`${s.userName} — ${s.overallPercent}%`}>
                <TouchableOpacity
                  style={styles.headerCell}
                  onPress={() => onStudentPress?.(s.userId)}
                >
                  <Text style={styles.headerInitials}>{initials(s.userName)}</Text>
                  <Text style={styles.headerPercent}>{s.overallPercent}%</Text>
                </TouchableOpacity>
              </Tooltip>
            ))}
          </View>

          {/* Domain rows */}
          {matrix.domains.map(domain => (
            <React.Fragment key={domain.id}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => setExpandedDomain(expandedDomain === domain.id ? null : domain.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.labelCell, { width: LABEL_WIDTH }]}>
                  <Text style={styles.domainLabel} numberOfLines={2}>{domain.title}</Text>
                </View>
                {matrix.students.map(student => {
                  const achievement = student.byDomain[domain.id];
                  const pct = achievement?.percent ?? 0;
                  return (
                    <Tooltip key={student.userId} label={`${student.userName} — ${domain.title}: ${pct}%`}>
                      <TouchableOpacity
                        style={[styles.cell, { backgroundColor: cellColor(pct) }]}
                        onPress={() => onStudentPress?.(student.userId)}
                      >
                        <Text style={[styles.cellText, { color: cellTextColor(pct) }]}>
                          {pct > 0 ? pct : ''}
                        </Text>
                      </TouchableOpacity>
                    </Tooltip>
                  );
                })}
              </TouchableOpacity>

              {/* Expanded: show individual competencies within domain */}
              {expandedDomain === domain.id && (
                <View style={styles.expandedSection}>
                  {domain.competencyIds.map(compId => {
                    // Find competency title from first student's data
                    return (
                      <View key={compId} style={styles.compRow}>
                        <View style={[styles.labelCell, styles.compLabelCell, { width: LABEL_WIDTH }]}>
                          <Text style={styles.compLabel} numberOfLines={1}>
                            {getCompetencyTitle(compId, matrix)}
                          </Text>
                        </View>
                        {matrix.students.map(student => {
                          const status = student.byCompetency[compId] ?? 'not_started';
                          const compTitle = getCompetencyTitle(compId, matrix);
                          return (
                            <Tooltip key={student.userId} label={`${student.userName} — ${compTitle}: ${status.replace(/_/g, ' ')}`}>
                              <View style={[styles.compCell, { backgroundColor: statusColor(status) }]}>
                                <Text style={styles.compCellText}>{statusAbbrev(status)}</Text>
                              </View>
                            </Tooltip>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Helpers

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function getCompetencyTitle(compId: string, matrix: CohortCompetencyMatrix): string {
  return matrix.competencyTitles?.[compId] ?? compId.slice(0, 12) + '…';
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  emptyState: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#64748B' },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 11, color: '#64748B' },

  headerRow: { flexDirection: 'row', marginBottom: 2 },
  headerCell: {
    width: CELL_SIZE,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
  },
  headerInitials: { fontSize: 9, fontWeight: '700', color: '#334155' },
  headerPercent: { fontSize: 8, color: '#64748B' },

  row: { flexDirection: 'row', marginVertical: 1 },
  labelCell: { justifyContent: 'center', paddingRight: 8 },
  domainLabel: { fontSize: 11, fontWeight: '600', color: '#334155' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
  },
  cellText: { fontSize: 8, fontWeight: '700' },

  expandedSection: { paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: '#E2E8F0', marginVertical: 2 },
  compRow: { flexDirection: 'row', marginVertical: 1 },
  compLabelCell: { paddingLeft: 8 },
  compLabel: { fontSize: 10, color: '#64748B' },
  compCell: {
    width: CELL_SIZE,
    height: 20,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
  },
  compCellText: { fontSize: 7, fontWeight: '700', color: '#FFFFFF' },
});
