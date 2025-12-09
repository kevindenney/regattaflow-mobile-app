/**
 * Velocitek VCC File Parser
 * 
 * Parses Velocitek Control Center (.vcc) files from:
 * - SpeedPuck
 * - Shift
 * - ProStart
 * - RTK Puck
 * 
 * VCC files are binary format with GPS track data.
 * This parser also supports the text-based export formats.
 */

import {
  VelocitekTrack,
  VelocitekTrackPoint,
  VelocitekVCCHeader,
  TrackImportResult,
  TrackingDeviceType,
} from './types';

// ============================================================================
// VCC Binary Format Constants
// ============================================================================

const VCC_MAGIC = 'VCC';
const VCC_VERSION_2 = 2;

// Device type codes in VCC files
const DEVICE_CODES: Record<number, TrackingDeviceType> = {
  1: 'velocitek_speedpuck',
  2: 'velocitek_shift',
  3: 'velocitek_prostart',
  4: 'velocitek_rtk_puck',
};

const DEVICE_NAMES: Record<number, string> = {
  1: 'SpeedPuck',
  2: 'Shift',
  3: 'ProStart',
  4: 'RTK Puck',
};

// ============================================================================
// Parser Class
// ============================================================================

export class VelocitekParser {
  /**
   * Parse a VCC file (binary or text export)
   */
  parse(data: ArrayBuffer | string): TrackImportResult {
    try {
      // Check if it's binary or text
      if (typeof data === 'string') {
        return this.parseTextExport(data);
      }
      return this.parseBinary(data);
    } catch (error) {
      return {
        success: false,
        tracks: [],
        errors: [`Failed to parse Velocitek file: ${error}`],
        sourceFormat: 'vcc',
      };
    }
  }

  /**
   * Parse binary VCC file
   */
  private parseBinary(data: ArrayBuffer): TrackImportResult {
    const view = new DataView(data);
    const decoder = new TextDecoder('utf-8');
    
    // Check magic number
    const magic = decoder.decode(new Uint8Array(data, 0, 3));
    if (magic !== VCC_MAGIC) {
      return {
        success: false,
        tracks: [],
        errors: ['Invalid VCC file: missing magic number'],
        sourceFormat: 'vcc',
      };
    }

    // Read version
    const version = view.getUint8(3);
    if (version !== VCC_VERSION_2) {
      return {
        success: false,
        tracks: [],
        errors: [`Unsupported VCC version: ${version}`],
        sourceFormat: 'vcc',
      };
    }

    // Read header
    const deviceCode = view.getUint8(4);
    const deviceType = DEVICE_CODES[deviceCode] || 'velocitek_speedpuck';
    const deviceName = DEVICE_NAMES[deviceCode] || 'Unknown';

    // Read serial number (16 bytes, null-terminated)
    const serialBytes = new Uint8Array(data, 5, 16);
    const serialNumber = decoder.decode(serialBytes).replace(/\0/g, '');

    // Read firmware version
    const fwMajor = view.getUint8(21);
    const fwMinor = view.getUint8(22);
    const firmwareVersion = `${fwMajor}.${fwMinor}`;

    // Read track name (32 bytes, null-terminated)
    const nameBytes = new Uint8Array(data, 23, 32);
    const trackName = decoder.decode(nameBytes).replace(/\0/g, '') || 'Velocitek Track';

    // Read timestamps
    const startTimestamp = view.getUint32(55, true) * 1000; // Convert to ms
    const endTimestamp = view.getUint32(59, true) * 1000;

    // Read sample rate
    const sampleRate = view.getUint8(63);

    // Read point count
    const pointCount = view.getUint32(64, true);

    // Parse track points (starting at byte 68)
    const points: VelocitekTrackPoint[] = [];
    let offset = 68;
    const pointSize = 28; // bytes per point in VCC v2

    for (let i = 0; i < pointCount && offset + pointSize <= data.byteLength; i++) {
      const point = this.parsePoint(view, offset);
      points.push(point);
      offset += pointSize;
    }

    // Create header
    const header: VelocitekVCCHeader = {
      deviceType: deviceName as VelocitekVCCHeader['deviceType'],
      serialNumber,
      firmwareVersion,
      trackName,
      startTime: new Date(startTimestamp).toISOString(),
      endTime: new Date(endTimestamp).toISOString(),
      sampleRate,
    };

    // Create track
    const track: VelocitekTrack = {
      id: `velocitek_${serialNumber}_${startTimestamp}`,
      deviceType,
      header,
      points,
      startTime: startTimestamp,
      endTime: endTimestamp,
    };

    return {
      success: true,
      tracks: [track],
      sourceFormat: 'vcc',
      deviceType,
    };
  }

