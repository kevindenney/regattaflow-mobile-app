/**
 * ContentConfigModal
 *
 * Modal for configuring which content modules appear in the expanded race card.
 * Allows reordering, hiding/showing modules, and resetting to defaults.
 */

import React, { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
} from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import { RacePhase } from '@/components/cards/types';
import { getModuleLabel } from '@/components/cards/content/moduleConfig';
import type { ContentModuleId, RaceType, CONTENT_MODULE_INFO } from '@/types/raceCardContent';

interface ContentConfigModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Close callback */
  onClose: () => void;
  /** Current race phase */
  phase: RacePhase;
  /** Race type */
  raceType: RaceType;
  /** Currently displayed modules (in order) */
  currentModules: ContentModuleId[];
  /** All available modules for this phase/type */
  availableModules: ContentModuleId[];
  /** Hidden modules */
  hiddenModules: ContentModuleId[];
  /** Callback to update module order */
  onUpdateOrder: (newOrder: ContentModuleId[]) => void;
  /** Callback to show a hidden module */
  onShowModule: (moduleId: ContentModuleId) => void;
  /** Callback to hide a module */
  onHideModule: (moduleId: ContentModuleId) => void;
  /** Callback to reset to defaults */
  onResetDefaults: () => void;
}

/**
 * Modal for configuring content modules
 */
export function ContentConfigModal({
  visible,
  onClose,
  phase,
  raceType,
  currentModules,
  availableModules,
  hiddenModules,
  onUpdateOrder,
  onShowModule,
  onHideModule,
  onResetDefaults,
}: ContentConfigModalProps) {
  // Local state for drag-to-reorder (simplified for now)
  const [localOrder, setLocalOrder] = useState<ContentModuleId[]>(currentModules);

  // Sync local state when modal opens
  React.useEffect(() => {
    if (visible) {
      setLocalOrder(currentModules);
    }
  }, [visible, currentModules]);

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    const newOrder = [...localOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setLocalOrder(newOrder);
    onUpdateOrder(newOrder);
  }, [localOrder, onUpdateOrder]);

  const handleMoveDown = useCallback((index: number) => {
    if (index >= localOrder.length - 1) return;
    const newOrder = [...localOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setLocalOrder(newOrder);
    onUpdateOrder(newOrder);
  }, [localOrder, onUpdateOrder]);

  const handleToggleVisibility = useCallback((moduleId: ContentModuleId) => {
    if (hiddenModules.includes(moduleId)) {
      onShowModule(moduleId);
    } else {
      onHideModule(moduleId);
    }
  }, [hiddenModules, onShowModule, onHideModule]);

  const handleReset = useCallback(() => {
    onResetDefaults();
    onClose();
  }, [onResetDefaults, onClose]);

  // Get modules that are hidden but could be shown
  const addableModules = availableModules.filter(
    (m) => !localOrder.includes(m) || hiddenModules.includes(m)
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={IOS_COLORS.blue} />
          </Pressable>
          <Text style={styles.headerTitle}>Configure Content</Text>
          <Pressable
            style={styles.headerButton}
            onPress={handleReset}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <RotateCcw size={20} color={IOS_COLORS.blue} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Phase Info */}
          <View style={styles.phaseInfo}>
            <Text style={styles.phaseLabel}>
              {getPhaseName(phase)} • {raceType.charAt(0).toUpperCase() + raceType.slice(1)} Race
            </Text>
          </View>

          {/* Current Modules */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visible Modules</Text>
            <Text style={styles.sectionSubtitle}>
              Tap arrows to reorder, eye to hide
            </Text>
            <View style={styles.moduleList}>
              {localOrder.map((moduleId, index) => (
                <View key={moduleId} style={styles.moduleItem}>
                  <View style={styles.moduleInfo}>
                    <GripVertical size={16} color={IOS_COLORS.gray3} />
                    <Text style={styles.moduleName}>
                      {getModuleLabel(moduleId, raceType)}
                    </Text>
                  </View>
                  <View style={styles.moduleActions}>
                    {/* Move up */}
                    <Pressable
                      style={[
                        styles.actionButton,
                        index === 0 && styles.actionButtonDisabled,
                      ]}
                      onPress={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <Text style={styles.actionButtonText}>↑</Text>
                    </Pressable>
                    {/* Move down */}
                    <Pressable
                      style={[
                        styles.actionButton,
                        index === localOrder.length - 1 && styles.actionButtonDisabled,
                      ]}
                      onPress={() => handleMoveDown(index)}
                      disabled={index === localOrder.length - 1}
                    >
                      <Text style={styles.actionButtonText}>↓</Text>
                    </Pressable>
                    {/* Toggle visibility */}
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handleToggleVisibility(moduleId)}
                    >
                      <Eye size={16} color={IOS_COLORS.gray} />
                    </Pressable>
                  </View>
                </View>
              ))}
              {localOrder.length === 0 && (
                <Text style={styles.emptyText}>No modules visible</Text>
              )}
            </View>
          </View>

          {/* Hidden Modules */}
          {addableModules.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hidden Modules</Text>
              <Text style={styles.sectionSubtitle}>
                Tap to add back
              </Text>
              <View style={styles.moduleList}>
                {addableModules.map((moduleId) => (
                  <Pressable
                    key={moduleId}
                    style={[styles.moduleItem, styles.hiddenModuleItem]}
                    onPress={() => onShowModule(moduleId)}
                  >
                    <View style={styles.moduleInfo}>
                      <EyeOff size={16} color={IOS_COLORS.gray2} />
                      <Text style={styles.hiddenModuleName}>
                        {getModuleLabel(moduleId, raceType)}
                      </Text>
                    </View>
                    <Check size={16} color={IOS_COLORS.blue} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Done Button */}
        <View style={styles.footer}>
          <Pressable style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function getPhaseName(phase: RacePhase): string {
  switch (phase) {
    case 'days_before':
      return 'Preparation';
    case 'on_water':
      return 'On Water';
    case 'after_race':
      return 'Post Race';
    default:
      return 'Race';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray5,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
  },
  phaseInfo: {
    backgroundColor: IOS_COLORS.systemBackground,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: IOS_COLORS.gray2,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  moduleList: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    overflow: 'hidden',
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray5,
  },
  hiddenModuleItem: {
    opacity: 0.7,
  },
  moduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  moduleName: {
    fontSize: 15,
    color: IOS_COLORS.label,
  },
  hiddenModuleName: {
    fontSize: 15,
    color: IOS_COLORS.gray2,
  },
  moduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.3,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.gray2,
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: IOS_COLORS.systemBackground,
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
  },
  doneButton: {
    backgroundColor: IOS_COLORS.blue,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.systemBackground,
  },
});

export default ContentConfigModal;
