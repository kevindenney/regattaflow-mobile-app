# Claude Skills UX/UI Integration Guide

## Overview
This guide shows how to integrate the 5 new RegattaFlow Playbook Tactics skills into RegattaFlow's UX, creating context-aware AI coaching that appears at the right moment with actionable advice.

## Architecture Overview

```
Race Flow → Race Phase Detection → Skill Selection → Skill Invocation → UI Presentation
```

### Key Principles
1. **Context-Aware**: Skills appear automatically based on race phase
2. **Progressive Disclosure**: Don't overwhelm - show relevant info only
3. **Actionable**: Every AI response includes concrete next steps
4. **Glanceable**: Critical info visible in <3 seconds
5. **Dismissible**: User controls when AI coach speaks

---

## Step 1: Update SkillManagementService

First, add the new skill IDs to your skill registry:

```typescript
// services/ai/SkillManagementService.ts

// Add to existing skill definitions
const SKILL_REGISTRY = {
  // Existing skills
  'race-strategy-analyst': 'skill_016R9Wa9Jw928XFGnhWgqDpe',
  'tidal-opportunism-analyst': 'skill_012WQmtEfP4SwvchDj9LuvT4',
  'slack-window-planner': 'skill_018FpLesHB3ZQKQHtRT9P1bm',
  'current-counterplay-advisor': 'skill_01VQdHobT3BRjsDcYedxtU62',

  // New RegattaFlow Playbook Tactics skills
  'starting-line-mastery': 'skill_011dooWmBYwv8KmnifcSBUus',
  'upwind-strategic-positioning': 'skill_01Ryk5M8H8jGE6CTY8FiStiU',
  'upwind-tactical-combat': 'skill_01NZz9TWk3XQyY7AvMHrbwAF',
  'downwind-speed-and-position': 'skill_01LNkbjy2KGHfu5DAA4DbQPp',
  'mark-rounding-execution': 'skill_01RjN794zsvZhMtubbyHpVPk',
};

// Add race phase to skill mapping
export type RacePhase =
  | 'pre-race'
  | 'start-sequence'
  | 'first-beat'
  | 'weather-mark'
  | 'reaching'
  | 'running'
  | 'leeward-mark'
  | 'final-beat'
  | 'finish';

export const PHASE_TO_SKILLS: Record<RacePhase, string[]> = {
  'pre-race': [
    'starting-line-mastery',
    'upwind-strategic-positioning',
    'race-strategy-analyst',
    'tidal-opportunism-analyst'
  ],
  'start-sequence': [
    'starting-line-mastery'
  ],
  'first-beat': [
    'upwind-strategic-positioning',
    'upwind-tactical-combat',
    'tidal-opportunism-analyst'
  ],
  'weather-mark': [
    'mark-rounding-execution'
  ],
  'reaching': [
    'downwind-speed-and-position',
    'current-counterplay-advisor'
  ],
  'running': [
    'downwind-speed-and-position',
    'tidal-opportunism-analyst'
  ],
  'leeward-mark': [
    'mark-rounding-execution'
  ],
  'final-beat': [
    'upwind-tactical-combat',
    'upwind-strategic-positioning'
  ],
  'finish': [
    'mark-rounding-execution'
  ]
};

// Helper to get primary skill for phase
export function getPrimarySkillForPhase(phase: RacePhase): string {
  const skills = PHASE_TO_SKILLS[phase];
  return skills[0]; // Return first (primary) skill
}

// Helper to invoke skill with context
export async function invokeSkillWithContext(
  skillName: string,
  context: Record<string, any>
): Promise<any> {
  const skillId = SKILL_REGISTRY[skillName];
  if (!skillId) {
    throw new Error(`Skill '${skillName}' not found in registry`);
  }

  // Build prompt from context
  const prompt = buildPromptFromContext(skillName, context);

  // Call Anthropic API with skill
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'skills-2025-10-02',
      'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }],
      skills: [{
        type: 'custom',
        custom_skill_id: skillId
      }]
    })
  });

  const data = await response.json();
  return parseSkillResponse(data);
}

function buildPromptFromContext(skillName: string, context: Record<string, any>): string {
  // Build skill-specific prompts
  switch (skillName) {
    case 'starting-line-mastery':
      return buildStartingLinePrompt(context);
    case 'upwind-strategic-positioning':
      return buildUpwindStrategyPrompt(context);
    case 'upwind-tactical-combat':
      return buildTacticalCombatPrompt(context);
    case 'downwind-speed-and-position':
      return buildDownwindPrompt(context);
    case 'mark-rounding-execution':
      return buildMarkRoundingPrompt(context);
    default:
      return JSON.stringify(context);
  }
}

// Skill-specific prompt builders
function buildStartingLinePrompt(context: {
  lineBias?: number;
  windPattern?: 'oscillating' | 'persistent' | 'mixed';
  fleetSize?: number;
  strategicSide?: 'left' | 'right' | 'middle';
  timeToStart?: number;
  currentConditions?: any;
}): string {
  return `Analyze this starting line situation and provide start strategy:

Line Bias: ${context.lineBias || 'unknown'}° (positive = pin favored)
Wind Pattern: ${context.windPattern || 'unknown'}
Fleet Size: ${context.fleetSize || 'unknown'}
Strategic Side: ${context.strategicSide || 'unknown'}
Time to Start: ${context.timeToStart || 'unknown'} minutes
Current: ${JSON.stringify(context.currentConditions || {})}

Provide:
1. Which end to favor and why
2. Timing strategy (when to enter starting area)
3. Speed control approach
4. Space defense tactics
5. Contingency plans

Format as actionable bullet points with specific angles, times, and positions.`;
}

function buildUpwindStrategyPrompt(context: {
  windData?: any[];
  compassReadings?: { starboard: number[]; port: number[] };
  position?: 'leading' | 'mid-pack' | 'trailing';
  currentLeg?: 'first-beat' | 'final-beat';
}): string {
  return `Analyze this upwind strategic situation:

Wind Data: ${JSON.stringify(context.windData || [])}
Compass Readings: ${JSON.stringify(context.compassReadings || {})}
Position: ${context.position || 'unknown'}
Current Leg: ${context.currentLeg || 'unknown'}

Provide:
1. Wind pattern identification (oscillating/persistent/mixed)
2. Which side is favored and confidence level
3. Tacking strategy (tack on X° header)
4. Risk management (how far to commit)
5. Course position (middle vs. sides)

Include specific compass numbers and decision triggers.`;
}

function buildTacticalCombatPrompt(context: {
  position?: 'leading' | 'mid-pack' | 'trailing';
  nearbyBoats?: Array<{ distance: number; bearing: number; relative: 'ahead' | 'behind' }>;
  lateralSeparation?: number;
  expectedShift?: { direction: 'left' | 'right'; magnitude: number; confidence: number };
}): string {
  return `Analyze this tactical situation:

Your Position: ${context.position || 'unknown'}
Nearby Boats: ${JSON.stringify(context.nearbyBoats || [])}
Lateral Separation: ${context.lateralSeparation || 'unknown'} feet
Expected Shift: ${JSON.stringify(context.expectedShift || {})}

Provide:
1. Covering vs. splitting decision
2. Leverage calculation and gain/loss estimate
3. Tactical weapon selection (safe leeward, tack to cover, etc.)
4. Tacking duel guidance
5. When to abandon tactical battle for strategy

Include specific distances, times, and decision triggers.`;
}

function buildDownwindPrompt(context: {
  legType?: 'reach' | 'run';
  windConditions?: { speed: number; puffs: boolean; shifts: boolean };
  position?: 'leading' | 'mid-pack' | 'trailing';
  trafficDensity?: 'heavy' | 'moderate' | 'light';
}): string {
  return `Analyze this downwind situation:

Leg Type: ${context.legType || 'unknown'}
Wind: ${JSON.stringify(context.windConditions || {})}
Position: ${context.position || 'unknown'}
Traffic: ${context.trafficDensity || 'unknown'}

Provide:
1. Rhumb line vs. deviation strategy
2. Puff/lull management (angles to sail)
3. Jibing strategy (when and where)
4. VMG angle optimization
5. Tactical positioning

Include specific angles, distances, and timing.`;
}

function buildMarkRoundingPrompt(context: {
  markType?: 'windward' | 'leeward' | 'jibe' | 'finish';
  distanceToMark?: number;
  boatsNearby?: number;
  insideOverlap?: boolean;
  position?: 'leading' | 'mid-pack' | 'trailing';
}): string {
  return `Analyze this mark rounding approach:

