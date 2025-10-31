/**
 * RigTuningControls Component
 * Sliders and controls for adjusting boat rig parameters
 * Updates reflected in real-time on 3D boat model
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Wrench, Anchor, Wind, Navigation2 } from 'lucide-react-native';

interface RigTuning {
  shrouds: number; // 0-100 tension units
  backstay: number; // 0-100 tension units
  forestay: number; // mm (10600-11000 typical for Dragon)
  mastButtPosition: number; // mm aft (0-100 typical)
}

interface RigTuningControlsProps {
  tuning: RigTuning;
  onTuningChange: (tuning: RigTuning) => void;
  boatClass?: string;
}

interface TuningParameter {
  key: keyof RigTuning;
  label: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
}

export function RigTuningControls({
  tuning,
  onTuningChange,
  boatClass = 'Dragon',
}: RigTuningControlsProps) {
  const parameters: TuningParameter[] = [
    {
      key: 'shrouds',
      label: 'Shroud Tension',
      icon: <Wind size={20} color="#0284c7" />,
      min: 0,
      max: 100,
      step: 1,
      unit: 'units',
      description: 'Lateral support for the mast. Higher tension = stiffer rig',
    },
    {
      key: 'backstay',
      label: 'Backstay Tension',
      icon: <Anchor size={20} color="#10b981" />,
      min: 0,
      max: 100,
      step: 1,
      unit: 'units',
      description: 'Controls mast bend and forestay tension. More = flatter main',
    },
    {
      key: 'forestay',
      label: 'Forestay Length',
      icon: <Navigation2 size={20} color="#8b5cf6" />,
      min: 10600,
      max: 11000,
      step: 5,
      unit: 'mm',
      description: 'Mast rake angle. Shorter = more rake (mast tilts aft)',
    },
    {
      key: 'mastButtPosition',
      label: 'Mast Butt Position',
      icon: <Wrench size={20} color="#f59e0b" />,
      min: 0,
      max: 100,
      step: 1,
      unit: 'mm aft',
      description: 'Fore-aft mast position in the mast step',
    },
  ];

  const handleValueChange = (key: keyof RigTuning, value: number) => {
    onTuningChange({
      ...tuning,
      [key]: value,
    });
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-gray-900 text-lg font-bold">Rig Tuning</Text>
        <Text className="text-gray-600 text-sm mt-1">
          {boatClass} Class • Adjust parameters to optimize boat setup
        </Text>
      </View>

      {/* Tuning Parameters */}
      {parameters.map((param) => (
        <View key={param.key} className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          {/* Parameter Header */}
          <View className="flex-row items-center mb-3">
            {param.icon}
            <View className="flex-1 ml-3">
              <Text className="text-gray-900 font-semibold text-base">
                {param.label}
              </Text>
              <Text className="text-gray-500 text-xs mt-1">
                {param.description}
              </Text>
            </View>
          </View>

          {/* Current Value Display */}
          <View className="flex-row items-baseline mb-3">
            <Text className="text-sky-600 text-2xl font-bold">
              {tuning[param.key]}
            </Text>
            <Text className="text-gray-500 text-sm ml-2">{param.unit}</Text>
          </View>

          {/* Slider - Using basic React Native component for now */}
          {/* TODO: Implement proper Gluestack slider when styles are ready */}
          <View className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <View
              className="bg-sky-600 h-full rounded-full"
              style={{
                width: `${
                  ((tuning[param.key] - param.min) / (param.max - param.min)) * 100
                }%`,
              }}
            />
          </View>

          {/* Min/Max Labels */}
          <View className="flex-row justify-between mt-2">
            <Text className="text-gray-400 text-xs">
              {param.min} {param.unit}
            </Text>
            <Text className="text-gray-400 text-xs">
              {param.max} {param.unit}
            </Text>
          </View>

          {/* Tap zones for adjustment */}
          <View className="flex-row gap-2 mt-3">
            <View
              className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
              onTouchEnd={() =>
                handleValueChange(
                  param.key,
                  Math.max(param.min, tuning[param.key] - param.step)
                )
              }
            >
              <Text className="text-gray-700 font-semibold">− {param.step}</Text>
            </View>
            <View
              className="flex-1 bg-sky-50 rounded-lg py-2 items-center border border-sky-200"
              onTouchEnd={() =>
                handleValueChange(
                  param.key,
                  (param.min + param.max) / 2
                )
              }
            >
              <Text className="text-sky-700 font-semibold">Reset</Text>
            </View>
            <View
              className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
              onTouchEnd={() =>
                handleValueChange(
                  param.key,
                  Math.min(param.max, tuning[param.key] + param.step)
                )
              }
            >
              <Text className="text-gray-700 font-semibold">+ {param.step}</Text>
            </View>
          </View>
        </View>
      ))}

      {/* Save Button */}
      <View className="bg-sky-600 rounded-lg py-4 items-center mt-4">
        <Text className="text-white font-bold text-base">
          Save Tuning Configuration
        </Text>
      </View>

      {/* Helper Text */}
      <Text className="text-gray-500 text-xs text-center mt-4 mb-8">
        Changes are reflected in real-time on the 3D model above
      </Text>
    </ScrollView>
  );
}
