import React from 'react';
import { View } from 'react-native';
import { Skeleton, SkeletonText } from '../skeleton';

export const RacesSkeleton: React.FC = () => {
  return (
    <View className="flex-1 bg-gray-50">
      {/* Header Skeleton */}
      <View className="bg-blue-600 pt-12 pb-4 px-4">
        <Skeleton className="h-8 w-40 mb-2 bg-blue-700" />
        <Skeleton className="h-4 w-64 bg-blue-700" />
      </View>

      {/* Content Skeleton */}
      <View className="flex-1 p-4">
        {/* Quick Actions Skeleton */}
        <View className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <Skeleton className="h-6 w-32 mb-3" />
          <View className="flex-row flex-wrap gap-2">
            <Skeleton className="h-20 w-[48%] rounded-lg" />
            <Skeleton className="h-20 w-[48%] rounded-lg" />
            <Skeleton className="h-20 w-[48%] rounded-lg" />
            <Skeleton className="h-20 w-[48%] rounded-lg" />
          </View>
        </View>

        {/* Course Summary Card Skeleton */}
        <View className="bg-white rounded-2xl shadow-lg p-4">
          <Skeleton className="h-6 w-40 mb-3" />
          <View className="flex-row justify-between mb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </View>
          <View className="flex-row justify-between mb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </View>
          <View className="flex-row justify-between mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </View>
          <Skeleton className="h-12 w-full rounded-lg" />
        </View>
      </View>
    </View>
  );
};
