/**
 * Follow Tab Screen (formerly "Connect" / "Discover")
 *
 * Instagram-style activity feed showing content from followed sailors:
 * - Race schedules and results from followed sailors
 * - Future: Club announcements and posts
 *
 * Discovery of new sailors/clubs is handled by the Search tab.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Share, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FollowActivityFeed } from '@/components/follow';
import { TabScreenToolbar, type ToolbarAction } from '@/components/ui/TabScreenToolbar';
import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { useAuth } from '@/providers/AuthProvider';

export default function FollowTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { toolbarHidden, handleScroll } = useScrollToolbarHide();

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  const handleInvite = useCallback(async () => {
    const inviteUrl = `https://regattaflow.app/invite${user?.id ? `?from=${user.id}` : ''}`;
    try {
      await Share.share({
        message: `Join me on RegattaFlow - the sailing app for racers! ${inviteUrl}`,
        url: inviteUrl,
        title: 'Join RegattaFlow',
      });
    } catch {
      // User cancelled or share failed silently
    }
  }, [user?.id]);

  const handleDiscoverSailors = useCallback(() => {
    router.push('/(tabs)/search');
  }, [router]);

  const handleMoreOptions = useCallback(() => {
    const options = ['Filter by Boat Class', 'Manage Following', 'Cancel'];
    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: 'Feed Options',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            Alert.alert('Filter', 'Filter options coming soon');
          } else if (buttonIndex === 1) {
            router.push('/(tabs)/search');
          }
        }
      );
    } else {
      // Android/web fallback using Alert
      Alert.alert('Feed Options', 'Select an option', [
        { text: 'Filter by Boat Class', onPress: () => Alert.alert('Filter', 'Coming soon') },
        { text: 'Manage Following', onPress: () => router.push('/(tabs)/search') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [router]);

  // ---------------------------------------------------------------------------
  // Toolbar actions
  // ---------------------------------------------------------------------------

  const toolbarActions: ToolbarAction[] = useMemo(() => [
    {
      icon: 'person-add-outline',
      sfSymbol: 'person.badge.plus',
      label: 'Find sailors',
      onPress: handleDiscoverSailors,
    },
    {
      icon: 'share-outline',
      sfSymbol: 'square.and.arrow.up',
      label: 'Invite',
      onPress: handleInvite,
    },
    {
      icon: 'ellipsis-horizontal',
      sfSymbol: 'ellipsis',
      label: 'More options',
      onPress: handleMoreOptions,
    },
  ], [handleDiscoverSailors, handleInvite, handleMoreOptions]);

  return (
    <View style={styles.container}>
      <TabScreenToolbar
        title="Follow"
        topInset={insets.top}
        actions={toolbarActions}
        onMeasuredHeight={setToolbarHeight}
        hidden={toolbarHidden}
      />

      <FollowActivityFeed
        toolbarOffset={toolbarHeight}
        onScroll={handleScroll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
});
