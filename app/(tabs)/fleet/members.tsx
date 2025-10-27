import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DashboardSection } from '@/components/dashboard/shared';

export default function FleetMembersScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <DashboardSection
        title="Fleet Members"
        subtitle="Manage members, roles, and invitations"
      >
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderTitle}>Members directory coming soon</Text>
          <Text style={styles.placeholderText}>
            You’ll be able to see active sailors, pending invitations, and assign fleet roles here.
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
