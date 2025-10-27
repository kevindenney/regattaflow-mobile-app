import React from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';

interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  latitude: number;
  longitude: number;
  distance: number;
  type: 'registered' | 'available' | 'travel' | 'training' | 'social';
  registrationStatus?: 'confirmed' | 'pending' | 'waitlist';
  prepStatus?: number;
}

interface Venue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isSaved: boolean;
  isHome: boolean;
}

interface MapViewProps {
  events?: Event[];
  venues?: Venue[];
  currentLocation?: { latitude: number; longitude: number };
  onEventPress?: (event: Event) => void;
  onVenuePress?: (venue: Venue) => void;
}

const CalendarMapView: React.FC<MapViewProps> = () => {
  return (
    <View className="flex-1 bg-gray-100 items-center justify-center">
      <MapPin color="#6B7280" size={48} />
      <Text className="text-gray-600 mt-4 text-center px-4">
        Map view available on mobile app
      </Text>
      <Text className="text-gray-500 text-sm mt-2">
        Download the iOS or Android app for full map features
      </Text>
    </View>
  );
};

export default CalendarMapView;
