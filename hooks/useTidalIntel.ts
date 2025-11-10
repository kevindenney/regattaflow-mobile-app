import { useEffect, useMemo, useState, useCallback } from 'react';
import type { GeoLocation } from '@/lib/types/advanced-map';
import { tidalIntelService, type TideIntel } from '@/services/tides/TidalIntelService';

export interface UseTidalIntelArgs {
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  referenceTime?: Date | string | null;
}

export interface UseTidalIntelResult {
  intel: TideIntel | null;
  loading: boolean;
  error: Error | null;
  available: boolean;
  refetch: () => Promise<void>;
}

export function useTidalIntel({ coordinates, referenceTime }: UseTidalIntelArgs): UseTidalIntelResult {
  const [intel, setIntel] = useState<TideIntel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const available = tidalIntelService.isConfigured();

  const geoLocation: GeoLocation | null = useMemo(() => {
    if (!coordinates) return null;
    const { lat, lng } = coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return { latitude: lat, longitude: lng };
  }, [coordinates?.lat, coordinates?.lng]);

  const resolvedReferenceTime = useMemo(() => {
    if (!referenceTime) return new Date();
    if (referenceTime instanceof Date) return referenceTime;
    const parsed = new Date(referenceTime);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [referenceTime]);

  const fetchIntel = useCallback(async () => {
    if (!available || !geoLocation) {
      setIntel(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await tidalIntelService.getTideIntel(geoLocation, resolvedReferenceTime);
      setIntel(result);
    } catch (err: any) {
      setIntel(null);
      setError(err instanceof Error ? err : new Error('Failed to load tidal intelligence'));
    } finally {
      setLoading(false);
    }
  }, [available, geoLocation, resolvedReferenceTime]);

  useEffect(() => {
    void fetchIntel();
  }, [fetchIntel]);

  return {
    intel,
    loading,
    error,
    available,
    refetch: fetchIntel
  };
}
