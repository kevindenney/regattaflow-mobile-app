import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { IOS_COLORS } from '@/components/cards/constants';

export interface StepLocationMarker {
  id: string;
  raceId: string;
  lat: number;
  lng: number;
  persona: string;
  title: string;
  whenLabel: string;
  startAtMs?: number;
  subtitle?: string;
  isCurrentUser?: boolean;
  interestSlug?: string;
  organizationName?: string;
  isCoach?: boolean;
  userId?: string;
}

export interface StepLocationsMapModalProps {
  visible: boolean;
  onClose: () => void;
  markers: StepLocationMarker[];
  focusRaceId?: string | null;
}

function LeafletMap({
  markers,
  focusRaceId,
  onFocusedRaceResolved,
  onMarkerSelect,
}: {
  markers: StepLocationMarker[];
  focusRaceId?: string | null;
  onFocusedRaceResolved?: (raceId: string | null) => void;
  onMarkerSelect?: (raceId: string) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any[]>([]);

  const center = useMemo(() => {
    if (markers.length === 0) return { lat: 22.3193, lng: 114.1694 };
    const focus = focusRaceId ? markers.find((m) => m.raceId === focusRaceId) : null;
    if (focus) return { lat: focus.lat, lng: focus.lng };
    return { lat: markers[0].lat, lng: markers[0].lng };
  }, [focusRaceId, markers]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    let isMounted = true;

    const loadLeaflet = async () => {
      try {
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (!(window as any).L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (!isMounted || !mapContainerRef.current) return;
        const L = (window as any).L;
        if (!L) return;

        if (!mapRef.current) {
          mapRef.current = L.map(mapContainerRef.current).setView([center.lat, center.lng], 12);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(mapRef.current);
        }
      } catch (_error) {
        // no-op
      }
    };

    void loadLeaflet();
    return () => {
      isMounted = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (_e) {
          // ignore cleanup issues
        }
        mapRef.current = null;
        markerLayerRef.current = [];
      }
    };
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    markerLayerRef.current.forEach((entry) => {
      try {
        map.removeLayer(entry);
      } catch (_e) {
        // ignore
      }
    });
    markerLayerRef.current = [];

    const clusterBuckets = new Map<string, StepLocationMarker[]>();
    markers.forEach((marker) => {
      const key = `${Math.round(marker.lat * 80) / 80}|${Math.round(marker.lng * 80) / 80}`;
      const existing = clusterBuckets.get(key) || [];
      existing.push(marker);
      clusterBuckets.set(key, existing);
    });

    clusterBuckets.forEach((bucket) => {
      if (bucket.length === 1) {
        const marker = bucket[0];
        const dotColor = marker.isCurrentUser ? '#2563EB' : '#16A34A';
        const leafletMarker = L.circleMarker([marker.lat, marker.lng], {
          radius: 8,
          color: '#FFFFFF',
          weight: 2,
          fillColor: dotColor,
          fillOpacity: 0.95,
        }).addTo(map);
        leafletMarker.bindTooltip(
          `${marker.title}`,
          { direction: 'top', sticky: true, opacity: 0.9 }
        );
        leafletMarker.bindPopup(
          `<div style="min-width:180px">
            <div style="font-weight:600;font-size:13px">${marker.title}</div>
            <div style="font-size:12px;color:#374151;margin-top:2px">${marker.persona}</div>
            <div style="font-size:12px;color:#6B7280;margin-top:2px">${marker.whenLabel}</div>
          </div>`
        );
        leafletMarker.on('click', () => onMarkerSelect?.(marker.raceId));
        markerLayerRef.current.push(leafletMarker);
        return;
      }

      const lat = bucket.reduce((sum, m) => sum + m.lat, 0) / bucket.length;
      const lng = bucket.reduce((sum, m) => sum + m.lng, 0) / bucket.length;
      const mineCount = bucket.filter((m) => m.isCurrentUser).length;
      const color = mineCount > 0 ? '#2563EB' : '#16A34A';
      const leafletMarker = L.circleMarker([lat, lng], {
        radius: Math.min(16, 8 + bucket.length),
        color: '#FFFFFF',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.95,
      }).addTo(map);
      const rows = bucket
        .slice(0, 6)
        .map((m) => `<div style="font-size:12px;line-height:16px">• ${m.persona}: ${m.title}</div>`)
        .join('');
      const more = bucket.length > 6 ? `<div style="font-size:11px;color:#6B7280;margin-top:2px">+${bucket.length - 6} more</div>` : '';
      leafletMarker.bindTooltip(`${bucket.length}`, { permanent: true, direction: 'center', className: 'cluster-count' });
      leafletMarker.bindPopup(
        `<div style="min-width:220px">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px">${bucket.length} steps nearby</div>
          ${rows}
          ${more}
        </div>`
      );
      leafletMarker.on('click', () => {
        const first = bucket[0];
        if (first?.raceId) {
          onMarkerSelect?.(first.raceId);
        }
      });
      markerLayerRef.current.push(leafletMarker);
    });

    if (focusRaceId) {
      const focus = markers.find((m) => m.raceId === focusRaceId);
      if (focus) {
        map.setView([focus.lat, focus.lng], 13);
        onFocusedRaceResolved?.(focus.raceId);
      }
    }
  }, [focusRaceId, markers, onFocusedRaceResolved, onMarkerSelect]);

  return <View ref={mapContainerRef as any} style={styles.map} />;
}

