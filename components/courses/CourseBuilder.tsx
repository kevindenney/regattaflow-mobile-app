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

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Animated,
  Pressable,
  KeyboardAvoidingView,
} from 'react-native';
import {
  MapPin,
  Plus,
  Trash2,
  Save,
  Layers,
  Wind,
  Waves,
  Navigation,
  X,
  ChevronUp,
  ChevronDown,
  Anchor,
  Flag,
  Target,
  Edit3,
  Check,
  GripVertical,
  Compass,
  Ruler,
  Settings,
} from 'lucide-react-native';
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

const COURSE_TYPES = [
  { key: 'windward_leeward', label: 'Windward Leeward', icon: Navigation },
  { key: 'olympic', label: 'Olympic', icon: Target },
  { key: 'trapezoid', label: 'Trapezoid', icon: Compass },
  { key: 'coastal', label: 'Coastal', icon: Anchor },
  { key: 'custom', label: 'Custom', icon: Settings },
] as const;

const MARK_TYPE_CONFIG = {
  start: { color: '#22C55E', icon: Flag, label: 'Start' },
  finish: { color: '#EF4444', icon: Flag, label: 'Finish' },
  windward: { color: '#F59E0B', icon: Navigation, label: 'Windward' },
  leeward: { color: '#3B82F6', icon: Anchor, label: 'Leeward' },
  gate_left: { color: '#8B5CF6', icon: Target, label: 'Gate L' },
  gate_right: { color: '#8B5CF6', icon: Target, label: 'Gate R' },
  mark: { color: '#64748B', icon: MapPin, label: 'Mark' },
};

