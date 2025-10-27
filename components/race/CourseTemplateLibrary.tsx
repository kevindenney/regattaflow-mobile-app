import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../../../components/themed-text';
import { Button } from '../ui/button';
import { RaceCourse, Mark } from './RaceBuilder';
import raceCourseData from '../../data/race-courses.json';

export interface CourseTemplateLibraryProps {
  onCourseSelect: (course: RaceCourse) => void;
}

interface CourseTemplate {
  id: string;
  name: string;
  type: 'windward-leeward' | 'triangle' | 'coastal' | 'distance';
  description: string;
  marks: Mark[];
  sequence: string[];
  thumbnail?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  suitableFor: string[];
}

export function CourseTemplateLibrary({ onCourseSelect }: CourseTemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Convert race course data to templates
  const templates: CourseTemplate[] = useMemo(() => {
    const result: CourseTemplate[] = [];

    // Standard course templates
    if (raceCourseData.standardCourses) {
      // Windward-Leeward templates
      Object.entries(raceCourseData.standardCourses['windward-leeward']?.variations || {}).forEach(([key, variation]) => {
        if (typeof variation === 'object' && 'name' in variation) {
          const template: CourseTemplate = {
            id: `wl-${key}`,
            name: variation.name,
            type: 'windward-leeward',
            description: variation.description || 'Classic windward-leeward racing course',
            difficulty: key === 'WL2' ? 'beginner' : key === 'WL3' ? 'intermediate' : 'advanced',
            suitableFor: ['dinghies', 'keelboats', 'yachts'],
            marks: [
              {
                id: 'start',
                name: 'Start Line',
                type: 'start',
                coordinates: [114.1860, 22.2850]
              },
              {
                id: 'windward',
                name: 'Windward Mark',
                type: 'windward',
                coordinates: [114.1900, 22.3000],
                rounding: 'port'
              },
              {
                id: 'leeward-port',
                name: 'Leeward Gate (Port)',
                type: 'leeward',
                coordinates: [114.1880, 22.2750],
                rounding: 'port'
              },
              {
                id: 'leeward-starboard',
                name: 'Leeward Gate (Starboard)',
                type: 'leeward',
                coordinates: [114.1920, 22.2750],
                rounding: 'port'
              },
              {
                id: 'finish',
                name: 'Finish Line',
                type: 'finish',
                coordinates: [114.1860, 22.2900]
              }
            ],
            sequence: ['start', 'windward', 'leeward-gate', 'finish']
          };

          // Adjust sequence based on legs
          if (variation.legs === 3 || variation.legs === 4) {
            template.sequence = ['start', 'windward', 'leeward-gate', 'windward', 'finish'];
          }

          result.push(template);
        }
      });

      // Triangle templates
      Object.entries(raceCourseData.standardCourses.triangle?.variations || {}).forEach(([key, variation]) => {
        if (typeof variation === 'object' && 'name' in variation) {
          const template: CourseTemplate = {
            id: `triangle-${key}`,
            name: variation.name,
            type: 'triangle',
            description: variation.description || 'Traditional triangle course',
            difficulty: 'intermediate',
            suitableFor: ['dinghies', 'keelboats'],
            marks: [
              {
                id: 'start',
                name: 'Start Line',
                type: 'start',
                coordinates: [114.1860, 22.2850]
              },
              {
                id: 'windward',
                name: 'Windward Mark',
                type: 'windward',
                coordinates: [114.1900, 22.3000],
                rounding: 'port'
              },
              {
                id: 'reaching-1',
                name: 'Reaching Mark 1',
                type: 'reaching',
                coordinates: [114.2050, 22.2900],
                rounding: 'port'
              },
              {
                id: 'reaching-2',
                name: 'Reaching Mark 2',
                type: 'reaching',
                coordinates: [114.1950, 22.2700],
                rounding: 'port'
              },
              {
                id: 'finish',
                name: 'Finish Line',
                type: 'finish',
                coordinates: [114.1860, 22.2900]
              }
            ],
            sequence: ['start', 'windward', 'reaching-1', 'reaching-2', 'finish']
          };

          result.push(template);
        }
      });
    }

    // Specific venue templates
    if (raceCourseData.specificCourses) {
      Object.entries(raceCourseData.specificCourses).forEach(([region, data]) => {
        if (typeof data === 'object' && 'courses' in data) {
          Object.entries(data.courses).forEach(([courseKey, courseData]) => {
            if (typeof courseData === 'object' && 'name' in courseData) {
              const template: CourseTemplate = {
                id: courseData.id || `${region}-${courseKey}`,
                name: courseData.name,
                type: (courseData.type as any) || 'windward-leeward',
                description: courseData.description || `${courseData.name} course`,
                difficulty: courseData.type === 'distance' ? 'advanced' : 'intermediate',
                suitableFor: courseData.classes || ['all boats'],
                marks: [],
                sequence: []
              };

              // Convert coordinates to marks if available
              if ('coordinates' in courseData && typeof courseData.coordinates === 'object' && courseData.coordinates.marks) {
                const marks = courseData.coordinates.marks;
                Object.entries(marks).forEach(([markName, coords]) => {
                  if (Array.isArray(coords) && coords.length === 2) {
                    template.marks.push({
                      id: markName,
                      name: markName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                      type: markName.includes('start') ? 'start' :
                            markName.includes('finish') ? 'finish' :
                            markName.includes('windward') ? 'windward' :
                            markName.includes('leeward') ? 'leeward' : 'reaching',
                      coordinates: [coords[0], coords[1]] as [number, number],
                      rounding: markName.includes('start') || markName.includes('finish') ? undefined : 'port'
                    });
                  }
                });
              }

              if (template.marks.length > 0) {
                result.push(template);
              }
            }
          });
        }
      });
    }

    return result;
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const categoryMatch = selectedCategory === 'all' || template.type === selectedCategory;
      const difficultyMatch = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
      return categoryMatch && difficultyMatch;
    });
  }, [templates, selectedCategory, selectedDifficulty]);

  const handleTemplateSelect = (template: CourseTemplate) => {
    const raceCourse: RaceCourse = {
      id: `course-${Date.now()}-${template.id}`,
      name: `${template.name} (${new Date().toLocaleDateString()})`,
      type: template.type,
      marks: template.marks,
      sequence: template.sequence
    };

    onCourseSelect(raceCourse);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#22C55E';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'windward-leeward': return '⬆️⬇️';
      case 'triangle': return '🔺';
      case 'coastal': return '🏝️';
      case 'distance': return '🌊';
      default: return '⛵';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">📋 Course Templates</ThemedText>
        <ThemedText type="subtitle">Choose from proven race course designs</ThemedText>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Category Filter */}
        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Course Type:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['all', 'windward-leeward', 'triangle', 'coastal', 'distance'].map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.filterButton,
                  selectedCategory === category && styles.filterButtonActive
                ]}
              >
                <ThemedText style={[
                  styles.filterButtonText,
                  selectedCategory === category && styles.filterButtonTextActive
                ]}>
                  {category === 'all' ? 'All' : category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Difficulty Filter */}
        <View style={styles.filterGroup}>
          <ThemedText style={styles.filterLabel}>Difficulty:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['all', 'beginner', 'intermediate', 'advanced'].map((difficulty) => (
              <TouchableOpacity
                key={difficulty}
                onPress={() => setSelectedDifficulty(difficulty)}
                style={[
                  styles.filterButton,
                  selectedDifficulty === difficulty && styles.filterButtonActive
                ]}
              >
                <ThemedText style={[
                  styles.filterButtonText,
                  selectedDifficulty === difficulty && styles.filterButtonTextActive
                ]}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Templates Grid */}
      <ScrollView style={styles.templatesContainer} contentContainerStyle={styles.templatesContent}>
        {filteredTemplates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateCard}
            onPress={() => handleTemplateSelect(template)}
          >
            <View style={styles.templateHeader}>
              <View style={styles.templateTitle}>
                <ThemedText style={styles.templateIcon}>{getTypeIcon(template.type)}</ThemedText>
                <ThemedText style={styles.templateName}>{template.name}</ThemedText>
              </View>
              <View style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(template.difficulty) }
              ]}>
                <ThemedText style={styles.difficultyText}>
                  {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.templateDescription}>
              {template.description}
            </ThemedText>

            <View style={styles.templateStats}>
              <ThemedText style={styles.templateStat}>📍 {template.marks.length} marks</ThemedText>
              <ThemedText style={styles.templateStat}>
                🎯 {template.suitableFor.slice(0, 2).join(', ')}
                {template.suitableFor.length > 2 && ` +${template.suitableFor.length - 2} more`}
              </ThemedText>
            </View>

            <Button
              variant="outline"
              onPress={() => handleTemplateSelect(template)}
              style={styles.selectButton}
            >
              <ThemedText style={styles.selectButtonText}>Use Template</ThemedText>
            </Button>
          </TouchableOpacity>
        ))}

        {filteredTemplates.length === 0 && (
          <View style={styles.emptyContainer}>
            <ThemedText type="title" style={styles.emptyTitle}>No templates found</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Try adjusting your filters or create a custom course from scratch
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
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
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  templatesContainer: {
    flex: 1,
  },
  templatesContent: {
    padding: 16,
    gap: 16,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    boxShadow: '0px 1px',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  templateTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  templateIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  templateDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  templateStats: {
    flexDirection: 'column',
    gap: 4,
    marginBottom: 12,
  },
  templateStat: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  selectButton: {
    borderColor: '#0066CC',
  },
  selectButtonText: {
    color: '#0066CC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
});