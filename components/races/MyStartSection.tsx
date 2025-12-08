/**
 * MyStartSection Component
 * 
 * Personalized race start information showing:
 * - Your class start time
 * - Your class flag
 * - How many minutes after warning signal
 * - Which class starts immediately before you
 * 
 * Helps sailors quickly understand their specific start timing.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flag, Clock, Users, AlertCircle, ChevronRight } from 'lucide-react-native';

export interface StartSequenceEntry {
  class: string;
  warning: string;
  start: string;
  flag?: string;
}

interface MyStartSectionProps {
  /** The full start sequence for all classes */
  startSequence: StartSequenceEntry[];
  /** User's boat class (e.g., "Dragon", "J/70") */
  userBoatClass?: string;
  /** First warning signal time (e.g., "10:55") */
  warningSignalTime?: string;
  /** Class interval in minutes */
  classIntervalMinutes?: number;
  /** Whether to show in compact mode */
  compact?: boolean;
}

export function MyStartSection({
  startSequence,
  userBoatClass,
  warningSignalTime,
  classIntervalMinutes = 5,
  compact = false,
}: MyStartSectionProps) {
  // Find the user's class in the start sequence
  const myStartInfo = useMemo(() => {
    if (!userBoatClass || !startSequence?.length) return null;
    
    const normalizedUserClass = userBoatClass.toLowerCase().trim();
    
    const myIndex = startSequence.findIndex(entry => 
      entry.class.toLowerCase().trim().includes(normalizedUserClass) ||
      normalizedUserClass.includes(entry.class.toLowerCase().trim())
    );
    
    if (myIndex === -1) return null;
    
    const myEntry = startSequence[myIndex];
    const classBefore = myIndex > 0 ? startSequence[myIndex - 1] : null;
    const classAfter = myIndex < startSequence.length - 1 ? startSequence[myIndex + 1] : null;
    
    // Calculate minutes after first warning
    let minutesAfterWarning = 0;
    if (warningSignalTime && myEntry.warning) {
      minutesAfterWarning = calculateTimeDifferenceMinutes(warningSignalTime, myEntry.warning);
    } else {
      // Estimate based on position and interval
      minutesAfterWarning = myIndex * classIntervalMinutes;
    }
    
    return {
      entry: myEntry,
      classBefore,
      classAfter,
      position: myIndex + 1,
      totalClasses: startSequence.length,
      minutesAfterWarning,
    };
  }, [startSequence, userBoatClass, warningSignalTime, classIntervalMinutes]);

  // If user's class not found in sequence, show guidance
  if (!myStartInfo) {
    if (!userBoatClass) {
      return (
        <View style={[styles.container, styles.warningContainer]}>
          <AlertCircle size={16} color="#F59E0B" />
          <Text style={styles.warningText}>
            Set your boat class to see your personalized start info
          </Text>
        </View>
      );
    }
    
    if (!startSequence?.length) {
      return (
        <View style={[styles.container, styles.infoContainer]}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.infoText}>
            Start sequence not available yet
          </Text>
        </View>
      );
    }
    
    return (
      <View style={[styles.container, styles.warningContainer]}>
        <AlertCircle size={16} color="#F59E0B" />
        <Text style={styles.warningText}>
          Your class ({userBoatClass}) not found in start sequence
        </Text>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Flag size={14} color="#3B82F6" />
          <Text style={styles.compactTitle}>Your Start</Text>
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTime}>{myStartInfo.entry.start}</Text>
          {myStartInfo.entry.flag && (
            <View style={styles.compactFlagBadge}>
              <Text style={styles.compactFlagText}>{myStartInfo.entry.flag}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Flag size={20} color="#3B82F6" />
          <Text style={styles.title}>Your Start</Text>
        </View>
        <View style={styles.positionBadge}>
          <Text style={styles.positionText}>
            Start {myStartInfo.position} of {myStartInfo.totalClasses}
          </Text>
        </View>
      </View>

      {/* Main start info card */}
      <View style={styles.mainCard}>
        <View style={styles.classRow}>
          <Text style={styles.className}>{myStartInfo.entry.class}</Text>
          {myStartInfo.entry.flag && (
            <View style={styles.flagBadge}>
              <Flag size={14} color="#FFFFFF" />
              <Text style={styles.flagText}>{myStartInfo.entry.flag}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.timesRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Warning</Text>
            <Text style={styles.timeValue}>{myStartInfo.entry.warning || '—'}</Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Start</Text>
            <Text style={[styles.timeValue, styles.startTime]}>{myStartInfo.entry.start || '—'}</Text>
          </View>
        </View>
        
        {myStartInfo.minutesAfterWarning > 0 && (
          <View style={styles.offsetRow}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.offsetText}>
              {myStartInfo.minutesAfterWarning} min after first warning signal
            </Text>
          </View>
        )}
      </View>

      {/* Class before (important for timing) */}
      {myStartInfo.classBefore && (
        <View style={styles.adjacentClassCard}>
          <View style={styles.adjacentHeader}>
            <Users size={14} color="#6B7280" />
            <Text style={styles.adjacentLabel}>Starts before you</Text>
          </View>
          <View style={styles.adjacentContent}>
            <Text style={styles.adjacentClassName}>{myStartInfo.classBefore.class}</Text>
            <Text style={styles.adjacentTime}>
              {myStartInfo.classBefore.start}
              {myStartInfo.classBefore.flag && ` • ${myStartInfo.classBefore.flag}`}
            </Text>
          </View>
          <Text style={styles.adjacentTip}>
            Watch for their start gun as your {classIntervalMinutes || 5}-minute warning
          </Text>
        </View>
      )}

      {/* Class after (useful context) */}
      {myStartInfo.classAfter && (
        <View style={[styles.adjacentClassCard, styles.afterCard]}>
          <View style={styles.adjacentHeader}>
            <Users size={14} color="#9CA3AF" />
            <Text style={styles.adjacentLabel}>Starts after you</Text>
          </View>
          <View style={styles.adjacentContent}>
            <Text style={[styles.adjacentClassName, styles.afterClassName]}>
              {myStartInfo.classAfter.class}
            </Text>
            <Text style={styles.adjacentTime}>
              {myStartInfo.classAfter.start}
              {myStartInfo.classAfter.flag && ` • ${myStartInfo.classAfter.flag}`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Calculate the difference in minutes between two time strings (HH:MM format)
 */
function calculateTimeDifferenceMinutes(time1: string, time2: string): number {
  try {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    
    return Math.abs(minutes2 - minutes1);
  } catch {
    return 0;
  }
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  positionBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  positionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  
  // Main card
  mainCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 8,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  className: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E40AF',
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  flagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  startTime: {
    color: '#059669',
  },
  offsetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
  },
  offsetText: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Adjacent class cards
  adjacentClassCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  afterCard: {
    backgroundColor: '#FAFAFA',
    borderColor: '#F3F4F6',
  },
  adjacentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  adjacentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adjacentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adjacentClassName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  afterClassName: {
    color: '#6B7280',
  },
  adjacentTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  adjacentTip: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 6,
  },
  
  // Warning/Info states
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
  },
  
  // Compact styles
  compactContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  compactTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E40AF',
  },
  compactFlagBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  compactFlagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

