/**
 * Persona Tab Bar
 * Allows users to switch between Sailor, Club, and Coach onboarding flows
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Anchor, Building2, GraduationCap } from 'lucide-react-native';

export type PersonaType = 'sailor' | 'club' | 'coach';

interface PersonaTabBarProps {
  selectedPersona: PersonaType;
  onPersonaChange: (persona: PersonaType) => void;
}

export function PersonaTabBar({ selectedPersona, onPersonaChange }: PersonaTabBarProps) {
  const tabs: { type: PersonaType; label: string; icon: React.ReactNode }[] = [
    { type: 'sailor', label: 'Sailor', icon: <Anchor size={20} /> },
    { type: 'club', label: 'Club', icon: <Building2 size={20} /> },
    { type: 'coach', label: 'Coach', icon: <GraduationCap size={20} /> },
  ];

  return (
    <View className="flex-row border-b border-gray-200 bg-white">
      {tabs.map((tab) => {
        const isSelected = selectedPersona === tab.type;
        return (
          <TouchableOpacity
            key={tab.type}
            onPress={() => onPersonaChange(tab.type)}
            className={`flex-1 flex-row items-center justify-center gap-2 py-4 border-b-2 ${
              isSelected ? 'border-sky-600' : 'border-transparent'
            }`}
          >
            <View className={isSelected ? 'text-sky-600' : 'text-gray-500'}>
              {tab.icon}
            </View>
            <Text
              className={`font-semibold ${
                isSelected ? 'text-sky-600' : 'text-gray-500'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default PersonaTabBar;