Mark Type: ${context.markType || 'unknown'}
Distance: ${context.distanceToMark || 'unknown'} boat lengths
Boats Nearby: ${context.boatsNearby || 'unknown'}
Inside Overlap: ${context.insideOverlap ? 'YES' : 'NO'}
Position: ${context.position || 'unknown'}

Provide:
1. Wide-and-close execution plan
2. Inside vs. outside positioning strategy
3. Mark room considerations
4. Entry and exit angles
5. Speed preservation techniques

Include specific turning radius, entry width, and positioning.`;
}

function parseSkillResponse(apiResponse: any): any {
  // Extract content from Claude response
  const content = apiResponse.content?.[0]?.text || '';

  // Try to parse as JSON if structured
  try {
    return JSON.parse(content);
  } catch {
    // Return as text if not JSON
    return { advice: content };
  }
}
```

---

## Step 2: Create Race Phase Detection Hook

```typescript
// hooks/useRacePhaseDetection.ts

import { useState, useEffect } from 'react';
import type { RacePhase } from '@/services/ai/SkillManagementService';

interface RacePhaseContext {
  phase: RacePhase;
  timeInPhase: number; // seconds
  nextPhase?: RacePhase;
  timeToNextPhase?: number; // seconds
}

export function useRacePhaseDetection(raceData: {
  startTime?: Date;
  currentPosition?: { lat: number; lon: number };
  course?: any;
  marks?: any[];
}): RacePhaseContext {
  const [phase, setPhase] = useState<RacePhase>('pre-race');
  const [timeInPhase, setTimeInPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const detectedPhase = detectPhase(raceData);
      if (detectedPhase !== phase) {
        setPhase(detectedPhase);
        setTimeInPhase(0);
      } else {
        setTimeInPhase(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [raceData, phase]);

  return {
    phase,
    timeInPhase,
    nextPhase: getNextPhase(phase),
    timeToNextPhase: estimateTimeToNextPhase(phase, raceData)
  };
}

function detectPhase(raceData: any): RacePhase {
  const now = new Date();
  const startTime = raceData.startTime ? new Date(raceData.startTime) : null;

  if (!startTime) return 'pre-race';

  const minutesToStart = startTime ? (startTime.getTime() - now.getTime()) / 1000 / 60 : 999;

  // Pre-race: >10 min before start
  if (minutesToStart > 10) return 'pre-race';

  // Start sequence: 10 min to 0
  if (minutesToStart > 0) return 'start-sequence';

  // Use GPS position relative to marks to detect phase
  if (raceData.currentPosition && raceData.marks) {
    return detectPhaseFromPosition(raceData.currentPosition, raceData.marks, raceData.course);
  }

  // Default to first beat
  return 'first-beat';
}

function detectPhaseFromPosition(
  position: { lat: number; lon: number },
  marks: any[],
  course: any
): RacePhase {
  // Calculate distance to each mark
  // Determine which leg we're on based on nearest marks
  // This is simplified - real implementation would be more sophisticated

  const weatherMark = marks.find(m => m.type === 'windward');
  const leewardMark = marks.find(m => m.type === 'leeward');

  if (!weatherMark || !leewardMark) return 'first-beat';

  const distToWeather = calculateDistance(position, weatherMark.coordinates);
  const distToLeeward = calculateDistance(position, leewardMark.coordinates);

  // Within 3 boat lengths of a mark
  if (distToWeather < 30) return 'weather-mark';
  if (distToLeeward < 30) return 'leeward-mark';

  // Determine if going upwind or downwind based on bearing
  // Simplified logic here
  if (distToWeather < distToLeeward) {
    return 'first-beat';
  } else {
    return 'reaching'; // or 'running' based on angle
  }
}

function calculateDistance(p1: { lat: number; lon: number }, p2: { lat: number; lon: number }): number {
  // Haversine formula - simplified
  const R = 6371e3; // Earth radius in meters
  const φ1 = p1.lat * Math.PI / 180;
  const φ2 = p2.lat * Math.PI / 180;
  const Δφ = (p2.lat - p1.lat) * Math.PI / 180;
  const Δλ = (p2.lon - p1.lon) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function getNextPhase(current: RacePhase): RacePhase | undefined {
  const sequence: RacePhase[] = [
    'pre-race',
    'start-sequence',
    'first-beat',
    'weather-mark',
    'reaching',
    'leeward-mark',
    'final-beat',
    'finish'
  ];

  const currentIndex = sequence.indexOf(current);
  return sequence[currentIndex + 1];
}

function estimateTimeToNextPhase(phase: RacePhase, raceData: any): number | undefined {
  // Simplified estimation
  // Real implementation would use GPS, course layout, and boat speed
  return undefined;
}
```

