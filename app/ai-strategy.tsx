import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Brain, Upload, FileText, Map } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { AIStrategyService } from '@/services/aiService';
import { supabase } from '@/services/supabase';
import { isMissingIdColumn } from '@/lib/utils/supabaseSchemaFallback';
import { createLogger } from '@/lib/utils/logger';
import {
  deriveConfidencePercent,
  deriveStrategySummary,
  isDocumentSelectionCancelled,
  normalizeStrategyUploadError,
} from '@/lib/ai-strategy.utils';

const logger = createLogger('AIStrategyScreen');

interface RecentStrategy {
  id: string;
  regattaId?: string;
  raceId?: string;
  raceName: string;
  summary: string;
  confidencePercent: number;
  generatedAt: string;
}

export default function AIStrategyScreen() {
  const router = useRouter();
  const { raceId: raceIdParam, regattaId: regattaIdParam } = useLocalSearchParams<{
    raceId?: string;
    regattaId?: string;
  }>();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingMessage, setProcessingMessage] = React.useState<string | null>(null);
  const [lastUploadError, setLastUploadError] = React.useState<string | null>(null);
  const [recentStrategies, setRecentStrategies] = React.useState<RecentStrategy[]>([]);
  const [recentLoading, setRecentLoading] = React.useState(false);
  const uploadInFlightRef = React.useRef(false);
  const isMountedRef = React.useRef(true);
  const loadRunIdRef = React.useRef(0);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      loadRunIdRef.current += 1;
    };
  }, []);

  const loadRecentStrategies = React.useCallback(async () => {
    const runId = ++loadRunIdRef.current;
    const canCommit = () => isMountedRef.current && loadRunIdRef.current === runId;

    if (!user?.id) {
      if (canCommit()) {
        setRecentStrategies([]);
      }
      return;
    }

    if (canCommit()) {
      setRecentLoading(true);
    }
    try {
      let rows: any[] | null = null;
      let queryError: any = null;

      const primary = await supabase
        .from('race_strategies')
        .select('id, regatta_id, strategy_type, confidence_score, generated_at, created_at, strategy_content')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(10);

      rows = primary.data;
      queryError = primary.error;

      if (queryError && isMissingIdColumn(queryError, 'race_strategies', 'regatta_id')) {
        const fallback = await supabase
          .from('race_strategies')
          .select('id, race_id, strategy_type, confidence_score, generated_at, created_at, strategy_content')
          .eq('user_id', user.id)
          .order('generated_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(10);
        rows = fallback.data;
        queryError = fallback.error;
      }

      if (queryError) {
        throw queryError;
      }

      const regattaIds = Array.from(
        new Set(
          (rows || [])
            .flatMap((row) => [row?.regatta_id, row?.race_id])
            .filter(Boolean)
        )
      ) as string[];
      const regattaNameById = new Map<string, string>();
      if (regattaIds.length > 0) {
        const regattasQuery = await supabase
          .from('regattas')
          .select('id, name')
          .in('id', regattaIds);

        (regattasQuery.data || []).forEach((regatta: any) => {
          if (regatta?.id && regatta?.name) {
            regattaNameById.set(regatta.id, regatta.name);
          }
        });
      }

      const mapped = (rows || []).map((row) => {
        const content = row?.strategy_content && typeof row.strategy_content === 'object'
          ? row.strategy_content
          : {};
        const raceName =
          regattaNameById.get(row?.regatta_id || row?.race_id) ||
          content?.race_name ||
          content?.name ||
          `Strategy (${row?.strategy_type || 'pre_race'})`;
        const summary =
          content?.pre_start_plan?.positioning ||
          content?.tacticalPlan?.startingStrategy ||
          content?.summary ||
          'AI-generated race strategy';

        return {
          id: row.id,
          regattaId: row?.regatta_id || undefined,
          raceId: row?.race_id || row?.regatta_id || undefined,
          raceName,
          summary: typeof summary === 'string' ? summary : 'AI-generated race strategy',
          confidencePercent: deriveConfidencePercent(row?.confidence_score),
          generatedAt: row?.generated_at || row?.created_at || new Date().toISOString(),
        } satisfies RecentStrategy;
      });

      if (!canCommit()) return;
      setRecentStrategies(mapped);
    } catch (error) {
      logger.error('Failed to load recent strategies', error);
      if (!canCommit()) return;
      setRecentStrategies([]);
    } finally {
      if (canCommit()) {
        setRecentLoading(false);
      }
    }
  }, [user?.id]);

  React.useEffect(() => {
    void loadRecentStrategies();
  }, [loadRecentStrategies]);

  const openStrategy = React.useCallback((strategy: RecentStrategy) => {
    const raceId = strategy.regattaId || strategy.raceId;
    const params: { raceName: string; raceDate: string; raceId?: string } = {
      raceName: strategy.raceName,
      raceDate: strategy.generatedAt,
    };
    if (raceId) {
      params.raceId = raceId;
    }
    router.push({
      pathname: '/race/strategy',
      params,
    });
  }, [router]);

  const openCourseMap = React.useCallback((strategy: RecentStrategy) => {
    const raceId = strategy.regattaId || strategy.raceId;
    if (!raceId) {
      Alert.alert(
        'Course Map Unavailable',
        'This strategy is missing a race reference. You can still open the strategy details.',
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Open Strategy', onPress: () => openStrategy(strategy) },
        ]
      );
      return;
    }
    router.push(`/race/simulation/${raceId}`);
  }, [openStrategy, router]);

  const openSupportEmail = React.useCallback((contextMessage?: string) => {
    const subject = encodeURIComponent('AI Strategy Upload Support');
    const body = encodeURIComponent(
      `AI Strategy upload/generation issue.\n\n` +
      `Race ID: ${String(raceIdParam || 'none')}\n` +
      `Regatta ID: ${String(regattaIdParam || 'none')}\n` +
      `User ID: ${String(user?.id || 'unknown')}\n` +
      `Context: ${contextMessage || 'Upload failed'}`
    );
    const mailtoUrl = `mailto:support@regattaflow.com?subject=${subject}&body=${body}`;
    Linking.openURL(mailtoUrl).catch(() => {});
  }, [raceIdParam, regattaIdParam, user?.id]);

  const handleUploadDocument = React.useCallback(async () => {
    if (uploadInFlightRef.current) {
      return;
    }
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to generate an AI strategy.');
      return;
    }

    try {
      if (!isMountedRef.current) return;
      uploadInFlightRef.current = true;
      setIsProcessing(true);
      setLastUploadError(null);
      setProcessingMessage('Preparing strategy upload...');
      const { strategy } = await AIStrategyService.selectDocumentAndGenerateStrategy(
        {
          tier: 'pro',
          regattaId: regattaIdParam || raceIdParam,
        },
        user.id,
        {
          onProgress: (message) => {
            if (!isMountedRef.current) return;
            setProcessingMessage(message);
          },
        }
      );
      if (!isMountedRef.current) return;
      const strategySummary = deriveStrategySummary(strategy);
      const linkedRaceId = regattaIdParam || raceIdParam || undefined;
      const newRecent: RecentStrategy = {
        id: strategy.id || `local-${Date.now()}`,
        regattaId: linkedRaceId,
        raceId: linkedRaceId,
        raceName: 'New AI Strategy',
        summary: strategySummary,
        confidencePercent: deriveConfidencePercent(strategy.confidence_score),
        generatedAt: strategy.created_at?.toISOString?.() || new Date().toISOString(),
      };
      if (!isMountedRef.current) return;
      setRecentStrategies((prev) => {
        const withoutDuplicate = prev.filter((item) => item.id !== newRecent.id);
        return [newRecent, ...withoutDuplicate].slice(0, 10);
      });
      void loadRecentStrategies();

      Alert.alert(
        'Strategy Generated',
        `Your ${strategy.strategy_type} strategy is ready. Confidence: ${deriveConfidencePercent(strategy.confidence_score)}%.`
      );
    } catch (error: any) {
      if (isDocumentSelectionCancelled(error)) {
        if (isMountedRef.current) {
          setProcessingMessage(null);
        }
        return;
      }
      const normalizedMessage = normalizeStrategyUploadError(error);
      if (isMountedRef.current) {
        setLastUploadError(normalizedMessage);
      }
      Alert.alert(
        'Upload failed',
        normalizedMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Contact Support', onPress: () => openSupportEmail(normalizedMessage) },
          { text: 'Retry', onPress: () => void handleUploadDocument() },
        ]
      );
    } finally {
      uploadInFlightRef.current = false;
      if (isMountedRef.current) {
        setProcessingMessage(null);
        setIsProcessing(false);
      }
    }
  }, [loadRecentStrategies, user?.id, regattaIdParam, raceIdParam, openSupportEmail]);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">AI Strategy Center</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Upload Section */}
        <View className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 mb-4" style={{ backgroundColor: '#9333ea' }}>
          <View className="flex-row items-center mb-4">
            <Brain size={32} color="white" />
            <Text className="text-white text-xl font-bold ml-3">AI-Powered Race Strategy</Text>
          </View>
          <Text className="text-purple-100 mb-4" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Upload sailing instructions, race documents, or photos. Our AI will extract courses, analyze conditions, and generate winning strategies.
          </Text>
          <TouchableOpacity
            className={`bg-white py-3 px-6 rounded-lg ${isProcessing ? 'opacity-70' : ''}`}
            onPress={handleUploadDocument}
            disabled={isProcessing}
          >
            <View className="flex-row items-center justify-center">
              {isProcessing ? (
                <ActivityIndicator color="#9333ea" />
              ) : (
                <Upload size={20} color="#9333ea" />
              )}
              <Text className="text-purple-600 font-semibold ml-2">
                {isProcessing ? (processingMessage || 'Processing...') : 'Upload Document'}
              </Text>
            </View>
          </TouchableOpacity>
          {lastUploadError ? (
            <Text className="text-white text-xs mt-3" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              Last error: {lastUploadError}
            </Text>
          ) : null}
        </View>

        {/* Recent Strategies */}
        <Text className="text-lg font-bold text-gray-800 mb-3">Recent Strategies</Text>
        {recentLoading ? (
          <View className="bg-white rounded-xl p-4 items-center">
            <ActivityIndicator color="#2563EB" />
            <Text className="text-gray-600 mt-2">Loading recent strategies...</Text>
          </View>
        ) : recentStrategies.length === 0 ? (
          <View className="bg-white rounded-xl p-4">
            <Text className="text-gray-800 font-semibold">No strategies yet</Text>
            <Text className="text-gray-600 mt-1">
              Upload a race document above to generate your first AI strategy.
            </Text>
          </View>
        ) : (
          recentStrategies.map((strategy) => (
            <View key={strategy.id} className="bg-white rounded-xl p-4 mb-3">
              <View className="flex-row items-center mb-2">
                <FileText size={20} color="#2563EB" />
                <Text className="text-gray-800 font-semibold ml-2 flex-1">{strategy.raceName}</Text>
                <Text className="text-xs text-blue-600 font-semibold">{strategy.confidencePercent}%</Text>
              </View>
              <Text className="text-gray-600 mb-3" numberOfLines={2}>
                {strategy.summary}
              </Text>
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  className="flex-1 py-2 bg-blue-50 rounded-lg"
                  onPress={() => openStrategy(strategy)}
                >
                  <Text className="text-blue-600 font-medium text-center">View Strategy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-2 bg-green-50 rounded-lg"
                  onPress={() => openCourseMap(strategy)}
                >
                  <View className="flex-row items-center justify-center">
                    <Map size={16} color="#059669" />
                    <Text className="text-green-600 font-medium ml-1">3D Course</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
