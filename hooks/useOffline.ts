/**
 * useOffline Hook
 * 
 * Easy integration of offline capabilities into components.
 * Shows offline status, sync progress, and provides caching methods.
 */

import { useState, useEffect } from 'react';
import { offlineService, OfflineStatus } from '@/services/offlineService';

export function useOffline() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: true,
    isSyncing: false,
    queueLength: 0,
    lastSync: null,
    failedItems: 0,
  });

  useEffect(() => {
    // Subscribe to offline status changes
    const unsubscribe = offlineService.subscribe(setStatus);

    // Get initial status
    offlineService.getOfflineStatus().then(setStatus);

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    ...status,
    // Cache methods
    cacheNextRace: offlineService.cacheNextRace.bind(offlineService),
    cacheVenue: offlineService.cacheVenue.bind(offlineService),
    setHomeVenue: offlineService.setHomeVenue.bind(offlineService),
    cacheUpcomingRaces: offlineService.cacheUpcomingRaces.bind(offlineService),
    cacheSailingDocuments: offlineService.cacheSailingDocuments.bind(offlineService),
    cacheCourseVisualizations: offlineService.cacheCourseVisualizations.bind(offlineService),

    // Cached data getters
    getCachedRace: offlineService.getCachedRace.bind(offlineService),
    getCachedVenue: offlineService.getCachedVenue.bind(offlineService),
    getCachedStrategy: offlineService.getCachedStrategy.bind(offlineService),
    getCachedTuningGuides: offlineService.getCachedTuningGuides.bind(offlineService),
    getCachedWeather: offlineService.getCachedWeather.bind(offlineService),
    getCachedUpcomingRaces: offlineService.getCachedUpcomingRaces.bind(offlineService),
    getCachedDocuments: offlineService.getCachedDocuments.bind(offlineService),
    getCachedVisualizations: offlineService.getCachedVisualizations.bind(offlineService),

    // Race day operations
    saveGPSTrack: offlineService.saveGPSTrack.bind(offlineService),
    logRaceEvent: offlineService.logRaceEvent.bind(offlineService),

    // Sync operations
    forceSyncNow: offlineService.forceSyncNow.bind(offlineService),
    clearExpiredCache: offlineService.clearExpiredCache.bind(offlineService),
    clearCache: offlineService.clearCache.bind(offlineService),
  };
}
