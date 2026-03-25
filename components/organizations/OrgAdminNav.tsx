/**
 * OrgAdminNav - Shared horizontal tab bar for org admin screens.
 *
 * Renders a scrollable row of tab pills below the page title.
 * Highlights the currently active tab based on pathname.
 * Used by all top-level /organization/* screens.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

interface OrgTab {
  key: string;
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

const ORG_ADMIN_TABS: OrgTab[] = [
  { key: 'members', label: 'Members', route: '/organization/members', icon: 'people-outline' },
  { key: 'requests', label: 'Requests', route: '/organization/access-requests', icon: 'mail-outline' },
  { key: 'cohorts', label: 'Cohorts', route: '/organization/cohorts', icon: 'layers-outline' },
  { key: 'competencies', label: 'Competencies', route: '/organization/competencies', icon: 'ribbon-outline' },
  { key: 'templates', label: 'Templates', route: '/organization/templates', icon: 'document-text-outline' },
  { key: 'billing', label: 'Billing', route: '/organization/billing', icon: 'card-outline' },
  { key: 'settings', label: 'Settings', route: '/settings/organization-access', icon: 'settings-outline' },
];

function isTabActive(tabRoute: string, pathname: string): boolean {
  // Normalize: strip /(tabs)/ prefix if present
  const normalize = (r: string) => r.replace('/(tabs)/', '/');
  const normalizedTab = normalize(tabRoute);
  const normalizedPath = normalize(pathname);
  return normalizedPath === normalizedTab || normalizedPath.startsWith(normalizedTab + '/');
}

interface OrgAdminNavProps {
  /** Optional badge counts keyed by tab key (e.g. { requests: 3 }) */
  badges?: Record<string, number>;
}

export function OrgAdminNav({ badges }: OrgAdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {ORG_ADMIN_TABS.map((tab) => {
          const active = isTabActive(tab.route, pathname);
          const badgeCount = badges?.[tab.key];
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => {
                if (!active) {
                  router.push(tab.route as Parameters<typeof router.push>[0]);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={active ? (tab.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : tab.icon}
                size={16}
                color={active ? IOS_COLORS.systemBlue : IOS_COLORS.secondaryLabel}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {badgeCount != null && badgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
  },
  tabActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tabLabelActive: {
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: IOS_COLORS.systemRed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
