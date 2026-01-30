/**
 * Race Browser - Browse and select races to view detail
 *
 * Lists the user's races as tappable rows.
 * - On web (wide): Uses MasterDetailLayout to show detail in right pane
 * - On mobile/narrow: Navigates to full-screen race detail via router.push()
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { TabScreenToolbar } from '@/components/ui/TabScreenToolbar';
import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';
import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout';
import { RaceDetailContent } from '@/components/races/RaceDetailContent';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';

interface Race {
  id: string;
  name: string;
  start_date: string | null;
  status: string | null;
  metadata: Record<string, any> | null;
}

export default function RaceBrowserScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { showMasterDetail } = useResponsiveLayout();

  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { toolbarHidden, handleScroll: handleToolbarScroll } = useScrollToolbarHide();

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('regattas')
          .select('id, name, start_date, status, metadata')
          .eq('created_by', user.id)
          .order('start_date', { ascending: false })
          .limit(100);

        if (dbError) {
          setError(dbError.message);
          setRaces([]);
        } else {
          setRaces(data ?? []);
        }
      } catch (e: any) {
        setError(e.message ?? 'Failed to load races');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const handleRacePress = (raceId: string) => {
    if (showMasterDetail) {
      setSelectedRaceId(raceId);
    } else {
      router.push(`/(tabs)/race/scrollable/${raceId}`);
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string | null): string => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return IOS_COLORS.systemGreen;
      case 'completed':
      case 'finished':
        return IOS_COLORS.systemBlue;
      case 'cancelled':
        return IOS_COLORS.systemRed;
      default:
        return IOS_COLORS.secondaryLabel;
    }
  };

  const renderRaceRow = ({ item }: { item: Race }) => {
    const venueName = item.metadata?.venue_name ?? item.metadata?.venueName ?? null;
    const isSelected = showMasterDetail && selectedRaceId === item.id;

    return (
      <TouchableOpacity
        style={[styles.raceRow, isSelected && styles.raceRowSelected]}
        onPress={() => handleRacePress(item.id)}
        activeOpacity={0.6}
      >
        <View style={styles.raceIcon}>
          <Ionicons name="flag" size={20} color={IOS_COLORS.systemBlue} />
        </View>
        <View style={styles.raceInfo}>
          <Text style={styles.raceName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.raceSubtitleRow}>
            {venueName && (
              <Text style={styles.raceVenue} numberOfLines={1}>{venueName}</Text>
            )}
            {item.start_date && (
              <Text style={styles.raceDate}>{formatDate(item.start_date)}</Text>
            )}
          </View>
        </View>
        {item.status && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '18' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace(/_/g, ' ')}
            </Text>
          </View>
        )}
        {!showMasterDetail && (
          <Ionicons name="chevron-forward" size={18} color={IOS_COLORS.tertiaryLabel} />
        )}
      </TouchableOpacity>
    );
  };

  const renderSeparator = () => (
    <View style={styles.separator} />
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="flag-outline" size={32} color={IOS_COLORS.tertiaryLabel} />
        </View>
        <Text style={styles.emptyTitle}>No races yet</Text>
        <Text style={styles.emptySubtitle}>
          Races you create will appear here. Tap a race to view its full detail.
        </Text>
      </View>
    );
  };

  const masterContent = (
    <View style={styles.container}>
      {/* Scroll content first — flows behind absolutely-positioned toolbar */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={32} color={IOS_COLORS.systemRed} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={races}
          keyExtractor={(item) => item.id}
          renderItem={renderRaceRow}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[styles.listContent, { paddingTop: toolbarHeight + 12 }]}
          showsVerticalScrollIndicator={false}
          onScroll={handleToolbarScroll}
          scrollEventThrottle={16}
        />
      )}
      {/* Toolbar rendered last — absolutely positioned over content */}
      <TabScreenToolbar
        title="Race Detail"
        topInset={insets.top}
        onMeasuredHeight={setToolbarHeight}
        hidden={toolbarHidden}
      />
    </View>
  );

  return (
    <MasterDetailLayout
      masterContent={masterContent}
      detailContent={selectedRaceId ? <RaceDetailContent raceId={selectedRaceId} /> : null}
      selectedId={selectedRaceId}
      onSelectedIdChange={setSelectedRaceId}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  listContent: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  raceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  raceRowSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  raceIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.systemBlue + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  raceInfo: {
    flex: 1,
    gap: 2,
  },
  raceName: {
    fontSize: 17,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  raceSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  raceVenue: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    flexShrink: 1,
  },
  raceDate: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: 64,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  emptySubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    maxWidth: 280,
  },
});
