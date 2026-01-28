/**
 * MasterDetailLayout - Two-pane split view for web
 *
 * On wide web screens (>= 1024px): Renders list on left, detail on right
 * On mobile or narrow web: Renders only master content; detail uses router.push()
 *
 * Usage:
 * ```tsx
 * <MasterDetailLayout
 *   masterContent={<RaceList onSelect={setSelectedId} selectedId={selectedId} />}
 *   detailContent={selectedId ? <RaceDetail raceId={selectedId} /> : null}
 *   detailPlaceholder={<Text>Select a race to view details</Text>}
 * />
 * ```
 */

import React, { createContext, useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { Ionicons } from '@expo/vector-icons';

// =============================================================================
// CONTEXT
// =============================================================================

interface MasterDetailContextValue {
  /** Currently selected item ID in master-detail mode */
  selectedId: string | null;
  /** Set the selected item ID */
  setSelectedId: (id: string | null) => void;
  /** Whether master-detail split is currently active */
  showMasterDetail: boolean;
}

const MasterDetailContext = createContext<MasterDetailContextValue>({
  selectedId: null,
  setSelectedId: () => {},
  showMasterDetail: false,
});

export const useMasterDetail = () => useContext(MasterDetailContext);

// =============================================================================
// COMPONENT
// =============================================================================

interface MasterDetailLayoutProps {
  /** The list / master pane content */
  masterContent: React.ReactNode;
  /** The detail pane content (shown in right pane on wide screens) */
  detailContent: React.ReactNode | null;
  /** Placeholder shown when no detail is selected */
  detailPlaceholder?: React.ReactNode;
  /** Current selected item ID */
  selectedId?: string | null;
  /** Callback when selected ID changes */
  onSelectedIdChange?: (id: string | null) => void;
}

export function MasterDetailLayout({
  masterContent,
  detailContent,
  detailPlaceholder,
  selectedId = null,
  onSelectedIdChange,
}: MasterDetailLayoutProps) {
  const { showMasterDetail, masterWidth } = useResponsiveLayout();

  const contextValue: MasterDetailContextValue = {
    selectedId,
    setSelectedId: onSelectedIdChange ?? (() => {}),
    showMasterDetail,
  };

  // Single-column mode (mobile or narrow web): just render master content
  if (!showMasterDetail) {
    return (
      <MasterDetailContext.Provider value={contextValue}>
        <View style={styles.singleColumn}>
          {masterContent}
        </View>
      </MasterDetailContext.Provider>
    );
  }

  // Master-detail split view (wide web)
  return (
    <MasterDetailContext.Provider value={contextValue}>
      <View style={styles.splitContainer}>
        {/* Master (list) pane */}
        <View style={[styles.masterPane, { width: masterWidth }]}>
          {masterContent}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Detail pane */}
        <View style={styles.detailPane}>
          {detailContent ?? detailPlaceholder ?? <DefaultDetailPlaceholder />}
        </View>
      </View>
    </MasterDetailContext.Provider>
  );
}

// =============================================================================
// DEFAULT PLACEHOLDER
// =============================================================================

function DefaultDetailPlaceholder() {
  return (
    <View style={styles.placeholderContainer}>
      <View style={styles.placeholderIcon}>
        <Ionicons name="flag-outline" size={40} color={IOS_COLORS.tertiaryLabel} />
      </View>
      <Text style={styles.placeholderTitle}>No Selection</Text>
      <Text style={styles.placeholderSubtitle}>
        Select an item from the list to view details.
      </Text>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  singleColumn: {
    flex: 1,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  masterPane: {
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    height: '100%',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
  },
  detailPane: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  placeholderSubtitle: {
    fontSize: 15,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
    maxWidth: 280,
  },
});
