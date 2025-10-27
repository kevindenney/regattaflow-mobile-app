import axios from 'axios';
import type { GeoLocation, BoundingBox } from '@/lib/types/advanced-map';

export interface VesselData {
  id: string;
  mmsi: number;
  name: string;
  callSign: string;
  imo?: number;
  type: VesselType;
  position: {
    latitude: number;
    longitude: number;
    course: number;
    speed: number; // knots
    heading: number;
    timestamp: Date;
    accuracy: 'high' | 'medium' | 'low';
  };
  dimensions: {
    length: number;
    width: number;
    draft?: number;
  };
  destination?: string;
  eta?: Date;
  status: NavigationStatus;
  raceData?: {
    sailNumber?: string;
    class?: string;
    team?: string;
    tacticalRole?: 'leader' | 'challenger' | 'follower';
    laylinePosition?: 'favored' | 'lifted' | 'headed';
    windDirection?: number;
  };
}

export enum VesselType {
  SAILING = 'sailing',
  RACING_YACHT = 'racing_yacht',
  MOTOR_YACHT = 'motor_yacht',
  CARGO = 'cargo',
  PASSENGER = 'passenger',
  TANKER = 'tanker',
  FISHING = 'fishing',
  MILITARY = 'military',
  UNKNOWN = 'unknown'
}

export enum NavigationStatus {
  UNDER_WAY = 'under_way',
  AT_ANCHOR = 'at_anchor',
  NOT_UNDER_COMMAND = 'not_under_command',
  RESTRICTED_MANEUVERABILITY = 'restricted_maneuverability',
  CONSTRAINED_BY_DRAFT = 'constrained_by_draft',
  MOORED = 'moored',
  AGROUND = 'aground',
  RACING = 'racing',
  UNKNOWN = 'unknown'
}

export interface FleetTrackingOptions {
  updateInterval: number; // seconds
  trackingRadius: number; // nautical miles
  vesselTypes: VesselType[];
  includeRaceData: boolean;
  historicalTracking: boolean;
  predictiveTracking: boolean;
}

export interface MarineTrafficConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

