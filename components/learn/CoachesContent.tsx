/**
 * CoachesContent — Orchestrator
 *
 * Thin routing layer for the Learn tab's "Coaches" segment.
 * Routes to one of three views based on user state:
 *
 *   A) SailorDiscoveryView  — no active coach relationship
 *   B) SailorCoachDashboard — one or more active coaches
 *   C) CoachModeView        — coach-only user, or dual-role user toggled to Coach mode
 *
 * When the user is both a sailor-with-coach AND a coach (dual-role),
 * an IOSSegmentedControl lets them switch between "My Coaching" / "Coach Dashboard".
 *
 * Coach-only users (isAlsoCoach but no active coaching relationships) go
 * directly to CoachModeView with no toggle shown.
 *
 * Role mode is persisted to AsyncStorage for session continuity.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { IOS_COLORS } from '@/components/cards/constants';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { useAuth } from '@/providers/AuthProvider';
import { useSailorCoachRelationships } from '@/hooks/useSailorCoachRelationships';

import { SailorDiscoveryView } from './coaches/SailorDiscoveryView';
import { SailorCoachDashboard } from './coaches/SailorCoachDashboard';
import { CoachModeView } from './coaches/CoachModeView';

// ─── Types ──────────────────────────────────────────────────────────────────

type RoleMode = 'sailor' | 'coach';

const ROLE_SEGMENTS = [
  { value: 'sailor' as const, label: 'My Coaching' },
  { value: 'coach' as const, label: 'Coach Dashboard' },
];

const ROLE_MODE_STORAGE_KEY = '@regattaflow/coaches-role-mode';

interface CoachesContentProps {
  /** Extra top padding to clear an absolutely-positioned toolbar */
  toolbarOffset?: number;
  /** Scroll handler forwarded from parent for toolbar hide/show */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CoachesContent({ toolbarOffset = 0, onScroll }: CoachesContentProps) {
  const { capabilities } = useAuth();
  const { relationships, hasActiveCoach, isLoading, isError, refetch } = useSailorCoachRelationships();
  const [roleMode, setRoleMode] = useState<RoleMode>('sailor');

  const isAlsoCoach = !!capabilities?.hasCoaching;

  // Coach-only: user is a coach but has no active coaching relationship as a sailor
  const isCoachOnly = isAlsoCoach && !hasActiveCoach && !isError;

  // Dual-role: user is both a coach AND has active coaching relationships as a sailor
  const isDualRole = isAlsoCoach && hasActiveCoach;

  // ── Persist role mode to AsyncStorage ──
  useEffect(() => {
    AsyncStorage.getItem(ROLE_MODE_STORAGE_KEY).then((saved) => {
      if (saved === 'sailor' || saved === 'coach') {
        setRoleMode(saved);
      }
    });
  }, []);

  const handleRoleModeChange = useCallback((value: RoleMode) => {
    setRoleMode(value);
    AsyncStorage.setItem(ROLE_MODE_STORAGE_KEY, value);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={IOS_COLORS.blue} />
        <Text style={styles.loadingText}>Loading coaching workspace…</Text>
      </View>
    );
  }

  // Error state with retry
  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color={IOS_COLORS.secondaryLabel} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>
          We couldn't load your coaching data. Check your connection and try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()} activeOpacity={0.8}>
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Compute the effective toolbar offset, adding space for the role toggle if needed
  const effectiveOffset = isDualRole ? toolbarOffset + 52 : toolbarOffset;

  return (
    <View style={styles.container}>
      {/* Role toggle — only when user is dual-role (both coach AND has active coaching) */}
      {isDualRole && (
        <View style={[styles.roleToggle, { top: toolbarOffset }]}>
          <IOSSegmentedControl
            segments={ROLE_SEGMENTS}
            selectedValue={roleMode}
            onValueChange={handleRoleModeChange}
          />
        </View>
      )}

      {/* Route to the appropriate view */}
      {isCoachOnly ? (
        // Coach-only user — go directly to CoachModeView, no toggle
        <CoachModeView toolbarOffset={toolbarOffset} onScroll={onScroll} />
      ) : roleMode === 'coach' && isAlsoCoach ? (
        // Dual-role user toggled to Coach mode
        <CoachModeView toolbarOffset={effectiveOffset} onScroll={onScroll} />
      ) : hasActiveCoach ? (
        // Sailor with active coaches
        <SailorCoachDashboard
          relationships={relationships}
          toolbarOffset={effectiveOffset}
          onScroll={onScroll}
        />
      ) : (
        // No active coach — discovery
        <SailorDiscoveryView toolbarOffset={effectiveOffset} onScroll={onScroll} />
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  roleToggle: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.blue,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default CoachesContent;
