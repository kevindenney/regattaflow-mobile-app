/**
 * Boat3DCard Component
 * Large phone-sized card with 3D boat preview and tuning summary
 * Similar to RaceCard but for boats
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sailboat, Star, Settings } from 'lucide-react-native';
import { MockBoat } from '@/constants/mockData';
import { Boat3DViewer } from './Boat3DViewer';

interface Boat3DCardProps {
  boat: MockBoat;
  isPrimary?: boolean;
  onPress?: () => void;
  onSettingsPress?: () => void;
}

export function Boat3DCard({
  boat,
  isPrimary = false,
  onPress,
  onSettingsPress,
}: Boat3DCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className={`rounded-xl overflow-hidden shadow-lg mb-4 ${
        isPrimary ? 'bg-sky-600' : 'bg-white'
      }`}
      style={{
        width: 375,
        minHeight: isPrimary ? 540 : 440,
      }}
    >
      {/* Primary Badge */}
      {isPrimary && (
        <View className="absolute top-4 right-4 z-10 bg-yellow-400 rounded-full px-3 py-1 flex-row items-center">
          <Star size={14} color="#78350f" fill="#78350f" />
          <Text className="text-yellow-900 font-bold text-xs ml-1">Primary</Text>
        </View>
      )}

      {/* Header */}
      <View className={`p-4 ${isPrimary ? 'bg-sky-700' : 'bg-gray-50'}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Sailboat
              size={24}
              color={isPrimary ? '#ffffff' : '#0284c7'}
            />
            <View className="ml-3 flex-1">
              <Text
                className={`text-lg font-bold ${
                  isPrimary ? 'text-white' : 'text-gray-900'
                }`}
              >
                {boat.name}
              </Text>
              <Text
                className={`text-sm ${
                  isPrimary ? 'text-sky-100' : 'text-gray-600'
                }`}
              >
                {boat.class} • {boat.sailNumber}
              </Text>
            </View>
          </View>

          {/* Settings Button */}
          <TouchableOpacity
            onPress={onSettingsPress}
            className={`p-2 rounded-full ${
              isPrimary ? 'bg-sky-800' : 'bg-gray-200'
            }`}
          >
            <Settings
              size={20}
              color={isPrimary ? '#ffffff' : '#4b5563'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3D Viewer */}
      <View className="bg-sky-50">
        <Boat3DViewer
          boatClass={boat.class}
          tuning={boat.tuning}
          width={375}
          height={isPrimary ? 280 : 200}
        />
      </View>

      {/* Tuning Summary */}
      <View className={`p-4 ${isPrimary ? 'bg-sky-700' : 'bg-white'}`}>
        <Text
          className={`font-semibold mb-3 ${
            isPrimary ? 'text-white' : 'text-gray-900'
          }`}
        >
          Current Tuning
        </Text>

        <View className="flex-row flex-wrap gap-2">
          {/* Shrouds */}
          <View
            className={`flex-1 min-w-[45%] rounded-lg p-3 ${
              isPrimary ? 'bg-sky-800' : 'bg-gray-50'
            }`}
          >
            <Text
              className={`text-xs ${
                isPrimary ? 'text-sky-200' : 'text-gray-600'
              }`}
            >
              Shrouds
            </Text>
            <Text
              className={`text-lg font-bold mt-1 ${
                isPrimary ? 'text-white' : 'text-gray-900'
              }`}
            >
              {boat.tuning.shrouds}
            </Text>
          </View>

          {/* Backstay */}
          <View
            className={`flex-1 min-w-[45%] rounded-lg p-3 ${
              isPrimary ? 'bg-sky-800' : 'bg-gray-50'
            }`}
          >
            <Text
              className={`text-xs ${
                isPrimary ? 'text-sky-200' : 'text-gray-600'
              }`}
            >
              Backstay
            </Text>
            <Text
              className={`text-lg font-bold mt-1 ${
                isPrimary ? 'text-white' : 'text-gray-900'
              }`}
            >
              {boat.tuning.backstay}
            </Text>
          </View>

          {/* Forestay */}
          <View
            className={`flex-1 min-w-[45%] rounded-lg p-3 ${
              isPrimary ? 'bg-sky-800' : 'bg-gray-50'
            }`}
          >
            <Text
              className={`text-xs ${
                isPrimary ? 'text-sky-200' : 'text-gray-600'
              }`}
            >
              Forestay
            </Text>
            <Text
              className={`text-lg font-bold mt-1 ${
                isPrimary ? 'text-white' : 'text-gray-900'
              }`}
            >
              {boat.tuning.forestay}mm
            </Text>
          </View>

          {/* Mast Butt */}
          <View
            className={`flex-1 min-w-[45%] rounded-lg p-3 ${
              isPrimary ? 'bg-sky-800' : 'bg-gray-50'
            }`}
          >
            <Text
              className={`text-xs ${
                isPrimary ? 'text-sky-200' : 'text-gray-600'
              }`}
            >
              Mast Butt
            </Text>
            <Text
              className={`text-lg font-bold mt-1 ${
                isPrimary ? 'text-white' : 'text-gray-900'
              }`}
            >
              {boat.tuning.mastButtPosition}mm
            </Text>
          </View>
        </View>

        {/* Equipment Info */}
        {boat.equipment && (
          <View className="mt-4 pt-4 border-t border-gray-200/20">
            <Text
              className={`text-xs ${
                isPrimary ? 'text-sky-200' : 'text-gray-600'
              }`}
            >
              {boat.equipment.hull_maker && `Hull: ${boat.equipment.hull_maker}`}
              {boat.equipment.hull_maker && boat.equipment.sail_maker && ' • '}
              {boat.equipment.sail_maker && `Sails: ${boat.equipment.sail_maker}`}
            </Text>
          </View>
        )}
      </View>

      {/* Action Button */}
      <View className={`p-4 ${isPrimary ? 'bg-sky-700' : 'bg-white'}`}>
        <View
          className={`rounded-lg py-3 items-center ${
            isPrimary ? 'bg-white' : 'bg-sky-600'
          }`}
        >
          <Text
            className={`font-bold ${
              isPrimary ? 'text-sky-700' : 'text-white'
            }`}
          >
            Adjust Rig Tuning
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
