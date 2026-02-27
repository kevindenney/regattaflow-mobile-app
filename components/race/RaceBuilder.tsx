import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui';
import { CourseDesigner } from './CourseDesigner';
import { CourseTemplateLibrary } from './CourseTemplateLibrary';
import { WeatherIntegration } from './WeatherIntegration';
import { CourseValidation } from './CourseValidation';
import { CourseMap } from './shared/CourseMap';
import { createLogger } from '@/lib/utils/logger';
import { supabase } from '@/services/supabase';

export interface RaceCourse {
  id: string;
  name: string;
  type: 'windward-leeward' | 'triangle' | 'coastal' | 'distance';
  marks: Mark[];
  sequence: string[];
  weather?: WeatherData;
  venue?: string;
  validationErrors?: string[];
}

export interface Mark {
  id: string;
  name: string;
  type: 'start' | 'windward' | 'leeward' | 'reaching' | 'finish' | 'gate';
  coordinates: [number, number]; // [longitude, latitude]
  rounding?: 'port' | 'starboard' | 'either';
}

export interface WeatherData {
  windDirection: number;
  windSpeed: number;
  current?: {
    direction: number;
    speed: number;
  };
  forecast?: any;
}

const logger = createLogger('RaceBuilder');

export function RaceBuilder() {
  const [currentCourse, setCurrentCourse] = useState<RaceCourse | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'map' | 'templates' | 'weather' | 'validate'>('design');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleCourseSelect = (course: RaceCourse) => {
    setCurrentCourse(course);
    setActiveTab('design');
  };

  const handleCourseUpdate = (updatedCourse: RaceCourse) => {
    setCurrentCourse(updatedCourse);
  };

  const handleMarkMove = (markId: string, coordinates: [number, number]) => {
    if (!currentCourse) return;

    const updatedMarks = currentCourse.marks.map(mark =>
      mark.id === markId ? { ...mark, coordinates } : mark
    );

    handleCourseUpdate({ ...currentCourse, marks: updatedMarks });
  };

  const handlePublishCourse = async () => {
    if (!currentCourse) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        Alert.alert('Sign in required', 'Please sign in to publish a race course.');
        return;
      }

      const mappedMarks = (currentCourse.marks || []).map((mark) => ({
        name: mark.name,
        type: mark.type === 'reaching' ? 'wing' : mark.type,
        latitude: mark.coordinates[1],
        longitude: mark.coordinates[0],
      }));

      const payload = {
        name: currentCourse.name,
        description: `Published from Race Builder (${currentCourse.type})`,
        course_type:
          currentCourse.type === 'windward-leeward'
            ? 'windward_leeward'
            : currentCourse.type === 'triangle'
            ? 'triangle'
            : 'custom',
        marks: mappedMarks,
        layout: {
          sequence: currentCourse.sequence || [],
        },
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('race_courses')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      logger.debug('Published course to race_courses', {
        raceCourseId: data?.id,
        sourceCourseId: currentCourse.id,
      });
      Alert.alert('Course Published', 'Your course was saved to the shared course library.');
    } catch (error) {
      logger.error('Failed to publish course', error);
      Alert.alert(
        'Publish failed',
        error instanceof Error ? error.message : 'Unable to publish course right now.'
      );
    }
  };

  const TabButton = ({
    id,
    label,
    active
  }: {
    id: typeof activeTab;
    label: string;
    active: boolean
  }) => (
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
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">🏁 Race Builder</ThemedText>
        <ThemedText type="subtitle">OnX Maps for Sailing - Visual Course Design</ThemedText>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        <TabButton id="design" label="🎨 Course Design" active={activeTab === 'design'} />
        <TabButton id="map" label="🗺️ Map" active={activeTab === 'map'} />
        <TabButton id="templates" label="📋 Templates" active={activeTab === 'templates'} />
        <TabButton id="weather" label="🌊 Weather" active={activeTab === 'weather'} />
        <TabButton id="validate" label="✅ Validate" active={activeTab === 'validate'} />
      </ScrollView>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {activeTab === 'design' && (
          <CourseDesigner
            course={currentCourse}
            onCourseUpdate={handleCourseUpdate}
            isPreviewMode={isPreviewMode}
          />
        )}

        {activeTab === 'templates' && (
          <CourseTemplateLibrary
            onCourseSelect={handleCourseSelect}
          />
        )}

        {activeTab === 'map' && (
          currentCourse ? (
            <View style={styles.mapContainer}>
              <CourseMap
                course={currentCourse}
                onMarkMove={handleMarkMove}
                isEditable={!isPreviewMode}
              />
            </View>
          ) : (
            <View style={styles.mapEmptyState}>
              <ThemedText type="subtitle" style={styles.mapEmptyText}>
                Add a course from Design or Templates to unlock the interactive map.
              </ThemedText>
            </View>
          )
        )}

        {activeTab === 'weather' && (
          <WeatherIntegration
            course={currentCourse}
            onWeatherUpdate={(weather) => {
              if (currentCourse) {
                handleCourseUpdate({ ...currentCourse, weather });
              }
            }}
          />
        )}

        {activeTab === 'validate' && (
          <CourseValidation
            course={currentCourse}
            onValidationComplete={(errors) => {
              if (currentCourse) {
                handleCourseUpdate({ ...currentCourse, validationErrors: errors });
              }
            }}
          />
        )}
      </View>

      {/* Bottom Actions */}
      {currentCourse && (
        <View style={styles.actionBar}>
          <Button
            variant="outline"
            onPress={() => setIsPreviewMode(!isPreviewMode)}
            style={styles.actionButton}
          >
            <ThemedText style={{ color: '#0066CC' }}>
              {isPreviewMode ? '✏️ Edit Mode' : '👁️ Preview'}
            </ThemedText>
          </Button>

          <Button
            onPress={handlePublishCourse}
            style={styles.actionButton}
            disabled={!currentCourse || (currentCourse.validationErrors?.length || 0) > 0}
          >
            <ThemedText style={{ color: '#fff' }}>
              🚀 Publish Course
            </ThemedText>
          </Button>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
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
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mapEmptyText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
  },
});
