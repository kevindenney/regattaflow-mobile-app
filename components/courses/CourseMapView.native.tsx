import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Platform, TurboModuleRegistry } from 'react-native';
import {
  Layers,
  Wind,
  Navigation,
  Waves,
  Cloud,
  Flag,
  Target,
  TrendingUp,
  Users,
  Eye,
  EyeOff,
  X,
  Settings,
  Zap,
  Droplets,
  Thermometer,
  MapPin,
  Info
} from 'lucide-react-native';

// Conditional imports for react-native-maps
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_DEFAULT: any = null;
let mapsAvailable = false;

// Check if native module is registered BEFORE requiring react-native-maps
if (Platform.OS !== 'web') {
  try {
    const nativeModule = TurboModuleRegistry.get('RNMapsAirModule');
    if (nativeModule) {
      const maps = require('react-native-maps');
      MapView = maps.default;
      Marker = maps.Marker;
      Polyline = maps.Polyline;
      PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
      mapsAvailable = true;
    } else {
      console.warn('[CourseMapView.native] RNMapsAirModule not registered - using fallback UI');
    }
  } catch (e) {
    console.warn('[CourseMapView.native] react-native-maps not available:', e);
  }
}

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

interface Layer {
  id: string;
  name: string;
  icon: any;
  enabled: boolean;
  category: 'environmental' | 'racing' | 'social';
}

interface CoursePrediction {
  prediction_confidence?: number;
  confidence?: number;
  prediction_reasoning?: string;
  reasoning?: string;
  forecast_wind_direction?: number;
  forecast_wind_speed?: number;
  predicted_course_name?: string;
  recommended_start_position?: {
    latitude: number;
    longitude: number;
    bias: 'pin' | 'boat' | 'middle';
  };
  wind_shifts?: Array<{
    latitude: number;
    longitude: number;
    shift_degrees: number;
    probability: number;
  }>;
  strategic_zones?: Array<{
    latitude: number;
    longitude: number;
    zone_type: 'favored' | 'avoid' | 'neutral';
    reason: string;
  }>;
}

interface CourseMapViewProps {
  courseMarks?: CourseMark[];
  centerCoordinate?: { latitude: number; longitude: number };
  onMarkPress?: (mark: CourseMark) => void;
  prediction?: CoursePrediction | null;
  selectedMarkId?: string;
  /** When true, hides overlay controls for use in compact/embedded contexts */
  compact?: boolean;
}

