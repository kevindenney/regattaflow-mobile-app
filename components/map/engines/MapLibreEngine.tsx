// import mapboxgl from 'mapbox-gl';
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
} from '@/lib/types/advanced-map';

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
    //   container,
    //   style: this.getInitialStyle(config),
    //   center: [-122.4, 37.8], // San Francisco Bay default
    //   zoom: config.camera.zoom,
    //   pitch: config.camera.pitch,
    //   bearing: config.camera.bearing,
    //   antialias: config.rendering.antiAliasing,
    //   maxZoom: 22,
    //   maxPitch: 85,
    //   preserveDrawingBuffer: true, // For screenshots
    //   trackResize: true,
    //   transformRequest: this.transformRequest.bind(this)
    // });

    // Temporary mock implementation for development
    this.map = this.createMockMap(container, config);

    // Simulate map loading
    await new Promise<void>((resolve) => {
      setTimeout(() => {

        resolve();
      }, 100);
    });

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

  }

  setStyle(styleUrl: string): void {
    if (!this.map) throw new Error('Map not initialized');
    this.map.setStyle(styleUrl);
  }

  /**
   * Set basemap style (supports style objects or URLs)
   * Preserves existing custom layers and sources when switching basemaps
   */
  setBasemapStyle(style: any, preserveLayers = true): void {
    if (!this.map) throw new Error('Map not initialized');

    if (preserveLayers) {
      // Store current layers and sources to re-add after style change
      const currentStyle = this.map.getStyle();
      const customLayers = currentStyle?.layers?.filter((layer: any) =>
        !['background', 'satellite', 'osm-base', 'openseamap', 'carto-positron', 'labels', 'osm-labels'].includes(layer.id)
      ) || [];
      const customSources = currentStyle?.sources ? Object.entries(currentStyle.sources)
        .filter(([id]) => !['satellite', 'osm-base', 'openseamap', 'carto-positron', 'labels', 'osm-labels'].includes(id))
        : [];

      // Set new basemap style
      this.map.setStyle(style);

      // Re-add custom layers after style loads
      this.map.once('styledata', () => {
        // Re-add custom sources
        customSources.forEach(([id, source]) => {
          if (!this.map!.getSource(id)) {
            this.map!.addSource(id, source as any);
          }
        });

        // Re-add custom layers
        customLayers.forEach((layer: any) => {
          if (!this.map!.getLayer(layer.id)) {
            this.map!.addLayer(layer);
          }
        });

      });
    } else {
      // Just set the style without preserving layers
      this.map.setStyle(style);

    }
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
    } catch (error) {
    }
  }

  /**
   * Add bathymetric visualization layers (Phase 2: Enhanced Bathymetry)
   * Uses BathymetricVisualizationService for OnX-level underwater terrain
   */
  addBathymetricLayers(sources: Record<string, any>, layers: any[]): void {
    if (!this.map) throw new Error('Map not initialized');

    // Add sources first
    Object.entries(sources).forEach(([id, source]) => {
      if (!this.map!.getSource(id)) {
        this.map!.addSource(id, source);
      }
    });

    // Add layers in order
    layers.forEach(layer => {
      if (!this.map!.getLayer(layer.id)) {
        this.map!.addLayer(layer);
      }
    });

  }

  /**
   * Enable 3D terrain with bathymetry (Phase 2: Enhanced Bathymetry)
   */
  enableBathymetricTerrain(terrainConfig: any): void {
    if (!this.map) throw new Error('Map not initialized');

    try {
      this.map.setTerrain(terrainConfig);
    } catch (error) {
      console.error('Failed to enable 3D terrain:', error);
    }
  }

  /**
   * Disable 3D terrain (Phase 2: Enhanced Bathymetry)
   */
  disableBathymetricTerrain(): void {
    if (!this.map) throw new Error('Map not initialized');

    try {
      this.map.setTerrain(null);
    } catch (error) {
      console.error('Failed to disable 3D terrain:', error);
    }
  }

  /**
   * Update layer visibility (Phase 2: Enhanced Bathymetry)
   */
  setLayerVisibility(layerId: string, visible: boolean): void {
    if (!this.map) throw new Error('Map not initialized');

    const visibility = visible ? 'visible' : 'none';
    if (this.map.getLayer(layerId)) {
      this.map.setLayoutProperty(layerId, 'visibility', visibility);
    }
  }

  /**
   * Update layer opacity (Phase 2: Enhanced Bathymetry)
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    if (!this.map) throw new Error('Map not initialized');

    if (this.map.getLayer(layerId)) {
      const layer = this.map.getLayer(layerId);
      const layerType = layer?.type;

      // Different layer types have different opacity properties
      switch (layerType) {
        case 'raster':
          this.map.setPaintProperty(layerId, 'raster-opacity', opacity);
          break;
        case 'hillshade':
          // Hillshade doesn't have direct opacity, adjust exaggeration instead
          break;
        case 'line':
          this.map.setPaintProperty(layerId, 'line-opacity', opacity);
          break;
        case 'fill':
          this.map.setPaintProperty(layerId, 'fill-opacity', opacity);
          break;
        case 'symbol':
          this.map.setPaintProperty(layerId, 'text-opacity', opacity);
          break;
      }
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

  private createMockMap(container: HTMLElement, config: AdvancedMapConfig): any {
    // Create a mock map object that provides the interface expected by the components
    const mockMap = {
      // Mock event system
      _events: {} as { [key: string]: Function[] },

      once(event: string, callback: Function) {
        if (!this._events[event]) this._events[event] = [];
        const wrappedCallback = (...args: any[]) => {
          callback(...args);
          this.off(event, wrappedCallback);
        };
        this._events[event].push(wrappedCallback);

        // Immediately trigger load event for development
        if (event === 'load') {
          setTimeout(() => callback(), 10);
        }
      },

      on(event: string, callback: Function) {
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(callback);
      },

      off(event: string, callback?: Function) {
        if (!this._events[event]) return;
        if (callback) {
          this._events[event] = this._events[event].filter(cb => cb !== callback);
        } else {
          delete this._events[event];
        }
      },

      // Mock camera methods
      setCamera(options: any) {
      },

      easeTo(options: any) {

      },

      flyTo(options: any) {
      },

      // Mock layer methods
      addLayer(layer: any) {
      },

      removeLayer(layerId: string) {

      },

      addSource(sourceId: string, source: any) {
      },

      removeSource(sourceId: string) {
      },

      // Mock utility methods
      getStyle() {
        return { layers: [], sources: {} };
      },

      setStyle(style: any) {

      },

      getBearing() { return 0; },
      setZoom(zoom: number) {},

      getCenter() { return { lng: -122.4, lat: 37.8 }; },
      setCenter(center: any) {},

      // Mock performance methods
      setRenderWorldCopies() {},
      setMaxTileCacheSize() {},

      // Mock container
      getContainer() { return container; }
    };

    // Style the container to show it's a mock map
    container.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.color = 'white';
    container.style.fontSize = '18px';
    container.style.fontWeight = 'bold';
    container.innerHTML = `
      <div style="text-align: center; z-index: 1000; position: relative;">
        <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
        <div>Interactive Nautical Chart</div>
        <div style="font-size: 14px; opacity: 0.8; margin-top: 8px;">Mock Map for Development</div>
        <div style="font-size: 12px; opacity: 0.6; margin-top: 4px;">Venue Intelligence Loading...</div>
      </div>
    `;

    return mockMap;
  }

  private transformRequest(url: string, resourceType: string): any {
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
    });

    // Performance monitoring
    this.map.on('render', () => {
      this.performanceMonitor.recordFrame();
    });

    // Error handling
    this.map.on('error', (e) => {

    });

    // Source events
    this.map.on('sourcedata', (e) => {
      if (e.sourceId === 'terrain' && e.isSourceLoaded) {
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

  // ==================== ENVIRONMENTAL VISUALIZATION METHODS ====================

  /**
   * Add bathymetry layer with depth visualization
   */
  addBathymetryLayer(
    tileUrl: string,
    options?: {
      exaggeration?: number;
      colorScheme?: 'depth' | 'contour' | 'hillshade';
      opacity?: number;
    }
  ): void {
    if (!this.map) throw new Error('Map not initialized');

    const exaggeration = options?.exaggeration ?? 3.0;
    const opacity = options?.opacity ?? 1.0;

    // Add bathymetry tile source
    this.map.addSource('bathymetry', {
      type: 'raster-dem',
      tiles: [tileUrl],
      tileSize: 512,
      encoding: 'terrarium' // Terrain-RGB encoding
    });

    // Enable 3D bathymetry terrain
    this.map.setTerrain({
      source: 'bathymetry',
      exaggeration
    });

    // Add optional hillshade for better depth visualization
    if (options?.colorScheme === 'hillshade') {
      this.map.addLayer({
        id: 'bathymetry-hillshade',
        type: 'hillshade',
        source: 'bathymetry',
        paint: {
          'hillshade-exaggeration': exaggeration * 0.5,
          'hillshade-shadow-color': '#1e3a5f',
          'hillshade-accent-color': '#87ceeb'
        }
      });
    }
  }

  /**
   * Remove bathymetry layer
   */
  removeBathymetryLayer(): void {
    if (!this.map) throw new Error('Map not initialized');

    this.map.setTerrain(null);

    if (this.map.getLayer('bathymetry-hillshade')) {
      this.map.removeLayer('bathymetry-hillshade');
    }

    if (this.map.getSource('bathymetry')) {
      this.map.removeSource('bathymetry');
    }

  }

  /**
   * Add 3D building extrusions for wind shadow visualization
   */
  addBuildingExtrusions(
    buildings: GeoJSON.FeatureCollection,
    options?: {
      color?: string;
      opacity?: number;
      highlightTall?: boolean;
    }
  ): void {
    if (!this.map) throw new Error('Map not initialized');

    const color = options?.color ?? '#888888';
    const opacity = options?.opacity ?? 0.7;

    // Add buildings source
    this.map.addSource('buildings', {
      type: 'geojson',
      data: buildings
    });

    // Add 3D building extrusions
    this.map.addLayer({
      id: 'buildings-3d',
      type: 'fill-extrusion',
      source: 'buildings',
      paint: {
        'fill-extrusion-color': options?.highlightTall
          ? [
              'interpolate',
              ['linear'],
              ['get', 'height'],
              0, '#cccccc',
              50, '#999999',
              100, '#666666',
              200, '#ff8800', // Highlight tall buildings (wind obstacles)
              400, '#ff0000'  // Very tall buildings
            ]
          : color,
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': opacity
      }
    });

  }

  /**
   * Remove building extrusions
   */
  removeBuildingExtrusions(): void {
    if (!this.map) throw new Error('Map not initialized');

    if (this.map.getLayer('buildings-3d')) {
      this.map.removeLayer('buildings-3d');
    }

    if (this.map.getSource('buildings')) {
      this.map.removeSource('buildings');
    }

  }

  /**
   * Add environmental overlay layer (wind shadows, current zones, etc.)
   */
  addEnvironmentalOverlay(
    id: string,
    polygons: GeoJSON.FeatureCollection,
    options?: {
      fillColor?: string | any[];
      fillOpacity?: number;
      borderColor?: string;
      borderWidth?: number;
    }
  ): void {
    if (!this.map) throw new Error('Map not initialized');

    // Add overlay source
    this.map.addSource(id, {
      type: 'geojson',
      data: polygons
    });

    // Add fill layer
    this.map.addLayer({
      id: `${id}-fill`,
      type: 'fill',
      source: id,
      paint: {
        'fill-color': options?.fillColor ?? ['get', 'color'],
        'fill-opacity': options?.fillOpacity ?? 0.4
      }
    });

    // Add border layer
    if (options?.borderColor) {
      this.map.addLayer({
        id: `${id}-border`,
        type: 'line',
        source: id,
        paint: {
          'line-color': options.borderColor,
          'line-width': options.borderWidth ?? 2,
          'line-opacity': 0.8
        }
      });
    }

  }

  /**
   * Remove environmental overlay layer
   */
  removeEnvironmentalOverlay(id: string): void {
    if (!this.map) throw new Error('Map not initialized');

    if (this.map.getLayer(`${id}-border`)) {
      this.map.removeLayer(`${id}-border`);
    }

    if (this.map.getLayer(`${id}-fill`)) {
      this.map.removeLayer(`${id}-fill`);
    }

    if (this.map.getSource(id)) {
      this.map.removeSource(id);
    }

  }

  /**
   * Add depth contour lines
   */
  addDepthContours(
    contours: GeoJSON.FeatureCollection,
    options?: {
      lineColor?: string;
      lineWidth?: number;
      labels?: boolean;
    }
  ): void {
    if (!this.map) throw new Error('Map not initialized');

    // Add contours source
    this.map.addSource('depth-contours', {
      type: 'geojson',
      data: contours
    });

    // Add contour lines
    this.map.addLayer({
      id: 'depth-contours-lines',
      type: 'line',
      source: 'depth-contours',
      paint: {
        'line-color': options?.lineColor ?? '#0080ff',
        'line-width': options?.lineWidth ?? 1,
        'line-opacity': 0.6
      }
    });

    // Add contour labels
    if (options?.labels) {
      this.map.addLayer({
        id: 'depth-contours-labels',
        type: 'symbol',
        source: 'depth-contours',
        layout: {
          'text-field': ['concat', ['get', 'depth'], 'm'],
          'text-size': 10,
          'text-font': ['Open Sans Regular'],
          'symbol-placement': 'line'
        },
        paint: {
          'text-color': '#0080ff',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
    }

  }

  /**
   * Remove depth contours
   */
  removeDepthContours(): void {
    if (!this.map) throw new Error('Map not initialized');

    if (this.map.getLayer('depth-contours-labels')) {
      this.map.removeLayer('depth-contours-labels');
    }

    if (this.map.getLayer('depth-contours-lines')) {
      this.map.removeLayer('depth-contours-lines');
    }

    if (this.map.getSource('depth-contours')) {
      this.map.removeSource('depth-contours');
    }

  }

  /**
   * Update bathymetry exaggeration (real-time adjustment)
   */
  setBathymetryExaggeration(exaggeration: number): void {
    if (!this.map) throw new Error('Map not initialized');

    const terrain = this.map.getTerrain();
    if (terrain && terrain.source === 'bathymetry') {
      this.map.setTerrain({
        source: 'bathymetry',
        exaggeration
      });

      // Update hillshade if present
      if (this.map.getLayer('bathymetry-hillshade')) {
        this.map.setPaintProperty(
          'bathymetry-hillshade',
          'hillshade-exaggeration',
          exaggeration * 0.5
        );
      }

    }
  }

  /**
   * Get current map instance for deck.gl integration
   */
  getMapInstance(): any {
    return this.map;
  }

  /**
   * Get map container for overlay rendering
   */
  getContainer(): HTMLElement | null {
    return this.container;
  }

  // ==================== VENUE-AWARE BATHYMETRY METHODS ====================

  /**
   * Add venue-specific bathymetry visualization (WMS + depth contours)
   *
   * Uses BathymetryTileService to automatically select appropriate
   * bathymetry sources based on venue location.
   */
  async addVenueBathymetry(
    venue: any, // SailingVenue type
    options?: {
      showRaster?: boolean;
      showContours?: boolean;
      rasterOpacity?: number;
      contourOpacity?: number;
    }
  ): Promise<void> {
    if (!this.map) throw new Error('Map not initialized');

    const { BathymetryTileService } = await import('@/services/BathymetryTileService');
    const service = new BathymetryTileService();
    const sources = service.getBathymetrySources(venue);

    const showRaster = options?.showRaster ?? sources.recommendation.showRaster;
    const showContours = options?.showContours ?? sources.recommendation.showContours;
    const rasterOpacity = options?.rasterOpacity ?? sources.recommendation.rasterOpacity;
    const contourOpacity = options?.contourOpacity ?? sources.recommendation.contourOpacity;

    // Add WMS raster layer
    if (showRaster) {
      this.map.addSource('bathymetry-raster', sources.raster);

      this.map.addLayer({
        id: 'bathymetry-raster-layer',
        type: 'raster',
        source: 'bathymetry-raster',
        paint: {
          'raster-opacity': rasterOpacity
        }
      });

    }

    // Add depth contour polygons
    if (showContours) {
      // Load GeoJSON data
      let contourData: GeoJSON.FeatureCollection;

      if (typeof sources.contours.data === 'string') {
        // Fetch from URL
        const response = await fetch(sources.contours.data);
        contourData = await response.json();
      } else {
        // Already loaded
        contourData = sources.contours.data;
      }

      this.map.addSource('bathymetry-contours', {
        type: 'geojson',
        data: contourData
      });

      this.map.addLayer({
        id: 'bathymetry-contour-fills',
        type: 'fill',
        source: 'bathymetry-contours',
        paint: {
          'fill-color': service.getDepthColorExpression(),
          'fill-opacity': contourOpacity
        }
      });

      this.map.addLayer({
        id: 'bathymetry-contour-lines',
        type: 'line',
        source: 'bathymetry-contours',
        paint: {
          'line-color': '#1e6f90',
          'line-width': 1,
          'line-opacity': 0.6
        }
      });

    }
  }

  /**
   * Remove venue bathymetry layers
   */
  removeVenueBathymetry(): void {
    if (!this.map) throw new Error('Map not initialized');

    // Remove raster layer
    if (this.map.getLayer('bathymetry-raster-layer')) {
      this.map.removeLayer('bathymetry-raster-layer');
    }
    if (this.map.getSource('bathymetry-raster')) {
      this.map.removeSource('bathymetry-raster');
    }

    // Remove contour layers
    if (this.map.getLayer('bathymetry-contour-lines')) {
      this.map.removeLayer('bathymetry-contour-lines');
    }
    if (this.map.getLayer('bathymetry-contour-fills')) {
      this.map.removeLayer('bathymetry-contour-fills');
    }
    if (this.map.getSource('bathymetry-contours')) {
      this.map.removeSource('bathymetry-contours');
    }

  }

  /**
   * Update bathymetry visibility and opacity
   */
  updateBathymetryVisibility(options: {
    showRaster?: boolean;
    showContours?: boolean;
    rasterOpacity?: number;
    contourOpacity?: number;
  }): void {
    if (!this.map) throw new Error('Map not initialized');

    if (options.showRaster !== undefined) {
      const visibility = options.showRaster ? 'visible' : 'none';
      if (this.map.getLayer('bathymetry-raster-layer')) {
        this.map.setLayoutProperty('bathymetry-raster-layer', 'visibility', visibility);
      }
    }

    if (options.showContours !== undefined) {
      const visibility = options.showContours ? 'visible' : 'none';
      if (this.map.getLayer('bathymetry-contour-fills')) {
        this.map.setLayoutProperty('bathymetry-contour-fills', 'visibility', visibility);
      }
      if (this.map.getLayer('bathymetry-contour-lines')) {
        this.map.setLayoutProperty('bathymetry-contour-lines', 'visibility', visibility);
      }
    }

    if (options.rasterOpacity !== undefined && this.map.getLayer('bathymetry-raster-layer')) {
      this.map.setPaintProperty('bathymetry-raster-layer', 'raster-opacity', options.rasterOpacity);
    }

    if (options.contourOpacity !== undefined && this.map.getLayer('bathymetry-contour-fills')) {
      this.map.setPaintProperty('bathymetry-contour-fills', 'fill-opacity', options.contourOpacity);
    }
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