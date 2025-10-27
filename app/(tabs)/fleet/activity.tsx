import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useUserFleets } from '@/hooks/useFleetData';
import { FleetActivityFeed } from '@/components/fleets/FleetActivityFeed';
import { Ionicons } from '@expo/vector-icons';

export default function FleetActivityScreen() {
  const { user } = useAuth();
  const { fleets, loading } = useUserFleets(user?.id);

  const activeFleet = fleets[0]?.fleet;

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }

  if (!activeFleet || !user) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Active Fleet</Text>
        <Text style={styles.emptyText}>
          Join a fleet to see activity and connect with other sailors
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FleetActivityFeed fleetId={activeFleet.id} userId={user.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});
