/**
 * Race Registration Form Component
 * Handles boat selection, crew assignment, and entry details with validation
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import {
  VStack,
  Text,
  Button,
  Input,
  Select,
  TextArea,
  FormControl,
  HStack,
  Checkbox,
  Badge,
} from '@/components/ui';
import { supabase } from '@/services/supabase';
import { raceRegistrationService, EntryFormData } from '@/services/RaceRegistrationService';
import { crewManagementService, CrewMemberWithAvailability } from '@/services/crewManagementService';

interface RaceRegistrationFormProps {
  regattaId: string;
  userId: string;
  onSuccess: (entryId: string) => void;
  onCancel?: () => void;
}

interface Boat {
  id: string;
  name: string;
  sail_number: string;
  class_id: string;
  boat_classes: { name: string };
}

export function RaceRegistrationForm({
  regattaId,
  userId,
  onSuccess,
  onCancel,
}: RaceRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMemberWithAvailability[]>([]);
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([]);
  const [regattaDetails, setRegattaDetails] = useState<any>(null);
  const [crewConflicts, setCrewConflicts] = useState<any[]>([]);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EntryFormData>({
    defaultValues: {
      regatta_id: regattaId,
      boat_id: '',
      entry_class: '',
      division: '',
      sail_number: '',
      crew_member_ids: [],
      special_requests: '',
      dietary_requirements: '',
      equipment_notes: '',
    },
  });

  const selectedBoatId = watch('boat_id');

  // Load regatta details
  useEffect(() => {
    loadRegattaDetails();
  }, [regattaId]);

  // Load sailor's boats
  useEffect(() => {
    loadBoats();
  }, [userId]);

  // Load crew members when boat is selected
  useEffect(() => {
    if (selectedBoatId) {
      loadCrewMembers(selectedBoatId);
    }
  }, [selectedBoatId]);

  // Check crew availability
  useEffect(() => {
    if (selectedCrewIds.length > 0) {
      checkCrewAvailability();
    }
  }, [selectedCrewIds]);

  const loadRegattaDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('club_race_calendar')
        .select('*, sailing_venues(name)')
        .eq('id', regattaId)
        .single();

      if (error) throw error;
      setRegattaDetails(data);
    } catch (error) {
      console.error('Failed to load regatta details:', error);
      Alert.alert('Error', 'Failed to load regatta details');
    }
  };

  const loadBoats = async () => {
    try {
      const { data, error } = await supabase
        .from('sailor_boats')
        .select('*, boat_classes(name)')
        .eq('sailor_id', userId)
        .eq('status', 'active');

      if (error) throw error;
      setBoats(data || []);
    } catch (error) {
      console.error('Failed to load boats:', error);
    }
  };

  const loadCrewMembers = async (boatId: string) => {
    try {
      // Find the boat to get class_id
      const boat = boats.find((b) => b.id === boatId);
      if (!boat) return;

      setSelectedBoat(boat);

      // Get race date from regatta details
      const raceDate = regattaDetails?.start_date || new Date().toISOString().split('T')[0];

      // Load crew with availability for the race date
      const data = await crewManagementService.getCrewWithAvailability(
        userId,
        boat.class_id,
        raceDate
      );

      setCrewMembers(data);
    } catch (error) {
      console.error('Failed to load crew members:', error);
    }
  };

  const checkCrewAvailability = async () => {
    try {
      const result = await raceRegistrationService.checkCrewAvailability(
        selectedCrewIds,
        regattaId
      );
      setCrewConflicts(result.conflicts);
    } catch (error) {
      console.error('Failed to check crew availability:', error);
    }
  };

  const toggleCrewMember = (crewId: string) => {
    setSelectedCrewIds((prev) =>
      prev.includes(crewId)
        ? prev.filter((id) => id !== crewId)
        : [...prev, crewId]
    );
  };

  const onSubmit = async (data: EntryFormData) => {
    setLoading(true);
    try {
      // Add selected crew members
      data.crew_member_ids = selectedCrewIds;

      const result = await raceRegistrationService.createEntry(userId, data);

      if (result.success && result.entry) {
        Alert.alert('Success', 'Race entry created successfully!');
        onSuccess(result.entry.id);
      } else {
        throw new Error(result.error || 'Failed to create entry');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'Failed to create race entry');
    } finally {
      setLoading(false);
    }
  };

  if (!regattaDetails) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView>
      <VStack space="lg" padding="$4">
        {/* Regatta Info */}
        <View>
          <Text size="xl" weight="bold">
            {regattaDetails.event_name}
          </Text>
          <Text size="sm" color="$gray600">
            {regattaDetails.sailing_venues?.name}
          </Text>
          <Text size="sm" color="$gray600">
            {new Date(regattaDetails.start_date).toLocaleDateString()}
          </Text>
          {regattaDetails.entry_fee > 0 && (
            <Text size="md" weight="semibold" marginTop="$2">
              Entry Fee: {regattaDetails.currency} {regattaDetails.entry_fee}
            </Text>
          )}
        </View>

        {/* Boat Selection */}
        <FormControl isInvalid={!!errors.boat_id}>
          <FormControl.Label>
            <Text>Select Boat *</Text>
          </FormControl.Label>
          <Controller
            control={control}
            name="boat_id"
            rules={{ required: 'Boat is required' }}
            render={({ field: { onChange, value } }) => (
              <Select
                selectedValue={value}
                onValueChange={onChange}
                placeholder="Choose your boat"
              >
                {boats.map((boat) => (
                  <Select.Item
                    key={boat.id}
                    label={`${boat.name} (${boat.boat_classes.name}) - ${boat.sail_number}`}
                    value={boat.id}
                  />
                ))}
              </Select>
            )}
          />
          {errors.boat_id && (
            <FormControl.ErrorMessage>
              {errors.boat_id.message}
            </FormControl.ErrorMessage>
          )}
        </FormControl>

        {/* Entry Class */}
        <FormControl isInvalid={!!errors.entry_class}>
          <FormControl.Label>
            <Text>Entry Class *</Text>
          </FormControl.Label>
          <Controller
            control={control}
            name="entry_class"
            rules={{ required: 'Entry class is required' }}
            render={({ field: { onChange, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                placeholder="e.g., Dragon, IRC A, One-Design"
              />
            )}
          />
          {errors.entry_class && (
            <FormControl.ErrorMessage>
              {errors.entry_class.message}
            </FormControl.ErrorMessage>
          )}
        </FormControl>

        {/* Division (Optional) */}
        <FormControl>
          <FormControl.Label>
            <Text>Division</Text>
          </FormControl.Label>
          <Controller
            control={control}
            name="division"
            render={({ field: { onChange, value } }) => (
              <Input
                value={value || ''}
                onChangeText={onChange}
                placeholder="e.g., Pro, Corinthian, Youth"
              />
            )}
          />
        </FormControl>

        {/* Sail Number */}
        <FormControl isInvalid={!!errors.sail_number}>
          <FormControl.Label>
            <Text>Sail Number *</Text>
          </FormControl.Label>
          <Controller
            control={control}
            name="sail_number"
            rules={{ required: 'Sail number is required' }}
            render={({ field: { onChange, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                placeholder="e.g., USA 123"
              />
            )}
          />
          {errors.sail_number && (
            <FormControl.ErrorMessage>
              {errors.sail_number.message}
            </FormControl.ErrorMessage>
          )}
        </FormControl>

        {/* Crew Selection */}
        {selectedBoatId && crewMembers.length > 0 && (
          <FormControl>
            <FormControl.Label>
              <Text>Select Crew Members</Text>
            </FormControl.Label>
            <VStack space="sm">
              {crewMembers.map((crew) => (
                <HStack
                  key={crew.id}
                  space="md"
                  alignItems="center"
                  padding="$2"
                  backgroundColor="$gray50"
                  borderRadius="$md"
                >
                  <Checkbox
                    value={selectedCrewIds.includes(crew.id)}
                    onValueChange={() => toggleCrewMember(crew.id)}
                    isDisabled={crew.currentAvailability === 'unavailable'}
                  />
                  <VStack flex={1}>
                    <HStack space="sm" alignItems="center">
                      <Text weight="semibold">{crew.name}</Text>
                      {crew.currentAvailability && (
                        <Badge
                          variant={
                            crew.currentAvailability === 'available'
                              ? 'success'
                              : crew.currentAvailability === 'unavailable'
                              ? 'error'
                              : 'warning'
                          }
                        >
                          {crew.currentAvailability}
                        </Badge>
                      )}
                    </HStack>
                    <Text size="sm" color="$gray600">
                      {crew.role} • {crew.email}
                    </Text>
                    {crew.nextUnavailable && (
                      <Text size="xs" color="$warning600" marginTop="$1">
                        Next unavailable: {new Date(crew.nextUnavailable.startDate).toLocaleDateString()}
                        {crew.nextUnavailable.reason && ` (${crew.nextUnavailable.reason})`}
                      </Text>
                    )}
                  </VStack>
                  <Badge variant={crew.status === 'active' ? 'success' : 'warning'}>
                    {crew.status}
                  </Badge>
                </HStack>
              ))}
            </VStack>
            {crewConflicts.length > 0 && (
              <Text size="sm" color="$error600" marginTop="$2">
                ⚠️ Some crew members have conflicting race dates
              </Text>
            )}
          </FormControl>
        )}

        {/* Special Requests */}
        <FormControl>
          <FormControl.Label>
            <Text>Special Requests</Text>
          </FormControl.Label>
          <Controller
            control={control}
            name="special_requests"
            render={({ field: { onChange, value } }) => (
              <TextArea
                value={value || ''}
                onChangeText={onChange}
                placeholder="Any special requests or requirements..."
                numberOfLines={3}
              />
            )}
          />
        </FormControl>

        {/* Dietary Requirements */}
        <FormControl>
          <FormControl.Label>
            <Text>Dietary Requirements</Text>
          </FormControl.Label>
          <Controller
            control={control}
            name="dietary_requirements"
            render={({ field: { onChange, value } }) => (
              <Input
                value={value || ''}
                onChangeText={onChange}
                placeholder="e.g., Vegetarian, Gluten-free, Allergies"
              />
            )}
          />
        </FormControl>

        {/* Equipment Notes */}
        <FormControl>
          <FormControl.Label>
            <Text>Equipment Notes</Text>
          </FormControl.Label>
          <Controller
            control={control}
            name="equipment_notes"
            render={({ field: { onChange, value } }) => (
              <TextArea
                value={value || ''}
                onChangeText={onChange}
                placeholder="Any equipment-specific notes or requirements..."
                numberOfLines={3}
              />
            )}
          />
        </FormControl>

        {/* Action Buttons */}
        <HStack space="md" marginTop="$4">
          {onCancel && (
            <Button flex={1} variant="outline" onPress={onCancel}>
              <Text>Cancel</Text>
            </Button>
          )}
          <Button
            flex={1}
            onPress={handleSubmit(onSubmit)}
            isDisabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text color="white">Continue to Payment</Text>}
          </Button>
        </HStack>
      </VStack>
    </ScrollView>
  );
}
