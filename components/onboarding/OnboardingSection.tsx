/**
 * Onboarding Section
 * Expandable container for each onboarding step with progress indicator
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react-native';

interface OnboardingSectionProps {
  title: string;
  subtitle?: string;
  stepNumber: number;
  isCompleted: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  canCollapse?: boolean; // Some sections shouldn't collapse once expanded
}

export function OnboardingSection({
  title,
  subtitle,
  stepNumber,
  isCompleted,
  isExpanded,
  onToggle,
  children,
  canCollapse = true,
}: OnboardingSectionProps) {
  return (
    <View className="mb-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <TouchableOpacity
        onPress={onToggle}
        disabled={!canCollapse && isExpanded}
        className={`flex-row items-center justify-between p-4 ${
          isExpanded ? 'border-b border-gray-200' : ''
        }`}
      >
        <View className="flex-row items-center gap-3 flex-1">
          {/* Status Icon */}
          {isCompleted ? (
            <CheckCircle2 size={24} color="#0284c7" />
          ) : (
            <View className="w-6 h-6 rounded-full border-2 border-gray-300 items-center justify-center">
              <Text className="text-xs font-semibold text-gray-500">{stepNumber}</Text>
            </View>
          )}

          {/* Title & Subtitle */}
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">{title}</Text>
            {subtitle && (
              <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>
            )}
          </View>
        </View>

        {/* Expand/Collapse Icon */}
        {canCollapse && (
          <View>
            {isExpanded ? (
              <ChevronUp size={20} color="#6b7280" />
            ) : (
              <ChevronDown size={20} color="#6b7280" />
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Section Content */}
      {isExpanded && (
        <View className="p-4">
          {React.Children.map(children, (child, index) => {
            if (typeof child === 'string' || typeof child === 'number') {
              return (
                <Text key={`child-text-${index}`}>
                  {child}
                </Text>
              );
            }
            return child;
          })}
        </View>
      )}
    </View>
  );
}

export default OnboardingSection;
