// @ts-nocheck

import { supabase } from './supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RealtimeService');

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
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // TEMPORARILY DISABLED for diagnostics - investigating memory crash
    // this.initializeConnectionMonitoring();
    logger.debug('Service initialized (connection monitoring disabled for diagnostics)');
  }

// @ts-nocheck

/**
   * Initialize connection monitoring
   * Note: Supabase v2+ monitors connection through individual channels
   */
  private initializeConnectionMonitoring() {
    // In Supabase v2+, connection status is monitored per-channel
    // The subscribe() method handles status updates via channel callbacks
    logger.debug('Connection monitoring initialized');
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      this.setConnectionStatus('disconnected');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.setConnectionStatus('reconnecting');
    this.reconnectAttempts++;

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    logger.debug(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      logger.debug('Attempting to reconnect...');
      // Resubscribe all channels
      this.resubscribeAll();
    }, delay);
  }

  /**
   * Resubscribe all active channels
   */
  private async resubscribeAll() {
    const channelIds = Array.from(this.channels.keys());
    logger.debug(`Resubscribing ${channelIds.length} channels`);

    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId);
      if (channel) {
        try {
          await channel.subscribe();
        } catch (error) {
          logger.error(`Failed to resubscribe channel ${channelId}:`, error);
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
    logger.debug(`Connection status changed to: ${status}`);

    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        logger.error('Error notifying status listener:', error);
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
    // Check if channel already exists in our map
    if (this.channels.has(channelName)) {
      logger.debug(`Reusing existing channel: ${channelName}`);
      return this.channels.get(channelName)!;
    }

    // Check if Supabase already has this channel and remove it
    const existingChannel = supabase.getChannels().find(ch => ch.topic === channelName);
    if (existingChannel) {
      logger.debug(`Removing stale Supabase channel: ${channelName}`);
      supabase.removeChannel(existingChannel);
    }

    logger.debug(`Creating subscription: ${channelName}`);

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
          logger.debug(`${channelName} event received`);
          callback(payload as RealtimePostgresChangesPayload<T>);
        }
      )
      .subscribe((status) => {
        logger.debug(`${channelName} subscription status: ${status}`);
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
      logger.warn(`Channel ${channelName} not found`);
      return;
    }

    logger.debug(`Unsubscribing from: ${channelName}`);
    await supabase.removeChannel(channel);
    this.channels.delete(channelName);
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    logger.debug(`Unsubscribing from all ${this.channels.size} channels`);

    const unsubscribePromises = Array.from(this.channels.keys()).map(
      channelName => this.unsubscribe(channelName)
    );

    await Promise.all(unsubscribePromises);
  }

  /**
   * Manually trigger reconnection
   */
  forceReconnect(): void {
    logger.debug('Forcing reconnection');
    this.reconnectAttempts = 0;
    this.attemptReconnect();
  }

  /**
   * Clean up all subscriptions and timers
   */
  async cleanup(): Promise<void> {
    logger.debug('Cleaning up service');

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
