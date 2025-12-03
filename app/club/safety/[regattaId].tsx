/**
 * Safety Boat Coordinator Dashboard
 * 
 * Comprehensive safety management for race day operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
  Vibration,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import safetyBoatService, {
  SafetyBoat,
  SafetyPosition,
  SafetyAssignment,
  SafetyIncident,
  SafetyCrew,
  IncidentType,
  IncidentSeverity,
  AssignmentStatus,
  RadioStatus,
} from '../../../services/SafetyBoatService';

// ============================================================================
// Types
// ============================================================================

type TabType = 'fleet' | 'incidents' | 'radio' | 'debrief';

interface CoverageStatus {
  totalBoats: number;
  deployed: number;
  standby: number;
  responding: number;
  positions: {
    covered: number;
    required: number;
    names: string[];
  };
  readiness: 'green' | 'yellow' | 'red';
}

// ============================================================================
// Main Component
// ============================================================================

export default function SafetyDashboard() {
  const { regattaId, clubId } = useLocalSearchParams<{ regattaId: string; clubId: string }>();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('fleet');
  const [assignments, setAssignments] = useState<SafetyAssignment[]>([]);
  const [boats, setBoats] = useState<SafetyBoat[]>([]);
  const [positions, setPositions] = useState<SafetyPosition[]>([]);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [coverage, setCoverage] = useState<CoverageStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<SafetyAssignment | null>(null);
  
  // Form state
  const [newIncident, setNewIncident] = useState<Partial<SafetyIncident>>({
    incident_type: 'capsize',
    severity: 'minor',
    description: '',
  });
  const [newCrew, setNewCrew] = useState<Partial<SafetyCrew>>({
    name: '',
    role: 'crew',
  });
  
  // Today's date
  const today = new Date().toISOString().split('T')[0];
  
  // ==========================================================================
  // Data Loading
  // ==========================================================================
  
  const loadData = useCallback(async () => {
    if (!regattaId || !clubId) return;
    
    try {
      const [assignmentsData, boatsData, positionsData, incidentsData, coverageData] = 
        await Promise.all([
          safetyBoatService.getAssignments(regattaId, today),
          safetyBoatService.getBoats(clubId),
          safetyBoatService.getPositions(clubId),
          safetyBoatService.getOpenIncidents(regattaId),
          safetyBoatService.getCoverageStatus(regattaId),
        ]);
      
      setAssignments(assignmentsData);
      setBoats(boatsData);
      setPositions(positionsData);
      setIncidents(incidentsData);
      setCoverage(coverageData);
    } catch (error) {
      console.error('Error loading safety data:', error);
      Alert.alert('Error', 'Failed to load safety data');
    }
  }, [regattaId, clubId, today]);
  
  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  // ==========================================================================
  // Actions
  // ==========================================================================
  
  const handleAssignBoat = async (boatId: string, positionId?: string) => {
    if (!regattaId) return;
    
    try {
      await safetyBoatService.createAssignment({
        regatta_id: regattaId,
        boat_id: boatId,
        position_id: positionId,
        assignment_date: today,
      });
      setShowAssignModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign boat');
    }
  };
  
  const handleStatusChange = async (assignmentId: string, status: AssignmentStatus) => {
    try {
      await safetyBoatService.updateAssignmentStatus(assignmentId, status);
      if (status === 'responding') {
        Vibration.vibrate([0, 200, 100, 200]);
      }
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };
  
  const handleQuickRadioCheck = async (assignmentId: string) => {
    try {
      await safetyBoatService.quickRadioCheck(assignmentId);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to record radio check');
    }
  };
  
  const handleReportIncident = async () => {
    if (!regattaId || !newIncident.description) return;
    
    try {
      await safetyBoatService.reportIncident({
        ...newIncident,
        regatta_id: regattaId,
      });
      setShowIncidentModal(false);
      setNewIncident({ incident_type: 'capsize', severity: 'minor', description: '' });
      Vibration.vibrate([0, 500]);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to report incident');
    }
  };
  
  const handleAssignResponder = async (incidentId: string, assignmentId: string) => {
    try {
      await safetyBoatService.assignResponder(incidentId, assignmentId);
      Vibration.vibrate([0, 200, 100, 200, 100, 200]);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign responder');
    }
  };
  
  const handleResolveIncident = async (incidentId: string) => {
    Alert.prompt(
      'Resolve Incident',
      'Enter actions taken:',
      async (text) => {
        if (text) {
          try {
            await safetyBoatService.resolveIncident(incidentId, 'resolved_on_water', text);
            loadData();
          } catch (error) {
            Alert.alert('Error', 'Failed to resolve incident');
          }
        }
      }
    );
  };
  
  const handleAddCrew = async () => {
    if (!selectedAssignment || !newCrew.name) return;
    
    try {
      await safetyBoatService.addCrew({
        ...newCrew,
        assignment_id: selectedAssignment.id,
      });
      setShowCrewModal(false);
      setNewCrew({ name: '', role: 'crew' });
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add crew');
    }
  };
  
  // ==========================================================================
  // Render Helpers
  // ==========================================================================
  
  const renderReadinessIndicator = () => {
    if (!coverage) return null;
    
    const colors = {
      green: '#16a34a',
      yellow: '#ca8a04',
      red: '#dc2626',
    };
    
    const messages = {
      green: 'All positions covered',
      yellow: 'Minimum coverage',
      red: 'Coverage needed',
    };
    
    return (
      <View style={[styles.readinessCard, { backgroundColor: colors[coverage.readiness] + '20' }]}>
        <View style={[styles.readinessIndicator, { backgroundColor: colors[coverage.readiness] }]} />
        <View style={styles.readinessContent}>
          <Text style={[styles.readinessTitle, { color: colors[coverage.readiness] }]}>
            {messages[coverage.readiness]}
          </Text>
          <Text style={styles.readinessSubtitle}>
            {coverage.deployed} deployed · {coverage.standby} standby · {coverage.responding} responding
          </Text>
          {coverage.positions.names.length > 0 && (
            <Text style={styles.readinessWarning}>
              ⚠️ Uncovered: {coverage.positions.names.join(', ')}
            </Text>
          )}
        </View>
        <View style={styles.readinessStats}>
          <Text style={styles.readinessFraction}>
            {coverage.positions.covered}/{coverage.positions.required}
          </Text>
          <Text style={styles.readinessLabel}>positions</Text>
        </View>
      </View>
    );
  };
  
  const renderFleetTab = () => (
    <View style={styles.tabContent}>
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => setShowAssignModal(true)}
        >
          <Ionicons name="add-circle" size={24} color="#3b82f6" />
          <Text style={styles.quickActionText}>Assign Boat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickAction, styles.emergencyAction]}
          onPress={() => setShowIncidentModal(true)}
        >
          <Ionicons name="warning" size={24} color="#dc2626" />
          <Text style={[styles.quickActionText, { color: '#dc2626' }]}>Report Incident</Text>
        </TouchableOpacity>
      </View>
      
      {/* Fleet List */}
      <Text style={styles.sectionTitle}>Safety Fleet</Text>
      {assignments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="boat-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No boats assigned for today</Text>
          <TouchableOpacity 
            style={styles.emptyAction}
            onPress={() => setShowAssignModal(true)}
          >
            <Text style={styles.emptyActionText}>Assign Safety Boats</Text>
          </TouchableOpacity>
        </View>
      ) : (
        assignments.map((assignment) => (
          <SafetyBoatCard
            key={assignment.id}
            assignment={assignment}
            onStatusChange={handleStatusChange}
            onRadioCheck={handleQuickRadioCheck}
            onAddCrew={() => {
              setSelectedAssignment(assignment);
              setShowCrewModal(true);
            }}
            onAssignToIncident={(incidentId) => handleAssignResponder(incidentId, assignment.id)}
            incidents={incidents.filter(i => i.status !== 'resolved')}
          />
        ))
      )}
    </View>
  );
  
  const renderIncidentsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.incidentHeader}>
        <Text style={styles.sectionTitle}>Active Incidents</Text>
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => setShowIncidentModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.reportButtonText}>Report</Text>
        </TouchableOpacity>
      </View>
      
      {incidents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={48} color="#16a34a" />
          <Text style={styles.emptyText}>No active incidents</Text>
        </View>
      ) : (
        incidents.map((incident) => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            assignments={assignments.filter(a => a.status === 'deployed' || a.status === 'standby')}
            onAssignResponder={(assignmentId) => handleAssignResponder(incident.id, assignmentId)}
            onResolve={() => handleResolveIncident(incident.id)}
          />
        ))
      )}
    </View>
  );
  
  const renderRadioTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Radio Status</Text>
      
      <TouchableOpacity 
        style={styles.radioAllButton}
        onPress={async () => {
          for (const assignment of assignments.filter(a => a.status === 'deployed')) {
            await handleQuickRadioCheck(assignment.id);
          }
        }}
      >
        <Ionicons name="radio" size={24} color="#fff" />
        <Text style={styles.radioAllText}>Check All Boats</Text>
      </TouchableOpacity>
      
      {assignments.map((assignment) => (
        <View key={assignment.id} style={styles.radioCard}>
          <View style={styles.radioInfo}>
            <Text style={styles.radioBoatName}>{assignment.boat?.name}</Text>
            <Text style={styles.radioChannel}>CH {assignment.boat?.vhf_channel || '72'}</Text>
          </View>
          
          <View style={styles.radioStatus}>
            <Ionicons 
              name="checkmark-circle" 
              size={24} 
              color="#16a34a"
            />
            <Text style={styles.radioStatusText}>OK</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.radioCheckButton}
            onPress={() => handleQuickRadioCheck(assignment.id)}
          >
            <Ionicons name="radio-outline" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
  
  const renderDebriefTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Day Summary</Text>
      
      <View style={styles.debriefStats}>
        <View style={styles.debriefStat}>
          <Text style={styles.debriefValue}>{assignments.length}</Text>
          <Text style={styles.debriefLabel}>Boats Used</Text>
        </View>
        <View style={styles.debriefStat}>
          <Text style={styles.debriefValue}>{incidents.length}</Text>
          <Text style={styles.debriefLabel}>Incidents</Text>
        </View>
        <View style={styles.debriefStat}>
          <Text style={styles.debriefValue}>
            {assignments.reduce((sum, a) => sum + (a.crew?.length || 0), 0)}
          </Text>
          <Text style={styles.debriefLabel}>Crew</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.exportButton}>
        <Ionicons name="document-text" size={20} color="#fff" />
        <Text style={styles.exportText}>Generate Report</Text>
      </TouchableOpacity>
      
      <Text style={styles.debriefSection}>Debrief Checklist</Text>
      {[
        'All boats returned',
        'Equipment accounted for',
        'Incidents documented',
        'Injuries reported',
        'Fuel levels noted',
      ].map((item, index) => (
        <View key={index} style={styles.checklistItem}>
          <Ionicons name="square-outline" size={24} color="#9ca3af" />
          <Text style={styles.checklistText}>{item}</Text>
        </View>
      ))}
    </View>
  );
  
  // ==========================================================================
  // Main Render
  // ==========================================================================
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🚤 Safety Coordinator</Text>
          <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.alertButton}
          onPress={() => setShowIncidentModal(true)}
        >
          <Ionicons name="alert-circle" size={28} color="#dc2626" />
          {incidents.length > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{incidents.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Readiness Indicator */}
      {renderReadinessIndicator()}
      
      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { id: 'fleet', label: 'Fleet', icon: 'boat' },
          { id: 'incidents', label: 'Incidents', icon: 'warning' },
          { id: 'radio', label: 'Radio', icon: 'radio' },
          { id: 'debrief', label: 'Debrief', icon: 'clipboard' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as TabType)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={activeTab === tab.id ? '#3b82f6' : '#6b7280'} 
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'fleet' && renderFleetTab()}
        {activeTab === 'incidents' && renderIncidentsTab()}
        {activeTab === 'radio' && renderRadioTab()}
        {activeTab === 'debrief' && renderDebriefTab()}
      </ScrollView>
      
      {/* Assign Boat Modal */}
      <Modal visible={showAssignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Safety Boat</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSection}>Select Boat</Text>
            <ScrollView style={styles.modalList}>
              {boats.filter(b => b.status === 'available').map((boat) => (
                <TouchableOpacity
                  key={boat.id}
                  style={styles.selectItem}
                  onPress={() => handleAssignBoat(boat.id)}
                >
                  <View>
                    <Text style={styles.selectItemTitle}>{boat.name}</Text>
                    <Text style={styles.selectItemSubtitle}>
                      {boat.boat_type} · CH {boat.vhf_channel || '72'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Report Incident Modal */}
      <Modal visible={showIncidentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🚨 Report Incident</Text>
              <TouchableOpacity onPress={() => setShowIncidentModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSection}>Incident Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {[
                { type: 'capsize', icon: '⛵', label: 'Capsize' },
                { type: 'collision', icon: '💥', label: 'Collision' },
                { type: 'man_overboard', icon: '🆘', label: 'MOB' },
                { type: 'medical', icon: '🏥', label: 'Medical' },
                { type: 'tow_request', icon: '🚤', label: 'Tow' },
                { type: 'other', icon: '📋', label: 'Other' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.typeButton,
                    newIncident.incident_type === item.type && styles.typeButtonActive,
                  ]}
                  onPress={() => setNewIncident(prev => ({ ...prev, incident_type: item.type as IncidentType }))}
                >
                  <Text style={styles.typeIcon}>{item.icon}</Text>
                  <Text style={styles.typeLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.modalSection}>Severity</Text>
            <View style={styles.severitySelector}>
              {(['minor', 'moderate', 'serious', 'critical'] as IncidentSeverity[]).map((sev) => (
                <TouchableOpacity
                  key={sev}
                  style={[
                    styles.severityButton,
                    newIncident.severity === sev && styles.severityButtonActive,
                    { borderColor: safetyBoatService.getSeverityInfo(sev).color },
                  ]}
                  onPress={() => setNewIncident(prev => ({ ...prev, severity: sev }))}
                >
                  <Text style={[
                    styles.severityText,
                    newIncident.severity === sev && { 
                      color: safetyBoatService.getSeverityInfo(sev).color,
                      fontWeight: '600',
                    },
                  ]}>
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.modalSection}>Sail Number(s)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 12345, 67890"
              value={newIncident.sail_numbers?.join(', ') || ''}
              onChangeText={(text) => setNewIncident(prev => ({ 
                ...prev, 
                sail_numbers: text.split(',').map(s => s.trim()).filter(Boolean),
              }))}
            />
            
            <Text style={styles.modalSection}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Near Mark 2"
              value={newIncident.location || ''}
              onChangeText={(text) => setNewIncident(prev => ({ ...prev, location: text }))}
            />
            
            <Text style={styles.modalSection}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="What happened?"
              value={newIncident.description || ''}
              onChangeText={(text) => setNewIncident(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />
            
            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: '#dc2626' }]}
              onPress={handleReportIncident}
            >
              <Text style={styles.submitText}>Report Incident</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Add Crew Modal */}
      <Modal visible={showCrewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Crew Member</Text>
              <TouchableOpacity onPress={() => setShowCrewModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSection}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Crew member name"
              value={newCrew.name || ''}
              onChangeText={(text) => setNewCrew(prev => ({ ...prev, name: text }))}
            />
            
            <Text style={styles.modalSection}>Role</Text>
            <View style={styles.roleSelector}>
              {[
                { role: 'driver', label: 'Driver' },
                { role: 'crew', label: 'Crew' },
                { role: 'first_aid', label: 'First Aid' },
                { role: 'rescue_swimmer', label: 'Rescue' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.role}
                  style={[
                    styles.roleButton,
                    newCrew.role === item.role && styles.roleButtonActive,
                  ]}
                  onPress={() => setNewCrew(prev => ({ ...prev, role: item.role as any }))}
                >
                  <Text style={[
                    styles.roleText,
                    newCrew.role === item.role && styles.roleTextActive,
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.modalSection}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Contact number"
              value={newCrew.phone || ''}
              onChangeText={(text) => setNewCrew(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleAddCrew}
            >
              <Text style={styles.submitText}>Add Crew</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface SafetyBoatCardProps {
  assignment: SafetyAssignment;
  onStatusChange: (id: string, status: AssignmentStatus) => void;
  onRadioCheck: (id: string) => void;
  onAddCrew: () => void;
  onAssignToIncident: (incidentId: string) => void;
  incidents: SafetyIncident[];
}

function SafetyBoatCard({ 
  assignment, 
  onStatusChange, 
  onRadioCheck, 
  onAddCrew,
  onAssignToIncident,
  incidents,
}: SafetyBoatCardProps) {
  const statusInfo = safetyBoatService.getStatusInfo(assignment.status);
  const isResponding = assignment.status === 'responding';
  
  return (
    <View style={[styles.boatCard, isResponding && styles.boatCardResponding]}>
      <View style={styles.boatHeader}>
        <View style={styles.boatInfo}>
          <Text style={styles.boatName}>{assignment.boat?.name}</Text>
          <Text style={styles.boatPosition}>
            📍 {assignment.position?.name || assignment.custom_position_name || 'No position'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>
      
      {/* Crew */}
      <View style={styles.crewSection}>
        <Text style={styles.crewLabel}>Crew:</Text>
        {assignment.crew && assignment.crew.length > 0 ? (
          assignment.crew.map((member, i) => (
            <Text key={i} style={styles.crewMember}>
              {member.role === 'driver' ? '🧑‍✈️' : '👤'} {member.name}
            </Text>
          ))
        ) : (
          <Text style={styles.noCrew}>No crew assigned</Text>
        )}
        <TouchableOpacity onPress={onAddCrew}>
          <Text style={styles.addCrewLink}>+ Add crew</Text>
        </TouchableOpacity>
      </View>
      
      {/* Actions */}
      <View style={styles.boatActions}>
        {assignment.status === 'assigned' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deployButton]}
            onPress={() => onStatusChange(assignment.id, 'deployed')}
          >
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Deploy</Text>
          </TouchableOpacity>
        )}
        
        {assignment.status === 'deployed' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.respondButton]}
              onPress={() => {
                if (incidents.length > 0) {
                  onAssignToIncident(incidents[0].id);
                } else {
                  onStatusChange(assignment.id, 'responding');
                }
              }}
            >
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Respond</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButtonOutline}
              onPress={() => onStatusChange(assignment.id, 'standby')}
            >
              <Text style={styles.actionButtonOutlineText}>Standby</Text>
            </TouchableOpacity>
          </>
        )}
        
        {(assignment.status === 'responding' || assignment.status === 'standby') && (
          <TouchableOpacity
            style={styles.actionButtonOutline}
            onPress={() => onStatusChange(assignment.id, 'deployed')}
          >
            <Text style={styles.actionButtonOutlineText}>Return to Station</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => onRadioCheck(assignment.id)}
        >
          <Ionicons name="radio-outline" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface IncidentCardProps {
  incident: SafetyIncident;
  assignments: SafetyAssignment[];
  onAssignResponder: (assignmentId: string) => void;
  onResolve: () => void;
}

function IncidentCard({ incident, assignments, onAssignResponder, onResolve }: IncidentCardProps) {
  const typeInfo = safetyBoatService.getIncidentTypeInfo(incident.incident_type);
  const severityInfo = safetyBoatService.getSeverityInfo(incident.severity);
  const [showAssign, setShowAssign] = useState(false);
  
  return (
    <View style={[styles.incidentCard, { borderLeftColor: severityInfo.color }]}>
      <View style={styles.incidentHeader}>
        <View style={styles.incidentType}>
          <Text style={styles.incidentIcon}>{typeInfo.icon}</Text>
          <View>
            <Text style={styles.incidentTitle}>
              #{incident.incident_number} {typeInfo.label}
            </Text>
            <Text style={styles.incidentTime}>
              {new Date(incident.reported_at).toLocaleTimeString()}
            </Text>
          </View>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: severityInfo.bgColor }]}>
          <Text style={[styles.severityLabel, { color: severityInfo.color }]}>
            {severityInfo.label}
          </Text>
        </View>
      </View>
      
      {incident.sail_numbers && incident.sail_numbers.length > 0 && (
        <Text style={styles.incidentBoats}>
          🚩 Boats: {incident.sail_numbers.join(', ')}
        </Text>
      )}
      
      {incident.location && (
        <Text style={styles.incidentLocation}>📍 {incident.location}</Text>
      )}
      
      <Text style={styles.incidentDescription}>{incident.description}</Text>
      
      {incident.responding_boat && (
        <View style={styles.responderInfo}>
          <Ionicons name="boat" size={16} color="#16a34a" />
          <Text style={styles.responderText}>
            {incident.responding_boat.name} responding
          </Text>
        </View>
      )}
      
      <View style={styles.incidentActions}>
        {!incident.responding_boat_id ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.assignButton]}
              onPress={() => setShowAssign(!showAssign)}
            >
              <Ionicons name="boat" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Assign Boat</Text>
            </TouchableOpacity>
            
            {showAssign && (
              <View style={styles.assignDropdown}>
                {assignments.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.assignOption}
                    onPress={() => {
                      onAssignResponder(a.id);
                      setShowAssign(false);
                    }}
                  >
                    <Text style={styles.assignOptionText}>{a.boat?.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.resolveButton]}
            onPress={onResolve}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Resolve</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  alertButton: {
    position: 'relative',
    padding: 8,
  },
  alertBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Readiness
  readinessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  readinessIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  readinessContent: {
    flex: 1,
  },
  readinessTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  readinessSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  readinessWarning: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
  readinessStats: {
    alignItems: 'center',
  },
  readinessFraction: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  readinessLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  
  // Content
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  emergencyAction: {
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  
  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyAction: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  emptyActionText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Boat Card
  boatCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  boatCardResponding: {
    borderWidth: 2,
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  boatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  boatInfo: {},
  boatName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  boatPosition: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Crew
  crewSection: {
    marginBottom: 12,
  },
  crewLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  crewMember: {
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 4,
  },
  noCrew: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  addCrewLink: {
    fontSize: 13,
    color: '#3b82f6',
    marginTop: 4,
  },
  
  // Actions
  boatActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deployButton: {
    backgroundColor: '#16a34a',
  },
  respondButton: {
    backgroundColor: '#dc2626',
  },
  assignButton: {
    backgroundColor: '#3b82f6',
  },
  resolveButton: {
    backgroundColor: '#16a34a',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  actionButtonOutline: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  actionButtonOutlineText: {
    color: '#6b7280',
    fontWeight: '500',
    fontSize: 14,
  },
  radioButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  
  // Incidents
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reportButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  incidentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  incidentType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  incidentIcon: {
    fontSize: 28,
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  incidentTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  incidentBoats: {
    fontSize: 14,
    color: '#1f2937',
    marginTop: 8,
  },
  incidentLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  incidentDescription: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    lineHeight: 20,
  },
  responderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 8,
    backgroundColor: '#dcfce7',
    borderRadius: 6,
  },
  responderText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
  incidentActions: {
    marginTop: 12,
  },
  assignDropdown: {
    marginTop: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  assignOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  assignOptionText: {
    fontSize: 14,
    color: '#1f2937',
  },
  
  // Radio Tab
  radioAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  radioAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  radioInfo: {
    flex: 1,
  },
  radioBoatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  radioChannel: {
    fontSize: 14,
    color: '#6b7280',
  },
  radioStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 12,
  },
  radioStatusText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
  radioCheckButton: {
    padding: 8,
  },
  
  // Debrief Tab
  debriefStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  debriefStat: {
    alignItems: 'center',
  },
  debriefValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
  },
  debriefLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  exportText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debriefSection: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  checklistText: {
    fontSize: 15,
    color: '#374151',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalSection: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  modalList: {
    maxHeight: 300,
  },
  selectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectItemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  
  // Type Selector
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  typeButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginRight: 10,
    minWidth: 70,
  },
  typeButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  typeIcon: {
    fontSize: 24,
  },
  typeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  
  // Severity Selector
  severitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  severityButtonActive: {
    backgroundColor: '#f9fafb',
  },
  severityText: {
    fontSize: 13,
    color: '#6b7280',
  },
  
  // Role Selector
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  roleButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  roleText: {
    fontSize: 14,
    color: '#6b7280',
  },
  roleTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  
  // Input
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  inputMulti: {
    height: 80,
    textAlignVertical: 'top',
  },
  
  // Submit
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