export function CourseBuilder({
  initialCourse,
  onSave,
  onCancel,
  venueCenter = { lat: 22.2793, lng: 114.1628 }, // Default: RHKYC
  venueName = 'Royal Hong Kong Yacht Club',
}: CourseBuilderProps) {
  const [courseName, setCourseName] = useState(initialCourse?.name || '');
  const [venue, setVenue] = useState(initialCourse?.venue || venueName);
  const [courseType, setCourseType] = useState<CourseDraft['courseType']>(
    initialCourse?.courseType || 'custom'
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
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [overlays, setOverlays] = useState({
    nauticalChart: true,
    depthContours: true,
    wind: false,
    current: false,
    waves: false,
  });
  const [windRange, setWindRange] = useState({
    min: initialCourse?.windRange?.min ?? 8,
    max: initialCourse?.windRange?.max ?? 18,
    preferredDirection: initialCourse?.windRange?.preferredDirection ?? undefined,
  });

  const panelHeight = useRef(new Animated.Value(panelExpanded ? 440 : 80)).current;

  useEffect(() => {
    Animated.spring(panelHeight, {
      toValue: panelExpanded ? 440 : 80,
      useNativeDriver: false,
      friction: 12,
    }).start();
  }, [panelExpanded]);

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

  const handleAddMark = useCallback(() => {
    const newMarkIndex = marks.length + 1;
    const newMark: CourseMark = {
      id: `mark-${Date.now()}`,
      name: `Mark ${newMarkIndex}`,
      lat: venueCenter.lat + (Math.random() - 0.5) * 0.01,
      lng: venueCenter.lng + (Math.random() - 0.5) * 0.01,
      type: 'mark',
      draggable: true,
    };
    setMarks([...marks, newMark]);
    setSelectedMarkId(newMark.id);
  }, [marks, venueCenter]);

  const handleDeleteMark = useCallback((markId: string) => {
    setMarks((prev) => prev.filter((m) => m.id !== markId));
    setSelectedMarkId((prev) => (prev === markId ? null : prev));
    setEditingMarkId((prev) => (prev === markId ? null : prev));
  }, []);

  const handleMarkPositionChange = useCallback((markId: string, newLat: number, newLng: number) => {
    setMarks((prev) =>
      prev.map((mark) =>
        mark.id === markId ? { ...mark, lat: newLat, lng: newLng } : mark
      )
    );
  }, []);

  const handleMarkNameChange = useCallback((markId: string, newName: string) => {
    setMarks((prev) =>
      prev.map((m) =>
        m.id === markId ? { ...m, name: newName, type: determineMarkType(newName) } : m
      )
    );
  }, []);

  const handleMarkTypeChange = useCallback((markId: string, newType: CourseMark['type']) => {
    setMarks((prev) =>
      prev.map((m) => (m.id === markId ? { ...m, type: newType } : m))
    );
  }, []);

  const handleSaveCourse = useCallback(() => {
    const course: CourseDraft = {
      id: initialCourse?.id || `course-${Date.now()}`,
      name: courseName.trim() || 'Untitled Course',
      venue: venue.trim() || 'Custom Venue',
      courseType,
      marks: marks.map((m) => ({
        name: m.name,
        lat: m.lat,
        lng: m.lng,
        type: m.type,
      })),
      windRange,
      length: courseLength,
      lastUsed: new Date().toISOString(),
    };
    onSave?.(course);
  }, [courseName, venue, courseType, marks, windRange, courseLength, initialCourse?.id, onSave]);

  const handleToggleOverlay = useCallback((overlay: keyof typeof overlays) => {
    setOverlays((prev) => ({ ...prev, [overlay]: !prev[overlay] }));
  }, []);

  const selectedMark = marks.find((m) => m.id === selectedMarkId);

  const isFormValid = courseName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <X size={22} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {initialCourse ? 'Edit Course' : 'New Course'}
            </Text>
            {marks.length > 0 && (
              <Text style={styles.headerSubtitle}>
                {marks.length} marks • {courseLength.toFixed(2)} NM
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleSaveCourse}
            style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]}
            disabled={!isFormValid}
          >
            <Save size={18} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
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
            <View style={styles.nativeMapPlaceholder}>
              <MapPin size={64} color="#3B82F6" />
              <Text style={styles.nativeMapText}>
                3D Course Builder available on web
              </Text>
              <Text style={styles.nativeMapSubtext}>
                Use the web app for interactive map-based course creation
              </Text>
            </View>
          )}

          {/* Layer Controls (Top Right) */}
          <View style={styles.layerControlsContainer}>
            <TouchableOpacity
              onPress={() => setShowLayers(!showLayers)}
              style={styles.layerButton}
            >
              <Layers size={22} color="#1E293B" />
            </TouchableOpacity>

            {showLayers && (
              <View style={styles.layerPanel}>
                <Text style={styles.layerPanelTitle}>Map Layers</Text>
                {[
                  { key: 'nauticalChart', label: 'Nautical Chart', icon: MapPin, color: '#0284c7' },
                  { key: 'depthContours', label: 'Depth Contours', icon: Waves, color: '#10b981' },
                  { key: 'wind', label: 'Wind Vectors', icon: Wind, color: '#f59e0b' },
                  { key: 'current', label: 'Current Flow', icon: Waves, color: '#8b5cf6' },
                  { key: 'waves', label: 'Wave Height', icon: Waves, color: '#ec4899' },
                ].map((layer) => (
                  <TouchableOpacity
                    key={layer.key}
                    onPress={() => handleToggleOverlay(layer.key as keyof typeof overlays)}
                    style={styles.layerToggleRow}
                  >
                    <View style={styles.layerToggleLeft}>
                      <layer.icon size={16} color={layer.color} />
                      <Text style={styles.layerToggleLabel}>{layer.label}</Text>
                    </View>
                    <View
                      style={[
                        styles.toggleTrack,
                        overlays[layer.key as keyof typeof overlays] && styles.toggleTrackActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleThumb,
                          overlays[layer.key as keyof typeof overlays] && styles.toggleThumbActive,
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Add Mark FAB */}
          <TouchableOpacity onPress={handleAddMark} style={styles.addMarkFab}>
            <Plus size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Selected Mark Quick Actions */}
          {selectedMark && (
            <View style={styles.selectedMarkCard}>
              <View style={styles.selectedMarkHeader}>
                <View
                  style={[
                    styles.markTypeIndicator,
                    { backgroundColor: MARK_TYPE_CONFIG[selectedMark.type].color },
                  ]}
                />
                <Text style={styles.selectedMarkName}>{selectedMark.name}</Text>
                <TouchableOpacity
                  onPress={() => setSelectedMarkId(null)}
                  style={styles.selectedMarkClose}
                >
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
              <Text style={styles.selectedMarkCoords}>
                {selectedMark.lat.toFixed(5)}°N, {selectedMark.lng.toFixed(5)}°E
              </Text>
              <View style={styles.selectedMarkActions}>
                <TouchableOpacity
                  onPress={() => setEditingMarkId(selectedMark.id)}
                  style={styles.selectedMarkAction}
                >
                  <Edit3 size={16} color="#3B82F6" />
                  <Text style={styles.selectedMarkActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteMark(selectedMark.id)}
                  style={styles.selectedMarkAction}
                >
                  <Trash2 size={16} color="#EF4444" />
                  <Text style={[styles.selectedMarkActionText, { color: '#EF4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Panel */}
        <Animated.View style={[styles.bottomPanel, { height: panelHeight }]}>
          {/* Panel Handle */}
          <TouchableOpacity
            onPress={() => setPanelExpanded(!panelExpanded)}
            style={styles.panelHandle}
          >
            <View style={styles.panelHandleBar} />
            {panelExpanded ? (
              <ChevronDown size={20} color="#94A3B8" />
            ) : (
              <ChevronUp size={20} color="#94A3B8" />
            )}
          </TouchableOpacity>

          {/* Panel Content */}
          <ScrollView
            style={styles.panelScroll}
            contentContainerStyle={styles.panelScrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Course Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Course Name</Text>
              <TextInput
                value={courseName}
                onChangeText={setCourseName}
                placeholder="Enter course name..."
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* Venue Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Venue</Text>
              <TextInput
                value={venue}
                onChangeText={setVenue}
                placeholder="Enter venue name..."
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* Course Type Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Course Type</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.courseTypeScroll}
              >
                {COURSE_TYPES.map((type) => {
                  const isSelected = courseType === type.key;
                  const IconComponent = type.icon;
                  return (
                    <TouchableOpacity
                      key={type.key}
                      onPress={() => setCourseType(type.key as CourseDraft['courseType'])}
                      style={[
                        styles.courseTypeChip,
                        isSelected && styles.courseTypeChipSelected,
                      ]}
                    >
                      <IconComponent
                        size={16}
                        color={isSelected ? '#FFFFFF' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.courseTypeChipText,
                          isSelected && styles.courseTypeChipTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Marks List */}
            <View style={styles.inputGroup}>
              <View style={styles.marksHeader}>
                <Text style={styles.inputLabel}>Course Marks ({marks.length})</Text>
                <TouchableOpacity onPress={handleAddMark} style={styles.addMarkInlineButton}>
                  <Plus size={14} color="#3B82F6" />
                  <Text style={styles.addMarkInlineText}>Add Mark</Text>
                </TouchableOpacity>
              </View>

              {marks.length === 0 ? (
                <View style={styles.emptyMarksState}>
                  <MapPin size={32} color="#CBD5E1" />
                  <Text style={styles.emptyMarksText}>
                    Tap + on the map or "Add Mark" to place your first mark
                  </Text>
                </View>
              ) : (
                <View style={styles.marksList}>
                  {marks.map((mark, index) => {
                    const config = MARK_TYPE_CONFIG[mark.type];
                    const IconComponent = config.icon;
                    const isEditing = editingMarkId === mark.id;
                    const isSelected = selectedMarkId === mark.id;

                    return (
                      <Pressable
                        key={mark.id}
                        onPress={() => setSelectedMarkId(mark.id)}
                        style={[
                          styles.markItem,
                          isSelected && styles.markItemSelected,
                        ]}
                      >
                        <View style={styles.markItemLeft}>
                          <View
                            style={[
                              styles.markItemIcon,
                              { backgroundColor: config.color + '20' },
                            ]}
                          >
                            <IconComponent size={14} color={config.color} />
                          </View>
                          <View style={styles.markItemInfo}>
                            {isEditing ? (
                              <TextInput
                                value={mark.name}
                                onChangeText={(text) => handleMarkNameChange(mark.id, text)}
                                onBlur={() => setEditingMarkId(null)}
                                autoFocus
                                style={styles.markNameInput}
                              />
                            ) : (
                              <Text style={styles.markItemName}>{mark.name}</Text>
                            )}
                            <Text style={styles.markItemCoords}>
                              {mark.lat.toFixed(4)}°, {mark.lng.toFixed(4)}°
                            </Text>
                          </View>
                        </View>
                        <View style={styles.markItemRight}>
                          {!isEditing && (
                            <TouchableOpacity
                              onPress={() => setEditingMarkId(mark.id)}
                              style={styles.markItemAction}
                            >
                              <Edit3 size={14} color="#64748B" />
                            </TouchableOpacity>
                          )}
                          {isEditing && (
                            <TouchableOpacity
                              onPress={() => setEditingMarkId(null)}
                              style={styles.markItemAction}
                            >
                              <Check size={14} color="#22C55E" />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            onPress={() => handleDeleteMark(mark.id)}
                            style={styles.markItemAction}
                          >
                            <Trash2 size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Course Stats Summary */}
            {marks.length >= 2 && (
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Ruler size={18} color="#3B82F6" />
                  <View>
                    <Text style={styles.statValue}>{courseLength.toFixed(2)} NM</Text>
                    <Text style={styles.statLabel}>Total Length</Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MapPin size={18} color="#8B5CF6" />
                  <View>
                    <Text style={styles.statValue}>{marks.length}</Text>
                    <Text style={styles.statLabel}>Marks</Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Compass size={18} color="#F59E0B" />
                  <View>
                    <Text style={styles.statValue}>
                      {COURSE_TYPES.find((t) => t.key === courseType)?.label.split(' ')[0]}
                    </Text>
                    <Text style={styles.statLabel}>Type</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Bottom Padding */}
            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Helper Components

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

// Styles
const styles = {
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  } as const,
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center' as const,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    position: 'relative' as const,
  },
  nativeMapPlaceholder: {
    flex: 1,
    backgroundColor: '#1E293B',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
  },
  nativeMapText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#E2E8F0',
    marginTop: 16,
    textAlign: 'center' as const,
  },
  nativeMapSubtext: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  layerControlsContainer: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    zIndex: 10,
  },
  layerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },
  layerPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    width: 200,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  layerPanelTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 12,
  },
  layerToggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  layerToggleLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  layerToggleLabel: {
    fontSize: 13,
    color: '#475569',
  },
  toggleTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center' as const,
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: '#0EA5E9',
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  toggleThumbActive: {
    marginLeft: 'auto' as const,
  },
  addMarkFab: {
    position: 'absolute' as const,
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0EA5E9',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 10,
    ...Platform.select({
      web: { boxShadow: '0 6px 20px rgba(14, 165, 233, 0.4)' },
      default: {
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  selectedMarkCard: {
    position: 'absolute' as const,
    bottom: 24,
    left: 16,
    right: 88,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    zIndex: 10,
    ...Platform.select({
      web: { boxShadow: '0 6px 20px rgba(0,0,0,0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  selectedMarkHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  markTypeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  selectedMarkName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  selectedMarkClose: {
    padding: 4,
  },
  selectedMarkCoords: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  selectedMarkActions: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  selectedMarkAction: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  selectedMarkActionText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#3B82F6',
  },
  bottomPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden' as const,
    ...Platform.select({
      web: { boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
  panelHandle: {
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  panelHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 4,
  },
  panelScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  panelScrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  inputGroup: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  courseTypeScroll: {
    gap: 10,
    paddingRight: 16,
  },
  courseTypeChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  courseTypeChipSelected: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  courseTypeChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#475569',
  },
  courseTypeChipTextSelected: {
    color: '#FFFFFF',
  },
  marksHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  addMarkInlineButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  addMarkInlineText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#3B82F6',
  },
  emptyMarksState: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed' as const,
    padding: 24,
    alignItems: 'center' as const,
  },
  emptyMarksText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center' as const,
    marginTop: 12,
    lineHeight: 18,
  },
  marksList: {
    gap: 8,
  },
  markItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  markItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  markItemLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 10,
  },
  markItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  markItemInfo: {
    flex: 1,
  },
  markItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  markNameInput: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  markItemCoords: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  markItemRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  markItemAction: {
    padding: 6,
  },
  statsCard: {
    flexDirection: 'row' as const,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    alignItems: 'center' as const,
    justifyContent: 'space-around' as const,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#CBD5E1',
  },
};
