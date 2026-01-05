/**
 * Add Race Family Button
 *
 * FamilyButton-based component for adding new races with an inline quick entry form.
 * Uses the expandable FamilyButton pattern for a smooth UX.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { Plus } from 'lucide-react-native';
import { FamilyButton } from '@/components/ui/FamilyButton';
import { QuickAddRaceForm } from '@/components/races/QuickAddRaceForm';
import { RaceEventService } from '@/services/RaceEventService';
import { addRaceFamilyButtonStyles } from '@/components/races/styles';

export interface AddRaceFamilyButtonProps {
  /** Callback when a race is successfully created */
  onRaceCreated: () => void;
  /** Card width in pixels */
  cardWidth?: number;
  /** Card height in pixels */
  cardHeight?: number;
  /** Whether the form is expanded (controlled) */
  expanded: boolean;
  /** Callback when expansion state changes */
  onExpandedChange: (expanded: boolean) => void;
}

/**
 * Add Race Family Button Component
 */
export function AddRaceFamilyButton({
  onRaceCreated,
  cardWidth = 160,
  cardHeight = 180,
  expanded,
  onExpandedChange,
}: AddRaceFamilyButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isExpanded = expanded;

  const handleQuickAddRace = useCallback(
    async (data: { name: string; dateTime: string }) => {
      setIsSubmitting(true);
      try {
        const { data: newRace, error } = await RaceEventService.createRaceEvent({
          race_name: data.name,
          start_time: data.dateTime,
        });

        if (error) {
          Alert.alert('Error', error.message || 'Failed to create race');
          return;
        }

        // Success - collapse and refresh
        onExpandedChange(false);
        onRaceCreated();
      } catch (err) {
        Alert.alert(
          'Error',
          err instanceof Error ? err.message : 'Failed to create race'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [onRaceCreated, onExpandedChange]
  );

  const handleCancel = useCallback(() => {
    onExpandedChange(false);
  }, [onExpandedChange]);

  const handleExpandChange = useCallback(
    (newExpanded: boolean) => {
      onExpandedChange(newExpanded);
    },
    [onExpandedChange]
  );

  return (
    <View
      style={{
        width: cardWidth,
        height: cardHeight,
        flexShrink: 0,
        flexGrow: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FamilyButton
        expanded={isExpanded}
        onExpandChange={handleExpandChange}
        width={cardWidth}
        height={cardHeight}
        variant="tufte"
      >
        <FamilyButton.Trigger size={56}>
          <Plus color="#047857" size={24} />
          <Text style={addRaceFamilyButtonStyles.triggerLabel}>Add Race</Text>
        </FamilyButton.Trigger>
        <FamilyButton.Content>
          <QuickAddRaceForm
            onSubmit={handleQuickAddRace}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </FamilyButton.Content>
      </FamilyButton>
    </View>
  );
}

export default AddRaceFamilyButton;
