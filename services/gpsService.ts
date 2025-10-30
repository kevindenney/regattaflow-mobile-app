/**
 * GPS Tracking Service
 * High-frequency GPS tracking for race recording and analysis
 * - 1Hz sampling during races
 * - VMG calculations
 * - Track recording and upload
 * - Post-race analysis
 */

import * as Location from 'expo-location';
import { supabase } from '@/services/supabase';

// ==================== Type Definitions ====================

export interface GPSPoint {
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed: number; // knots
  heading: number; // degrees
  accuracy: number; // meters
  altitude?: number; // meters
}

export interface VMGCalculation {
  vmg_upwind: number; // knots
  vmg_downwind: number; // knots
  optimal_angle_upwind: number; // degrees
  optimal_angle_downwind: number; // degrees
  wind_angle: number; // relative wind angle
}

export interface RaceTrack {
  id?: string;
  race_id?: string;
  user_id: string;
  start_time: Date;
  end_time?: Date;
  points: GPSPoint[];
  distance_nm: number;
  average_speed: number;
  max_speed: number;
  vmg_analysis: VMGCalculation[];
  status: 'recording' | 'completed' | 'uploaded';
}

export interface TrackAnalysis {
  total_distance: number;
  average_speed: number;
  max_speed: number;
  total_tacks: number;
  total_gybes: number;
  upwind_performance: {
    average_vmg: number;
    optimal_angle: number;
    consistency_score: number;
  };
  downwind_performance: {
    average_vmg: number;
    optimal_angle: number;
    consistency_score: number;
  };
  speed_by_point_of_sail: {
    close_hauled: number;
    reaching: number;
    running: number;
  };
}

// ==================== GPS Service ====================

export class GPSTrackingService {
  private static trackingInterval: ReturnType<typeof setInterval> | null = null;
  private static currentTrack: RaceTrack | null = null;
  private static locationSubscription: Location.LocationSubscription | null = null;
  private static windDirection: number = 0; // True wind direction

