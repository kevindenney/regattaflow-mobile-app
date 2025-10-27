import React from 'react';
import { View } from 'react-native';
import { Skeleton, SkeletonText } from '../skeleton';

interface ListSkeletonProps {
  count?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 5 }) => {
  return (
    <View className="flex-1">
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} className="bg-white rounded-xl shadow-sm p-4 mb-3">
          <View className="flex-row">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <View className="ml-3 flex-1">
              <SkeletonText _lines={1} className="h-5 w-3/4 mb-2" />
              <SkeletonText _lines={1} className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};
