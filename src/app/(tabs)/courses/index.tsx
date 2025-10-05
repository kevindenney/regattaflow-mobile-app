// src/app/(tabs)/courses/index.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Map, Calendar, MapPin, ChevronRight } from 'lucide-react-native';
import { Button, ButtonText, ButtonIcon } from '@/src/components/ui/button';
import { Badge, BadgeText } from '@/src/components/ui/badge';
import { Card } from '@/src/components/ui/card';
import { EmptyState } from '@/src/components/ui/empty';
import CourseMapView from '@/src/components/courses/CourseMapView';
import { useRaces } from '@/src/hooks/useRaces';

interface RaceWithCourse {
  id: string;
  name: string;
  date: string;
  venue: string;
  hasStrategy: boolean;
  courseMarks: any[];
}

export default function CoursesScreen() {
  const router = useRouter();
  const { races, loading } = useRaces();
  const [selectedRace, setSelectedRace] = useState<RaceWithCourse | null>(null);

  const handleCreateNew = () => {
    // Launch the wizard
    router.push('/courses/new/upload');
  };

  const handleViewRace = (race: RaceWithCourse) => {
    // Navigate to existing race detail
    router.push(`/courses/${race.id}`);
  };

  const renderRaceCard = ({ item }: { item: RaceWithCourse }) => (
    <TouchableOpacity
      onPress={() => handleViewRace(item)}
      className="bg-white rounded-xl mb-3 overflow-hidden active:bg-gray-50"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Course Preview Map */}
      {item.courseMarks.length > 0 && (
        <View className="h-32 bg-gray-100">
          <CourseMapView
            courseMarks={item.courseMarks}
            interactive={false}
          />
        </View>
      )}

      {/* Race Info */}
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900 mb-1">
              {item.name}
            </Text>
            <View className="flex-row items-center">
              <Calendar size={14} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">{item.date}</Text>
            </View>
            <View className="flex-row items-center mt-1">
              <MapPin size={14} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">{item.venue}</Text>
            </View>
          </View>

          <ChevronRight size={20} color="#9CA3AF" />
        </View>

        {/* Strategy Status */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row gap-2">
            <Badge action={item.hasStrategy ? 'success' : 'muted'} variant="solid">
              <BadgeText className="text-xs">
                {item.hasStrategy ? '✓ Strategy' : 'No Strategy'}
              </BadgeText>
            </Badge>
            <Badge action="info" variant="outline">
              <BadgeText className="text-xs">
                {item.courseMarks.length} marks
              </BadgeText>
            </Badge>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-primary-500 pt-12 pb-6 px-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">Race Courses</Text>
            <Text className="text-blue-100 mt-1">
              AI-powered course planning
            </Text>
          </View>

          {/* Quick Create Button */}
          <TouchableOpacity
            onPress={handleCreateNew}
            className="bg-white rounded-full p-3"
            accessibilityLabel="Create new race course"
            accessibilityRole="button"
          >
            <Plus size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map View or List */}
      {selectedRace ? (
        <View className="flex-1">
          <View className="absolute top-0 left-0 right-0 z-10 m-4">
            <Button
              action="secondary"
              variant="solid"
              size="sm"
              onPress={() => setSelectedRace(null)}
            >
              <ButtonText>← Back to List</ButtonText>
            </Button>
          </View>
          <CourseMapView
            courseMarks={selectedRace.courseMarks}
            interactive={true}
          />
        </View>
      ) : (
        <View className="flex-1">
          {/* Empty State */}
          {!loading && (!races || races.length === 0) ? (
            <EmptyState
              variant="zero"
              icon={Map}
              title="No Race Courses Yet"
              message="Upload your sailing instructions to get AI-powered course visualization and race strategy"
              actionLabel="Create First Course"
              onAction={handleCreateNew}
            />
          ) : (
            <ScrollView className="flex-1">
              <View className="px-4 py-4">
                {/* Create New Card */}
                <TouchableOpacity
                  onPress={handleCreateNew}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 mb-4"
                  accessibilityLabel="Create new race course"
                  accessibilityRole="button"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold mb-1">
                        Create New Course
                      </Text>
                      <Text className="text-blue-100 text-sm">
                        Upload sailing instructions and get AI strategy
                      </Text>
                    </View>
                    <View className="w-12 h-12 bg-white bg-opacity-20 rounded-full items-center justify-center">
                      <Plus size={28} color="white" />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Race List */}
                {races && races.map((race) => (
                  <View key={race.id}>
                    {renderRaceCard({ item: race })}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}