  /**
   * Start GPS tracking at 1Hz
   */
  static async startTracking(userId: string, raceId?: string): Promise<void> {
    try {

      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('GPS permission denied');
      }

      // Request background permissions for continuous tracking
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {

      }

      // Initialize track
      this.currentTrack = {
        user_id: userId,
        race_id: raceId,
        start_time: new Date(),
        points: [],
        distance_nm: 0,
        average_speed: 0,
        max_speed: 0,
        vmg_analysis: [],
        status: 'recording'
      };

      // Start high-frequency location tracking
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // 1 second = 1Hz
          distanceInterval: 0, // Record all points regardless of movement
        },
        (location) => {
          this.recordGPSPoint(location);
        }
      );

    } catch (error) {

      throw error;
    }
  }

  /**
   * Stop GPS tracking and save track
   */
  static async stopTracking(): Promise<RaceTrack | null> {
    try {

      if (!this.currentTrack) {
        throw new Error('No active track to stop');
      }

      // Stop location subscription
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      // Clear interval
      if (this.trackingInterval) {
        clearInterval(this.trackingInterval);
        this.trackingInterval = null;
      }

      // Finalize track
      this.currentTrack.end_time = new Date();
      this.currentTrack.status = 'completed';

      // Calculate final statistics
      this.calculateTrackStatistics(this.currentTrack);

      // Save track locally first
      const savedTrack = { ...this.currentTrack };

      // Upload to Supabase
      await this.uploadTrack(savedTrack);

      const result = savedTrack;
      this.currentTrack = null;

      return result;
    } catch (error) {

      return null;
    }
  }

  /**
   * Record a GPS point
   */
  private static recordGPSPoint(location: Location.LocationObject): void {
    if (!this.currentTrack) return;

    const point: GPSPoint = {
      timestamp: new Date(location.timestamp),
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      speed: location.coords.speed ? this.metersPerSecondToKnots(location.coords.speed) : 0,
      heading: location.coords.heading || 0,
      accuracy: location.coords.accuracy || 0,
      altitude: location.coords.altitude || undefined
    };

    // Add point to track
    this.currentTrack.points.push(point);

    // Calculate VMG if we have wind data
    if (this.currentTrack.points.length > 1) {
      const vmg = this.calculateVMG(point, this.windDirection);
      this.currentTrack.vmg_analysis.push(vmg);
    }

    // Update running statistics
    this.updateRunningStatistics(this.currentTrack, point);
  }

  /**
   * Calculate VMG (Velocity Made Good)
   */
  private static calculateVMG(point: GPSPoint, windDirection: number): VMGCalculation {
    const relativeWindAngle = this.calculateRelativeWindAngle(point.heading, windDirection);
    const vmg = point.speed * Math.cos(this.degreesToRadians(relativeWindAngle));

    const isUpwind = Math.abs(relativeWindAngle) < 90;

    return {
      vmg_upwind: isUpwind ? vmg : 0,
      vmg_downwind: !isUpwind ? vmg : 0,
      optimal_angle_upwind: 45, // Typical optimal upwind angle
      optimal_angle_downwind: 135, // Typical optimal downwind angle
      wind_angle: relativeWindAngle
    };
  }

  /**
   * Update running statistics
   */
  private static updateRunningStatistics(track: RaceTrack, newPoint: GPSPoint): void {
    const points = track.points;

    if (points.length < 2) return;

    // Calculate distance increment
    const prevPoint = points[points.length - 2];
    const distanceMeters = this.haversineDistance(
      prevPoint.latitude,
      prevPoint.longitude,
      newPoint.latitude,
      newPoint.longitude
    );
    track.distance_nm += this.metersToNauticalMiles(distanceMeters);

    // Update max speed
    if (newPoint.speed > track.max_speed) {
      track.max_speed = newPoint.speed;
    }

    // Calculate average speed
    const totalSpeed = points.reduce((sum, p) => sum + p.speed, 0);
    track.average_speed = totalSpeed / points.length;
  }

  /**
   * Calculate final track statistics
   */
  private static calculateTrackStatistics(track: RaceTrack): void {
    if (track.points.length < 2) return;

    // Already updated during recording, but recalculate for accuracy
    const points = track.points;

    // Total distance
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const dist = this.haversineDistance(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude
      );
      totalDistance += dist;
    }
    track.distance_nm = this.metersToNauticalMiles(totalDistance);

    // Average and max speed
    track.average_speed = points.reduce((sum, p) => sum + p.speed, 0) / points.length;
    track.max_speed = Math.max(...points.map(p => p.speed));
  }

  /**
   * Analyze track for detailed performance metrics
   */
  static async analyzeTrack(track: RaceTrack): Promise<TrackAnalysis> {
    try {

      const points = track.points;

      // Count maneuvers
      const maneuvers = this.detectManeuvers(points);

      // Calculate upwind performance
      const upwindPoints = track.vmg_analysis.filter(v => v.vmg_upwind > 0);
      const avgUpwindVMG = upwindPoints.reduce((sum, v) => sum + v.vmg_upwind, 0) / upwindPoints.length || 0;

      // Calculate downwind performance
      const downwindPoints = track.vmg_analysis.filter(v => v.vmg_downwind > 0);
      const avgDownwindVMG = downwindPoints.reduce((sum, v) => sum + v.vmg_downwind, 0) / downwindPoints.length || 0;

      // Speed by point of sail
      const speedByPOS = this.calculateSpeedByPointOfSail(points, track.vmg_analysis);

      const analysis: TrackAnalysis = {
        total_distance: track.distance_nm,
        average_speed: track.average_speed,
        max_speed: track.max_speed,
        total_tacks: maneuvers.tacks,
        total_gybes: maneuvers.gybes,
        upwind_performance: {
          average_vmg: avgUpwindVMG,
          optimal_angle: 45,
          consistency_score: this.calculateConsistencyScore(upwindPoints.map(v => v.vmg_upwind))
        },
        downwind_performance: {
          average_vmg: avgDownwindVMG,
          optimal_angle: 135,
          consistency_score: this.calculateConsistencyScore(downwindPoints.map(v => v.vmg_downwind))
        },
        speed_by_point_of_sail: speedByPOS
      };

      return analysis;
    } catch (error) {

      throw error;
    }
  }

  /**
   * Upload track to Supabase
   */
  private static async uploadTrack(track: RaceTrack): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('race_tracks')
        .insert({
          race_id: track.race_id,
          user_id: track.user_id,
          start_time: track.start_time.toISOString(),
          end_time: track.end_time?.toISOString(),
          points: track.points,
          distance_nm: track.distance_nm,
          average_speed: track.average_speed,
          max_speed: track.max_speed,
          vmg_analysis: track.vmg_analysis,
          status: 'uploaded'
        })
        .select()
        .single();

      if (error) throw error;

      track.id = data.id;
      track.status = 'uploaded';

    } catch (error) {

      // Keep local track even if upload fails
    }
  }

  /**
   * Set wind direction for VMG calculations
   */
  static setWindDirection(direction: number): void {
    this.windDirection = direction;

  }

  /**
   * Get current track status
   */
  static getCurrentTrack(): RaceTrack | null {
    return this.currentTrack;
  }

  /**
   * Check if tracking is active
   */
  static isTracking(): boolean {
    return this.currentTrack?.status === 'recording';
  }

  // ==================== Utility Methods ====================

  private static metersPerSecondToKnots(mps: number): number {
    return mps * 1.94384;
  }

  private static metersToNauticalMiles(meters: number): number {
    return meters / 1852;
  }

  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static calculateRelativeWindAngle(heading: number, windDirection: number): number {
    let angle = windDirection - heading;
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
  }

  private static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const φ1 = this.degreesToRadians(lat1);
    const φ2 = this.degreesToRadians(lat2);
    const Δφ = this.degreesToRadians(lat2 - lat1);
    const Δλ = this.degreesToRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private static detectManeuvers(points: GPSPoint[]): { tacks: number; gybes: number } {
    let tacks = 0;
    let gybes = 0;

    for (let i = 1; i < points.length; i++) {
      const headingChange = Math.abs(points[i].heading - points[i - 1].heading);

      if (headingChange > 70 && headingChange < 110) {
        // Likely a tack (heading change through wind)
        tacks++;
      } else if (headingChange > 110) {
        // Likely a gybe (heading change downwind)
        gybes++;
      }
    }

    return { tacks, gybes };
  }

  private static calculateSpeedByPointOfSail(points: GPSPoint[], vmgData: VMGCalculation[]): {
    close_hauled: number;
    reaching: number;
    running: number;
  } {
    const closeHauled: number[] = [];
    const reaching: number[] = [];
    const running: number[] = [];

    vmgData.forEach((vmg, idx) => {
      const absAngle = Math.abs(vmg.wind_angle);
      const speed = points[idx + 1]?.speed || 0;

      if (absAngle < 60) {
        closeHauled.push(speed);
      } else if (absAngle < 120) {
        reaching.push(speed);
      } else {
        running.push(speed);
      }
    });

    return {
      close_hauled: closeHauled.reduce((sum, s) => sum + s, 0) / closeHauled.length || 0,
      reaching: reaching.reduce((sum, s) => sum + s, 0) / reaching.length || 0,
      running: running.reduce((sum, s) => sum + s, 0) / running.length || 0
    };
  }

  private static calculateConsistencyScore(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Consistency score: lower std dev = higher score
    const maxStdDev = mean; // Assume max std dev equals mean
    return Math.max(0, 100 - (stdDev / maxStdDev) * 100);
  }
}

export default GPSTrackingService;
