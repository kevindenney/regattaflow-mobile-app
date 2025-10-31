// @ts-nocheck

/**
 * CourseBuilder Component
 * OnX Maps-style interactive course builder with nautical charts
 * Features:
 * - Drag-and-drop mark placement
 * - Nautical chart base layer with depth contours
 * - Animated weather overlays (wind/current/waves)
 * - Auto-calculate course length
 * - Save/load courses
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MapPin, Plus, Trash2, Save, Layers, Wind, Waves } from 'lucide-react-native';
import CourseMapView from './CourseMapView';
export type CourseDraft = {
  id?: string;
  name: string;
  venue?: string;
  courseType: 'windward_leeward' | 'olympic' | 'trapezoid' | 'coastal' | 'custom';
  marks: Array<{
    name: string;
    lat: number;
    lng: number;
    type?: CourseMark['type'];
  }>;
  windRange: {
    min: number;
    max: number;
    preferredDirection?: number;
  };
  length?: number;
  lastUsed?: string;
};

interface CourseMark {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'start' | 'windward' | 'leeward' | 'gate_left' | 'gate_right' | 'finish' | 'mark';
  draggable: boolean;
}

interface CourseBuilderProps {
  initialCourse?: CourseDraft;
  onSave?: (course: CourseDraft) => void;
  onCancel?: () => void;
  venueCenter?: { lat: number; lng: number };
  venueName?: string;
}

export function CourseBuilder({
  initialCourse,
  onSave,
  onCancel,
  venueCenter = { lat: 22.2793, lng: 114.1628 }, // Default: RHKYC
  venueName = 'Royal Hong Kong Yacht Club',
}: CourseBuilderProps) {
  const [courseName, setCourseName] = useState(initialCourse?.name || 'New Course');
  const [courseType, setCourseType] = useState<CourseDraft['courseType']>(
    initialCourse?.courseType || 'windward_leeward'
  );
  const [marks, setMarks] = useState<CourseMark[]>(
    initialCourse?.marks.map((m, idx) => {
      const inferredType =
        'type' in m && m.type ? (m.type as CourseMark['type']) : determineMarkType(m.name);
      return {
        id: `mark-${idx}`,
        name: m.name,
        lat: m.lat,
        lng: m.lng,
        type: inferredType,
        draggable: true,
      };
    }) || []
  );
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [overlays, setOverlays] = useState({
    nauticalChart: true,
    depthContours: true,
    wind: false,
    current: false,
    waves: false,
  });

  // Calculate course length based on mark positions
  const courseLength = calculateCourseLength(marks);

  const courseMapMarks = useMemo(
    () =>
      marks.map((m) => ({
        id: m.id,
        name: m.name,
        type: mapBuilderMarkTypeToMapType(m.type),
        coordinates: {
          latitude: m.lat,
          longitude: m.lng,
        },
      })),
    [marks]
  );

  const mapCenter = useMemo(() => {
    if (courseMapMarks.length === 0) {
      return { latitude: venueCenter.lat, longitude: venueCenter.lng };
    }

    const totals = courseMapMarks.reduce(
      (acc, mark) => {
        acc.lat += mark.coordinates.latitude;
        acc.lng += mark.coordinates.longitude;
        return acc;
      },
      { lat: 0, lng: 0 }
    );

    return {
      latitude: totals.lat / courseMapMarks.length,
      longitude: totals.lng / courseMapMarks.length,
    };
  }, [courseMapMarks, venueCenter.lat, venueCenter.lng]);

  const handleAddMark = () => {
    const newMark: CourseMark = {
      id: `mark-${Date.now()}`,
      name: `Mark ${marks.length + 1}`,
      lat: venueCenter.lat + (Math.random() - 0.5) * 0.01,
      lng: venueCenter.lng + (Math.random() - 0.5) * 0.01,
      type: 'mark',
      draggable: true,
    };
    setMarks([...marks, newMark]);
    setSelectedMarkId(newMark.id);
  };

  const handleDeleteMark = (markId: string) => {
    setMarks(marks.filter((m) => m.id !== markId));
    if (selectedMarkId === markId) {
      setSelectedMarkId(null);
    }
  };

  const handleMarkPositionChange = (markId: string, newLat: number, newLng: number) => {
    setMarks((prev) =>
      prev.map((mark) =>
        mark.id === markId ? { ...mark, lat: newLat, lng: newLng } : mark
      )
    );
  };

  const handleMarkNameChange = (markId: string, newName: string) => {
    setMarks(
      marks.map((m) =>
        m.id === markId ? { ...m, name: newName, type: determineMarkType(newName) } : m
      )
    );
  };

  const handleSaveCourse = () => {
    const course: CourseDraft = {
      id: initialCourse?.id || `course-${Date.now()}`,
      name: courseName,
      venue: venueName,
      courseType,
      marks: marks.map((m) => ({
        name: m.name,
        lat: m.lat,
        lng: m.lng,
        type: m.type,
      })),
      windRange: {
        min: 8,
        max: 18,
        preferredDirection: 45,
      },
      length: courseLength,
      lastUsed: new Date().toISOString(),
    };
    onSave?.(course);
  };

  const handleToggleOverlay = (overlay: keyof typeof overlays) => {
    setOverlays({ ...overlays, [overlay]: !overlays[overlay] });
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Map Container */}
      <View className="flex-1 relative">
        {Platform.OS === 'web' ? (
          <CourseMapView
            courseMarks={courseMapMarks}
            centerCoordinate={mapCenter}
            selectedMarkId={selectedMarkId ?? undefined}
            onMarkPress={(mark) => setSelectedMarkId(mark.id)}
            onMarkMove={(markId, coords) =>
              handleMarkPositionChange(markId, coords.latitude, coords.longitude)
            }
          />
        ) : (
          <View className="flex-1 bg-blue-100 items-center justify-center">
            <MapPin size={64} color="#3B82F6" />
            <Text className="text-gray-700 mt-4 text-center px-6">
              3D Course Builder available on web
            </Text>
            <Text className="text-gray-500 text-sm mt-2">
              Use the web app for interactive map-based course creation
            </Text>
          </View>
        )}

        {/* Layer Controls (Top Right) */}
        <View className="absolute top-4 right-4 z-10">
          <TouchableOpacity
            onPress={() => setShowLayers(!showLayers)}
            className="bg-white rounded-lg p-3 shadow-lg"
          >
            <Layers size={24} color="#1E293B" />
          </TouchableOpacity>

          {showLayers && (
            <View className="bg-white rounded-lg p-4 mt-2 shadow-lg" style={{ width: 200 }}>
              <Text className="font-semibold text-gray-900 mb-3">Map Layers</Text>

              <OverlayToggle
                label="Nautical Chart"
                icon={<MapPin size={16} color="#0284c7" />}
                enabled={overlays.nauticalChart}
                onToggle={() => handleToggleOverlay('nauticalChart')}
              />
              <OverlayToggle
                label="Depth Contours"
                icon={<Waves size={16} color="#10b981" />}
                enabled={overlays.depthContours}
                onToggle={() => handleToggleOverlay('depthContours')}
              />
              <OverlayToggle
                label="Wind Vectors"
                icon={<Wind size={16} color="#f59e0b" />}
                enabled={overlays.wind}
                onToggle={() => handleToggleOverlay('wind')}
              />
              <OverlayToggle
                label="Current Flow"
                icon={<Waves size={16} color="#8b5cf6" />}
                enabled={overlays.current}
                onToggle={() => handleToggleOverlay('current')}
              />
              <OverlayToggle
                label="Wave Height"
                icon={<Waves size={16} color="#ec4899" />}
                enabled={overlays.waves}
                onToggle={() => handleToggleOverlay('waves')}
              />
            </View>
          )}
        </View>

        {/* Add Mark Button (Bottom Right) */}
        <TouchableOpacity
          onPress={handleAddMark}
          className="absolute bottom-6 right-6 bg-sky-600 rounded-full p-4 shadow-lg z-10"
        >
          <Plus size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Bottom Panel - Course Details */}
      <View className="bg-white border-t border-gray-200" style={{ height: 280 }}>
        <ScrollView className="flex-1 p-4">
          {/* Course Name & Type */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Course Name</Text>
            <View className="bg-gray-100 rounded-lg px-4 py-3">
              <Text className="text-gray-900">{courseName}</Text>
            </View>
          </View>

          {/* Course Type Selector */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Course Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {(['windward_leeward', 'olympic', 'trapezoid', 'coastal', 'custom'] as const).map(
                (type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setCourseType(type)}
                    className={`px-4 py-2 rounded-full ${
                      courseType === type ? 'bg-sky-600' : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        courseType === type ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          {/* Marks List */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Course Marks ({marks.length})
            </Text>
            {marks.length === 0 ? (
              <View className="bg-gray-50 rounded-lg p-4 items-center">
                <MapPin size={32} color="#CBD5E1" />
                <Text className="text-gray-500 text-sm mt-2">
                  Tap + to add your first mark
                </Text>
              </View>
            ) : (
              <View className="space-y-2">
                {marks.map((mark) => (
                  <View
                    key={mark.id}
                    className={`flex-row items-center justify-between p-3 rounded-lg ${
                      selectedMarkId === mark.id ? 'bg-sky-50 border-2 border-sky-600' : 'bg-gray-50'
                    }`}
                  >
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">{mark.name}</Text>
                      <Text className="text-xs text-gray-500">
                        {mark.lat.toFixed(5)}, {mark.lng.toFixed(5)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteMark(mark.id)} className="p-2">
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Course Stats */}
          <View className="bg-gray-50 rounded-lg p-4 mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Course Statistics</Text>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-xs text-gray-500">Length</Text>
                <Text className="text-lg font-bold text-gray-900">{courseLength.toFixed(2)} NM</Text>
              </View>
              <View>
                <Text className="text-xs text-gray-500">Marks</Text>
                <Text className="text-lg font-bold text-gray-900">{marks.length}</Text>
              </View>
              <View>
                <Text className="text-xs text-gray-500">Type</Text>
                <Text className="text-lg font-bold text-gray-900">
                  {courseType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
            >
              <Text className="font-semibold text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveCourse}
              className="flex-1 bg-sky-600 rounded-lg py-3 items-center flex-row justify-center gap-2"
            >
              <Save size={18} color="#FFFFFF" />
              <Text className="font-semibold text-white">Save Course</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// Helper Components

interface OverlayToggleProps {
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: () => void;
}

function OverlayToggle({ label, icon, enabled, onToggle }: OverlayToggleProps) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      className="flex-row items-center justify-between py-2 border-b border-gray-100"
    >
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-sm text-gray-700">{label}</Text>
      </View>
      <View
        className={`w-10 h-6 rounded-full ${enabled ? 'bg-sky-600' : 'bg-gray-300'}`}
      >
        <View
          className={`w-5 h-5 rounded-full bg-white mt-0.5 ${
            enabled ? 'ml-4' : 'ml-0.5'
          }`}
        />
      </View>
    </TouchableOpacity>
  );
}

// Helper Functions

function determineMarkType(name: string): CourseMark['type'] {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('start')) return 'start';
  if (lowerName.includes('finish')) return 'finish';
  if (lowerName.includes('windward') || lowerName.includes('mark 1')) return 'windward';
  if (lowerName.includes('leeward') || lowerName.includes('gate')) {
    if (lowerName.includes('left')) return 'gate_left';
    if (lowerName.includes('right')) return 'gate_right';
    return 'leeward';
  }
  return 'mark';
}

function mapBuilderMarkTypeToMapType(
  type: CourseMark['type']
): 'start' | 'mark' | 'finish' | 'gate' {
  switch (type) {
    case 'start':
      return 'start';
    case 'finish':
      return 'finish';
    case 'gate_left':
    case 'gate_right':
      return 'gate';
    default:
      return 'mark';
  }
}

function calculateCourseLength(marks: CourseMark[]): number {
  if (marks.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < marks.length - 1; i++) {
    const d = haversineDistance(
      marks[i].lat,
      marks[i].lng,
      marks[i + 1].lat,
      marks[i + 1].lng
    );
    totalDistance += d;
  }

  return totalDistance;
}

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * Returns distance in nautical miles
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
