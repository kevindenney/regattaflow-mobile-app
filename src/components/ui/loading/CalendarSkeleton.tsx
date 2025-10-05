import React from 'react';
import { View } from 'react-native';
import { Skeleton, SkeletonText } from '../skeleton';

export const CalendarSkeleton: React.FC = () => {
  return (
    <View className="flex-1 bg-gray-50">
      {/* Header Skeleton */}
      <View className="bg-blue-600 pt-12 pb-4 px-4">
        <Skeleton className="h-8 w-48 mb-2 bg-blue-700" />
        <Skeleton className="h-4 w-64 bg-blue-700" />
      </View>

      {/* Controls Skeleton */}
      <View className="bg-white px-4 py-3">
        <View className="flex-row mb-3">
          <Skeleton className="h-10 w-24 mr-2 rounded-lg" />
          <Skeleton className="h-10 w-20 mr-2 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </View>
        <View className="flex-row">
          <Skeleton className="h-8 w-16 mr-2 rounded-full" />
          <Skeleton className="h-8 w-20 mr-2 rounded-full" />
          <Skeleton className="h-8 w-16 mr-2 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </View>
      </View>

      {/* Calendar Grid Skeleton */}
      <View className="flex-1 px-4 py-4">
        <View className="flex-row justify-between items-center mb-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </View>

        {/* Days of week */}
        <View className="flex-row mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} className="flex-1 items-center">
              <Skeleton className="h-4 w-8" />
            </View>
          ))}
        </View>

        {/* Calendar cells */}
        {Array.from({ length: 5 }).map((_, weekIdx) => (
          <View key={weekIdx} className="flex-row mb-2">
            {Array.from({ length: 7 }).map((_, dayIdx) => (
              <View key={dayIdx} className="flex-1 h-16 border border-gray-200 p-1">
                <Skeleton className="h-4 w-6" />
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};
