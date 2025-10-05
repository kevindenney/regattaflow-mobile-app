/**
 * Boats List Screen - Base/Fallback Version
 * This is the universal fallback. Platform-specific versions (.web.tsx, .native.tsx) override this.
 */

import { useAuth } from '@/src/providers/AuthProvider';
import { sailorBoatService, type SailorBoat } from '@/src/services/SailorBoatService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function BoatsScreen() {
  const { user } = useAuth();
  const [boats, setBoats] = useState<SailorBoat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBoats();
    }
  }, [user]);

  const loadBoats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const boatList = await sailorBoatService.listBoatsForSailor(user.id);
      setBoats(boatList);
    } catch (error) {
      console.error('Error loading boats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBoatPress = (boatId: string) => {
    router.push(`/(tabs)/boat/${boatId}`);
  };

  const handleAddBoat = () => {
    console.log('Add boat');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading boats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Boats</Text>
        <TouchableOpacity onPress={handleAddBoat} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {boats.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="boat-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No boats yet</Text>
            <Text style={styles.emptyText}>
              Add your first boat to start tracking equipment and maintenance.
            </Text>
            <TouchableOpacity onPress={handleAddBoat} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Add Boat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.boatList}>
            {boats.map((boat) => (
              <TouchableOpacity
                key={boat.id}
                style={styles.boatCard}
                onPress={() => handleBoatPress(boat.id)}
              >
                <View style={styles.boatCardHeader}>
                  <Text style={styles.boatName}>{boat.name}</Text>
                  {boat.is_primary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
                <View style={styles.boatCardDetails}>
                  <Text style={styles.boatClass}>
                    {boat.boat_class?.name || 'Unknown Class'}
                  </Text>
                  {boat.sail_number && (
                    <Text style={styles.sailNumber}>#{boat.sail_number}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB for adding boats */}
      {boats.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddBoat}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  boatList: {
    padding: 16,
  },
  boatCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  boatCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  boatName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  primaryBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  boatCardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boatClass: {
    fontSize: 14,
    color: '#64748B',
  },
  sailNumber: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});
