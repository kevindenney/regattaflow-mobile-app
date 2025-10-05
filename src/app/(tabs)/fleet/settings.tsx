import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DashboardSection } from '@/src/components/dashboard/shared';

export default function FleetSettingsScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <DashboardSection
        title="Your Fleets"
        subtitle="Manage which fleets you participate in"
        showBorder={false}
      >
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/fleet/select')}
        >
          <View style={styles.actionIcon}>
            <MaterialCommunityIcons name="sail-boat" size={24} color="#2563EB" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Select Your Fleets</Text>
            <Text style={styles.actionDescription}>
              Choose the Hong Kong sailing classes you participate in
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#94A3B8" />
        </TouchableOpacity>
      </DashboardSection>

      <DashboardSection
        title="Fleet Administration"
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
    gap: 16,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0px 2px',
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  actionDescription: {
    fontSize: 13,
    color: '#64748B',
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
