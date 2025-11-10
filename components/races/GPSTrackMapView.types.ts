import type { GPSTrackPoint } from '@/services/GPSTracker';

export interface GPSTrackMapViewProps {
  // Current track being recorded/displayed
  trackPoints: GPSTrackPoint[];

  // Auto-follow current position (live tracking mode)
  autoFollow?: boolean;

  // Additional tracks for fleet comparison
  fleetTracks?: Array<{
    sailorName: string;
    color: string;
    trackPoints: GPSTrackPoint[];
  }>;

  // Map region center (if not auto-following)
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };

  // Course marks to display
  courseMarks?: Array<{
    name: string;
    latitude: number;
    longitude: number;
  }>;
}
