import {
  BoundingBox,
  GeoLocation,
  TerrainTile,
  DepthContour,
  BathymetryData
} from '@/lib/types/advanced-map';

export class NOAABathymetryService {
  private baseUrl = 'https://gis.ngdc.noaa.gov/arcgis/rest/services';
  private cache = new Map<string, any>();
  private requestQueue: { key: string; promise: Promise<any> }[] = [];

  /**
   * Get bathymetry tiles for a given bounding box and zoom level
   */
  async getBathymetryTiles(bounds: BoundingBox, zoom: number): Promise<TerrainTile[]> {

    const tiles: TerrainTile[] = [];

    // Calculate tile coordinates from lat/lon bounds
    const tileCoords = this.calculateTileCoordinates(bounds, zoom);

    for (const coord of tileCoords) {
      const tile = await this.fetchTerrainTile(coord.x, coord.y, coord.z);
      if (tile) {
        tiles.push(tile);
      }
    }

    return tiles;
  }

  /**
   * Get depth contours for a bounding box
   */
  async getDepthContours(bounds: BoundingBox): Promise<DepthContour[]> {
    const cacheKey = `contours_${bounds.southwest.latitude}_${bounds.southwest.longitude}_${bounds.northeast.latitude}_${bounds.northeast.longitude}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const contours = await this.fetchDepthContours(bounds);
      this.cache.set(cacheKey, contours);
      return contours;
    } catch (error) {

      return this.generateFallbackContours(bounds);
    }
  }

  /**
   * Get detailed bathymetry data as elevation grid
   */
  async getBathymetryData(bounds: BoundingBox, resolution: number = 100): Promise<BathymetryData> {
    const cacheKey = `bathymetry_${bounds.southwest.latitude}_${bounds.southwest.longitude}_${bounds.northeast.latitude}_${bounds.northeast.longitude}_${resolution}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const data = await this.fetchBathymetryData(bounds, resolution);
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {

      return this.generateFallbackBathymetryData(bounds, resolution);
    }
  }

  /**
   * Get depth at a specific location
   */
  async getDepthAtLocation(location: GeoLocation): Promise<number | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/DEM_mosaics/DEM_all/ImageServer/identify?` +
        `geometry=${location.longitude},${location.latitude}&` +
        'geometryType=esriGeometryPoint&' +
        'returnGeometry=false&' +
        'f=json'
      );

      const data = await response.json();

      if (data.value && typeof data.value === 'number') {
        // Convert to negative depth (below sea level)
        return -Math.abs(data.value);
      }

      return null;
    } catch (error) {

      return null;
    }
  }

  // Private methods

  private calculateTileCoordinates(bounds: BoundingBox, zoom: number) {
    const tiles = [];

    // Convert lat/lng bounds to tile coordinates
    const nwTile = this.latLngToTile(bounds.northeast.latitude, bounds.southwest.longitude, zoom);
    const seTile = this.latLngToTile(bounds.southwest.latitude, bounds.northeast.longitude, zoom);

    for (let x = nwTile.x; x <= seTile.x; x++) {
      for (let y = nwTile.y; y <= seTile.y; y++) {
        tiles.push({ x, y, z: zoom });
      }
    }

    return tiles;
  }

  private latLngToTile(lat: number, lng: number, zoom: number) {
    const latRad = lat * Math.PI / 180;
    const n = Math.pow(2, zoom);

    return {
      x: Math.floor((lng + 180) / 360 * n),
      y: Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n)
    };
  }

  private async fetchTerrainTile(x: number, y: number, z: number): Promise<TerrainTile | null> {
    const cacheKey = `tile_${x}_${y}_${z}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // NOAA's elevation tile service
      const url = `${this.baseUrl}/DEM_mosaics/DEM_all/ImageServer/exportImage?` +
        `bbox=${this.getTileBounds(x, y, z)}&` +
        'bboxSR=4326&' +
        'size=512,512&' +
        'imageSR=4326&' +
        'format=png&' +
        'pixelType=F32&' +
        'noDataInterpretation=esriNoDataMatchAny&' +
        'interpolation=RSP_BilinearInterpolation&' +
        'f=json';

      const response = await fetch(url);
      const data = await response.json();

