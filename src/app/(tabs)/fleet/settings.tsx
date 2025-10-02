import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DashboardSection } from '@/src/components/dashboard/shared';

export default function FleetSettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <DashboardSection
        title="Fleet Settings"
        subtitle="Manage fleet profile, WhatsApp link, and membership approvals"
      >
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderTitle}>Admin tools coming soon</Text>
          <Text style={styles.placeholderText}>
            Fleet captains will be able to edit fleet details, manage invites, and configure notifications.
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
