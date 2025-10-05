import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRealtimeConnection } from '@/src/hooks/useRealtimeConnection';

interface RealtimeConnectionIndicatorProps {
  variant?: 'compact' | 'full';
  showLabel?: boolean;
}

export function RealtimeConnectionIndicator({
  variant = 'compact',
  showLabel = true,
}: RealtimeConnectionIndicatorProps) {
  const { status, isConnected, isReconnecting, forceReconnect } = useRealtimeConnection();

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#10B981'; // green
      case 'reconnecting':
        return '#F59E0B'; // amber
      case 'disconnected':
        return '#EF4444'; // red
      default:
        return '#94A3B8'; // gray
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return 'wifi';
      case 'reconnecting':
        return 'wifi-sync';
      case 'disconnected':
        return 'wifi-off';
      default:
        return 'wifi';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'connected':
        return 'Live';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={!isConnected ? forceReconnect : undefined}
        disabled={isReconnecting}
      >
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        {showLabel && <Text style={styles.compactLabel}>{getStatusLabel()}</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <View style={styles.statusRow}>
        {isReconnecting ? (
          <ActivityIndicator size="small" color={getStatusColor()} />
        ) : (
          <MaterialCommunityIcons
            name={getStatusIcon() as any}
            size={20}
            color={getStatusColor()}
          />
        )}
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusLabel()}
        </Text>
      </View>

      {!isConnected && !isReconnecting && (
        <TouchableOpacity style={styles.retryButton} onPress={forceReconnect}>
          <MaterialCommunityIcons name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
