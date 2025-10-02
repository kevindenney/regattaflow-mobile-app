import { useMemo } from 'react';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DashboardSection, QuickActionGrid, type QuickAction } from '@/src/components/dashboard/shared';
import { useAuth } from '@/src/providers/AuthProvider';
import { useFleetActivity, useFleetOverview, useUserFleets } from '@/src/hooks/useFleetData';

export default function FleetOverviewScreen() {
  const { user } = useAuth();
  const { fleets, loading: fleetsLoading } = useUserFleets(user?.id);
  const activeFleet = fleets[0]?.fleet;
  const { overview, loading: overviewLoading } = useFleetOverview(activeFleet?.id);
  const { activity, loading: activityLoading } = useFleetActivity(activeFleet?.id, { limit: 6 });

  const quickActions: QuickAction[] = useMemo(() => {
    if (!overview?.fleet) {
      return [];
    }

    const whatsappLink = overview.fleet.whatsappLink;

    return [
      {
        id: 'open-whatsapp',
        title: 'Open WhatsApp',
        icon: whatsappLink ? 'whatsapp' : 'message-processing',
        iconSet: 'mci',
        gradientColors: ['#25D366', '#128C7E'],
        onPress: () => {
          if (whatsappLink) {
            Linking.openURL(whatsappLink).catch(err => {
              console.warn('Unable to open WhatsApp link:', err);
            });
          }
        },
      },
      {
        id: 'upload-resource',
        title: 'Upload Fleet Doc',
        icon: 'file-upload-outline',
        iconSet: 'mci',
        gradientColors: ['#6366F1', '#8B5CF6'],
        onPress: () => {
          // Navigate to fleet resources once implemented
        },
      },
      {
        id: 'message-fleet',
        title: 'Post Announcement',
        icon: 'bullhorn-variant-outline',
        iconSet: 'mci',
        gradientColors: ['#0EA5E9', '#0284C7'],
        onPress: () => {
          // Placeholder action until announcement composer is ready
        },
      },
    ];
  }, [overview?.fleet]);

  if (!fleetsLoading && (!fleets.length || !activeFleet)) {
    return (
      <ScrollView contentContainerStyle={[styles.container, styles.centerContent]}>
        <MaterialCommunityIcons name="sail-boat" size={52} color="#94A3B8" />
        <Text style={styles.emptyTitle}>Join or create a fleet</Text>
        <Text style={styles.emptySubtitle}>
          Fleets bring sailors, coaches, and clubs together around a class. Once you join, your updates and resources will appear here.
        </Text>
        <Link href="/(tabs)/dashboard" style={styles.link}>
          Browse fleets on your dashboard
        </Link>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <DashboardSection
        title={overview?.fleet.name ?? 'Fleet overview'}
        subtitle={overview?.fleet.region ?? 'Fleet status and key metrics'}
        showBorder={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>{overview?.fleet.name ?? 'Fleet'}</Text>
              {overview?.fleet.classId && (
                <Text style={styles.summarySubtitle}>Class ID: {overview.fleet.classId}</Text>
              )}
            </View>
            <MaterialCommunityIcons name="sail-boat" size={36} color="#1D4ED8" />
          </View>

          <View style={styles.metricsRow}>
            <FleetMetric label="Members" value={overview?.metrics.members ?? 0} loading={overviewLoading} />
            <FleetMetric label="Followers" value={overview?.metrics.followers ?? 0} loading={overviewLoading} />
            <FleetMetric label="Resources" value={overview?.metrics.documents ?? 0} loading={overviewLoading} />
          </View>

          <View style={styles.metaRow}>
            <InfoPill icon="shield-account" text={`Visibility: ${overview?.fleet.visibility ?? 'private'}`} />
            {overview?.fleet.region && <InfoPill icon="map-marker" text={overview.fleet.region} />}
            {overview?.fleet.whatsappLink && <InfoPill icon="whatsapp" text="WhatsApp linked" highlight />}
          </View>
        </View>
      </DashboardSection>

      <DashboardSection title="Quick Actions" showBorder={false}>
        <QuickActionGrid actions={quickActions} />
      </DashboardSection>

      <DashboardSection
        title="Recent Activity"
        subtitle="Tuning uploads, announcements, and fleet updates"
      >
        {activityLoading && <Text style={styles.placeholderText}>Loading activity…</Text>}
        {!activityLoading && !activity.length && (
          <Text style={styles.placeholderText}>No activity yet. Share a resource to get started.</Text>
        )}
        {!activityLoading && activity.map(item => (
          <View key={item.id} style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <MaterialCommunityIcons
                name={getActivityIcon(item.activityType)}
                size={22}
                color="#2563EB"
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{renderActivityTitle(item)}</Text>
              <Text style={styles.activityMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          </View>
        ))}
      </DashboardSection>

      <DashboardSection
        title="Fleet Directory"
        subtitle="See everyone sailing in this fleet"
        footerAction={{ label: 'View members', href: '/(tabs)/fleet/members' }}
      >
        <Text style={styles.placeholderText}>
          Member list coming soon. You’ll be able to follow sailors, invite crew, and connect with coaches.
        </Text>
      </DashboardSection>
    </ScrollView>
  );
}

const FleetMetric = ({ label, value, loading }: { label: string; value: number; loading?: boolean }) => (
  <View style={styles.metricItem}>
    <Text style={styles.metricValue}>{loading ? '—' : value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const InfoPill = ({ icon, text, highlight }: { icon: string; text: string; highlight?: boolean }) => (
  <View style={[styles.pill, highlight && styles.pillHighlight]}>
    <MaterialCommunityIcons
      name={icon as any}
      size={14}
      color={highlight ? '#047857' : '#334155'}
    />
    <Text style={[styles.pillText, highlight && styles.pillTextHighlight]}>{text}</Text>
  </View>
);

const getActivityIcon = (type: string): string => {
  switch (type) {
    case 'document_uploaded':
      return 'file-arrow-up-down';
    case 'announcement':
      return 'bullhorn';
    case 'event_created':
      return 'calendar-star';
    case 'member_joined':
      return 'account-plus';
    case 'member_left':
      return 'account-minus';
    case 'resource_shared':
      return 'bookshelf';
    default:
      return 'information-outline';
  }
};

const renderActivityTitle = (activity: ReturnType<typeof useFleetActivity>['activity'][number]): string => {
  const payload = activity.payload ?? {};
  if (payload.title) {
    return String(payload.title);
  }

  switch (activity.activityType) {
    case 'document_uploaded':
      return 'New fleet document uploaded';
    case 'announcement':
      return 'New fleet announcement';
    case 'event_created':
      return 'New fleet event created';
    case 'member_joined':
      return 'A new sailor joined the fleet';
    default:
      return 'Fleet update';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  centerContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  link: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    boxShadow: '0px 8px',
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E40AF',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillHighlight: {
    backgroundColor: '#DCFCE7',
  },
  pillText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  pillTextHighlight: {
    color: '#047857',
  },
  placeholderText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  activityMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
});
