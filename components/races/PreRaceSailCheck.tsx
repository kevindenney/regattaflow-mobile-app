/**
 * PreRaceSailCheck
 *
 * Pre-race checklist section for sail condition.
 * Shows alerts for sails needing inspection before a race.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  Sailboat,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { SailInspectionService, SailAlert } from '@/services/SailInspectionService';
import { SailInspectionWizard } from '@/components/sail-inspection/SailInspectionWizard';
import { IOS_COLORS } from '@/components/cards/constants';

// =============================================================================
// Types
// =============================================================================

interface PreRaceSailCheckProps {
  boatId: string;
  raceId: string;
  onComplete?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function PreRaceSailCheck({ boatId, raceId, onComplete }: PreRaceSailCheckProps) {
  const [alerts, setAlerts] = useState<SailAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectingSail, setInspectingSail] = useState<SailAlert | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadAlerts = useCallback(async () => {
    if (!boatId) {
      setLoading(false);
      return;
    }

    try {
      const data = await SailInspectionService.getPreRaceInspectionAlerts(boatId, raceId);
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load sail alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [boatId, raceId]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleInspectionComplete = useCallback(() => {
    setInspectingSail(null);
    loadAlerts();
    onComplete?.();
  }, [loadAlerts, onComplete]);

  // Counts
  const criticalCount = alerts.filter(a => a.alertLevel === 'critical').length;
  const warningCount = alerts.filter(a => a.alertLevel === 'warning').length;
  const allGood = alerts.length === 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Sailboat size={20} color={IOS_COLORS.gray} />
          <Text style={styles.headerTitle}>Sail Check</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={IOS_COLORS.blue} />
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <TouchableOpacity
          style={styles.header}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            {allGood ? (
              <CheckCircle2 size={20} color={IOS_COLORS.green} />
            ) : criticalCount > 0 ? (
              <AlertTriangle size={20} color={IOS_COLORS.red} />
            ) : (
              <AlertTriangle size={20} color={IOS_COLORS.orange} />
            )}
            <Text style={styles.headerTitle}>Sail Check</Text>
          </View>

          <View style={styles.headerRight}>
            {allGood ? (
              <Text style={styles.statusGood}>All Good</Text>
            ) : (
              <View style={styles.badgeRow}>
                {criticalCount > 0 && (
                  <View style={[styles.badge, styles.badgeCritical]}>
                    <Text style={styles.badgeTextCritical}>{criticalCount}</Text>
                  </View>
                )}
                {warningCount > 0 && (
                  <View style={[styles.badge, styles.badgeWarning]}>
                    <Text style={styles.badgeTextWarning}>{warningCount}</Text>
                  </View>
                )}
              </View>
            )}
            <ChevronRight
              size={16}
              color={IOS_COLORS.gray}
              style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
            />
          </View>
        </TouchableOpacity>

        {/* Expanded Alert List */}
        {expanded && alerts.length > 0 && (
          <View style={styles.alertList}>
            {alerts.map((alert) => (
              <TouchableOpacity
                key={alert.equipmentId}
                style={styles.alertItem}
                onPress={() => setInspectingSail(alert)}
                activeOpacity={0.7}
              >
                <View style={styles.alertContent}>
                  <Text style={styles.alertName}>{alert.sailName}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                </View>
                <View style={styles.alertAction}>
                  <Text style={styles.inspectText}>Inspect</Text>
                  <ChevronRight size={14} color={IOS_COLORS.blue} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* All Good Message */}
        {expanded && allGood && (
          <View style={styles.allGoodContainer}>
            <Text style={styles.allGoodText}>
              All sails have been inspected recently and are in good condition.
            </Text>
          </View>
        )}
      </View>

      {/* Inspection Modal */}
      <Modal
        visible={!!inspectingSail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setInspectingSail(null)}
      >
        {inspectingSail && (
          <SailInspectionWizard
            equipmentId={inspectingSail.equipmentId}
            boatId={boatId}
            sailName={inspectingSail.sailName}
            inspectionType="pre_race"
            onComplete={handleInspectionComplete}
            onCancel={() => setInspectingSail(null)}
          />
        )}
      </Modal>
    </>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusGood: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.green,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeCritical: {
    backgroundColor: `${IOS_COLORS.red}20`,
  },
  badgeWarning: {
    backgroundColor: `${IOS_COLORS.orange}20`,
  },
  badgeTextCritical: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.red,
  },
  badgeTextWarning: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.orange,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  alertList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  alertContent: {
    flex: 1,
    gap: 2,
  },
  alertName: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  alertMessage: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  alertAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inspectText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  allGoodContainer: {
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  allGoodText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});

export default PreRaceSailCheck;
