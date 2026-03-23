/**
 * usePeopleResolver — Resolves extracted name strings against platform users.
 *
 * Takes raw people names from brain dump extraction and searches for matching
 * BetterAt users. Returns resolved results with match status:
 * - exact: single match found, auto-linked
 * - ambiguous: multiple matches, user needs to pick
 * - unmatched: no platform user found
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { CrewFinderService } from '@/services/CrewFinderService';
import { useAuth } from '@/providers/AuthProvider';

export interface ResolvedMatch {
  user_id: string;
  display_name: string;
  avatar_emoji?: string;
  avatar_color?: string;
}

export interface ResolvedPerson {
  /** The raw name extracted from text */
  raw_name: string;
  /** Resolution status */
  status: 'resolving' | 'exact' | 'ambiguous' | 'unmatched';
  /** The selected/matched user (for exact or after disambiguation) */
  match?: ResolvedMatch;
  /** All candidate matches (for ambiguous) */
  candidates?: ResolvedMatch[];
}

export function usePeopleResolver(extractedNames: string[]) {
  const { user } = useAuth();
  const [resolved, setResolved] = useState<Map<string, ResolvedPerson>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const prevNamesRef = useRef<string>('');
  // Keep a ref to current resolved state so async code can read it without stale closures
  const resolvedRef = useRef(resolved);
  resolvedRef.current = resolved;

  // Resolve names when they change
  useEffect(() => {
    const namesKey = [...extractedNames].sort().join('|');
    if (namesKey === prevNamesRef.current) return;
    prevNamesRef.current = namesKey;

    if (extractedNames.length === 0) {
      setResolved(new Map());
      return;
    }

    // Abort previous resolution
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Set all to resolving
    setResolved((prev) => {
      const next = new Map(prev);
      for (const name of extractedNames) {
        // Keep already-resolved ones that user has interacted with
        const existing = next.get(name);
        if (existing?.status === 'exact' && existing.match) continue;
        next.set(name, { raw_name: name, status: 'resolving' });
      }
      // Remove names no longer in the list
      for (const key of next.keys()) {
        if (!extractedNames.includes(key)) next.delete(key);
      }
      return next;
    });

    // Resolve each name
    const resolveAll = async () => {
      for (const name of extractedNames) {
        if (controller.signal.aborted) return;

        // Skip already resolved (user selected) — read from ref for fresh state
        const existing = resolvedRef.current.get(name);
        if (existing?.status === 'exact' && existing.match) continue;

        try {
          const results = await CrewFinderService.searchUsers(name, 5);
          if (controller.signal.aborted) return;

          // Filter out current user
          const filtered = results.filter((r) => r.userId !== user?.id);

          let person: ResolvedPerson;

          if (filtered.length === 0) {
            person = { raw_name: name, status: 'unmatched' };
          } else if (filtered.length === 1) {
            person = {
              raw_name: name,
              status: 'exact',
              match: {
                user_id: filtered[0].userId,
                display_name: filtered[0].fullName,
                avatar_emoji: filtered[0].avatarEmoji,
                avatar_color: filtered[0].avatarColor,
              },
            };
          } else {
            // Check for exact name match among results
            const exactMatch = filtered.find(
              (r) => r.fullName.toLowerCase() === name.toLowerCase()
            );
            if (exactMatch && filtered.filter(
              (r) => r.fullName.toLowerCase() === name.toLowerCase()
            ).length === 1) {
              // Only one person with this exact name
              person = {
                raw_name: name,
                status: 'exact',
                match: {
                  user_id: exactMatch.userId,
                  display_name: exactMatch.fullName,
                  avatar_emoji: exactMatch.avatarEmoji,
                  avatar_color: exactMatch.avatarColor,
                },
              };
            } else {
              person = {
                raw_name: name,
                status: 'ambiguous',
                candidates: filtered.map((r) => ({
                  user_id: r.userId,
                  display_name: r.fullName,
                  avatar_emoji: r.avatarEmoji,
                  avatar_color: r.avatarColor,
                })),
              };
            }
          }

          setResolved((prev) => {
            const next = new Map(prev);
            next.set(name, person);
            return next;
          });
        } catch {
          if (controller.signal.aborted) return;
          setResolved((prev) => {
            const next = new Map(prev);
            next.set(name, { raw_name: name, status: 'unmatched' });
            return next;
          });
        }
      }
    };

    resolveAll();

    return () => controller.abort();
  }, [extractedNames, user?.id]);

  /** User picks a specific match from ambiguous candidates */
  const selectMatch = useCallback((rawName: string, match: ResolvedMatch) => {
    setResolved((prev) => {
      const next = new Map(prev);
      const existing = next.get(rawName);
      next.set(rawName, {
        raw_name: rawName,
        status: 'exact',
        match,
        candidates: existing?.candidates,
      });
      return next;
    });
  }, []);

  /** User dismisses a person (marks as unmatched / keeps as plain text) */
  const dismissPerson = useCallback((rawName: string) => {
    setResolved((prev) => {
      const next = new Map(prev);
      next.set(rawName, { raw_name: rawName, status: 'unmatched' });
      return next;
    });
  }, []);

  return {
    resolvedPeople: Array.from(resolved.values()),
    selectMatch,
    dismissPerson,
  };
}
