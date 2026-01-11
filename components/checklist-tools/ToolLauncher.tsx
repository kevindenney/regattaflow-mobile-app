/**
 * ToolLauncher
 *
 * Orchestrates rendering the appropriate tool based on a checklist item's toolType.
 * Handles modal presentation and tool-specific rendering logic.
 */

import React, { useCallback } from 'react';
import { Modal, View, StyleSheet, Platform } from 'react-native';
import type { ChecklistItem } from '@/types/checklists';
import { getToolMetadata, hasTool } from '@/lib/checklists/toolRegistry';
import { QuickTipsPanel } from './QuickTipsPanel';
import { InteractiveChecklist } from './InteractiveChecklist';

// Import existing wizards
// Note: SailInspectionWizard is imported dynamically where used

interface ToolLauncherProps {
  item: ChecklistItem;
  raceEventId: string;
  boatId?: string;
  visible: boolean;
  onComplete: () => void;
  onCancel: () => void;
  // For full wizard tools, we can pass a custom component
  WizardComponent?: React.ComponentType<{
    item: ChecklistItem;
    raceEventId: string;
    boatId?: string;
    onComplete: () => void;
    onCancel: () => void;
  }>;
}

export function ToolLauncher({
  item,
  raceEventId,
  boatId,
  visible,
  onComplete,
  onCancel,
  WizardComponent,
}: ToolLauncherProps) {
  const toolMeta = getToolMetadata(item);
  const toolType = item.toolType || toolMeta?.type;

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  if (!visible || !hasTool(item)) {
    return null;
  }

  // Quick tips panel - renders as a bottom sheet overlay
  if (toolType === 'quick_tips') {
    return (
      <QuickTipsPanel
        item={item}
        visible={visible}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    );
  }

  // Interactive checklist - renders in a modal
  if (toolType === 'interactive') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={handleCancel}
      >
        <InteractiveChecklist
          item={item}
          raceEventId={raceEventId}
          boatId={boatId}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </Modal>
    );
  }

  // Full wizard - renders the provided wizard component or a placeholder
  if (toolType === 'full_wizard') {
    if (WizardComponent) {
      return (
        <Modal
          visible={visible}
          animationType="slide"
          presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
          onRequestClose={handleCancel}
        >
          <WizardComponent
            item={item}
            raceEventId={raceEventId}
            boatId={boatId}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </Modal>
      );
    }

    // Fallback: Show a placeholder for wizards not yet implemented
    // In production, these would be the actual wizard components
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={handleCancel}
      >
        <View style={styles.placeholderContainer}>
          <InteractiveChecklist
            item={item}
            raceEventId={raceEventId}
            boatId={boatId}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
  },
});

export default ToolLauncher;
