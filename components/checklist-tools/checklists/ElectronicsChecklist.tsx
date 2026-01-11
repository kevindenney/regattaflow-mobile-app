/**
 * ElectronicsChecklist
 *
 * A specialized checklist for verifying electronics are charged and ready.
 * Uses the InteractiveChecklist pattern but with electronics-specific defaults.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  ChevronLeft,
  Circle,
  CheckCircle2,
  Battery,
  Smartphone,
  Radio,
  Navigation,
  Camera,
  Watch,
  Zap,
  BatteryWarning,
} from 'lucide-react-native';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray2: '#636366',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

// Default electronics items
interface ElectronicItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  chargeLevel?: 'full' | 'partial' | 'low' | 'unknown';
}

const DEFAULT_ELECTRONICS: ElectronicItem[] = [
  {
    id: 'gps',
    label: 'GPS / Chartplotter',
    description: 'Check battery level is 100%',
    icon: <Navigation size={22} color={IOS_COLORS.blue} />,
  },
  {
    id: 'vhf',
    label: 'VHF Radio',
    description: 'Transmit/receive test completed',
    icon: <Radio size={22} color={IOS_COLORS.green} />,
  },
  {
    id: 'phone',
    label: 'Phone / Backup Nav',
    description: 'Charged with waterproof case ready',
    icon: <Smartphone size={22} color={IOS_COLORS.gray2} />,
  },
  {
    id: 'camera',
    label: 'Camera',
    description: 'For finish photos and protests',
    icon: <Camera size={22} color={IOS_COLORS.orange} />,
  },
  {
    id: 'watch',
    label: 'Watch / Timer',
    description: 'Charged and countdown tested',
    icon: <Watch size={22} color={IOS_COLORS.red} />,
  },
];

interface ElectronicsChecklistProps extends ChecklistToolProps {}

export function ElectronicsChecklist({
  item,
  raceEventId,
  boatId,
  onComplete,
  onCancel,
}: ElectronicsChecklistProps) {
  // Get items from config or use defaults
  const electronicItems: ElectronicItem[] = useMemo(() => {
    if (item.toolConfig?.subItems && Array.isArray(item.toolConfig.subItems)) {
      return (item.toolConfig.subItems as { id: string; label: string; description?: string }[]).map((subItem) => {
        // Find matching default item for icon
        const defaultItem = DEFAULT_ELECTRONICS.find((d) => d.id === subItem.id);
        return {
          id: subItem.id,
          label: subItem.label,
          description: subItem.description || '',
          icon: defaultItem?.icon || <Battery size={22} color={IOS_COLORS.gray} />,
        };
      });
    }
    return DEFAULT_ELECTRONICS;
  }, [item.toolConfig]);

  // Track completed items
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [chargeLevels, setChargeLevels] = useState<Record<string, 'full' | 'partial' | 'low'>>({});

  const progress = completedItems.size / electronicItems.length;
  const allComplete = completedItems.size === electronicItems.length;

  const toggleItem = useCallback((itemId: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const setChargeLevel = useCallback((itemId: string, level: 'full' | 'partial' | 'low') => {
    setChargeLevels((prev) => ({ ...prev, [itemId]: level }));
    // Auto-mark as checked when setting charge level
    setCompletedItems((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
  }, []);

  const handleDone = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const getChargeLevelColor = (level: 'full' | 'partial' | 'low' | undefined) => {
    switch (level) {
      case 'full':
        return IOS_COLORS.green;
      case 'partial':
        return IOS_COLORS.orange;
      case 'low':
        return IOS_COLORS.red;
      default:
        return IOS_COLORS.gray;
    }
  };

  const getChargeLevelIcon = (level: 'full' | 'partial' | 'low' | undefined) => {
    const color = getChargeLevelColor(level);
    switch (level) {
      case 'full':
        return <Battery size={18} color={color} />;
      case 'partial':
        return <BatteryWarning size={18} color={color} />;
      case 'low':
        return <BatteryWarning size={18} color={color} />;
      default:
        return <Battery size={18} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={IOS_COLORS.blue} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Electronics</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryIcon}>
          <Zap size={24} color={IOS_COLORS.blue} />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryTitle}>Charge Check</Text>
          <Text style={styles.summarySubtitle}>
            {completedItems.size} of {electronicItems.length} verified
          </Text>
        </View>
        <View style={styles.progressRing}>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
              allComplete && styles.progressComplete,
            ]}
          />
        </View>
      </View>

      {/* Electronics List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {electronicItems.map((electronicItem) => {
          const isCompleted = completedItems.has(electronicItem.id);
          const chargeLevel = chargeLevels[electronicItem.id];

          return (
            <View key={electronicItem.id} style={styles.itemCard}>
              <Pressable
                style={[
                  styles.itemRow,
                  isCompleted && styles.itemRowCompleted,
                ]}
                onPress={() => toggleItem(electronicItem.id)}
              >
                <View style={styles.itemIcon}>{electronicItem.icon}</View>
                <View style={styles.itemContent}>
                  <Text
                    style={[
                      styles.itemLabel,
                      isCompleted && styles.itemLabelCompleted,
                    ]}
                  >
                    {electronicItem.label}
                  </Text>
                  <Text style={styles.itemDescription}>
                    {electronicItem.description}
                  </Text>
                </View>
                <View style={styles.checkbox}>
                  {isCompleted ? (
                    <CheckCircle2 size={26} color={IOS_COLORS.green} />
                  ) : (
                    <Circle size={26} color={IOS_COLORS.gray} />
                  )}
                </View>
              </Pressable>

              {/* Charge Level Selector */}
              <View style={styles.chargeLevelContainer}>
                <Text style={styles.chargeLevelLabel}>Charge level:</Text>
                <View style={styles.chargeLevelOptions}>
                  <Pressable
                    style={[
                      styles.chargeLevelButton,
                      chargeLevel === 'full' && styles.chargeLevelButtonActive,
                      chargeLevel === 'full' && { backgroundColor: `${IOS_COLORS.green}15` },
                    ]}
                    onPress={() => setChargeLevel(electronicItem.id, 'full')}
                  >
                    <Battery size={16} color={chargeLevel === 'full' ? IOS_COLORS.green : IOS_COLORS.gray} />
                    <Text
                      style={[
                        styles.chargeLevelText,
                        chargeLevel === 'full' && { color: IOS_COLORS.green },
                      ]}
                    >
                      Full
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.chargeLevelButton,
                      chargeLevel === 'partial' && styles.chargeLevelButtonActive,
                      chargeLevel === 'partial' && { backgroundColor: `${IOS_COLORS.orange}15` },
                    ]}
                    onPress={() => setChargeLevel(electronicItem.id, 'partial')}
                  >
                    <BatteryWarning size={16} color={chargeLevel === 'partial' ? IOS_COLORS.orange : IOS_COLORS.gray} />
                    <Text
                      style={[
                        styles.chargeLevelText,
                        chargeLevel === 'partial' && { color: IOS_COLORS.orange },
                      ]}
                    >
                      Partial
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.chargeLevelButton,
                      chargeLevel === 'low' && styles.chargeLevelButtonActive,
                      chargeLevel === 'low' && { backgroundColor: `${IOS_COLORS.red}15` },
                    ]}
                    onPress={() => setChargeLevel(electronicItem.id, 'low')}
                  >
                    <BatteryWarning size={16} color={chargeLevel === 'low' ? IOS_COLORS.red : IOS_COLORS.gray} />
                    <Text
                      style={[
                        styles.chargeLevelText,
                        chargeLevel === 'low' && { color: IOS_COLORS.red },
                      ]}
                    >
                      Low
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Pressable
          style={[styles.doneButton, !allComplete && styles.doneButtonDisabled]}
          onPress={handleDone}
        >
          <Check size={18} color="#FFFFFF" />
          <Text style={styles.doneButtonText}>
            {allComplete ? 'All Verified' : `${electronicItems.length - completedItems.size} Remaining`}
          </Text>
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  backText: {
    fontSize: 17,
    color: IOS_COLORS.blue,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 80,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    gap: 12,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  summarySubtitle: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  progressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: IOS_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: IOS_COLORS.secondaryBackground,
  },
  progressBar: {
    height: 4,
    backgroundColor: IOS_COLORS.separator,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 2,
  },
  progressComplete: {
    backgroundColor: IOS_COLORS.green,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  itemRowCompleted: {
    backgroundColor: `${IOS_COLORS.green}05`,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  itemLabelCompleted: {
    color: IOS_COLORS.secondaryLabel,
  },
  itemDescription: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
  },
  chargeLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  chargeLevelLabel: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
  },
  chargeLevelOptions: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  chargeLevelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.background,
    gap: 4,
  },
  chargeLevelButtonActive: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chargeLevelText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.green,
    gap: 8,
  },
  doneButtonDisabled: {
    backgroundColor: IOS_COLORS.gray,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ElectronicsChecklist;
