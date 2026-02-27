import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DashboardSection } from '@/components/dashboard/shared';

export default function FleetMembersScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <DashboardSection
        title="Fleet Members"
        subtitle="Manage members, roles, and invitations"
      >
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/fleet/activity')}
        >
          <View style={styles.actionIcon}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color="#2563EB" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Member Activity</Text>
            <Text style={styles.actionText}>
              Review member updates, participation, and recent fleet interactions.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/members')}
        >
          <View style={styles.actionIcon}>
            <MaterialCommunityIcons name="account-multiple-check-outline" size={22} color="#2563EB" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Club Members Workspace</Text>
            <Text style={styles.actionText}>
              Open the full members workspace for approvals, roles, and outreach.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
        </TouchableOpacity>
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
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});
