import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import {
  MapPin,
  Home,
  Star,
  Flag,
  Navigation,
  Users,
  Calendar,
  Layers,
  X,
  Target,
  TrendingUp
} from 'lucide-react-native';

interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  latitude: number;
  longitude: number;
  distance: number; // km from current location
  type: 'registered' | 'available' | 'travel' | 'training' | 'social';
  registrationStatus?: 'confirmed' | 'pending' | 'waitlist';
  prepStatus?: number; // 0-100
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

const CalendarMapView: React.FC<MapViewProps> = ({
  events = [],
  venues = [],
  currentLocation = { latitude: 22.2793, longitude: 114.1628 }, // Default to HK
  onEventPress,
  onVenuePress,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [showVenuePopup, setShowVenuePopup] = useState(false);
  const [activeLayer, setActiveLayer] = useState({
    events: true,
    venues: true,
    saved: true,
  });

  const getMarkerColor = (type: Event['type']) => {
    switch (type) {
      case 'registered': return '#2563EB'; // Blue
      case 'available': return '#10B981'; // Green
      case 'travel': return '#F59E0B'; // Orange
      case 'training': return '#8B5CF6'; // Purple
      case 'social': return '#6B7280'; // Gray
      default: return '#2563EB';
    }
  };

  const renderEventPopup = () => {
    if (!selectedEvent) return null;

    return (
      <Modal
        visible={showEventPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEventPopup(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowEventPopup(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-t-3xl p-4">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: getMarkerColor(selectedEvent.type) }}
                  />
                  <Text className="text-lg font-bold">{selectedEvent.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowEventPopup(false)}>
                  <X color="#6B7280" size={24} />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center mb-2">
                <Calendar color="#6B7280" size={16} />
                <Text className="text-gray-600 ml-2">
                  {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric'
                  })}
                </Text>
              </View>

              <View className="flex-row items-center mb-2">
                <MapPin color="#6B7280" size={16} />
                <Text className="text-gray-600 ml-2">{selectedEvent.venue}</Text>
              </View>

              <View className="flex-row items-center mb-3">
                <Navigation color="#6B7280" size={16} />
                <Text className="text-gray-600 ml-2">{selectedEvent.distance} km away</Text>
              </View>

              {selectedEvent.registrationStatus && (
                <View className={`px-3 py-2 rounded-lg mb-3 ${
                  selectedEvent.registrationStatus === 'confirmed' ? 'bg-green-100' :
                  selectedEvent.registrationStatus === 'pending' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  <Text className={`text-sm font-medium ${
                    selectedEvent.registrationStatus === 'confirmed' ? 'text-green-800' :
                    selectedEvent.registrationStatus === 'pending' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    Registration: {selectedEvent.registrationStatus.charAt(0).toUpperCase() + selectedEvent.registrationStatus.slice(1)}
                  </Text>
                </View>
              )}

              {selectedEvent.prepStatus !== undefined && (
                <View className="mb-3">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-gray-600 text-sm">Prep Status</Text>
                    <Text className="text-blue-600 font-bold">{selectedEvent.prepStatus}%</Text>
                  </View>
                  <View className="bg-gray-200 h-2 rounded-full">
                    <View
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${selectedEvent.prepStatus}%` }}
                    />
                  </View>
                </View>
              )}

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="bg-blue-600 flex-1 py-3 rounded-lg items-center"
                  onPress={() => {
                    setShowEventPopup(false);
                    onEventPress?.(selectedEvent);
                  }}
                >
                  <Text className="text-white font-bold">View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity className="border border-blue-600 flex-1 py-3 rounded-lg items-center">
                  <Text className="text-blue-600 font-bold">Get Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderVenuePopup = () => {
    if (!selectedVenue) return null;

    return (
      <Modal
        visible={showVenuePopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVenuePopup(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowVenuePopup(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-t-3xl p-4">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  {selectedVenue.isHome ? (
                    <Home color="#10B981" size={20} className="mr-2" />
                  ) : selectedVenue.isSaved ? (
                    <Star color="#F59E0B" size={20} className="mr-2" />
                  ) : (
                    <MapPin color="#6B7280" size={20} className="mr-2" />
                  )}
                  <Text className="text-lg font-bold">{selectedVenue.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowVenuePopup(false)}>
                  <X color="#6B7280" size={24} />
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="bg-blue-600 flex-1 py-3 rounded-lg items-center"
                  onPress={() => {
                    setShowVenuePopup(false);
                    onVenuePress?.(selectedVenue);
                  }}
                >
                  <Text className="text-white font-bold">View Venue</Text>
                </TouchableOpacity>
                <TouchableOpacity className="border border-blue-600 flex-1 py-3 rounded-lg items-center">
                  <Text className="text-blue-600 font-bold">
                    {selectedVenue.isSaved ? 'Remove' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View className="flex-1">
      {/* Placeholder map view - shows message for web, full map on mobile */}
      <View className="flex-1 bg-gray-100 items-center justify-center">
        <MapPin color="#6B7280" size={48} />
        <Text className="text-gray-600 mt-4 text-center px-4">
          {Platform.OS === 'web'
            ? 'Map view available on mobile app'
            : 'Loading map...'}
        </Text>
        {Platform.OS === 'web' && (
          <Text className="text-gray-500 text-sm mt-2">
            Download the iOS or Android app for full map features
          </Text>
        )}
      </View>

      {/* Layer Controls */}
      <View className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
        <TouchableOpacity
          className={`p-2 rounded ${activeLayer.events ? 'bg-blue-50' : ''}`}
          onPress={() => setActiveLayer({ ...activeLayer, events: !activeLayer.events })}
        >
          <Flag color={activeLayer.events ? '#2563EB' : '#6B7280'} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          className={`p-2 rounded mt-2 ${activeLayer.venues ? 'bg-blue-50' : ''}`}
          onPress={() => setActiveLayer({ ...activeLayer, venues: !activeLayer.venues })}
        >
          <MapPin color={activeLayer.venues ? '#2563EB' : '#6B7280'} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          className={`p-2 rounded mt-2 ${activeLayer.saved ? 'bg-blue-50' : ''}`}
          onPress={() => setActiveLayer({ ...activeLayer, saved: !activeLayer.saved })}
        >
          <Star color={activeLayer.saved ? '#2563EB' : '#6B7280'} size={20} />
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <Text className="font-bold mb-2 text-sm">Event Types</Text>
        <View className="flex-row items-center mb-1">
          <View className="w-3 h-3 rounded-full bg-blue-600 mr-2" />
          <Text className="text-xs text-gray-700">My Races</Text>
        </View>
        <View className="flex-row items-center mb-1">
          <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
          <Text className="text-xs text-gray-700">Available</Text>
        </View>
        <View className="flex-row items-center mb-1">
          <View className="w-3 h-3 rounded-full bg-orange-500 mr-2" />
          <Text className="text-xs text-gray-700">Travel (&gt;50km)</Text>
        </View>
        <View className="flex-row items-center mb-1">
          <View className="w-3 h-3 rounded-full bg-purple-500 mr-2" />
          <Text className="text-xs text-gray-700">Training</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-gray-500 mr-2" />
          <Text className="text-xs text-gray-700">Social</Text>
        </View>
      </View>

      {renderEventPopup()}
      {renderVenuePopup()}
    </View>
  );
};

export default CalendarMapView;
