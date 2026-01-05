/**
 * Course Outline Card
 *
 * Displays course groups and their associated courses with sequences.
 * Used in the races screen to show available course configurations.
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { CourseOutlineGroup } from '@/lib/races';

export interface CourseOutlineCardProps {
  /** Array of course groups to display */
  groups: CourseOutlineGroup[];
}

/**
 * Course Outline Card Component
 */
export function CourseOutlineCard({ groups }: CourseOutlineCardProps) {
  if (!groups || groups.length === 0) {
    return null;
  }

  return (
    <View className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
      <Text className="text-base font-semibold text-slate-900">
        Course Outlines
      </Text>
      {groups.map((group) => (
        <View key={group.group} className="mt-4">
          <Text className="text-sm font-semibold text-slate-800">
            {group.group}
          </Text>
          <Text className="text-xs text-slate-500 mt-1">{group.description}</Text>
          <View className="mt-2">
            {group.courses.map((course) => (
              <View
                key={course.name}
                className="flex-row items-start gap-3 mt-1"
              >
                <Text className="text-[11px] font-semibold text-slate-700 w-20">
                  {course.name}
                </Text>
                <Text className="flex-1 text-[11px] text-slate-600">
                  {course.sequence}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export default CourseOutlineCard;
