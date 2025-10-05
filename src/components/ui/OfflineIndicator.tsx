/**
 * Offline Indicator Component
 *
 * Displays offline/online status and sync progress
 */

import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useOffline } from '@/src/hooks/useOffline';

export function OfflineIndicator() {
  const { isOnline, isSyncing, queueLength, failedItems, lastSync, forceSyncNow } = useOffline();

  // Format last sync time
  const getLastSyncText = () => {
    if (!lastSync) return '';
    const now = Date.now();
    const diffMs = now - lastSync;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (isOnline && !isSyncing && queueLength === 0) {
    return null; // Don't show anything when fully synced
  }

  return (
    <View
      style={{
        backgroundColor: isOnline ? '#10b981' : '#ef4444',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {isSyncing && <ActivityIndicator size="small" color="white" />}

      <View>
        <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
          {!isOnline && '📡 Offline Mode'}
          {isOnline && isSyncing && `⬆️ Syncing ${queueLength} items...`}
          {isOnline && !isSyncing && queueLength > 0 && `⏸️ ${queueLength} pending`}
        </Text>
        {lastSync && isOnline && !isSyncing && queueLength === 0 && (
          <Text style={{ color: 'white', fontSize: 10, opacity: 0.9 }}>
            Synced {getLastSyncText()}
          </Text>
        )}
      </View>

      {failedItems > 0 && (
        <TouchableOpacity onPress={forceSyncNow}>
          <Text style={{ color: 'white', fontSize: 12, textDecorationLine: 'underline' }}>
            Retry {failedItems} failed
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Cached Data Badge
 * 
 * Shows "Using cached data" on cards when displaying offline data
 */
export function CachedBadge() {
  const { isOnline } = useOffline();

  if (isOnline) return null;

  return (
    <View
      style={{
        backgroundColor: '#f59e0b',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
      }}
    >
      <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
        📦 Cached
      </Text>
    </View>
  );
}
