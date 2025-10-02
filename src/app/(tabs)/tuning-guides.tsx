import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TuningGuidesSection } from '@/src/components/sailor';
import { useSailorDashboardData } from '@/src/hooks';
import { useAuth } from '@/src/providers/AuthProvider';

export default function TuningGuidesScreen() {
  const { user } = useAuth();
  const sailorData = useSailorDashboardData();

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Sign in to view tuning guides tailored to your classes.
        </Text>
      </View>
    );
  }

  if (sailorData.loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.message}>Loading tuning guides...</Text>
      </View>
    );
  }

  if (sailorData.error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Unable to load guides: {sailorData.error}</Text>
      </View>
    );
  }

  if (sailorData.classes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Add a boat class from the Boats tab to unlock class-specific tuning content.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {sailorData.classes.map(cls => (
        <View key={cls.id} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{cls.name}</Text>
            {cls.sailNumber && (
              <Text style={styles.sectionSubTitle}>Sail #{cls.sailNumber}</Text>
            )}
          </View>
          <TuningGuidesSection
            classId={cls.id}
            className={cls.name}
            sailorId={user.id}
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
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  sectionSubTitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
});