  /**
   * Parse a single track point from binary data
   */
  private parsePoint(view: DataView, offset: number): VelocitekTrackPoint {
    // VCC v2 point format:
    // 0-3: timestamp (uint32, seconds)
    // 4-7: latitude (int32, microdegrees)
    // 8-11: longitude (int32, microdegrees)
    // 12-13: speed (uint16, 0.01 knots)
    // 14-15: heading (uint16, 0.01 degrees)
    // 16-17: cog (uint16, 0.01 degrees)
    // 18-19: hdop (uint16, 0.01)
    // 20: satellites (uint8)
    // 21-22: altitude (int16, meters)
    // 23-24: battery voltage (uint16, 0.01V)
    // 25-27: reserved

    const timestamp = view.getUint32(offset, true) * 1000;
    const lat = view.getInt32(offset + 4, true) / 1e6;
    const lng = view.getInt32(offset + 8, true) / 1e6;
    const speed = view.getUint16(offset + 12, true) / 100;
    const heading = view.getUint16(offset + 14, true) / 100;
    const cog = view.getUint16(offset + 16, true) / 100;
    const hdop = view.getUint16(offset + 18, true) / 100;
    const satellites = view.getUint8(offset + 20);
    const altitude = view.getInt16(offset + 21, true);
    const batteryVoltage = view.getUint16(offset + 23, true) / 100;

    return {
      lat,
      lng,
      timestamp,
      speed,
      heading,
      cog,
      sog: speed, // SOG is the same as speed for Velocitek
      altitude,
      hdop,
      satellites,
      batteryVoltage,
    };
  }

  /**
   * Parse text export (CSV) from Velocitek Control Center
   */
  private parseTextExport(csvContent: string): TrackImportResult {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return {
        success: false,
        tracks: [],
        errors: ['Empty or invalid CSV file'],
        sourceFormat: 'csv',
      };
    }

    // Parse header row
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Find column indices
    const cols = {
      time: this.findColumn(headers, ['time', 'timestamp', 'utc']),
      lat: this.findColumn(headers, ['lat', 'latitude']),
      lng: this.findColumn(headers, ['lon', 'lng', 'longitude']),
      speed: this.findColumn(headers, ['speed', 'sog', 'spd']),
      heading: this.findColumn(headers, ['heading', 'hdg', 'head']),
      cog: this.findColumn(headers, ['cog', 'course']),
    };

    if (cols.lat === -1 || cols.lng === -1) {
      return {
        success: false,
        tracks: [],
        errors: ['CSV missing required latitude/longitude columns'],
        sourceFormat: 'csv',
      };
    }

    // Parse points
    const points: VelocitekTrackPoint[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      try {
        const lat = parseFloat(values[cols.lat]);
        const lng = parseFloat(values[cols.lng]);
        
        if (isNaN(lat) || isNaN(lng)) continue;

        const point: VelocitekTrackPoint = {
          lat,
          lng,
          timestamp: cols.time !== -1 ? this.parseTimestamp(values[cols.time]) : Date.now(),
          speed: cols.speed !== -1 ? parseFloat(values[cols.speed]) || 0 : undefined,
          heading: cols.heading !== -1 ? parseFloat(values[cols.heading]) || 0 : undefined,
          cog: cols.cog !== -1 ? parseFloat(values[cols.cog]) || 0 : undefined,
        };
        
        points.push(point);
      } catch (e) {
        errors.push(`Error parsing line ${i + 1}`);
      }
    }

    if (points.length === 0) {
      return {
        success: false,
        tracks: [],
        errors: ['No valid track points found in CSV'],
        sourceFormat: 'csv',
      };
    }

    // Create track
    const track: VelocitekTrack = {
      id: `velocitek_csv_${Date.now()}`,
      deviceType: 'velocitek_speedpuck', // Default, can't determine from CSV
      header: {
        deviceType: 'SpeedPuck',
        serialNumber: 'unknown',
        firmwareVersion: 'unknown',
        trackName: 'Imported Track',
        startTime: new Date(points[0].timestamp).toISOString(),
        endTime: new Date(points[points.length - 1].timestamp).toISOString(),
        sampleRate: 1,
      },
      points,
      startTime: points[0].timestamp,
      endTime: points[points.length - 1].timestamp,
    };

    return {
      success: true,
      tracks: [track],
      warnings: errors.length > 0 ? errors : undefined,
      sourceFormat: 'csv',
      deviceType: 'velocitek_speedpuck',
    };
  }

  /**
   * Find column index by possible names
   */
  private findColumn(headers: string[], names: string[]): number {
    for (const name of names) {
      const idx = headers.findIndex(h => h.includes(name));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  /**
   * Parse various timestamp formats
   */
  private parseTimestamp(value: string): number {
    // Try ISO format first
    const isoDate = new Date(value);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.getTime();
    }

    // Try Unix timestamp
    const unixTs = parseFloat(value);
    if (!isNaN(unixTs)) {
      // Check if seconds or milliseconds
      return unixTs > 1e12 ? unixTs : unixTs * 1000;
    }

    // Default to now
    return Date.now();
  }
}

export default VelocitekParser;

