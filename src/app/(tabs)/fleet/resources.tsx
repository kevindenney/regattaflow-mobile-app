import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DashboardSection } from '@/src/components/dashboard/shared';

export default function FleetResourcesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <DashboardSection
        title="Fleet Resources"
        subtitle="Shared tuning guides, strategy notes, and logistics documents"
      >
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderTitle}>Resource sharing is on the way</Text>
          <Text style={styles.placeholderText}>
            Soon you’ll be able to upload tuning guides, tag documents, and notify your fleet.
          </Text>
        </View>
      </DashboardSection>
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
    paddingBottom: 32,
  },
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  placeholderText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});
