/**
 * Add/Edit Boat Screen
 * 
 * Manage boat profiles with ratings and certificates
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import competitorService, { CompetitorBoat, OwnershipType } from '../../../services/CompetitorService';

// ============================================================================
// Main Component
// ============================================================================

export default function AddBoatScreen() {
  const { boatId } = useLocalSearchParams<{ boatId?: string }>();
  const isEditing = !!boatId;
  
  // Form state
  const [name, setName] = useState('');
  const [sailNumber, setSailNumber] = useState('');
  const [boatClass, setBoatClass] = useState('');
  const [hullNumber, setHullNumber] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [builder, setBuilder] = useState('');
  const [hullColor, setHullColor] = useState('');
  const [ownershipType, setOwnershipType] = useState<OwnershipType>('owner');
  
  // Ratings
  const [phrfRating, setPhrfRating] = useState('');
  const [phrfCertNumber, setPhrfCertNumber] = useState('');
  const [ircRating, setIrcRating] = useState('');
  const [ircCertNumber, setIrcCertNumber] = useState('');
  const [orcRating, setOrcRating] = useState('');
  const [orcCertNumber, setOrcCertNumber] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [showRatings, setShowRatings] = useState(false);
  
  // ==========================================================================
  // Actions
  // ==========================================================================
  
  const handleSave = async () => {
    if (!name.trim() || !sailNumber.trim() || !boatClass.trim()) {
      Alert.alert('Required Fields', 'Please fill in boat name, sail number, and class');
      return;
    }
    
    setSaving(true);
    
    try {
      const boatData: Partial<CompetitorBoat> = {
        name: name.trim(),
        sail_number: sailNumber.trim().toUpperCase(),
        boat_class: boatClass.trim(),
        hull_number: hullNumber.trim() || undefined,
        year_built: yearBuilt ? parseInt(yearBuilt) : undefined,
        builder: builder.trim() || undefined,
        hull_color: hullColor.trim() || undefined,
        ownership_type: ownershipType,
        phrf_rating: phrfRating ? parseInt(phrfRating) : undefined,
        phrf_certificate_number: phrfCertNumber.trim() || undefined,
        irc_rating: ircRating ? parseFloat(ircRating) : undefined,
        irc_certificate_number: ircCertNumber.trim() || undefined,
        orc_rating: orcRating ? parseFloat(orcRating) : undefined,
        orc_certificate_number: orcCertNumber.trim() || undefined,
      };
      
      if (isEditing && boatId) {
        await competitorService.updateBoat(boatId, boatData);
      } else {
        await competitorService.addBoat(boatData);
      }
      
      router.back();
    } catch (error) {
      console.error('Error saving boat:', error);
      Alert.alert('Error', 'Failed to save boat');
    } finally {
      setSaving(false);
    }
  };
  
  // ==========================================================================
  // Render
  // ==========================================================================
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Boat' : 'Add Boat'}
          </Text>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Boat Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Boat Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sea Breeze"
                value={name}
                onChangeText={setName}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sail Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., USA 12345"
                value={sailNumber}
                onChangeText={setSailNumber}
                autoCapitalize="characters"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Boat Class *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., J/70, Laser, 420"
                value={boatClass}
                onChangeText={setBoatClass}
              />
            </View>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Hull Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 123"
                  value={hullNumber}
                  onChangeText={setHullNumber}
                />
              </View>
              
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Year Built</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2020"
                  value={yearBuilt}
                  onChangeText={setYearBuilt}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Builder</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., J/Boats"
                  value={builder}
                  onChangeText={setBuilder}
                />
              </View>
              
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Hull Color</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., White"
                  value={hullColor}
                  onChangeText={setHullColor}
                />
              </View>
            </View>
          </View>
          
          {/* Ownership */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ownership</Text>
            
            <View style={styles.ownershipOptions}>
              {[
                { type: 'owner', label: '👤 Owner', desc: 'I own this boat' },
                { type: 'co_owner', label: '👥 Co-owner', desc: 'I co-own this boat' },
                { type: 'charter', label: '📋 Charter', desc: 'I regularly charter' },
                { type: 'crew', label: '⛵ Crew', desc: 'I crew on this boat' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.ownershipOption,
                    ownershipType === option.type && styles.ownershipOptionActive,
                  ]}
                  onPress={() => setOwnershipType(option.type as OwnershipType)}
                >
                  <Text style={styles.ownershipLabel}>{option.label}</Text>
                  <Text style={styles.ownershipDesc}>{option.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Ratings Section */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setShowRatings(!showRatings)}
            >
              <Text style={styles.sectionTitle}>Handicap Ratings</Text>
              <Ionicons 
                name={showRatings ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#6b7280" 
              />
            </TouchableOpacity>
            
            {showRatings && (
              <>
                {/* PHRF */}
                <View style={styles.ratingSection}>
                  <Text style={styles.ratingTitle}>PHRF</Text>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Rating</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., 108"
                        value={phrfRating}
                        onChangeText={setPhrfRating}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Certificate #</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Optional"
                        value={phrfCertNumber}
                        onChangeText={setPhrfCertNumber}
                      />
                    </View>
                  </View>
                </View>
                
                {/* IRC */}
                <View style={styles.ratingSection}>
                  <Text style={styles.ratingTitle}>IRC</Text>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>TCC</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., 1.025"
                        value={ircRating}
                        onChangeText={setIrcRating}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Certificate #</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Optional"
                        value={ircCertNumber}
                        onChangeText={setIrcCertNumber}
                      />
                    </View>
                  </View>
                </View>
                
                {/* ORC */}
                <View style={styles.ratingSection}>
                  <Text style={styles.ratingTitle}>ORC</Text>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Rating</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., 1.050"
                        value={orcRating}
                        onChangeText={setOrcRating}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Certificate #</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Optional"
                        value={orcCertNumber}
                        onChangeText={setOrcCertNumber}
                      />
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
          
          {/* Spacer */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Content
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Section
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  
  // Input
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  
  // Ownership
  ownershipOptions: {
    gap: 10,
  },
  ownershipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  ownershipOptionActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  ownershipLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  ownershipDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  
  // Ratings
  ratingSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
});

