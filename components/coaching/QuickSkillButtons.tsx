/**
 * Quick Skill Buttons Component
 * Horizontal scrollable buttons for instant AI coaching on specific topics
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import {
  DEFAULT_SKILL_ORDER,
  SKILL_DISPLAY,
  buildQuickContext,
  invokeSkill,
  type CoachingSkillKey,
  type SkillDisplayDefinition,
  type SkillAdvice,
} from './skillInvocation';

const QUICK_SKILLS: SkillDisplayDefinition[] = DEFAULT_SKILL_ORDER.map(
  (key) => SKILL_DISPLAY[key]
);

interface QuickSkillButtonsProps {
  raceData?: any;
  onSkillInvoked?: (skillId: CoachingSkillKey, advice: SkillAdvice) => void;
  className?: string;
}

export function QuickSkillButtons({
  raceData,
  onSkillInvoked,
  className = ''
}: QuickSkillButtonsProps) {
  const [loadingSkill, setLoadingSkill] = useState<CoachingSkillKey | null>(null);

  const handleSkillPress = async (skill: SkillDisplayDefinition) => {
    setLoadingSkill(skill.id);

    try {
      console.log(`🎯 Invoking skill: ${skill.label}`);

      // Build simple context for quick query
      const context = buildQuickContext(skill.id, raceData);

      // Invoke the actual skill
      const advice = await invokeSkill(skill.id, context);

      console.log(`✅ Got advice:`, advice);

      // Format the message
      const message = advice.primary + (advice.details ? `\n\n${advice.details}` : '');

      // Show the advice - use browser alert on web
      if (Platform.OS === 'web') {
        window.alert(`${skill.icon} ${skill.label}\n\n${message}`);
      } else {
        Alert.alert(
          `${skill.icon} ${skill.label}`,
          message,
          [{ text: 'Got it', style: 'default' }]
        );
      }

      // Also trigger the parent callback
      onSkillInvoked?.(skill.id, advice);
    } catch (error) {
      console.error('❌ Error invoking skill:', error);

      if (Platform.OS === 'web') {
        window.alert('Unable to get AI advice\n\nPlease try again.');
      } else {
        Alert.alert(
          'Unable to get advice',
          'The AI Coach is temporarily unavailable. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoadingSkill(null);
    }
  };

  return (
    <View className={className}>
      <Text className="text-sm font-semibold text-gray-700 mb-2 px-4">
        Quick AI Coaching
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {QUICK_SKILLS.map(skill => (
          <Pressable
            key={skill.id}
            onPress={() => handleSkillPress(skill)}
            disabled={loadingSkill === skill.id}
            className="bg-white rounded-2xl px-4 py-3 min-w-[140px] border-2"
            style={{
              borderColor: loadingSkill === skill.id ? skill.color : '#e5e7eb',
              opacity: loadingSkill !== null && loadingSkill !== skill.id ? 0.5 : 1
            }}
          >
            {/* Icon */}
            <View className="items-center mb-2">
              <Text className="text-3xl">{skill.icon}</Text>
            </View>

            {/* Label */}
            <Text className="text-sm font-bold text-center text-gray-900 mb-1">
              {skill.label}
            </Text>

            {/* Description */}
            <Text
              className="text-xs text-center text-gray-600"
              numberOfLines={2}
            >
              {skill.description}
            </Text>

            {/* Loading indicator */}
            {loadingSkill === skill.id && (
              <View className="mt-2 items-center">
                <ActivityIndicator size="small" color={skill.color} />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
