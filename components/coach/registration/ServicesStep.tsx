import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CoachRegistrationForm, ServiceType } from '../../../types/coach';

interface ServicesStepProps {
  data: CoachRegistrationForm;
  updateData: (section: keyof CoachRegistrationForm, data: any) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  isLastStep: boolean;
}

const SERVICE_TEMPLATES = [
  {
    service_type: 'race_analysis' as ServiceType,
    title: 'Race Analysis & Review',
    description: 'Post-race video and data analysis with actionable feedback',
    base_price: 7500, // $75
    duration_minutes: 60,
  },
  {
    service_type: 'live_coaching' as ServiceType,
    title: '1-on-1 Coaching Session',
    description: 'Live video coaching session with personalized instruction',
    base_price: 12000, // $120
    duration_minutes: 60,
  },
];

export default function ServicesStep({ data, updateData }: ServicesStepProps) {
  const [services, setServices] = useState(data.services.length > 0 ? data.services : SERVICE_TEMPLATES);

  useEffect(() => {
    updateData('services', services);
  }, [services, updateData]);

  const updateService = (index: number, field: string, value: any) => {
    const updated = services.map((service, i) =>
      i === index ? { ...service, [field]: value } : service
    );
    setServices(updated);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Services & Pricing</Text>
        <Text style={styles.subtitle}>Define your coaching services and pricing</Text>
      </View>

      {services.map((service, index) => (
        <View key={index} style={styles.serviceCard}>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          <TextInput
            style={styles.input}
            value={(service.base_price / 100).toString()}
            onChangeText={(value) => updateService(index, 'base_price', parseFloat(value) * 100 || 0)}
            placeholder="120"
            keyboardType="numeric"
          />
          <Text style={styles.label}>Price (USD per hour)</Text>
        </View>
      ))}

      <Text style={styles.note}>
        Note: This is a simplified version. Full implementation would include multiple service types, package deals, etc.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', lineHeight: 22 },
  serviceCard: { backgroundColor: '#F8F8F8', padding: 16, borderRadius: 8, marginBottom: 16 },
  serviceTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 16, fontSize: 16, backgroundColor: '#FFFFFF' },
  label: { fontSize: 14, color: '#666', marginTop: 4 },
  note: { fontSize: 14, color: '#666', fontStyle: 'italic', marginTop: 20, textAlign: 'center' },
});