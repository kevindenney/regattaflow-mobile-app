import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { IOS_COLORS } from '@/components/cards/constants';
import type { StepLocationMarker, StepLocationsMapModalProps } from './StepLocationsMapModal.web';

export function StepLocationsMapModal({
  visible,
  onClose,
  markers,
}: StepLocationsMapModalProps) {
  const [scope, setScope] = useState<'all' | 'mine' | 'following'>('all');
  const [personFilter, setPersonFilter] = useState<'all' | 'people' | 'coaches'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming'>('all');
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [interestFilter, setInterestFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const nowMs = Date.now();

  const interestOptions = useMemo(() => {
    const labels = Array.from(
      new Set(
        markers
          .map((marker) => String(marker.interestSlug || '').trim())
          .filter(Boolean)
      )
    );
    return labels.slice(0, 8);
  }, [markers]);

  const orgOptions = useMemo(() => {
    const labels = Array.from(
      new Set(
        markers
          .map((marker) => String(marker.organizationName || '').trim())
          .filter(Boolean)
      )
    );
    return labels.slice(0, 8);
  }, [markers]);

  const filteredMarkers = useMemo(() => {
    return markers.filter((marker) => {
      if (scope === 'mine' && !marker.isCurrentUser) return false;
      if (scope === 'following' && marker.isCurrentUser) return false;
      if (personFilter === 'coaches' && !marker.isCoach) return false;
      if (personFilter === 'people' && marker.isCoach) return false;
      if (timeFilter === 'upcoming' && typeof marker.startAtMs === 'number' && marker.startAtMs < nowMs) return false;
      if (interestFilter !== 'all' && String(marker.interestSlug || '').trim() !== interestFilter) return false;
      if (orgFilter !== 'all' && String(marker.organizationName || '').trim() !== orgFilter) return false;
      return true;
    });
  }, [interestFilter, markers, nowMs, orgFilter, personFilter, scope, timeFilter]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Step Locations</Text>
            <Text style={styles.subtitle}>You + followed people</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <X size={22} color={IOS_COLORS.secondaryLabel} />
          </Pressable>
        </View>
        <View style={styles.filtersRow}>
          {(['all', 'mine', 'following'] as const).map((value) => (
            <Pressable
              key={value}
              style={[styles.filterChip, scope === value && styles.filterChipActive]}
              onPress={() => setScope(value)}
            >
              <Text style={[styles.filterChipText, scope === value && styles.filterChipTextActive]}>
                {value === 'all' ? 'All' : value === 'mine' ? 'Mine' : 'Following'}
              </Text>
            </Pressable>
          ))}
          {(['all', 'upcoming'] as const).map((value) => (
            <Pressable
              key={value}
              style={[styles.filterChip, timeFilter === value && styles.filterChipActive]}
              onPress={() => setTimeFilter(value)}
            >
              <Text style={[styles.filterChipText, timeFilter === value && styles.filterChipTextActive]}>
                {value === 'all' ? 'Any Time' : 'Upcoming'}
              </Text>
            </Pressable>
          ))}
          {(['all', 'people', 'coaches'] as const).map((value) => (
            <Pressable
              key={value}
              style={[styles.filterChip, personFilter === value && styles.filterChipActive]}
              onPress={() => setPersonFilter(value)}
            >
              <Text style={[styles.filterChipText, personFilter === value && styles.filterChipTextActive]}>
                {value === 'all' ? 'All People' : value === 'people' ? 'People' : 'Coaches'}
              </Text>
            </Pressable>
          ))}
          {interestOptions.length > 0 && (
            <Pressable
              style={[styles.filterChip, interestFilter === 'all' && styles.filterChipActive]}
              onPress={() => setInterestFilter('all')}
            >
              <Text style={[styles.filterChipText, interestFilter === 'all' && styles.filterChipTextActive]}>
                All Interests
              </Text>
            </Pressable>
          )}
          {interestOptions.length === 0 && (
            <View style={styles.emptyFilterPill}>
              <Text style={styles.emptyFilterText}>No interest tags</Text>
            </View>
          )}
          {interestOptions.map((value) => (
            <Pressable
              key={`interest-${value}`}
              style={[styles.filterChip, interestFilter === value && styles.filterChipActive]}
              onPress={() => setInterestFilter(value)}
            >
              <Text style={[styles.filterChipText, interestFilter === value && styles.filterChipTextActive]}>
                {value}
              </Text>
            </Pressable>
          ))}
          {orgOptions.length > 0 && (
            <Pressable
              style={[styles.filterChip, orgFilter === 'all' && styles.filterChipActive]}
              onPress={() => setOrgFilter('all')}
            >
              <Text style={[styles.filterChipText, orgFilter === 'all' && styles.filterChipTextActive]}>
                All Orgs
              </Text>
            </Pressable>
          )}
          {orgOptions.length === 0 && (
            <View style={styles.emptyFilterPill}>
              <Text style={styles.emptyFilterText}>No org tags</Text>
            </View>
          )}
          {orgOptions.map((value) => (
            <Pressable
              key={`org-${value}`}
              style={[styles.filterChip, orgFilter === value && styles.filterChipActive]}
              onPress={() => setOrgFilter(value)}
            >
              <Text style={[styles.filterChipText, orgFilter === value && styles.filterChipTextActive]}>
                {value}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.dotMine]} />
            <Text style={styles.legendText}>You</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.dotFollowed]} />
            <Text style={styles.legendText}>Following</Text>
          </View>
        </View>
        <Text style={styles.note}>Map markers are shown on web. On mobile, use this location list.</Text>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredMarkers.map((marker: StepLocationMarker) => (
            <Pressable
              key={marker.id}
              style={[styles.row, selectedRaceId === marker.raceId && styles.rowFocused]}
              onPress={() => setSelectedRaceId(marker.raceId)}
            >
              <View style={[styles.dot, marker.isCurrentUser ? styles.dotMine : styles.dotFollowed]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{marker.title}</Text>
                <Text style={styles.rowMeta}>{marker.persona} · {marker.whenLabel}</Text>
                <Text style={styles.coords}>{marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}</Text>
                {!!marker.organizationName && (
                  <Text style={styles.submeta}>
                    {marker.organizationName}{marker.interestSlug ? ` · ${marker.interestSlug}` : ''}
                    {marker.isCoach ? ' · Coach' : ''}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  filtersRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  filterChipText: {
    fontSize: 12,
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  legendRow: {
    paddingHorizontal: 12,
    paddingTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#475569',
  },
  note: { paddingHorizontal: 16, paddingVertical: 10, fontSize: 12, color: '#6B7280' },
  list: { flex: 1 },
  listContent: { padding: 12, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowFocused: {
    backgroundColor: '#EFF6FF',
    borderBottomColor: '#BFDBFE',
  },
  dot: { width: 10, height: 10, borderRadius: 99 },
  dotMine: { backgroundColor: '#2563EB' },
  dotFollowed: { backgroundColor: '#16A34A' },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rowMeta: { marginTop: 2, fontSize: 12, color: '#6B7280' },
  coords: { marginTop: 2, fontSize: 11, color: '#6B7280' },
  submeta: { marginTop: 1, fontSize: 11, color: '#64748B' },
  emptyFilterPill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
  },
  emptyFilterText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
