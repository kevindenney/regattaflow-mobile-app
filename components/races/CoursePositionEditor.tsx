/**
 * CoursePositionEditor Component
 *
 * Modal for positioning race course marks on a map.
 * Allows editing wind direction and mark positions.
 *
 * TODO: Full implementation pending
 */

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';

export type CourseType = 'windward_leeward' | 'triangle' | 'olympic' | 'trapezoid';

export interface CourseMark {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'windward' | 'leeward' | 'gate' | 'offset' | 'reach';
}

export interface PositionedCourse {
  courseType: CourseType;
  windDirection: number;
  marks: CourseMark[];
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface CoursePositionEditorProps {
  visible: boolean;
  regattaId: string;
  initialCourseType?: CourseType;
  initialLocation?: { lat: number; lng: number };
  initialWindDirection?: number;
  onSave: (course: PositionedCourse) => void;
  onCancel: () => void;
}

export function CoursePositionEditor({
  visible,
  onCancel,
}: CoursePositionEditorProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Course Position Editor</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.comingSoon}>Coming Soon</Text>
          <Text style={styles.description}>
            Course positioning with interactive map editing will be available in a future update.
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  comingSoon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
});

export default CoursePositionEditor;