const CourseMapView: React.FC<CourseMapViewProps> = ({
  courseMarks = [],
  centerCoordinate = { latitude: 22.2793, longitude: 114.1628 }, // Default to HK
  onMarkPress,
  prediction = null,
  selectedMarkId,
  compact = false,
}) => {
  const mapRef = useRef<any>(null);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [selectedMark, setSelectedMark] = useState<CourseMark | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('satellite');

  const [layers, setLayers] = useState<Layer[]>([
    // Environmental Layers
    { id: 'wind', name: 'Wind', icon: Wind, enabled: true, category: 'environmental' },
    { id: 'current', name: 'Current', icon: Navigation, enabled: true, category: 'environmental' },
    { id: 'waves', name: 'Waves', icon: Waves, enabled: false, category: 'environmental' },
    { id: 'weather', name: 'Weather', icon: Cloud, enabled: false, category: 'environmental' },

    // Racing Layers
    { id: 'marks', name: 'Course Marks', icon: Flag, enabled: true, category: 'racing' },
    { id: 'boundaries', name: 'Boundaries', icon: MapPin, enabled: true, category: 'racing' },
    { id: 'laylines', name: 'Laylines', icon: TrendingUp, enabled: false, category: 'racing' },
    { id: 'favored', name: 'Favored Side', icon: Zap, enabled: prediction !== null, category: 'racing' },
    { id: 'predicted_start', name: 'Predicted Start', icon: Target, enabled: prediction !== null, category: 'racing' },
    { id: 'wind_shifts', name: 'Wind Shifts', icon: Wind, enabled: false, category: 'racing' },

    // Social Layers
    { id: 'fleet', name: 'Fleet Members', icon: Users, enabled: false, category: 'social' },
    { id: 'tips', name: 'Community Tips', icon: Info, enabled: false, category: 'social' },
  ]);

  const toggleLayer = (layerId: string) => {
    setLayers(layers.map(layer =>
      layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
    ));
  };

  const getMarkColor = (mark: CourseMark) => {
    // Use per-mark color if provided
    if (mark.color) return mark.color;
    switch (mark.type) {
      case 'start': return '#10B981'; // Green
      case 'mark': return '#FF8C00'; // Orange (racing buoy)
      case 'finish': return '#FFFFFF'; // White
      case 'gate': return '#FF8C00'; // Orange (gate marks)
      default: return '#2563EB'; // Blue
    }
  };

  const getMarkIcon = (mark: CourseMark) => {
    const nameLower = mark.name.toLowerCase();
    if (nameLower.includes('committee')) return '⛵';
    if (nameLower.includes('pin')) return '🟠';
    if (nameLower.includes('windward')) return '🟠';
    if (mark.type === 'gate') return '🟠';
    if (mark.type === 'finish') return '⚪';
    if (mark.type === 'start') return '🚩';
    if (mark.type === 'mark') return '🟠';
    return '📍';
  };

  // Create course line from marks
  const courseCoordinates = courseMarks
    .filter(mark => layers.find(l => l.id === 'marks')?.enabled)
    .map(mark => mark.coordinates);

  const renderLayerPanel = () => (
    <Modal
      visible={showLayerPanel}
      transparent
      animationType="slide"
      onRequestClose={() => setShowLayerPanel(false)}
    >
      <View className="flex-1 bg-black/50">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={() => setShowLayerPanel(false)}
        />
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '80%' }}>
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-xl font-bold">Map Layers</Text>
            <TouchableOpacity onPress={() => setShowLayerPanel(false)}>
              <X color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-4">
            {/* Environmental Layers */}
            <Text className="text-sm font-bold text-gray-500 mb-3">ENVIRONMENTAL</Text>
            {layers.filter(l => l.category === 'environmental').map(layer => (
              <TouchableOpacity
                key={layer.id}
                className="flex-row items-center justify-between py-3 px-4 mb-2 bg-gray-50 rounded-lg"
                onPress={() => toggleLayer(layer.id)}
              >
                <View className="flex-row items-center">
                  <layer.icon color={layer.enabled ? '#2563EB' : '#9CA3AF'} size={20} />
                  <Text className={`ml-3 font-medium ${layer.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                    {layer.name}
                  </Text>
                </View>
                {layer.enabled ? (
                  <Eye color="#2563EB" size={20} />
                ) : (
                  <EyeOff color="#9CA3AF" size={20} />
                )}
              </TouchableOpacity>
            ))}

            {/* Racing Layers */}
            <Text className="text-sm font-bold text-gray-500 mb-3 mt-6">RACING</Text>
            {layers.filter(l => l.category === 'racing').map(layer => (
              <TouchableOpacity
                key={layer.id}
                className="flex-row items-center justify-between py-3 px-4 mb-2 bg-gray-50 rounded-lg"
                onPress={() => toggleLayer(layer.id)}
              >
                <View className="flex-row items-center">
                  <layer.icon color={layer.enabled ? '#2563EB' : '#9CA3AF'} size={20} />
                  <Text className={`ml-3 font-medium ${layer.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                    {layer.name}
                  </Text>
                </View>
                {layer.enabled ? (
                  <Eye color="#2563EB" size={20} />
                ) : (
                  <EyeOff color="#9CA3AF" size={20} />
                )}
              </TouchableOpacity>
            ))}

            {/* Social Layers */}
            <Text className="text-sm font-bold text-gray-500 mb-3 mt-6">SOCIAL</Text>
            {layers.filter(l => l.category === 'social').map(layer => (
              <TouchableOpacity
                key={layer.id}
                className="flex-row items-center justify-between py-3 px-4 mb-2 bg-gray-50 rounded-lg"
                onPress={() => toggleLayer(layer.id)}
              >
                <View className="flex-row items-center">
                  <layer.icon color={layer.enabled ? '#2563EB' : '#9CA3AF'} size={20} />
                  <Text className={`ml-3 font-medium ${layer.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                    {layer.name}
                  </Text>
                </View>
                {layer.enabled ? (
                  <Eye color="#2563EB" size={20} />
                ) : (
                  <EyeOff color="#9CA3AF" size={20} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderMarkPopup = () => {
    if (!selectedMark) return null;

    return (
      <Modal
        visible={!!selectedMark}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMark(null)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setSelectedMark(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-t-3xl p-4">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <Text className="text-3xl mr-2">{getMarkIcon(selectedMark)}</Text>
                  <View>
                    <Text className="text-lg font-bold">{selectedMark.name}</Text>
                    <Text className="text-gray-600 capitalize">{selectedMark.type}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedMark(null)}>
                  <X color="#6B7280" size={24} />
                </TouchableOpacity>
              </View>

              <View className="bg-gray-50 rounded-lg p-3 mb-3">
                <Text className="text-sm text-gray-600 mb-1">Coordinates</Text>
                <Text className="font-mono text-sm">
                  {selectedMark.coordinates.latitude.toFixed(6)}, {selectedMark.coordinates.longitude.toFixed(6)}
                </Text>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity className="bg-blue-600 flex-1 py-3 rounded-lg items-center">
                  <Text className="text-white font-bold">Navigate Here</Text>
                </TouchableOpacity>
                <TouchableOpacity className="border border-blue-600 flex-1 py-3 rounded-lg items-center">
                  <Text className="text-blue-600 font-bold">Add Note</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Compact mode: show actual map if available, otherwise informational UI
  if (compact) {
    if (mapsAvailable && MapView) {
      // Calculate region that fits all course marks
      const compactRegion = (() => {
        if (courseMarks.length >= 2) {
          let minLat = Infinity, maxLat = -Infinity;
          let minLng = Infinity, maxLng = -Infinity;
          courseMarks.forEach((m) => {
            minLat = Math.min(minLat, m.coordinates.latitude);
            maxLat = Math.max(maxLat, m.coordinates.latitude);
            minLng = Math.min(minLng, m.coordinates.longitude);
            maxLng = Math.max(maxLng, m.coordinates.longitude);
          });
          const latDelta = Math.max((maxLat - minLat) * 1.5, 0.005);
          const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.005);
          return {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
          };
        }
        return {
          latitude: centerCoordinate.latitude,
          longitude: centerCoordinate.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };
      })();

      return (
        <View style={{ width: '100%', height: '100%' }}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={{ flex: 1 }}
            mapType="satellite"
            initialRegion={compactRegion}
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {courseMarks.map((mark) => (
              <Marker
                key={mark.id}
                coordinate={mark.coordinates}
                title={mark.name}
                pinColor={getMarkColor(mark)}
              >
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: getMarkColor(mark),
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.3,
                      shadowRadius: 2,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{getMarkIcon(mark)}</Text>
                  </View>
                </View>
              </Marker>
            ))}
            {/* Start line: between start-type marks */}
            {(() => {
              const startMarks = courseMarks.filter(m => m.type === 'start');
              if (startMarks.length >= 2) {
                const midLat = (startMarks[0].coordinates.latitude + startMarks[1].coordinates.latitude) / 2;
                const midLng = (startMarks[0].coordinates.longitude + startMarks[1].coordinates.longitude) / 2;
                return (
                  <>
                    <Polyline
                      coordinates={startMarks.map(m => m.coordinates)}
                      strokeColor="#FFFFFF"
                      strokeWidth={2}
                    />
                    <Marker
                      coordinate={{ latitude: midLat, longitude: midLng }}
                      anchor={{ x: 0.5, y: 0.5 }}
                    >
                      <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>START</Text>
                      </View>
                    </Marker>
                  </>
                );
              }
              return null;
            })()}
            {/* Finish line: between finish mark and nearest start mark (committee boat) */}
            {(() => {
              const finishMark = courseMarks.find(m => m.type === 'finish');
              const committeeMark = courseMarks.find(m => m.type === 'start' && m.name.toLowerCase().includes('committee'));
              const startMarks = courseMarks.filter(m => m.type === 'start');
              const anchorMark = committeeMark || (startMarks.length > 1 ? startMarks[1] : startMarks[0]);
              if (finishMark && anchorMark) {
                const midLat = (finishMark.coordinates.latitude + anchorMark.coordinates.latitude) / 2;
                const midLng = (finishMark.coordinates.longitude + anchorMark.coordinates.longitude) / 2;
                return (
                  <>
                    <Polyline
                      coordinates={[anchorMark.coordinates, finishMark.coordinates]}
                      strokeColor="#FFFFFF"
                      strokeWidth={2}
                    />
                    <Marker
                      coordinate={{ latitude: midLat, longitude: midLng }}
                      anchor={{ x: 0.5, y: 0.5 }}
                    >
                      <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>FINISH</Text>
                      </View>
                    </Marker>
                  </>
                );
              }
              return null;
            })()}
          </MapView>
        </View>
      );
    }

    return (
      <View style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <MapPin size={24} color="#10B981" />
          <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#374151' }}>
            {courseMarks.length > 0 ? courseMarks[0].name : 'Course Map'}
          </Text>
        </View>
        {courseMarks.length > 0 && courseMarks[0].coordinates && (
          <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
            {courseMarks[0].coordinates.latitude.toFixed(4)}, {courseMarks[0].coordinates.longitude.toFixed(4)}
          </Text>
        )}
        <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
          Full map requires development build
        </Text>
      </View>
    );
  }

  // Fallback UI when maps aren't available (non-compact)
  if (!mapsAvailable || !MapView) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 p-4">
        <MapPin size={48} color="#6B7280" />
        <Text className="text-lg font-semibold text-gray-700 mt-4">Course Map</Text>
        <Text className="text-sm text-gray-500 text-center mt-2">
          Native maps require a development build.{'\n'}
          {courseMarks.length} marks loaded.
        </Text>
        {courseMarks.length > 0 && (
          <View className="mt-4 bg-white rounded-lg p-3 w-full">
            {courseMarks.slice(0, 5).map((mark) => (
              <Text key={mark.id} className="text-sm text-gray-600 py-1">
                • {mark.name} ({mark.type})
              </Text>
            ))}
            {courseMarks.length > 5 && (
              <Text className="text-xs text-gray-400 mt-1">
                +{courseMarks.length - 5} more marks
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        mapType={mapType}
        initialRegion={{
          latitude: centerCoordinate.latitude,
          longitude: centerCoordinate.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {/* Course Marks */}
        {layers.find(l => l.id === 'marks')?.enabled && courseMarks.map((mark) => (
          <Marker
            key={mark.id}
            coordinate={mark.coordinates}
            title={mark.name}
            description={mark.type}
            pinColor={getMarkColor(mark)}
            onPress={() => setSelectedMark(mark)}
          >
            <View className="items-center">
              <View
                className="w-10 h-10 rounded-full items-center justify-center shadow-lg"
                style={{ backgroundColor: getMarkColor(mark) }}
              >
                <Text className="text-xl">{getMarkIcon(mark)}</Text>
              </View>
              <Text className="text-xs font-bold mt-1 bg-white px-2 py-0.5 rounded shadow">
                {mark.name}
              </Text>
            </View>
          </Marker>
        ))}

        {/* Course Line */}
        {courseCoordinates.length > 1 && (
          <Polyline
            coordinates={courseCoordinates}
            strokeColor="#2563EB"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}

        {/* Wind Layer (Visual indicators - simplified for now) */}
        {layers.find(l => l.id === 'wind')?.enabled && (
          <Marker
            coordinate={centerCoordinate}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View className="items-center">
              <Wind color="#059669" size={32} />
              <Text className="text-xs font-bold text-green-600 mt-1">
                {prediction?.forecast_wind_speed || 12}kt {prediction?.forecast_wind_direction ? `${Math.round(prediction.forecast_wind_direction)}°` : 'NE'}
              </Text>
            </View>
          </Marker>
        )}

        {/* Predicted Start Position */}
        {layers.find(l => l.id === 'predicted_start')?.enabled && prediction?.recommended_start_position && (
          <Marker
            coordinate={{
              latitude: prediction.recommended_start_position.latitude,
              longitude: prediction.recommended_start_position.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View className="items-center">
              <View className="w-16 h-16 rounded-full bg-green-500/30 items-center justify-center border-4 border-green-500">
                <Target color="#10B981" size={32} />
              </View>
              <View className="bg-green-500 px-3 py-1 rounded-full mt-2">
                <Text className="text-white text-xs font-bold uppercase">
                  {prediction.recommended_start_position.bias} Start
                </Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Wind Shift Zones */}
        {layers.find(l => l.id === 'wind_shifts')?.enabled && prediction?.wind_shifts?.map((shift, idx) => (
          <Marker
            key={`shift-${idx}`}
            coordinate={{
              latitude: shift.latitude,
              longitude: shift.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View className="items-center">
              <View className="w-12 h-12 rounded-full bg-yellow-500/30 items-center justify-center border-2 border-yellow-500">
                <Wind color="#EAB308" size={24} />
              </View>
              <View className="bg-yellow-500 px-2 py-0.5 rounded mt-1">
                <Text className="text-white text-xs font-bold">
                  {shift.shift_degrees > 0 ? `+${shift.shift_degrees}°` : `${shift.shift_degrees}°`}
                </Text>
              </View>
              <Text className="text-xs text-gray-600 mt-0.5">
                {Math.round(shift.probability * 100)}%
              </Text>
            </View>
          </Marker>
        ))}

        {/* Strategic Zones (Favored/Avoid) */}
        {layers.find(l => l.id === 'favored')?.enabled && prediction?.strategic_zones?.map((zone, idx) => {
          const zoneColor = zone.zone_type === 'favored' ? '#10B981' : zone.zone_type === 'avoid' ? '#EF4444' : '#6B7280';
          const zoneIcon = zone.zone_type === 'favored' ? '✓' : zone.zone_type === 'avoid' ? '✗' : '•';

          return (
            <Marker
              key={`zone-${idx}`}
              coordinate={{
                latitude: zone.latitude,
                longitude: zone.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View className="items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center border-2"
                  style={{
                    backgroundColor: `${zoneColor}20`,
                    borderColor: zoneColor,
                  }}
                >
                  <Text className="text-lg">{zoneIcon}</Text>
                </View>
                <View className="bg-white px-2 py-0.5 rounded shadow mt-1 max-w-[100px]">
                  <Text className="text-xs font-bold text-center" numberOfLines={1}>
                    {zone.zone_type}
                  </Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Layer Controls - hidden in compact mode */}
      {!compact && (
        <View className="absolute top-4 right-4">
          <TouchableOpacity
            className="bg-white rounded-full p-3 shadow-lg mb-2"
            onPress={() => setShowLayerPanel(true)}
          >
            <Layers color="#2563EB" size={24} />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white rounded-full p-3 shadow-lg"
            onPress={() => {
              setMapType(current => {
                if (current === 'standard') return 'satellite';
                if (current === 'satellite') return 'hybrid';
                return 'standard';
              });
            }}
          >
            <MapPin color="#2563EB" size={24} />
          </TouchableOpacity>
        </View>
      )}

      {/* Active Layers Indicator - hidden in compact mode */}
      {!compact && (
        <View className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <Text className="text-xs font-bold text-gray-500 mb-2">ACTIVE LAYERS</Text>
          <View className="flex-row flex-wrap gap-2">
            {layers.filter(l => l.enabled).map(layer => (
              <View key={layer.id} className="flex-row items-center bg-blue-50 px-2 py-1 rounded">
                <layer.icon color="#2563EB" size={14} />
                <Text className="text-xs text-blue-600 ml-1">{layer.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Stats Bar - hidden in compact mode */}
      {!compact && (
        <View className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <View className="flex-row items-center mb-1">
            <Wind color="#059669" size={16} />
            <Text className="text-sm ml-2 font-medium">12kt NE</Text>
          </View>
          <View className="flex-row items-center mb-1">
            <Navigation color="#2563EB" size={16} />
            <Text className="text-sm ml-2 font-medium">0.8kt Flood</Text>
          </View>
          <View className="flex-row items-center">
            <Waves color="#8B5CF6" size={16} />
            <Text className="text-sm ml-2 font-medium">0.5m SW</Text>
          </View>
        </View>
      )}

      {!compact && renderLayerPanel()}
      {!compact && renderMarkPopup()}
    </View>
  );
};

export default CourseMapView;
