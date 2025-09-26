import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { OfficialRaceCourse, OfficialMark } from './YachtClubRaceBuilder';

interface ProfessionalCourseDesignerProps {
  course: OfficialRaceCourse | null;
  onCourseUpdate: (course: OfficialRaceCourse) => void;
  savedCourses: OfficialRaceCourse[];
  onCourseSelect: (course: OfficialRaceCourse) => void;
}

export function ProfessionalCourseDesigner({
  course,
  onCourseUpdate,
  savedCourses,
  onCourseSelect
}: ProfessionalCourseDesignerProps) {
  const [selectedMarkType, setSelectedMarkType] = useState<OfficialMark['type'] | null>(null);
  const [showMarkLibrary, setShowMarkLibrary] = useState(false);

  const validateCourse = (courseToValidate: OfficialRaceCourse) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (courseToValidate.marks.length < 2) {
      errors.push('Course requires at least 2 marks (start and finish)');
    }

    const hasStart = courseToValidate.marks.some(mark => mark.type === 'start');
    const hasFinish = courseToValidate.marks.some(mark => mark.type === 'finish');

    if (!hasStart) errors.push('Course must have a start mark');
    if (!hasFinish) errors.push('Course must have a finish mark');

    // Mark spacing validation
    for (let i = 0; i < courseToValidate.marks.length; i++) {
      for (let j = i + 1; j < courseToValidate.marks.length; j++) {
        const mark1 = courseToValidate.marks[i];
        const mark2 = courseToValidate.marks[j];
        const distance = calculateDistance(mark1.coordinates, mark2.coordinates);

        if (distance < 100 && mark1.type !== mark2.type) { // 100 meters minimum
          warnings.push(`Marks "${mark1.name}" and "${mark2.name}" may be too close (${Math.round(distance)}m apart)`);
        }
      }
    }

    // Course type specific validation
    if (courseToValidate.type === 'windward-leeward') {
      const hasWindward = courseToValidate.marks.some(mark => mark.type === 'windward');
      const hasLeeward = courseToValidate.marks.some(mark => mark.type === 'leeward');

      if (!hasWindward) warnings.push('Windward-Leeward course should have windward mark(s)');
      if (!hasLeeward) warnings.push('Windward-Leeward course should have leeward mark(s)');
    }

    const isValid = errors.length === 0;
    const safetyChecks = warnings.length === 0;
    const ruleCompliance = isValid && courseToValidate.sequence.length > 0;

    return {
      isValid,
      errors,
      warnings,
      safetyChecks,
      ruleCompliance
    };
  };

  const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
    // Simplified distance calculation in meters
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;

    const dlat = (lat2 - lat1) * Math.PI / 180;
    const dlng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dlat/2) * Math.sin(dlat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dlng/2) * Math.sin(dlng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return 6371000 * c; // Earth's radius in meters
  };

  const addMark = (type: OfficialMark['type']) => {
    if (!course) return;

    const newMark: OfficialMark = {
      id: `mark-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Mark ${course.marks.length + 1}`,
      type,
      coordinates: [114.1900 + Math.random() * 0.01, 22.2850 + Math.random() * 0.01], // Random position in Victoria Harbor
      rounding: type === 'windward' || type === 'leeward' || type === 'reaching' ? 'port' : undefined,
      equipment: {
        type: type === 'start' || type === 'finish' ? 'committee_boat' : 'inflatable',
        size: 'medium',
        color: type === 'windward' ? 'orange' : type === 'leeward' ? 'yellow' : 'red',
        light: false,
        anchor: 'temporary'
      },
      safetyZone: 50
    };

    const updatedCourse = {
      ...course,
      marks: [...course.marks, newMark],
      validationStatus: validateCourse({
        ...course,
        marks: [...course.marks, newMark]
      })
    };

    onCourseUpdate(updatedCourse);
  };

  const removeMark = (markId: string) => {
    if (!course) return;

    const updatedCourse = {
      ...course,
      marks: course.marks.filter(mark => mark.id !== markId),
      validationStatus: validateCourse({
        ...course,
        marks: course.marks.filter(mark => mark.id !== markId)
      })
    };

    onCourseUpdate(updatedCourse);
  };

  const generateCourseSequence = () => {
    if (!course || course.marks.length === 0) return;

    const startMark = course.marks.find(mark => mark.type === 'start');
    const finishMark = course.marks.find(mark => mark.type === 'finish');
    const windwardMarks = course.marks.filter(mark => mark.type === 'windward');
    const leewardMarks = course.marks.filter(mark => mark.type === 'leeward');

    let sequence: string[] = [];

    if (startMark) sequence.push(startMark.id);

    if (course.type === 'windward-leeward') {
      // Simple W-L sequence
      if (windwardMarks.length > 0) sequence.push(windwardMarks[0].id);
      if (leewardMarks.length > 0) sequence.push(leewardMarks[0].id);
      if (windwardMarks.length > 0) sequence.push(windwardMarks[0].id); // Second beat
    } else {
      // Add other marks in order
      course.marks
        .filter(mark => mark.type !== 'start' && mark.type !== 'finish')
        .forEach(mark => sequence.push(mark.id));
    }

    if (finishMark) sequence.push(finishMark.id);

    const updatedCourse = {
      ...course,
      sequence,
      validationStatus: validateCourse({
        ...course,
        sequence
      })
    };

    onCourseUpdate(updatedCourse);
  };

  const getMarkTypeColor = (type: OfficialMark['type']) => {
    switch (type) {
      case 'start': return '#22C55E';
      case 'finish': return '#8B5CF6';
      case 'windward': return '#EF4444';
      case 'leeward': return '#3B82F6';
      case 'reaching': return '#F59E0B';
      case 'gate': return '#EC4899';
      case 'turning': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const getMarkTypeIcon = (type: OfficialMark['type']) => {
    switch (type) {
      case 'start': return '🚦';
      case 'finish': return '🏁';
      case 'windward': return '⬆️';
      case 'leeward': return '⬇️';
      case 'reaching': return '↗️';
      case 'gate': return '🚪';
      case 'turning': return '🔄';
      default: return '🔶';
    }
  };

  const CourseStatus = () => {
    if (!course) return null;

    const { validationStatus } = course;

    return (
      <View style={styles.courseStatus}>
        <View style={styles.statusHeader}>
          <ThemedText style={styles.statusTitle}>📊 Course Status</ThemedText>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: validationStatus.isValid ? '#22C55E' : '#EF4444' }
          ]}>
            <ThemedText style={styles.statusIndicatorText}>
              {validationStatus.isValid ? 'VALID' : 'INVALID'}
            </ThemedText>
          </View>
        </View>

        {validationStatus.errors.length > 0 && (
          <View style={styles.statusSection}>
            <ThemedText style={styles.errorTitle}>❌ Errors:</ThemedText>
            {validationStatus.errors.map((error, index) => (
              <ThemedText key={index} style={styles.errorText}>• {error}</ThemedText>
            ))}
          </View>
        )}

        {validationStatus.warnings.length > 0 && (
          <View style={styles.statusSection}>
            <ThemedText style={styles.warningTitle}>⚠️ Warnings:</ThemedText>
            {validationStatus.warnings.map((warning, index) => (
              <ThemedText key={index} style={styles.warningText}>• {warning}</ThemedText>
            ))}
          </View>
        )}

        <View style={styles.statusChecks}>
          <View style={styles.checkItem}>
            <ThemedText style={styles.checkLabel}>
              {validationStatus.safetyChecks ? '✅' : '❌'} Safety Checks
            </ThemedText>
          </View>
          <View style={styles.checkItem}>
            <ThemedText style={styles.checkLabel}>
              {validationStatus.ruleCompliance ? '✅' : '❌'} Rule Compliance
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Course Selection */}
      <View style={styles.courseSelection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseList}>
          {savedCourses.map((savedCourse) => (
            <Button
              key={savedCourse.id}
              variant={course?.id === savedCourse.id ? "default" : "outline"}
              onPress={() => onCourseSelect(savedCourse)}
              style={styles.courseButton}
            >
              <ThemedText style={{
                color: course?.id === savedCourse.id ? '#fff' : '#0066CC'
              }}>
                {savedCourse.name}
              </ThemedText>
            </Button>
          ))}
        </ScrollView>
      </View>

      {course ? (
        <ScrollView style={styles.content}>
          {/* Course Info */}
          <View style={styles.courseInfo}>
            <View style={styles.courseHeader}>
              <ThemedText style={styles.courseName}>{course.name}</ThemedText>
              <View style={[styles.statusBadge, {
                backgroundColor: course.status === 'published' ? '#22C55E' :
                               course.status === 'active' ? '#F59E0B' :
                               course.status === 'completed' ? '#6B7280' : '#3B82F6'
              }]}>
                <ThemedText style={styles.statusBadgeText}>
                  {course.status.toUpperCase()}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.courseDetails}>
              📍 {course.venue} • 🏛️ {course.club} • 🎯 {course.type}
            </ThemedText>
          </View>

          {/* Course Visualization Area */}
          <View style={styles.courseCanvas}>
            <ThemedText style={styles.canvasTitle}>🗺️ Course Layout</ThemedText>
            <View style={styles.canvasArea}>
              <ThemedText style={styles.canvasPlaceholder}>
                Professional 3D Course Visualization
                (MapLibre GL integration coming soon)
              </ThemedText>
              <ThemedText style={styles.canvasInfo}>
                {course.marks.length} marks • {course.sequence.length} sequence points
              </ThemedText>
            </View>
          </View>

          {/* Mark Management */}
          <View style={styles.markManagement}>
            <ThemedText style={styles.sectionTitle}>📍 Race Marks</ThemedText>

            {/* Mark Creation Tools */}
            <View style={styles.markTools}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['start', 'windward', 'leeward', 'reaching', 'gate', 'turning', 'finish'].map((markType) => (
                  <Button
                    key={markType}
                    variant="outline"
                    onPress={() => addMark(markType as OfficialMark['type'])}
                    style={[styles.markTypeButton, {
                      borderColor: getMarkTypeColor(markType as OfficialMark['type'])
                    }]}
                  >
                    <ThemedText style={{ color: getMarkTypeColor(markType as OfficialMark['type']) }}>
                      {getMarkTypeIcon(markType as OfficialMark['type'])} {markType}
                    </ThemedText>
                  </Button>
                ))}
              </ScrollView>
            </View>

            {/* Marks List */}
            <View style={styles.marksList}>
              {course.marks.map((mark) => (
                <View key={mark.id} style={styles.markItem}>
                  <View style={styles.markInfo}>
                    <ThemedText style={styles.markName}>
                      {getMarkTypeIcon(mark.type)} {mark.name}
                    </ThemedText>
                    <ThemedText style={styles.markDetails}>
                      {mark.coordinates[1].toFixed(4)}, {mark.coordinates[0].toFixed(4)} •
                      {mark.equipment.type} • {mark.equipment.color || 'default'}
                      {mark.rounding && ` • round ${mark.rounding}`}
                    </ThemedText>
                  </View>
                  <Button
                    variant="outline"
                    onPress={() => removeMark(mark.id)}
                    style={styles.removeButton}
                  >
                    <ThemedText style={{ color: '#EF4444' }}>🗑️</ThemedText>
                  </Button>
                </View>
              ))}
            </View>
          </View>

          {/* Course Sequence */}
          <View style={styles.sequenceSection}>
            <View style={styles.sequenceHeader}>
              <ThemedText style={styles.sectionTitle}>🏁 Racing Sequence</ThemedText>
              <Button
                variant="outline"
                onPress={generateCourseSequence}
                style={styles.generateButton}
              >
                <ThemedText style={{ color: '#0066CC' }}>⚡ Auto Generate</ThemedText>
              </Button>
            </View>

            {course.sequence.length > 0 ? (
              <View style={styles.sequenceDisplay}>
                {course.sequence.map((markId, index) => {
                  const mark = course.marks.find(m => m.id === markId);
                  return mark ? (
                    <View key={index} style={styles.sequenceItem}>
                      <ThemedText style={styles.sequenceNumber}>{index + 1}</ThemedText>
                      <ThemedText style={styles.sequenceMarkName}>
                        {getMarkTypeIcon(mark.type)} {mark.name}
                      </ThemedText>
                    </View>
                  ) : null;
                })}
              </View>
            ) : (
              <ThemedText style={styles.noSequence}>No racing sequence defined</ThemedText>
            )}
          </View>

          {/* Course Status */}
          <CourseStatus />
        </ScrollView>
      ) : (
        <View style={styles.noCourse}>
          <ThemedText type="title" style={styles.noCourseTitle}>🎨 Professional Course Designer</ThemedText>
          <ThemedText style={styles.noCourseSubtitle}>
            Create a new race course or select an existing one to begin designing
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
  courseSelection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  courseList: {
    paddingHorizontal: 16,
  },
  courseButton: {
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  courseInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  courseDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  courseCanvas: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  canvasTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#374151',
  },
  canvasArea: {
    height: 300,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  canvasPlaceholder: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
  },
  canvasInfo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  markManagement: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#374151',
  },
  markTools: {
    marginBottom: 16,
  },
  markTypeButton: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  marksList: {
    gap: 8,
  },
  markItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  markInfo: {
    flex: 1,
  },
  markName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  markDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    padding: 8,
    borderColor: '#EF4444',
  },
  sequenceSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sequenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  generateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sequenceDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sequenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  sequenceNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0066CC',
    backgroundColor: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  sequenceMarkName: {
    fontSize: 12,
    color: '#374151',
  },
  noSequence: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  courseStatus: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusSection: {
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    lineHeight: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    lineHeight: 16,
  },
  statusChecks: {
    flexDirection: 'row',
    gap: 16,
  },
  checkItem: {
    flex: 1,
  },
  checkLabel: {
    fontSize: 12,
    color: '#374151',
  },
  noCourse: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noCourseTitle: {
    color: '#6B7280',
    marginBottom: 8,
  },
  noCourseSubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
});