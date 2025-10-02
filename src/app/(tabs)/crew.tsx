import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CrewManagement } from '@/src/components/sailor';
import { useSailorDashboardData } from '@/src/hooks';
import { useAuth } from '@/src/providers/AuthProvider';

export default function CrewScreen() {
  const { user } = useAuth();
  const sailorData = useSailorDashboardData();

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Sign in to manage your crew assignments.</Text>
      </View>
    );
  }

  if (sailorData.loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.message}>Loading crew details...</Text>
      </View>
    );
  }

  if (sailorData.error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Unable to load crew data: {sailorData.error}</Text>
      </View>
    );
  }

  if (sailorData.classes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Add a boat class from the Boats tab to start managing crew members.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {sailorData.classes.map(cls => (
        <View key={cls.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{cls.name}</Text>
          <CrewManagement
            sailorId={user.id}
            classId={cls.id}
            className={cls.name}
            sailNumber={cls.sailNumber}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    color: '#334155',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0px 4px',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
});
