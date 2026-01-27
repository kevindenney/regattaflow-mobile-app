/**
 * ScoringCalculator
 *
 * Displays scoring system information and provides a simple
 * series points calculator for understanding race standings.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Trophy,
  Check,
  Info,
  Calculator,
  Minus,
  ChevronDown,
} from 'lucide-react-native';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray2: '#636366',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
};

// Common scoring systems
const SCORING_SYSTEMS = [
  {
    id: 'low_point',
    name: 'Low Point',
    description: 'Standard RRS Appendix A scoring where lower points win',
    formula: '1st=1, 2nd=2, 3rd=3, etc.',
  },
  {
    id: 'bonus_point',
    name: 'Bonus Point',
    description: 'First places weighted less, rewards consistency',
    formula: '1st=0, 2nd=3, 3rd=5.7, 4th=8, etc.',
  },
  {
    id: 'high_point',
    name: 'High Point',
    description: 'Higher points win, used in some match racing',
    formula: '1st=fleet size, 2nd=fleet size-1, etc.',
  },
];

// Discard rules
const DISCARD_RULES = [
  { races: '1-3', discards: 0 },
  { races: '4-5', discards: 1 },
  { races: '6-8', discards: 2 },
  { races: '9-11', discards: 3 },
  { races: '12+', discards: 4 },
];

interface ScoringCalculatorProps extends ChecklistToolProps {
  /** Scoring system from SI */
  scoringSystem?: string;
  /** Discard policy from SI */
  discardPolicy?: string;
  /** Fleet size */
  fleetSize?: number;
}

