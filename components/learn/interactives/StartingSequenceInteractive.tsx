/**
 * Starting Sequence Interactive Component
 * React Native version ported from BetterAt Sail Racing
 * 
 * Converts:
 * - framer-motion → react-native-reanimated
 * - SVG → react-native-svg
 * - Web Audio API → expo-av
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Defs, Pattern, Marker, Polygon, Path, Image as SvgImage } from 'react-native-svg';

// Create animated SVG components
const AnimatedG = Animated.createAnimatedComponent(G);
import type { SequenceStep, FlagState } from './data/startSequenceData';
import { RACING_SEQUENCE_STEPS, PREPARATORY_FLAG_OPTIONS as PREP_FLAGS, STARTING_SEQUENCE_QUIZ } from './data/startSequenceData';
import { PowerboatSVG, TopDownSailboatSVG, CustomTimelineSlider, StartProcedurePanel } from './shared';

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
      console.log('Horn sound (native not implemented)');
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
        console.log('Horn sound played (series of short blasts)');
      } else if (hornType === 'long') {
        // Long blast (1.2 seconds) for 1-minute signal
        playSingleHorn(ctx, 1.2, now);
        console.log('Horn sound played (long blast)');
      } else {
        // Single short blast (0.5 seconds) for warning, prep, and start
        playSingleHorn(ctx, 0.5, now);
        console.log('Horn sound played (single short blast)');
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
            onComplete?.();
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
        withTiming(100, { duration: 4, easing: (t) => t }),
        -1,
        false
      );
      windOffset.value = withRepeat(
        withTiming(2, { duration: 3, easing: (t) => t * (2 - t) }),
        -1,
        true
      );
    }
  }, [isPlaying]);

  const runAnimationForEvent = useCallback(async (event: SequenceStep) => {
    console.log(`[Event] ${event.label} at ${event.time}s`);
    
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

  // Animated props for boats (SVG transform) - using SVG transform string format
  // The boat SVG is centered at (25, 40), so we rotate around that point
  const blueBoatProps = useAnimatedProps(() => ({
    transform: `translate(${blueBoatX.value}, ${blueBoatY.value}) rotate(${blueBoatRotate.value}, 25, 40)`,
  }));

  const redBoatProps = useAnimatedProps(() => ({
    transform: `translate(${redBoatX.value}, ${redBoatY.value}) rotate(${redBoatRotate.value}, 25, 40)`,
  }));

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Animation + Info Panel Row */}
        <View style={styles.mainRow}>
          {/* SVG Animation */}
          <View style={styles.svgWrapper}>
            {/* Overlay - only covers animation area */}
            {!hasUserInteracted && (
              <View style={styles.overlay}>
                <TouchableOpacity style={styles.startButton} onPress={handleInteraction}>
                  <Ionicons name="play" size={24} color="#FFFFFF" />
                  <Text style={styles.startButtonText}>Enable Audio and Start Lesson</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.svgContainer}>
              <Svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox="0 0 800 450">
                <Defs>
                  <Pattern id="water-texture" patternUnits="userSpaceOnUse" width="40" height="20">
                    <Path d="M 0 10 C 10 0, 30 0, 40 10 T 80 10" stroke="#99ccee" fill="none" strokeWidth="1" />
                  </Pattern>
                  <Marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <Polygon points="0,0 10,3.5 0,7" fill="#000" />
                  </Marker>
                </Defs>
                
                {/* Water background */}
                <Rect width="800" height="450" fill="#aaccff" />
                <Rect width="800" height="450" fill="url(#water-texture)" />
                
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
                <AnimatedG animatedProps={blueBoatProps}>
                  <TopDownSailboatSVG 
                    hullColor="#3B82F6" 
                    rotation={blueBoatRotation}
                    scale={0.7} 
                    showWake={true}
                    externalRotation={true}
                  />
                </AnimatedG>
                
                {/* Red Racing Boat - Top-down view */}
                <AnimatedG animatedProps={redBoatProps}>
                  <TopDownSailboatSVG 
                    hullColor="#EF4444" 
                    rotation={redBoatRotation}
                    scale={0.7} 
                    showWake={true}
                    externalRotation={true}
                  />
                </AnimatedG>
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

        </View>

        {/* Start Procedure Panel - Full width below animation */}
        <View style={styles.procedureSection}>
          <Text style={styles.sectionTitle}>Start Procedure Reference</Text>
          <View style={styles.procedurePanelWrapper}>
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

        {/* Quiz Section */}
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
                        disabled={answer?.selectedOptionId !== null}
                      >
                        <Text style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}>
                          {option.text}
                        </Text>
                        {showResult && (
                          <Ionicons 
                            name={answer?.isCorrect ? 'checkmark-circle' : 'close-circle'} 
                            size={20} 
                            color={answer?.isCorrect ? '#22C55E' : '#EF4444'} 
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
    padding: 16,
    margin: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mainRow: {
    flexDirection: 'column',
    gap: 16,
  },
  svgWrapper: {
    width: '100%',
    position: 'relative',
  },
  svgContainer: {
    width: '100%',
    aspectRatio: 800 / 450,
    minHeight: 280,
    maxHeight: Platform.OS === 'web' ? 450 : 350,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  playButton: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  timeDisplay: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 18,
    color: '#1E293B',
    minWidth: 60,
  },
  timelineSliderContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  procedureSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  procedurePanelWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    minHeight: 300,
  },
  // Quiz Section Styles
  quizSection: {
    marginTop: 32,
    paddingTop: 24,
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
});

