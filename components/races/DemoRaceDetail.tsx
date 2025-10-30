import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui/card';
import { Button, ButtonText } from '@/components/ui/button';
import { MockRace } from '@/constants/mockData';
import { Calendar, Clock, Compass, MapPin, Radio, Wind, Waves } from 'lucide-react-native';

interface DemoRaceDetailProps {
  race: MockRace;
  onAddRace?: () => void;
}

export function DemoRaceDetail({ race, onAddRace }: DemoRaceDetailProps) {
  const startDate = new Date(race.date);
  const formattedDate = startDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const formattedTime = startDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <View className="gap-4 mt-2">
      <Card className="p-4 gap-3">
        <Text className="text-xs font-semibold text-blue-600">Demo Preview</Text>
        <Text className="text-xl font-bold text-gray-900">{race.name}</Text>

        <View className="flex-row items-center gap-2">
          <MapPin size={16} color="#2563EB" />
          <Text className="text-sm text-gray-700">{race.venue}</Text>
        </View>

        <View className="flex-row gap-4 mt-2">
          <View className="flex-row items-center gap-2">
            <Calendar size={16} color="#16A34A" />
            <Text className="text-sm text-gray-700">{formattedDate}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Clock size={16} color="#0EA5E9" />
            <Text className="text-sm text-gray-700">
              {race.startTime || formattedTime} local
            </Text>
          </View>
        </View>
      </Card>

      <Card className="p-4 gap-4">
        <Text className="text-base font-semibold text-gray-900">Conditions Snapshot</Text>

        <View className="flex-row justify-between">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center gap-2">
              <Wind size={18} color="#0EA5E9" />
              <Text className="text-sm font-semibold text-gray-800">Wind</Text>
            </View>
            <Text className="text-sm text-gray-700 mt-1">
              {race.wind.speedMin}–{race.wind.speedMax} kts • {race.wind.direction}
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Waves size={18} color="#14B8A6" />
              <Text className="text-sm font-semibold text-gray-800">Tide</Text>
            </View>
            <Text className="text-sm text-gray-700 mt-1">
              {race.tide.state.charAt(0).toUpperCase() + race.tide.state.slice(1)}
              {typeof race.tide.height === 'number' ? ` • ${race.tide.height} m` : ''}
            </Text>
          </View>
        </View>

        {race.strategy && (
          <View>
            <View className="flex-row items-center gap-2 mb-1">
              <Compass size={18} color="#F97316" />
              <Text className="text-sm font-semibold text-gray-800">Strategy Highlights</Text>
            </View>
            <Text className="text-sm text-gray-700 leading-5">{race.strategy}</Text>
          </View>
        )}

        {race.critical_details && (
          <View className="bg-blue-50 border border-blue-100 rounded-lg p-3 gap-1">
            <View className="flex-row items-center gap-2">
              <Radio size={16} color="#1D4ED8" />
              <Text className="text-sm font-semibold text-blue-800">Critical Details</Text>
            </View>
            {race.critical_details.vhf_channel && (
              <Text className="text-sm text-blue-700">
                • VHF Channel {race.critical_details.vhf_channel}
              </Text>
            )}
            {race.critical_details.warning_signal && (
              <Text className="text-sm text-blue-700">
                • Warning signal at {race.critical_details.warning_signal}
              </Text>
            )}
            {race.critical_details.first_start && (
              <Text className="text-sm text-blue-700">
                • First start at {race.critical_details.first_start}
              </Text>
            )}
          </View>
        )}
      </Card>

      <Card className="p-4 gap-3 border border-dashed border-blue-200 bg-blue-50">
        <Text className="text-base font-semibold text-blue-900">
          Want live race intelligence?
        </Text>
        <Text className="text-sm text-blue-800">
          Add your first regatta to unlock AI race prep, live weather updates, crew logistics, and more.
        </Text>
        {onAddRace && (
          <Button
            className="self-start mt-1"
            size="sm"
            onPress={onAddRace}
            accessibilityLabel="Create your first race"
          >
            <ButtonText>Add Your Race</ButtonText>
          </Button>
        )}
      </Card>
    </View>
  );
}
