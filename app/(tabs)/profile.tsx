import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOrganization } from '@/providers/OrganizationProvider';
import { useWorkspaceDomain } from '@/hooks/useWorkspaceDomain';

const formatOrgType = (value?: string | null) => {
  if (!value) return 'Organization';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export default function ProfileScreen() {
  const router = useRouter();
  const { activeOrganization, activeMembership, canManageActiveOrganization, ready: orgReady } = useOrganization();
  const { isSailingDomain } = useWorkspaceDomain();
  const isInstitutionWorkspace = orgReady && !isSailingDomain;

  const organizationName = activeOrganization?.name || 'No active organization';
  const organizationType = formatOrgType(activeOrganization?.organization_type);
  const roleLabel = activeMembership?.role || 'member';
  const verificationLabel = activeMembership?.is_verified ? 'Verified member' : 'Pending verification';

  const summaryCards = useMemo(
    () => [
      {
        key: 'type',
        icon: 'business-outline' as const,
        title: 'Organization Type',
        value: organizationType,
      },
      {
        key: 'role',
        icon: 'shield-checkmark-outline' as const,
        title: 'Your Role',
        value: roleLabel,
      },
      {
        key: 'status',
        icon: 'checkmark-done-outline' as const,
        title: 'Membership',
        value: verificationLabel,
      },
    ],
    [organizationType, roleLabel, verificationLabel]
  );

  if (!orgReady) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.noticeCard}>
          <Ionicons name="hourglass-outline" size={18} color="#2563EB" />
          <ThemedText style={styles.noticeText}>
            Loading workspace profile and permissions…
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <ThemedText type="title">{isInstitutionWorkspace ? 'Organization' : 'Profile'}</ThemedText>
          <ThemedText type="subtitle">
            {isInstitutionWorkspace ? 'Workspace profile and governance' : 'Settings & account'}
          </ThemedText>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={isInstitutionWorkspace ? 'school-outline' : 'business-outline'}
              size={24}
              color="#2563EB"
            />
          </View>
          <View style={styles.heroCopy}>
            <ThemedText style={styles.heroTitle}>{organizationName}</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              {organizationType} • {roleLabel} • {verificationLabel}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardRow}>
          {summaryCards.map((card) => (
            <View key={card.key} style={styles.summaryCard}>
              <Ionicons name={card.icon} size={18} color="#2563EB" />
              <ThemedText style={styles.summaryTitle}>{card.title}</ThemedText>
              <ThemedText style={styles.summaryValue}>{card.value}</ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>Organization Controls</ThemedText>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/settings/organization-access')}
          >
            <Ionicons name="settings-outline" size={20} color="#2563EB" />
            <View style={styles.actionCopy}>
              <ThemedText style={styles.actionTitle}>Workspace Access</ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                Manage roles, invite staff, and content visibility defaults
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(tabs)/members')}>
            <Ionicons name="people-outline" size={20} color="#2563EB" />
            <View style={styles.actionCopy}>
              <ThemedText style={styles.actionTitle}>People Directory</ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                View staff, facilitators, mentors, and support members
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(tabs)/programs' as any)}
          >
            <Ionicons name="layers-outline" size={20} color="#2563EB" />
            <View style={styles.actionCopy}>
              <ThemedText style={styles.actionTitle}>
                {isInstitutionWorkspace ? 'Programs & Placements' : 'Race Operations'}
              </ThemedText>
              <ThemedText style={styles.actionSubtitle}>
                {isInstitutionWorkspace
                  ? 'Coordinate programs, sessions, and participant operations'
                  : 'Coordinate race timelines, entries, and operations'}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {!canManageActiveOrganization && (
          <View style={styles.noticeCard}>
            <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
            <ThemedText style={styles.noticeText}>
              You currently have read-only workspace access. Ask an organization admin to grant management permissions.
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    minHeight: 94,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  noticeCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
});
