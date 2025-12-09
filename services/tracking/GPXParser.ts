/**
 * GPX File Parser
 * 
 * Parses GPS Exchange Format (.gpx) files, the universal standard
 * for GPS track data. Supports tracks from:
 * - Smartphone GPS apps
 * - Marine chartplotters
 * - Handheld GPS devices
 * - Other tracking systems
 */

import {
  Track,
  TrackPoint,
  TrackImportResult,
  TrackingDeviceType,
} from './types';

// ============================================================================
// Parser Class
// ============================================================================

export class GPXParser {
  /**
   * Parse a GPX file
   */
  parse(gpxContent: string): TrackImportResult {
    try {
      // Parse XML
      const parser = new DOMParser();
      const doc = parser.parseFromString(gpxContent, 'text/xml');

      // Check for parse errors
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        return {
          success: false,
          tracks: [],
          errors: ['Invalid GPX XML format'],
          sourceFormat: 'gpx',
        };
      }

      const tracks: Track[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];

      // Parse metadata
      const metadata = this.parseMetadata(doc);

      // Parse tracks (<trk> elements)
      const trkElements = doc.querySelectorAll('trk');
      trkElements.forEach((trk, index) => {
        try {
          const track = this.parseTrack(trk, index, metadata);
          if (track.points.length > 0) {
            tracks.push(track);
          } else {
            warnings.push(`Track ${index + 1} has no valid points`);
          }
        } catch (e) {
          errors.push(`Failed to parse track ${index + 1}: ${e}`);
        }
      });

      // Also try to parse routes (<rte>) as tracks
      const rteElements = doc.querySelectorAll('rte');
      rteElements.forEach((rte, index) => {
        try {
          const track = this.parseRoute(rte, trkElements.length + index);
          if (track.points.length > 0) {
            tracks.push(track);
          }
        } catch (e) {
          warnings.push(`Failed to parse route ${index + 1}`);
        }
      });

      if (tracks.length === 0) {
        return {
          success: false,
          tracks: [],
          errors: ['No valid tracks found in GPX file'],
          sourceFormat: 'gpx',
        };
      }

      return {
        success: true,
        tracks,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        sourceFormat: 'gpx',
        deviceType: this.detectDeviceType(metadata),
      };
    } catch (error) {
      return {
        success: false,
        tracks: [],
        errors: [`Failed to parse GPX file: ${error}`],
        sourceFormat: 'gpx',
      };
    }
  }

  /**
   * Parse GPX metadata
   */
  private parseMetadata(doc: Document): GPXMetadata {
    const metadata: GPXMetadata = {
      creator: doc.documentElement.getAttribute('creator') || undefined,
    };

    const metaEl = doc.querySelector('metadata');
    if (metaEl) {
      metadata.name = this.getElementText(metaEl, 'name');
      metadata.desc = this.getElementText(metaEl, 'desc');
      metadata.author = this.getElementText(metaEl, 'author > name');
      metadata.time = this.getElementText(metaEl, 'time');
    }

    return metadata;
  }

  /**
   * Parse a track element
   */
  private parseTrack(trk: Element, index: number, metadata: GPXMetadata): Track {
    const name = this.getElementText(trk, 'name') || `Track ${index + 1}`;
    const desc = this.getElementText(trk, 'desc');

    // Parse all track segments
    const points: TrackPoint[] = [];
    const segments = trk.querySelectorAll('trkseg');

    segments.forEach(seg => {
      const segPoints = this.parseTrackPoints(seg.querySelectorAll('trkpt'));
      points.push(...segPoints);
    });

    // Sort by timestamp if available
    points.sort((a, b) => a.timestamp - b.timestamp);

    const startTime = points[0]?.timestamp || Date.now();
    const endTime = points[points.length - 1]?.timestamp || startTime;

    return {
      id: `gpx_${Date.now()}_${index}`,
      deviceType: this.detectDeviceType(metadata),
      points,
      startTime,
      endTime,
      metadata: {
        name,
        description: desc,
        creator: metadata.creator,
      },
    };
  }

  /**
   * Parse a route element as a track
   */
  private parseRoute(rte: Element, index: number): Track {
    const name = this.getElementText(rte, 'name') || `Route ${index + 1}`;
    const points = this.parseTrackPoints(rte.querySelectorAll('rtept'));

    const startTime = points[0]?.timestamp || Date.now();
    const endTime = points[points.length - 1]?.timestamp || startTime;

    return {
      id: `gpx_route_${Date.now()}_${index}`,
      deviceType: 'generic_gpx',
      points,
      startTime,
      endTime,
      metadata: { name },
    };
  }

  /**
   * Parse track points
   */
  private parseTrackPoints(ptElements: NodeListOf<Element>): TrackPoint[] {
    const points: TrackPoint[] = [];

    ptElements.forEach(pt => {
      const lat = parseFloat(pt.getAttribute('lat') || '');
      const lng = parseFloat(pt.getAttribute('lon') || '');

      if (isNaN(lat) || isNaN(lng)) return;

      const timeStr = this.getElementText(pt, 'time');
      const timestamp = timeStr ? new Date(timeStr).getTime() : Date.now();

      const point: TrackPoint = {
        lat,
        lng,
        timestamp,
        altitude: this.parseFloat(this.getElementText(pt, 'ele')),
        speed: this.parseSpeed(pt),
        heading: this.parseCourse(pt),
        cog: this.parseCourse(pt),
      };

      // Parse extensions (may contain speed, course, etc.)
      const extensions = pt.querySelector('extensions');
      if (extensions) {
        this.parseExtensions(extensions, point);
      }

      points.push(point);
    });

    // Calculate speed/heading from positions if not provided
    this.calculateDerivedValues(points);

    return points;
  }

  /**
   * Parse extensions element for additional data
   */
  private parseExtensions(ext: Element, point: TrackPoint): void {
    // Garmin extensions
    point.speed = point.speed ?? this.parseFloat(this.getElementText(ext, 'gpxtpx\\:speed'));
    point.heading = point.heading ?? this.parseFloat(this.getElementText(ext, 'gpxtpx\\:course'));
    
    // Generic extensions
    point.speed = point.speed ?? this.parseFloat(this.getElementText(ext, 'speed'));
    point.heading = point.heading ?? this.parseFloat(this.getElementText(ext, 'course'));
    point.sog = point.sog ?? this.parseFloat(this.getElementText(ext, 'sog'));
    point.cog = point.cog ?? this.parseFloat(this.getElementText(ext, 'cog'));

    // Sailing-specific extensions
    point.twa = this.parseFloat(this.getElementText(ext, 'twa'));
    point.tws = this.parseFloat(this.getElementText(ext, 'tws'));
  }

  /**
   * Calculate speed and heading from positions when not provided
   */
  private calculateDerivedValues(points: TrackPoint[]): void {
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      // Calculate time difference
      const dt = (curr.timestamp - prev.timestamp) / 1000; // seconds
      if (dt <= 0) continue;

      // Calculate distance using Haversine formula
      const distance = this.haversineDistance(prev, curr);

      // Calculate speed if not provided (convert to knots: nm/hr)
      if (curr.speed === undefined) {
        const speedMs = distance / dt; // m/s
        curr.speed = speedMs * 1.94384; // knots
        curr.sog = curr.speed;
      }

      // Calculate heading if not provided
      if (curr.heading === undefined) {
        curr.heading = this.calculateBearing(prev, curr);
        curr.cog = curr.heading;
      }
    }
  }

  /**
   * Haversine distance calculation (returns meters)
   */
  private haversineDistance(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(p2.lat - p1.lat);
    const dLng = this.toRad(p2.lng - p1.lng);
    
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(this.toRad(p1.lat)) * Math.cos(this.toRad(p2.lat)) *
              Math.sin(dLng / 2) ** 2;
    
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Calculate bearing between two points
   */
  private calculateBearing(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
    const dLng = this.toRad(p2.lng - p1.lng);
    const lat1 = this.toRad(p1.lat);
    const lat2 = this.toRad(p2.lat);
    
    const x = Math.sin(dLng) * Math.cos(lat2);
    const y = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    let bearing = Math.atan2(x, y) * (180 / Math.PI);
    return (bearing + 360) % 360;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Parse speed from track point (may be in various formats)
   */
  private parseSpeed(pt: Element): number | undefined {
    // Try various speed element names
    const speedStr = this.getElementText(pt, 'speed') ||
                     this.getElementText(pt, 'sog');
    return this.parseFloat(speedStr);
  }

  /**
   * Parse course/heading from track point
   */
  private parseCourse(pt: Element): number | undefined {
    const courseStr = this.getElementText(pt, 'course') ||
                      this.getElementText(pt, 'cog') ||
                      this.getElementText(pt, 'magvar');
    return this.parseFloat(courseStr);
  }

  /**
   * Get text content of an element by selector
   */
  private getElementText(parent: Element | Document, selector: string): string | undefined {
    const el = parent.querySelector(selector);
    return el?.textContent?.trim() || undefined;
  }

  /**
   * Parse float, returning undefined if invalid
   */
  private parseFloat(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Detect device type from GPX metadata
   */
  private detectDeviceType(metadata: GPXMetadata): TrackingDeviceType {
    const creator = metadata.creator?.toLowerCase() || '';
    
    if (creator.includes('velocitek')) return 'velocitek_speedpuck';
    if (creator.includes('tractrac')) return 'tractrac';
    if (creator.includes('tacktracker')) return 'tacktracker';
    if (creator.includes('estela')) return 'estela';
    if (creator.includes('kwindoo')) return 'kwindoo';
    if (creator.includes('garmin') || creator.includes('gpsmap')) return 'generic_gpx';
    if (creator.includes('b&g') || creator.includes('simrad')) return 'generic_gpx';
    
    return 'generic_gpx';
  }
}

interface GPXMetadata {
  creator?: string;
  name?: string;
  desc?: string;
  author?: string;
  time?: string;
}

export default GPXParser;

