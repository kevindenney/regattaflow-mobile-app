import { Map3DConfig, RaceMark, WeatherConditions, GeoLocation, BoundingBox } from './map';

// Enhanced map configuration extending the base Map3DConfig
export interface AdvancedMapConfig extends Map3DConfig {
  rendering: {
    engine: 'maplibre' | 'custom-webgl';
    quality: 'ultra' | 'high' | 'medium' | 'low';
    frameRate: number;
    antiAliasing: boolean;
  };
  terrain: {
    bathymetrySource: 'noaa' | 'gebco' | 'custom';
    terrainExaggeration: number;
    seaFloorDetail: boolean;
    contourLines: EnhancedContourConfig;
    highResolution: boolean;
  };
  weather: {
    sources: WeatherDataSource[];
    updateInterval: number; // seconds
    forecastHours: number;
    resolution: 'high' | 'medium' | 'low';
    realTimeUpdates: boolean;
  };
  performance: {
    tileCacheSize: number; // MB
    maxConcurrentRequests: number;
    lodStrategy: 'aggressive' | 'balanced' | 'conservative';
    preloadRadius: number; // tiles
  };
}

// Enhanced contour configuration
export interface EnhancedContourConfig {
  depths: number[];
  colors: string[];
  lineWidth: number;
  labelFrequency: number;
  smoothing: boolean;
  threeDimensional: boolean;
}

// Weather data source configuration
export interface WeatherDataSource {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  priority: number; // 1 = highest
  updateInterval: number;
  capabilities: WeatherCapabilities;
}

export interface WeatherCapabilities {
  wind: boolean;
  pressure: boolean;
  temperature: boolean;
  precipitation: boolean;
  waves: boolean;
  tides: boolean;
  currents: boolean;
  visibility: boolean;
}

// Professional weather data
export interface AdvancedWeatherConditions extends WeatherConditions {
  pressure: {
    sealevel: number; // mb
    trend: 'rising' | 'falling' | 'steady';
    gradient: number; // mb per degree
  };
  visibility: {
    horizontal: number; // nautical miles
    conditions: 'clear' | 'haze' | 'fog' | 'rain' | 'snow';
    restrictions?: string[];
  };
  seaState: {
    waveHeight: number; // meters
    wavePeriod: number; // seconds
    swellHeight?: number; // meters
    swellPeriod?: number; // seconds
    swellDirection?: number; // degrees
    seaTemperature?: number; // celsius
  };
  forecast: {
    confidence: number; // 0-1
    source: string;
    modelRun: Date;
    validTime: Date;
    resolution: string; // e.g., "1km", "4km"
  };
  alerts?: WeatherAlert[];
}

export interface WeatherAlert {
  id: string;
  type: 'gale' | 'storm' | 'smallcraft' | 'fog' | 'thunderstorm';
  severity: 'watch' | 'warning' | 'advisory';
  title: string;
  description: string;
  areas: string[];
  validFrom: Date;
  validUntil: Date;
  source: string;
}

// Advanced navigation calculations
export interface NavigationResult {
  distance: {
    nauticalMiles: number;
    kilometers: number;
    meters: number;
    greatCircle: boolean;
    rhumbLine: boolean;
  };
  bearing: {
    true: number;
    magnetic: number;
    declination: number;
    convergence?: number; // grid convergence
  };
  time: {
    estimatedDuration: number; // hours
    conditions: AdvancedWeatherConditions;
    courseRecommendation: string;
    averageSpeed?: number; // knots
  };
  waypoints?: NavigationWaypoint[];
}

export interface NavigationWaypoint {
  position: GeoLocation;
  bearing: number;
  distance: number;
  eta: Date;
  conditions: AdvancedWeatherConditions;
  notes?: string;
}

