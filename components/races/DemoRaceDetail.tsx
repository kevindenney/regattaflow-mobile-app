import React, { useState } from 'react';
import { View, Text, Alert, TextInput, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui/card';
import { Button, ButtonText } from '@/components/ui/button';
import { MockRace } from '@/constants/mockData';
import { Calendar, Clock, Compass, MapPin, Radio, Wind, Waves, Package, FileText, Shield, CheckCircle } from 'lucide-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AIRaceStrategy } from './AIRaceStrategy';

interface DemoRaceDetailProps {
  race: MockRace;
  onAddRace?: () => void;
  onLogisticsSectionLayout?: (y: number) => void;
  onRegulatorySectionLayout?: (y: number) => void;
}

interface RigPreset {
  id: string;
  label: string;
  windRange: string;
  uppers: string;
  lowers: string;
  runners: string;
  ram: string;
  notes: string;
}

export function DemoRaceDetail({ race, onAddRace, onLogisticsSectionLayout, onRegulatorySectionLayout }: DemoRaceDetailProps) {
  const [selectedRigBand, setSelectedRigBand] = useState<string>('medium');
  const [demoNotes, setDemoNotes] = useState<string>('');

  // Demo rig presets based on wind conditions
  const rigPresets: RigPreset[] = [
    {
      id: 'light',
      label: 'Light Air',
      windRange: '< 8 kn',
      uppers: '12–13 Loos',
      lowers: 'Slack (0–1 turn off)',
      runners: 'Ease for visible sag',
      ram: '+2 cm forward',
      notes: 'Power on: ease lowers and runners to maintain depth and acceleration.',
    },
    {
      id: 'medium',
      label: 'Today',
      windRange: `${race.wind.speedMin}–${race.wind.speedMax} kn`,
      uppers: '14–16 Loos',
      lowers: 'Mast straight athwartships',
      runners: '≈30 Loos – stay just taut',
      ram: 'Neutral to +1 cm',
      notes: `Baseline ${race.venue} tune; traveller slightly weather, maintain twist in chop.`,
    },
    {
      id: 'fresh',
      label: 'Fresh Breeze',
      windRange: '15–20 kn',
      uppers: '17–18 Loos',
      lowers: '+½ turn',
      runners: '35–40 Loos',
      ram: '+3 cm forward',
      notes: 'Flatten sails, move lead aft ½ hole, ease traveller down in gusts.',
    },
  ];

  const handleDemoInteraction = () => {
    Alert.alert(
      '🎯 Create Your Race',
      'You\'re exploring demo mode! Create your first race to:\n\n• Save custom rig settings\n• Track tuning notes\n• Get AI-powered recommendations\n• Sync with your crew',
      [
        { text: 'Create Race', onPress: onAddRace },
        { text: 'Keep Exploring', style: 'cancel' }
      ]
    );
  };
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

      {/* AI Race Strategy */}
      <AIRaceStrategy
        race={race}
        weatherData={race.wind}
        tidalData={race.tide}
      />

      {/* NoR Digest / Regulatory Section */}
      <View
        onLayout={({ nativeEvent }) => {
          const positionY = nativeEvent.layout.y;
          onRegulatorySectionLayout?.(positionY);
        }}
      >
        <View className="flex-row items-center gap-2 mb-3 mt-2">
          <FileText size={20} color="#7C3AED" />
          <Text className="text-lg font-bold text-gray-900">NoR Digest</Text>
          <View className="bg-purple-100 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-semibold text-purple-700">DEMO</Text>
          </View>
        </View>

        <Card className="p-4 gap-3 border-2 border-dashed border-purple-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">Regulatory Summary</Text>
            <TouchableOpacity
              onPress={handleDemoInteraction}
              accessibilityRole="button"
              className="flex-row items-center"
            >
              <MaterialCommunityIcons name="robot-outline" size={16} color="#7C3AED" />
              <Text className="text-xs font-semibold text-purple-600 ml-1">AI Digest</Text>
            </TouchableOpacity>
          </View>

          {/* Series Info */}
          <View className="bg-purple-50 border border-purple-100 rounded-2xl p-3">
            <Text className="text-xs font-bold text-purple-900 mb-2">DEMO SERIES • Autumn Series 2025</Text>
            <Text className="text-xs text-purple-800">
              Dragon Class racing at {race.venue}
            </Text>
          </View>

          {/* Regulatory Checklist */}
          <View className="gap-2">
            <Text className="text-xs font-semibold text-gray-800">Required Acknowledgements</Text>

            <TouchableOpacity
              onPress={handleDemoInteraction}
              accessibilityRole="button"
              className="flex-row items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-2"
            >
              <CheckCircle size={16} color="#16A34A" />
              <Text className="text-xs text-green-800 flex-1">
                <Text className="font-semibold">Clean Regatta</Text> • Eco-friendly practices required
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDemoInteraction}
              accessibilityRole="button"
              className="flex-row items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-2"
            >
              <CheckCircle size={16} color="#2563EB" />
              <Text className="text-xs text-blue-800 flex-1">
                <Text className="font-semibold">Sign-on Required</Text> • Via SailSys ≥10 min before warning
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDemoInteraction}
              accessibilityRole="button"
              className="flex-row items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl p-2"
            >
              <Shield size={16} color="#EA580C" />
              <Text className="text-xs text-orange-800 flex-1">
                <Text className="font-semibold">Safety Briefing</Text> • Complete video & quiz before first race
              </Text>
            </TouchableOpacity>
          </View>

          {/* Course Reference */}
          <View className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <Text className="text-xs font-semibold text-slate-900 mb-1">Course Reference</Text>
            <Text className="text-xs text-slate-700">
              Courses selected from RHKYC Attachment B (Geometric Courses). Race Committee will display course on board.
            </Text>
          </View>

          {/* Safety Notes */}
          <View className="bg-red-50 border border-red-200 rounded-2xl p-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Shield size={14} color="#DC2626" />
              <Text className="text-xs font-semibold text-red-900">Safety Notices</Text>
            </View>
            <Text className="text-xs text-red-800">
              • Keep clear of commercial traffic{'\n'}
              • Serious safety violations may result in DSQ or future entry bar
            </Text>
          </View>

          <Text className="text-[11px] text-slate-500">
            Create your race to get AI-powered NoR digests and compliance tracking.
          </Text>
        </Card>
      </View>

      {/* Logistics Section */}
      <View
        onLayout={({ nativeEvent }) => {
          const positionY = nativeEvent.layout.y;
          onLogisticsSectionLayout?.(positionY);
        }}
      >
        <View className="flex-row items-center gap-2 mb-3 mt-2">
          <Package size={20} color="#6366F1" />
          <Text className="text-lg font-bold text-gray-900">Logistics</Text>
          <View className="bg-blue-100 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-semibold text-blue-700">DEMO</Text>
          </View>
        </View>

        <Card className="p-4 gap-3 border-2 border-dashed border-blue-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">Rig & Sail Planner</Text>
            <TouchableOpacity
              onPress={handleDemoInteraction}
              accessibilityRole="button"
              className="flex-row items-center"
            >
              <MaterialCommunityIcons name="chat-processing-outline" size={16} color="#2563EB" />
              <Text className="text-xs font-semibold text-blue-600 ml-1">Review chat</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {rigPresets.map((preset) => {
              const isActive = preset.id === selectedRigBand;
              return (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => {
                    setSelectedRigBand(preset.id);
                    handleDemoInteraction();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  className={`px-3 py-2 rounded-full border ${isActive ? 'bg-blue-600 border-blue-600' : 'bg-blue-50 border-blue-200'}`}
                >
                  <Text className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-blue-700'}`}>
                    {preset.label} • {preset.windRange}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
            {(() => {
              const activePreset = rigPresets.find((p) => p.id === selectedRigBand) ?? rigPresets[1];
              return (
                <>
                  <View className="flex-row items-start justify-between mt-1">
                    <Text className="text-xs font-semibold text-blue-900">Uppers</Text>
                    <Text className="text-xs text-blue-800 text-right ml-3 flex-1">{activePreset.uppers}</Text>
                  </View>
                  <View className="flex-row items-start justify-between mt-1">
                    <Text className="text-xs font-semibold text-blue-900">Lowers</Text>
                    <Text className="text-xs text-blue-800 text-right ml-3 flex-1">{activePreset.lowers}</Text>
                  </View>
                  <View className="flex-row items-start justify-between mt-1">
                    <Text className="text-xs font-semibold text-blue-900">Runners</Text>
                    <Text className="text-xs text-blue-800 text-right ml-3 flex-1">{activePreset.runners}</Text>
                  </View>
                  <View className="flex-row items-start justify-between mt-1">
                    <Text className="text-xs font-semibold text-blue-900">Mast Ram</Text>
                    <Text className="text-xs text-blue-800 text-right ml-3 flex-1">{activePreset.ram}</Text>
                  </View>
                  <Text className="text-[11px] text-blue-900 mt-2">{activePreset.notes}</Text>
                </>
              );
            })()}
          </View>

          <TextInput
            value={demoNotes}
            onChangeText={setDemoNotes}
            onFocus={handleDemoInteraction}
            placeholder="Notes or adjustments (e.g., traveller +1 cm, jib lead aft ½ hole)"
            multiline
            numberOfLines={3}
            className="border border-slate-200 rounded-2xl px-3 py-2 text-sm text-slate-700"
            placeholderTextColor="#94A3B8"
          />
          <Text className="text-[11px] text-slate-500">
            Create your race to save tuning notes and sync with your crew.
          </Text>
        </Card>
      </View>

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
