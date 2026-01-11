/**
 * Start Procedure Panel
 * Shows detailed information about the starting sequence with flag graphics
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Platform, TouchableOpacity, ScrollView, LayoutChangeEvent } from 'react-native';
import Svg, { Line, Rect, G, Circle, Path, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import type { SequenceStep, FlagState } from '../data/startSequenceData';

// Flag definitions with colors and patterns
const FLAG_DEFINITIONS: Record<string, { color: string; pattern?: string; name: string; description: string }> = {
  orange: { color: '#FF6B00', name: 'Orange', description: 'RC on Station' },
  class: { color: '#CC0000', pattern: 'diagonal', name: 'Class Flag', description: 'Warning Signal' },
  p: { color: '#0066CC', pattern: 'whiteCenter', name: 'P Flag', description: 'Standard preparatory. Return behind line if OCS.' },
  i: { color: '#FFCC00', name: 'I Flag (Round-an-End)', description: 'Rule 30.1: If OCS in last minute, sail around an end to restart.' },
  z: { color: '#FF3366', pattern: 'cross', name: 'Z Flag (20% Penalty)', description: 'Rule 30.2: OCS in last minute = 20% scoring penalty.' },
  black: { color: '#000000', name: 'Black Flag', description: 'Rule 30.4: OCS in last minute = immediate DSQ.' },
  u: { color: '#FF0000', pattern: 'uFlag', name: 'U Flag', description: 'Rule 30.3: Black flag with general recall protection.' },
};

// Recall flags
const RECALL_FLAGS = [
  { id: 'x', name: 'X Flag', color: '#FFFFFF', pattern: 'xFlag', title: 'Individual Recall', description: 'One sound. Boats OCS must return and restart correctly.' },
  { id: 'first-sub', name: 'First Substitute', color: '#FFCC00', pattern: 'triangle', title: 'General Recall', description: 'Two sounds. Start is void, sequence restarts.' },
];

interface FlagGraphicProps {
  flagId: string;
  isUp: boolean;
  size?: number;
}

function FlagGraphic({ flagId, isUp, size = 24 }: FlagGraphicProps) {
  const flag = FLAG_DEFINITIONS[flagId];
  if (!flag || !isUp) return null;

  const width = size;
  const height = size * 0.7;

  return (
    <Svg width={width} height={height} viewBox="0 0 30 21">
      <Rect x="0" y="0" width="30" height="21" fill={flag.color} stroke="#000" strokeWidth="0.5" />
      {flag.pattern === 'diagonal' && (
        <Path d="M 0,0 L 30,21" stroke="#FFFFFF" strokeWidth="8" />
      )}
      {flag.pattern === 'whiteCenter' && (
        <Rect x="8" y="5" width="14" height="11" fill="#FFFFFF" />
      )}
      {flag.pattern === 'cross' && (
        <>
          <Path d="M 0,10.5 L 30,10.5" stroke="#FFFFFF" strokeWidth="4" />
          <Path d="M 15,0 L 15,21" stroke="#FFFFFF" strokeWidth="4" />
        </>
      )}
    </Svg>
  );
}

interface MastGraphicProps {
  visualState: FlagState;
}

function MastGraphic({ visualState }: MastGraphicProps) {
  const flagsToShow = Object.entries(visualState).filter(([_, v]) => v === 'UP');
  
  return (
    <View style={styles.mastContainer}>
      <Svg width="48" height="80" viewBox="0 0 48 80">
        {/* Mast */}
        <Line x1="24" y1="8" x2="24" y2="72" stroke="#1E293B" strokeWidth="2" />
        {/* Yardarm */}
        <Line x1="8" y1="20" x2="40" y2="20" stroke="#1E293B" strokeWidth="2" />
        
        {/* Flags on mast */}
        {flagsToShow.map(([flagId], index) => {
          const flag = FLAG_DEFINITIONS[flagId];
          if (!flag) return null;
          
          const yPos = 25 + (index * 15);
          return (
            <G key={flagId}>
              <Rect 
                x="26" 
                y={yPos} 
                width="16" 
                height="12" 
                fill={flag.color} 
                stroke="#000" 
                strokeWidth="0.5" 
              />
              {flag.pattern === 'diagonal' && (
                <Path d={`M 26,${yPos} L 42,${yPos + 12}`} stroke="#FFFFFF" strokeWidth="4" />
              )}
              {flag.pattern === 'whiteCenter' && (
                <Rect x="30" y={yPos + 3} width="8" height="6" fill="#FFFFFF" />
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

interface SoundSignalProps {
  signal: string;
}

function SoundSignal({ signal }: SoundSignalProps) {
  if (!signal || signal === 'None') return null;
  
  const isLong = signal.includes('long');
  const soundCount = (signal.match(/sound/gi) || []).length;
  
  return (
    <View style={styles.soundSignalContainer}>
      {isLong ? (
        <View style={styles.longSound} />
      ) : (
        Array(soundCount).fill(0).map((_, i) => (
          <View key={i} style={styles.shortSound} />
        ))
      )}
      <Text style={styles.soundSignalText}>{signal}</Text>
    </View>
  );
}

interface StartProcedurePanelProps {
  currentTime: number;
  processedSequence: SequenceStep[];
  selectedPrepFlagId: 'p' | 'i' | 'z' | 'black' | 'u';
  onPrepFlagChange: (flagId: 'p' | 'i' | 'z' | 'black' | 'u') => void;
  explanation: string;
  onTimeChange?: (time: number) => void;
}

export function StartProcedurePanel({
  currentTime,
  processedSequence,
  selectedPrepFlagId,
  onPrepFlagChange,
  explanation,
  onTimeChange,
}: StartProcedurePanelProps) {
  // Ref for the ScrollView to enable programmatic scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Track step positions for auto-scrolling
  const stepPositionsRef = useRef<{ [key: number]: number }>({});
  const lastActiveTimeRef = useRef<number | null>(null);
  
  // Filter to show only main sequence steps (with labels)
  const mainSteps = processedSequence.filter(step => 
    step.label && 
    ['RC on Station', 'Warning Signal', 'Preparatory Signal', 'One Minute Signal', 'Start Signal'].includes(step.label)
  );
  
  // Find active step - the most recent step that has occurred
  const activeStep = [...mainSteps].reverse().find(step => step.time <= currentTime) || mainSteps[0];
  
  // Find the active step index for scrolling
  const activeStepIndex = mainSteps.findIndex(step => step.time === activeStep?.time);

  // Auto-scroll to active step when it changes
  useEffect(() => {
    if (activeStep && activeStep.time !== lastActiveTimeRef.current) {
      lastActiveTimeRef.current = activeStep.time;
      
      // Get the position of the active step
      const position = stepPositionsRef.current[activeStep.time];
      
      if (position !== undefined && scrollViewRef.current) {
        // Scroll to center the active step in the view
        // Account for some padding at the top
        const scrollPosition = Math.max(0, position - 20);
        scrollViewRef.current.scrollTo({ 
          y: scrollPosition, 
          animated: true 
        });
      }
    }
  }, [activeStep]);

  // Callback to track step layout positions
  const handleStepLayout = useCallback((stepTime: number, event: LayoutChangeEvent) => {
    const { y } = event.nativeEvent.layout;
    stepPositionsRef.current[stepTime] = y;
  }, []);

  const formatTime = (seconds: number) => {
    // Guard against NaN or undefined
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '-0:00';
    }
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const secs = Math.floor(absSeconds % 60);
    return `${seconds < 0 ? '-' : ''}${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start Procedure</Text>
      
      {/* Current Time Display */}
      <View style={styles.timeDisplay}>
        <Text style={styles.timeLabel}>Time to Start:</Text>
        <Text style={[
          styles.timeValue,
          currentTime >= 0 && styles.timeValuePositive,
          currentTime < -240 && styles.timeValueEarly,
        ]}>
          {formatTime(currentTime)}
        </Text>
      </View>

      {/* Preparatory Flag Selector */}
      <View style={styles.flagSelectorSection}>
        <Text style={styles.sectionTitle}>Preparatory Flag Options</Text>
        <Text style={styles.sectionSubtitle}>Select different flags to see their rules:</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flagSelector}>
          {(['p', 'i', 'z', 'black'] as const).map((flagId) => {
            const flag = FLAG_DEFINITIONS[flagId];
            const isSelected = selectedPrepFlagId === flagId;
            return (
              <TouchableOpacity
                key={flagId}
                style={[
                  styles.flagOption,
                  isSelected && styles.flagOptionSelected,
                ]}
                onPress={() => onPrepFlagChange(flagId)}
              >
                <FlagGraphic flagId={flagId} isUp={true} size={28} />
                <Text style={[
                  styles.flagOptionText,
                  isSelected && styles.flagOptionTextSelected,
                ]}>
                  {flag.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {/* Selected Flag Description */}
        <View style={styles.selectedFlagInfo}>
          <Text style={styles.selectedFlagName}>
            {FLAG_DEFINITIONS[selectedPrepFlagId]?.name}
          </Text>
          <Text style={styles.selectedFlagDesc}>
            {FLAG_DEFINITIONS[selectedPrepFlagId]?.description}
          </Text>
        </View>
      </View>

      {/* Sequence Steps - Scrollable */}
      <View style={styles.sequenceSection}>
        <Text style={styles.sectionTitle}>Sequence Timeline</Text>
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.sequenceScroll} 
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          {mainSteps.map((step, index) => {
            const isActive = activeStep && step.time === activeStep.time;
            const isPast = step.time < currentTime;
            
            return (
              <TouchableOpacity
                key={step.time}
                style={[
                  styles.stepCard,
                  isActive && styles.stepCardActive,
                  isPast && !isActive && styles.stepCardPast,
                ]}
                onPress={() => onTimeChange?.(step.time)}
                onLayout={(event) => handleStepLayout(step.time, event)}
              >
                <View style={styles.stepHeader}>
                  <MastGraphic visualState={step.visualState} />
                  <View style={styles.stepInfo}>
                    <View style={styles.stepTitleRow}>
                      <Text style={[
                        styles.stepLabel,
                        isActive && styles.stepLabelActive,
                      ]}>
                        {step.label}
                      </Text>
                      <Text style={[
                        styles.stepTime,
                        isActive && styles.stepTimeActive,
                      ]}>
                        {formatTime(step.time)}
                      </Text>
                    </View>
                    <SoundSignal signal={step.soundSignal} />
                    {isActive && (
                      <Text style={styles.stepDescription} numberOfLines={2}>
                        {step.description}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Recall Flags Section */}
      <View style={styles.recallSection}>
        <Text style={styles.sectionTitle}>Recall Signals</Text>
        
        {RECALL_FLAGS.map((flag) => (
          <View key={flag.id} style={styles.recallCard}>
            <View style={[styles.recallFlagIcon, { backgroundColor: flag.color }]}>
              {flag.pattern === 'xFlag' && (
                <Text style={styles.recallFlagX}>✕</Text>
              )}
              {flag.pattern === 'triangle' && (
                <Text style={styles.recallFlagTriangle}>▲</Text>
              )}
            </View>
            <View style={styles.recallInfo}>
              <Text style={styles.recallTitle}>{flag.title}</Text>
              <Text style={styles.recallDesc}>{flag.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 58, 95, 0.9)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(0, 30, 60, 0.25)' }
      : {
          shadowColor: '#0A1929',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        }),
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94C5E8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  timeValuePositive: {
    color: '#22C55E',
  },
  timeValueEarly: {
    color: '#94C5E8',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#4A6A8A',
    marginBottom: 8,
  },
  flagSelectorSection: {
    marginBottom: 16,
  },
  flagSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  flagOption: {
    alignItems: 'center',
    padding: 6,
    marginRight: 6,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(100, 150, 200, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    minWidth: 60,
  },
  flagOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(239, 246, 255, 0.9)',
  },
  flagOptionText: {
    fontSize: 10,
    color: '#4A6A8A',
    marginTop: 3,
    fontWeight: '600',
  },
  flagOptionTextSelected: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  selectedFlagInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 150, 200, 0.3)',
  },
  selectedFlagName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 3,
  },
  selectedFlagDesc: {
    fontSize: 12,
    color: '#4A6A8A',
    lineHeight: 16,
  },
  sequenceSection: {
    marginBottom: 12,
    flex: 1,
  },
  sequenceScroll: {
    maxHeight: 220,
  },
  stepCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    padding: 8,
    marginTop: 5,
    borderWidth: 2,
    borderColor: 'transparent',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(100, 150, 200, 0.5)',
  },
  stepCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(239, 246, 255, 0.9)',
    borderLeftColor: '#3B82F6',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(59, 130, 246, 0.25)' }
      : {
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 3,
        }),
  },
  stepCardPast: {
    opacity: 0.6,
    borderLeftColor: 'rgba(100, 150, 200, 0.3)',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mastContainer: {
    marginRight: 8,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  stepLabelActive: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  stepTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A6A8A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stepTimeActive: {
    color: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  stepDescription: {
    fontSize: 11,
    color: '#4A6A8A',
    marginTop: 4,
    lineHeight: 15,
  },
  soundSignalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  longSound: {
    width: 14,
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  shortSound: {
    width: 5,
    height: 5,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  soundSignalText: {
    fontSize: 10,
    color: '#4A6A8A',
    marginLeft: 4,
  },
  recallSection: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.15)',
  },
  recallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 6,
    padding: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: 'rgba(100, 150, 200, 0.25)',
  },
  recallFlagIcon: {
    width: 28,
    height: 20,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E3A5F',
    marginRight: 8,
  },
  recallFlagX: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  recallFlagTriangle: {
    fontSize: 12,
    color: '#1E3A5F',
  },
  recallInfo: {
    flex: 1,
  },
  recallTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  recallDesc: {
    fontSize: 10,
    color: '#4A6A8A',
    marginTop: 1,
  },
});

