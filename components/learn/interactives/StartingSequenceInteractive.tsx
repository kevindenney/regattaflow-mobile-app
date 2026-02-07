/**
 * Starting Sequence Interactive Component
 * React Native version ported from BetterAt Sail Racing
 * 
 * Converts:
 * - framer-motion → react-native-reanimated
 * - SVG → react-native-svg
 * - Web Audio API → expo-av
 */

import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, Marker, Path, Pattern, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import type { FlagState, SequenceStep } from './data/startSequenceData';
import { PREPARATORY_FLAG_OPTIONS as PREP_FLAGS, RACING_SEQUENCE_STEPS, STARTING_SEQUENCE_QUIZ } from './data/startSequenceData';
import { CustomTimelineSlider, PowerboatSVG, StartProcedurePanel, TopDownSailboatSVG } from './shared';

// Note: AnimatedG removed to avoid crashes on Android New Architecture
// Using state-driven transforms instead

// Quiz state interface
interface QuizAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SVG_WIDTH = Math.min(800, SCREEN_WIDTH - 32);
const SVG_HEIGHT = 450;
const TIME_SCALE = 20; // Timeline seconds per real second

interface StartingSequenceInteractiveProps {
  processedSequenceEvents?: SequenceStep[];
  onTimeUpdate?: (time: number) => void;
  onComplete?: () => void;
}

