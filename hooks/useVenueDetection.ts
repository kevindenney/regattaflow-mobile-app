import React, { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { VenueIntelligenceAgent } from '@/services/agents/VenueIntelligenceAgent';
import type { SailingVenue } from '@/lib/types/global-venues';

interface VenueDetectionResult {
  currentVenue: SailingVenue | null;
  isDetecting: boolean;
  confidence: number;
  error: string | null;
  detectVenue: () => Promise<void>;
  permissionStatus: Location.PermissionStatus | null;
}

export function useVenueDetection(): VenueDetectionResult {
  const [currentVenue, setCurrentVenue] = useState<SailingVenue | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  // Create agent instance once using useMemo to avoid recreation on every render
  const agent = React.useMemo(() => new VenueIntelligenceAgent(), []);

  const detectVenue = useCallback(async () => {
    setIsDetecting(true);
    setError(null);

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        setError('Location permission denied. Please enable location access to auto-detect venues.');
        setIsDetecting(false);
        return;
      }

      // Get current GPS coordinates
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      console.log(`📍 GPS coordinates: ${latitude}, ${longitude}`);

      // Call VenueIntelligenceAgent to detect and switch venue
      const result = await agent.switchVenueByGPS({ latitude, longitude });

      if (result.success) {
        console.log('✅ Venue detected:', result.result);

        // Extract venue data from agent result
        // The agent's detect_venue_from_gps tool returns venue info
        const venueData = result.result;

        // Parse confidence from result (agent returns 0.0-1.0)
        const detectedConfidence = venueData?.confidence || 0;
        setConfidence(detectedConfidence);

        // Create venue object from agent response
        if (venueData?.venueId && venueData?.venueName) {
          setCurrentVenue({
            id: venueData.venueId,
            name: venueData.venueName,
            coordinates: venueData.coordinates || { lat: latitude, lng: longitude },
            region: venueData.region || 'unknown',
            // Additional fields will be populated by the agent's intelligence loading
          } as SailingVenue);
        }
      } else {
        setError(result.error || 'Failed to detect venue');
        console.error('❌ Venue detection failed:', result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to detect venue');
      console.error('❌ Venue detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  // Auto-detect on mount - DISABLED until RPC functions are created
  // useEffect(() => {
  //   detectVenue();
  // }, []);

  return {
    currentVenue,
    isDetecting,
    confidence,
    error,
    detectVenue,
    permissionStatus,
  };
}
