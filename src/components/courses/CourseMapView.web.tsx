import React from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';

interface CourseMark {
  id: string;
  name: string;
  type: 'start' | 'mark' | 'finish' | 'gate';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  color?: string;
}

interface CourseMapViewProps {
  courseMarks?: CourseMark[];
  centerCoordinate?: { latitude: number; longitude: number };
  onMarkPress?: (mark: CourseMark) => void;
  prediction?: any; // Simplified for web - not used yet
}

const CourseMapView: React.FC<CourseMapViewProps> = () => {
  return (
    <View className="flex-1 bg-gray-100 items-center justify-center">
      <MapPin color="#6B7280" size={48} />
      <Text className="text-gray-600 mt-4 text-center px-4">
        Course map view available on mobile app
      </Text>
      <Text className="text-gray-500 text-sm mt-2">
        Download the iOS or Android app for 3D race course visualization
      </Text>
    </View>
  );
};

export default CourseMapView;
