import type { GeoLocation, BoundingBox } from '@/lib/types/advanced-map';
import { VesselData, VesselType, NavigationStatus, FleetTrackingOptions } from './MarineTrafficAISService';

export interface AISStreamConfig {
  apiKey: string;
  wsUrl: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface AISStreamMessage {
  MessageType: string;
  MetaData: {
    MMSI: number;
    ShipName?: string;
    latitude: number;
    longitude: number;
    time_utc: string;
  };
  Message: {
    PositionReport?: {
      Cog: number;  // Course Over Ground
      Sog: number;  // Speed Over Ground
      TrueHeading: number;
      NavigationalStatus: number;
    };
    StaticAndVoyageRelatedData?: {
      CallSign: string;
      ImoNumber: number;
      Destination: string;
      TypeOfShipAndCargo: number;
      Dimensions: {
        A: number;
        B: number;
        C: number;
        D: number;
      };
    };
  };
}

export class AISStreamService {
  private config: AISStreamConfig;
  private websocket: WebSocket | null = null;
  private vessels: Map<number, VesselData> = new Map();
  private subscribers: Map<string, (vessels: VesselData[]) => void> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private currentBounds: BoundingBox | null = null;

  constructor(config: Partial<AISStreamConfig> & { apiKey: string }) {
    this.config = {
      wsUrl: 'wss://stream.aisstream.io/v0/stream',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...config
    };
  }

  async connect(bounds: BoundingBox): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return;
    }

    this.currentBounds = bounds;
    this.connectionState = 'connecting';

