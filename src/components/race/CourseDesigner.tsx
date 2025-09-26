import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, Animated } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { RaceCourse, Mark } from './RaceBuilder';
// import Svg, { Circle, Line, Polygon, Text } from 'react-native-svg';

export interface CourseDesignerProps {
  course: RaceCourse | null;
  onCourseUpdate: (course: RaceCourse) => void;
  isPreviewMode?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Convert between screen coordinates and geographic coordinates
const MOCK_BOUNDS = {
  north: 22.31,
  south: 22.26,
  east: 114.22,
  west: 114.16
};

export function CourseDesigner({ course, onCourseUpdate, isPreviewMode }: CourseDesignerProps) {
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [draggedMark, setDraggedMark] = useState<string | null>(null);
  const animatedValue = useRef(new Animated.ValueXY()).current;

  // Convert geographic coordinates to screen coordinates
  const geoToScreen = (coordinates: [number, number]): { x: number; y: number } => {
    const [lng, lat] = coordinates;
    const x = ((lng - MOCK_BOUNDS.west) / (MOCK_BOUNDS.east - MOCK_BOUNDS.west)) * (screenWidth - 60) + 30;
    const y = ((MOCK_BOUNDS.north - lat) / (MOCK_BOUNDS.north - MOCK_BOUNDS.south)) * (screenHeight - 200) + 50;
    return { x, y };
  };

  // Convert screen coordinates to geographic coordinates
  const screenToGeo = (x: number, y: number): [number, number] => {
    const lng = MOCK_BOUNDS.west + ((x - 30) / (screenWidth - 60)) * (MOCK_BOUNDS.east - MOCK_BOUNDS.west);
    const lat = MOCK_BOUNDS.north - ((y - 50) / (screenHeight - 200)) * (MOCK_BOUNDS.north - MOCK_BOUNDS.south);
    return [lng, lat];
  };

  // Pan responder for dragging marks
  const createPanResponder = (markId: string) => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: () => !isPreviewMode,
      onPanResponderGrant: () => {
        setDraggedMark(markId);
        setSelectedMark(markId);
      },
      onPanResponderMove: (evt, gestureState) => {
        animatedValue.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!course) return;

        const mark = course.marks.find(m => m.id === markId);
        if (!mark) return;

        const currentPos = geoToScreen(mark.coordinates);
        const newX = currentPos.x + gestureState.dx;
        const newY = currentPos.y + gestureState.dy;
        const newCoordinates = screenToGeo(newX, newY);

        const updatedMarks = course.marks.map(m =>
          m.id === markId ? { ...m, coordinates: newCoordinates } : m
        );

        onCourseUpdate({ ...course, marks: updatedMarks });

        animatedValue.setValue({ x: 0, y: 0 });
        setDraggedMark(null);
      }
    });
  };

  const addMark = (type: Mark['type']) => {
    if (!course) {
      // Create new course if none exists
      const newCourse: RaceCourse = {
        id: `course-${Date.now()}`,
        name: 'New Course',
        type: 'windward-leeward',
        marks: [],
        sequence: []
      };
      onCourseUpdate(newCourse);
    }

    // Add mark at center of screen
    const centerX = screenWidth / 2;
    const centerY = (screenHeight - 200) / 2 + 100;
    const coordinates = screenToGeo(centerX, centerY);

    const newMark: Mark = {
      id: `mark-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Mark`,
      type,
      coordinates,
      rounding: type === 'windward' || type === 'leeward' || type === 'reaching' ? 'port' : undefined
    };

    const updatedMarks = [...(course?.marks || []), newMark];
    const updatedCourse = course || {
      id: `course-${Date.now()}`,
      name: 'New Course',
      type: 'windward-leeward' as const,
      marks: [],
      sequence: []
    };

    onCourseUpdate({ ...updatedCourse, marks: updatedMarks });
  };

  const getMarkColor = (type: Mark['type']) => {
    switch (type) {
      case 'start': return '#22C55E';
      case 'windward': return '#EF4444';
      case 'leeward': return '#3B82F6';
      case 'reaching': return '#F59E0B';
      case 'finish': return '#8B5CF6';
      case 'gate': return '#EC4899';
      default: return '#6B7280';
    }
  };

  const renderCourseLines = () => {
    if (!course?.marks || course.marks.length < 2) return null;

    const lines = [];

    // Connect marks according to course sequence
    if (course.sequence.length > 1) {
      for (let i = 0; i < course.sequence.length - 1; i++) {
        const fromMarkId = course.sequence[i];
        const toMarkId = course.sequence[i + 1];

        const fromMark = course.marks.find(m => m.id === fromMarkId || m.name.toLowerCase().includes(fromMarkId));
        const toMark = course.marks.find(m => m.id === toMarkId || m.name.toLowerCase().includes(toMarkId));

        if (fromMark && toMark) {
          const fromPos = geoToScreen(fromMark.coordinates);
          const toPos = geoToScreen(toMark.coordinates);

          lines.push(
            <Line
              key={`line-${i}`}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke="#0066CC"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          );
        }
      }
    }

    return lines;
  };

  return (
    <View style={styles.container}>
      {/* Chart Area */}
      <View style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>
          📍 {course?.name || 'Course Design Area'}
        </ThemedText>

        {/* Course Display - Simplified without SVG for now */}
        <View style={styles.svg}>
          {/* Course content will be rendered here */}
          <View style={styles.courseContent}>
            <ThemedText style={styles.courseContentText}>
              📍 Course visualization will be implemented with MapLibre GL JS
            </ThemedText>
            <ThemedText style={styles.courseContentSubtext}>
              {course?.marks?.length || 0} marks placed
            </ThemedText>
          </View>
        </View>

        {/* No Course State */}
        {!course && (
          <View style={styles.emptyCourseContainer}>
            <ThemedText type="title" style={styles.emptyCourseTitle}>
              🎯 Start Building Your Course
            </ThemedText>
            <ThemedText style={styles.emptyCourseSubtitle}>
              Add marks using the toolbar below or select a template
            </ThemedText>
          </View>
        )}
      </View>

      {/* Mark Toolbar */}
      {!isPreviewMode && (
        <View style={styles.toolbar}>
          <ThemedText style={styles.toolbarTitle}>Add Marks:</ThemedText>
          <View style={styles.markButtons}>
            <Button variant="outline" onPress={() => addMark('start')} style={styles.markButton}>
              <ThemedText style={styles.markButtonText}>🚦 Start</ThemedText>
            </Button>
            <Button variant="outline" onPress={() => addMark('windward')} style={styles.markButton}>
              <ThemedText style={styles.markButtonText}>⬆️ Windward</ThemedText>
            </Button>
            <Button variant="outline" onPress={() => addMark('leeward')} style={styles.markButton}>
              <ThemedText style={styles.markButtonText}>⬇️ Leeward</ThemedText>
            </Button>
            <Button variant="outline" onPress={() => addMark('gate')} style={styles.markButton}>
              <ThemedText style={styles.markButtonText}>🚪 Gate</ThemedText>
            </Button>
            <Button variant="outline" onPress={() => addMark('finish')} style={styles.markButton}>
              <ThemedText style={styles.markButtonText}>🏁 Finish</ThemedText>
            </Button>
          </View>
        </View>
      )}

      {/* Course Info Panel */}
      {course && (
        <View style={styles.infoPanel}>
          <ThemedText style={styles.infoPanelTitle}>📊 Course Details</ThemedText>
          <ThemedText style={styles.infoPanelText}>
            Type: {course.type} | Marks: {course.marks.length} |
            {course.sequence.length > 0 ? ` Sequence: ${course.sequence.join(' → ')}` : ' No sequence set'}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  chartContainer: {
    flex: 1,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  svg: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  markContainer: {
    position: 'absolute',
  },
  mark: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  markLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  markNameLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  markNameText: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
  },
  emptyCourseContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyCourseTitle: {
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyCourseSubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  toolbar: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  toolbarTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  markButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  markButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markButtonText: {
    fontSize: 12,
    color: '#0066CC',
  },
  infoPanel: {
    backgroundColor: '#fff',
    padding: 12,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  infoPanelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoPanelText: {
    fontSize: 12,
    color: '#6B7280',
  },
  courseContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  courseContentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  courseContentSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});