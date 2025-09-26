import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { CourseDesigner } from './CourseDesigner';
import { CourseTemplateLibrary } from './CourseTemplateLibrary';
import { WeatherIntegration } from './WeatherIntegration';
import { CourseValidation } from './CourseValidation';

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

const { width, height } = Dimensions.get('window');

export function RaceBuilder() {
  const [currentCourse, setCurrentCourse] = useState<RaceCourse | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'templates' | 'weather' | 'validate'>('design');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleCourseSelect = (course: RaceCourse) => {
    setCurrentCourse(course);
    setActiveTab('design');
  };

  const handleCourseUpdate = (updatedCourse: RaceCourse) => {
    setCurrentCourse(updatedCourse);
  };

  const handlePublishCourse = async () => {
    if (!currentCourse) return;

    // TODO: Implement course publishing to Supabase
    console.log('Publishing course:', currentCourse);
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