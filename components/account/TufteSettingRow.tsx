/**
 * TufteSettingRow
 *
 * Dense setting row with label, optional value, and navigation indicator.
 * Supports toggle switches for boolean settings.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { tufteAccountStyles as styles, STATUS_COLORS } from './accountStyles';
import { IOS_COLORS } from '@/components/cards/constants';

// ---------------------------------------------------------------------------
// NAVIGABLE SETTING ROW
// ---------------------------------------------------------------------------

interface TufteSettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  danger?: boolean;
  showChevron?: boolean;
}

export function TufteSettingRow({
  label,
  value,
  onPress,
  isLast = false,
  danger = false,
  showChevron = true,
}: TufteSettingRowProps) {
  return (
    <TouchableOpacity
      style={[
        styles.settingRow,
        isLast && styles.settingRowLast,
        danger && styles.settingRowDanger,
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {showChevron && onPress && <Text style={styles.settingChevron}>›</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// DATA ROW (Label + Value, no navigation)
// ---------------------------------------------------------------------------

interface TufteDataRowProps {
  label: string;
  value: string;
  status?: 'active' | 'inactive' | 'pending' | 'warning' | 'error';
  isLast?: boolean;
}

export function TufteDataRow({
  label,
  value,
  status,
  isLast = false,
}: TufteDataRowProps) {
  const statusColor = status ? STATUS_COLORS[status] : undefined;

  return (
    <View style={[styles.dataRow, isLast && styles.dataRowLast]}>
      <Text style={styles.dataLabel}>{label}</Text>
      {status ? (
        <View style={styles.dataValueWithStatus}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.dataValue}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.dataValue}>{value}</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// TOGGLE ROW (with Switch)
// ---------------------------------------------------------------------------

interface TufteToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

export function TufteToggleRow({
  label,
  value,
  onValueChange,
  isLast = false,
}: TufteToggleRowProps) {
  return (
    <View style={[styles.toggleRow, isLast && styles.settingRowLast]}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={styles.toggleValueRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: value ? STATUS_COLORS.active : STATUS_COLORS.inactive },
          ]}
        />
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#D1D5DB', true: IOS_COLORS.blue }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// BOAT ROW
// ---------------------------------------------------------------------------

interface TufteBoatRowProps {
  name: string;
  boatClass: string;
  sailNumber?: string;
  status: 'active' | 'stored' | 'inactive';
  isPrimary?: boolean;
  onPress?: () => void;
  isLast?: boolean;
}

export function TufteBoatRow({
  name,
  boatClass,
  sailNumber,
  status,
  isPrimary = false,
  onPress,
  isLast = false,
}: TufteBoatRowProps) {
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.inactive;
  const statusLabel = status === 'active' ? 'active' : status === 'stored' ? 'stored' : 'inactive';

  return (
    <TouchableOpacity
      style={[styles.boatRow, isLast && styles.settingRowLast]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={styles.boatInfo}>
        <Text style={styles.boatName}>
          {name}
          {isPrimary && <Text style={{ color: IOS_COLORS.tertiaryLabel }}> · Primary</Text>}
        </Text>
        <Text style={styles.boatClass}>
          {boatClass}
          {sailNumber ? ` ${sailNumber}` : ''}
        </Text>
      </View>
      <View style={styles.boatStatus}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={styles.boatStatusText}>{statusLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}