// Racing-specific data structures
export interface RaceStrategy {
  id: string;
  raceId: string;
  course: RaceCourse;
  conditions: AdvancedWeatherConditions;
  laylines: Layline[];
  startLineAdvantage: StartPositionAnalysis;
  markRoundingPlan: MarkRoundingStrategy[];
  contingencyPlans: ContingencyPlan[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RaceCourse {
  id: string;
  name: string;
  marks: RaceMark[];
  startLine: StartLine;
  finishLine: FinishLine;
  boundaries: CourseBoundary[];
  restrictedAreas: RestrictedArea[];
  safetyFeatures: SafetyFeature[];
}

export interface StartLine {
  id: string;
  start: GeoLocation;
  end: GeoLocation;
  bearing: number;
  length: number; // meters
  type: 'line' | 'gate';
}

export interface FinishLine {
  id: string;
  start: GeoLocation;
  end: GeoLocation;
  bearing: number;
  length: number; // meters
}

export interface CourseBoundary {
  id: string;
  type: 'exclusion' | 'limit' | 'safety';
  coordinates: GeoLocation[];
  description: string;
}

export interface RestrictedArea {
  id: string;
  name: string;
  coordinates: GeoLocation[];
  type: 'no-sail' | 'limited-access' | 'hazard';
  description: string;
  severity: 'warning' | 'danger' | 'prohibited';
}

export interface SafetyFeature {
  id: string;
  type: 'rescue-boat' | 'committee-boat' | 'mark-boat' | 'anchor';
  position: GeoLocation;
  description: string;
  frequency?: string; // VHF frequency
}

export interface Layline {
  id: string;
  markId: string;
  port: LaylineData;
  starboard: LaylineData;
  windConditions: {
    speed: number;
    direction: number;
    confidence: number;
  };
  calculatedAt: Date;
}

export interface LaylineData {
  angle: number; // degrees from wind
  coordinates: GeoLocation[];
  distance: number; // meters
  time: number; // seconds
}

export interface StartPositionAnalysis {
  optimalPosition: GeoLocation;
  advantages: {
    windAdvantage: number; // percentage
    currentAdvantage: number; // percentage
    distanceAdvantage: number; // meters
  };
  risks: string[];
  recommendations: string[];
  confidence: number; // 0-1
}

export interface MarkRoundingStrategy {
  markId: string;
  approach: {
    angle: number;
    speed: number;
    timing: number; // seconds before mark
  };
  rounding: {
    radius: number; // meters
    speed: number;
    sailTrim: string;
  };
  exit: {
    bearing: number;
    acceleration: string;
  };
}

export interface ContingencyPlan {
  id: string;
  trigger: {
    condition: string;
    threshold: number;
    parameters: Record<string, any>;
  };
  action: {
    description: string;
    newCourse?: GeoLocation[];
    sailChanges?: string[];
    tacticalNotes: string[];
  };
  priority: number;
}

// Advanced layer management
export interface LayerControlSystem {
  categories: {
    navigation: NavigationLayers;
    weather: WeatherLayers;
    racing: RacingLayers;
    safety: SafetyLayers;
    historical: HistoricalLayers;
    custom: CustomLayers;
  };
  visibility: LayerVisibilityManager;
  ordering: LayerOrderManager;
  styling: LayerStyleManager;
}

export interface NavigationLayers {
  nauticalChart: boolean;
  bathymetry: boolean;
  depthContours: boolean;
  navigationAids: boolean;
  harbors: boolean;
  anchorages: boolean;
}

export interface WeatherLayers {
  windField: boolean;
  pressure: boolean;
  temperature: boolean;
  precipitation: boolean;
  waves: boolean;
  tides: boolean;
  currents: boolean;
  visibility: boolean;
}

export interface RacingLayers {
  courseMarks: boolean;
  startFinishLines: boolean;
  laylines: boolean;
  courseBoundaries: boolean;
  restrictedAreas: boolean;
  raceArea: boolean;
}

export interface SafetyLayers {
  vessels: boolean;
  emergencyServices: boolean;
  hazards: boolean;
  weatherAlerts: boolean;
  communicationZones: boolean;
}

export interface HistoricalLayers {
  pastRaces: boolean;
  weatherHistory: boolean;
  performanceData: boolean;
  trackAnalysis: boolean;
}

export interface CustomLayers {
  userOverlays: CustomOverlay[];
  teamData: boolean;
  personalNotes: boolean;
  photos: boolean;
}

export interface LayerVisibilityManager {
  toggleLayer(layerId: string): void;
  setLayerOpacity(layerId: string, opacity: number): void;
  showLayerGroup(groupId: string): void;
  hideLayerGroup(groupId: string): void;
  resetToDefaults(): void;
}

export interface LayerOrderManager {
  moveLayerUp(layerId: string): void;
  moveLayerDown(layerId: string): void;
  setLayerOrder(layerIds: string[]): void;
}

export interface LayerStyleManager {
  updateLayerStyle(layerId: string, style: LayerStyle): void;
  createStylePreset(name: string, styles: Record<string, LayerStyle>): void;
  applyStylePreset(presetName: string): void;
}

export interface LayerStyle {
  color?: string;
  opacity?: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillPattern?: string;
  iconSize?: number;
  textSize?: number;
  textColor?: string;
}

// Custom overlay system
export interface CustomOverlay {
  id: string;
  name: string;
  type: 'geojson' | 'raster' | 'vector' | '3d-model' | 'marker';
  source: OverlaySource;
  style: OverlayStyle;
  interactivity: InteractivityConfig;
  metadata: OverlayMetadata;
  visibility: boolean;
  opacity: number;
}

export interface OverlaySource {
  type: 'url' | 'data' | 'tiles';
  url?: string;
  data?: any;
  tileUrlTemplate?: string;
  bounds?: BoundingBox;
}

export interface OverlayStyle {
  color: string;
  opacity: number;
  strokeWidth: number;
  strokeColor: string;
  fillPattern?: string;
  iconUrl?: string;
  iconSize?: number;
  textField?: string;
  textSize?: number;
  textColor?: string;
  zIndex: number;
}

export interface InteractivityConfig {
  clickable: boolean;
  hoverable: boolean;
  draggable: boolean;
  selectable: boolean;
  popupTemplate?: string;
  onClick?: (feature: any) => void;
  onHover?: (feature: any) => void;
}

export interface OverlayMetadata {
  created: Date;
  updated: Date;
  creator: string;
  description?: string;
  tags: string[];
  shareLevel: 'private' | 'team' | 'public';
}

// AIS and vessel tracking
export interface VesselData {
  mmsi: string;
  name?: string;
  position: GeoLocation;
  heading: number;
  speed: number; // knots
  course: number; // degrees
  timestamp: Date;
  vesselType?: string;
  dimensions?: VesselDimensions;
  destination?: string;
  eta?: Date;
  status: VesselStatus;
}

export interface VesselDimensions {
  length: number; // meters
  width: number; // meters
  draft?: number; // meters
}

export type VesselStatus =
  | 'underway-engine'
  | 'underway-sail'
  | 'anchored'
  | 'moored'
  | 'aground'
  | 'fishing'
  | 'unknown';

export interface FleetPosition {
  raceId: string;
  vesselId: string;
  position: GeoLocation;
  heading: number;
  speed: number;
  timestamp: Date;
  racePosition?: number;
  distanceToLeader?: number;
  distanceToFinish?: number;
}

export interface FleetStats {
  totalVessels: number;
  averageSpeed: number;
  leadingVessel: FleetPosition;
  spread: {
    maxDistance: number;
    averageDistance: number;
  };
  conditions: AdvancedWeatherConditions;
  calculatedAt: Date;
}

// Terrain and bathymetry
export interface TerrainTile {
  x: number;
  y: number;
  z: number;
  url: string;
  bounds: BoundingBox;
  elevationData?: Float32Array;
  loaded: boolean;
}

export interface DepthContour {
  depth: number; // meters
  coordinates: GeoLocation[];
  style: {
    color: string;
    width: number;
    opacity: number;
  };
}

export interface BathymetryData {
  bounds: BoundingBox;
  resolution: number; // meters per pixel
  elevationGrid: Float32Array;
  width: number;
  height: number;
  noDataValue: number;
  units: 'meters' | 'feet';
}

// Performance and caching
export interface StorageEstimate {
  totalSize: number; // bytes
  usedSize: number; // bytes
  availableSize: number; // bytes
  regions: RegionStorageInfo[];
}

export interface RegionStorageInfo {
  regionId: string;
  name: string;
  size: number; // bytes
  lastAccessed: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface OfflineCapabilities {
  mapsAvailable: boolean;
  weatherDataAge: number; // hours
  navigationDataAvailable: boolean;
  raceDataAvailable: boolean;
  lastSyncTime: Date;
}

export interface PerformanceMetrics {
  frameRate: number;
  renderTime: number; // milliseconds
  memoryUsage: number; // MB
  networkUsage: number; // KB/s
  batteryImpact: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}

// Map engine abstraction
export interface MapEngine {
  initialize(container: HTMLElement, config: AdvancedMapConfig): Promise<void>;
  destroy(): void;

  // Style and layers
  setStyle(styleUrl: string): void;
  addLayer(layer: MapLayer): void;
  removeLayer(layerId: string): void;
  updateLayer(layerId: string, updates: Partial<MapLayer>): void;

  // Terrain
  enableTerrain(source: TerrainSource): void;
  disableTerrain(): void;
  setTerrainExaggeration(exaggeration: number): void;

  // Camera control
  getCamera(): CameraState;
  setCamera(camera: CameraState, options?: CameraOptions): void;
  flyTo(target: CameraTarget, options?: FlyToOptions): void;

  // Events
  on(event: string, callback: Function): void;
  off(event: string, callback?: Function): void;

  // Performance
  getPerformanceMetrics(): PerformanceMetrics;
  optimizeForDevice(): void;
}

export interface MapLayer {
  id: string;
  type: 'background' | 'raster' | 'vector' | 'geojson' | '3d';
  source: string | LayerSource;
  paint?: Record<string, any>;
  layout?: Record<string, any>;
  filter?: any[];
  minzoom?: number;
  maxzoom?: number;
}

export interface LayerSource {
  type: 'raster' | 'vector' | 'geojson' | 'raster-dem';
  url?: string;
  tiles?: string[];
  data?: any;
  bounds?: [number, number, number, number];
}

export interface TerrainSource {
  type: 'raster-dem';
  url: string;
  tileSize: number;
  encoding?: 'terrarium' | 'mapbox';
}

export interface CameraState {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface CameraOptions {
  duration?: number;
  easing?: (t: number) => number;
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface CameraTarget {
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  bounds?: BoundingBox;
}

export interface FlyToOptions extends CameraOptions {
  speed?: number;
  curve?: number;
  maxDuration?: number;
}