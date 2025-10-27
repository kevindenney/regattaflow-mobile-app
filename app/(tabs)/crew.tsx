import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CrewManagement, CrewAvailabilityCalendar, CrewPerformanceCard } from '@/components/sailor';
import { useSailorDashboardData } from '@/hooks';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { CrewMember } from '@/services/crewManagementService';

export default function CrewScreen() {
  const { user } = useAuth();
  const sailorData = useSailorDashboardData();
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);

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
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Crew Management</Text>
            <Text style={styles.headerSubtitle}>
              Manage your crew members, availability, and performance
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Navigate to availability view
              setShowAvailabilityModal(true);
            }}
          >
            <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Availability</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Navigate to performance view
              setShowPerformanceModal(true);
            }}
          >
            <Ionicons name="stats-chart-outline" size={24} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Performance</Text>
          </TouchableOpacity>
        </View>

        {/* Crew by Class */}
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

      {/* Availability Modal */}
      <Modal
        visible={showAvailabilityModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAvailabilityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crew Availability</Text>
              <TouchableOpacity onPress={() => setShowAvailabilityModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedMember ? (
              <ScrollView>
                <CrewAvailabilityCalendar
                  crewMember={selectedMember}
                  onUpdate={() => {
                    // Refresh crew data
                  }}
                />
              </ScrollView>
            ) : (
              <View style={styles.modalEmptyState}>
                <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
                <Text style={styles.modalEmptyTitle}>Select a Crew Member</Text>
                <Text style={styles.modalEmptyText}>
                  Choose a crew member from the list to view their availability
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Performance Modal */}
      <Modal
        visible={showPerformanceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPerformanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crew Performance</Text>
              <TouchableOpacity onPress={() => setShowPerformanceModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedMember ? (
              <ScrollView>
                <CrewPerformanceCard crewMember={selectedMember} />
              </ScrollView>
            ) : (
              <View style={styles.modalEmptyState}>
                <Ionicons name="stats-chart-outline" size={48} color="#CBD5E1" />
                <Text style={styles.modalEmptyTitle}>Select a Crew Member</Text>
                <Text style={styles.modalEmptyText}>
                  Choose a crew member from the list to view their performance stats
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
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
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
    marginLeft: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalEmptyState: {
    alignItems: 'center',
    padding: 48,
  },
  modalEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  modalEmptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
