/**
 * Onboarding Data Tally
 * Real-time display of collected onboarding data
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MapPin, Anchor, Users, Award, Calendar } from 'lucide-react-native';
import { ConversationalContext } from '@/services/agents/ConversationalOnboardingAgent';

interface CollectedDataItem {
  type: 'venue' | 'club' | 'boat' | 'role' | 'fleet' | 'equipment' | 'coach' | 'crew' | 'racingArea' | 'series';
  label: string;
  value: string;
  timestamp: number;
}

interface OnboardingDataTallyProps {
  context: ConversationalContext;
  collectedData?: {
    venue?: string;
    role?: string;
    boats?: Array<{ class: string; sailNumber?: string }>;
    clubs?: string[];
    fleets?: string[];
    equipment?: Array<{ boat: string; makers: string[] }>;
    coaches?: string[];
    crew?: string[];
    racingAreas?: string[];
    series?: string[];
    items?: CollectedDataItem[];
  };
}

export function OnboardingDataTally({ context, collectedData }: OnboardingDataTallyProps) {
  // Helper function to get icon for each type
  const getIcon = (type: string) => {
    switch (type) {
      case 'venue':
        return <MapPin size={16} color="#0284c7" />;
      case 'club':
      case 'fleet':
      case 'role':
      case 'coach':
      case 'crew':
        return <Users size={16} color="#0284c7" />;
      case 'boat':
        return <Anchor size={16} color="#0284c7" />;
      case 'equipment':
        return <Award size={16} color="#0284c7" />;
      case 'racingArea':
        return <MapPin size={16} color="#0284c7" />;
      case 'series':
        return <Calendar size={16} color="#0284c7" />;
      default:
        return <Users size={16} color="#0284c7" />;
    }
  };

  // Use chronological items if available, otherwise fall back to legacy display
  const hasChronologicalData = collectedData?.items && collectedData.items.length > 0;

  return (
    <ScrollView className="flex-1 bg-gray-50 border-l border-gray-200">
      <View className="p-4">
        {hasChronologicalData ? (
          // NEW: Chronological display (items appear in order collected)
          collectedData!.items!.map((item, idx) => (
            <View key={idx} className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                {getIcon(item.type)}
                <Text className="text-sm font-semibold text-gray-700">{item.label}</Text>
              </View>
              <View className="bg-white rounded-lg p-3 border border-gray-200">
                <Text className="text-sm text-gray-800">
                  • {item.value}
                </Text>
              </View>
            </View>
          ))
        ) : (
          // LEGACY: Old display method (grouped by category)
          <>
            {/* Venue */}
            {(context.detectedVenue || collectedData?.venue) && (
              <DataSection
                icon={<MapPin size={16} color="#0284c7" />}
                title="Home Venue"
                items={[context.detectedVenue?.name || collectedData?.venue || '']}
              />
            )}

            {/* Role */}
            {collectedData?.role && (
              <DataSection
                icon={<Users size={16} color="#0284c7" />}
                title="Sailor Role"
                items={[collectedData.role]}
              />
            )}

            {/* Boats */}
            {collectedData?.boats && collectedData.boats.length > 0 && (
              <DataSection
                icon={<Anchor size={16} color="#0284c7" />}
                title="Boats"
                items={collectedData.boats.map(
                  b => `${b.class}${b.sailNumber ? ` #${b.sailNumber}` : ''}`
                )}
              />
            )}

            {/* Equipment */}
            {collectedData?.equipment && collectedData.equipment.length > 0 && (
              <DataSection
                icon={<Award size={16} color="#0284c7" />}
                title="Equipment"
                items={collectedData.equipment.flatMap(e =>
                  e.makers.map(m => `${e.boat}: ${m}`)
                )}
              />
            )}

            {/* Clubs */}
            {collectedData?.clubs && collectedData.clubs.length > 0 && (
              <DataSection
                icon={<Users size={16} color="#0284c7" />}
                title="Yacht Clubs"
                items={collectedData.clubs}
              />
            )}

            {/* Fleets */}
            {collectedData?.fleets && collectedData.fleets.length > 0 && (
              <DataSection
                icon={<Users size={16} color="#0284c7" />}
                title="Racing Fleets"
                items={collectedData.fleets}
              />
            )}

            {/* Coaches */}
            {collectedData?.coaches && collectedData.coaches.length > 0 && (
              <DataSection
                icon={<Users size={16} color="#0284c7" />}
                title="Coaches"
                items={collectedData.coaches}
              />
            )}

            {/* Crew */}
            {collectedData?.crew && collectedData.crew.length > 0 && (
              <DataSection
                icon={<Users size={16} color="#0284c7" />}
                title="Crew Members"
                items={collectedData.crew}
              />
            )}

            {/* Racing Areas */}
            {collectedData?.racingAreas && collectedData.racingAreas.length > 0 && (
              <DataSection
                icon={<MapPin size={16} color="#0284c7" />}
                title="Racing Areas"
                items={collectedData.racingAreas}
              />
            )}

            {/* Racing Series */}
            {collectedData?.series && collectedData.series.length > 0 && (
              <DataSection
                icon={<Calendar size={16} color="#0284c7" />}
                title="Racing Series"
                items={collectedData.series}
              />
            )}
          </>
        )}

      </View>
    </ScrollView>
  );
}

function DataSection({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-2 mb-2">
        {icon}
        <Text className="text-sm font-semibold text-gray-700">{title}</Text>
      </View>
      <View className="bg-white rounded-lg p-3 border border-gray-200">
        {items.map((item, idx) => (
          <Text key={idx} className="text-sm text-gray-800 mb-1">
            • {item}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default OnboardingDataTally;
