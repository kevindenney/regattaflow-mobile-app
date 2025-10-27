import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CoachRegistrationForm } from '../../../types/coach';

interface CredentialsStepProps {
  data: CoachRegistrationForm;
  updateData: (section: keyof CoachRegistrationForm, data: any) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  isLastStep: boolean;
}

export default function CredentialsStep({ data, updateData }: CredentialsStepProps) {
  const [credentials, setCredentials] = useState(data.credentials);

  useEffect(() => {
    updateData('credentials', credentials);
  }, [credentials, updateData]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Credentials & Experience</Text>
        <Text style={styles.subtitle}>Share your coaching experience and achievements</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Years Coaching *</Text>
        <TextInput
          style={styles.input}
          value={credentials.years_coaching.toString()}
          onChangeText={(value) => setCredentials(prev => ({ ...prev, years_coaching: parseInt(value) || 0 }))}
          placeholder="5"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Students Coached</Text>
        <TextInput
          style={styles.input}
          value={credentials.students_coached.toString()}
          onChangeText={(value) => setCredentials(prev => ({ ...prev, students_coached: parseInt(value) || 0 }))}
          placeholder="50"
          keyboardType="numeric"
        />
      </View>

      <Text style={styles.note}>
        Note: This is a simplified version. Full implementation would include certification uploads, achievement verification, etc.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', lineHeight: 22 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 16, fontSize: 16 },
  note: { fontSize: 14, color: '#666', fontStyle: 'italic', marginTop: 20, textAlign: 'center' },
});