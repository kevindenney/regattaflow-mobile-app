/**
 * TracTrac Live Tracking Service
 * 
 * Integration with TracTrac's live race tracking system.
 * Provides real-time boat positions, race status, and replay functionality.
 * 
 * TracTrac is used at major sailing events including:
 * - America's Cup
 * - Volvo Ocean Race
 * - Dragon Class championships
 * - Olympic sailing
 */

import {
  TracTracEvent,
  TracTracRace,
  TracTracBoat,
  TracTracLiveUpdate,
  LiveTrackingSession,
  LiveBoat,
  GPSPosition,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

const TRACTRAC_API_BASE = 'https://api.tractrac.com/v1';
const TRACTRAC_WS_BASE = 'wss://live.tractrac.com/ws';

export interface TracTracConfig {
  apiKey?: string;
  eventId?: string;
  onUpdate?: (update: TracTracLiveUpdate) => void;
  onStatusChange?: (status: LiveTrackingSession['status']) => void;
  updateInterval?: number; // ms, for polling fallback
}

// ============================================================================
// Service Class
// ============================================================================

export class TracTracService {
  private config: TracTracConfig;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private boats: Map<string, LiveBoat> = new Map();
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: TracTracConfig = {}) {
    this.config = {
      updateInterval: 1000,
      ...config,
    };
  }

  // ==========================================================================
  // Event & Race Data (REST API)
  // ==========================================================================

  /**
   * Get event details
   */
  async getEvent(eventId: string): Promise<TracTracEvent | null> {
    try {
      const response = await fetch(`${TRACTRAC_API_BASE}/events/${eventId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error(`TracTrac API error: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch TracTrac event:', error);
      return null;
    }
  }

  /**
   * Get races for an event
   */
  async getRaces(eventId: string): Promise<TracTracRace[]> {
    try {
      const response = await fetch(`${TRACTRAC_API_BASE}/events/${eventId}/races`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch TracTrac races:', error);
      return [];
    }
  }

  /**
   * Get boats in a race
   */
  async getBoats(eventId: string, raceId: string): Promise<TracTracBoat[]> {
    try {
      const response = await fetch(
        `${TRACTRAC_API_BASE}/events/${eventId}/races/${raceId}/boats`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch TracTrac boats:', error);
      return [];
    }
  }

  /**
   * Get historical track data for replay
   */
  async getTrackHistory(
    eventId: string,
    raceId: string,
    boatId: string
  ): Promise<GPSPosition[]> {
    try {
      const response = await fetch(
        `${TRACTRAC_API_BASE}/events/${eventId}/races/${raceId}/boats/${boatId}/track`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.positions || [];
    } catch (error) {
      console.error('Failed to fetch TracTrac track history:', error);
      return [];
    }
  }

  // ==========================================================================
  // Live Tracking (WebSocket)
  // ==========================================================================

  /**
   * Connect to live tracking for an event/race
   */
  connect(eventId: string, raceId?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.disconnect();
    }

    const url = raceId
      ? `${TRACTRAC_WS_BASE}/${eventId}/${raceId}`
      : `${TRACTRAC_WS_BASE}/${eventId}`;

    this.config.onStatusChange?.('connecting');

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('TracTrac WebSocket connected');
        this.reconnectAttempts = 0;
        this.config.onStatusChange?.('connected');

        // Subscribe to updates
        if (this.config.apiKey) {
          this.ws?.send(JSON.stringify({
            type: 'auth',
            apiKey: this.config.apiKey,
          }));
        }

        this.ws?.send(JSON.stringify({
          type: 'subscribe',
          eventId,
          raceId,
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.error('Failed to parse TracTrac message:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('TracTrac WebSocket error:', error);
        this.config.onStatusChange?.('error');
      };

      this.ws.onclose = () => {
        console.log('TracTrac WebSocket closed');
        this.config.onStatusChange?.('disconnected');
        this.attemptReconnect(eventId, raceId);
      };
    } catch (error) {
      console.error('Failed to create TracTrac WebSocket:', error);
      this.config.onStatusChange?.('error');
      // Fall back to polling
      this.startPolling(eventId, raceId);
    }
  }

  /**
   * Disconnect from live tracking
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopPolling();
    this.boats.clear();
    this.config.onStatusChange?.('disconnected');
  }

  /**
   * Get current boat positions
   */
  getBoatPositions(): LiveBoat[] {
    return Array.from(this.boats.values());
  }

  /**
   * Get a specific boat's position
   */
  getBoatPosition(boatId: string): LiveBoat | undefined {
    return this.boats.get(boatId);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'position':
        this.handlePositionUpdate(data);
        break;
      case 'race_status':
        console.log('Race status update:', data.status);
        break;
      case 'boat_status':
        this.handleBoatStatusUpdate(data);
        break;
      case 'error':
        console.error('TracTrac error:', data.message);
        break;
      default:
        console.log('Unknown TracTrac message type:', data.type);
    }
  }

  private handlePositionUpdate(data: any): void {
    const update: TracTracLiveUpdate = {
      eventId: data.eventId,
      raceId: data.raceId,
      boatId: data.boatId,
      position: {
        lat: data.lat,
        lng: data.lng,
        timestamp: data.timestamp,
      },
      speed: data.speed || 0,
      heading: data.heading || 0,
      timestamp: data.timestamp,
    };

    // Update boat in map
    const existing = this.boats.get(data.boatId);
    const boat: LiveBoat = {
      id: data.boatId,
      sailNumber: data.sailNumber || existing?.sailNumber || '',
      name: data.boatName || existing?.name,
      position: update.position,
      speed: update.speed,
      heading: update.heading,
      isActive: true,
      color: existing?.color || this.generateColor(data.boatId),
      trail: this.updateTrail(existing?.trail || [], update.position),
    };

    this.boats.set(data.boatId, boat);
    this.config.onUpdate?.(update);
  }

  private handleBoatStatusUpdate(data: any): void {
    const boat = this.boats.get(data.boatId);
    if (boat) {
      boat.isActive = data.isActive ?? boat.isActive;
      this.boats.set(data.boatId, boat);
    }
  }

  private updateTrail(trail: GPSPosition[], newPos: GPSPosition): GPSPosition[] {
    const maxTrailLength = 100;
    const updated = [...trail, newPos];
    return updated.slice(-maxTrailLength);
  }

  private generateColor(boatId: string): string {
    // Generate consistent color from boat ID
    let hash = 0;
    for (let i = 0; i < boatId.length; i++) {
      hash = boatId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  private attemptReconnect(eventId: string, raceId?: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached, falling back to polling');
      this.startPolling(eventId, raceId);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting to TracTrac in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(eventId, raceId);
    }, delay);
  }

  private startPolling(eventId: string, raceId?: string): void {
    this.stopPolling();
    
    const poll = async () => {
      if (raceId) {
        const boats = await this.getBoats(eventId, raceId);
        boats.forEach(boat => {
          if (boat.currentPosition) {
            this.handlePositionUpdate({
              eventId,
              raceId,
              boatId: boat.id,
              sailNumber: boat.sailNumber,
              boatName: boat.boatName,
              lat: boat.currentPosition.lat,
              lng: boat.currentPosition.lng,
              timestamp: boat.lastUpdate || Date.now(),
            });
          }
        });
      }
    };

    this.pollingInterval = setInterval(poll, this.config.updateInterval);
    poll(); // Initial poll
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

export default TracTracService;