---

## Step 3: Create Context-Aware AI Coach Component

```typescript
// components/coaching/ContextualAICoach.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Animated } from 'react-native';
import { Sparkles, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { useRacePhaseDetection } from '@/hooks/useRacePhaseDetection';
import {
  getPrimarySkillForPhase,
  invokeSkillWithContext,
  type RacePhase
} from '@/services/ai/SkillManagementService';

interface ContextualAICoachProps {
  raceData: {
    startTime?: Date;
    currentPosition?: { lat: number; lon: number };
    course?: any;
    marks?: any[];
    lineBias?: number;
    windData?: any;
    fleetSize?: number;
  };
  onAdviceReceived?: (advice: any) => void;
}

export function ContextualAICoach({ raceData, onAdviceReceived }: ContextualAICoachProps) {
  const { phase, timeInPhase } = useRacePhaseDetection(raceData);
  const [advice, setAdvice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Auto-trigger AI coach on phase change
  useEffect(() => {
    if (!dismissed) {
      handlePhaseChange(phase);
    }
  }, [phase]);

  const handlePhaseChange = async (newPhase: RacePhase) => {
    // Get primary skill for this phase
    const skillName = getPrimarySkillForPhase(newPhase);

    // Build context from race data
    const context = buildContextForPhase(newPhase, raceData);

    // Invoke skill
    setLoading(true);
    try {
      const result = await invokeSkillWithContext(skillName, context);
      setAdvice(result);
      setExpanded(true); // Auto-expand on new advice
      setDismissed(false);
      onAdviceReceived?.(result);
    } catch (error) {
      console.error('Failed to get AI advice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setDismissed(false);
    handlePhaseChange(phase);
  };

  if (dismissed) {
    // Show minimal "Ask AI Coach" button when dismissed
    return (
      <Pressable
        onPress={handleManualRefresh}
        className="flex-row items-center gap-2 bg-purple-100 px-4 py-2 rounded-full"
      >
        <Sparkles size={20} color="#9333ea" />
        <Text className="text-purple-900 font-medium">Ask AI Coach</Text>
      </Pressable>
    );
  }

  return (
    <View className="bg-white border border-purple-200 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-2">
          <Sparkles size={24} color="#9333ea" />
          <View>
            <Text className="text-sm font-semibold text-purple-900">
              AI Race Coach
            </Text>
            <Text className="text-xs text-gray-600">
              {getPhaseLabel(phase)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {loading && <ActivityIndicator size="small" color="#9333ea" />}
          <Pressable onPress={() => setDismissed(true)}>
            <X size={20} color="#6b7280" />
          </Pressable>
          {expanded ? (
            <ChevronUp size={20} color="#6b7280" />
          ) : (
            <ChevronDown size={20} color="#6b7280" />
          )}
        </View>
      </Pressable>

      {/* Expanded Content */}
      {expanded && advice && (
        <View className="mt-4 space-y-3">
          {/* Quick Summary */}
          <View className="bg-purple-50 p-3 rounded-lg">
            <Text className="text-sm font-medium text-purple-900 mb-1">
              Quick Take
            </Text>
            <Text className="text-sm text-gray-700">
              {advice.summary || advice.advice}
            </Text>
          </View>

          {/* Action Items */}
          {advice.actionItems && (
            <View>
              <Text className="text-sm font-medium text-gray-900 mb-2">
                Action Items
              </Text>
              {advice.actionItems.map((item: string, i: number) => (
                <View key={i} className="flex-row items-start gap-2 mb-2">
                  <Text className="text-purple-600 font-bold">•</Text>
                  <Text className="text-sm text-gray-700 flex-1">{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Timing/Numbers */}
          {advice.metrics && (
            <View className="bg-gray-50 p-3 rounded-lg">
              <Text className="text-sm font-medium text-gray-900 mb-2">
                Key Numbers
              </Text>
              {Object.entries(advice.metrics).map(([key, value]) => (
                <View key={key} className="flex-row justify-between mb-1">
                  <Text className="text-xs text-gray-600">{key}</Text>
                  <Text className="text-xs font-mono text-gray-900">{value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Refresh Button */}
          <Pressable
            onPress={handleManualRefresh}
            className="bg-purple-600 py-2 rounded-lg"
          >
            <Text className="text-white text-center font-medium">
              Refresh Advice
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function buildContextForPhase(phase: RacePhase, raceData: any): Record<string, any> {
  switch (phase) {
    case 'pre-race':
    case 'start-sequence':
      return {
        lineBias: raceData.lineBias,
        windPattern: detectWindPattern(raceData.windData),
        fleetSize: raceData.fleetSize,
        strategicSide: determineStrategicSide(raceData.windData),
        timeToStart: calculateTimeToStart(raceData.startTime),
        currentConditions: raceData.current
      };

    case 'first-beat':
    case 'final-beat':
      return {
        windData: raceData.windData,
        compassReadings: raceData.compassReadings,
        position: estimatePosition(raceData),
        currentLeg: phase
      };

    case 'weather-mark':
    case 'leeward-mark':
      return {
        markType: phase === 'weather-mark' ? 'windward' : 'leeward',
        distanceToMark: calculateDistanceToNearestMark(raceData),
        boatsNearby: estimateNearbyBoats(raceData),
        position: estimatePosition(raceData)
      };

    case 'reaching':
    case 'running':
      return {
        legType: phase === 'reaching' ? 'reach' : 'run',
        windConditions: raceData.windData,
        position: estimatePosition(raceData),
        trafficDensity: estimateTrafficDensity(raceData)
      };

    default:
      return {};
  }
}

function getPhaseLabel(phase: RacePhase): string {
  const labels: Record<RacePhase, string> = {
    'pre-race': 'Pre-Race Strategy',
    'start-sequence': 'Starting Tactics',
    'first-beat': 'First Beat Strategy',
    'weather-mark': 'Weather Mark Approach',
    'reaching': 'Reaching Tactics',
    'running': 'Running Strategy',
    'leeward-mark': 'Leeward Mark Approach',
    'final-beat': 'Final Beat Tactics',
    'finish': 'Finish Line Strategy'
  };
  return labels[phase];
}

// Helper functions (simplified)
function detectWindPattern(windData: any): 'oscillating' | 'persistent' | 'mixed' {
  // Analyze wind data to detect pattern
  return 'oscillating'; // Simplified
}

function determineStrategicSide(windData: any): 'left' | 'right' | 'middle' {
  return 'middle'; // Simplified
}

function calculateTimeToStart(startTime?: Date): number {
  if (!startTime) return 0;
  return Math.max(0, (new Date(startTime).getTime() - Date.now()) / 1000 / 60);
}

function estimatePosition(raceData: any): 'leading' | 'mid-pack' | 'trailing' {
  return 'mid-pack'; // Simplified
}

function calculateDistanceToNearestMark(raceData: any): number {
  return 5; // boat lengths, simplified
}

function estimateNearbyBoats(raceData: any): number {
  return 3; // Simplified
}

function estimateTrafficDensity(raceData: any): 'heavy' | 'moderate' | 'light' {
  return 'moderate'; // Simplified
}
```

