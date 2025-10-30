/**
 * Unified Onboarding Screen
 * Single-screen onboarding with persona tabs (Sailor/Club/Coach)
 * Uses Silent AI Extraction with Progressive Disclosure pattern
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { ConversationalOnboardingAgent } from '@/services/agents/ConversationalOnboardingAgent';
import { PersonaTabBar, PersonaType } from '@/components/onboarding/PersonaTabBar';
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar';
import { OnboardingSection } from '@/components/onboarding/OnboardingSection';
import { FreeformInputField } from '@/components/onboarding/FreeformInputField';
import { ExtractedEntity } from '@/components/onboarding/ExtractedDataPreview';
import { QuickPasteOptions } from '@/components/onboarding/QuickPasteOptions';

interface SailorOnboardingData {
  aboutYou: {
    name?: string;
    boatClass?: string;
    sailNumber?: string;
    boatName?: string;
    equipment?: string[];
    clubs?: string[];
    fleets?: string[];
  };
  raceCalendar: {
    races?: Array<{
      name: string;
      date: string;
      location: string;
    }>;
  };
  nextRace: {
    name?: string;
    date?: string;
    venue?: string;
    documents?: string[];
  };
}

export default function UnifiedOnboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ persona?: PersonaType }>();

  // State
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>(
    (params.persona as PersonaType) || 'sailor'
  );
  const [agent] = useState(() => new ConversationalOnboardingAgent());

  // Sailor-specific state
  const [sailorData, setSailorData] = useState<SailorOnboardingData>({
    aboutYou: {},
    raceCalendar: {},
    nextRace: {},
  });

  // Section expansion state
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    aboutYou: true,
    raceCalendar: false,
    nextRace: false,
  });

  // Completion tracking
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const markSectionComplete = (sectionKey: string) => {
    setCompletedSections((prev) => new Set([...prev, sectionKey]));
    // Auto-expand next section
    const sections = ['aboutYou', 'raceCalendar', 'nextRace'];
    const currentIndex = sections.indexOf(sectionKey);
    if (currentIndex < sections.length - 1) {
      const nextSection = sections[currentIndex + 1];
      setExpandedSections((prev) => ({
        ...prev,
        [sectionKey]: false, // Collapse current
        [nextSection]: true, // Expand next
      }));
    }
  };

  // AI Extraction Handlers
  const handleExtractAboutYou = async (text: string): Promise<ExtractedEntity[]> => {
    try {
      const result = await agent.processUserMessage(text);

      if (!result.success || !result.result) {
        return [];
      }

      const entities: ExtractedEntity[] = [];

      // Extract boats
      if (result.result.boats && result.result.boats.length > 0) {
        result.result.boats.forEach((boat) => {
          entities.push({
            type: 'boat',
            label: 'Boat Class',
            value: boat.className,
            confidence: 'high',
          });
          if (boat.sailNumber) {
            entities.push({
              type: 'boat',
              label: 'Sail Number',
              value: boat.sailNumber,
              confidence: 'high',
            });
          }
          if (boat.boatName) {
            entities.push({
              type: 'boat',
              label: 'Boat Name',
              value: boat.boatName,
              confidence: 'high',
            });
          }
        });
      }

      // Extract clubs
      if (result.result.clubs && result.result.clubs.length > 0) {
        result.result.clubs.forEach((club) => {
          entities.push({
            type: 'club',
            label: 'Yacht Club',
            value: club.name,
            confidence: 'high',
            metadata: { url: club.url },
          });
        });
      }

      // Extract venues
      if (result.result.venues && result.result.venues.length > 0) {
        result.result.venues.forEach((venue) => {
          entities.push({
            type: 'venue',
            label: 'Home Venue',
            value: venue.name,
            confidence: 'high',
          });
        });
      }

      return entities;
    } catch (error) {
      console.error('About You extraction failed:', error);
      throw error;
    }
  };

  const handleConfirmAboutYou = (entities: ExtractedEntity[]) => {
    const updatedData = { ...sailorData.aboutYou };

    entities.forEach((entity) => {
      if (entity.label === 'Boat Class') updatedData.boatClass = entity.value;
      if (entity.label === 'Sail Number') updatedData.sailNumber = entity.value;
      if (entity.label === 'Boat Name') updatedData.boatName = entity.value;
      if (entity.label === 'Yacht Club') {
        updatedData.clubs = [...(updatedData.clubs || []), entity.value];
      }
    });

    setSailorData((prev) => ({ ...prev, aboutYou: updatedData }));
    markSectionComplete('aboutYou');
  };

  const handleExtractRaceCalendar = async (text: string): Promise<ExtractedEntity[]> => {
    try {
      const result = await agent.processUserMessage(text);

      if (!result.success || !result.result) {
        return [];
      }

      const entities: ExtractedEntity[] = [];

      // Extract upcoming races
      if (result.result.upcomingRaces && result.result.upcomingRaces.length > 0) {
        result.result.upcomingRaces.forEach((race, index) => {
          entities.push({
            type: 'race',
            label: `Race ${index + 1}`,
            value: `${race.name} - ${new Date(race.date).toLocaleDateString()}`,
            confidence: 'high',
            metadata: race,
          });
        });
      }

      return entities;
    } catch (error) {
      console.error('Race calendar extraction failed:', error);
      throw error;
    }
  };

  const handleConfirmRaceCalendar = (entities: ExtractedEntity[]) => {
    const races = entities
      .filter((e) => e.type === 'race')
      .map((e) => e.metadata as any);

    setSailorData((prev) => ({
      ...prev,
      raceCalendar: { races },
    }));
    markSectionComplete('raceCalendar');
  };

  const handleExtractNextRace = async (text: string): Promise<ExtractedEntity[]> => {
    try {
      const result = await agent.processUserMessage(text);

      if (!result.success || !result.result) {
        return [];
      }

      const entities: ExtractedEntity[] = [];

      // Extract next race details
      if (result.result.nextRace) {
        const race = result.result.nextRace;
        entities.push({
          type: 'race',
          label: 'Race Name',
          value: race.name,
          confidence: 'high',
        });
        if (race.date) {
          entities.push({
            type: 'race',
            label: 'Date',
            value: new Date(race.date).toLocaleDateString(),
            confidence: 'high',
          });
        }
        if (race.location) {
          entities.push({
            type: 'venue',
            label: 'Venue',
            value: race.location,
            confidence: 'high',
          });
        }
      }

      // Extract documents
      if (result.result.documents && result.result.documents.length > 0) {
        result.result.documents.forEach((doc) => {
          entities.push({
            type: 'document',
            label: doc.type || 'Document',
            value: doc.url,
            confidence: 'medium',
          });
        });
      }

      return entities;
    } catch (error) {
      console.error('Next race extraction failed:', error);
      throw error;
    }
  };

  const handleConfirmNextRace = (entities: ExtractedEntity[]) => {
    const updatedData = { ...sailorData.nextRace };

    entities.forEach((entity) => {
      if (entity.label === 'Race Name') updatedData.name = entity.value;
      if (entity.label === 'Date') updatedData.date = entity.value;
      if (entity.label === 'Venue') updatedData.venue = entity.value;
      if (entity.type === 'document') {
        updatedData.documents = [...(updatedData.documents || []), entity.value];
      }
    });

    setSailorData((prev) => ({ ...prev, nextRace: updatedData }));
    markSectionComplete('nextRace');
  };

  // Save and Complete
  const handleSaveAndContinue = async () => {
    if (completedSections.size === 0) {
      Alert.alert('Incomplete', 'Please complete at least one section before continuing.');
      return;
    }

    try {
      // TODO: Call agent to save profile data
      // await agent.executeTool('save_sailor_profile', { sailor_id: user?.id, ...sailorData });

      // Navigate to appropriate dashboard
      if (selectedPersona === 'sailor') {
        router.replace('/(tabs)/races');
      } else if (selectedPersona === 'club') {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile. Please try again.');
    }
  };

  const totalSections = 3;
  const currentStep = completedSections.size + 1;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Persona Tabs */}
        <PersonaTabBar
          selectedPersona={selectedPersona}
          onPersonaChange={setSelectedPersona}
        />

        {/* Progress Bar */}
        <OnboardingProgressBar
          currentStep={Math.min(currentStep, totalSections)}
          totalSteps={totalSections}
          completedSections={completedSections.size}
        />

        {/* Content */}
        <ScrollView className="flex-1 px-6 py-4">
          {selectedPersona === 'sailor' && (
            <>
              {/* Section 1: About You */}
              <OnboardingSection
                title="About You"
                subtitle="Tell us about your boat, club, and home venue"
                stepNumber={1}
                isCompleted={completedSections.has('aboutYou')}
                isExpanded={expandedSections.aboutYou}
                onToggle={() => toggleSection('aboutYou')}
              >
                <FreeformInputField
                  label="Tell me about yourself..."
                  placeholder="e.g., I sail a Dragon D59 'Blue Lightning' at Royal Hong Kong Yacht Club. My boat has a North sails rig and I race with my crew John and Sarah."
                  onExtract={handleExtractAboutYou}
                  onConfirm={handleConfirmAboutYou}
                  helpText="Paste club URLs, boat details, or just type naturally - AI will extract everything!"
                />
              </OnboardingSection>

              {/* Section 2: Race Calendar */}
              <OnboardingSection
                title="Race Calendar"
                subtitle="Paste your race calendar or type upcoming races"
                stepNumber={2}
                isCompleted={completedSections.has('raceCalendar')}
                isExpanded={expandedSections.raceCalendar}
                onToggle={() => toggleSection('raceCalendar')}
              >
                <FreeformInputField
                  label="Paste or type your race calendar..."
                  placeholder="Paste CSV from Excel/Sheets, club website URL, or just type your races"
                  onExtract={handleExtractRaceCalendar}
                  onConfirm={handleConfirmRaceCalendar}
                  helpText="AI can extract races from CSV tables, URLs, or plain text"
                />

                {/* Quick Paste Options */}
                <View className="mt-4">
                  <QuickPasteOptions
                    onPasteCalendar={async (csv) => {
                      const entities = await handleExtractRaceCalendar(csv);
                      handleConfirmRaceCalendar(entities);
                    }}
                  />
                </View>
              </OnboardingSection>

              {/* Section 3: Next Race */}
              <OnboardingSection
                title="Next Race Details"
                subtitle="Tell us about your upcoming race"
                stepNumber={3}
                isCompleted={completedSections.has('nextRace')}
                isExpanded={expandedSections.nextRace}
                onToggle={() => toggleSection('nextRace')}
              >
                <FreeformInputField
                  label="Paste race details..."
                  placeholder="Paste SI/NOR text, course map URL, or type race information"
                  onExtract={handleExtractNextRace}
                  onConfirm={handleConfirmNextRace}
                  helpText="Include sailing instructions, notice of race, or course diagrams"
                />

                {/* Quick Paste Options */}
                <View className="mt-4">
                  <QuickPasteOptions
                    onPasteSINOR={async (text) => {
                      const entities = await handleExtractNextRace(text);
                      handleConfirmNextRace(entities);
                    }}
                    onPasteImageURL={async (url) => {
                      const entities = await handleExtractNextRace(url);
                      handleConfirmNextRace(entities);
                    }}
                  />
                </View>
              </OnboardingSection>
            </>
          )}

          {selectedPersona === 'club' && (
            <View className="p-4">
              <Text className="text-lg font-semibold text-gray-700">
                Club Onboarding Coming Soon
              </Text>
              <Text className="text-sm text-gray-500 mt-2">
                Club onboarding flow is under development.
              </Text>
            </View>
          )}

          {selectedPersona === 'coach' && (
            <View className="p-4">
              <Text className="text-lg font-semibold text-gray-700">
                Coach Onboarding Coming Soon
              </Text>
              <Text className="text-sm text-gray-500 mt-2">
                Coach onboarding flow is under development.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Action */}
        <View className="p-6 border-t border-gray-200 bg-white">
          <TouchableOpacity
            onPress={handleSaveAndContinue}
            className={`py-4 rounded-lg ${
              completedSections.size > 0 ? 'bg-sky-600' : 'bg-gray-300'
            }`}
            disabled={completedSections.size === 0}
          >
            <Text className="text-center text-base font-semibold text-white">
              {completedSections.size === totalSections
                ? 'Complete & Go to Dashboard'
                : 'Save & Continue Later'}
            </Text>
          </TouchableOpacity>
          {completedSections.size < totalSections && (
            <Text className="text-center text-xs text-gray-500 mt-2">
              You can complete remaining sections later
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
