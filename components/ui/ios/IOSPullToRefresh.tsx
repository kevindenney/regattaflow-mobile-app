/**
 * IOSPullToRefresh.tsx
 * iOS-style pull-to-refresh wrapper with haptic feedback
 * Following Apple Human Interface Guidelines
 */

import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  FlatList,
  FlatListProps,
  SectionList,
  SectionListProps,
  Platform,
} from 'react-native';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

interface IOSRefreshControlProps {
  /** Called when refresh is triggered */
  onRefresh: () => Promise<void> | void;
  /** Custom tint color (defaults to iOS system blue) */
  tintColor?: string;
  /** Whether refresh is in progress (controlled mode) */
  refreshing?: boolean;
  /** Disable haptic feedback */
  disableHaptics?: boolean;
}

/**
 * Hook to create iOS-style refresh control props
 */
export function useIOSRefresh({
  onRefresh,
  tintColor = IOS_COLORS.systemBlue,
  refreshing: controlledRefreshing,
  disableHaptics = false,
}: IOSRefreshControlProps) {
  const [internalRefreshing, setInternalRefreshing] = useState(false);

  // Use controlled or internal state
  const isRefreshing = controlledRefreshing ?? internalRefreshing;

  const handleRefresh = useCallback(async () => {
    // Trigger haptic feedback when pull is released
    if (!disableHaptics && Platform.OS === 'ios') {
      triggerHaptic('impactMedium');
    }

    setInternalRefreshing(true);

    try {
      await onRefresh();
    } finally {
      setInternalRefreshing(false);

      // Success haptic when refresh completes
      if (!disableHaptics && Platform.OS === 'ios') {
        triggerHaptic('notificationSuccess');
      }
    }
  }, [onRefresh, disableHaptics]);

  return {
    refreshing: isRefreshing,
    onRefresh: handleRefresh,
    tintColor,
    colors: Platform.OS === 'android' ? [tintColor] : undefined,
    progressBackgroundColor: Platform.OS === 'android' ? IOS_COLORS.systemBackground : undefined,
  };
}

/**
 * Creates a RefreshControl component with iOS styling
 */
export function IOSRefreshControl(props: IOSRefreshControlProps) {
  const refreshProps = useIOSRefresh(props);
  return <RefreshControl {...refreshProps} />;
}

/**
 * ScrollView with built-in iOS-style pull-to-refresh
 */
interface IOSRefreshScrollViewProps extends Omit<ScrollViewProps, 'refreshControl'> {
  /** Called when refresh is triggered */
  onRefresh: () => Promise<void> | void;
  /** Whether refresh is in progress */
  refreshing?: boolean;
  /** Custom tint color */
  refreshTintColor?: string;
  /** Disable haptic feedback */
  disableHaptics?: boolean;
}

export function IOSRefreshScrollView({
  onRefresh,
  refreshing,
  refreshTintColor,
  disableHaptics,
  children,
  ...scrollViewProps
}: IOSRefreshScrollViewProps) {
  const refreshProps = useIOSRefresh({
    onRefresh,
    refreshing,
    tintColor: refreshTintColor,
    disableHaptics,
  });

  return (
    <ScrollView
      {...scrollViewProps}
      refreshControl={<RefreshControl {...refreshProps} />}
    >
      {children}
    </ScrollView>
  );
}

/**
 * FlatList with built-in iOS-style pull-to-refresh
 */
interface IOSRefreshFlatListProps<T> extends Omit<FlatListProps<T>, 'refreshControl'> {
  /** Called when refresh is triggered */
  onRefresh: () => Promise<void> | void;
  /** Whether refresh is in progress */
  refreshing?: boolean;
  /** Custom tint color */
  refreshTintColor?: string;
  /** Disable haptic feedback */
  disableHaptics?: boolean;
}

export function IOSRefreshFlatList<T>({
  onRefresh,
  refreshing,
  refreshTintColor,
  disableHaptics,
  ...flatListProps
}: IOSRefreshFlatListProps<T>) {
  const refreshProps = useIOSRefresh({
    onRefresh,
    refreshing,
    tintColor: refreshTintColor,
    disableHaptics,
  });

  return (
    <FlatList<T>
      {...flatListProps}
      refreshControl={<RefreshControl {...refreshProps} />}
    />
  );
}

/**
 * SectionList with built-in iOS-style pull-to-refresh
 */
interface IOSRefreshSectionListProps<T, S> extends Omit<SectionListProps<T, S>, 'refreshControl'> {
  /** Called when refresh is triggered */
  onRefresh: () => Promise<void> | void;
  /** Whether refresh is in progress */
  refreshing?: boolean;
  /** Custom tint color */
  refreshTintColor?: string;
  /** Disable haptic feedback */
  disableHaptics?: boolean;
}

export function IOSRefreshSectionList<T, S>({
  onRefresh,
  refreshing,
  refreshTintColor,
  disableHaptics,
  ...sectionListProps
}: IOSRefreshSectionListProps<T, S>) {
  const refreshProps = useIOSRefresh({
    onRefresh,
    refreshing,
    tintColor: refreshTintColor,
    disableHaptics,
  });

  return (
    <SectionList<T, S>
      {...sectionListProps}
      refreshControl={<RefreshControl {...refreshProps} />}
    />
  );
}

export default IOSRefreshControl;