---

## Step 4: Integration into Existing Components

### A. Add to Race Entry (Pre-Race Planning)

```typescript
// components/races/ComprehensiveRaceEntry.tsx

import { ContextualAICoach } from '@/components/coaching/ContextualAICoach';

export function ComprehensiveRaceEntry(props) {
  // ... existing code ...

  const [aiCoachEnabled, setAiCoachEnabled] = useState(true);

  return (
    <ScrollView>
      {/* ... existing race entry form ... */}

      {/* AI Coach Section */}
      {aiCoachEnabled && (
        <View className="mb-6">
          <ContextualAICoach
            raceData={{
              startTime: formData.date_time,
              lineBias: estimateLineBias(),
              fleetSize: formData.fleet_size,
              windData: weatherData,
              course: formData.course,
              marks: formData.marks
            }}
            onAdviceReceived={(advice) => {
              // Optionally pre-fill strategy notes
              setFormData(prev => ({
                ...prev,
                strategy_notes: advice.summary
              }));
            }}
          />
        </View>
      )}

      {/* ... rest of form ... */}
    </ScrollView>
  );
}
```

### B. Add to Live Race Interface

```typescript
// components/racing/LiveRaceCoach.tsx

import React, { useState } from 'react';
import { View } from 'react-native';
import { ContextualAICoach } from '@/components/coaching/ContextualAICoach';
import { useGPS } from '@/hooks/useGPS';

interface LiveRaceCoachProps {
  raceId: string;
  raceData: any;
}

export function LiveRaceCoach({ raceId, raceData }: LiveRaceCoachProps) {
  const { position } = useGPS();

  return (
    <View className="absolute bottom-0 left-0 right-0 p-4">
      <ContextualAICoach
        raceData={{
          ...raceData,
          currentPosition: position
        }}
      />
    </View>
  );
}
```

