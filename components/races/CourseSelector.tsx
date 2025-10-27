/**
 * Course Selector Component
 * Allows users to browse and select courses from library
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CourseLibraryService } from '@/services/CourseLibraryService';
import { useAuth } from '@/providers/AuthProvider';
import type { RaceCourse, CourseScope, CourseType } from '@/types/courses';

interface CourseSelectorProps {
  visible: boolean;
  onClose: () => void;
  onCourseSelected: (course: RaceCourse) => void;
  onCreateNew: () => void;
  venueId?: string;
  clubId?: string;
}

type TabValue = 'personal' | 'club' | 'venue' | 'recent';

export function CourseSelector({
  visible,
  onClose,
  onCourseSelected,
  onCreateNew,
  venueId,
  clubId,
}: CourseSelectorProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabValue>('recent');
  const [courses, setCourses] = useState<RaceCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<CourseType | 'all'>('all');

  // Load courses when tab changes or modal opens
  useEffect(() => {
    if (visible) {
      loadCourses();
    }
  }, [visible, activeTab, searchQuery]);

  const loadCourses = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let loadedCourses: RaceCourse[] = [];

      if (activeTab === 'recent') {
        loadedCourses = await CourseLibraryService.getRecentlyUsed(user.id, 10);
      } else {
        loadedCourses = await CourseLibraryService.fetchCoursesByScope(
          activeTab as CourseScope,
          {
            userId: user.id,
            clubId: clubId,
            venueId: venueId,
            searchQuery: searchQuery || undefined,
          }
        );
      }

      // Apply course type filter
      if (filterType !== 'all') {
        loadedCourses = loadedCourses.filter(
          (course) => course.course_type === filterType
        );
      }

      setCourses(loadedCourses);
    } catch (error) {
      console.error('[CourseSelector] Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = async (course: RaceCourse) => {
    // Record usage
    await CourseLibraryService.recordCourseUsage(course.id);

    // Notify parent
    onCourseSelected(course);
    onClose();
  };

  const getCourseTypeLabel = (type: CourseType): string => {
    const labels: Record<CourseType, string> = {
      windward_leeward: 'W/L',
      triangle: 'Triangle',
      olympic: 'Olympic',
      trapezoid: 'Trapezoid',
      custom: 'Custom',
    };
    return labels[type] || type;
  };

  const getCourseTypeIcon = (type: CourseType): string => {
    const icons: Record<CourseType, string> = {
      windward_leeward: 'arrow-up-down',
      triangle: 'triangle-outline',
      olympic: 'star-outline',
      trapezoid: 'rhombus-outline',
      custom: 'shape-outline',
    };
    return icons[type] || 'shape-outline';
  };

  const renderCourseCard = (course: RaceCourse) => {
    const markCount = course.marks?.length || 0;
    const usageCount = course.usage_count || 0;

    return (
      <TouchableOpacity
        key={course.id}
        style={styles.courseCard}
        onPress={() => handleCourseSelect(course)}
      >
        <View style={styles.courseCardHeader}>
          <View style={styles.courseNameRow}>
            <MaterialCommunityIcons
              name={getCourseTypeIcon(course.course_type) as any}
              size={20}
              color="#2196F3"
              style={styles.courseIcon}
            />
            <Text style={styles.courseName}>{course.name}</Text>
          </View>
          <View style={styles.courseTypeBadge}>
            <Text style={styles.courseTypeText}>
              {getCourseTypeLabel(course.course_type)}
            </Text>
          </View>
        </View>

        {course.description && (
          <Text style={styles.courseDescription} numberOfLines={2}>
            {course.description}
          </Text>
        )}

        <View style={styles.courseStats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="map-marker-multiple"
              size={16}
              color="#666"
            />
            <Text style={styles.statText}>{markCount} marks</Text>
          </View>

          {course.typical_length_nm && (
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="ruler" size={16} color="#666" />
              <Text style={styles.statText}>
                {course.typical_length_nm.toFixed(1)} nm
              </Text>
            </View>
          )}

          {course.estimated_duration_minutes && (
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
              <Text style={styles.statText}>
                ~{course.estimated_duration_minutes} min
              </Text>
            </View>
          )}
        </View>

        {usageCount > 0 && (
          <View style={styles.usageRow}>
            <MaterialCommunityIcons name="history" size={14} color="#999" />
            <Text style={styles.usageText}>Used {usageCount} times</Text>
            {course.last_used_date && (
              <Text style={styles.lastUsedText}>
                • Last: {new Date(course.last_used_date).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Select Course</Text>
          <TouchableOpacity onPress={onCreateNew} style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
            onPress={() => setActiveTab('recent')}
          >
            <MaterialCommunityIcons
              name="history"
              size={20}
              color={activeTab === 'recent' ? '#2196F3' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'recent' && styles.activeTabText,
              ]}
            >
              Recent
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
            onPress={() => setActiveTab('personal')}
          >
            <MaterialCommunityIcons
              name="account"
              size={20}
              color={activeTab === 'personal' ? '#2196F3' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'personal' && styles.activeTabText,
              ]}
            >
              Personal
            </Text>
          </TouchableOpacity>

          {clubId && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'club' && styles.activeTab]}
              onPress={() => setActiveTab('club')}
            >
              <MaterialCommunityIcons
                name="account-group"
                size={20}
                color={activeTab === 'club' ? '#2196F3' : '#666'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'club' && styles.activeTabText,
                ]}
              >
                My Club
              </Text>
            </TouchableOpacity>
          )}

          {venueId && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'venue' && styles.activeTab]}
              onPress={() => setActiveTab('venue')}
            >
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={activeTab === 'venue' ? '#2196F3' : '#666'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'venue' && styles.activeTabText,
                ]}
              >
                Venue
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === 'all' && styles.activeFilterChip,
              ]}
              onPress={() => setFilterType('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterType === 'all' && styles.activeFilterChipText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === 'windward_leeward' && styles.activeFilterChip,
              ]}
              onPress={() => setFilterType('windward_leeward')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterType === 'windward_leeward' &&
                    styles.activeFilterChipText,
                ]}
              >
                W/L
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === 'triangle' && styles.activeFilterChip,
              ]}
              onPress={() => setFilterType('triangle')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterType === 'triangle' && styles.activeFilterChipText,
                ]}
              >
                Triangle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === 'olympic' && styles.activeFilterChip,
              ]}
              onPress={() => setFilterType('olympic')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterType === 'olympic' && styles.activeFilterChipText,
                ]}
              >
                Olympic
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === 'trapezoid' && styles.activeFilterChip,
              ]}
              onPress={() => setFilterType('trapezoid')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterType === 'trapezoid' && styles.activeFilterChipText,
                ]}
              >
                Trapezoid
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === 'custom' && styles.activeFilterChip,
              ]}
              onPress={() => setFilterType('custom')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterType === 'custom' && styles.activeFilterChipText,
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Course List */}
        <ScrollView style={styles.courseList} contentContainerStyle={styles.courseListContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading courses...</Text>
            </View>
          ) : courses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="map-marker-off"
                size={64}
                color="#DDD"
              />
              <Text style={styles.emptyText}>No courses found</Text>
              <Text style={styles.emptySubtext}>
                Create your first course to get started
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={onCreateNew}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                <Text style={styles.createButtonText}>Create Course</Text>
              </TouchableOpacity>
            </View>
          ) : (
            courses.map(renderCourseCard)
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2196F3',
  },
  searchContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterScroll: {
    maxHeight: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeFilterChip: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#FFF',
  },
  courseList: {
    flex: 1,
  },
  courseListContent: {
    padding: 16,
    gap: 12,
  },
  courseCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  courseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  courseIcon: {
    marginTop: 2,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  courseTypeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  courseTypeText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  courseStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  usageText: {
    fontSize: 12,
    color: '#999',
  },
  lastUsedText: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
