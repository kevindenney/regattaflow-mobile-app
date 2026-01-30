/**
 * GearManagementSection - Boat maintenance and gear management
 *
 * Displays boats with health scores, maintenance logs, and
 * scheduled maintenance, similar to vehicle maintenance apps.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { BoatWithMaintenance, MaintenanceLog, MaintenanceType, MaintenanceStatus } from '@/hooks/useReflectProfile';

interface GearManagementSectionProps {
  boats: BoatWithMaintenance[];
  onBoatPress?: (boat: BoatWithMaintenance) => void;
  onMaintenancePress?: (log: MaintenanceLog) => void;
  onAddMaintenance?: (boatId: string) => void;
  onSeeAllMaintenance?: () => void;
}

// Map maintenance types to icons
function getMaintenanceIcon(type: MaintenanceType): keyof typeof Ionicons.glyphMap {
  const icons: Record<MaintenanceType, keyof typeof Ionicons.glyphMap> = {
    inspection: 'search',
    repair: 'construct',
    replacement: 'swap-horizontal',
    upgrade: 'arrow-up-circle',
    cleaning: 'water',
    tuning: 'options',
  };
  return icons[type] || 'build';
}

// Map maintenance types to colors
function getMaintenanceColor(type: MaintenanceType): string {
  const colors: Record<MaintenanceType, string> = {
    inspection: IOS_COLORS.systemBlue,
    repair: IOS_COLORS.systemOrange,
    replacement: IOS_COLORS.systemPurple,
    upgrade: IOS_COLORS.systemGreen,
    cleaning: IOS_COLORS.systemTeal,
    tuning: IOS_COLORS.systemIndigo,
  };
  return colors[type] || IOS_COLORS.systemGray;
}

// Get status color
function getStatusColor(status: MaintenanceStatus): string {
  const colors: Record<MaintenanceStatus, string> = {
    completed: IOS_COLORS.systemGreen,
    scheduled: IOS_COLORS.systemBlue,
    overdue: IOS_COLORS.systemRed,
  };
  return colors[status] || IOS_COLORS.systemGray;
}

// Get health score color
function getHealthColor(score: number): string {
  if (score >= 90) return IOS_COLORS.systemGreen;
  if (score >= 70) return IOS_COLORS.systemYellow;
  if (score >= 50) return IOS_COLORS.systemOrange;
  return IOS_COLORS.systemRed;
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format relative date
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
  return `In ${Math.ceil(diffDays / 30)} months`;
}

function HealthIndicator({ score }: { score: number }) {
  const color = getHealthColor(score);
  const percentage = score / 100;

  return (
    <View style={styles.healthIndicator}>
      <View style={styles.healthBarContainer}>
        <View
          style={[
            styles.healthBarFill,
            { width: `${score}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.healthScore, { color }]}>{score}%</Text>
    </View>
  );
}

function BoatCard({
  boat,
  onPress,
  onAddMaintenance,
}: {
  boat: BoatWithMaintenance;
  onPress?: () => void;
  onAddMaintenance?: () => void;
}) {
  const scheduledMaintenance = boat.maintenanceLogs.filter(
    (log) => log.status === 'scheduled' || log.status === 'overdue'
  );
  const hasOverdue = scheduledMaintenance.some((log) => log.status === 'overdue');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.boatCard,
        pressed && onPress && styles.boatCardPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Boat Header */}
      <View style={styles.boatHeader}>
        <View style={styles.boatIcon}>
          <Ionicons name="boat" size={24} color={IOS_COLORS.systemBlue} />
        </View>
        <View style={styles.boatInfo}>
          <View style={styles.boatNameRow}>
            <Text style={styles.boatName} numberOfLines={1}>
              {boat.name || boat.className}
            </Text>
            {boat.isPrimary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>Primary</Text>
              </View>
            )}
          </View>
          <Text style={styles.boatDetails}>
            {boat.className} {boat.sailNumber ? `• ${boat.sailNumber}` : ''}
          </Text>
        </View>
        {hasOverdue && (
          <View style={styles.alertBadge}>
            <Ionicons name="alert-circle" size={18} color={IOS_COLORS.systemRed} />
          </View>
        )}
      </View>

      {/* Health Score */}
      {boat.healthScore !== undefined && (
        <View style={styles.healthSection}>
          <Text style={styles.healthLabel}>Boat Health</Text>
          <HealthIndicator score={boat.healthScore} />
        </View>
      )}

      {/* Scheduled Maintenance */}
      {scheduledMaintenance.length > 0 && (
        <View style={styles.scheduledSection}>
          <Text style={styles.scheduledLabel}>Upcoming Maintenance</Text>
          {scheduledMaintenance.slice(0, 2).map((log) => (
            <View key={log.id} style={styles.scheduledItem}>
              <View
                style={[
                  styles.scheduledDot,
                  { backgroundColor: getStatusColor(log.status) },
                ]}
              />
              <Text style={styles.scheduledTitle} numberOfLines={1}>
                {log.title}
              </Text>
              <Text
                style={[
                  styles.scheduledDate,
                  { color: getStatusColor(log.status) },
                ]}
              >
                {formatRelativeDate(log.date)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>{boat.raceCount}</Text>
          <Text style={styles.quickStatLabel}>Races</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>{boat.maintenanceLogs.length}</Text>
          <Text style={styles.quickStatLabel}>Logs</Text>
        </View>
        {boat.totalMaintenanceCost !== undefined && (
          <>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>
                ${boat.totalMaintenanceCost.toLocaleString()}
              </Text>
              <Text style={styles.quickStatLabel}>Spent</Text>
            </View>
          </>
        )}
      </View>

      {/* Add Maintenance Button */}
      {onAddMaintenance && (
        <Pressable
          style={({ pressed }) => [
            styles.addMaintenanceButton,
            pressed && styles.addMaintenanceButtonPressed,
          ]}
          onPress={onAddMaintenance}
        >
          <Ionicons name="add" size={16} color={IOS_COLORS.systemBlue} />
          <Text style={styles.addMaintenanceText}>Add Maintenance</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

function MaintenanceLogItem({
  log,
  onPress,
}: {
  log: MaintenanceLog;
  onPress?: () => void;
}) {
  const icon = getMaintenanceIcon(log.type);
  const color = getMaintenanceColor(log.type);
  const statusColor = getStatusColor(log.status);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.logItem,
        pressed && onPress && styles.logItemPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.logIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.logContent}>
        <Text style={styles.logTitle} numberOfLines={1}>
          {log.title}
        </Text>
        {log.description && (
          <Text style={styles.logDescription} numberOfLines={1}>
            {log.description}
          </Text>
        )}
        <View style={styles.logMeta}>
          <Text style={styles.logDate}>{formatDate(log.date)}</Text>
          {log.cost !== undefined && (
            <Text style={styles.logCost}>${log.cost}</Text>
          )}
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {log.status === 'completed' ? 'Done' : log.status === 'scheduled' ? 'Upcoming' : 'Overdue'}
        </Text>
      </View>
    </Pressable>
  );
}

export function GearManagementSection({
  boats,
  onBoatPress,
  onMaintenancePress,
  onAddMaintenance,
  onSeeAllMaintenance,
}: GearManagementSectionProps) {
  const [selectedBoatIndex, setSelectedBoatIndex] = useState(0);

  // Get all maintenance logs sorted by date
  const allLogs = boats
    .flatMap((boat) =>
      boat.maintenanceLogs.map((log) => ({
        ...log,
        boatName: boat.name || boat.className,
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const recentLogs = allLogs.slice(0, 5);

  if (boats.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="boat" size={18} color={IOS_COLORS.systemBlue} />
            <Text style={styles.title}>Gear Management</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="boat-outline"
            size={40}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyText}>No boats registered</Text>
          <Text style={styles.emptySubtext}>
            Add a boat to start tracking maintenance
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="boat" size={18} color={IOS_COLORS.systemBlue} />
          <Text style={styles.title}>Gear Management</Text>
        </View>
        {onSeeAllMaintenance && (
          <Pressable
            onPress={onSeeAllMaintenance}
            style={({ pressed }) => [
              styles.seeMoreButton,
              pressed && styles.seeMoreButtonPressed,
            ]}
          >
            <Text style={styles.seeMoreText}>See All</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={IOS_COLORS.systemBlue}
            />
          </Pressable>
        )}
      </View>

      {/* Boat Selector (if multiple boats) */}
      {boats.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.boatSelector}
        >
          {boats.map((boat, index) => (
            <Pressable
              key={boat.id}
              style={[
                styles.boatTab,
                selectedBoatIndex === index && styles.boatTabSelected,
              ]}
              onPress={() => setSelectedBoatIndex(index)}
            >
              <Text
                style={[
                  styles.boatTabText,
                  selectedBoatIndex === index && styles.boatTabTextSelected,
                ]}
                numberOfLines={1}
              >
                {boat.name || boat.className}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Selected Boat Card */}
      <BoatCard
        boat={boats[selectedBoatIndex]}
        onPress={onBoatPress ? () => onBoatPress(boats[selectedBoatIndex]) : undefined}
        onAddMaintenance={
          onAddMaintenance
            ? () => onAddMaintenance(boats[selectedBoatIndex].id)
            : undefined
        }
      />

      {/* Recent Maintenance Logs */}
      {recentLogs.length > 0 && (
        <View style={styles.logsSection}>
          <Text style={styles.logsSectionTitle}>Recent Maintenance</Text>
          <View style={styles.logsList}>
            {recentLogs.map((log, index) => (
              <React.Fragment key={log.id}>
                <MaintenanceLogItem
                  log={log}
                  onPress={onMaintenancePress ? () => onMaintenancePress(log) : undefined}
                />
                {index < recentLogs.length - 1 && <View style={styles.logSeparator} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...IOS_SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeMoreButtonPressed: {
    opacity: 0.6,
  },
  seeMoreText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  boatSelector: {
    paddingBottom: 12,
    gap: 8,
  },
  boatTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: IOS_COLORS.systemGray5,
  },
  boatTabSelected: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  boatTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  boatTabTextSelected: {
    color: '#FFFFFF',
  },
  boatCard: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 12,
    padding: 16,
  },
  boatCardPressed: {
    opacity: 0.8,
  },
  boatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  boatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  boatInfo: {
    flex: 1,
  },
  boatNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boatName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  primaryBadge: {
    backgroundColor: IOS_COLORS.systemBlue + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  boatDetails: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  alertBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.systemRed + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthSection: {
    marginBottom: 12,
  },
  healthLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 6,
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: IOS_COLORS.systemGray5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  healthScore: {
    fontSize: 14,
    fontWeight: '700',
    width: 45,
    textAlign: 'right',
  },
  scheduledSection: {
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  scheduledLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scheduledItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduledDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scheduledTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  scheduledDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: IOS_COLORS.separator,
  },
  addMaintenanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  addMaintenanceButtonPressed: {
    opacity: 0.6,
  },
  addMaintenanceText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  logsSection: {
    marginTop: 16,
  },
  logsSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 10,
  },
  logsList: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    overflow: 'hidden',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  logItemPressed: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.24,
  },
  logDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  logDate: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
  },
  logCost: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.systemGreen,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  logSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: 54,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
});

export default GearManagementSection;
