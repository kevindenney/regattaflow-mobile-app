import { useState, useCallback, useRef, useEffect } from 'react';
import { venueDetectionService } from '@/services/venue/VenueDetectionService';
import type { SailingVenue } from '@/lib/types/global-venues';

interface VenueDetectionResult {
  currentVenue: SailingVenue | null;
  isDetecting: boolean;
  confidence: number;
  error: string | null;
  detectVenue: () => Promise<void>;
  permissionStatus: string | null;
}

export function useVenueDetection(): VenueDetectionResult {
  const [currentVenue, setCurrentVenue] = useState<SailingVenue | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const detectRunIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      detectRunIdRef.current += 1;
    };
  }, []);

  const detectVenue = useCallback(async () => {
    const runId = ++detectRunIdRef.current;
    const canCommit = () => isMountedRef.current && runId === detectRunIdRef.current;

    if (!canCommit()) return;
    setIsDetecting(true);
    setError(null);

    try {
      const initialized = await venueDetectionService.initialize();
      if (!canCommit()) return;
      setPermissionStatus(initialized ? 'granted' : 'fallback');

      await venueDetectionService.forceDetection();
      if (!canCommit()) return;

      const detectedVenue = venueDetectionService.getCurrentVenue();
      const detectionStatus = venueDetectionService.getDetectionStatus();
      if (detectedVenue) {
        setCurrentVenue(detectedVenue as SailingVenue);
        setConfidence(detectionStatus?.confidence ?? 0.9);
      } else {
        setError('Failed to detect venue');
        setConfidence(0);
      }
    } catch (err: any) {
      if (!canCommit()) return;
      setError(err.message || 'Failed to detect venue');
    } finally {
      if (!canCommit()) return;
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