### C. Add Quick-Access Skill Buttons

```typescript
// components/coaching/QuickSkillButtons.tsx

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { invokeSkillWithContext } from '@/services/ai/SkillManagementService';

const QUICK_SKILLS = [
  {
    id: 'starting-line-mastery',
    label: 'Start Strategy',
    icon: '🏁',
    color: '#10b981'
  },
  {
    id: 'upwind-tactical-combat',
    label: 'Upwind Tactics',
    icon: '⛵',
    color: '#3b82f6'
  },
  {
    id: 'mark-rounding-execution',
    label: 'Mark Rounding',
    icon: '🎯',
    color: '#f59e0b'
  },
  {
    id: 'downwind-speed-and-position',
    label: 'Downwind',
    icon: '🌊',
    color: '#8b5cf6'
  }
];

export function QuickSkillButtons({ raceData, onAdvice }: any) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSkillPress = async (skillId: string) => {
    setLoading(skillId);
    try {
      const context = buildQuickContext(skillId, raceData);
      const advice = await invokeSkillWithContext(skillId, context);
      onAdvice(advice);
    } finally {
      setLoading(null);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="flex-row gap-2 py-2"
    >
      {QUICK_SKILLS.map(skill => (
        <Pressable
          key={skill.id}
          onPress={() => handleSkillPress(skill.id)}
          disabled={loading === skill.id}
          className="bg-white border-2 rounded-xl px-4 py-3 min-w-[120px]"
          style={{ borderColor: skill.color }}
        >
          <Text className="text-2xl text-center mb-1">{skill.icon}</Text>
          <Text className="text-xs font-medium text-center text-gray-900">
            {skill.label}
          </Text>
          {loading === skill.id && (
            <ActivityIndicator size="small" color={skill.color} />
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}

function buildQuickContext(skillId: string, raceData: any) {
  // Return minimal context for quick invocation
  return {
    quickQuery: true,
    currentPhase: raceData.phase,
    timestamp: new Date().toISOString()
  };
}
```

---

## Step 5: Create Glanceable Advice Cards

```typescript
// components/coaching/GlanceableAdviceCard.tsx

import React from 'react';
import { View, Text } from 'react-native';

interface GlanceableAdviceCardProps {
  type: 'start' | 'upwind' | 'downwind' | 'mark';
  advice: {
    primary: string; // One-sentence action
    metrics?: Record<string, string>; // Key numbers
    confidence?: 'high' | 'medium' | 'low';
  };
}

export function GlanceableAdviceCard({ type, advice }: GlanceableAdviceCardProps) {
  const colors = {
    start: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-900' },
    upwind: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900' },
    downwind: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-900' },
    mark: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-900' }
  };

  const style = colors[type];

  return (
    <View className={`${style.bg} border-l-4 ${style.border} p-3 rounded-r-lg`}>
      <Text className={`font-semibold ${style.text} mb-2`}>
        {advice.primary}
      </Text>

      {advice.metrics && (
        <View className="flex-row flex-wrap gap-3">
          {Object.entries(advice.metrics).map(([key, value]) => (
            <View key={key} className="flex-row items-baseline gap-1">
              <Text className="text-xs text-gray-600">{key}:</Text>
              <Text className="text-sm font-mono font-bold text-gray-900">{value}</Text>
            </View>
          ))}
        </View>
      )}

      {advice.confidence && (
        <View className="mt-2">
          <ConfidenceBadge level={advice.confidence} />
        </View>
      )}
    </View>
  );
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: { bg: 'bg-green-100', text: 'text-green-800' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    low: { bg: 'bg-gray-100', text: 'text-gray-800' }
  };

  const style = styles[level];

  return (
    <View className={`${style.bg} px-2 py-1 rounded self-start`}>
      <Text className={`text-xs font-medium ${style.text}`}>
        {level.toUpperCase()} CONFIDENCE
      </Text>
    </View>
  );
}
```

