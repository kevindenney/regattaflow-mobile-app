// @ts-nocheck

/**
 * Course Selector Component
 * Allows selecting a pre-defined course from the library to overlay on the race map
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CourseLibraryService } from '@/services/CourseLibraryService';
import { CourseEntryPanel } from './CourseEntryPanel';
import type { RaceCourse, Mark } from '@/types/courses';

interface CourseSelectorProps {
  venueId?: string;
  venueName?: string;
  venueCoordinates?: { lat: number; lng: number };
  onCourseSelected: (marks: Mark[]) => void;
  currentWindDirection?: number;
  currentWindSpeed?: number;
  autoSelectCourseId?: string;
  onAutoSelectComplete?: () => void;
  raceType?: 'fleet' | 'distance';
}

const courseLibrary = require('@/data/race-courses.json');
const yachtClubData = require('@/data/yacht-clubs.json');
const EARTH_RADIUS_METERS = 6371000;
const METERS_PER_NAUTICAL_MILE = 1852;

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const toDegrees = (rad: number) => (rad * 180) / Math.PI;

const projectCoordinate = (lat: number, lng: number, distanceNm: number, bearingDeg: number) => {
  const distanceMeters = distanceNm * METERS_PER_NAUTICAL_MILE;
  const bearing = toRadians((bearingDeg + 360) % 360);
  const latRad = toRadians(lat);
  const lngRad = toRadians(lng);

  const newLat = Math.asin(
    Math.sin(latRad) * Math.cos(distanceMeters / EARTH_RADIUS_METERS) +
      Math.cos(latRad) * Math.sin(distanceMeters / EARTH_RADIUS_METERS) * Math.cos(bearing)
  );

  const newLng =
    lngRad +
    Math.atan2(
      Math.sin(bearing) * Math.sin(distanceMeters / EARTH_RADIUS_METERS) * Math.cos(latRad),
      Math.cos(distanceMeters / EARTH_RADIUS_METERS) - Math.sin(latRad) * Math.sin(newLat)
    );

  return {
    lat: toDegrees(newLat),
    lng: toDegrees(newLng),
  };
};

const normalizeMarkType = (key: string, fallbackType: string = 'custom') => {
  const normalizedKey = key.toLowerCase();
  if (normalizedKey.includes('committee')) return 'committee_boat';
  if (normalizedKey.includes('start') && normalizedKey.includes('pin')) return 'pin';
  if (normalizedKey.includes('windward')) return 'windward';
  if (normalizedKey.includes('leeward') && normalizedKey.includes('port')) return 'gate_left';
  if (normalizedKey.includes('leeward') && normalizedKey.includes('star')) return 'gate_right';
  if (normalizedKey.includes('gate') && normalizedKey.includes('left')) return 'gate_left';
  if (normalizedKey.includes('gate') && normalizedKey.includes('right')) return 'gate_right';
  if (normalizedKey.includes('finish')) return 'finish';
  if (normalizedKey.includes('offset')) return 'offset';
  if (normalizedKey.includes('reach')) return 'offset';
  return fallbackType;
};

const convertSpecificCourseToRaceCourse = (course: any, regionId: string): RaceCourse => {
  const marks: Mark[] = [];
  const markEntries = course?.coordinates?.marks || {};

  Object.entries(markEntries).forEach(([key, value], index) => {
    if (!Array.isArray(value) || value.length < 2) return;
    const [lng, lat] = value as number[];
    marks.push({
      id: `${course.id}-${index}`,
      name: key.replace(/_/g, ' '),
      type: normalizeMarkType(key),
      latitude: lat,
      longitude: lng,
    });
  });

  const nearbyClub = findNearestClub(
    course?.coordinates?.raceArea?.center?.[1],
    course?.coordinates?.raceArea?.center?.[0]
  );

  return {
    id: `suggested-${course.id}`,
    name: course.name,
    description: course.description || course.location || `Suggested by ${regionId}`,
    course_type: course.type || 'custom',
    marks,
    typical_length_nm: course.distance ? parseFloat(course.distance) || undefined : undefined,
    usage_count: 0,
    origin: 'suggested',
    suggested_club: course.clubs?.[0] || nearbyClub?.id,
    suggested_club_name: nearbyClub?.name,
  };
};

const findNearbySpecificCourses = (lat?: number, lng?: number): RaceCourse[] => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return [];
  }

  const suggestions: RaceCourse[] = [];

  const regions = courseLibrary?.specificCourses || {};
  Object.entries(regions).forEach(([regionId, region]) => {
    const courses = region?.courses || {};
    Object.values(courses).forEach((course: any) => {
      const bounds = course?.coordinates?.raceArea?.bounds;
      const centerArray = course?.coordinates?.raceArea?.center;
      let courseLat: number | undefined;
      let courseLng: number | undefined;

      if (Array.isArray(centerArray) && centerArray.length >= 2) {
        [courseLng, courseLat] = centerArray;
      } else {
        const markEntries = course?.coordinates?.marks || {};
        const markCoords = Object.values(markEntries)
          .filter((value: any) => Array.isArray(value) && value.length >= 2)
          .map((value: any) => ({ lng: value[0], lat: value[1] }));
        if (markCoords.length > 0) {
          courseLat = markCoords.reduce((sum, m: any) => sum + m.lat, 0) / markCoords.length;
          courseLng = markCoords.reduce((sum, m: any) => sum + m.lng, 0) / markCoords.length;
        }
      }

      const withinBounds =
        bounds &&
        courseLat !== undefined &&
        courseLng !== undefined &&
        lat >= bounds.southwest[1] &&
        lat <= bounds.northeast[1] &&
        lng >= bounds.southwest[0] &&
        lng <= bounds.northeast[0];

      const distanceMatch =
        courseLat !== undefined &&
        courseLng !== undefined &&
        haversineMeters(lat, lng, courseLat, courseLng) / METERS_PER_NAUTICAL_MILE <= 18;

      if (withinBounds || distanceMatch) {
        suggestions.push(convertSpecificCourseToRaceCourse(course, regionId));
      }
    });
  });

  return suggestions;
};

const generateWindwardLeewardTemplate = (center: { lat: number; lng: number }, windDirection?: number): RaceCourse => {
  const axis = typeof windDirection === 'number' ? windDirection : 0;
  const startLineLengthNm = 0.12;
  const legLengthNm = 0.6;
  const gateWidthNm = 0.08;

  const startCenter = { ...center };
  const perpBearing = (axis + 90) % 360;

  const committeeBoat = projectCoordinate(startCenter.lat, startCenter.lng, startLineLengthNm / 2, perpBearing);
  const pin = projectCoordinate(startCenter.lat, startCenter.lng, startLineLengthNm / 2, (perpBearing + 180) % 360);

  const windward = projectCoordinate(startCenter.lat, startCenter.lng, legLengthNm, axis);
  const downwindCenter = projectCoordinate(startCenter.lat, startCenter.lng, legLengthNm, (axis + 180) % 360);
  const gateLeft = projectCoordinate(downwindCenter.lat, downwindCenter.lng, gateWidthNm / 2, (perpBearing + 180) % 360);
  const gateRight = projectCoordinate(downwindCenter.lat, downwindCenter.lng, gateWidthNm / 2, perpBearing);

  const finishMark = projectCoordinate(startCenter.lat, startCenter.lng, 0.02, axis);

  const nearbyClub = findNearestClub(center.lat, center.lng);

  return {
    id: `suggested-wl-${axis}`,
    name: 'Windward/Leeward (Suggested)',
    description: `Standard upwind/downwind layout aligned to ${axis}° wind.`,
    course_type: 'windward_leeward',
    marks: [
      { id: 'committee', name: 'Committee Boat', type: 'committee_boat', latitude: committeeBoat.lat, longitude: committeeBoat.lng },
      { id: 'pin', name: 'Pin', type: 'pin', latitude: pin.lat, longitude: pin.lng },
      { id: 'windward', name: 'Windward Mark', type: 'windward', latitude: windward.lat, longitude: windward.lng },
      { id: 'gate_left', name: 'Leeward Gate (Port)', type: 'gate_left', latitude: gateLeft.lat, longitude: gateLeft.lng },
      { id: 'gate_right', name: 'Leeward Gate (Starboard)', type: 'gate_right', latitude: gateRight.lat, longitude: gateRight.lng },
      { id: 'finish', name: 'Finish', type: 'finish', latitude: finishMark.lat, longitude: finishMark.lng },
    ],
    origin: 'suggested',
    suggested_club: nearbyClub?.id,
    suggested_club_name: nearbyClub?.name,
    min_wind_direction: axis,
    max_wind_direction: axis,
    min_wind_speed: 4,
    max_wind_speed: 20,
  };
};

const generateTriangleTemplate = (center: { lat: number; lng: number }, windDirection?: number): RaceCourse => {
  const axis = typeof windDirection === 'number' ? windDirection : 0;
  const legLengthNm = 0.55;
  const reachAngle = 60;

  const windward = projectCoordinate(center.lat, center.lng, legLengthNm, axis);
  const reach1 = projectCoordinate(windward.lat, windward.lng, legLengthNm, (axis - reachAngle + 360) % 360);
  const reach2 = projectCoordinate(reach1.lat, reach1.lng, legLengthNm, (axis + 180 + reachAngle) % 360);

  const nearbyClub = findNearestClub(center.lat, center.lng);

  return {
    id: `suggested-triangle-${axis}`,
    name: 'Triangle (Suggested)',
    description: `Classic triangle layout with reaching legs. Primary axis ${axis}°.`,
    course_type: 'triangle',
    marks: [
      { id: 'start', name: 'Start Line Center', type: 'committee_boat', latitude: center.lat, longitude: center.lng },
      { id: 'windward', name: 'Windward Mark', type: 'windward', latitude: windward.lat, longitude: windward.lng },
      { id: 'reach1', name: 'Reach Mark 1', type: 'offset', latitude: reach1.lat, longitude: reach1.lng },
      { id: 'reach2', name: 'Reach Mark 2', type: 'offset', latitude: reach2.lat, longitude: reach2.lng },
      { id: 'finish', name: 'Finish', type: 'finish', latitude: center.lat, longitude: center.lng },
    ],
    origin: 'suggested',
    suggested_club: nearbyClub?.id,
    suggested_club_name: nearbyClub?.name,
    min_wind_direction: axis,
    max_wind_direction: (axis + 60) % 360,
    min_wind_speed: 6,
    max_wind_speed: 18,
  };
};

const buildGenericTemplates = (
  coordinates?: { lat: number; lng: number },
  windDirection?: number
): RaceCourse[] => {
  if (!coordinates) {
    return [];
  }

  return [
    generateWindwardLeewardTemplate(coordinates, windDirection),
    generateTriangleTemplate(coordinates, windDirection),
  ];
};

export function CourseSelector({
  venueId,
  venueName,
  venueCoordinates,
  onCourseSelected,
  currentWindDirection,
  currentWindSpeed,
  autoSelectCourseId,
  onAutoSelectComplete,
  raceType = 'fleet',
}: CourseSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState<RaceCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<RaceCourse | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingAutoCourseId, setPendingAutoCourseId] = useState<string | null>(null);
  const [showEntryPanel, setShowEntryPanel] = useState(false);

  // Handle waypoints extracted from CourseEntryPanel
  const handleWaypointsExtracted = useCallback((waypoints: any[]) => {
    // Convert waypoints to marks format, preserving original types
    const marks: Mark[] = waypoints.map((wp, index) => {
      // Determine mark type based on waypoint type
      let markType: string;
      const wpType = wp.type?.toLowerCase() || '';
      
      if (wpType === 'start') {
        markType = 'committee_boat';
      } else if (wpType === 'finish') {
        markType = 'finish';
      } else if (wpType === 'gate' || wpType.includes('gate')) {
        markType = 'gate_left'; // Use gate_left as the gate marker type
      } else {
        markType = 'custom'; // For waypoints/marks
      }
      
      return {
        id: `extracted-${index}`,
        name: wp.name,
        type: markType,
        latitude: wp.latitude,
        longitude: wp.longitude,
        passingSide: wp.passingSide,
        notes: wp.notes,
      };
    });
    
    onCourseSelected(marks);
    setShowModal(false);
    setShowEntryPanel(false);
  }, [onCourseSelected]);

  useEffect(() => {
    if (autoSelectCourseId) {
      setPendingAutoCourseId(autoSelectCourseId);
      setShowModal(true);
    }
  }, [autoSelectCourseId]);

  const loadCourses = useCallback(async () => {
    console.log('[CourseSelector] loadCourses called, venueId:', venueId, 'raceType:', raceType);
    try {
      setLoading(true);

      // Fetch discoverable courses (user's own + venue shared + public)
      let fetchedCourses: RaceCourse[] = [];
      console.log('[CourseSelector] Calling fetchDiscoverableCourses...');
      fetchedCourses = await CourseLibraryService.fetchDiscoverableCourses({
        venueId,
        raceType,
      });
      console.log('[CourseSelector] Got courses:', fetchedCourses.length);
      
      // Also apply wind filtering if specified
      if (currentWindDirection !== undefined || currentWindSpeed !== undefined) {
        fetchedCourses = fetchedCourses.filter((course) => {
          const windDirOk = currentWindDirection === undefined ||
            course.min_wind_direction == null ||
            course.max_wind_direction == null ||
            (course.min_wind_direction <= currentWindDirection && course.max_wind_direction >= currentWindDirection);
          
          const windSpeedOk = currentWindSpeed === undefined ||
            course.min_wind_speed == null ||
            course.max_wind_speed == null ||
            (course.min_wind_speed <= currentWindSpeed && course.max_wind_speed >= currentWindSpeed);
          
          return windDirOk && windSpeedOk;
        });
      }

      const suggestedCourses = [
        ...findNearbySpecificCourses(venueCoordinates?.lat, venueCoordinates?.lng),
        ...buildGenericTemplates(venueCoordinates, currentWindDirection),
      ].filter(Boolean);

      const combinedCourses = [...fetchedCourses];
      suggestedCourses.forEach((course: any) => {
        if (!combinedCourses.some(existing => existing.id === course.id)) {
          combinedCourses.push(course);
        }
      });

      setCourses(combinedCourses);

      if (pendingAutoCourseId) {
        const match = combinedCourses.find((course) => course.id === pendingAutoCourseId);
        if (match) {
          setPendingAutoCourseId(null);
          await handleCourseSelect(match, { fromAuto: true });
        }
      }
    } catch (error) {
      console.error('[CourseSelector] Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  }, [venueId, venueCoordinates, currentWindDirection, currentWindSpeed, raceType, pendingAutoCourseId]);

  useEffect(() => {
    if (showModal) {
      loadCourses();
    }
  }, [showModal, loadCourses]);

  const handleCourseSelect = async (
    course: RaceCourse,
    options: { fromAuto?: boolean } = {}
  ) => {

    setPendingAutoCourseId(null);
    setSelectedCourse(course);

    // Convert course marks to the format expected by the map
    const marks: Mark[] = (course.marks || []).map((mark, index) => ({
      id: mark.id || `${course.id}-mark-${index}`,
      name: mark.name || `Mark ${index + 1}`,
      type: mark.type || 'custom',
      latitude: mark.latitude,
      longitude: mark.longitude,
    }));

    // Record usage only for saved library courses
    if (course.origin !== 'suggested') {
      await CourseLibraryService.recordCourseUsage(course.id);
    }

    // Pass marks to parent
    onCourseSelected(marks);

    setShowModal(false);
    onAutoSelectComplete?.();
  };

  const formatWindRange = (course: RaceCourse) => {
    const hasDirection =
      typeof course.min_wind_direction === 'number' &&
      typeof course.max_wind_direction === 'number';
    const hasSpeed =
      typeof course.min_wind_speed === 'number' &&
      typeof course.max_wind_speed === 'number';

    if (hasDirection && hasSpeed) {
      return `${Math.round(course.min_wind_direction)}°-${Math.round(course.max_wind_direction)}°, ${Math.round(course.min_wind_speed)}-${Math.round(course.max_wind_speed)}kt`;
    }
    if (hasDirection) {
      return `Aligned to ${Math.round(course.min_wind_direction)}° wind`;
    }
    return 'Any conditions';
  };

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setShowModal(true)}
      >
        <MaterialCommunityIcons name="map-marker-path" size={20} color="#0066CC" />
        <Text style={styles.triggerText}>
          {selectedCourse ? selectedCourse.name : 'Select Course'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
      </TouchableOpacity>

      {/* Course Selection Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setPendingAutoCourseId(null);
          setShowModal(false);
          onAutoSelectComplete?.();
        }}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Course</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Venue Info */}
          {venueName && (
            <View style={styles.venueInfo}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#64748B" />
              <Text style={styles.venueText}>{venueName}</Text>
            </View>
          )}

          {/* Current Conditions */}
          {currentWindDirection !== undefined && currentWindSpeed !== undefined && (
            <View style={styles.conditionsInfo}>
              <MaterialCommunityIcons name="weather-windy" size={16} color="#0066CC" />
              <Text style={styles.conditionsText}>
                Current: {currentWindSpeed}kt @ {currentWindDirection}°
              </Text>
            </View>
          )}

          {/* Course List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066CC" />
              <Text style={styles.loadingText}>Loading courses...</Text>
            </View>
          ) : showEntryPanel ? (
            <ScrollView style={styles.entryPanelContainer}>
              <CourseEntryPanel
                onWaypointsExtracted={handleWaypointsExtracted}
                raceType={raceType}
                venueName={venueName}
                venueId={venueId}
                onCourseSaved={() => {
                  // Reload courses after saving
                  loadCourses();
                  setShowEntryPanel(false);
                }}
              />
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowEntryPanel(false)}
              >
                <MaterialCommunityIcons name="arrow-left" size={18} color="#64748B" />
                <Text style={styles.backButtonText}>Back to Course List</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : courses.length === 0 ? (
            <ScrollView style={styles.emptyScrollContainer}>
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="map-marker-off" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Courses Available</Text>
                <Text style={styles.emptyText}>
                  {venueId || venueCoordinates
                    ? 'No templates found for this location. Add course data below or draw on the map.'
                    : 'Set a venue to unlock nearby templates, or add course data below.'}
                </Text>
              </View>
              
              {/* Course Entry Panel in empty state */}
              <View style={styles.entryPanelWrapper}>
                <CourseEntryPanel
                  onWaypointsExtracted={handleWaypointsExtracted}
                  raceType={raceType}
                  venueName={venueName}
                  venueId={venueId}
                  onCourseSaved={() => {
                    // Reload courses after saving
                    loadCourses();
                  }}
                />
              </View>
            </ScrollView>
          ) : (
            <ScrollView style={styles.courseList}>
              {/* Add Course Button */}
              <TouchableOpacity
                style={styles.addCourseButton}
                onPress={() => setShowEntryPanel(true)}
              >
                <MaterialCommunityIcons name="plus-circle" size={20} color="#7C3AED" />
                <Text style={styles.addCourseButtonText}>Add Course from URL, PDF, or Text</Text>
              </TouchableOpacity>

              {courses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    styles.courseCard,
                    selectedCourse?.id === course.id && styles.courseCardSelected,
                  ]}
                  onPress={() => handleCourseSelect(course)}
                >
                  <View style={styles.courseHeader}>
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseName}>{course.name}</Text>
                      {(course.origin === 'suggested' || course.suggested_club || course.club_id) && (
                        <View style={styles.courseBadges}>
                          {course.origin === 'suggested' && (
                            <View style={styles.suggestedBadge}>
                              <Text style={styles.suggestedBadgeText}>Suggested</Text>
                            </View>
                          )}
                          {(course.suggested_club || course.club_id) && (
                            <View style={styles.clubBadge}>
                              <Text style={styles.clubBadgeText}>
                                {(course.suggested_club || course.club_id).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    {course.marks && (
                      <View style={styles.markCount}>
                        <MaterialCommunityIcons name="map-marker" size={14} color="#64748B" />
                        <Text style={styles.markCountText}>{course.marks.length}</Text>
                      </View>
                    )}
                  </View>

                  {course.description && (
                    <Text style={styles.courseDescription}>{course.description}</Text>
                  )}

                  <View style={styles.courseMetadata}>
                    <Text style={styles.courseType}>{course.course_type || 'Standard'}</Text>
                    <Text style={styles.courseWindRange}>{formatWindRange(course)}</Text>
                  </View>

                  {course.suggested_club_name && (
                    <Text style={styles.courseClubDetails}>
                      {course.suggested_club_name}
                      {course.origin === 'suggested' ? ' • nearby club' : ''}
                    </Text>
                  )}

                  {course.usage_count > 0 && (
                    <Text style={styles.courseUsage}>Used {course.usage_count} times</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  venueText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  conditionsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  conditionsText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  courseList: {
    flex: 1,
    padding: 16,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  courseCardSelected: {
    borderColor: '#0066CC',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  courseBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  suggestedBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  suggestedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    textTransform: 'uppercase',
  },
  clubBadge: {
    backgroundColor: '#FBCFE8',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clubBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BE185D',
    textTransform: 'uppercase',
  },
  markCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  markCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  courseDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 20,
  },
  courseMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  courseType: {
    fontSize: 13,
    color: '#0066CC',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  courseWindRange: {
    fontSize: 13,
    color: '#64748B',
  },
  courseUsage: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  courseClubDetails: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 8,
  },
  entryPanelContainer: {
    flex: 1,
    padding: 16,
  },
  entryPanelWrapper: {
    marginTop: 16,
    marginBottom: 32,
  },
  emptyScrollContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  addCourseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    gap: 8,
  },
  addCourseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
});
const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

const findNearestClub = (lat?: number, lng?: number) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  const clubs = yachtClubData?.clubs || {};
  let closest = null;
  let closestDistance = Infinity;

  Object.entries(clubs).forEach(([clubId, club]: any) => {
    const coords = club?.headquarters?.coordinates || club?.venues?.[0]?.coordinates;
    if (!coords || coords.length < 2) return;
    const [clubLng, clubLat] = coords;
    if (typeof clubLat !== 'number' || typeof clubLng !== 'number') return;
    const distanceMeters = haversineMeters(lat, lng, clubLat, clubLng);
    if (distanceMeters < closestDistance) {
      closestDistance = distanceMeters;
      closest = {
        id: clubId,
        name: club.name,
        distanceNm: distanceMeters / METERS_PER_NAUTICAL_MILE,
      };
    }
  });

  if (closest && closest.distanceNm <= 15) {
    return closest;
  }

  return null;
};
