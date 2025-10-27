import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '../../../components/themed-text';
import { Button } from '../ui/button';
import { RaceCourse } from './RaceBuilder';

export interface CourseValidationProps {
  course: RaceCourse | null;
  onValidationComplete: (errors: string[]) => void;
}

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  check: (course: RaceCourse) => boolean;
  message: string;
}

export function CourseValidation({ course, onValidationComplete }: CourseValidationProps) {
  const [validationResults, setValidationResults] = useState<{
    errors: string[];
    warnings: string[];
    infos: string[];
    passed: string[];
  }>({ errors: [], warnings: [], infos: [], passed: [] });

  const [validating, setValidating] = useState(false);

  // Validation rules based on World Sailing guidelines and best practices
  const validationRules: ValidationRule[] = [
    {
      id: 'minimum-marks',
      name: 'Minimum Marks Required',
      description: 'Course must have at least start and finish marks',
      severity: 'error',
      check: (course) => course.marks.length >= 2,
      message: 'Course must have at least 2 marks (start and finish)'
    },
    {
      id: 'start-mark-present',
      name: 'Start Mark Required',
      description: 'Course must have a designated start mark or line',
      severity: 'error',
      check: (course) => course.marks.some(mark => mark.type === 'start'),
      message: 'Course must have a start mark'
    },
    {
      id: 'finish-mark-present',
      name: 'Finish Mark Required',
      description: 'Course must have a designated finish mark or line',
      severity: 'error',
      check: (course) => course.marks.some(mark => mark.type === 'finish'),
      message: 'Course must have a finish mark'
    },
    {
      id: 'windward-leeward-structure',
      name: 'Windward-Leeward Structure',
      description: 'Windward-leeward courses should have windward and leeward marks',
      severity: 'warning',
      check: (course) => {
        if (course.type !== 'windward-leeward') return true;
        return course.marks.some(mark => mark.type === 'windward') &&
               course.marks.some(mark => mark.type === 'leeward');
      },
      message: 'Windward-Leeward course should have both windward and leeward marks'
    },
    {
      id: 'mark-spacing',
      name: 'Adequate Mark Spacing',
      description: 'Marks should be appropriately spaced for safe racing',
      severity: 'warning',
      check: (course) => {
        // Check minimum distance between marks (simplified calculation)
        const marks = course.marks;
        for (let i = 0; i < marks.length; i++) {
          for (let j = i + 1; j < marks.length; j++) {
            const mark1 = marks[i];
            const mark2 = marks[j];

            // Calculate approximate distance in nautical miles
            const lat1 = mark1.coordinates[1];
            const lng1 = mark1.coordinates[0];
            const lat2 = mark2.coordinates[1];
            const lng2 = mark2.coordinates[0];

            const dlat = lat2 - lat1;
            const dlng = lng2 - lng1;
            const distance = Math.sqrt(dlat * dlat + dlng * dlng) * 60; // Rough nm calculation

            // Minimum distance should be at least 0.1nm (about 200m)
            if (distance < 0.1 && mark1.type !== mark2.type) {
              return false;
            }
          }
        }
        return true;
      },
      message: 'Some marks may be too close together (recommended minimum 200m apart)'
    },
    {
      id: 'course-sequence',
      name: 'Course Sequence Defined',
      description: 'Racing sequence should be clearly defined',
      severity: 'warning',
      check: (course) => course.sequence && course.sequence.length > 1,
      message: 'Course sequence is not defined - sailors may be unclear on the racing order'
    },
    {
      id: 'weather-integration',
      name: 'Weather Conditions',
      description: 'Weather data should be integrated for optimal course design',
      severity: 'info',
      check: (course) => course.weather !== undefined,
      message: 'Weather conditions not integrated - consider adding for optimal course design'
    },
    {
      id: 'mark-rounding-directions',
      name: 'Mark Rounding Directions',
      description: 'Racing marks should have defined rounding directions',
      severity: 'info',
      check: (course) => {
        const racingMarks = course.marks.filter(mark =>
          mark.type === 'windward' || mark.type === 'leeward' || mark.type === 'reaching'
        );
        return racingMarks.every(mark => mark.rounding !== undefined);
      },
      message: 'Some racing marks do not have defined rounding directions'
    },
    {
      id: 'triangle-course-structure',
      name: 'Triangle Course Structure',
      description: 'Triangle courses should have appropriate mark configuration',
      severity: 'warning',
      check: (course) => {
        if (course.type !== 'triangle') return true;
        const reachingMarks = course.marks.filter(mark => mark.type === 'reaching').length;
        return reachingMarks >= 1; // At least one reaching mark for triangle
      },
      message: 'Triangle course should have at least one reaching mark'
    },
    {
      id: 'course-length',
      name: 'Course Length Appropriate',
      description: 'Course should be appropriate length for racing',
      severity: 'info',
      check: (course) => {
        // Calculate rough course perimeter
        const marks = course.marks;
        if (marks.length < 3) return true;

        let totalDistance = 0;
        for (let i = 0; i < marks.length - 1; i++) {
          const mark1 = marks[i];
          const mark2 = marks[i + 1];

          const lat1 = mark1.coordinates[1];
          const lng1 = mark1.coordinates[0];
          const lat2 = mark2.coordinates[1];
          const lng2 = mark2.coordinates[0];

          const dlat = lat2 - lat1;
          const dlng = lng2 - lng1;
          const distance = Math.sqrt(dlat * dlat + dlng * dlng) * 60;
          totalDistance += distance;
        }

        // Course should be between 0.5 and 10 nautical miles
        return totalDistance >= 0.5 && totalDistance <= 10;
      },
      message: 'Course length may be too short (<0.5nm) or too long (>10nm) for typical club racing'
    }
  ];

  const runValidation = async () => {
    if (!course) return;

    setValidating(true);

    // Simulate validation processing time
    await new Promise(resolve => setTimeout(resolve, 800));

    const results = {
      errors: [] as string[],
      warnings: [] as string[],
      infos: [] as string[],
      passed: [] as string[]
    };

    validationRules.forEach(rule => {
      const passes = rule.check(course);

      if (passes) {
        results.passed.push(rule.name);
      } else {
        switch (rule.severity) {
          case 'error':
            results.errors.push(rule.message);
            break;
          case 'warning':
            results.warnings.push(rule.message);
            break;
          case 'info':
            results.infos.push(rule.message);
            break;
        }
      }
    });

    setValidationResults(results);
    onValidationComplete(results.errors);
    setValidating(false);
  };

  useEffect(() => {
    if (course) {
      runValidation();
    }
  }, [course?.marks, course?.sequence, course?.weather]);

  const getValidationIcon = (type: 'error' | 'warning' | 'info' | 'success') => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      default: return '📋';
    }
  };

  const getValidationColor = (type: 'error' | 'warning' | 'info' | 'success') => {
    switch (type) {
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
      case 'success': return '#22C55E';
      default: return '#6B7280';
    }
  };

  if (!course) {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <ThemedText type="title" style={styles.messageTitle}>✅ Course Validation</ThemedText>
          <ThemedText style={styles.messageSubtitle}>
            Create a course to run safety and compliance validation
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">✅ Course Validation</ThemedText>
        <ThemedText type="subtitle">Safety and compliance check</ThemedText>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Validation Summary */}
        <View style={styles.summaryContainer}>
          <ThemedText style={styles.sectionTitle}>📊 Validation Summary</ThemedText>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { borderLeftColor: getValidationColor('error') }]}>
              <ThemedText style={styles.summaryNumber}>{validationResults.errors.length}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Errors</ThemedText>
            </View>

            <View style={[styles.summaryCard, { borderLeftColor: getValidationColor('warning') }]}>
              <ThemedText style={styles.summaryNumber}>{validationResults.warnings.length}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Warnings</ThemedText>
            </View>

            <View style={[styles.summaryCard, { borderLeftColor: getValidationColor('info') }]}>
              <ThemedText style={styles.summaryNumber}>{validationResults.infos.length}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Info</ThemedText>
            </View>

            <View style={[styles.summaryCard, { borderLeftColor: getValidationColor('success') }]}>
              <ThemedText style={styles.summaryNumber}>{validationResults.passed.length}</ThemedText>
              <ThemedText style={styles.summaryLabel}>Passed</ThemedText>
            </View>
          </View>

          {/* Overall Status */}
          <View style={[
            styles.overallStatus,
            {
              backgroundColor: validationResults.errors.length > 0
                ? '#FEF2F2'
                : validationResults.warnings.length > 0
                  ? '#FEFBF0'
                  : '#F0FDF4',
              borderColor: validationResults.errors.length > 0
                ? '#EF4444'
                : validationResults.warnings.length > 0
                  ? '#F59E0B'
                  : '#22C55E'
            }
          ]}>
            <ThemedText style={[
              styles.overallStatusText,
              {
                color: validationResults.errors.length > 0
                  ? '#EF4444'
                  : validationResults.warnings.length > 0
                    ? '#F59E0B'
                    : '#22C55E'
              }
            ]}>
              {validationResults.errors.length > 0
                ? '❌ Course has critical issues that must be resolved'
                : validationResults.warnings.length > 0
                  ? '⚠️ Course has issues that should be addressed'
                  : '✅ Course passes all critical validation checks'}
            </ThemedText>
          </View>
        </View>

        {/* Errors */}
        {validationResults.errors.length > 0 && (
          <View style={styles.validationSection}>
            <ThemedText style={[styles.sectionTitle, { color: getValidationColor('error') }]}>
              {getValidationIcon('error')} Critical Errors
            </ThemedText>
            {validationResults.errors.map((error, index) => (
              <View key={index} style={[styles.validationItem, styles.errorItem]}>
                <ThemedText style={styles.validationText}>{error}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Warnings */}
        {validationResults.warnings.length > 0 && (
          <View style={styles.validationSection}>
            <ThemedText style={[styles.sectionTitle, { color: getValidationColor('warning') }]}>
              {getValidationIcon('warning')} Warnings
            </ThemedText>
            {validationResults.warnings.map((warning, index) => (
              <View key={index} style={[styles.validationItem, styles.warningItem]}>
                <ThemedText style={styles.validationText}>{warning}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Info Items */}
        {validationResults.infos.length > 0 && (
          <View style={styles.validationSection}>
            <ThemedText style={[styles.sectionTitle, { color: getValidationColor('info') }]}>
              {getValidationIcon('info')} Recommendations
            </ThemedText>
            {validationResults.infos.map((info, index) => (
              <View key={index} style={[styles.validationItem, styles.infoItem]}>
                <ThemedText style={styles.validationText}>{info}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Passed Checks */}
        {validationResults.passed.length > 0 && (
          <View style={styles.validationSection}>
            <ThemedText style={[styles.sectionTitle, { color: getValidationColor('success') }]}>
              {getValidationIcon('success')} Passed Checks
            </ThemedText>
            <View style={styles.passedGrid}>
              {validationResults.passed.map((check, index) => (
                <View key={index} style={styles.passedItem}>
                  <ThemedText style={styles.passedText}>✓ {check}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            variant="outline"
            onPress={runValidation}
            disabled={validating}
            style={styles.actionButton}
          >
            <ThemedText style={{ color: '#0066CC' }}>
              {validating ? '🔄 Validating...' : '🔄 Re-run Validation'}
            </ThemedText>
          </Button>

          {validationResults.errors.length === 0 && (
            <Button
              style={[styles.actionButton, { backgroundColor: '#22C55E' }]}
            >
              <ThemedText style={{ color: '#fff' }}>✅ Course Ready</ThemedText>
            </Button>
          )}
        </View>
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
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  messageTitle: {
    color: '#6B7280',
    marginBottom: 8,
  },
  messageSubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    boxShadow: '0px 1px',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  overallStatus: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  overallStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  validationSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    boxShadow: '0px 1px',
  },
  validationItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  errorItem: {
    backgroundColor: '#FEF2F2',
    borderLeftColor: '#EF4444',
  },
  warningItem: {
    backgroundColor: '#FEFBF0',
    borderLeftColor: '#F59E0B',
  },
  infoItem: {
    backgroundColor: '#EFF6FF',
    borderLeftColor: '#3B82F6',
  },
  validationText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  passedGrid: {
    gap: 8,
  },
  passedItem: {
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
  },
  passedText: {
    fontSize: 12,
    color: '#16A34A',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
  },
});