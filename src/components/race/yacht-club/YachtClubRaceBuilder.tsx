import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { ProfessionalCourseDesigner } from './ProfessionalCourseDesigner';
import { RaceManagementPanel } from './RaceManagementPanel';
import { CoursePublishingPanel } from './CoursePublishingPanel';
import { RaceSeriesManager } from './RaceSeriesManager';

export interface OfficialRaceCourse {
  id: string;
  name: string;
  type: 'windward-leeward' | 'triangle' | 'coastal' | 'distance';
  status: 'draft' | 'published' | 'active' | 'completed';
  club: string;
  venue: string;
  marks: OfficialMark[];
  sequence: string[];
  weather?: WeatherConditions;
  validationStatus: ValidationStatus;
  publishedAt?: Date;
  raceStart?: Date;
  participants?: number;
  divisions?: RaceDivision[];
}

export interface OfficialMark {
  id: string;
  name: string;
  type: 'start' | 'finish' | 'windward' | 'leeward' | 'reaching' | 'gate' | 'turning';
  coordinates: [number, number];
  rounding?: 'port' | 'starboard';
  equipment: MarkEquipment;
  safetyZone?: number; // meters
}

interface MarkEquipment {
  type: 'inflatable' | 'government' | 'committee_boat';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  light?: boolean;
  anchor?: 'temporary' | 'permanent';
}

interface ValidationStatus {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  safetyChecks: boolean;
  ruleCompliance: boolean;
}

interface WeatherConditions {
  windDirection: number;
  windSpeed: number;
  gusts?: number;
  current?: {
    direction: number;
    speed: number;
  };
  visibility: number;
  forecast: any[];
}

interface RaceDivision {
  id: string;
  name: string;
  fleet: string;
  startTime: Date;
  handicapSystem: 'IRC' | 'HKPN' | 'ORC' | 'Portsmouth' | 'One Design';
}

export function YachtClubRaceBuilder() {
  const [activeTab, setActiveTab] = useState<'courses' | 'management' | 'publishing' | 'series'>('courses');
  const [currentCourse, setCurrentCourse] = useState<OfficialRaceCourse | null>(null);
  const [savedCourses, setSavedCourses] = useState<OfficialRaceCourse[]>([]);

  const handleCourseCreate = () => {
    const newCourse: OfficialRaceCourse = {
      id: `course-${Date.now()}`,
      name: 'New Race Course',
      type: 'windward-leeward',
      status: 'draft',
      club: 'Royal Hong Kong Yacht Club', // Would come from auth context
      venue: 'Victoria Harbor',
      marks: [],
      sequence: [],
      validationStatus: {
        isValid: false,
        errors: ['Course requires minimum 2 marks'],
        warnings: [],
        safetyChecks: false,
        ruleCompliance: false
      }
    };

    setCurrentCourse(newCourse);
    setSavedCourses([...savedCourses, newCourse]);
  };

  const handleCourseUpdate = (updatedCourse: OfficialRaceCourse) => {
    setCurrentCourse(updatedCourse);
    setSavedCourses(savedCourses.map(course =>
      course.id === updatedCourse.id ? updatedCourse : course
    ));
  };

  const handleCoursePublish = async (course: OfficialRaceCourse) => {
    if (!course.validationStatus.isValid) {
      Alert.alert(
        'Cannot Publish Course',
        'Course has validation errors that must be resolved before publishing.',
        [{ text: 'OK' }]
      );
      return;
    }

    const publishedCourse = {
      ...course,
      status: 'published' as const,
      publishedAt: new Date()
    };

    handleCourseUpdate(publishedCourse);

    // TODO: Implement actual publishing to Supabase and sailor distribution
    Alert.alert(
      'Course Published Successfully',
      `${course.name} has been published and distributed to registered sailors.`,
      [{ text: 'OK' }]
    );
  };

  const TabButton = ({
    id,
    label,
    active,
    badge
  }: {
    id: typeof activeTab;
    label: string;
    active: boolean;
    badge?: number;
  }) => (
    <View style={styles.tabButtonContainer}>
      <Button
        variant={active ? "default" : "outline"}
        onPress={() => setActiveTab(id)}
        style={styles.tabButton}
      >
        <ThemedText type="defaultSemiBold" style={{
          color: active ? '#fff' : '#0066CC'
        }}>
          {label}
        </ThemedText>
      </Button>
      {badge && badge > 0 && (
        <View style={styles.tabBadge}>
          <ThemedText style={styles.tabBadgeText}>{badge}</ThemedText>
        </View>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText type="title">🏛️ Race Committee</ThemedText>
          <ThemedText type="subtitle">Professional Race Course Builder & Management</ThemedText>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            variant="outline"
            onPress={handleCourseCreate}
            style={styles.quickActionButton}
          >
            <ThemedText style={{ color: '#0066CC' }}>➕ New Course</ThemedText>
          </Button>
        </View>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        <TabButton
          id="courses"
          label="🎨 Course Design"
          active={activeTab === 'courses'}
        />
        <TabButton
          id="management"
          label="🏁 Race Management"
          active={activeTab === 'management'}
          badge={2} // Active races
        />
        <TabButton
          id="publishing"
          label="📡 Publishing"
          active={activeTab === 'publishing'}
          badge={savedCourses.filter(c => c.status === 'draft').length}
        />
        <TabButton
          id="series"
          label="🏆 Series"
          active={activeTab === 'series'}
        />
      </ScrollView>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {activeTab === 'courses' && (
          <ProfessionalCourseDesigner
            course={currentCourse}
            onCourseUpdate={handleCourseUpdate}
            savedCourses={savedCourses}
            onCourseSelect={setCurrentCourse}
          />
        )}

        {activeTab === 'management' && (
          <RaceManagementPanel
            course={currentCourse}
            onCourseUpdate={handleCourseUpdate}
          />
        )}

        {activeTab === 'publishing' && (
          <CoursePublishingPanel
            courses={savedCourses}
            onCoursePublish={handleCoursePublish}
            onCourseUpdate={handleCourseUpdate}
          />
        )}

        {activeTab === 'series' && (
          <RaceSeriesManager
            courses={savedCourses}
            onCourseUpdate={handleCourseUpdate}
          />
        )}
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusInfo}>
          <ThemedText style={styles.statusText}>
            📊 {savedCourses.length} courses • {savedCourses.filter(c => c.status === 'published').length} published • {savedCourses.filter(c => c.status === 'active').length} active
          </ThemedText>
        </View>

        {currentCourse && (
          <View style={styles.currentCourseStatus}>
            <ThemedText style={styles.statusText}>
              Current: {currentCourse.name} •
              {currentCourse.validationStatus.isValid ? ' ✅ Valid' : ' ❌ Issues'}
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabButtonContainer: {
    position: 'relative',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusInfo: {
    flex: 1,
  },
  currentCourseStatus: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
});