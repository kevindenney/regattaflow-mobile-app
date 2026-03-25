/**
 * OrgAdminHeader - Shared header for org admin screens.
 *
 * Renders: back button, title, subtitle, OrgContextPill, and OrgAdminNav tabs.
 * Replaces the duplicated header pattern across all /organization/* screens.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { OrgContextPill } from '@/components/organizations/OrgContextPill';
import { OrgAdminNav } from '@/components/organizations/OrgAdminNav';

interface OrgAdminHeaderProps {
  title: string;
  subtitle?: string;
  interestSlug?: string | null;
  /** Extra element rendered inline after the subtitle (e.g. invite button) */
  actions?: React.ReactNode;
  /** Badge counts for OrgAdminNav tabs */
  badges?: Record<string, number>;
}

export function OrgAdminHeader({ title, subtitle, interestSlug, actions, badges }: OrgAdminHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/races' as any)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {interestSlug && <OrgContextPill interestSlug={interestSlug} />}
          </View>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {actions && <View style={styles.actionsRow}>{actions}</View>}
        </View>
      </View>
      <OrgAdminNav badges={badges} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    marginTop: 2,
  },
  headerTextWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748B',
  },
  actionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
