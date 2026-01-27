/**
 * PreRaceBriefingCard Component
 * Card for generating and viewing pre-race briefings
 * Includes generate button, preview, and share options
 */

import { RaceBriefingService, type RaceBriefing } from '@/services/RaceBriefingService';
import * as Clipboard from 'expo-clipboard';
import {
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Clock,
    Copy,
    FileText,
    Radio,
    Share2,
    Sparkles,
    Target,
    Wind,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface PreRaceBriefingCardProps {
  raceId: string;
  raceName: string;
  raceType?: 'fleet' | 'distance';
  userBoatClass?: string;
}

export function PreRaceBriefingCard({
  raceId,
  raceName,
  raceType = 'fleet',
  userBoatClass,
}: PreRaceBriefingCardProps) {
  const [briefing, setBriefing] = useState<RaceBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const generateBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await RaceBriefingService.generateBriefing(raceId, {
        includeWeather: true,
        includeStrategy: true,
        userBoatClass,
        useAI: true,
      });
      
      if (result) {
        setBriefing(result);
        setIsExpanded(true);
      } else {
        setError('Failed to generate briefing. Please try again.');
      }
    } catch (err) {
      console.error('[PreRaceBriefingCard] Error:', err);
      setError('An error occurred while generating the briefing.');
    } finally {
      setLoading(false);
    }
  }, [raceId, userBoatClass]);

  const handleShare = useCallback(async () => {
    if (!briefing) return;
    
    const text = RaceBriefingService.formatAsText(briefing);

    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        const { Share } = await import('react-native');
        await Share.share({
          message: text,
          title: `Pre-Race Briefing: ${raceName}`,
        });
      }
    } catch (err) {
      console.error('[PreRaceBriefingCard] Share error:', err);
    }
  }, [briefing, raceName]);

  const handleCopy = useCallback(async () => {
    if (!briefing) return;
    
    const text = RaceBriefingService.formatAsText(briefing);
    await Clipboard.setStringAsync(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [briefing]);

  const getPriorityColor = (priority: 'critical' | 'important' | 'consider') => {
    switch (priority) {
      case 'critical':
        return '#DC2626';
      case 'important':
        return '#F59E0B';
      default:
        return '#64748B';
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={() => briefing && setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerLeft}>
          <FileText size={20} color="#7C3AED" />
          <Text style={styles.title}>Pre-Race Briefing</Text>
        </View>
        {briefing && (
          isExpanded ? (
            <ChevronUp size={20} color="#64748B" />
          ) : (
            <ChevronDown size={20} color="#64748B" />
          )
        )}
      </Pressable>

      {/* Generate Button (shown when no briefing) */}
      {!briefing && !loading && (
        <Pressable
          style={styles.generateButton}
          onPress={generateBriefing}
        >
          <Sparkles size={18} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>Generate Briefing</Text>
        </Pressable>
      )}

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Generating your race briefing...</Text>
          <Text style={styles.loadingSubtext}>Analyzing conditions and strategy</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <AlertTriangle size={20} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={generateBriefing}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {/* Briefing Content */}
      {briefing && isExpanded && (
        <View style={styles.content}>
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton} onPress={handleShare}>
              <Share2 size={16} color="#7C3AED" />
              <Text style={styles.actionButtonText}>Share</Text>
            </Pressable>
            <Pressable 
              style={[styles.actionButton, copySuccess && styles.actionButtonSuccess]} 
              onPress={handleCopy}
            >
              <Copy size={16} color={copySuccess ? '#10B981' : '#7C3AED'} />
              <Text style={[styles.actionButtonText, copySuccess && styles.actionButtonTextSuccess]}>
                {copySuccess ? 'Copied!' : 'Copy'}
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.actionButton, styles.regenerateButton]} 
              onPress={generateBriefing}
              disabled={loading}
            >
              <Sparkles size={16} color="#64748B" />
              <Text style={[styles.actionButtonText, { color: '#64748B' }]}>Regenerate</Text>
            </Pressable>
          </View>

          {/* Conditions Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conditions</Text>
            <View style={styles.conditionsRow}>
              <View style={styles.conditionItem}>
                <Wind size={16} color="#0284C7" />
                <Text style={styles.conditionValue}>
                  {briefing.conditions.wind.direction} {briefing.conditions.wind.speedMin}-{briefing.conditions.wind.speedMax} kts
                </Text>
              </View>
              <View style={styles.conditionItem}>
                <Text style={styles.conditionLabel}>Tide:</Text>
                <Text style={styles.conditionValue}>{briefing.conditions.tide.summary}</Text>
              </View>
            </View>
          </View>

          {/* Key Strategic Points */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Target size={16} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Key Strategic Points</Text>
            </View>
            {briefing.strategy.keyPoints.map((point, index) => (
              <View key={index} style={styles.strategyPoint}>
                <View 
                  style={[
                    styles.priorityIndicator,
                    { backgroundColor: getPriorityColor(point.priority) }
                  ]} 
                />
                <View style={styles.strategyPointContent}>
                  <Text style={styles.strategyPointTitle}>{point.title}</Text>
                  <Text style={styles.strategyPointText}>{point.content}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Decision Points */}
          {briefing.strategy.decisionPoints.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Decision Points</Text>
              {briefing.strategy.decisionPoints.map((decision, index) => (
                <View key={index} style={styles.decisionPoint}>
                  <Text style={styles.decisionQuestion}>□ {decision.question}</Text>
                  <View style={styles.decisionOptions}>
                    {decision.options.map((option, optIndex) => (
                      <Text key={optIndex} style={styles.decisionOption}>• {option}</Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Warnings */}
          {briefing.strategy.warnings.length > 0 && (
            <View style={styles.warningsSection}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={16} color="#F59E0B" />
                <Text style={[styles.sectionTitle, { color: '#92400E' }]}>Warnings</Text>
              </View>
              {briefing.strategy.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>• {warning}</Text>
              ))}
            </View>
          )}

          {/* Important Times */}
          {briefing.importantTimes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={16} color="#64748B" />
                <Text style={styles.sectionTitle}>Important Times</Text>
              </View>
              {briefing.importantTimes.map((time, index) => (
                <View key={index} style={styles.timeRow}>
                  <Text style={styles.timeLabel}>• {time.label}:</Text>
                  <Text style={styles.timeValue}>{time.time}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Communications */}
          {briefing.communications.vhfChannel && (
            <View style={styles.commsSection}>
              <View style={styles.sectionHeader}>
                <Radio size={16} color="#64748B" />
                <Text style={styles.sectionTitle}>Communications</Text>
              </View>
              <Text style={styles.commsText}>
                VHF: Channel {briefing.communications.vhfChannel}
                {briefing.communications.safetyChannel && ` • Safety: ${briefing.communications.safetyChannel}`}
              </Text>
            </View>
          )}

          {/* Generated timestamp */}
          <Text style={styles.timestamp}>
            Generated {new Date(briefing.generatedAt).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Collapsed Preview */}
      {briefing && !isExpanded && (
        <Pressable style={styles.collapsedPreview} onPress={() => setIsExpanded(true)}>
          <Text style={styles.collapsedText} numberOfLines={2}>
            {briefing.strategy.keyPoints[0]?.content || 'Tap to view briefing'}
          </Text>
          <Text style={styles.expandPrompt}>Tap to expand</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#1E293B',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  content: {
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 6,
  },
  actionButtonSuccess: {
    backgroundColor: '#ECFDF5',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  actionButtonTextSuccess: {
    color: '#10B981',
  },
  regenerateButton: {
    backgroundColor: '#F1F5F9',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  conditionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  strategyPoint: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  priorityIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 10,
  },
  strategyPointContent: {
    flex: 1,
  },
  strategyPointTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  strategyPointText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  decisionPoint: {
    marginBottom: 10,
  },
  decisionQuestion: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  decisionOptions: {
    marginLeft: 16,
  },
  decisionOption: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  warningsSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 13,
    color: '#64748B',
    marginRight: 4,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  commsSection: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  commsText: {
    fontSize: 13,
    color: '#374151',
  },
  timestamp: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  collapsedPreview: {
    paddingVertical: 8,
  },
  collapsedText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  expandPrompt: {
    fontSize: 11,
    color: '#7C3AED',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default PreRaceBriefingCard;