export class MarineTrafficAISService {
  private config: MarineTrafficConfig;
  private cache: Map<string, { data: VesselData[]; timestamp: number }> = new Map();
  private cacheTimeout = 30 * 1000; // 30 seconds for real-time AIS
  private trackingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: MarineTrafficConfig) {
    this.config = {
      baseUrl: 'https://services.marinetraffic.com/api',
      timeout: 8000,
      retryAttempts: 2,
      ...config
    };
  }

  async getVesselsInArea(bounds: BoundingBox, options: Partial<FleetTrackingOptions> = {}): Promise<VesselData[]> {
    const defaultOptions: FleetTrackingOptions = {
      updateInterval: 30,
      trackingRadius: 10,
      vesselTypes: [VesselType.SAILING, VesselType.RACING_YACHT],
      includeRaceData: true,
      historicalTracking: false,
      predictiveTracking: false,
      ...options
    };

    const cacheKey = `vessels_${bounds.southwest.latitude}_${bounds.southwest.longitude}_${bounds.northeast.latitude}_${bounds.northeast.longitude}`;
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      console.log('📦 Using cached AIS vessel data');
      return cached;
    }

    try {
      const response = await this.makeRequest('/exportvessels/v:8/7b1fcd9c6b8632e26d2b8b2f4f5a0f5e7d1e23a5', {
        protocol: 'json',
        minlat: bounds.southwest.latitude,
        maxlat: bounds.northeast.latitude,
        minlon: bounds.southwest.longitude,
        maxlon: bounds.northeast.longitude,
        timespan: 10 // minutes
      });

      const vessels = this.transformAISData(response.data, defaultOptions);
      this.setCachedData(cacheKey, vessels);

      console.log(`🚢 Retrieved ${vessels.length} vessels from MarineTraffic AIS`);
      return vessels;
    } catch (error) {
      console.error('❌ MarineTraffic AIS error:', error);
      return this.getFallbackVessels(bounds);
    }
  }

  async getVesselByMMSI(mmsi: number): Promise<VesselData | null> {
    try {
      const response = await this.makeRequest('/exportvessel/v:5/7b1fcd9c6b8632e26d2b8b2f4f5a0f5e7d1e23a5', {
        protocol: 'json',
        mmsi: mmsi
      });

      if (!response.data || response.data.length === 0) {
        return null;
      }

      const vessel = this.transformSingleVessel(response.data[0]);
      console.log(`🎯 Retrieved vessel ${vessel.name} (${vessel.mmsi})`);
      return vessel;
    } catch (error) {
      console.error(`❌ Failed to get vessel ${mmsi}:`, error);
      return null;
    }
  }

  async startFleetTracking(
    bounds: BoundingBox,
    callback: (vessels: VesselData[]) => void,
    options: Partial<FleetTrackingOptions> = {}
  ): Promise<string> {
    const trackingId = `fleet_${Date.now()}`;
    const finalOptions: FleetTrackingOptions = {
      updateInterval: 30,
      trackingRadius: 10,
      vesselTypes: [VesselType.SAILING, VesselType.RACING_YACHT],
      includeRaceData: true,
      historicalTracking: false,
      predictiveTracking: false,
      ...options
    };

    console.log(`🔄 Starting fleet tracking (ID: ${trackingId})`);

    const updateFleet = async () => {
      try {
        const vessels = await this.getVesselsInArea(bounds, finalOptions);

        // Add race-specific analysis for sailing vessels
        const enhancedVessels = await this.enhanceWithRaceData(vessels, bounds);

        callback(enhancedVessels);
      } catch (error) {
        console.error('❌ Fleet tracking update failed:', error);
      }
    };

    // Initial update
    await updateFleet();

    // Set up recurring updates
    const interval = setInterval(updateFleet, finalOptions.updateInterval * 1000);
    this.trackingIntervals.set(trackingId, interval);

    return trackingId;
  }

  stopFleetTracking(trackingId: string): void {
    const interval = this.trackingIntervals.get(trackingId);
    if (interval) {
      clearInterval(interval);
      this.trackingIntervals.delete(trackingId);
      console.log(`⏹️ Stopped fleet tracking (ID: ${trackingId})`);
    }
  }

  async getRacingFleet(raceArea: BoundingBox): Promise<VesselData[]> {
    const vessels = await this.getVesselsInArea(raceArea, {
      vesselTypes: [VesselType.SAILING, VesselType.RACING_YACHT],
      includeRaceData: true,
      predictiveTracking: true
    });

    // Filter and enhance racing vessels
    const racingVessels = vessels.filter(vessel =>
      vessel.type === VesselType.RACING_YACHT ||
      vessel.status === NavigationStatus.RACING ||
      (vessel.type === VesselType.SAILING && vessel.position.speed > 3) // Active sailing
    );

    return this.calculateRacePositions(racingVessels, raceArea);
  }

  private async makeRequest(endpoint: string, params: any, attempt: number = 1): Promise<any> {
    try {
      const response = await axios.get(`${this.config.baseUrl}${endpoint}`, {
        params,
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'RegattaFlow Professional v2.0'
        }
      });

      return response;
    } catch (error: any) {
      if (attempt < this.config.retryAttempts) {
        console.log(`🔄 Retrying MarineTraffic request (attempt ${attempt + 1})`);
        await this.delay(1000 * attempt);
        return this.makeRequest(endpoint, params, attempt + 1);
      }
      throw error;
    }
  }

  private transformAISData(data: any[], options: FleetTrackingOptions): VesselData[] {
    if (!Array.isArray(data)) return [];

    return data.map(vessel => this.transformSingleVessel(vessel, options))
      .filter(vessel => vessel !== null) as VesselData[];
  }

  private transformSingleVessel(data: any, options?: FleetTrackingOptions): VesselData | null {
    try {
      const vesselType = this.determineVesselType(data.SHIPTYPE, data.SHIP_ID);

      const vessel: VesselData = {
        id: `mt_${data.MMSI}`,
        mmsi: parseInt(data.MMSI),
        name: data.SHIPNAME || 'Unknown Vessel',
        callSign: data.CALL_SIGN || '',
        imo: data.IMO ? parseInt(data.IMO) : undefined,
        type: vesselType,
        position: {
          latitude: parseFloat(data.LAT),
          longitude: parseFloat(data.LON),
          course: parseFloat(data.COURSE) || 0,
          speed: parseFloat(data.SPEED) || 0,
          heading: parseFloat(data.HEADING) || parseFloat(data.COURSE) || 0,
          timestamp: new Date(data.TIMESTAMP),
          accuracy: this.determinePositionAccuracy(data)
        },
        dimensions: {
          length: parseFloat(data.LENGTH) || 0,
          width: parseFloat(data.WIDTH) || 0,
          draft: data.DRAUGHT ? parseFloat(data.DRAUGHT) : undefined
        },
        destination: data.DESTINATION || undefined,
        eta: data.ETA ? new Date(data.ETA) : undefined,
        status: this.mapNavigationStatus(data.STATUS)
      };

      // Add race data for sailing vessels
      if (options?.includeRaceData && (vesselType === VesselType.SAILING || vesselType === VesselType.RACING_YACHT)) {
        vessel.raceData = this.generateRaceData(vessel);
      }

      return vessel;
    } catch (error) {
      console.error('❌ Failed to transform vessel data:', error);
      return null;
    }
  }

  private determineVesselType(shipType: number, shipId: string): VesselType {
    if (!shipType) return VesselType.UNKNOWN;

    // AIS ship type codes
    if (shipType >= 36 && shipType <= 37) return VesselType.SAILING;
    if (shipType >= 30 && shipType <= 35) return VesselType.FISHING;
    if (shipType >= 60 && shipType <= 69) return VesselType.PASSENGER;
    if (shipType >= 70 && shipType <= 79) return VesselType.CARGO;
    if (shipType >= 80 && shipType <= 89) return VesselType.TANKER;

    // Detect racing yachts by name patterns or specific IDs
    const namePattern = /race|regatta|yacht|sailing|cup/i;
    if (shipId && namePattern.test(shipId)) {
      return VesselType.RACING_YACHT;
    }

    return VesselType.UNKNOWN;
  }

  private determinePositionAccuracy(data: any): 'high' | 'medium' | 'low' {
    const age = Date.now() - new Date(data.TIMESTAMP).getTime();
    const ageMinutes = age / (1000 * 60);

    if (ageMinutes < 2) return 'high';
    if (ageMinutes < 10) return 'medium';
    return 'low';
  }

  private mapNavigationStatus(status: number): NavigationStatus {
    switch (status) {
      case 0: return NavigationStatus.UNDER_WAY;
      case 1: return NavigationStatus.AT_ANCHOR;
      case 2: return NavigationStatus.NOT_UNDER_COMMAND;
      case 3: return NavigationStatus.RESTRICTED_MANEUVERABILITY;
      case 4: return NavigationStatus.CONSTRAINED_BY_DRAFT;
      case 5: return NavigationStatus.MOORED;
      case 6: return NavigationStatus.AGROUND;
      case 15: return NavigationStatus.UNKNOWN;
      default: return NavigationStatus.UNDER_WAY;
    }
  }

  private generateRaceData(vessel: VesselData): VesselData['raceData'] {
    // Generate tactical race data based on vessel behavior
    const speed = vessel.position.speed;
    const course = vessel.position.course;

    let tacticalRole: 'leader' | 'challenger' | 'follower' = 'follower';
    if (speed > 8) tacticalRole = 'leader';
    else if (speed > 6) tacticalRole = 'challenger';

    return {
      sailNumber: this.extractSailNumber(vessel.name),
      class: this.determineRaceClass(vessel),
      tacticalRole,
      laylinePosition: this.calculateLaylinePosition(course),
      windDirection: course + 45 // Simplified wind direction estimation
    };
  }

  private extractSailNumber(vesselName: string): string | undefined {
    const sailNumberMatch = vesselName.match(/\b([A-Z]{1,3}\d{1,5})\b/);
    return sailNumberMatch ? sailNumberMatch[1] : undefined;
  }

  private determineRaceClass(vessel: VesselData): string | undefined {
    const length = vessel.dimensions.length;

    if (length > 60) return 'Maxi';
    if (length > 40) return 'IRC 0';
    if (length > 35) return 'IRC 1';
    if (length > 30) return 'IRC 2';
    if (length > 25) return 'IRC 3';
    if (length > 20) return 'IRC 4';

    return 'One Design';
  }

  private calculateLaylinePosition(course: number): 'favored' | 'lifted' | 'headed' {
    // Simplified layline calculation
    const windAngle = course % 90;
    if (windAngle < 30) return 'lifted';
    if (windAngle > 60) return 'headed';
    return 'favored';
  }

  private async enhanceWithRaceData(vessels: VesselData[], raceArea: BoundingBox): Promise<VesselData[]> {
    // Add race-specific enhancements
    return vessels.map(vessel => {
      if (vessel.type === VesselType.SAILING || vessel.type === VesselType.RACING_YACHT) {
        // Add tactical analysis
        vessel.raceData = {
          ...vessel.raceData,
          tacticalRole: this.analyzeTacticalPosition(vessel, vessels),
          laylinePosition: this.calculateLaylinePosition(vessel.position.course)
        };
      }
      return vessel;
    });
  }

  private analyzeTacticalPosition(vessel: VesselData, fleet: VesselData[]): 'leader' | 'challenger' | 'follower' {
    const sailingFleet = fleet.filter(v =>
      v.type === VesselType.SAILING || v.type === VesselType.RACING_YACHT
    );

    if (sailingFleet.length < 2) return 'leader';

    // Sort by a combination of speed and position
    const scores = sailingFleet.map(v => ({
      vessel: v,
      score: v.position.speed * 0.7 + (v.position.latitude * 1000) * 0.3
    })).sort((a, b) => b.score - a.score);

    const position = scores.findIndex(s => s.vessel.mmsi === vessel.mmsi);
    const totalVessels = scores.length;

    if (position < totalVessels * 0.3) return 'leader';
    if (position < totalVessels * 0.7) return 'challenger';
    return 'follower';
  }

  private calculateRacePositions(vessels: VesselData[], raceArea: BoundingBox): VesselData[] {
    // Enhanced race position calculation
    return vessels.map(vessel => ({
      ...vessel,
      raceData: {
        ...vessel.raceData,
        tacticalRole: this.analyzeTacticalPosition(vessel, vessels)
      }
    }));
  }

  private getFallbackVessels(bounds: BoundingBox): VesselData[] {
    // Return demo vessels for development/fallback
    console.log('🔄 Using fallback vessel data');

    const centerLat = (bounds.northeast.latitude + bounds.southwest.latitude) / 2;
    const centerLon = (bounds.northeast.longitude + bounds.southwest.longitude) / 2;

    return [
      {
        id: 'demo_vessel_1',
        mmsi: 123456789,
        name: 'Racing Yacht Alpha',
        callSign: 'ALPHA1',
        type: VesselType.RACING_YACHT,
        position: {
          latitude: centerLat + 0.01,
          longitude: centerLon + 0.01,
          course: 245,
          speed: 7.2,
          heading: 245,
          timestamp: new Date(),
          accuracy: 'high'
        },
        dimensions: {
          length: 12.5,
          width: 3.8
        },
        status: NavigationStatus.RACING,
        raceData: {
          sailNumber: 'USA12',
          class: 'IRC 3',
          tacticalRole: 'leader',
          laylinePosition: 'favored',
          windDirection: 220
        }
      }
    ];
  }

  private getCachedData(key: string): VesselData[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: VesselData[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy(): void {
    // Clean up all tracking intervals
    for (const interval of this.trackingIntervals.values()) {
      clearInterval(interval);
    }
    this.trackingIntervals.clear();
    this.cache.clear();
    console.log('🚢 MarineTraffic AIS service destroyed');
  }
}