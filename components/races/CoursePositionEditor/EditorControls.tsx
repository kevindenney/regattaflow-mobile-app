/**
 * EditorControls - Wind direction and leg length controls for course positioning
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { ChevronDown, ChevronUp, Compass, Minus, Plus, RotateCcw, Wind } from 'lucide-react-native';
import type { CourseType, CourseTypeTemplate } from '@/types/courses';
import { COURSE_TEMPLATES } from '@/services/CoursePositioningService';

const isWeb = Platform.OS === 'web';

interface EditorControlsProps {
  windDirection: number;
  onWindDirectionChange: (direction: number) => void;
  legLengthNm: number;
  onLegLengthChange: (length: number) => void;
  courseType: CourseType;
  onCourseTypeChange: (type: CourseType) => void;
  onReset?: () => void;
}

// Wind direction presets for quick selection
const WIND_PRESETS: { label: string; degrees: number }[] = [
  { label: 'N', degrees: 0 },
  { label: 'NE', degrees: 45 },
  { label: 'E', degrees: 90 },
  { label: 'SE', degrees: 135 },
  { label: 'S', degrees: 180 },
  { label: 'SW', degrees: 225 },
  { label: 'W', degrees: 270 },
  { label: 'NW', degrees: 315 },
];

// Leg length options in nautical miles
const LEG_LENGTH_OPTIONS = [0.25, 0.35, 0.5, 0.75, 1.0, 1.5, 2.0];

export function EditorControls({
  windDirection,
  onWindDirectionChange,
  legLengthNm,
  onLegLengthChange,
  courseType,
  onCourseTypeChange,
  onReset,
}: EditorControlsProps) {
  // Increment/decrement wind direction
  const adjustWindDirection = useCallback((delta: number) => {
    const newDir = (windDirection + delta + 360) % 360;
    onWindDirectionChange(newDir);
  }, [windDirection, onWindDirectionChange]);

  // Increment/decrement leg length
  const adjustLegLength = useCallback((delta: number) => {
    const newLength = Math.max(0.1, Math.min(5.0, legLengthNm + delta));
    onLegLengthChange(Math.round(newLength * 100) / 100);
  }, [legLengthNm, onLegLengthChange]);

  // Get wind direction label
  const getWindLabel = (degrees: number): string => {
    const index = Math.round(degrees / 45) % 8;
    return WIND_PRESETS[index].label;
  };

  const templates = Object.values(COURSE_TEMPLATES).filter(t => t.type !== 'custom');

  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4">
      {/* Course Type Selector */}
      <View className="mb-4">
        <Text className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Course Type
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {templates.map((template) => {
            const isSelected = courseType === template.type;
            return (
              <Pressable
                key={template.type}
                onPress={() => onCourseTypeChange(template.type)}
                className={`px-3 py-2 rounded-lg border ${
                  isSelected
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? 'text-blue-700' : 'text-gray-600'
                  }`}
                >
                  {template.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {courseType !== 'custom' && (
          <Text className="text-xs text-gray-400 mt-1">
            {COURSE_TEMPLATES[courseType].description}
          </Text>
        )}
      </View>

      {/* Wind Direction Control */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-1">
            <Wind size={14} color="#6366f1" />
            <Text className="text-xs font-semibold text-gray-500 uppercase">
              Wind Direction
            </Text>
          </View>
          <Text className="text-sm font-bold text-indigo-600">
            {windDirection}° ({getWindLabel(windDirection)})
          </Text>
        </View>

        {/* Compass Rose Quick Select */}
        <View className="flex-row flex-wrap gap-1 mb-2">
          {WIND_PRESETS.map((preset) => {
            const isSelected = Math.abs(windDirection - preset.degrees) < 23;
            return (
              <Pressable
                key={preset.label}
                onPress={() => onWindDirectionChange(preset.degrees)}
                className={`w-10 h-8 items-center justify-center rounded-md ${
                  isSelected
                    ? 'bg-indigo-100 border border-indigo-400'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-indigo-700' : 'text-gray-500'
                  }`}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Fine Adjustment */}
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => adjustWindDirection(-10)}
            className="p-2 bg-gray-100 rounded-lg active:bg-gray-200"
          >
            <RotateCcw size={16} color="#64748b" />
          </Pressable>
          <Pressable
            onPress={() => adjustWindDirection(-1)}
            className="p-2 bg-gray-100 rounded-lg active:bg-gray-200"
          >
            <Minus size={16} color="#64748b" />
          </Pressable>

          {/* Slider for web */}
          {isWeb && (
            <input
              type="range"
              min={0}
              max={359}
              value={windDirection}
              onChange={(e) => onWindDirectionChange(parseInt(e.target.value))}
              style={{
                flex: 1,
                height: 6,
                WebkitAppearance: 'none',
                appearance: 'none',
                background: '#e5e7eb',
                borderRadius: 3,
                outline: 'none',
              }}
            />
          )}

          <Pressable
            onPress={() => adjustWindDirection(1)}
            className="p-2 bg-gray-100 rounded-lg active:bg-gray-200"
          >
            <Plus size={16} color="#64748b" />
          </Pressable>
          <Pressable
            onPress={() => adjustWindDirection(10)}
            className="p-2 bg-gray-100 rounded-lg active:bg-gray-200"
          >
            <ChevronUp size={16} color="#64748b" />
          </Pressable>
        </View>
      </View>

      {/* Leg Length Control */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-1">
            <Compass size={14} color="#22c55e" />
            <Text className="text-xs font-semibold text-gray-500 uppercase">
              Leg Length
            </Text>
          </View>
          <Text className="text-sm font-bold text-green-600">
            {legLengthNm} nm
          </Text>
        </View>

        {/* Quick Length Select */}
        <View className="flex-row flex-wrap gap-1 mb-2">
          {LEG_LENGTH_OPTIONS.map((length) => {
            const isSelected = Math.abs(legLengthNm - length) < 0.05;
            return (
              <Pressable
                key={length}
                onPress={() => onLegLengthChange(length)}
                className={`px-2 py-1 rounded-md ${
                  isSelected
                    ? 'bg-green-100 border border-green-400'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    isSelected ? 'text-green-700' : 'text-gray-500'
                  }`}
                >
                  {length}nm
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Fine Adjustment */}
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => adjustLegLength(-0.05)}
            className="p-2 bg-gray-100 rounded-lg active:bg-gray-200"
          >
            <Minus size={16} color="#64748b" />
          </Pressable>

          {/* Slider for web */}
          {isWeb && (
            <input
              type="range"
              min={10}
              max={200}
              value={legLengthNm * 100}
              onChange={(e) => onLegLengthChange(parseInt(e.target.value) / 100)}
              style={{
                flex: 1,
                height: 6,
                WebkitAppearance: 'none',
                appearance: 'none',
                background: '#e5e7eb',
                borderRadius: 3,
                outline: 'none',
              }}
            />
          )}

          <Pressable
            onPress={() => adjustLegLength(0.05)}
            className="p-2 bg-gray-100 rounded-lg active:bg-gray-200"
          >
            <Plus size={16} color="#64748b" />
          </Pressable>
        </View>
      </View>

      {/* Reset Button */}
      {onReset && (
        <Pressable
          onPress={onReset}
          className="flex-row items-center justify-center gap-2 py-2 bg-gray-100 rounded-lg active:bg-gray-200"
        >
          <RotateCcw size={14} color="#64748b" />
          <Text className="text-sm text-gray-600 font-medium">
            Reset to Defaults
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default EditorControls;
