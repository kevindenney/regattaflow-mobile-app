/**
 * Course Signal Board
 * 
 * Full-screen visual display for race committee signal boat
 * Shows current flags, countdown timer, and horn signals
 */

import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

type SignalFlag = 
  | 'class'      // Class flag (fleet-specific)
  | 'P'          // Preparatory
  | 'I'          // Round-an-end rule
  | 'Z'          // 20% penalty
  | 'U'          // UFD rule
  | 'black'      // Black flag
  | 'AP'         // Postponement
  | 'AP_A'       // AP over A (no more racing today)
  | 'AP_H'       // AP over H (no more racing today, further signals ashore)
  | 'N'          // Abandonment
  | 'N_A'        // N over A (all races abandoned, no more today)
  | 'N_H'        // N over H (all races abandoned, signals ashore)
  | 'first_sub'  // General recall
  | 'X'          // Individual recall
  | 'Y'          // Life jackets required
  | 'L'          // Come within hail
  | 'S'          // Shortened course
  | 'C'          // Course change
  | 'M'          // Mark missing
  | 'answer'     // Answer pennant (1 minute to start)
  | 'blue'       // Blue flag (leaving soon)
  | 'orange'     // Orange flag (safety/start boat)
  | 'none';

interface FlagInfo {
  name: string;
  code: string;
  colors: string[];
  meaning: string;
  shape?: 'rectangle' | 'triangle' | 'swallow';
}

type StartPhase = 'idle' | 'warning' | 'preparatory' | 'one_minute' | 'start' | 'racing';

// ============================================================================
// Flag Data
// ============================================================================

const FLAGS: Record<string, FlagInfo> = {
  P: { 
    name: 'Papa', 
    code: 'P', 
    colors: ['#0047AB', '#FFFFFF'], 
    meaning: 'Preparatory Signal',
    shape: 'rectangle'
  },
  I: { 
    name: 'India', 
    code: 'I', 
    colors: ['#000000', '#FFD700'], 
    meaning: 'Round-an-end Rule',
    shape: 'rectangle'
  },
  Z: { 
    name: 'Zulu', 
    code: 'Z', 
    colors: ['#FFD700', '#0047AB', '#DC143C', '#000000'], 
    meaning: '20% Penalty Rule',
    shape: 'rectangle'
  },
  U: { 
    name: 'Uniform', 
    code: 'U', 
    colors: ['#DC143C', '#FFFFFF'], 
    meaning: 'U-Flag Rule (UFD)',
    shape: 'rectangle'
  },
  black: { 
    name: 'Black Flag', 
    code: 'BLACK', 
    colors: ['#000000'], 
    meaning: 'Black Flag Rule',
    shape: 'rectangle'
  },
  AP: { 
    name: 'Answering Pennant', 
    code: 'AP', 
    colors: ['#DC143C', '#FFFFFF'], 
    meaning: 'Races Postponed',
    shape: 'swallow'
  },
  N: { 
    name: 'November', 
    code: 'N', 
    colors: ['#0047AB', '#FFFFFF'], 
    meaning: 'Races Abandoned',
    shape: 'rectangle'
  },
  first_sub: { 
    name: 'First Substitute', 
    code: '1st SUB', 
    colors: ['#FFD700', '#0047AB'], 
    meaning: 'General Recall',
    shape: 'triangle'
  },
  X: { 
    name: 'X-Ray', 
    code: 'X', 
    colors: ['#FFFFFF', '#0047AB'], 
    meaning: 'Individual Recall',
    shape: 'rectangle'
  },
  Y: { 
    name: 'Yankee', 
    code: 'Y', 
    colors: ['#DC143C', '#FFD700'], 
    meaning: 'Life Jackets Required',
    shape: 'rectangle'
  },
  L: { 
    name: 'Lima', 
    code: 'L', 
    colors: ['#FFD700', '#000000'], 
    meaning: 'Come Within Hail',
    shape: 'rectangle'
  },
  S: { 
    name: 'Sierra', 
    code: 'S', 
    colors: ['#FFFFFF', '#0047AB'], 
    meaning: 'Shortened Course',
    shape: 'rectangle'
  },
  orange: { 
    name: 'Orange Flag', 
    code: 'ORANGE', 
    colors: ['#FF6600'], 
    meaning: 'Start/Committee Boat',
    shape: 'rectangle'
  },
};

