import { supabase } from './supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface RealtimeSubscriptionConfig {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  schema?: string;
}

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    // TEMPORARILY DISABLED for diagnostics - investigating memory crash
    // this.initializeConnectionMonitoring();
    console.log('[Realtime] Service initialized (connection monitoring disabled for diagnostics)');
  }

  /**
   * Initialize connection monitoring
   * Note: Supabase v2+ monitors connection through individual channels
   */
  private initializeConnectionMonitoring() {
    // In Supabase v2+, connection status is monitored per-channel
    // The subscribe() method handles status updates via channel callbacks
    console.log('[Realtime] Connection monitoring initialized');
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Realtime] Max reconnection attempts reached');
      this.setConnectionStatus('disconnected');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.setConnectionStatus('reconnecting');
    this.reconnectAttempts++;

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      console.log('[Realtime] Attempting to reconnect...');
      // Resubscribe all channels
      this.resubscribeAll();
    }, delay);
  }

  /**
   * Resubscribe all active channels
   */
  private async resubscribeAll() {
    const channelIds = Array.from(this.channels.keys());
    console.log(`[Realtime] Resubscribing ${channelIds.length} channels`);

    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId);
      if (channel) {
        try {
          await channel.subscribe();
        } catch (error) {
          console.error(`[Realtime] Failed to resubscribe channel ${channelId}:`, error);
        }
      }
    }
  }

  /**
   * Set connection status and notify listeners
   */
  private setConnectionStatus(status: ConnectionStatus) {
    if (this.connectionStatus === status) return;

    this.connectionStatus = status;
    console.log(`[Realtime] Connection status changed to: ${status}`);

    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('[Realtime] Error notifying status listener:', error);
      }
    });
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    // Immediately notify with current status
    callback(this.connectionStatus);

    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Subscribe to database changes
   */
  subscribe<T = any>(
    channelName: string,
    config: RealtimeSubscriptionConfig,
    callback: (payload: RealtimePostgresChangesPayload<T>) => void
  ): RealtimeChannel {
    // Check if channel already exists
    if (this.channels.has(channelName)) {
      console.warn(`[Realtime] Channel ${channelName} already exists`);
      return this.channels.get(channelName)!;
    }

    console.log(`[Realtime] Creating subscription: ${channelName}`, config);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        },
        (payload) => {
          console.log(`[Realtime] ${channelName} event:`, payload);
          callback(payload as RealtimePostgresChangesPayload<T>);
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] ${channelName} subscription status:`, status);
        if (status === 'SUBSCRIBED') {
          this.setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.setConnectionStatus('reconnecting');
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      console.warn(`[Realtime] Channel ${channelName} not found`);
      return;
    }

    console.log(`[Realtime] Unsubscribing from: ${channelName}`);
    await supabase.removeChannel(channel);
    this.channels.delete(channelName);
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    console.log(`[Realtime] Unsubscribing from all ${this.channels.size} channels`);

    const unsubscribePromises = Array.from(this.channels.keys()).map(
      channelName => this.unsubscribe(channelName)
    );

    await Promise.all(unsubscribePromises);
  }

  /**
   * Manually trigger reconnection
   */
  forceReconnect(): void {
    console.log('[Realtime] Forcing reconnection');
    this.reconnectAttempts = 0;
    this.attemptReconnect();
  }

  /**
   * Clean up all subscriptions and timers
   */
  async cleanup(): Promise<void> {
    console.log('[Realtime] Cleaning up service');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    await this.unsubscribeAll();
    this.statusListeners.clear();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Export helper function for creating unique channel names
export const createChannelName = (prefix: string, id?: string): string => {
  return id ? `${prefix}:${id}` : prefix;
};
