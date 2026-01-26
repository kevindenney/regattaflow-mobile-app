/**
 * CrewHub Component
 *
 * Unified crew management hub that consolidates:
 * - Roster management (crew members per boat class)
 * - Race-specific position assignments
 * - Sharing & collaboration
 *
 * Replaces scattered crew UIs with a single entry point.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Actionsheet,
  ActionsheetContent,
  ActionsheetBackdrop,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from '@/components/ui/actionsheet';
import { Users, Anchor, Share2, X, UserPlus, Search } from 'lucide-react-native';
import { IOS_COLORS } from '@/components/cards/constants';
import { supabase } from '@/services/supabase';

// Tab components (to be implemented)
import { RosterTab } from './tabs/RosterTab';
import { SailingTab } from './tabs/SailingTab';
import { ShareTab } from './tabs/ShareTab';

// =============================================================================
// TYPES
// =============================================================================

export type CrewHubTab = 'roster' | 'sailing' | 'share';

export interface CrewHubProps {
  /** Sailor profile ID for crew ownership */
  sailorId: string;
  /** Boat class ID for filtering crew */
  classId: string;
  /** Class name for display */
  className?: string;
  /** Sail number for display */
  sailNumber?: string;
  /** Race/regatta ID - enables Sailing and Share tabs */
  regattaId?: string;
  /** Race name for display */
  raceName?: string;
  /** Initial tab to show */
  initialTab?: CrewHubTab;
  /** Whether the hub is open */
  isOpen: boolean;
  /** Callback when hub is closed */
  onClose: () => void;
  /** Callback when crew changes (for parent refresh) */
  onCrewChange?: () => void;
}

// =============================================================================
// TAB CONFIGURATION
// =============================================================================

interface TabConfig {
  id: CrewHubTab;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  requiresRegatta: boolean;
}

const TABS: TabConfig[] = [
  { id: 'roster', label: 'Roster', icon: Users, requiresRegatta: false },
  { id: 'sailing', label: 'Sailing', icon: Anchor, requiresRegatta: true },
  { id: 'share', label: 'Share', icon: Share2, requiresRegatta: true },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CrewHub({
  sailorId,
  classId,
  className,
  sailNumber,
  regattaId,
  raceName,
  initialTab = 'roster',
  isOpen,
  onClose,
  onCrewChange,
}: CrewHubProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<CrewHubTab>(initialTab);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // Refresh key to trigger data reload across tabs when crew changes
  const [refreshKey, setRefreshKey] = useState(0);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Reset to initial tab when opened
  useEffect(() => {
    if (isOpen) {
      // If initialTab requires regatta but none provided, fall back to roster
      if (initialTab !== 'roster' && !regattaId) {
        setActiveTab('roster');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, initialTab, regattaId]);

  // Filter tabs based on whether we have a regattaId
  const availableTabs = TABS.filter(
    (tab) => !tab.requiresRegatta || regattaId
  );

  // Calculate drawer height (85% of screen)
  const drawerHeight = windowHeight * 0.85;

  // Handle tab change
  const handleTabChange = useCallback((tab: CrewHubTab) => {
    setActiveTab(tab);
  }, []);

  // Handle crew change from any tab - increments refreshKey to trigger reload in other tabs
  const handleCrewChange = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    onCrewChange?.();
  }, [onCrewChange]);

  // ---------------------------------------------------------------------------
  // RENDER: TAB BAR
  // ---------------------------------------------------------------------------

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      {availableTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = tab.icon;

        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => handleTabChange(tab.id)}
          >
            <IconComponent
              size={18}
              color={isActive ? IOS_COLORS.blue : IOS_COLORS.gray}
            />
            <Text
              style={[styles.tabText, isActive && styles.activeTabText]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  // ---------------------------------------------------------------------------
  // RENDER: TAB CONTENT
  // ---------------------------------------------------------------------------

  const renderTabContent = () => {
    switch (activeTab) {
      case 'roster':
        return (
          <RosterTab
            key={`roster-${refreshKey}`}
            sailorId={sailorId}
            classId={classId}
            className={className}
            sailNumber={sailNumber}
            currentUserId={currentUserId || undefined}
            regattaId={regattaId}
            regattaName={raceName}
            onCrewChange={handleCrewChange}
          />
        );

      case 'sailing':
        if (!regattaId) return null;
        return (
          <SailingTab
            key={`sailing-${refreshKey}`}
            sailorId={sailorId}
            classId={classId}
            regattaId={regattaId}
            raceName={raceName}
            onCrewChange={handleCrewChange}
          />
        );

      case 'share':
        if (!regattaId) return null;
        return (
          <ShareTab
            regattaId={regattaId}
            raceName={raceName}
            currentUserId={currentUserId}
          />
        );

      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER: HEADER
  // ---------------------------------------------------------------------------

  const renderHeader = () => {
    const title = regattaId
      ? raceName || 'Race Crew'
      : className
        ? `${className} Crew`
        : 'Crew Management';

    const subtitle = regattaId
      ? className
        ? `${className}${sailNumber ? ` #${sailNumber}` : ''}`
        : undefined
      : sailNumber
        ? `#${sailNumber}`
        : undefined;

    return (
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={IOS_COLORS.gray} />
        </Pressable>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={[styles.content, { height: drawerHeight }]}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        {renderHeader()}
        {renderTabBar()}

        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
      </ActionsheetContent>
    </Actionsheet>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  content: {
    backgroundColor: IOS_COLORS.systemBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray5,
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.gray6,
  },
  activeTab: {
    backgroundColor: `${IOS_COLORS.blue}15`,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  activeTabText: {
    color: IOS_COLORS.blue,
  },
  tabContent: {
    flex: 1,
  },
});

export default CrewHub;