export function StartingSequenceInteractive({
  processedSequenceEvents = RACING_SEQUENCE_STEPS,
  onTimeUpdate,
  onComplete,
}: StartingSequenceInteractiveProps) {
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [time, setTime] = useState(-360);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flagStates, setFlagStates] = useState<FlagState>({});
  const [currentStepInfo, setCurrentStepInfo] = useState<SequenceStep | null>(null);
  const [selectedPrepFlagId, setSelectedPrepFlagId] = useState<'p' | 'i' | 'z' | 'black' | 'u'>('p');
  
  // Track boat rotations in state for sail calculation (separate from animated shared values)
  const [blueBoatRotation, setBlueBoatRotation] = useState(90);
  const [redBoatRotation, setRedBoatRotation] = useState(90);
  
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  
  // Deep Dive state
  const [showDeepDive, setShowDeepDive] = useState(false);
  
  // Completion state - track when animation finishes but don't auto-navigate
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Audio sounds
  const [sounds, setSounds] = useState<{ [key: string]: Audio.Sound | null }>({});
  
  // Web Audio API context for horn sounds (web only)
  const audioContextRef = useRef<AudioContext | null>(null);

  // Process sequence events based on selected prep flag
  const actualProcessedSequence = useMemo(() => {
    return processedSequenceEvents.map(step => {
      if (step.visualState.p !== undefined) {
        const newVisualState = { ...step.visualState };
        // Replace P flag with selected flag
        if (selectedPrepFlagId !== 'p' && step.visualState.p === 'UP') {
          newVisualState[selectedPrepFlagId] = 'UP';
        }
        return { ...step, visualState: newVisualState };
      }
      return step;
    });
  }, [processedSequenceEvents, selectedPrepFlagId]);

  // Timeline markers for the custom slider
  const timelineMarkers = [
    { value: -300, label: '5:00' },
    { value: -240, label: '4:00' },
    { value: -60, label: '1:00' },
    { value: 0, label: 'Start' },
  ];
  
  // Animation values for boats
  const blueBoatX = useSharedValue(275);
  const blueBoatY = useSharedValue(275);
  const blueBoatRotate = useSharedValue(135);
  const redBoatX = useSharedValue(500);
  const redBoatY = useSharedValue(300);
  const redBoatRotate = useSharedValue(-45);
  
  // Animation for water/wind
  const waterOffset = useSharedValue(0);
  const windOffset = useSharedValue(0);

  // State-driven transforms for boats (avoids AnimatedG crash on Android New Architecture)
  const [blueBoatTransform, setBlueBoatTransform] = useState('translate(275, 275) rotate(135, 25, 40)');
  const [redBoatTransform, setRedBoatTransform] = useState('translate(500, 300) rotate(-45, 25, 40)');

  const prevTimeRef = useRef(time);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Cleanup Web Audio API context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, []);

  // Play a single horn blast using Web Audio API (generates a foghorn-like tone)
  const playSingleHorn = useCallback((ctx: AudioContext, duration: number, startTime: number) => {
    // Create oscillators for a rich horn sound
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const oscillator3 = ctx.createOscillator();
    
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();

    // Configure filter for foghorn-like quality
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 400;
    filterNode.Q.value = 1;

    // Base frequency for foghorn (around 200-300 Hz)
    const baseFreq = 220;
    
    // Main tone
    oscillator1.type = 'sawtooth';
    oscillator1.frequency.setValueAtTime(baseFreq, startTime);
    
    // Lower harmonic
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(baseFreq / 2, startTime);
    
    // Upper harmonic for richness
    oscillator3.type = 'triangle';
    oscillator3.frequency.setValueAtTime(baseFreq * 1.5, startTime);

    // Connect oscillators through filter to gain
    oscillator1.connect(filterNode);
    oscillator2.connect(filterNode);
    oscillator3.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Volume envelope - attack, sustain, release
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.03); // Quick attack
    gainNode.gain.setValueAtTime(0.4, startTime + duration - 0.05); // Sustain
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration); // Release

    // Start and stop
    oscillator1.start(startTime);
    oscillator2.start(startTime);
    oscillator3.start(startTime);
    
    oscillator1.stop(startTime + duration);
    oscillator2.stop(startTime + duration);
    oscillator3.stop(startTime + duration);
  }, []);

  // Play horn sound - supports single blast, long blast, or series of short blasts
  const playHorn = useCallback(async (hornType: 'short' | 'long' | 'series' = 'short') => {
    if (Platform.OS !== 'web' || !audioContextRef.current) {
      return;
    }

    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      if (hornType === 'series') {
        // Series of short blasts for attention signal (3-4 short blasts)
        const blastDuration = 0.2;
        const gapDuration = 0.15;
        const numBlasts = 4;
        
        for (let i = 0; i < numBlasts; i++) {
          const startTime = now + i * (blastDuration + gapDuration);
          playSingleHorn(ctx, blastDuration, startTime);
        }
      } else if (hornType === 'long') {
        // Long blast (1.2 seconds) for 1-minute signal
        playSingleHorn(ctx, 1.2, now);
      } else {
        // Single short blast (0.5 seconds) for warning, prep, and start
        playSingleHorn(ctx, 0.5, now);
      }
    } catch (error) {
      console.error('Error playing horn:', error);
    }
  }, [playSingleHorn]);

  // Animation loop - use ref to track current time to avoid stale closures
  const timeRef = useRef(time);
  timeRef.current = time;

  useEffect(() => {
    if (isPlaying) {
      const runAnimation = (timestamp: number) => {
        const delta = lastTimestampRef.current 
          ? (timestamp - lastTimestampRef.current) / 1000 
          : 0;
        
        // Use functional update to avoid stale closure
        setTime(prevTime => {
          const newTime = prevTime + delta * TIME_SCALE;
          
          if (newTime >= 5) {
            setIsPlaying(false);
            setIsCompleted(true); // Mark as completed but don't auto-navigate
            return 5;
          }
          return newTime;
        });
        
        lastTimestampRef.current = timestamp;
        animationFrameRef.current = requestAnimationFrame(runAnimation);
      };
      
      lastTimestampRef.current = null;
      animationFrameRef.current = requestAnimationFrame(runAnimation);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimestampRef.current = null;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, onComplete]); // Removed 'time' from dependencies

  // Update time callback
  useEffect(() => {
    onTimeUpdate?.(time);
  }, [time, onTimeUpdate]);

  // Handle sequence events
  useEffect(() => {
    const prevTime = prevTimeRef.current;
    const eventsToRun = processedSequenceEvents.filter(
      e => e.time > prevTime && e.time <= time
    );

    if (eventsToRun.length > 0 && hasUserInteracted) {
      eventsToRun.sort((a, b) => a.time - b.time).forEach(event => {
        runAnimationForEvent(event);
      });
    }

    // Update flag states for scrubbing
    const pastEvents = processedSequenceEvents.filter(e => e.time <= time);
    const visualState = pastEvents.reduce(
      (acc, event) => ({ ...acc, ...event.visualState }),
      {} as FlagState
    );
    setFlagStates(visualState);

    // Find current step info (the most recent significant event with a label)
    const significantEvents = pastEvents.filter(e => e.label && e.description);
    if (significantEvents.length > 0) {
      setCurrentStepInfo(significantEvents[significantEvents.length - 1]);
    }

    // Update boat positions
    const lastActionEvent = [...pastEvents].reverse().find(e => e.action);
    if (lastActionEvent) {
      if (lastActionEvent.blueStart) {
        blueBoatX.value = withTiming(lastActionEvent.blueStart.x, { duration: isPlaying ? 0.5 : 0 });
        blueBoatY.value = withTiming(lastActionEvent.blueStart.y, { duration: isPlaying ? 0.5 : 0 });
        blueBoatRotate.value = withTiming(lastActionEvent.blueStart.rotate, { duration: isPlaying ? 0.5 : 0 });
        // Also update state for sail calculation
        setBlueBoatRotation(lastActionEvent.blueStart.rotate);
      }
      if (lastActionEvent.redStart) {
        redBoatX.value = withTiming(lastActionEvent.redStart.x, { duration: isPlaying ? 0.5 : 0 });
        redBoatY.value = withTiming(lastActionEvent.redStart.y, { duration: isPlaying ? 0.5 : 0 });
        redBoatRotate.value = withTiming(lastActionEvent.redStart.rotate, { duration: isPlaying ? 0.5 : 0 });
        // Also update state for sail calculation
        setRedBoatRotation(lastActionEvent.redStart.rotate);
      }
    }

    prevTimeRef.current = time;
  }, [time, isPlaying, hasUserInteracted, processedSequenceEvents]);

  // Animate water and wind
  useEffect(() => {
    if (isPlaying) {
      waterOffset.value = withRepeat(
        withTiming(100, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );
      windOffset.value = withRepeat(
        withTiming(2, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    }
  }, [isPlaying]);

  const runAnimationForEvent = useCallback(async (event: SequenceStep) => {
    // Play horn sound for key timing signals
    if (event.soundSignal?.includes('horn')) {
      let hornType: 'short' | 'long' | 'series' = 'short';
      
      if (event.soundSignal.includes('series')) {
        hornType = 'series'; // Attention/on station signal
      } else if (event.soundSignal.includes('long')) {
        hornType = 'long'; // 1-minute signal
      }
      // Otherwise default to 'short' for warning, prep, and start signals
      
      await playHorn(hornType);
    }

    // Animate boats if action is MOVE
    if (event.action === 'MOVE') {
      const currentIndex = processedSequenceEvents.findIndex(e => e.time === event.time);
      const nextEvent = processedSequenceEvents[currentIndex + 1];
      
      if (nextEvent) {
        const duration = (nextEvent.time - event.time) / TIME_SCALE;
        
        if (nextEvent.blueStart) {
          blueBoatX.value = withTiming(nextEvent.blueStart.x, { duration, easing: (t) => t });
          blueBoatY.value = withTiming(nextEvent.blueStart.y, { duration, easing: (t) => t });
          blueBoatRotate.value = withTiming(nextEvent.blueStart.rotate, { duration, easing: (t) => t });
        }
        
        if (nextEvent.redStart) {
          redBoatX.value = withTiming(nextEvent.redStart.x, { duration, easing: (t) => t });
          redBoatY.value = withTiming(nextEvent.redStart.y, { duration, easing: (t) => t });
          redBoatRotate.value = withTiming(nextEvent.redStart.rotate, { duration, easing: (t) => t });
        }
      }
    }
  }, [hasUserInteracted, sounds, playHorn, processedSequenceEvents]);

  const handleInteraction = async () => {
    // Initialize AudioContext immediately on user interaction (required by browsers)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        // @ts-ignore - AudioContext may not be typed
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
          // Resume context if suspended (required by some browsers)
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
        }
      } catch (error) {
        console.error('Error initializing AudioContext:', error);
      }
    }

    setHasUserInteracted(true);
    setIsPlaying(true);
    
    // Small delay to ensure state is set before playing the first horn
    setTimeout(() => {
      const firstEvent = processedSequenceEvents.find(e => e.time === -360);
      if (firstEvent) {
        runAnimationForEvent(firstEvent);
      }
    }, 100);
  };

  const handleSliderChange = (newValue: number) => {
    if (hasUserInteracted) setIsPlaying(false);
    setTime(newValue);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Quiz handlers
  const handleQuizAnswer = (questionId: string, optionId: string) => {
    const question = STARTING_SEQUENCE_QUIZ.find(q => q.id === questionId);
    const option = question?.options.find(o => o.id === optionId);
    const isCorrect = option?.isCorrect ?? false;
    
    setQuizAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === questionId);
      const newAnswer: QuizAnswer = { questionId, selectedOptionId: optionId, isCorrect };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newAnswer;
        return updated;
      }
      return [...prev, newAnswer];
    });
  };

  const getQuizScore = () => {
    const correct = quizAnswers.filter(a => a.isCorrect).length;
    return { correct, total: STARTING_SEQUENCE_QUIZ.length };
  };

  const resetQuiz = () => {
    setQuizAnswers([]);
    setShowQuizResults(false);
  };

  const formatTime = (seconds: number) => {
    // Guard against NaN
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '0:00';
    }
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const secs = Math.floor(absSeconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Sync boat positions to state using useDerivedValue (avoids AnimatedG crash on Android New Architecture)
  // The boat SVG is centered at (25, 40), so we rotate around that point
  useDerivedValue(() => {
    runOnJS(setBlueBoatTransform)(`translate(${blueBoatX.value}, ${blueBoatY.value}) rotate(${blueBoatRotate.value}, 25, 40)`);
    return null;
  }, []);

  useDerivedValue(() => {
    runOnJS(setRedBoatTransform)(`translate(${redBoatX.value}, ${redBoatY.value}) rotate(${redBoatRotate.value}, 25, 40)`);
    return null;
  }, []);

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Unified sea-colored container with animation and timeline */}
        <View style={styles.seaContainer}>
          {/* Overlay - covers entire sea container */}
          {!hasUserInteracted && (
            <View style={styles.overlay}>
              <TouchableOpacity style={styles.startButton} onPress={handleInteraction}>
                <Ionicons name="play" size={24} color="#FFFFFF" />
                <Text style={styles.startButtonText}>Enable Audio and Start Lesson</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Animation + Timeline Row */}
          <View style={styles.mainRow}>
            {/* SVG Animation */}
            <View style={styles.svgWrapper}>
              <View style={styles.svgContainer}>
                <Svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox="0 0 900 450" preserveAspectRatio="xMidYMid meet">
                  <Defs>
                    <Pattern id="water-texture" patternUnits="userSpaceOnUse" width="40" height="20">
                      <Path d="M 0 10 C 10 0, 30 0, 40 10 T 80 10" stroke="#99ccee" fill="none" strokeWidth="1" />
                    </Pattern>
                    <Marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                      <Polygon points="0,0 10,3.5 0,7" fill="#000" />
                    </Marker>
                  </Defs>

                  {/* Water background - matches container */}
                  <Rect width="900" height="450" fill="#aaccff" />
                  <Rect width="900" height="450" fill="url(#water-texture)" />
                  
                  {/* Animated clouds (decorative) */}
                  <G opacity={0.7}>
                    <Path d="M 50 40 Q 60 20 80 30 T 120 40 H 50 Z" fill="white" opacity={0.7} />
                    <Path d="M 200 35 Q 215 15 235 25 T 280 35 H 200 Z" fill="white" opacity={0.6} />
                    <Path d="M 450 45 Q 465 25 485 35 T 530 45 H 450 Z" fill="white" opacity={0.75} />
                  </G>
                  
                  {/* Pin end (orange buoy) */}
                  <Circle cx="200" cy="200" r="10" fill="orange" stroke="black" strokeWidth="2" />
                  <SvgText x="200" y="175" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">
                    Pin
                  </SvgText>
                  
                  {/* Start line - from pin buoy to RC boat orange flag (at ~630, 200) */}
                  <Line x1="200" y1="200" x2="630" y2="200" stroke="black" strokeWidth="2" strokeDasharray="5,5" />
                  <SvgText x="415" y="190" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000">
                    Start Line
                  </SvgText>
                  
                  {/* Laylines - showing the "box" area south of the start line */}
                  <G opacity={0.4}>
                    {/* Pin layline - from east side of pin towards SOUTHEAST */}
                    <Line x1="210" y1="200" x2="320" y2="380" stroke="black" strokeWidth="1" strokeDasharray="5,5" />
                    {/* RC boat layline - from southwest edge of RC boat towards SOUTHEAST */}
                    <Line x1="620" y1="210" x2="750" y2="380" stroke="black" strokeWidth="1" strokeDasharray="5,5" />
                    <SvgText x="500" y="340" textAnchor="middle" fontSize="12" fontWeight="600" fill="#64748B" opacity={0.7}>
                      The Box
                    </SvgText>
                  </G>
                  
                  {/* Committee boat and flags */}
                  <G transform="translate(590, 180)">
                    <PowerboatSVG 
                      rotation={0} 
                      orangeFlagState={flagStates.orange === 'UP' ? 'UP' : 'DOWN'}
                      hideInfoBoard={false}
                      scale={1}
                      courseInfo={{
                        type: 'W/L 2',
                        direction: '360°',
                        distance: '1.0 NM',
                      }}
                    />
                    <Line x1="20" y1="5" x2="20" y2="-55" stroke="black" strokeWidth="2" />
                    
                    {/* Class Flag on flagpole */}
                    {flagStates.class === 'UP' && (
                      <G>
                        <Rect x="-15" y="-55" width="25" height="20" fill="#FFFFFF" stroke="black" strokeWidth="1" />
                        <Path d="M -15,-55 L 10,-35" stroke="#CC0000" strokeWidth="8" />
                      </G>
                    )}
                    {/* Preparatory flags */}
                    {PREP_FLAGS.map(opt => (
                      flagStates[opt.flagId] === 'UP' && (
                        <G key={opt.flagId}>
                          <Rect
                            x={opt.flagId === 'p' ? 25 : 60}
                            y="-55"
                            width="25"
                            height="20"
                            fill={opt.flagId === 'p' ? '#0066CC' : opt.flagId === 'i' ? '#FFCC00' : '#FF6600'}
                            stroke="black"
                            strokeWidth="1"
                          />
                          {opt.flagId === 'p' && (
                            <Rect x="30" y="-50" width="15" height="10" fill="#FFFFFF" />
                          )}
                        </G>
                      )
                    ))}
                  </G>
                  
                  {/* Wind indicator */}
                  <G transform="translate(400, 50)">
                    <Line x1="0" y1="0" x2="0" y2="50" stroke="#000" strokeWidth="2" markerEnd="url(#arrowhead)" />
                    <SvgText x="0" y="-10" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#000">
                      WIND
                    </SvgText>
                  </G>
                  
                  {/* Blue Racing Boat - Top-down view */}
                  <G transform={blueBoatTransform}>
                    <TopDownSailboatSVG
                      hullColor="#3B82F6"
                      rotation={blueBoatRotation}
                      scale={0.7}
                      showWake={true}
                      externalRotation={true}
                    />
                  </G>

                  {/* Red Racing Boat - Top-down view */}
                  <G transform={redBoatTransform}>
                    <TopDownSailboatSVG
                      hullColor="#EF4444"
                      rotation={redBoatRotation}
                      scale={0.7}
                      showWake={true}
                      externalRotation={true}
                    />
                  </G>
                </Svg>
              </View>

              {/* Controls */}
              <View style={styles.controls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={handlePlayPause}
                  disabled={!hasUserInteracted}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={20}
                    color={hasUserInteracted ? '#3B82F6' : '#94A3B8'}
                  />
                </TouchableOpacity>
                
                <Text style={styles.timeDisplay}>
                  {time <= 0 ? '-' : ''}{formatTime(time)}
                </Text>
              </View>

              {/* Custom Timeline Slider */}
              <View style={styles.timelineSliderContainer}>
                <CustomTimelineSlider
                  min={-360}
                  max={5}
                  value={time}
                  onChange={handleSliderChange}
                  markers={timelineMarkers}
                  disabled={!hasUserInteracted}
                />
              </View>
            </View>

            {/* Sequence Timeline Panel - integrated to the right */}
            <View style={styles.timelinePanelWrapper}>
              <StartProcedurePanel
                currentTime={time}
                processedSequence={actualProcessedSequence.filter(s => s.label)}
                selectedPrepFlagId={selectedPrepFlagId}
                onPrepFlagChange={setSelectedPrepFlagId}
                explanation={currentStepInfo?.description || ''}
                onTimeChange={(newTime) => {
                  setTime(newTime);
                  if (!hasUserInteracted) setHasUserInteracted(true);
                }}
              />
            </View>
          </View>
        </View>

        {/* Deep Dive Section - shows additional details for current step */}
        {currentStepInfo?.details && currentStepInfo.details.length > 0 && (
          <View style={styles.deepDiveSection}>
            <TouchableOpacity 
              style={styles.deepDiveButton}
              onPress={() => setShowDeepDive(!showDeepDive)}
            >
              <Ionicons 
                name={showDeepDive ? 'chevron-up' : 'bulb'} 
                size={20} 
                color="#8B5CF6" 
              />
              <Text style={styles.deepDiveButtonText}>
                {showDeepDive ? 'Hide Deep Dive' : 'Deep Dive: Learn More'}
              </Text>
              <Ionicons 
                name={showDeepDive ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#8B5CF6" 
              />
            </TouchableOpacity>
            
            {showDeepDive && (
              <View style={styles.deepDiveContent}>
                <View style={styles.deepDiveHeader}>
                  <Ionicons name="book" size={20} color="#1E293B" />
                  <Text style={styles.deepDiveTitle}>
                    {currentStepInfo.label || 'Additional Details'}
                  </Text>
                </View>
                
                <View style={styles.deepDiveDivider} />
                
                {/* Quick Reference - Basic Details */}
                {currentStepInfo.details && currentStepInfo.details.length > 0 && (
                  <View style={styles.deepDiveSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="information-circle" size={18} color="#3B82F6" />
                      <Text style={styles.sectionTitle}>Quick Reference</Text>
                    </View>
                    {currentStepInfo.details.map((detail, index) => (
                      <View key={index} style={styles.deepDiveItem}>
                        <View style={styles.deepDiveIconContainer}>
                          <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
                        </View>
                        <Text style={styles.deepDiveItemText}>{detail}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Comprehensive Deep Dive Sections */}
                {currentStepInfo.deepDive && (
                  <>
                    {/* Why It Matters */}
                    {currentStepInfo.deepDive.whyItMatters && currentStepInfo.deepDive.whyItMatters.length > 0 && (
                      <View style={styles.deepDiveSection}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="star" size={18} color="#8B5CF6" />
                          <Text style={styles.sectionTitle}>Why It Matters</Text>
                        </View>
                        {currentStepInfo.deepDive.whyItMatters.map((item, index) => (
                          <View key={index} style={styles.deepDiveItem}>
                            <View style={[styles.deepDiveIconContainer, { backgroundColor: '#F3E8FF' }]}>
                              <Ionicons name="bulb" size={16} color="#8B5CF6" />
                            </View>
                            <Text style={styles.deepDiveItemText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Common Mistakes */}
                    {currentStepInfo.deepDive.commonMistakes && currentStepInfo.deepDive.commonMistakes.length > 0 && (
                      <View style={styles.deepDiveSection}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="warning" size={18} color="#EF4444" />
                          <Text style={styles.sectionTitle}>Common Mistakes</Text>
                        </View>
                        {currentStepInfo.deepDive.commonMistakes.map((item, index) => (
                          <View key={index} style={[styles.deepDiveItem, styles.mistakeItem]}>
                            <View style={[styles.deepDiveIconContainer, { backgroundColor: '#FEE2E2' }]}>
                              <Ionicons name="close-circle" size={16} color="#EF4444" />
                            </View>
                            <Text style={styles.deepDiveItemText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Advanced Tactics */}
                    {currentStepInfo.deepDive.advancedTactics && currentStepInfo.deepDive.advancedTactics.length > 0 && (
                      <View style={styles.deepDiveSection}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="rocket" size={18} color="#F59E0B" />
                          <Text style={styles.sectionTitle}>Advanced Tactics</Text>
                        </View>
                        {currentStepInfo.deepDive.advancedTactics.map((item, index) => (
                          <View key={index} style={[styles.deepDiveItem, styles.tacticsItem]}>
                            <View style={[styles.deepDiveIconContainer, { backgroundColor: '#FEF3C7' }]}>
                              <Ionicons name="flash" size={16} color="#F59E0B" />
                            </View>
                            <Text style={styles.deepDiveItemText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Rules and Regulations */}
                    {currentStepInfo.deepDive.rulesAndRegulations && currentStepInfo.deepDive.rulesAndRegulations.length > 0 && (
                      <View style={styles.deepDiveSection}>
                        <View style={styles.sectionHeader}>
                          <Ionicons name="document-text" size={18} color="#10B981" />
                          <Text style={styles.sectionTitle}>Rules & Regulations</Text>
                        </View>
                        {currentStepInfo.deepDive.rulesAndRegulations.map((item, index) => (
                          <View key={index} style={[styles.deepDiveItem, styles.rulesItem]}>
                            <View style={[styles.deepDiveIconContainer, { backgroundColor: '#D1FAE5' }]}>
                              <Ionicons name="checkmark-done-circle" size={16} color="#10B981" />
                            </View>
                            <Text style={styles.deepDiveItemText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Pro Tips */}
                    {currentStepInfo.deepDive.proTips && currentStepInfo.deepDive.proTips.length > 0 && (
                      <View style={styles.proTipSection}>
                        <View style={styles.proTipHeader}>
                          <Ionicons name="star" size={20} color="#F59E0B" />
                          <Text style={styles.proTipTitle}>Pro Tips</Text>
                        </View>
                        {currentStepInfo.deepDive.proTips.map((tip, index) => (
                          <View key={index} style={styles.proTipItem}>
                            <View style={styles.proTipBullet}>
                              <Ionicons name="flash" size={12} color="#F59E0B" />
                            </View>
                            <Text style={styles.proTipText}>{tip}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* Quiz Prompt - Show after completing animation */}
        {isCompleted && !showQuiz && (
          <View style={styles.quizPrompt}>
            <View style={styles.quizPromptContent}>
              <Ionicons name="school" size={32} color="#3B82F6" />
              <Text style={styles.quizPromptTitle}>Test Your Knowledge?</Text>
              <Text style={styles.quizPromptText}>
                Take a quick quiz to check your understanding of the starting sequence before moving on.
              </Text>
              <View style={styles.quizPromptButtons}>
                <TouchableOpacity 
                  style={styles.quizPromptButtonSecondary}
                  onPress={() => {
                    if (onComplete) {
                      onComplete();
                    }
                  }}
                >
                  <Text style={styles.quizPromptButtonSecondaryText}>Skip Quiz</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quizPromptButtonPrimary}
                  onPress={() => setShowQuiz(true)}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.quizPromptButtonPrimaryText}>Take Quiz</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Quiz Section - Show when user chooses to take quiz */}
        {showQuiz && (
          <View style={styles.quizSection}>
          <Text style={styles.quizTitle}>Test Your Knowledge</Text>
          <Text style={styles.quizSubtitle}>Answer these questions to check your understanding of the starting sequence.</Text>
          
          {STARTING_SEQUENCE_QUIZ.map((question, qIndex) => {
            const answer = quizAnswers.find(a => a.questionId === question.id);
            
            return (
              <View key={question.id} style={styles.questionCard}>
                <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
                <Text style={styles.questionText}>{question.question}</Text>
                
                <View style={styles.optionsContainer}>
                  {question.options.map(option => {
                    const isSelected = answer?.selectedOptionId === option.id;
                    const showResult = isSelected && answer?.isCorrect !== null;
                    
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.optionButton,
                          isSelected && styles.optionSelected,
                          showResult && answer?.isCorrect && styles.optionCorrect,
                          showResult && !answer?.isCorrect && styles.optionIncorrect,
                        ]}
                        onPress={() => handleQuizAnswer(question.id, option.id)}
                        disabled={answer?.isCorrect === true}
                      >
                        <Text style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}>
                          {option.text}
                        </Text>
                        {showResult && answer?.isCorrect && (
                          <Ionicons 
                            name="checkmark-circle"
                            size={20} 
                            color="#22C55E"
                          />
                        )}
                        {showResult && !answer?.isCorrect && (
                          <Ionicons 
                            name="close-circle"
                            size={20} 
                            color="#EF4444"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                
                {/* Feedback after answering */}
                {answer && (
                  <View style={[
                    styles.feedbackBox,
                    answer.isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
                  ]}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons 
                        name={answer.isCorrect ? 'checkmark-circle' : 'bulb'} 
                        size={20} 
                        color={answer.isCorrect ? '#166534' : '#92400E'} 
                      />
                      <Text style={[
                        styles.feedbackTitle,
                        answer.isCorrect ? styles.feedbackTitleCorrect : styles.feedbackTitleIncorrect
                      ]}>
                        {answer.isCorrect ? 'Correct! 🎉' : 'Not quite - try again!'}
                      </Text>
                    </View>
                    <Text style={[
                      styles.feedbackText,
                      answer.isCorrect ? styles.feedbackTextCorrect : styles.feedbackTextIncorrect
                    ]}>
                      {answer.isCorrect 
                        ? question.explanation 
                        : question.hint || 'Think about what you learned in the lesson above.'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
          
          {/* Quiz Results */}
          {quizAnswers.length === STARTING_SEQUENCE_QUIZ.length && (
            <View style={styles.quizResults}>
              <Text style={styles.quizResultsTitle}>
                Quiz Complete! 🎉
              </Text>
              <Text style={styles.quizResultsScore}>
                You got {getQuizScore().correct} out of {getQuizScore().total} correct
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={resetQuiz}>
                <Ionicons name="refresh" size={18} color="#3B82F6" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        )}

        {/* Navigation Controls - Show when lesson is completed (after quiz or if quiz skipped) */}
        {isCompleted && !showQuiz && (
          <View style={styles.navControls}>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepIndicatorText}>Lesson Complete</Text>
            </View>
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary]}
              onPress={() => {
                if (onComplete) {
                  onComplete();
                }
              }}
            >
              <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>Next Lesson</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 8,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  seaContainer: {
    position: 'relative',
    backgroundColor: '#8bb8f0',
    borderRadius: 12,
    padding: 16,
    // Water wave pattern effect using gradient-like appearance
    ...(Platform.OS === 'web'
      ? { 
          backgroundImage: 'linear-gradient(135deg, #aaccff 0%, #8bb8f0 40%, #7aa5e0 70%, #6b9ad8 100%)',
        }
      : {}),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderRadius: 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 16px rgba(59, 130, 246, 0.4)',
      },
      default: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mainRow: {
    flexDirection: SCREEN_WIDTH >= 900 ? 'row' : 'column',
    gap: 12,
    alignItems: 'stretch',
  },
  svgWrapper: {
    flex: SCREEN_WIDTH >= 900 ? 2 : undefined,
    width: SCREEN_WIDTH >= 900 ? undefined : '100%',
    position: 'relative',
  },
  svgContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    minHeight: 280,
    maxHeight: 450,
    backgroundColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  playButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
      },
    }),
  },
  timeDisplay: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    minWidth: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timelineSliderContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  timelinePanelWrapper: {
    flex: SCREEN_WIDTH >= 900 ? 1 : undefined,
    minWidth: SCREEN_WIDTH >= 900 ? 300 : undefined,
    maxWidth: SCREEN_WIDTH >= 900 ? 360 : undefined,
    backgroundColor: 'rgba(180, 210, 240, 0.45)',
    borderRadius: 12,
    padding: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: 'inset 0px 1px 3px rgba(255, 255, 255, 0.3), 0px 2px 8px rgba(0, 50, 100, 0.12)',
        backdropFilter: 'blur(16px)',
      },
      default: {
        shadowColor: '#1E3A5F',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
      },
    }),
  },
  // Deep Dive Section Styles
  deepDiveSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  deepDiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  deepDiveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  deepDiveContent: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  deepDiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  deepDiveTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  deepDiveDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  deepDiveSectionItem: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  deepDiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  mistakeItem: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  tacticsItem: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  rulesItem: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  deepDiveIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  deepDiveItemText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  proTipSection: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  proTipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
  },
  proTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  proTipBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  proTipText: {
    flex: 1,
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
    fontWeight: '500',
  },
  // Quiz Prompt Styles
  quizPrompt: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  quizPromptContent: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quizPromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E40AF',
    marginTop: 12,
    marginBottom: 8,
  },
  quizPromptText: {
    fontSize: 14,
    color: '#3B82F6',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  quizPromptButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quizPromptButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  quizPromptButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  quizPromptButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  quizPromptButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Quiz Section Styles
  quizSection: {
    marginTop: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  quizSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionCorrect: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  optionIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  feedbackBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  feedbackCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  feedbackIncorrect: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  feedbackTitleCorrect: {
    color: '#166534',
  },
  feedbackTitleIncorrect: {
    color: '#92400E',
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 19,
  },
  feedbackTextCorrect: {
    color: '#166534',
  },
  feedbackTextIncorrect: {
    color: '#92400E',
  },
  optionText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
  },
  optionTextSelected: {
    color: '#1E40AF',
    fontWeight: '500',
  },
  quizResults: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  quizResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  quizResultsScore: {
    fontSize: 16,
    color: '#15803D',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  retryButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  // Navigation Controls Styles (similar to SetCourseInteractive)
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  navButtonPrimary: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  navButtonTextPrimary: {
    color: '#FFFFFF',
  },
  stepIndicator: {
    flex: 1,
    alignItems: 'center',
  },
  stepIndicatorText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});

