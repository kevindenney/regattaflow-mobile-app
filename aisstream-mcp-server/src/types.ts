export interface BoundingBox {
  northEast: [number, number]; // [lat, lon]
  southWest: [number, number]; // [lat, lon]
}

export interface SubscriptionMessage {
  APIKey: string;
  BoundingBoxes?: [[[number, number], [number, number]]];
  FiltersShipMMSI?: string[];
  FilterMessageTypes?: string[];
}

export interface AISMetadata {
  Latitude: number;
  Longitude: number;
  MMSI?: string;
  time_utc?: string;
}

export interface PositionReport {
  Cog: number; // Course over ground
  Sog: number; // Speed over ground
  Heading: number;
  NavigationalStatus: number;
  Latitude: number;
  Longitude: number;
  RateOfTurn: number;
  MessageID: number;
  UserID: number; // MMSI
  Valid?: boolean;
  RepeatIndicator?: number;
  Timestamp?: number;
}

export interface AISMessage {
  MessageType: string;
  Metadata: AISMetadata;
  Message: {
    PositionReport?: PositionReport;
    [key: string]: any;
  };
}

export interface VesselTrackingOptions {
  boundingBox?: BoundingBox;
  mmsiList?: string[];
  messageTypes?: string[];
  maxMessages?: number;
  timeoutMs?: number;
}

export interface VesselInfo {
  mmsi: string;
  latitude: number;
  longitude: number;
  course: number;
  speed: number;
  heading: number;
  timestamp: string;
  navigationalStatus: number;
}