    try {
      await this.establishConnection();
    } catch (error) {

      this.scheduleReconnect();
    }
  }

  private async establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.config.wsUrl);

        const connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.websocket.onopen = () => {
          clearTimeout(connectionTimeout);
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
          this.sendSubscription();
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.websocket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.connectionState = 'disconnected';

          if (event.code !== 1000) { // Not a normal closure
            this.scheduleReconnect();
          }
        };

        this.websocket.onerror = (error) => {
          clearTimeout(connectionTimeout);

          this.connectionState = 'disconnected';
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private sendSubscription(): void {
    if (!this.websocket || !this.currentBounds) return;

    const subscriptionMessage = {
      Apikey: this.config.apiKey,
      BoundingBoxes: [[
        this.currentBounds.southwest.latitude,
        this.currentBounds.southwest.longitude
      ], [
        this.currentBounds.northeast.latitude,
        this.currentBounds.northeast.longitude
      ]],
      FilterMessageTypes: ["PositionReport", "StaticAndVoyageRelatedData"],
      FiltersShipMMSI: [], // Empty to get all ships
      FiltersShipIMO: [],
      FiltersShipType: [36, 37] // Sailing vessels
    };

    try {
      this.websocket.send(JSON.stringify(subscriptionMessage));
    } catch (error) {

    }
  }

  private handleMessage(data: string): void {
    try {
      const message: AISStreamMessage = JSON.parse(data);
      this.processAISMessage(message);
    } catch (error) {

    }
  }

  private processAISMessage(message: AISStreamMessage): void {
    const mmsi = message.MetaData.MMSI;
    const existingVessel = this.vessels.get(mmsi);

    // Create or update vessel data
    const vessel: VesselData = {
      id: `ais_${mmsi}`,
      mmsi: mmsi,
      name: message.MetaData.ShipName || existingVessel?.name || 'Unknown Vessel',
      callSign: message.Message.StaticAndVoyageRelatedData?.CallSign || existingVessel?.callSign || '',
      imo: message.Message.StaticAndVoyageRelatedData?.ImoNumber || existingVessel?.imo,
      type: this.determineVesselType(
        message.Message.StaticAndVoyageRelatedData?.TypeOfShipAndCargo,
        message.MetaData.ShipName
      ),
      position: {
        latitude: message.MetaData.latitude,
        longitude: message.MetaData.longitude,
        course: message.Message.PositionReport?.Cog || 0,
        speed: message.Message.PositionReport?.Sog || 0,
        heading: message.Message.PositionReport?.TrueHeading || message.Message.PositionReport?.Cog || 0,
        timestamp: new Date(message.MetaData.time_utc),
        accuracy: 'high'
      },
      dimensions: this.calculateDimensions(message.Message.StaticAndVoyageRelatedData?.Dimensions),
      destination: message.Message.StaticAndVoyageRelatedData?.Destination || existingVessel?.destination,
      status: this.mapNavigationStatus(message.Message.PositionReport?.NavigationalStatus),
      raceData: this.generateRaceData(mmsi, message)
    };

    this.vessels.set(mmsi, vessel);
    this.notifySubscribers();
  }

  private determineVesselType(shipType?: number, shipName?: string): VesselType {
    if (shipType) {
      if (shipType >= 36 && shipType <= 37) return VesselType.SAILING;
      if (shipType >= 30 && shipType <= 35) return VesselType.FISHING;
      if (shipType >= 60 && shipType <= 69) return VesselType.PASSENGER;
      if (shipType >= 70 && shipType <= 79) return VesselType.CARGO;
      if (shipType >= 80 && shipType <= 89) return VesselType.TANKER;
    }

    // Detect racing yachts by name patterns
    if (shipName) {
      const namePattern = /race|regatta|yacht|sailing|cup/i;
      if (namePattern.test(shipName)) {
        return VesselType.RACING_YACHT;
      }
    }

    return VesselType.UNKNOWN;
  }

  private calculateDimensions(dimensions?: any): { length: number; width: number; draft?: number } {
    if (!dimensions) {
      return { length: 0, width: 0 };
    }

    // AIS dimensions are from reference point to bow/stern/port/starboard
    const length = (dimensions.A || 0) + (dimensions.B || 0);
    const width = (dimensions.C || 0) + (dimensions.D || 0);

    return { length, width };
  }

  private mapNavigationStatus(status?: number): NavigationStatus {
    if (status === undefined) return NavigationStatus.UNKNOWN;

    switch (status) {
      case 0: return NavigationStatus.UNDER_WAY;
      case 1: return NavigationStatus.AT_ANCHOR;
      case 2: return NavigationStatus.NOT_UNDER_COMMAND;
      case 3: return NavigationStatus.RESTRICTED_MANEUVERABILITY;
      case 4: return NavigationStatus.CONSTRAINED_BY_DRAFT;
      case 5: return NavigationStatus.MOORED;
      case 6: return NavigationStatus.AGROUND;
      case 8: return NavigationStatus.RACING; // Engaged in sailing (racing)
      case 15: return NavigationStatus.UNKNOWN;
      default: return NavigationStatus.UNDER_WAY;
    }
  }

  private generateRaceData(mmsi: number, message: AISStreamMessage): VesselData['raceData'] {
    const vesselName = message.MetaData.ShipName || '';
    const speed = message.Message.PositionReport?.Sog || 0;
    const course = message.Message.PositionReport?.Cog || 0;

    // Only generate race data for sailing vessels
    const shipType = message.Message.StaticAndVoyageRelatedData?.TypeOfShipAndCargo;
    if (shipType && (shipType < 36 || shipType > 37)) {
      return undefined;
    }

    let tacticalRole: 'leader' | 'challenger' | 'follower' = 'follower';
    if (speed > 8) tacticalRole = 'leader';
    else if (speed > 6) tacticalRole = 'challenger';

    return {
      sailNumber: this.extractSailNumber(vesselName),
      class: this.determineRaceClass(this.calculateDimensions(message.Message.StaticAndVoyageRelatedData?.Dimensions).length),
      tacticalRole,
      laylinePosition: this.calculateLaylinePosition(course),
      windDirection: course + 45 // Simplified wind direction estimation
    };
  }

  private extractSailNumber(vesselName: string): string | undefined {
    const sailNumberMatch = vesselName.match(/\b([A-Z]{1,3}\d{1,5})\b/);
    return sailNumberMatch ? sailNumberMatch[1] : undefined;
  }

  private determineRaceClass(length: number): string | undefined {
    if (length > 60) return 'Maxi';
    if (length > 40) return 'IRC 0';
    if (length > 35) return 'IRC 1';
    if (length > 30) return 'IRC 2';
    if (length > 25) return 'IRC 3';
    if (length > 20) return 'IRC 4';
    return 'One Design';
  }

  private calculateLaylinePosition(course: number): 'favored' | 'lifted' | 'headed' {
    const windAngle = course % 90;
    if (windAngle < 30) return 'lifted';
    if (windAngle > 60) return 'headed';
    return 'favored';
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {

      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.min(this.reconnectAttempts, 5);

    this.reconnectTimer = setTimeout(() => {
      if (this.currentBounds) {
        this.connect(this.currentBounds);
      }
    }, delay);
  }

  private notifySubscribers(): void {
    const vessels = Array.from(this.vessels.values());

    // Filter for racing vessels
    const racingVessels = vessels.filter(vessel =>
      vessel.type === VesselType.SAILING ||
      vessel.type === VesselType.RACING_YACHT ||
      vessel.status === NavigationStatus.RACING
    );

    this.subscribers.forEach(callback => {
      callback(racingVessels);
    });
  }

  // Public API methods to match MarineTrafficAISService interface
  async getVesselsInArea(bounds: BoundingBox, options: Partial<FleetTrackingOptions> = {}): Promise<VesselData[]> {
    // If not connected, try to connect
    if (this.connectionState === 'disconnected') {
      await this.connect(bounds);
    }

    // Return current vessels in the area
    return Array.from(this.vessels.values()).filter(vessel => {
      const lat = vessel.position.latitude;
      const lon = vessel.position.longitude;
      return lat >= bounds.southwest.latitude &&
             lat <= bounds.northeast.latitude &&
             lon >= bounds.southwest.longitude &&
             lon <= bounds.northeast.longitude;
    });
  }

  async startFleetTracking(
    bounds: BoundingBox,
    callback: (vessels: VesselData[]) => void,
    options: Partial<FleetTrackingOptions> = {}
  ): Promise<string> {
    const trackingId = `ais_fleet_${Date.now()}`;

    // Subscribe to vessel updates
    this.subscribers.set(trackingId, callback);

    // Connect if not already connected
    if (this.connectionState === 'disconnected') {
      await this.connect(bounds);
    }

    // Send initial data
    const currentVessels = await this.getVesselsInArea(bounds, options);
    callback(currentVessels);

    return trackingId;
  }

  stopFleetTracking(trackingId: string): void {
    this.subscribers.delete(trackingId);

    // If no more subscribers, we could optionally disconnect
    if (this.subscribers.size === 0) {
      this.disconnect();
    }
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close(1000, 'Normal closure');
      this.websocket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.connectionState = 'disconnected';
    this.vessels.clear();
    this.subscribers.clear();
    this.reconnectAttempts = 0;

  }

  destroy(): void {
    this.disconnect();
  }

  // Status methods
  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  getVesselCount(): number {
    return this.vessels.size;
  }

  getConnectionState(): string {
    return this.connectionState;
  }
}