---

## Step 6: Usage Examples

### Example 1: Pre-Race Strategy Screen

```typescript
// app/race/prepare/[id].tsx

import { ContextualAICoach } from '@/components/coaching/ContextualAICoach';
import { QuickSkillButtons } from '@/components/coaching/QuickSkillButtons';

export default function RacePreparationScreen({ route }) {
  const { raceId } = route.params;
  const [race, setRace] = useState(null);
  const [advice, setAdvice] = useState(null);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Race Details */}
      <View className="bg-white p-4">
        <Text className="text-2xl font-bold">{race?.name}</Text>
        {/* ... race details ... */}
      </View>

      {/* Quick Skill Buttons */}
      <View className="px-4 py-2">
        <QuickSkillButtons
          raceData={race}
          onAdvice={setAdvice}
        />
      </View>

      {/* AI Coach */}
      <View className="px-4 py-2">
        <ContextualAICoach
          raceData={race}
          onAdviceReceived={setAdvice}
        />
      </View>

      {/* Strategy Notes */}
      <View className="bg-white p-4 mx-4 rounded-xl">
        <Text className="font-semibold mb-2">Strategy Notes</Text>
        <TextInput
          multiline
          value={advice?.summary}
          className="border border-gray-300 rounded p-2 min-h-[100px]"
        />
      </View>
    </ScrollView>
  );
}
```

### Example 2: Live Race with Floating Coach

```typescript
// app/race/live/[id].tsx

import { LiveRaceCoach } from '@/components/racing/LiveRaceCoach';
import { GlanceableAdviceCard } from '@/components/coaching/GlanceableAdviceCard';

export default function LiveRaceScreen({ route }) {
  const { raceId } = route.params;
  const [minimized, setMinimized] = useState(false);

  return (
    <View className="flex-1">
      {/* Map View */}
      <TacticalRaceMap raceId={raceId} />

      {/* Floating AI Coach */}
      {minimized ? (
        <View className="absolute bottom-4 right-4">
          <Pressable
            onPress={() => setMinimized(false)}
            className="bg-purple-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
          >
            <Sparkles size={24} color="white" />
          </Pressable>
        </View>
      ) : (
        <View className="absolute bottom-0 left-0 right-0 p-4">
          <LiveRaceCoach raceId={raceId} raceData={race} />
        </View>
      )}
    </View>
  );
}
```

---

## Best Practices

### 1. **Performance**
- Cache skill responses for 30-60 seconds
- Use debouncing for frequent updates
- Lazy load AI coach component
- Minimize API calls during live racing

### 2. **UX Patterns**
- **Auto-show on phase change** but allow dismissal
- **Glanceable first**, expandable for details
- **Bottom sheet** for detailed advice
- **Floating button** during live racing
- **Haptic feedback** for critical advice

### 3. **Error Handling**
```typescript
try {
  const advice = await invokeSkillWithContext(skillName, context);
  setAdvice(advice);
} catch (error) {
  // Graceful degradation
  setAdvice({
    primary: 'AI Coach temporarily unavailable',
    fallback: true
  });
  logError('Skill invocation failed', error);
}
```

### 4. **Offline Support**
- Cache last advice for each phase
- Show "Using cached advice" indicator
- Queue skill requests for later

### 5. **Accessibility**
- Screen reader support for all advice
- High contrast mode for glanceable cards
- Voice output option for hands-free coaching

---

## Summary

The integration creates a **context-aware AI coaching system** that:

1. ✅ **Detects race phase automatically** (pre-race → start → beats → marks → finish)
2. ✅ **Selects appropriate skill** based on current phase
3. ✅ **Invokes skill with rich context** from race data, GPS, weather, etc.
4. ✅ **Presents actionable advice** in glanceable, expandable UI
5. ✅ **Allows manual skill invocation** via quick-access buttons
6. ✅ **Works in pre-race planning** and **live race** scenarios

Users get the right tactical advice at the right moment, formatted for quick consumption during the intensity of racing! 🏆
