/**
 * WeatherRoutingWizard
 *
 * Multi-step wizard for weather routing analysis in distance races.
 * Provides weather conditions along the route, model comparison,
 * and decision point identification.
 *
 * Steps:
 * 1. Overview - Route summary with weather overlay
 * 2. Legs - Leg-by-leg weather conditions
 * 3. Models - Multi-model comparison
 * 4. Decisions - Decision points and timing
 * 5. Confirm - Summary and save
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Navigation,
  Wind,
  Compass,
  AlertTriangle,
  Clock,
  Sparkles,
  BookOpen,
  Map,
  Target,
  Anchor,
  Route,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWeatherRouting, useWeatherRoutingLegSummary } from '@/hooks/useWeatherRouting';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';
import type { SailingVenue } from '@/lib/types/global-venues';
import type { RouteWaypoint } from '@/types/raceEvents';
import type { WeatherRoutingStep } from '@/types/weatherRouting';

// Sub-components
import { RouteWeatherOverview } from './steps/RouteWeatherOverview';
import { LegByLegConditions } from './steps/LegByLegConditions';
import { ModelComparisonStep } from './steps/ModelComparisonStep';
import { DecisionPointsStep } from './steps/DecisionPointsStep';
import { ConfirmationStep } from './steps/ConfirmationStep';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  yellow: '#FFCC00',
  teal: '#5AC8FA',
  gray: '#8E8E93',
  gray2: '#636366',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

// Wizard steps (excluding loading)
const STEPS: WeatherRoutingStep[] = ['overview', 'legs', 'models', 'decisions', 'confirm'];

interface WeatherRoutingWizardProps extends ChecklistToolProps {
  venue?: SailingVenue | null;
  raceDate?: string | null;
  raceName?: string;
  raceStartTime?: string;
  raceDurationHours?: number;
  routeWaypoints?: RouteWaypoint[];
}

export function WeatherRoutingWizard({
  item,
  raceEventId,
  boatId,
  onComplete,
  onCancel,
  venue,
  raceDate,
  raceName,
  raceStartTime,
  raceDurationHours,
  routeWaypoints,
}: WeatherRoutingWizardProps) {
  const router = useRouter();

  // Parse start time
  const startTimeString = useMemo(() => {
    if (!raceDate) return null;
    if (raceDate.includes('T')) return raceDate;
    if (raceStartTime) {
      const normalizedTime = raceStartTime.includes(':')
        ? (raceStartTime.split(':').length === 2 ? `${raceStartTime}:00` : raceStartTime)
        : '00:00:00';
      return `${raceDate}T${normalizedTime}`;
    }
    return `${raceDate}T00:00:00`;
  }, [raceDate, raceStartTime]);

  // Get weather routing analysis
  const {
    analysis,
    legs,
    modelForecasts,
    modelAgreement,
    decisionPoints,
    sailPlan,
    overallRisk,
    recommendations,
    totalDistanceNm,
    estimatedDurationHours,
    step,
    setStep,
    isLoading,
    error,
    refreshAnalysis,
    avgBoatSpeed,
    setAvgBoatSpeed,
    hasValidRoute,
    riskColor,
    agreementColor,
  } = useWeatherRouting({
    raceEventId,
    waypoints: routeWaypoints || null,
    startTime: startTimeString,
    boatId,
    avgBoatSpeedKts: 6,
    hoursAhead: raceDurationHours ? Math.max(72, raceDurationHours + 24) : 72,
    enabled: true,
  });

  // Get leg summary for quick overview
  const legSummary = useWeatherRoutingLegSummary(analysis);

  // Current step index
  const currentStepIndex = useMemo(() => {
    if (step === 'loading') return -1;
    return STEPS.indexOf(step);
  }, [step]);

  // Progress (0-1)
  const progress = useMemo(() => {
    if (step === 'loading') return 0;
    return (currentStepIndex + 1) / STEPS.length;
  }, [currentStepIndex, step]);

  // Navigation
  const goNext = useCallback(() => {
    if (currentStepIndex < STEPS.length - 1) {
      setStep(STEPS[currentStepIndex + 1]);
    }
  }, [currentStepIndex, setStep]);

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setStep(STEPS[currentStepIndex - 1]);
    }
  }, [currentStepIndex, setStep]);

  // Handle learn more
  const handleLearnMore = useCallback(() => {
    if (item.learningModuleSlug) {
      router.push(`/learn/module/${item.learningModuleSlug}`);
    }
  }, [router, item.learningModuleSlug]);

  // Format race date for display
  const formatRaceDate = (date: string | null) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  };

  // Render loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={IOS_COLORS.blue} />
      <Text style={styles.loadingText}>Analyzing route weather...</Text>
      {routeWaypoints && (
        <Text style={styles.loadingSubtext}>
          {routeWaypoints.length} waypoints, {totalDistanceNm.toFixed(1)} nm
        </Text>
      )}
    </View>
  );

  // Render error state
  const renderError = () => (
    <View style={styles.errorContainer}>
      <AlertTriangle size={48} color={IOS_COLORS.orange} />
      <Text style={styles.errorTitle}>Unable to analyze route</Text>
      <Text style={styles.errorDescription}>
        {!hasValidRoute
          ? 'This race needs at least 2 waypoints to analyze weather routing.'
          : error?.message || 'Failed to fetch weather data. Please try again.'}
      </Text>
      <Pressable style={styles.retryButton} onPress={refreshAnalysis}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );

  // Render step content
  const renderStepContent = () => {
    if (step === 'loading' || isLoading) {
      return renderLoading();
    }

    if (error || !analysis) {
      return renderError();
    }

    switch (step) {
      case 'overview':
        return (
          <RouteWeatherOverview
            analysis={analysis}
            legSummary={legSummary}
            riskColor={riskColor}
            venue={venue}
          />
        );
      case 'legs':
        return (
          <LegByLegConditions
            legs={legs}
            avgBoatSpeed={avgBoatSpeed}
            onBoatSpeedChange={setAvgBoatSpeed}
          />
        );
      case 'models':
        return (
          <ModelComparisonStep
            modelForecasts={modelForecasts}
            modelAgreement={modelAgreement}
            agreementColor={agreementColor}
          />
        );
      case 'decisions':
        return (
          <DecisionPointsStep
            decisionPoints={decisionPoints}
            sailPlan={sailPlan}
            recommendations={recommendations}
          />
        );
      case 'confirm':
        return (
          <ConfirmationStep
            analysis={analysis}
            legSummary={legSummary}
            overallRisk={overallRisk}
            riskColor={riskColor}
            onLearnMore={handleLearnMore}
          />
        );
      default:
        return null;
    }
  };

  // Step titles
  const stepTitles: Record<WeatherRoutingStep, string> = {
    loading: 'Loading...',
    overview: 'Route Overview',
    legs: 'Leg-by-Leg',
    models: 'Model Comparison',
    decisions: 'Decision Points',
    confirm: 'Summary',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onCancel}>
          <X size={24} color={IOS_COLORS.label} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Weather Routing</Text>
          {raceName && <Text style={styles.headerSubtitle}>{raceName}</Text>}
          {raceDate && <Text style={styles.headerDate}>{formatRaceDate(raceDate)}</Text>}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>{stepTitles[step]}</Text>
        {step !== 'loading' && (
          <Text style={styles.stepProgress}>
            {currentStepIndex + 1} of {STEPS.length}
          </Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderStepContent()}
      </View>

      {/* Footer navigation */}
      {step !== 'loading' && !isLoading && analysis && (
        <View style={styles.footer}>
          {currentStepIndex > 0 ? (
            <Pressable style={styles.backButton} onPress={goBack}>
              <ChevronLeft size={20} color={IOS_COLORS.blue} />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.footerSpacer} />
          )}

          {currentStepIndex < STEPS.length - 1 ? (
            <Pressable style={styles.nextButton} onPress={goNext}>
              <Text style={styles.nextButtonText}>Next</Text>
              <ChevronRight size={20} color={IOS_COLORS.secondaryBackground} />
            </Pressable>
          ) : (
            <Pressable style={styles.doneButton} onPress={onComplete}>
              <CheckCircle2 size={20} color={IOS_COLORS.secondaryBackground} />
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  headerDate: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    height: 3,
    backgroundColor: IOS_COLORS.separator,
  },
  progressBar: {
    height: '100%',
    backgroundColor: IOS_COLORS.blue,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
  },
  stepText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  stepProgress: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: 16,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryBackground,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  footerSpacer: {
    width: 80,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  backButtonText: {
    fontSize: 15,
    color: IOS_COLORS.blue,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 10,
    gap: 4,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryBackground,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: IOS_COLORS.green,
    borderRadius: 10,
    gap: 8,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryBackground,
  },
});
