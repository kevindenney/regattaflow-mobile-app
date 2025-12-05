/**
 * BuoyRoundingLesson Component
 * React Native version ported from BetterAt Sail Racing
 * 
 * A video player with synchronized overlay animations and text cues
 * for teaching mark rounding techniques.
 * 
 * Uses:
 * - expo-av for video playback
 * - react-native-svg for overlay graphics
 * - react-native-reanimated for animations
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import Svg, { Line, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Cue points for PAUSING the video
const pauseCuePoints = [
  { 
    time: 5, 
    buoyPosition: { x: 450, y: 350 }, 
    boatPosition: { x: 220, y: 350 }, 
    text: 'Boat 2: Should aim one boat length wide of the mark. Next time aim even wider.' 
  },
  { 
    time: 18, 
    buoyPosition: { x: 300, y: 450 }, 
    boatPosition: { x: 120, y: 450 }, 
    text: 'Boat 3: Sailing in close, out wide (the wrong way). Point the bow farther away to turn when the bow is equal with the line.' 
  },
];

// Cue points for NON-PAUSING dialogue
const dialogueCues = [
  { time: 0, text: 'Watch how these boats approach the leeward mark.', duration: 7 },
  { time: 6, text: 'Should have turned when the boat was even with the mark.', duration: 7 },
  { time: 8, text: 'The goal is to go "in wide, and out close" to maintain speed. Point the bow 1 boat length outside the buoy.', duration: 7 },
  { time: 15, text: "Now, watch the third boat's rounding. It sails too close to the mark and swings wide on exit, losing speed.", duration: 7 },
  { time: 22, text: 'Notice how far away from the mark and slow they are on exit.', duration: 7 },
];

interface BuoyRoundingLessonProps {
  videoSrc: string;
  onComplete?: () => void;
}

export function BuoyRoundingLesson({ videoSrc, onComplete }: BuoyRoundingLessonProps) {
  const videoRef = useRef<Video>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [pauseCuePointIndex, setPauseCuePointIndex] = useState(0);
  const [dialogueCueIndex, setDialogueCueIndex] = useState(0);
  
  const [pauseOverlay, setPauseOverlay] = useState({
    buoyPosition: { x: 0, y: 0 },
    boatPosition: { x: 0, y: 0 },
    text: '',
    visible: false,
  });
  const [dialogueText, setDialogueText] = useState('');
  
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dialogueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values
  const overlayOpacity = useSharedValue(0);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const handlePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    
    // Clear any pending pause timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    
    setPauseOverlay(prev => ({ ...prev, visible: false }));
    overlayOpacity.value = withTiming(0, { duration: 300 });
    
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  }, [isPlaying, overlayOpacity]);

  const resetAllCues = useCallback(() => {
    setPauseCuePointIndex(0);
    setDialogueCueIndex(0);
    setPauseOverlay(prev => ({ ...prev, visible: false, text: '' }));
    setDialogueText('');
    overlayOpacity.value = 0;
  }, [overlayOpacity]);

  const handleReset = useCallback(async () => {
    if (!videoRef.current) return;
    
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    if (dialogueTimeoutRef.current) clearTimeout(dialogueTimeoutRef.current);
    
    await videoRef.current.setPositionAsync(0);
    await videoRef.current.pauseAsync();
    setIsPlaying(false);
    resetAllCues();
    setCurrentTime(0);
  }, [resetAllCues]);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    
    setIsPlaying(status.isPlaying);
    setCurrentTime(status.positionMillis / 1000);
    
    if (status.durationMillis) {
      setDuration(status.durationMillis / 1000);
    }
    
    if (status.didJustFinish) {
      setIsPlaying(false);
      resetAllCues();
      onComplete?.();
    }
  }, [resetAllCues, onComplete]);

  // Check for cue points on time update
  useEffect(() => {
    if (!isPlaying) return;
    
    const time = currentTime;
    
    // Handle Pausing Cues
    const nextPauseCue = pauseCuePoints[pauseCuePointIndex];
    if (nextPauseCue && time >= nextPauseCue.time && !pauseTimeoutRef.current && !pauseOverlay.visible) {
      videoRef.current?.pauseAsync();
      
      setPauseOverlay({
        buoyPosition: nextPauseCue.buoyPosition,
        boatPosition: nextPauseCue.boatPosition,
        text: nextPauseCue.text,
        visible: true,
      });
      overlayOpacity.value = withTiming(1, { duration: 300 });
      
      setPauseCuePointIndex(prev => prev + 1);
      
      pauseTimeoutRef.current = setTimeout(() => {
        setPauseOverlay(prev => ({ ...prev, visible: false }));
        overlayOpacity.value = withTiming(0, { duration: 300 });
        videoRef.current?.playAsync();
        pauseTimeoutRef.current = null;
      }, 12000);
    }
    
    // Handle Dialogue Cues
    const nextDialogueCue = dialogueCues[dialogueCueIndex];
    if (nextDialogueCue && time >= nextDialogueCue.time) {
      if (dialogueTimeoutRef.current) clearTimeout(dialogueTimeoutRef.current);
      
      if (dialogueCueIndex < dialogueCues.length) {
        setDialogueText(nextDialogueCue.text);
        setDialogueCueIndex(prev => prev + 1);
        
        dialogueTimeoutRef.current = setTimeout(() => {
          setDialogueText('');
          dialogueTimeoutRef.current = null;
        }, nextDialogueCue.duration * 1000);
      }
    }
  }, [currentTime, isPlaying, pauseCuePointIndex, dialogueCueIndex, pauseOverlay.visible, overlayOpacity]);

  const handleSliderChange = useCallback(async (value: number) => {
    if (!videoRef.current) return;
    
    await videoRef.current.setPositionAsync(value * 1000);
    setCurrentTime(value);
    
    // Recalculate cue indices after scrubbing
    const newPauseIndex = pauseCuePoints.findIndex(cp => value < cp.time);
    setPauseCuePointIndex(newPauseIndex === -1 ? pauseCuePoints.length : newPauseIndex);
    
    const newDialogueIndex = dialogueCues.findIndex(dc => value < dc.time);
    setDialogueCueIndex(newDialogueIndex === -1 ? dialogueCues.length : newDialogueIndex);
    
    setPauseOverlay(prev => ({ ...prev, visible: false }));
    setDialogueText('');
    overlayOpacity.value = 0;
  }, [overlayOpacity]);

  const formatTime = (timeInSeconds: number) => {
    const totalSeconds = isNaN(timeInSeconds) ? 0 : timeInSeconds;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate scaled positions for overlay
  const scaleX = (SCREEN_WIDTH - 32) / 800;
  const scaleY = 200 / 600; // Approximate video aspect ratio

  return (
    <View style={styles.container}>
      {/* Video */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: videoSrc }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          useNativeControls={false}
        />
        
        {/* Overlay SVG for annotations */}
        <Animated.View style={[styles.overlayContainer, overlayStyle]}>
          {pauseOverlay.visible && (
            <View style={styles.overlay}>
              <Svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
                {/* Yellow dotted turn line */}
                <Line
                  x1="0"
                  y1={pauseOverlay.buoyPosition.y + 15}
                  x2="800"
                  y2={pauseOverlay.buoyPosition.y + 15}
                  stroke="yellow"
                  strokeWidth="4"
                  strokeDasharray="8,8"
                />
              </Svg>
              
              {/* Text overlay */}
              <View style={[styles.pauseTextContainer, { 
                left: pauseOverlay.buoyPosition.x * scaleX - 100, 
                top: (pauseOverlay.buoyPosition.y - 170) * scaleY 
              }]}>
                <Text style={styles.pauseText}>{pauseOverlay.text}</Text>
              </View>
            </View>
          )}
        </Animated.View>
        
        {/* Dialogue text overlay */}
        {dialogueText !== '' && (
          <Animated.View 
            style={styles.dialogueContainer}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(500)}
          >
            <Text style={styles.dialogueText}>{dialogueText}</Text>
          </Animated.View>
        )}
        
        {/* Video credit */}
        <Text style={styles.videoCredit}>Video credit: PandaMan</Text>
      </View>
      
      {/* Controls */}
      <View style={styles.controls}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration || 1}
          value={currentTime}
          onSlidingComplete={handleSliderChange}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="#E2E8F0"
          thumbTintColor="#3B82F6"
        />
        
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.controlButton} onPress={handlePlayPause}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#1E293B" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
          <Ionicons name="refresh" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
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
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  overlay: {
    flex: 1,
    position: 'relative',
  },
  pauseTextContainer: {
    position: 'absolute',
    width: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
  },
  pauseText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  dialogueContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
  },
  dialogueText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  videoCredit: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minWidth: 45,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 16,
  },
  controlButton: {
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
});

export default BuoyRoundingLesson;

