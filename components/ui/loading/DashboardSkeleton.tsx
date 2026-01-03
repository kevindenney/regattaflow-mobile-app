import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Skeleton, SkeletonText } from '../skeleton';

export const DashboardSkeleton = () => {
  return (
    <View style={skeletonStyles.container}>
      {/* DEBUG: Prominent loading indicator */}
      <View style={skeletonStyles.debugHeader}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={skeletonStyles.debugText}>Loading Races...</Text>
      </View>

      {/* Header Skeleton */}
      <View style={skeletonStyles.header}>
        <SkeletonText _lines={1} className="h-8 w-3/4 mb-4" startColor="bg-primary-400" />
        <SkeletonText _lines={1} className="h-4 w-1/2 mb-4" startColor="bg-primary-400" />
        <View style={skeletonStyles.headerCard}>
          <View style={skeletonStyles.headerRow}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={skeletonStyles.headerItem}>
                <Skeleton className="h-6 w-12 mb-1" startColor="bg-primary-500" />
                <Skeleton className="h-3 w-16" startColor="bg-primary-500" />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Content Skeleton */}
      <View className="px-4 py-4">
        {/* Next Race Card Skeleton */}
        <View className="bg-white rounded-xl shadow-md mb-4 overflow-hidden">
          <Skeleton className="h-40 w-full" />
          <View className="p-4">
            <SkeletonText _lines={2} className="h-5 mb-3" />
            <SkeletonText _lines={1} className="h-4 w-2/3 mb-3" />
            <View className="flex-row mb-4">
              <Skeleton className="h-6 w-24 rounded-full mr-2" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </View>
            <View className="flex-row">
              <Skeleton className="h-10 flex-1 mr-2 rounded-lg" />
              <Skeleton className="h-10 flex-1 rounded-lg" />
            </View>
          </View>
        </View>

        {/* Recent Race Skeleton */}
        <View className="bg-white rounded-xl shadow-md p-4 mb-4">
          <SkeletonText _lines={1} className="h-6 w-1/3 mb-3" />
          <SkeletonText _lines={1} className="h-5 w-1/2 mb-2" />
          <Skeleton className="h-8 w-16 mb-3" />
        </View>

        {/* Venue Intelligence Skeleton */}
        <View className="bg-white rounded-xl shadow-md p-4 mb-4">
          <SkeletonText _lines={1} className="h-6 w-1/2 mb-3" />
          <View className="flex-row mb-3">
            <Skeleton className="h-16 w-20 rounded-lg" />
            <View className="ml-3 flex-1">
              <SkeletonText _lines={3} className="h-4 mb-1" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50
  },
  debugHeader: {
    backgroundColor: '#2563EB', // primary-500
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  header: {
    backgroundColor: '#2563EB', // primary-500
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerCard: {
    backgroundColor: '#1D4ED8', // primary-600
    padding: 12,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerItem: {
    alignItems: 'center',
  },
});
