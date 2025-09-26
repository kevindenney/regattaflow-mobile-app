/**
 * Race Day Interface - Mobile-Optimized Real-Time Racing Interface
 * The ultimate "OnX Maps for Sailing" experience - designed for actual race day use
 * Optimized for gloved hands, bright sunlight, and single-handed operation
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Vibration,
  Alert,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as KeepAwake from 'expo-keep-awake';
import { raceStrategyEngine, type RaceStrategy, type RaceConditions } from '@/src/services/ai/RaceStrategyEngine';
import { venueDetectionService, type SailingVenue } from '@/src/services/location/VenueDetectionService';

interface RaceTimer {
  startTime: Date | null;
  currentTime: Date;
  raceStarted: boolean;
  timeToStart: number; // seconds
  raceElapsed: number; // seconds
}

interface TacticalAlert {
  id: string;
  type: 'wind_shift' | 'current_change' | 'mark_approach' | 'start_sequence' | 'weather_alert';
  priority: 'critical' | 'important' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  action?: string;
}

interface RaceDayInterfaceProps {
  strategy?: RaceStrategy;
  onStrategyUpdate?: (strategy: RaceStrategy) => void;
  onEmergencyAlert?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth > 768;

export const RaceDayInterface: React.FC<RaceDayInterfaceProps> = ({
  strategy,
  onStrategyUpdate,
  onEmergencyAlert
}) => {
  const [raceTimer, setRaceTimer] = useState<RaceTimer>({
    startTime: null,
    currentTime: new Date(),
    raceStarted: false,
    timeToStart: 600, // 10 minutes default
    raceElapsed: 0
  });

  const [currentConditions, setCurrentConditions] = useState<RaceConditions | null>(null);
  const [currentVenue, setCurrentVenue] = useState<SailingVenue | null>(null);
  const [tacticalAlerts, setTacticalAlerts] = useState<TacticalAlert[]>([]);
  const [activeView, setActiveView] = useState<'overview' | 'tactical' | 'conditions' | 'emergency'>('overview');
  const [isRecording, setIsRecording] = useState(false);
  const [raceNotes, setRaceNotes] = useState<string[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const alertSoundsRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Keep screen awake during race day
    KeepAwake.activateKeepAwake();

    // Hide status bar for maximum screen space
    if (Platform.OS === 'ios') {
      StatusBar.setHidden(true, 'fade');
    }

    // Initialize venue detection
    initializeVenueDetection();

    // Start race timer
    startRaceTimer();

    // Generate initial tactical alerts
    generateInitialAlerts();

    return () => {
      KeepAwake.deactivateKeepAwake();
      if (Platform.OS === 'ios') {
        StatusBar.setHidden(false, 'fade');
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const initializeVenueDetection = async () => {
    const initialized = await venueDetectionService.initialize();
    if (initialized) {
      const venue = venueDetectionService.getCurrentVenue();
      setCurrentVenue(venue);

      if (venue) {
        addTacticalAlert({
          type: 'info',
          priority: 'info',
          title: `📍 Venue Detected`,
          message: `Racing at ${venue.name}. Local conditions and intelligence loaded.`,
          action: 'View Local Knowledge'
        });
      }
    }
  };

  const startRaceTimer = () => {
    timerRef.current = setInterval(() => {
      const now = new Date();
      setRaceTimer(prev => {
        const newTimer = { ...prev, currentTime: now };

        if (prev.startTime && !prev.raceStarted) {
          const timeToStart = Math.max(0, Math.floor((prev.startTime.getTime() - now.getTime()) / 1000));
          newTimer.timeToStart = timeToStart;

          // Start sequence alerts
          if (timeToStart === 300 && !alertSoundsRef.current['5min']) {
            addStartSequenceAlert('5 Minutes to Start', 'Prepare for start sequence');
            alertSoundsRef.current['5min'] = true;
          } else if (timeToStart === 60 && !alertSoundsRef.current['1min']) {
            addStartSequenceAlert('1 Minute Warning', 'Final approach to start line');
            alertSoundsRef.current['1min'] = true;
          } else if (timeToStart === 0 && !alertSoundsRef.current['start']) {
            addStartSequenceAlert('🏁 START!', 'Race is on! Execute strategy.');
            newTimer.raceStarted = true;
            alertSoundsRef.current['start'] = true;
            Vibration.vibrate([100, 50, 100, 50, 100]);
          }
        }

        if (prev.raceStarted && prev.startTime) {
          newTimer.raceElapsed = Math.floor((now.getTime() - prev.startTime.getTime()) / 1000);
        }

        return newTimer;
      });
    }, 1000);
  };

  const addStartSequenceAlert = (title: string, message: string) => {
    addTacticalAlert({
      type: 'start_sequence',
      priority: 'critical',
      title,
      message,
    });
    Vibration.vibrate(200);
  };

  const addTacticalAlert = (alert: Omit<TacticalAlert, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newAlert: TacticalAlert = {
      ...alert,
      id: `alert_${Date.now()}`,
      timestamp: new Date(),
      acknowledged: false
    };

    setTacticalAlerts(prev => [newAlert, ...prev].slice(0, 10)); // Keep last 10 alerts
  };

  const acknowledgeAlert = (alertId: string) => {
    setTacticalAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const generateInitialAlerts = () => {
    // Sample tactical alerts based on strategy
    if (strategy) {
      addTacticalAlert({
        type: 'info',
        priority: 'important',
        title: '🧠 Strategy Loaded',
        message: `AI strategy ready: ${strategy.strategy.overallApproach.slice(0, 50)}...`,
        action: 'View Full Strategy'
      });

      if (strategy.strategy.startStrategy) {
        addTacticalAlert({
          type: 'info',
          priority: 'important',
          title: '🏁 Start Plan',
          message: strategy.strategy.startStrategy.action,
          action: 'Review Start Strategy'
        });
      }
    }
  };

  const setStartTime = (minutesToStart: number) => {
    const startTime = new Date(Date.now() + (minutesToStart * 60 * 1000));
    setRaceTimer(prev => ({
      ...prev,
      startTime,
      timeToStart: minutesToStart * 60,
      raceStarted: false
    }));

    addTacticalAlert({
      type: 'start_sequence',
      priority: 'important',
      title: '⏰ Start Time Set',
      message: `Race starts at ${startTime.toLocaleTimeString()}`,
    });

    // Reset alert flags
    alertSoundsRef.current = {};
  };

  const addRaceNote = (note: string) => {
    const timestamp = raceTimer.raceStarted
      ? `T+${Math.floor(raceTimer.raceElapsed / 60)}:${String(raceTimer.raceElapsed % 60).padStart(2, '0')}`
      : `T-${Math.floor(raceTimer.timeToStart / 60)}:${String(raceTimer.timeToStart % 60).padStart(2, '0')}`;

    const fullNote = `${timestamp}: ${note}`;
    setRaceNotes(prev => [fullNote, ...prev]);

    addTacticalAlert({
      type: 'info',
      priority: 'info',
      title: '📝 Note Added',
      message: fullNote
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins}:${String(secs).padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (!raceTimer.startTime) return '#666666';
    if (raceTimer.raceStarted) return '#00CC44';
    if (raceTimer.timeToStart <= 60) return '#FF4444';
    if (raceTimer.timeToStart <= 300) return '#FFD700';
    return '#0066CC';
  };

  const getCurrentPhase = (): string => {
    if (!raceTimer.startTime) return 'Pre-Race Setup';
    if (!raceTimer.raceStarted) {
      if (raceTimer.timeToStart > 600) return 'Preparation';
      if (raceTimer.timeToStart > 300) return 'Pre-Start';
      if (raceTimer.timeToStart > 60) return 'Start Sequence';
      return 'Final Approach';
    }

    // Race phases based on elapsed time
    if (raceTimer.raceElapsed < 600) return 'First Beat';
    if (raceTimer.raceElapsed < 1200) return 'First Run';
    if (raceTimer.raceElapsed < 1800) return 'Second Beat';
    return 'Final Leg';
  };

  const renderOverviewScreen = () => (
    <View style={styles.screenContainer}>
      {/* Main Timer Display */}
      <View style={[styles.timerContainer, { borderColor: getTimerColor() }]}>
        <Text style={[styles.timerText, { color: getTimerColor() }]}>
          {raceTimer.startTime
            ? formatTime(raceTimer.raceStarted ? raceTimer.raceElapsed : raceTimer.timeToStart)
            : '--:--'
          }
        </Text>
        <Text style={styles.phaseText}>
          {getCurrentPhase()}
        </Text>
        {currentVenue && (
          <Text style={styles.venueText}>
            📍 {currentVenue.name}
          </Text>
        )}
      </View>

      {/* Tactical Summary */}
      {strategy && (
        <View style={styles.tacticalSummary}>
          <Text style={styles.summaryTitle}>🎯 Current Focus</Text>
          <Text style={styles.summaryText}>
            {getCurrentPhase() === 'First Beat' && strategy.strategy.beatStrategy[0]?.action}
            {getCurrentPhase() === 'Start Sequence' && strategy.strategy.startStrategy.action}
            {getCurrentPhase() === 'Preparation' && 'Review strategy and prepare boat'}
            {!['First Beat', 'Start Sequence', 'Preparation'].includes(getCurrentPhase()) && 'Execute race plan'}
          </Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={[styles.quickActionButton, styles.startButton]}
          onPress={() => setStartTime(10)}
        >
          <Ionicons name="flag" size={32} color="white" />
          <Text style={styles.quickActionText}>10 Min Start</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, styles.noteButton]}
          onPress={() => addRaceNote('Manual observation')}
        >
          <Ionicons name="create" size={32} color="white" />
          <Text style={styles.quickActionText}>Add Note</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, styles.tacticalButton]}
          onPress={() => setActiveView('tactical')}
        >
          <Ionicons name="compass" size={32} color="white" />
          <Text style={styles.quickActionText}>Tactical</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, styles.emergencyButton]}
          onPress={() => {
            setActiveView('emergency');
            onEmergencyAlert?.();
          }}
        >
          <Ionicons name="warning" size={32} color="white" />
          <Text style={styles.quickActionText}>Emergency</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTacticalScreen = () => (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>🧭 Tactical Intelligence</Text>

      {strategy && (
        <View style={styles.tacticalContent}>
          <View style={styles.tacticalCard}>
            <Text style={styles.cardTitle}>Current Strategy</Text>
            <Text style={styles.cardText}>
              {getCurrentPhase() === 'First Beat' && strategy.strategy.beatStrategy[0]?.rationale}
              {getCurrentPhase() === 'Start Sequence' && strategy.strategy.startStrategy.rationale}
              {getCurrentPhase() === 'Preparation' && strategy.strategy.overallApproach}
            </Text>
          </View>

          {currentVenue && (
            <View style={styles.tacticalCard}>
              <Text style={styles.cardTitle}>Local Knowledge</Text>
              <Text style={styles.cardText}>
                {currentVenue.localKnowledge.expertTips[0] || 'No specific tips available'}
              </Text>
            </View>
          )}

          <View style={styles.tacticalCard}>
            <Text style={styles.cardTitle}>Next Action</Text>
            <Text style={styles.cardText}>
              Execute current phase strategy and monitor conditions
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderConditionsScreen = () => (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>🌊 Conditions</Text>

      <View style={styles.conditionsGrid}>
        <View style={styles.conditionCard}>
          <Text style={styles.conditionLabel}>Wind</Text>
          <Text style={styles.conditionValue}>
            {currentConditions?.wind.speed || '--'} kt
          </Text>
          <Text style={styles.conditionDirection}>
            {currentConditions?.wind.direction || '--'}°
          </Text>
        </View>

        <View style={styles.conditionCard}>
          <Text style={styles.conditionLabel}>Current</Text>
          <Text style={styles.conditionValue}>
            {currentConditions?.current.speed || '--'} kt
          </Text>
          <Text style={styles.conditionDirection}>
            {currentConditions?.current.tidePhase || '--'}
          </Text>
        </View>

        <View style={styles.conditionCard}>
          <Text style={styles.conditionLabel}>Waves</Text>
          <Text style={styles.conditionValue}>
            {currentConditions?.waves.height || '--'} m
          </Text>
          <Text style={styles.conditionDirection}>
            {currentConditions?.waves.period || '--'}s
          </Text>
        </View>

        <View style={styles.conditionCard}>
          <Text style={styles.conditionLabel}>Risk</Text>
          <Text style={styles.conditionValue}>
            {currentConditions?.weatherRisk || 'Unknown'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmergencyScreen = () => (
    <View style={[styles.screenContainer, styles.emergencyContainer]}>
      <Text style={styles.emergencyTitle}>⚠️ EMERGENCY</Text>

      <View style={styles.emergencyActions}>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => Alert.alert('Emergency', 'This would trigger emergency protocols')}
        >
          <Ionicons name="call" size={48} color="white" />
          <Text style={styles.emergencyButtonText}>Call Emergency</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => Alert.alert('MOB', 'This would trigger man overboard procedures')}
        >
          <Ionicons name="person" size={48} color="white" />
          <Text style={styles.emergencyButtonText}>Man Overboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => Alert.alert('Abandon', 'This would signal race abandonment')}
        >
          <Ionicons name="flag" size={48} color="white" />
          <Text style={styles.emergencyButtonText}>Abandon Race</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setActiveView('overview')}
      >
        <Text style={styles.backButtonText}>Return to Race</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Alerts Bar */}
      {tacticalAlerts.filter(alert => !alert.acknowledged).length > 0 && (
        <View style={styles.alertsContainer}>
          {tacticalAlerts.filter(alert => !alert.acknowledged).slice(0, 2).map(alert => (
            <TouchableOpacity
              key={alert.id}
              style={[styles.alertCard, styles[`${alert.priority}Alert`]]}
              onPress={() => acknowledgeAlert(alert.id)}
            >
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Screen Content */}
      <View style={styles.mainContent}>
        {activeView === 'overview' && renderOverviewScreen()}
        {activeView === 'tactical' && renderTacticalScreen()}
        {activeView === 'conditions' && renderConditionsScreen()}
        {activeView === 'emergency' && renderEmergencyScreen()}
      </View>

      {/* Navigation Bar */}
      {activeView !== 'emergency' && (
        <View style={styles.navigationBar}>
          {(['overview', 'tactical', 'conditions'] as const).map(view => (
            <TouchableOpacity
              key={view}
              style={[styles.navButton, activeView === view && styles.activeNavButton]}
              onPress={() => setActiveView(view)}
            >
              <Ionicons
                name={
                  view === 'overview' ? 'home' :
                  view === 'tactical' ? 'compass' : 'cloudy'
                }
                size={24}
                color={activeView === view ? '#0066CC' : '#666'}
              />
              <Text style={[
                styles.navButtonText,
                activeView === view && styles.activeNavButtonText
              ]}>
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // High contrast for sunlight
  },
  mainContent: {
    flex: 1,
    padding: isTablet ? 24 : 16,
  },
  screenContainer: {
    flex: 1,
  },

  // Timer Display
  timerContainer: {
    alignItems: 'center',
    padding: isTablet ? 32 : 24,
    marginBottom: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 3,
  },
  timerText: {
    fontSize: isTablet ? 84 : 64,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  phaseText: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: '600',
    color: '#CCCCCC',
    marginTop: 8,
  },
  venueText: {
    fontSize: isTablet ? 18 : 16,
    color: '#00FF88',
    marginTop: 4,
  },

  // Tactical Summary
  tacticalSummary: {
    backgroundColor: '#0D1B2A',
    padding: isTablet ? 24 : 20,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#00FF88',
  },
  summaryTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#00FF88',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: isTablet ? 18 : 16,
    color: '#FFFFFF',
    lineHeight: isTablet ? 24 : 22,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isTablet ? 16 : 12,
    marginTop: 'auto',
  },
  quickActionButton: {
    flex: 1,
    minWidth: isTablet ? 160 : 140,
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  quickActionText: {
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#00CC44',
  },
  noteButton: {
    backgroundColor: '#0066CC',
  },
  tacticalButton: {
    backgroundColor: '#FF8000',
  },
  emergencyButton: {
    backgroundColor: '#FF4444',
  },

  // Screen Titles
  screenTitle: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },

  // Tactical Screen
  tacticalContent: {
    gap: 16,
  },
  tacticalCard: {
    backgroundColor: '#1A1A1A',
    padding: isTablet ? 24 : 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00FF88',
  },
  cardTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#00FF88',
    marginBottom: 12,
  },
  cardText: {
    fontSize: isTablet ? 18 : 16,
    color: '#FFFFFF',
    lineHeight: isTablet ? 24 : 22,
  },

  // Conditions Screen
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isTablet ? 16 : 12,
  },
  conditionCard: {
    flex: 1,
    minWidth: isTablet ? 160 : 140,
    backgroundColor: '#1A1A1A',
    padding: isTablet ? 24 : 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  conditionLabel: {
    fontSize: isTablet ? 16 : 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  conditionValue: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: '900',
    color: '#00FF88',
  },
  conditionDirection: {
    fontSize: isTablet ? 16 : 14,
    color: '#CCCCCC',
    marginTop: 4,
  },

  // Emergency Screen
  emergencyContainer: {
    backgroundColor: '#330000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isTablet ? 32 : 24,
  },
  emergencyTitle: {
    fontSize: isTablet ? 48 : 40,
    fontWeight: '900',
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 48,
  },
  emergencyActions: {
    gap: 24,
    alignItems: 'center',
    marginBottom: 48,
  },
  backButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    color: 'white',
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },

  // Alerts
  alertsContainer: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  alertCard: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  criticalAlert: {
    backgroundColor: '#4D1A1A',
    borderLeftColor: '#FF4444',
  },
  importantAlert: {
    backgroundColor: '#1A2A4D',
    borderLeftColor: '#0066CC',
  },
  infoAlert: {
    backgroundColor: '#1A4D1A',
    borderLeftColor: '#00CC44',
  },
  alertTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertMessage: {
    fontSize: isTablet ? 14 : 12,
    color: '#CCCCCC',
    marginTop: 2,
  },

  // Navigation
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavButton: {
    backgroundColor: '#0D1B2A',
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: isTablet ? 14 : 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '600',
  },
  activeNavButtonText: {
    color: '#0066CC',
  },
});

export default RaceDayInterface;