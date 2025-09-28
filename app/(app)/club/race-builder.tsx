/**
 * Visual Race Builder Screen
 * Marine-grade race course designer for yacht clubs and race officers
 * OnX Maps + WatchDuty inspired interface for professional course creation
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useClub } from '@/lib/contexts/ClubContext';
import Map3D, { Map3DRef } from '@/components/mapping/Map3D';

interface RaceMark {
  id: string;
  name: string;
  type: 'start' | 'windward' | 'leeward' | 'gate' | 'finish';
  lat: number;
  lng: number;
  description?: string;
}

interface RaceCourse {
  type: 'windward_leeward' | 'triangle' | 'olympic' | 'custom';
  marks: RaceMark[];
  instructions: string;
  safety_notes: string[];
  distance?: number;
}

export default function RaceBuilderScreen() {
  const [selectedMarkType, setSelectedMarkType] = useState<RaceMark['type']>('start');
  const [courseType, setCourseType] = useState<RaceCourse['type']>('windward_leeward');
  const [raceCourse, setRaceCourse] = useState<RaceCourse>({
    id: `course_${Date.now()}`,
    name: 'New Race Course',
    type: 'windward_leeward',
    marks: [],
    instructions: '',
    safety_notes: [],
  });
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState<'racing' | 'navigation' | 'tactical' | 'satellite'>('tactical');

  const { selectedClub, hasAdminAccess } = useClub();
  const map3DRef = useRef<Map3DRef>(null);

  // Predefined course templates for quick setup
  const courseTemplates = {
    windward_leeward: {
      name: 'Windward-Leeward',
      icon: 'arrow-up' as const,
      marks: [
        { id: 'start', name: 'Start Line', type: 'start' as const, lat: 0, lng: 0 },
        { id: 'windward', name: 'Windward Mark', type: 'windward' as const, lat: 0.001, lng: 0 },
        { id: 'leeward', name: 'Leeward Mark', type: 'leeward' as const, lat: -0.001, lng: 0 },
        { id: 'finish', name: 'Finish Line', type: 'finish' as const, lat: 0, lng: 0 },
      ],
    },
    triangle: {
      name: 'Triangle Course',
      icon: 'triangle' as const,
      marks: [
        { id: 'start', name: 'Start Line', type: 'start' as const, lat: 0, lng: 0 },
        { id: 'windward', name: 'Windward Mark', type: 'windward' as const, lat: 0.001, lng: 0 },
        { id: 'reaching1', name: 'Reaching Mark 1', type: 'gate' as const, lat: 0.0005, lng: 0.001 },
        { id: 'reaching2', name: 'Reaching Mark 2', type: 'gate' as const, lat: -0.0005, lng: 0.001 },
        { id: 'finish', name: 'Finish Line', type: 'finish' as const, lat: 0, lng: 0 },
      ],
    },
    olympic: {
      name: 'Olympic Course',
      icon: 'medal' as const,
      marks: [
        { id: 'start', name: 'Start Line', type: 'start' as const, lat: 0, lng: 0 },
        { id: 'windward', name: 'Windward Mark', type: 'windward' as const, lat: 0.002, lng: 0 },
        { id: 'reaching1', name: 'Reaching Mark 1', type: 'gate' as const, lat: 0.001, lng: 0.0015 },
        { id: 'leeward_gate_l', name: 'Leeward Gate L', type: 'gate' as const, lat: -0.001, lng: -0.0005 },
        { id: 'leeward_gate_r', name: 'Leeward Gate R', type: 'gate' as const, lat: -0.001, lng: 0.0005 },
        { id: 'reaching2', name: 'Reaching Mark 2', type: 'gate' as const, lat: 0.001, lng: -0.0015 },
        { id: 'finish', name: 'Finish Line', type: 'finish' as const, lat: 0, lng: 0 },
      ],
    },
  };

  const markTypes = [
    { type: 'start' as const, name: 'Start Line', icon: 'play', color: '#22c55e' },
    { type: 'windward' as const, name: 'Windward', icon: 'arrow-up', color: '#0ea5e9' },
    { type: 'leeward' as const, name: 'Leeward', icon: 'arrow-down', color: '#f59e0b' },
    { type: 'gate' as const, name: 'Gate/Mark', icon: 'flag', color: '#8b5cf6' },
    { type: 'finish' as const, name: 'Finish Line', icon: 'checkmark', color: '#ef4444' },
  ];

  useEffect(() => {
    if (!hasAdminAccess) {
      Alert.alert(
        'Access Required',
        'You need admin access to use the race builder.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [hasAdminAccess]);

  const loadTemplate = async (template: keyof typeof courseTemplates) => {
    const courseTemplate = courseTemplates[template];
    setCourseType(template);

    const newCourse: RaceCourse = {
      id: `course_${Date.now()}`,
      name: `${courseTemplate.name} Course`,
      type: template,
      marks: courseTemplate.marks.map(mark => ({
        ...mark,
        lat: (selectedClub?.location.lat || 37.7749) + mark.lat,
        lng: (selectedClub?.location.lng || -122.4194) + mark.lng,
      })),
      instructions: `${courseTemplate.name} race course with standard sailing instructions.`,
      safety_notes: [
        'All boats must wear life jackets',
        'Monitor VHF channel 72 for race committee communications',
        'Report any incidents to race committee immediately',
      ],
    };

    setRaceCourse(newCourse);

    // Display on 3D map
    if (map3DRef.current) {
      await map3DRef.current.displayRaceCourse(newCourse);
    }
  };

  const addMark = async () => {
    const centerLat = selectedClub?.location.lat || 37.7749;
    const centerLng = selectedClub?.location.lng || -122.4194;

    const newMark: RaceMark = {
      id: `mark_${Date.now()}`,
      name: `${selectedMarkType.charAt(0).toUpperCase() + selectedMarkType.slice(1)} Mark`,
      type: selectedMarkType,
      lat: centerLat + (Math.random() - 0.5) * 0.002, // Random position within ~200m
      lng: centerLng + (Math.random() - 0.5) * 0.002,
    };

    const updatedCourse = {
      ...raceCourse,
      marks: [...raceCourse.marks, newMark],
    };

    setRaceCourse(updatedCourse);

    // Add to 3D map
    if (map3DRef.current) {
      await map3DRef.current.addMark(newMark);
    }
  };

  const removeMark = async (markId: string) => {
    const updatedCourse = {
      ...raceCourse,
      marks: raceCourse.marks.filter(mark => mark.id !== markId),
    };

    setRaceCourse(updatedCourse);

    // Remove from 3D map
    if (map3DRef.current) {
      await map3DRef.current.removeMark(markId);
    }
  };

  const updateMarkPosition = async (markId: string, lat: number, lng: number) => {
    const updatedCourse = {
      ...raceCourse,
      marks: raceCourse.marks.map(mark =>
        mark.id === markId ? { ...mark, lat, lng } : mark
      ),
    };

    setRaceCourse(updatedCourse);

    // Update on 3D map
    if (map3DRef.current) {
      await map3DRef.current.updateMark(markId, { lat, lng });
    }
  };

  const handleMapClick = async (coordinates: [number, number]) => {
    if (selectedMarkType) {
      const newMark: RaceMark = {
        id: `mark_${Date.now()}`,
        name: `${selectedMarkType.charAt(0).toUpperCase() + selectedMarkType.slice(1)} Mark`,
        type: selectedMarkType,
        lat: coordinates[0],
        lng: coordinates[1],
      };

      const updatedCourse = {
        ...raceCourse,
        marks: [...raceCourse.marks, newMark],
      };

      setRaceCourse(updatedCourse);

      // Add to 3D map
      if (map3DRef.current) {
        await map3DRef.current.addMark(newMark);
      }
    }
  };

  const switchMapStyle = async (styleType: typeof currentMapStyle) => {
    setCurrentMapStyle(styleType);
    if (map3DRef.current) {
      await map3DRef.current.switchStyle(styleType);
    }
  };

  const saveCourse = () => {
    if (raceCourse.marks.length < 2) {
      Alert.alert('Invalid Course', 'A race course must have at least 2 marks.');
      return;
    }

    // Here you would save the course to the backend
    Alert.alert(
      'Course Saved',
      'Race course has been saved successfully. You can now use it when creating race events.',
      [
        { text: 'Create Race Event', onPress: () => router.push('/(app)/club/race/create') },
        { text: 'OK' },
      ]
    );
  };

  const exportCourse = () => {
    // Export course as JSON or share with other clubs
    Alert.alert(
      'Export Course',
      'Choose export format:',
      [
        { text: 'JSON File', onPress: () => console.log('Export JSON') },
        { text: 'Share with Clubs', onPress: () => console.log('Share course') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (!hasAdminAccess) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Ionicons name="boat" size={32} color="#0ea5e9" />
          <View>
            <ThemedText style={styles.title}>Race Builder</ThemedText>
            <ThemedText style={styles.subtitle}>
              Visual course designer
            </ThemedText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowInstructions(!showInstructions)}
        >
          <Ionicons name="help-circle" size={24} color="#f8fafc" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Course Templates */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.templatesScrollView}
          contentContainerStyle={styles.templatesContainer}
        >
          {Object.entries(courseTemplates).map(([key, template]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.templateCard,
                courseType === key && styles.selectedTemplateCard,
              ]}
              onPress={() => loadTemplate(key as keyof typeof courseTemplates)}
            >
              <Ionicons
                name={template.icon}
                size={24}
                color={courseType === key ? '#0ea5e9' : '#94a3b8'}
              />
              <Text style={[
                styles.templateName,
                courseType === key && styles.selectedTemplateName,
              ]}>
                {template.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* 3D Map View */}
          <View style={styles.mapContainer}>
            <Map3D
              ref={map3DRef}
              center={[
                selectedClub?.location.lat || 37.7749,
                selectedClub?.location.lng || -122.4194,
              ]}
              zoom={15}
              pitch={45}
              bearing={0}
              raceCourse={raceCourse}
              onMapClick={handleMapClick}
              onMapLoad={() => console.log('🗺️ Map loaded successfully')}
              interactive={true}
            />

            {/* Map Style Controls */}
            <View style={styles.mapControls}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mapStyleButtons}
              >
                {['tactical', 'racing', 'navigation', 'satellite'].map((style) => (
                  <TouchableOpacity
                    key={style}
                    style={[
                      styles.mapStyleButton,
                      currentMapStyle === style && styles.activeMapStyleButton,
                    ]}
                    onPress={() => switchMapStyle(style as typeof currentMapStyle)}
                  >
                    <Ionicons
                      name={
                        style === 'tactical' ? 'analytics' :
                        style === 'racing' ? 'boat' :
                        style === 'navigation' ? 'compass' :
                        'satellite'
                      }
                      size={16}
                      color={currentMapStyle === style ? '#0ea5e9' : '#f8fafc'}
                    />
                    <Text style={[
                      styles.mapStyleButtonText,
                      currentMapStyle === style && styles.activeMapStyleButtonText,
                    ]}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.mapActionButtons}>
                <TouchableOpacity
                  style={styles.mapControlButton}
                  onPress={() => map3DRef.current?.fitToCourse()}
                >
                  <Ionicons name="scan" size={20} color="#f8fafc" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mapControlButton}
                  onPress={() => {
                    Alert.alert(
                      'Map Instructions',
                      'Tap on the map to place marks of the selected type. Use the style buttons to switch between tactical, racing, navigation, and satellite views.',
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <Ionicons name="help-circle" size={20} color="#f8fafc" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Tools Panel */}
          <View style={styles.toolsPanel}>
            {/* Mark Types */}
            <View style={styles.toolSection}>
              <ThemedText style={styles.toolSectionTitle}>Mark Types</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.markTypesContainer}
              >
                {markTypes.map((markType) => (
                  <TouchableOpacity
                    key={markType.type}
                    style={[
                      styles.markTypeButton,
                      selectedMarkType === markType.type && styles.selectedMarkTypeButton,
                    ]}
                    onPress={() => setSelectedMarkType(markType.type)}
                  >
                    <View style={[styles.markTypeIcon, { backgroundColor: markType.color }]}>
                      <Ionicons name={markType.icon} size={20} color="#fff" />
                    </View>
                    <Text style={[
                      styles.markTypeName,
                      selectedMarkType === markType.type && styles.selectedMarkTypeName,
                    ]}>
                      {markType.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Course Marks */}
            <View style={styles.toolSection}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.toolSectionTitle}>Course Marks</ThemedText>
                <TouchableOpacity
                  style={styles.addMarkButton}
                  onPress={addMark}
                >
                  <Ionicons name="add" size={20} color="#0ea5e9" />
                  <Text style={styles.addMarkText}>Add Mark</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.marksScrollView}>
                {raceCourse.marks.map((mark, index) => {
                  const markType = markTypes.find(m => m.type === mark.type);
                  return (
                    <View key={mark.id} style={styles.markItem}>
                      <View style={styles.markInfo}>
                        <View style={[styles.markIndicator, { backgroundColor: markType?.color }]}>
                          <Ionicons name={markType?.icon || 'location'} size={16} color="#fff" />
                        </View>
                        <View style={styles.markDetails}>
                          <Text style={styles.markName}>{mark.name}</Text>
                          <Text style={styles.markCoords}>
                            {mark.lat.toFixed(6)}, {mark.lng.toFixed(6)}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.removeMarkButton}
                        onPress={() => removeMark(mark.id)}
                      >
                        <Ionicons name="trash" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.exportButton]}
            onPress={exportCourse}
          >
            <Ionicons name="share" size={20} color="#94a3b8" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.saveButton]}
            onPress={saveCourse}
          >
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Course</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Instructions Modal */}
      {showInstructions && (
        <View style={styles.instructionsOverlay}>
          <View style={styles.instructionsModal}>
            <View style={styles.instructionsHeader}>
              <ThemedText style={styles.instructionsTitle}>Race Builder Guide</ThemedText>
              <TouchableOpacity onPress={() => setShowInstructions(false)}>
                <Ionicons name="close" size={24} color="#f8fafc" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.instructionsContent}>
              <Text style={styles.instructionText}>
                1. Choose a course template or start with a custom design{'\n\n'}
                2. Select mark types and tap on the map to place them{'\n\n'}
                3. Drag marks to adjust positions for optimal racing{'\n\n'}
                4. Add sailing instructions and safety notes{'\n\n'}
                5. Save the course to use in race events{'\n\n'}
                6. Export to share with other clubs or officials
              </Text>
            </ScrollView>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  actionButton: {
    padding: 8,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Templates
  templatesScrollView: {
    marginBottom: 20,
  },
  templatesContainer: {
    gap: 12,
  },
  templateCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#475569',
  },
  selectedTemplateCard: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderColor: '#0ea5e9',
  },
  templateName: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedTemplateName: {
    color: '#0ea5e9',
  },

  // Main Content
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },

  // Map
  mapContainer: {
    flex: 2,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mapStyleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mapStyleButton: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeMapStyleButton: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderColor: '#0ea5e9',
  },
  mapStyleButtonText: {
    fontSize: 12,
    color: '#f8fafc',
    fontWeight: '500',
  },
  activeMapStyleButtonText: {
    color: '#0ea5e9',
  },
  mapActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mapControlButton: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 8,
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },

  // Tools Panel
  toolsPanel: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  toolSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toolSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },

  // Mark Types
  markTypesContainer: {
    gap: 8,
  },
  markTypeButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 70,
  },
  selectedMarkTypeButton: {
    borderColor: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  markTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  markTypeName: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  selectedMarkTypeName: {
    color: '#0ea5e9',
  },

  // Course Marks
  addMarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addMarkText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  marksScrollView: {
    maxHeight: 200,
  },
  markItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  markInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  markIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markDetails: {
    flex: 1,
  },
  markName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e2e8f0',
  },
  markCoords: {
    fontSize: 12,
    color: '#94a3b8',
  },
  removeMarkButton: {
    padding: 4,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  exportButton: {
    backgroundColor: '#374151',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  saveButton: {
    backgroundColor: '#0ea5e9',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Instructions Modal
  instructionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionsModal: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  instructionsContent: {
    maxHeight: 300,
  },
  instructionText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
});