export function StepLocationsMapModal({
  visible,
  onClose,
  markers,
  focusRaceId,
}: StepLocationsMapModalProps) {
  const [scope, setScope] = useState<'all' | 'mine' | 'following'>('all');
  const [personFilter, setPersonFilter] = useState<'all' | 'people' | 'coaches'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming'>('all');
  const [interestFilter, setInterestFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [localFocusRaceId, setLocalFocusRaceId] = useState<string | null>(null);
  const [resolvedFocusRaceId, setResolvedFocusRaceId] = useState<string | null>(null);
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

  useEffect(() => {
    if (focusRaceId) {
      setLocalFocusRaceId(focusRaceId);
      setResolvedFocusRaceId(null);
    }
  }, [focusRaceId]);

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
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.dotMine]} />
            <Text style={styles.legendText}>You</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.dotFollowed]} />
            <Text style={styles.legendText}>Following</Text>
          </View>
          <Text style={styles.legendHint}>Tap a row to focus on map</Text>
        </View>
        <View style={styles.filtersRow}>
          <Text style={styles.filterLabel}>Scope</Text>
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
          <Text style={[styles.filterLabel, { marginLeft: 8 }]}>Time</Text>
          {(['all', 'upcoming'] as const).map((value) => (
            <Pressable
              key={value}
              style={[styles.filterChip, timeFilter === value && styles.filterChipActive]}
              onPress={() => setTimeFilter(value)}
            >
              <Text style={[styles.filterChipText, timeFilter === value && styles.filterChipTextActive]}>
                {value === 'all' ? 'All' : 'Upcoming'}
              </Text>
            </Pressable>
          ))}
          <Text style={[styles.filterLabel, { marginLeft: 8 }]}>People</Text>
          {(['all', 'people', 'coaches'] as const).map((value) => (
            <Pressable
              key={value}
              style={[styles.filterChip, personFilter === value && styles.filterChipActive]}
              onPress={() => setPersonFilter(value)}
            >
              <Text style={[styles.filterChipText, personFilter === value && styles.filterChipTextActive]}>
                {value === 'all' ? 'All' : value === 'people' ? 'People' : 'Coaches'}
              </Text>
            </Pressable>
          ))}
          <Text style={[styles.filterLabel, { marginLeft: 8 }]}>Interest</Text>
          <Pressable
            style={[styles.filterChip, interestFilter === 'all' && styles.filterChipActive]}
            onPress={() => setInterestFilter('all')}
          >
            <Text style={[styles.filterChipText, interestFilter === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </Pressable>
          {interestOptions.map((interest) => (
            <Pressable
              key={interest}
              style={[styles.filterChip, interestFilter === interest && styles.filterChipActive]}
              onPress={() => setInterestFilter(interest)}
            >
              <Text style={[styles.filterChipText, interestFilter === interest && styles.filterChipTextActive]}>
                {interest}
              </Text>
            </Pressable>
          ))}
          {interestOptions.length === 0 && (
            <View style={styles.emptyFilterPill}>
              <Text style={styles.emptyFilterText}>No interest tags</Text>
            </View>
          )}
          <Text style={[styles.filterLabel, { marginLeft: 8 }]}>Org</Text>
          <Pressable
            style={[styles.filterChip, orgFilter === 'all' && styles.filterChipActive]}
            onPress={() => setOrgFilter('all')}
          >
            <Text style={[styles.filterChipText, orgFilter === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </Pressable>
          {orgOptions.map((organization) => (
            <Pressable
              key={organization}
              style={[styles.filterChip, orgFilter === organization && styles.filterChipActive]}
              onPress={() => setOrgFilter(organization)}
            >
              <Text style={[styles.filterChipText, orgFilter === organization && styles.filterChipTextActive]}>
                {organization}
              </Text>
            </Pressable>
          ))}
          {orgOptions.length === 0 && (
            <View style={styles.emptyFilterPill}>
              <Text style={styles.emptyFilterText}>No org tags</Text>
            </View>
          )}
        </View>
        <LeafletMap
          markers={filteredMarkers}
          focusRaceId={localFocusRaceId}
          onFocusedRaceResolved={setResolvedFocusRaceId}
          onMarkerSelect={setLocalFocusRaceId}
        />
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredMarkers.map((marker) => (
            <Pressable
              key={marker.id}
              style={[
                styles.row,
                resolvedFocusRaceId === marker.raceId && styles.rowFocused,
              ]}
              onPress={() => setLocalFocusRaceId(marker.raceId)}
            >
              <View style={[styles.dot, marker.isCurrentUser ? styles.dotMine : styles.dotFollowed]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{marker.title}</Text>
                <Text style={styles.rowMeta}>{marker.persona} · {marker.whenLabel}</Text>
                {!!marker.organizationName && (
                  <Text style={styles.rowSubmeta}>
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
  legendRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
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
  legendHint: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 'auto',
  },
  filtersRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  filterLabel: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  map: { height: 330, backgroundColor: '#F3F4F6' },
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
  rowSubmeta: { marginTop: 1, fontSize: 11, color: '#64748B' },
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