export function ScoringCalculator({
  item,
  regattaId,
  onComplete,
  onCancel,
  scoringSystem,
  discardPolicy,
  fleetSize: initialFleetSize,
}: ScoringCalculatorProps) {
  const [selectedSystem, setSelectedSystem] = useState(scoringSystem || 'low_point');
  const [fleetSize, setFleetSize] = useState(initialFleetSize?.toString() || '20');
  const [raceResults, setRaceResults] = useState<string[]>(['1', '3', '5', '2', '4']);
  const [showCalculator, setShowCalculator] = useState(false);

  // Helper to calculate discards based on number of races
  // Must be defined before useMemo that uses it
  const getDiscards = useCallback((numRaces: number) => {
    if (numRaces <= 3) return 0;
    if (numRaces <= 5) return 1;
    if (numRaces <= 8) return 2;
    if (numRaces <= 11) return 3;
    return 4;
  }, []);

  // Calculate points based on results
  const calculatedPoints = useMemo(() => {
    const fleet = parseInt(fleetSize, 10) || 20;
    const points = raceResults.map((result) => {
      const pos = parseInt(result, 10);
      if (isNaN(pos) || pos < 1) return null;

      // DNS/DNF/DSQ = fleet + 1
      if (pos > fleet) return fleet + 1;

      // Low point scoring
      return pos;
    });

    // Calculate total with discards
    const validPoints = points.filter((p): p is number => p !== null);
    const numDiscards = getDiscards(validPoints.length);

    // Sort to find worst results
    const sorted = [...validPoints].sort((a, b) => b - a);
    const discarded = sorted.slice(0, numDiscards);
    const counted = validPoints.filter((_, i) => {
      const p = validPoints[i];
      const discardIndex = discarded.indexOf(p);
      if (discardIndex >= 0) {
        discarded.splice(discardIndex, 1);
        return false;
      }
      return true;
    });

    const total = counted.reduce((sum, p) => sum + p, 0);

    return {
      points,
      total,
      numDiscards,
    };
  }, [raceResults, fleetSize, getDiscards]);

  const handleAddRace = useCallback(() => {
    setRaceResults((prev) => [...prev, '']);
  }, []);

  const handleRemoveRace = useCallback((index: number) => {
    setRaceResults((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateResult = useCallback((index: number, value: string) => {
    setRaceResults((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={IOS_COLORS.gray} />
        </Pressable>
        <Text style={styles.headerTitle}>Scoring System</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentInner}
      >
        {/* Icon Header */}
        <View style={styles.iconHeader}>
          <View style={styles.iconCircle}>
            <Trophy size={32} color={IOS_COLORS.orange} />
          </View>
          <Text style={styles.title}>Understanding Scoring</Text>
          <Text style={styles.subtitle}>
            Know how your results translate to series points
          </Text>
        </View>

        {/* Scoring System Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scoring System</Text>
          {SCORING_SYSTEMS.map((system) => (
            <Pressable
              key={system.id}
              style={[
                styles.systemCard,
                selectedSystem === system.id && styles.systemCardSelected,
              ]}
              onPress={() => setSelectedSystem(system.id)}
            >
              <View style={styles.systemHeader}>
                <Text
                  style={[
                    styles.systemName,
                    selectedSystem === system.id && styles.systemNameSelected,
                  ]}
                >
                  {system.name}
                </Text>
                {selectedSystem === system.id && (
                  <Check size={18} color={IOS_COLORS.blue} />
                )}
              </View>
              <Text style={styles.systemDescription}>{system.description}</Text>
              <View style={styles.formulaRow}>
                <Calculator size={14} color={IOS_COLORS.secondaryLabel} />
                <Text style={styles.formulaText}>{system.formula}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Discard Rules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discard Rules (Throw-outs)</Text>
          <View style={styles.discardCard}>
            <View style={styles.discardGrid}>
              <View style={styles.discardHeaderRow}>
                <Text style={styles.discardHeaderCell}>Races</Text>
                <Text style={styles.discardHeaderCell}>Discards</Text>
              </View>
              {DISCARD_RULES.map((rule) => (
                <View key={rule.races} style={styles.discardRow}>
                  <Text style={styles.discardCell}>{rule.races}</Text>
                  <Text style={styles.discardCell}>{rule.discards}</Text>
                </View>
              ))}
            </View>
            <View style={styles.infoRow}>
              <Info size={14} color={IOS_COLORS.blue} />
              <Text style={styles.infoText}>
                Your worst result(s) are dropped after completing enough races
              </Text>
            </View>
          </View>
        </View>

        {/* Points Calculator */}
        <Pressable
          style={styles.calculatorToggle}
          onPress={() => setShowCalculator(!showCalculator)}
        >
          <View style={styles.calculatorToggleLeft}>
            <Calculator size={20} color={IOS_COLORS.purple} />
            <Text style={styles.calculatorToggleText}>Points Calculator</Text>
          </View>
          <ChevronDown
            size={20}
            color={IOS_COLORS.gray}
            style={{
              transform: [{ rotate: showCalculator ? '180deg' : '0deg' }],
            }}
          />
        </Pressable>

        {showCalculator && (
          <View style={styles.calculatorSection}>
            {/* Fleet Size */}
            <View style={styles.fleetSizeRow}>
              <Text style={styles.fleetSizeLabel}>Fleet Size:</Text>
              <TextInput
                style={styles.fleetSizeInput}
                value={fleetSize}
                onChangeText={setFleetSize}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>

            {/* Race Results */}
            <Text style={styles.resultsTitle}>Enter Your Results</Text>
            <View style={styles.resultsGrid}>
              {raceResults.map((result, index) => (
                <View key={index} style={styles.resultInputRow}>
                  <Text style={styles.resultLabel}>R{index + 1}</Text>
                  <TextInput
                    style={styles.resultInput}
                    value={result}
                    onChangeText={(v) => handleUpdateResult(index, v)}
                    keyboardType="number-pad"
                    maxLength={3}
                    placeholder="—"
                    placeholderTextColor={IOS_COLORS.tertiaryLabel}
                  />
                  <Text style={styles.resultPoints}>
                    {calculatedPoints.points[index] ?? '—'} pts
                  </Text>
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => handleRemoveRace(index)}
                  >
                    <Minus size={16} color={IOS_COLORS.red} />
                  </Pressable>
                </View>
              ))}
            </View>

            <Pressable style={styles.addRaceButton} onPress={handleAddRace}>
              <Text style={styles.addRaceText}>+ Add Race</Text>
            </Pressable>

            {/* Total */}
            <View style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Points</Text>
                <Text style={styles.totalValue}>{calculatedPoints.total}</Text>
              </View>
              <Text style={styles.totalNote}>
                ({calculatedPoints.numDiscards} discard{calculatedPoints.numDiscards !== 1 ? 's' : ''} applied)
              </Text>
            </View>
          </View>
        )}

        {/* Key Points */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Key Points</Text>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              DNS, DNF, DSQ score fleet size + 1 points
            </Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Discards let you drop your worst race(s)
            </Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Check the SI for any modified scoring rules
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Pressable style={styles.completeButton} onPress={handleComplete}>
          <Check size={20} color="#FFFFFF" />
          <Text style={styles.completeButtonText}>Got It</Text>
        </Pressable>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 40,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${IOS_COLORS.orange}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  systemCard: {
    padding: 14,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  systemCardSelected: {
    borderColor: IOS_COLORS.blue,
    backgroundColor: `${IOS_COLORS.blue}08`,
  },
  systemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  systemName: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  systemNameSelected: {
    color: IOS_COLORS.blue,
  },
  systemDescription: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 8,
  },
  formulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formulaText: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  discardCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
  },
  discardGrid: {
    marginBottom: 12,
  },
  discardHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    paddingBottom: 8,
    marginBottom: 8,
  },
  discardHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
  },
  discardRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  discardCell: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  calculatorToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    marginBottom: 12,
  },
  calculatorToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calculatorToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.purple,
  },
  calculatorSection: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  fleetSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  fleetSizeLabel: {
    fontSize: 15,
    color: IOS_COLORS.label,
  },
  fleetSizeInput: {
    width: 60,
    padding: 10,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 10,
  },
  resultsGrid: {
    gap: 8,
  },
  resultInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultLabel: {
    width: 30,
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  resultInput: {
    width: 50,
    padding: 10,
    backgroundColor: IOS_COLORS.background,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  resultPoints: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${IOS_COLORS.red}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRaceButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addRaceText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  totalCard: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    alignItems: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: IOS_COLORS.blue,
  },
  totalNote: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },
  tipsCard: {
    backgroundColor: `${IOS_COLORS.blue}08`,
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.blue,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.green,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ScoringCalculator;
