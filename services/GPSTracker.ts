/**
 * GPS Tracker Service
 * Background GPS recording service for race tracking
 * Records GPS coordinates, speed, heading during races
 */

import { Platform } from 'react-native';
import { supabase } from './supabase';

// Dynamic import helper for expo-location (native only)
let LocationModule: typeof import('expo-location') | null = null;

async function getLocationModule() {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!LocationModule) {
    LocationModule = await import('expo-location');
  }
  return LocationModule;
}

export interface GPSTrackPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed: number | null; // meters/second
  heading: number | null; // degrees
  altitude: number | null; // meters
  accuracy: number | null; // meters
}

export interface RaceTimerSession {
  id: string;
  sailor_id: string;
  regatta_id: string | null;
  race_number: number | null;
  start_time: string;
  end_time: string | null;
  track_points: GPSTrackPoint[];
  notes: string | null;
}

class GPSTrackerService {
  private subscription: any | null = null;
  private trackPoints: GPSTrackPoint[] = [];
  private currentSessionId: string | null = null;
  private isTracking = false;

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    const Location = await getLocationModule();
    if (!Location) {
      console.error('Location module not available on web');
      return false;
    }

    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        console.error('Foreground location permission denied');
        return false;
      }

      // Request background permissions for continued tracking
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission denied - tracking will stop when app is backgrounded');
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Start GPS tracking for a race
   */
  async startTracking(sessionId: string): Promise<boolean> {
    if (this.isTracking) {
      console.warn('GPS tracking already in progress');
      return false;
    }

    const Location = await getLocationModule();
    if (!Location) {
      console.error('GPS tracking not available on web');
      return false;
    }

    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permissions not granted');
      }

      // Clear any previous track points
      this.trackPoints = [];
      this.currentSessionId = sessionId;
      this.isTracking = true;

      // Start location updates
      this.subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Update every second
          distanceInterval: 1, // Update every meter
        },
        (location) => {
          this.recordTrackPoint(location);
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting GPS tracking:', error);
      this.isTracking = false;
      return false;
    }
  }

  /**
   * Record a GPS track point
   */
  private recordTrackPoint(location: any): void {
    const trackPoint: GPSTrackPoint = {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      timestamp: new Date().toISOString(),
      speed: location.coords.speed,
      heading: location.coords.heading,
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy,
    };

    this.trackPoints.push(trackPoint);

    // Log every 10 points to avoid spam
    if (this.trackPoints.length % 10 === 0) {
    }
  }

  /**
   * Stop GPS tracking and save to database
   */
  async stopTracking(): Promise<GPSTrackPoint[]> {
    if (!this.isTracking) {
      console.warn('GPS tracking not in progress');
      return [];
    }

    try {
      // Stop location updates
      if (this.subscription) {
        try {
          if (typeof this.subscription.remove === 'function') {
            this.subscription.remove();
          } else if (typeof (this.subscription as any)?.unsubscribe === 'function') {
            // Some web implementations expose an unsubscribe method instead
            (this.subscription as any).unsubscribe();
          } else {
            const watchId = (this.subscription as any)?._id ?? (this.subscription as any)?._watchId;
            if (typeof watchId === 'number' && typeof navigator !== 'undefined' && navigator.geolocation?.clearWatch) {
              navigator.geolocation.clearWatch(watchId);
            }
          }
        } catch (removeError) {
          // Expo web can throw if LocationEventEmitter.removeSubscription is missing; swallow so stopTracking still completes
          console.warn('Failed to remove location subscription cleanly', removeError);
        }
        this.subscription = null;
      }

      this.isTracking = false;

      // Save track points to database
      if (this.currentSessionId && this.trackPoints.length > 0) {
        const { error } = await supabase
          .from('race_timer_sessions')
          .update({
            track_points: this.trackPoints,
            end_time: new Date().toISOString(),
          })
          .eq('id', this.currentSessionId);

        if (error) {
          console.error('Error saving GPS track:', error);
        } else {
        }
      }

      const savedPoints = [...this.trackPoints];

      // Clear session data
      this.currentSessionId = null;
      this.trackPoints = [];

      return savedPoints;
    } catch (error) {
      console.error('Error stopping GPS tracking:', error);
      return [];
    }
  }

  /**
   * Get current tracking status
   */
  getTrackingStatus(): {
    isTracking: boolean;
    pointCount: number;
    sessionId: string | null;
  } {
    return {
      isTracking: this.isTracking,
      pointCount: this.trackPoints.length,
      sessionId: this.currentSessionId,
    };
  }

  /**
   * Get track points without stopping tracking
   */
  getTrackPoints(): GPSTrackPoint[] {
    return [...this.trackPoints];
  }
}

// Export singleton instance
export const gpsTracker = new GPSTrackerService();
