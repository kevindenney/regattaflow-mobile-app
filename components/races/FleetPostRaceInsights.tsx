/**
 * FleetPostRaceInsights
 * Shows a lightweight snapshot of other sailors' post-race activity for the selected race.
 * Highlights who logged notes, who generated AI analysis, and provides quick navigation to their sessions.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Users, Navigation, NotebookPen } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

interface FleetEntry {
  sessionId: string;
  sailorId: string | null;
  sailorName: string;
  hasTrack: boolean;
  hasNotes: boolean;
  notesSnippet: string | null;
  aiSummary: string | null;
  overallSatisfaction?: number | null;
  keyLearning?: string | null;
  updatedAt?: string | null;
  isCurrentUser: boolean;
}

interface FleetPostRaceInsightsProps {
  raceId: string;
  currentUserId?: string | null;
  onViewSession?: (sessionId: string) => void;
  limit?: number;
}

const logger = createLogger('FleetPostRaceInsights');

function truncate(text: string | null | undefined, maxLength = 140): string | null {
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function extractFirstLine(value: unknown): string | null {
  if (!value) return null;
  if (Array.isArray(value) && value.length > 0) {
    return typeof value[0] === 'string' ? value[0] : null;
  }
  if (typeof value === 'string') {
    return value.split('\n')[0];
  }

  try {
    const parsed = JSON.parse(String(value));
    if (Array.isArray(parsed) && parsed.length > 0) {
      return typeof parsed[0] === 'string' ? parsed[0] : null;
    }
  } catch {
    // Ignore JSON parse errors
  }

  return null;
}

export function FleetPostRaceInsights({
  raceId,
  currentUserId,
  onViewSession,
  limit = 6,
}: FleetPostRaceInsightsProps) {
  const [entries, setEntries] = useState<FleetEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFleetInsights() {
      if (!raceId) {
        if (isMounted) {
          setEntries([]);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        logger.debug('[FleetPostRaceInsights] 🔍 Querying race_timer_sessions for regatta_id:', raceId);
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('race_timer_sessions')
          .select('id, sailor_id, notes, track_points, created_at, updated_at, end_time')
          .eq('regatta_id', raceId)
          .order('end_time', { ascending: false })
          .limit(limit * 3); // Fetch extra to account for filtering

        if (sessionsError) {
          logger.error('[FleetPostRaceInsights] ❌ Query error:', sessionsError);
          throw sessionsError;
        }

        const sessions = sessionsData ?? [];
        logger.debug('[FleetPostRaceInsights] 📊 Found', sessions.length, 'race sessions');

        if (sessions.length === 0) {
          logger.info('[FleetPostRaceInsights] No sessions found for regatta:', raceId);
          if (isMounted) {
            setEntries([]);
          }
          return;
        }

        const uniqueUserIds = Array.from(
          new Set(
            sessions
              .map((session) => session.sailor_id)
              .filter((value): value is string => typeof value === 'string')
          )
        );

        const sessionIds = sessions
          .map((session) => session.id)
          .filter((value): value is string => typeof value === 'string');

        let sailorProfiles: Array<{
          id: string;
          user_id: string;
          home_club?: string | null;
          boat_class_preferences?: any;
        }> = [];

        if (uniqueUserIds.length > 0) {
          logger.debug('[FleetPostRaceInsights] 🔍 Querying sailor_profiles for', uniqueUserIds.length, 'sailors');
          const { data: profileData, error: profileError } = await supabase
            .from('sailor_profiles')
            .select('id, user_id, home_club, boat_class_preferences')
            .in('user_id', uniqueUserIds);

          if (profileError) {
            logger.warn('[FleetPostRaceInsights] Unable to load sailor profiles', profileError);
          } else if (profileData) {
            logger.debug('[FleetPostRaceInsights] ✅ Loaded', profileData.length, 'sailor profiles');
            sailorProfiles = profileData;
          }
        }

        let userDirectory: Array<{ id: string; full_name?: string | null }> = [];
        if (uniqueUserIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', uniqueUserIds);

          if (usersError) {
            logger.warn('[FleetPostRaceInsights] Unable to load user directory', usersError);
          } else if (usersData) {
            userDirectory = usersData;
          }
        }

        let structuredAnalyses: Array<{
          sailor_id: string;
          overall_satisfaction?: number | null;
          key_learnings?: any;
          updated_at?: string | null;
        }> = [];

        const profileIds = sailorProfiles.map((profile) => profile.id);
        if (profileIds.length > 0) {
          const { data: analysisData, error: analysisError } = await supabase
            .from('race_analysis')
            .select('sailor_id, overall_satisfaction, key_learnings, updated_at')
            .eq('race_id', raceId)
            .in('sailor_id', profileIds);

          if (analysisError) {
            logger.warn('[FleetPostRaceInsights] Unable to load race analysis data', analysisError);
          } else if (analysisData) {
            structuredAnalyses = analysisData;
          }
        }

        let aiSummaries: Array<{
          timer_session_id: string;
          overall_summary?: string | null;
          created_at?: string | null;
        }> = [];

        if (sessionIds.length > 0) {
          const { data: aiData, error: aiError } = await supabase
            .from('ai_coach_analysis')
            .select('timer_session_id, overall_summary, created_at')
            .in('timer_session_id', sessionIds);

          if (aiError) {
            logger.warn('[FleetPostRaceInsights] Unable to load AI summaries', aiError);
          } else if (aiData) {
            aiSummaries = aiData;
          }
        }

        if (!isMounted) {
          return;
        }

        const profilesByUserId = new Map(
          sailorProfiles.map((profile) => [profile.user_id, profile])
        );
        const userNameById = new Map(
          userDirectory.map((user) => [user.id, user.full_name ?? null])
        );
        const analysisByProfileId = new Map(
          structuredAnalyses.map((analysis) => [analysis.sailor_id, analysis])
        );
        const aiSummaryBySessionId = new Map(
          aiSummaries.map((summary) => [summary.timer_session_id, summary])
        );

        const computedEntries: FleetEntry[] = sessions.map((session) => {
          const profile = session.sailor_id ? profilesByUserId.get(session.sailor_id) : undefined;
          const analysis = profile ? analysisByProfileId.get(profile.id) : undefined;
          const aiSummary = aiSummaryBySessionId.get(session.id);
          const displayName =
            userNameById.get(session.sailor_id ?? '') ||
            (session.sailor_id ? session.sailor_id.slice(0, 8) : 'Sailor');

          const boatClasses = profile?.boat_class_preferences
            ? (Array.isArray(profile.boat_class_preferences)
                ? profile.boat_class_preferences.join(', ')
                : String(profile.boat_class_preferences))
            : '';

          return {
            sessionId: session.id,
            sailorId: session.sailor_id ?? null,
            sailorName:
              session.sailor_id && session.sailor_id === currentUserId
                ? `${displayName} (You)`
                : displayName,
            hasTrack: Array.isArray(session.track_points) && session.track_points.length > 0,
            hasNotes: typeof session.notes === 'string' && session.notes.trim().length > 0,
            notesSnippet: truncate(extractFirstLine(session.notes)),
            aiSummary: truncate(aiSummary?.overall_summary),
            overallSatisfaction: analysis?.overall_satisfaction ?? null,
            keyLearning: extractFirstLine(analysis?.key_learnings),
            updatedAt: aiSummary?.created_at || analysis?.updated_at || session.updated_at || session.end_time || session.created_at,
            isCurrentUser: !!currentUserId && session.sailor_id === currentUserId,
          };
        });

        setEntries(computedEntries);
      } catch (error: any) {
        logger.warn('[FleetPostRaceInsights] Failed to load fleet data', error);
        if (isMounted) {
          setEntries([]);
          setError('Unable to load fleet insights right now.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFleetInsights();

    return () => {
      isMounted = false;
    };
  }, [currentUserId, limit, raceId]);

  const entriesToDisplay = useMemo(() => {
    return entries.slice(0, limit);
  }, [entries, limit]);

  if (!raceId) {
    return null;
  }

  return (
    <View className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Users size={18} color="#0F172A" />
          <Text className="text-base font-semibold text-slate-900">Fleet Insights</Text>
        </View>
        {loading && <ActivityIndicator size="small" color="#0F172A" />}
      </View>

      {error ? (
        <Text className="text-sm text-rose-600">{error}</Text>
      ) : entriesToDisplay.length === 0 ? (
        <Text className="text-sm text-slate-500">
          No other sailors have logged post-race data yet. Invite your fleet to share their notes!
        </Text>
      ) : (
        entriesToDisplay.map((entry) => (
          <View
            key={entry.sessionId}
            className="mb-3 last:mb-0 rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-slate-900">{entry.sailorName}</Text>
              <View className="flex-row items-center gap-2">
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    entry.hasTrack ? 'bg-emerald-100' : 'bg-slate-200'
                  }`}
                >
                  <Text className="text-[11px] font-semibold text-slate-700">
                    {entry.hasTrack ? 'Track logged' : 'No track'}
                  </Text>
                </View>
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    entry.hasNotes ? 'bg-sky-100' : 'bg-slate-200'
                  }`}
                >
                  <Text className="text-[11px] font-semibold text-slate-700">
                    {entry.hasNotes ? 'Interview' : 'No interview'}
                  </Text>
                </View>
              </View>
            </View>

            {entry.aiSummary ? (
              <Text className="text-sm text-slate-700 mt-2">
                {entry.aiSummary}
              </Text>
            ) : entry.keyLearning ? (
              <Text className="text-sm text-slate-600 mt-2">
                {entry.keyLearning}
              </Text>
            ) : entry.notesSnippet ? (
              <Text className="text-sm text-slate-600 mt-2">
                {entry.notesSnippet}
              </Text>
            ) : (
              <Text className="text-sm text-slate-500 mt-2">
                Awaiting AI analysis and notes.
              </Text>
            )}

            <View className="flex-row gap-2 mt-3">
              <Pressable
                className={`flex-row items-center gap-2 rounded-lg px-3 py-2 border ${
                  entry.hasTrack ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-100'
                }`}
                disabled={!onViewSession || !entry.hasTrack}
                onPress={() => onViewSession?.(entry.sessionId)}
              >
                <Navigation size={16} color="#0F172A" />
                <Text
                  className={`text-sm font-semibold ${
                    entry.hasTrack ? 'text-slate-800' : 'text-slate-500'
                  }`}
                >
                  View Track
                </Text>
              </Pressable>

              <Pressable
                className="flex-row items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2"
                disabled={!entry.hasNotes && !entry.aiSummary}
                onPress={() => {
                  if (entry.hasNotes || entry.aiSummary) {
                    onViewSession?.(entry.sessionId);
                  }
                }}
              >
                <NotebookPen size={16} color="#0F172A" />
                <Text
                  className={`text-sm font-semibold ${
                    entry.hasNotes || entry.aiSummary ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  Fleet Notes
                </Text>
              </Pressable>
            </View>

            {entry.overallSatisfaction ? (
              <Text className="text-xs text-slate-500 mt-2">
                Satisfaction: {entry.overallSatisfaction}/5
                {entry.updatedAt ? ` • Updated ${new Date(entry.updatedAt).toLocaleDateString()}` : ''}
              </Text>
            ) : entry.updatedAt ? (
              <Text className="text-xs text-slate-500 mt-2">
                Updated {new Date(entry.updatedAt).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}