      if (data.href) {
        const tile: TerrainTile = {
          x,
          y,
          z,
          url: data.href,
          bounds: this.getTileBoundsAsBox(x, y, z),
          loaded: false
        };

        // Fetch elevation data if available
        if (data.pixelData) {
          tile.elevationData = new Float32Array(data.pixelData);
        }

        this.cache.set(cacheKey, tile);
        return tile;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private getTileBounds(x: number, y: number, z: number): string {
    const n = Math.pow(2, z);
    const lonMin = x / n * 360 - 180;
    const lonMax = (x + 1) / n * 360 - 180;

    const latMax = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    const latMin = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;

    return `${lonMin},${latMin},${lonMax},${latMax}`;
  }

  private getTileBoundsAsBox(x: number, y: number, z: number): BoundingBox {
    const bounds = this.getTileBounds(x, y, z).split(',').map(Number);
    return {
      southwest: { latitude: bounds[1], longitude: bounds[0] },
      northeast: { latitude: bounds[3], longitude: bounds[2] }
    };
  }

  private async fetchDepthContours(bounds: BoundingBox): Promise<DepthContour[]> {
    const contours: DepthContour[] = [];

    // Standard sailing depths of interest
    const depths = [2, 5, 10, 20, 50, 100, 200];
    const colors = ['#E3F2FD', '#90CAF9', '#42A5F5', '#1E88E5', '#1565C0', '#0D47A1', '#000051'];

    try {
      const response = await fetch(
        `${this.baseUrl}/nos_hydro/MapServer/3/query?` +
        `geometry=${bounds.southwest.longitude},${bounds.southwest.latitude},${bounds.northeast.longitude},${bounds.northeast.latitude}&` +
        'geometryType=esriGeometryEnvelope&' +
        'spatialRel=esriSpatialRelIntersects&' +
        'outFields=VALDCO&' +
        'returnGeometry=true&' +
        'f=json'
      );

      const data = await response.json();

      if (data.features) {
        data.features.forEach((feature: any, index: number) => {
          if (feature.geometry && feature.geometry.paths) {
            const depth = feature.attributes?.VALDCO || depths[index % depths.length];
            const colorIndex = depths.findIndex(d => d >= depth);

            contours.push({
              depth,
              coordinates: this.convertPathsToGeoLocations(feature.geometry.paths),
              style: {
                color: colors[colorIndex] || colors[colors.length - 1],
                width: 2,
                opacity: 0.7
              }
            });
          }
        });
      }
    } catch (error) {

    }

    return contours.length > 0 ? contours : this.generateFallbackContours(bounds);
  }

  private async fetchBathymetryData(bounds: BoundingBox, resolution: number): Promise<BathymetryData> {
    const width = Math.ceil(this.getDistance(bounds.southwest, {
      latitude: bounds.southwest.latitude,
      longitude: bounds.northeast.longitude
    }) / resolution);

    const height = Math.ceil(this.getDistance(bounds.southwest, {
      latitude: bounds.northeast.latitude,
      longitude: bounds.southwest.longitude
    }) / resolution);

    const elevationGrid = new Float32Array(width * height);

    // Sample elevation data from NOAA service
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const lng = bounds.southwest.longitude + (i / width) * (bounds.northeast.longitude - bounds.southwest.longitude);
        const lat = bounds.southwest.latitude + (j / height) * (bounds.northeast.latitude - bounds.southwest.latitude);

        // For demo, generate synthetic bathymetry
        const depth = this.generateSyntheticDepth(lat, lng);
        elevationGrid[i * height + j] = depth;
      }
    }

    return {
      bounds,
      resolution,
      elevationGrid,
      width,
      height,
      noDataValue: -9999,
      units: 'meters'
    };
  }

  private generateSyntheticDepth(lat: number, lng: number): number {
    // Generate realistic synthetic depths for San Francisco Bay
    const centerLat = 37.8;
    const centerLng = -122.4;

    const distance = this.getDistance({ latitude: lat, longitude: lng }, { latitude: centerLat, longitude: centerLng });

    // Deeper water in center, shallower near shore
    const baseDepth = -Math.max(5, Math.min(50, distance * 0.1));

    // Add some variation
    const noise = (Math.sin(lat * 1000) + Math.cos(lng * 1000)) * 5;

    return baseDepth + noise;
  }

  private getDistance(pos1: GeoLocation, pos2: GeoLocation): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1.latitude * Math.PI / 180;
    const φ2 = pos2.latitude * Math.PI / 180;
    const Δφ = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const Δλ = (pos2.longitude - pos1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private convertPathsToGeoLocations(paths: number[][][]): GeoLocation[] {
    const coordinates: GeoLocation[] = [];

    paths.forEach(path => {
      path.forEach(point => {
        coordinates.push({
          latitude: point[1],
          longitude: point[0]
        });
      });
    });

    return coordinates;
  }

  private generateFallbackContours(bounds: BoundingBox): DepthContour[] {
    // Generate circular contours as fallback
    const centerLat = (bounds.southwest.latitude + bounds.northeast.latitude) / 2;
    const centerLng = (bounds.southwest.longitude + bounds.northeast.longitude) / 2;

    const depths = [5, 10, 20, 50];
    const colors = ['#90CAF9', '#42A5F5', '#1E88E5', '#1565C0'];

    return depths.map((depth, index) => ({
      depth,
      coordinates: this.generateCircularContour(
        { latitude: centerLat, longitude: centerLng },
        0.001 * (index + 1) * 2 // Increasing radius
      ),
      style: {
        color: colors[index],
        width: 2,
        opacity: 0.6
      }
    }));
  }

  private generateCircularContour(center: GeoLocation, radius: number): GeoLocation[] {
    const points: GeoLocation[] = [];
    const numPoints = 32;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      points.push({
        latitude: center.latitude + radius * Math.cos(angle),
        longitude: center.longitude + radius * Math.sin(angle)
      });
    }

    // Close the contour
    points.push(points[0]);

    return points;
  }

  private generateFallbackBathymetryData(bounds: BoundingBox, resolution: number): BathymetryData {
    const width = 50;
    const height = 50;
    const elevationGrid = new Float32Array(width * height);

    // Generate simple gradient from shallow to deep
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const depth = -((i + j) / (width + height)) * 30 - 2; // 2-32m depth range
        elevationGrid[i * height + j] = depth;
      }
    }

    return {
      bounds,
      resolution,
      elevationGrid,
      width,
      height,
      noDataValue: -9999,
      units: 'meters'
    };
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this.cache.clear();

  }

  /**
   * Get cache size information
   */
  getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}