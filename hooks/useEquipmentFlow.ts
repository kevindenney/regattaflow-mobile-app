/**
 * useEquipmentFlow - Cross-Race Equipment Tracking
 *
 * Implements the temporal flow of equipment issues:
 * - Post-race: Sailor notes "halyard needs service"
 * - Next race "Days Before": Shows as checklist item
 * - Mark as resolved: Item removed from flow
 *
 * This implements Tufte's principle of data flow across time:
 * "Information should appear when it's needed"
 *
 * Storage: Supabase `equipment_issues` table (syncs across devices)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/services/supabase';

// =============================================================================
// TYPES
// =============================================================================

export interface EquipmentIssue {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  fromRaceId: string;
  fromRaceName: string;
  fromRaceDate: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedForRaceId?: string;
}

interface UseEquipmentFlowOptions {
  userId?: string;
  boatId?: string;
  currentRaceId?: string;
  /** Only include unresolved issues */
  unresolvedOnly?: boolean;
}

interface UseEquipmentFlowReturn {
  /** Equipment issues from previous races */
  carryoverIssues: EquipmentIssue[];
  /** Issues specific to current race */
  currentRaceIssues: EquipmentIssue[];
  /** All issues (resolved and unresolved) */
  allIssues: EquipmentIssue[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Add a new equipment issue */
  addIssue: (description: string, priority?: 'high' | 'medium' | 'low', fromRaceId?: string, fromRaceName?: string) => Promise<void>;
  /** Mark an issue as resolved */
  resolveIssue: (issueId: string, resolvedForRaceId?: string) => Promise<void>;
  /** Remove an issue entirely */
  removeIssue: (issueId: string) => Promise<void>;
  /** Update an issue */
  updateIssue: (issueId: string, updates: Partial<EquipmentIssue>) => Promise<void>;
  /** Refresh data */
  refresh: () => Promise<void>;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Check if a string is a valid UUID (for filtering demo/invalid users)
 */
function isValidUUID(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Map database row to EquipmentIssue type
 */
function mapDbRowToIssue(item: any): EquipmentIssue {
  return {
    id: item.id,
    description: item.description,
    priority: item.priority || 'medium',
    fromRaceId: item.from_race_id,
    fromRaceName: item.from_race_name || 'Previous Race',
    fromRaceDate: item.from_race_date || item.created_at,
    createdAt: item.created_at,
    resolvedAt: item.resolved_at,
    resolvedForRaceId: item.resolved_for_race_id,
  };
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useEquipmentFlow({
  userId,
  boatId,
  currentRaceId,
  unresolvedOnly = true,
}: UseEquipmentFlowOptions = {}): UseEquipmentFlowReturn {
  const [issues, setIssues] = useState<EquipmentIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check if we have a valid user ID (skip DB operations for demo users)
  const hasValidUser = isValidUUID(userId);

  // Load issues from Supabase
  const loadIssues = useCallback(async () => {
    // Skip loading for demo/invalid users - return empty
    if (!hasValidUser) {
      setIssues([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('equipment_issues')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (dbError) {
        throw new Error(dbError.message);
      }

      const dbIssues = (data || []).map(mapDbRowToIssue);
      setIssues(dbIssues);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load equipment issues'));
      setIssues([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, hasValidUser]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Add a new issue
  const addIssue = useCallback(async (
    description: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
    fromRaceId?: string,
    fromRaceName?: string,
  ) => {
    // Skip for demo/invalid users
    if (!hasValidUser) {
      return;
    }

    try {
      setError(null);
      const now = new Date().toISOString();

      const { data, error: dbError } = await supabase
        .from('equipment_issues')
        .insert({
          user_id: userId,
          boat_id: boatId,
          description,
          priority,
          from_race_id: fromRaceId || currentRaceId || null,
          from_race_name: fromRaceName || 'Current Race',
          from_race_date: now,
          created_at: now,
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      // Add to local state
      if (data) {
        const newIssue = mapDbRowToIssue(data);
        setIssues(prev => [newIssue, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add equipment issue'));
      throw err;
    }
  }, [hasValidUser, userId, boatId, currentRaceId]);

  // Resolve an issue
  const resolveIssue = useCallback(async (issueId: string, resolvedForRaceId?: string) => {
    // Skip for demo/invalid users
    if (!hasValidUser) {
      return;
    }

    try {
      setError(null);
      const now = new Date().toISOString();

      const { error: dbError } = await supabase
        .from('equipment_issues')
        .update({
          resolved_at: now,
          resolved_for_race_id: resolvedForRaceId || currentRaceId,
        })
        .eq('id', issueId)
        .eq('user_id', userId); // Ensure user owns this issue

      if (dbError) {
        throw new Error(dbError.message);
      }

      // Update local state
      setIssues(prev => prev.map(issue =>
        issue.id === issueId
          ? {
              ...issue,
              resolvedAt: now,
              resolvedForRaceId: resolvedForRaceId || currentRaceId,
            }
          : issue
      ));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to resolve equipment issue'));
      throw err;
    }
  }, [hasValidUser, userId, currentRaceId]);

  // Remove an issue entirely
  const removeIssue = useCallback(async (issueId: string) => {
    // Skip for demo/invalid users
    if (!hasValidUser) {
      return;
    }

    try {
      setError(null);

      const { error: dbError } = await supabase
        .from('equipment_issues')
        .delete()
        .eq('id', issueId)
        .eq('user_id', userId); // Ensure user owns this issue

      if (dbError) {
        throw new Error(dbError.message);
      }

      // Update local state
      setIssues(prev => prev.filter(issue => issue.id !== issueId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove equipment issue'));
      throw err;
    }
  }, [hasValidUser, userId]);

  // Update an issue
  const updateIssue = useCallback(async (issueId: string, updates: Partial<EquipmentIssue>) => {
    // Skip for demo/invalid users
    if (!hasValidUser) {
      return;
    }

    try {
      setError(null);

      const { error: dbError } = await supabase
        .from('equipment_issues')
        .update({
          description: updates.description,
          priority: updates.priority,
        })
        .eq('id', issueId)
        .eq('user_id', userId); // Ensure user owns this issue

      if (dbError) {
        throw new Error(dbError.message);
      }

      // Update local state
      setIssues(prev => prev.map(issue =>
        issue.id === issueId
          ? { ...issue, ...updates }
          : issue
      ));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update equipment issue'));
      throw err;
    }
  }, [hasValidUser, userId]);

  // Computed values
  const carryoverIssues = useMemo(() => {
    let filtered = issues.filter(issue => issue.fromRaceId !== currentRaceId);
    if (unresolvedOnly) {
      filtered = filtered.filter(issue => !issue.resolvedAt);
    }
    return filtered;
  }, [issues, currentRaceId, unresolvedOnly]);

  const currentRaceIssues = useMemo(() => {
    let filtered = issues.filter(issue => issue.fromRaceId === currentRaceId);
    if (unresolvedOnly) {
      filtered = filtered.filter(issue => !issue.resolvedAt);
    }
    return filtered;
  }, [issues, currentRaceId, unresolvedOnly]);

  const allIssues = useMemo(() => {
    if (unresolvedOnly) {
      return issues.filter(issue => !issue.resolvedAt);
    }
    return issues;
  }, [issues, unresolvedOnly]);

  return {
    carryoverIssues,
    currentRaceIssues,
    allIssues,
    isLoading,
    error,
    addIssue,
    resolveIssue,
    removeIssue,
    updateIssue,
    refresh: loadIssues,
  };
}

export default useEquipmentFlow;
