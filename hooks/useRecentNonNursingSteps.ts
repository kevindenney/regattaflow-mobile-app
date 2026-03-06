import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/services/supabase';
import { isUuid } from '@/utils/uuid';

export type RecentNonNursingStep = {
  id: string;
  name: string;
  date: string;
  interestSlug: string;
  metadata: Record<string,unknown>;
  raceType: string | null;
};

type UseRecentNonNursingStepsParams = {
  userId?: string | null;
  excludeInterestSlug?: string;
  enabled?: boolean;
};

type CacheEntry = {
  loaded: boolean;
  data: RecentNonNursingStep[];
  inFlight?: Promise<RecentNonNursingStep[]>;
};

const recentStepsCache = new globalThis.Map<string,CacheEntry>();

const parseMetadata = (value:unknown):Record<string,unknown> => {
  return value && typeof value === 'object' ? value as Record<string,unknown> : {};
};

const toInterestSlug = (metadata:Record<string,unknown>):string => {
  return String(metadata.interest_slug || '').toLowerCase().trim();
};

const fetchRecentNonNursingSteps = async (userId:string, excludeInterestSlug:string):Promise<RecentNonNursingStep[]> => {
  const { data, error } = await supabase
    .from('regattas')
    .select('id,name,start_date,created_at,race_type,metadata')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  const normalized = (data || []).map((row:any):RecentNonNursingStep => {
    const metadata = parseMetadata(row?.metadata);
    return {
      id: String(row?.id || ''),
      name: String(row?.name || 'Untitled'),
      date: String(row?.start_date || row?.created_at || ''),
      interestSlug: toInterestSlug(metadata),
      metadata,
      raceType: row?.race_type ? String(row.race_type) : null,
    };
  });

  return normalized
    .filter((row) => {
      // Keep unknown slugs for legacy rows; only hard-exclude nursing.
      return row.interestSlug !== excludeInterestSlug;
    })
    .slice(0, 10);
};

export const useRecentNonNursingSteps = ({
  userId,
  excludeInterestSlug = 'nursing',
  enabled = true,
}:UseRecentNonNursingStepsParams) => {
  const [steps, setSteps] = useState<RecentNonNursingStep[]>([]);

  const cacheKey = useMemo(() => {
    return `${String(userId || '')}::${excludeInterestSlug}`;
  }, [userId, excludeInterestSlug]);

  useEffect(() => {
    if (!enabled || !userId || !isUuid(userId)) {
      setSteps([]);
      return;
    }

    const cached = recentStepsCache.get(cacheKey);
    if (cached?.loaded) {
      setSteps(cached.data);
      return;
    }

    if (cached?.inFlight) {
      cached.inFlight
        .then((result) => setSteps(result))
        .catch(() => setSteps([]));
      return;
    }

    const promise = fetchRecentNonNursingSteps(userId, excludeInterestSlug)
      .then((result) => {
        recentStepsCache.set(cacheKey, { loaded: true, data: result });
        return result;
      })
      .catch(() => {
        recentStepsCache.set(cacheKey, { loaded: true, data: [] });
        return [];
      });

    recentStepsCache.set(cacheKey, { loaded: false, data: [], inFlight: promise });

    promise.then((result) => setSteps(result));
  }, [cacheKey, enabled, excludeInterestSlug, userId]);

  return { steps };
};
