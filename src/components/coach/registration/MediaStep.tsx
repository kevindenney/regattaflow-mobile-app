import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CoachRegistrationForm } from '../../../types/coach';

interface MediaStepProps {
  data: CoachRegistrationForm;
  updateData: (section: keyof CoachRegistrationForm, data: any) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  isLastStep: boolean;
}

export default function MediaStep({ data, updateData }: MediaStepProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photos & Videos</Text>
        <Text style={styles.subtitle}>Add a profile photo and intro video (optional)</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          📷 Profile Photo Upload
          {'\n\n'}
          🎥 Intro Video Upload
          {'\n\n'}
          📸 Action Photos Gallery
        </Text>
      </View>

      <Text style={styles.note}>
        Note: This is a simplified version. Full implementation would include image/video upload via expo-image-picker, file storage in Supabase Storage, etc.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', lineHeight: 22 },
  placeholder: {
    backgroundColor: '#F8F8F8',
    padding: 40,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24
  },
  note: { fontSize: 14, color: '#666', fontStyle: 'italic', marginTop: 20, textAlign: 'center' },
});