// Class flag colors
const CLASS_COLORS: Record<string, { bg: string; text: string }> = {
  'J/70': { bg: '#DC143C', text: '#FFFFFF' },
  'Laser': { bg: '#00FF00', text: '#000000' },
  '420': { bg: '#0047AB', text: '#FFFFFF' },
  'Optimist': { bg: '#FFD700', text: '#000000' },
  'Flying Scot': { bg: '#800080', text: '#FFFFFF' },
  'default': { bg: '#1e3a5f', text: '#FFFFFF' },
};

// ============================================================================
// Main Component
// ============================================================================

export default function CourseSignalBoard() {
  const { raceId, className } = useLocalSearchParams<{ raceId?: string; className?: string }>();
  
  // State
  const [currentFlags, setCurrentFlags] = useState<SignalFlag[]>(['orange']);
  const [phase, setPhase] = useState<StartPhase>('idle');
  const [countdown, setCountdown] = useState(0);
  const [hornCountdown, setHornCountdown] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentClass, setCurrentClass] = useState(className || 'J/70');
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // ==========================================================================
  // Timer Logic
  // ==========================================================================
  
  const startSequence = useCallback((minutes: number = 5) => {
    setCountdown(minutes * 60);
    setPhase('warning');
    setCurrentFlags(['class', 'orange']);
    
    // Start countdown
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        const newTime = prev - 1;
        
        // Phase transitions
        if (newTime === 240) { // 4 minutes
          setPhase('preparatory');
          setCurrentFlags(['class', 'P', 'orange']);
          playHorn();
        } else if (newTime === 60) { // 1 minute
          setPhase('one_minute');
          setCurrentFlags(['class', 'orange']);
          playHorn();
        } else if (newTime === 0) { // Start
          setPhase('start');
          setCurrentFlags(['orange']);
          playHorn();
          setTimeout(() => setPhase('racing'), 2000);
        }
        
        // Horn countdown in last 10 seconds of each minute
        if (newTime > 0 && newTime <= 10) {
          setHornCountdown(newTime);
        } else if (newTime % 60 <= 10 && newTime % 60 > 0) {
          setHornCountdown(newTime % 60);
        } else {
          setHornCountdown(null);
        }
        
        if (newTime < 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
  }, []);
  
  const stopSequence = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(0);
    setPhase('idle');
    setCurrentFlags(['orange']);
    setHornCountdown(null);
  }, []);
  
  const playHorn = async () => {
    Vibration.vibrate([0, 500, 100, 500]);
    // In production, would play actual horn sound
  };
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);
  
  // ==========================================================================
  // Flag Actions
  // ==========================================================================
  
  const toggleFlag = (flag: SignalFlag) => {
    setCurrentFlags(prev => {
      if (prev.includes(flag)) {
        return prev.filter(f => f !== flag);
      } else {
        return [...prev, flag];
      }
    });
    playHorn();
  };
  
  const setPostponement = () => {
    stopSequence();
    setCurrentFlags(['AP', 'orange']);
    setPhase('idle');
  };
  
  const setAbandonment = () => {
    stopSequence();
    setCurrentFlags(['N', 'orange']);
    setPhase('idle');
  };
  
  const setGeneralRecall = () => {
    stopSequence();
    setCurrentFlags(['first_sub', 'orange']);
    setPhase('idle');
    playHorn();
    playHorn();
  };
  
  const setIndividualRecall = () => {
    toggleFlag('X');
  };
  
  // ==========================================================================
  // Render Helpers
  // ==========================================================================
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getPhaseLabel = (): string => {
    switch (phase) {
      case 'warning': return 'WARNING SIGNAL';
      case 'preparatory': return 'PREPARATORY SIGNAL';
      case 'one_minute': return 'ONE MINUTE';
      case 'start': return '🏁 START';
      case 'racing': return 'RACING';
      default: return 'READY';
    }
  };
  
  const getPhaseColor = (): string => {
    switch (phase) {
      case 'warning': return '#f59e0b';
      case 'preparatory': return '#3b82f6';
      case 'one_minute': return '#dc2626';
      case 'start': return '#16a34a';
      case 'racing': return '#16a34a';
      default: return '#6b7280';
    }
  };
  
  const renderFlag = (flag: SignalFlag, index: number) => {
    if (flag === 'class') {
      const classColors = CLASS_COLORS[currentClass] || CLASS_COLORS.default;
      return (
        <View key={`${flag}-${index}`} style={styles.flagContainer}>
          <View style={[styles.classFlag, { backgroundColor: classColors.bg }]}>
            <Text style={[styles.classFlagText, { color: classColors.text }]}>
              {currentClass}
            </Text>
          </View>
          <Text style={styles.flagLabel}>CLASS FLAG</Text>
        </View>
      );
    }
    
    if (flag === 'orange') {
      return (
        <View key={`${flag}-${index}`} style={styles.flagContainer}>
          <View style={[styles.flag, { backgroundColor: '#FF6600' }]} />
          <Text style={styles.flagLabel}>COMMITTEE</Text>
        </View>
      );
    }
    
    const flagInfo = FLAGS[flag];
    if (!flagInfo) return null;
    
    return (
      <View key={`${flag}-${index}`} style={styles.flagContainer}>
        <View style={styles.flagWrapper}>
          {flagInfo.shape === 'triangle' ? (
            <View style={styles.triangleFlag}>
              <View style={[styles.triangleInner, { 
                borderBottomColor: flagInfo.colors[0],
              }]} />
            </View>
          ) : flagInfo.shape === 'swallow' ? (
            <View style={[styles.swallowFlag, { backgroundColor: flagInfo.colors[0] }]}>
              <View style={[styles.swallowStripe, { backgroundColor: flagInfo.colors[1] || '#fff' }]} />
            </View>
          ) : flagInfo.colors.length === 1 ? (
            <View style={[styles.flag, { backgroundColor: flagInfo.colors[0] }]} />
          ) : flagInfo.colors.length === 2 ? (
            <View style={styles.flag}>
              <View style={[styles.flagHalf, { backgroundColor: flagInfo.colors[0] }]} />
              <View style={[styles.flagHalf, { backgroundColor: flagInfo.colors[1] }]} />
            </View>
          ) : (
            <View style={[styles.flag, { backgroundColor: flagInfo.colors[0] }]}>
              <Text style={styles.flagCode}>{flagInfo.code}</Text>
            </View>
          )}
        </View>
        <Text style={styles.flagLabel}>{flagInfo.code}</Text>
        <Text style={styles.flagMeaning}>{flagInfo.meaning}</Text>
      </View>
    );
  };
  
  // ==========================================================================
  // Main Render
  // ==========================================================================
  
  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';
  const textColor = isDarkMode ? '#f1f5f9' : '#1e293b';
  
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar hidden={isFullscreen} />
      
      {/* Header (shown when controls visible) */}
      {showControls && (
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Signal Board</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setIsDarkMode(!isDarkMode)}
            >
              <Ionicons 
                name={isDarkMode ? 'sunny' : 'moon'} 
                size={24} 
                color={textColor} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Tap to toggle controls */}
      <TouchableOpacity 
        style={styles.mainArea}
        activeOpacity={1}
        onPress={() => setShowControls(!showControls)}
      >
        {/* Phase Indicator */}
        <View style={[styles.phaseIndicator, { backgroundColor: getPhaseColor() }]}>
          <Text style={styles.phaseText}>{getPhaseLabel()}</Text>
        </View>
        
        {/* Countdown Timer */}
        {countdown > 0 && (
          <View style={styles.timerSection}>
            <Text style={[styles.timer, { color: textColor }]}>
              {formatTime(countdown)}
            </Text>
            {hornCountdown !== null && (
              <View style={styles.hornCountdown}>
                <Ionicons name="volume-high" size={32} color="#dc2626" />
                <Text style={styles.hornCountdownText}>{hornCountdown}</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Flags Display */}
        <View style={styles.flagsSection}>
          {currentFlags.map((flag, index) => renderFlag(flag, index))}
        </View>
        
        {/* Class Name */}
        <Text style={[styles.className, { color: textColor }]}>
          {currentClass} Fleet
        </Text>
      </TouchableOpacity>
      
      {/* Control Panel (shown when controls visible) */}
      {showControls && (
        <View style={[styles.controlPanel, isDarkMode && styles.controlPanelDark]}>
          {/* Start Sequence Controls */}
          <View style={styles.controlRow}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.startButton]}
              onPress={() => startSequence(5)}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.controlButtonText}>5 Min Start</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.startButton]}
              onPress={() => startSequence(3)}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.controlButtonText}>3 Min Start</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.stopButton]}
              onPress={stopSequence}
            >
              <Ionicons name="stop" size={20} color="#fff" />
              <Text style={styles.controlButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
          
          {/* Signal Flags */}
          <View style={styles.controlRow}>
            <TouchableOpacity 
              style={[styles.flagButton, currentFlags.includes('AP') && styles.flagButtonActive]}
              onPress={setPostponement}
            >
              <Text style={styles.flagButtonText}>AP</Text>
              <Text style={styles.flagButtonLabel}>Postpone</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.flagButton, currentFlags.includes('N') && styles.flagButtonActive]}
              onPress={setAbandonment}
            >
              <Text style={styles.flagButtonText}>N</Text>
              <Text style={styles.flagButtonLabel}>Abandon</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.flagButton, currentFlags.includes('first_sub') && styles.flagButtonActive]}
              onPress={setGeneralRecall}
            >
              <Text style={styles.flagButtonText}>1st</Text>
              <Text style={styles.flagButtonLabel}>Gen Recall</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.flagButton, currentFlags.includes('X') && styles.flagButtonActive]}
              onPress={setIndividualRecall}
            >
              <Text style={styles.flagButtonText}>X</Text>
              <Text style={styles.flagButtonLabel}>Ind Recall</Text>
            </TouchableOpacity>
          </View>
          
          {/* Prep Flag Options */}
          <View style={styles.controlRow}>
            <TouchableOpacity 
              style={[styles.smallFlagButton, currentFlags.includes('P') && styles.flagButtonActive]}
              onPress={() => toggleFlag('P')}
            >
              <Text style={styles.smallFlagText}>P</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.smallFlagButton, currentFlags.includes('I') && styles.flagButtonActive]}
              onPress={() => toggleFlag('I')}
            >
              <Text style={styles.smallFlagText}>I</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.smallFlagButton, currentFlags.includes('Z') && styles.flagButtonActive]}
              onPress={() => toggleFlag('Z')}
            >
              <Text style={styles.smallFlagText}>Z</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.smallFlagButton, currentFlags.includes('U') && styles.flagButtonActive]}
              onPress={() => toggleFlag('U')}
            >
              <Text style={styles.smallFlagText}>U</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.smallFlagButton, currentFlags.includes('black') && styles.flagButtonActive]}
              onPress={() => toggleFlag('black')}
            >
              <Text style={styles.smallFlagText}>BLK</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.smallFlagButton, currentFlags.includes('Y') && styles.flagButtonActive]}
              onPress={() => toggleFlag('Y')}
            >
              <Text style={styles.smallFlagText}>Y</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.smallFlagButton, currentFlags.includes('S') && styles.flagButtonActive]}
              onPress={() => toggleFlag('S')}
            >
              <Text style={styles.smallFlagText}>S</Text>
            </TouchableOpacity>
          </View>
          
          {/* Horn Button */}
          <TouchableOpacity 
            style={styles.hornButton}
            onPress={playHorn}
          >
            <Ionicons name="volume-high" size={28} color="#fff" />
            <Text style={styles.hornButtonText}>SOUND HORN</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Tap hint */}
      {!showControls && (
        <View style={styles.tapHint}>
          <Text style={[styles.tapHintText, { color: textColor }]}>
            Tap anywhere to show controls
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  
  // Main Area
  mainArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  
  // Phase Indicator
  phaseIndicator: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: 20,
  },
  phaseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  
  // Timer
  timerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timer: {
    fontSize: 120,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -4,
  },
  hornCountdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hornCountdownText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#dc2626',
  },
  
  // Flags
  flagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 30,
  },
  flagContainer: {
    alignItems: 'center',
  },
  flagWrapper: {},
  flag: {
    width: 100,
    height: 70,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#000',
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
      },
    }),
  },
  flagHalf: {
    flex: 1,
  },
  flagCode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 66,
  },
  classFlag: {
    width: 120,
    height: 80,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
      },
    }),
  },
  classFlagText: {
    fontSize: 20,
    fontWeight: '800',
  },
  triangleFlag: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 50,
    borderRightWidth: 50,
    borderBottomWidth: 80,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  triangleInner: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 50,
    borderRightWidth: 50,
    borderBottomWidth: 80,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    top: 0,
    left: -50,
  },
  swallowFlag: {
    width: 100,
    height: 70,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
  },
  swallowStripe: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    height: '20%',
  },
  flagLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 8,
    letterSpacing: 1,
  },
  flagMeaning: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
    maxWidth: 100,
  },
  
  // Class Name
  className: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 20,
  },
  
  // Control Panel
  controlPanel: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  controlPanelDark: {
    backgroundColor: '#1e293b',
    borderTopColor: '#334155',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  
  // Control Buttons
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  startButton: {
    backgroundColor: '#16a34a',
  },
  stopButton: {
    backgroundColor: '#dc2626',
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Flag Buttons
  flagButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    minWidth: 70,
  },
  flagButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  flagButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  flagButtonLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  smallFlagButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  smallFlagText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  
  // Horn Button
  hornButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  hornButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  
  // Tap Hint
  tapHint: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapHintText: {
    fontSize: 14,
    opacity: 0.5,
  },
});

