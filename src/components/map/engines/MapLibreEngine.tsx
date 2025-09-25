import mapboxgl from 'mapbox-gl';
// import maplibregl from 'maplibre-gl'; // TODO: Fix import.meta issue
import {
  MapEngine,
  AdvancedMapConfig,
  MapLayer,
  TerrainSource,
  CameraState,
  CameraOptions,
  CameraTarget,
  FlyToOptions,
  PerformanceMetrics
} from '@/src/lib/types/advanced-map';

export class MapLibreEngine implements MapEngine {
  private map: any | null = null; // TODO: Fix maplibregl type
  private container: HTMLElement | null = null;
  private config: AdvancedMapConfig | null = null;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
  }

  async initialize(container: HTMLElement, config: AdvancedMapConfig): Promise<void> {
    this.container = container;
    this.config = config;

    // TODO: Re-enable when import.meta issue is fixed
    // Create MapLibre GL map with optimized settings
    // this.map = new maplibregl.Map({
      container,
      style: this.getInitialStyle(config),
      center: [-122.4, 37.8], // San Francisco Bay default
      zoom: config.camera.zoom,
      pitch: config.camera.pitch,
      bearing: config.camera.bearing,
      antialias: config.rendering.antiAliasing,
      maxZoom: 22,
      maxPitch: 85,
      preserveDrawingBuffer: true, // For screenshots
      trackResize: true,
      transformRequest: this.transformRequest.bind(this)
    });

    // Wait for map to load
    await new Promise<void>((resolve, reject) => {
      this.map!.once('load', resolve);
      this.map!.once('error', reject);
    });

    console.log('🗺️ MapLibre GL initialized successfully');

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    // Initialize terrain if configured
    if (config.terrain.bathymetrySource) {
      await this.initializeTerrain(config);
    }

    // Set up event handlers
    this.setupEventHandlers();
  }

  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.performanceMonitor.stop();
    console.log('🗺️ MapLibre GL engine destroyed');
  }

  setStyle(styleUrl: string): void {
    if (!this.map) throw new Error('Map not initialized');
    this.map.setStyle(styleUrl);
  }

  addLayer(layer: MapLayer): void {
    if (!this.map) throw new Error('Map not initialized');

    // Convert our layer format to MapLibre format
    const maplibreLayer = this.convertToMapLibreLayer(layer);

    try {
      // Add source if it doesn't exist
      if (typeof layer.source === 'object' && !this.map.getSource(layer.id)) {
        this.map.addSource(layer.id, layer.source as any);
      }

      // Add the layer
      this.map.addLayer(maplibreLayer);
      console.log(`✅ Added layer: ${layer.id}`);
    } catch (error) {
      console.error(`❌ Failed to add layer ${layer.id}:`, error);
    }
  }

  removeLayer(layerId: string): void {
    if (!this.map) throw new Error('Map not initialized');

    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }

    if (this.map.getSource(layerId)) {
      this.map.removeSource(layerId);
    }
  }

  updateLayer(layerId: string, updates: Partial<MapLayer>): void {
    if (!this.map) throw new Error('Map not initialized');

    // Update layer properties
    if (updates.paint) {
      Object.entries(updates.paint).forEach(([property, value]) => {
        this.map!.setPaintProperty(layerId, property, value);
      });
    }

    if (updates.layout) {
      Object.entries(updates.layout).forEach(([property, value]) => {
        this.map!.setLayoutProperty(layerId, property, value);
      });
    }

    if (updates.filter) {
      this.map.setFilter(layerId, updates.filter);
    }
  }

  enableTerrain(source: TerrainSource): void {
    if (!this.map) throw new Error('Map not initialized');

    // Add terrain source
    this.map.addSource('terrain', {
      type: 'raster-dem',
      url: source.url,
      tileSize: source.tileSize || 512,
      encoding: source.encoding || 'terrarium'
    });

    // Enable 3D terrain
    this.map.setTerrain({
      source: 'terrain',
      exaggeration: this.config?.terrain.terrainExaggeration || 1.5
    });

    console.log('🏔️ Terrain enabled');
  }

  disableTerrain(): void {
    if (!this.map) throw new Error('Map not initialized');
    this.map.setTerrain(null);

    if (this.map.getSource('terrain')) {
      this.map.removeSource('terrain');
    }
  }

  setTerrainExaggeration(exaggeration: number): void {
    if (!this.map) throw new Error('Map not initialized');

    const terrain = this.map.getTerrain();
    if (terrain) {
      this.map.setTerrain({
        ...terrain,
        exaggeration
      });
    }
  }

  getCamera(): CameraState {
    if (!this.map) throw new Error('Map not initialized');

    return {
      center: [this.map.getCenter().lng, this.map.getCenter().lat],
      zoom: this.map.getZoom(),
      bearing: this.map.getBearing(),
      pitch: this.map.getPitch()
    };
  }

  setCamera(camera: CameraState, options?: CameraOptions): void {
    if (!this.map) throw new Error('Map not initialized');

    const cameraOptions = {
      center: camera.center,
      zoom: camera.zoom,
      bearing: camera.bearing,
      pitch: camera.pitch,
      duration: options?.duration || 1000,
      easing: options?.easing,
      padding: options?.padding
    };

    this.map.easeTo(cameraOptions);
  }

  flyTo(target: CameraTarget, options?: FlyToOptions): void {
    if (!this.map) throw new Error('Map not initialized');

    const flyOptions = {
      ...target,
      duration: options?.duration || 2000,
      speed: options?.speed || 1.2,
      curve: options?.curve || 1.42,
      easing: options?.easing,
      padding: options?.padding
    };

    this.map.flyTo(flyOptions);
  }

  on(event: string, callback: Function): void {
    if (!this.map) throw new Error('Map not initialized');
    this.map.on(event as any, callback as any);
  }

  off(event: string, callback?: Function): void {
    if (!this.map) throw new Error('Map not initialized');
    this.map.off(event as any, callback as any);
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  optimizeForDevice(): void {
    if (!this.config || !this.map) return;

    // Detect device capabilities
    const isLowEndDevice = this.detectLowEndDevice();

    if (isLowEndDevice) {
      console.log('📱 Optimizing for low-end device');

      // Reduce quality settings
      this.config.rendering.quality = 'medium';
      this.config.performance.lodStrategy = 'aggressive';

      // Disable expensive features
      this.map.setRenderWorldCopies(false);
      this.setTerrainExaggeration(1.0); // Reduce terrain complexity
    }
  }

  // Private methods

  private getInitialStyle(config: AdvancedMapConfig): string {
    // Return appropriate base style based on configuration
    if (config.layers.satellite) {
      return 'https://api.maptiler.com/maps/satellite/style.json?key=your-api-key';
    } else if (config.layers.nauticalChart) {
      // Use OpenSeaMap style for nautical charts
      return this.createNauticalStyle();
    } else {
      // Default to a clean base style
      return 'https://api.maptiler.com/maps/basic/style.json?key=your-api-key';
    }
  }

  private createNauticalStyle(): any {
    // Create a custom nautical chart style
    return {
      version: 8,
      name: 'Nautical Chart',
      sources: {
        'osm-base': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        },
        'openseamap': {
          type: 'raster',
          tiles: ['https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenSeaMap contributors'
        }
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#E8F4FD'
          }
        },
        {
          id: 'osm-base',
          type: 'raster',
          source: 'osm-base',
          paint: {
            'raster-opacity': 0.8
          }
        },
        {
          id: 'openseamap',
          type: 'raster',
          source: 'openseamap',
          paint: {
            'raster-opacity': 1.0
          }
        }
      ]
    };
  }

  private async initializeTerrain(config: AdvancedMapConfig): Promise<void> {
    let terrainSource: TerrainSource;

    switch (config.terrain.bathymetrySource) {
      case 'noaa':
        terrainSource = {
          type: 'raster-dem',
          url: 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/DEM_all/ImageServer',
          tileSize: 512,
          encoding: 'terrarium'
        };
        break;
      case 'gebco':
        terrainSource = {
          type: 'raster-dem',
          url: 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/',
          tileSize: 512,
          encoding: 'terrarium'
        };
        break;
      default:
        console.warn('⚠️ Unknown bathymetry source, skipping terrain initialization');
        return;
    }

    this.enableTerrain(terrainSource);
  }

  private convertToMapLibreLayer(layer: MapLayer): any {
    const maplibreLayer: any = {
      id: layer.id,
      type: layer.type,
      source: typeof layer.source === 'string' ? layer.source : layer.id,
      paint: layer.paint || {},
      layout: layer.layout || {}
    };

    if (layer.filter) {
      maplibreLayer.filter = layer.filter;
    }

    if (layer.minzoom !== undefined) {
      maplibreLayer.minzoom = layer.minzoom;
    }

    if (layer.maxzoom !== undefined) {
      maplibreLayer.maxzoom = layer.maxzoom;
    }

    return maplibreLayer;
  }

  private transformRequest(url: string, resourceType: string): maplibregl.RequestParameters {
    // Add authentication headers if needed
    return {
      url,
      headers: {},
      credentials: 'same-origin'
    };
  }

  private setupEventHandlers(): void {
    if (!this.map) return;

    // Camera change events
    this.map.on('moveend', () => {
      console.log('🎥 Camera moved:', this.getCamera());
    });

    // Performance monitoring
    this.map.on('render', () => {
      this.performanceMonitor.recordFrame();
    });

    // Error handling
    this.map.on('error', (e) => {
      console.error('🗺️ MapLibre error:', e.error);
    });

    // Source events
    this.map.on('sourcedata', (e) => {
      if (e.sourceId === 'terrain' && e.isSourceLoaded) {
        console.log('🏔️ Terrain data loaded');
      }
    });
  }

  private setupPerformanceMonitoring(): void {
    this.performanceMonitor.start();
  }

  private detectLowEndDevice(): boolean {
    // Simple device capability detection
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');

    if (!gl) return true;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

      // Check for low-end GPU indicators
      if (renderer.includes('Intel') && renderer.includes('HD')) {
        return true;
      }
    }

    // Check memory
    const navigator = window.navigator as any;
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      return true;
    }

    return false;
  }
}

class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;
  private isRunning = false;
  private renderTimes: number[] = [];

  start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
  }

  stop(): void {
    this.isRunning = false;
  }

  recordFrame(): void {
    if (!this.isRunning) return;

    const now = performance.now();
    this.frameCount++;

    // Calculate FPS every second
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
    }

    // Record render time
    const renderTime = now - this.lastTime;
    this.renderTimes.push(renderTime);

    // Keep only last 60 frames
    if (this.renderTimes.length > 60) {
      this.renderTimes.shift();
    }
  }

  getMetrics(): PerformanceMetrics {
    const avgRenderTime = this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length || 0;

    return {
      frameRate: this.fps,
      renderTime: avgRenderTime,
      memoryUsage: this.getMemoryUsage(),
      networkUsage: 0, // TODO: Implement network monitoring
      batteryImpact: this.fps > 55 ? 'low' : this.fps > 30 ? 'medium' : 'high',
      lastUpdated: new Date()
    };
  }

  private getMemoryUsage(): number {
    const performance = window.performance as any;
    if (performance.memory) {
      return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }
}