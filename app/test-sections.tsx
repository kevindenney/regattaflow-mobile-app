/**
 * Test Page for CollapsibleSection Component
 *
 * This page demonstrates and tests the CollapsibleSection component
 * before integrating it into the main races.tsx file.
 *
 * To access: Navigate to /test-sections in the app
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Wind, Map, Settings, Users, FileText, Trophy } from 'lucide-react-native';
import { CollapsibleSection } from '@/components/races/plan';

export default function TestSectionsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Collapsible Sections Test',
          headerStyle: { backgroundColor: '#2563EB' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Test Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>🧪 Testing Collapsible Sections</Text>
          <Text style={styles.instructionsText}>
            This page tests the CollapsibleSection component before integration.
          </Text>
          <Text style={styles.instructionsText}>
            • Tap section headers to expand/collapse
          </Text>
          <Text style={styles.instructionsText}>
            • State persists across app restarts
          </Text>
          <Text style={styles.instructionsText}>
            • Priority 3-4 expanded by default
          </Text>
          <Text style={styles.instructionsText}>
            • Priority 5-8 collapsed by default
          </Text>
        </View>

        {/* Priority 1: Always Visible (No Section) */}
        <View style={styles.alwaysVisibleCard}>
          <Text style={styles.alwaysVisibleTitle}>⚡ Quick Actions</Text>
          <Text style={styles.alwaysVisibleText}>
            Priority 1-2 content stays always visible (no collapsing)
          </Text>
          <View style={styles.mockButtons}>
            <View style={styles.mockButton}>
              <Text style={styles.mockButtonText}>Edit Race</Text>
            </View>
            <View style={styles.mockButton}>
              <Text style={styles.mockButtonText}>Delete Race</Text>
            </View>
          </View>
        </View>

        {/* Priority 3: Conditions & Environment */}
        <CollapsibleSection
          id="test-conditions"
          title="Conditions & Environment"
          icon={<Wind size={20} color="#3B82F6" />}
          badge="3 plans"
          badgeVariant="info"
          priority={3}
        >
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>🌬️ Wind & Weather</Text>
            <Text style={styles.mockCardText}>
              15-18kt NE • Partly Cloudy • 24°C
            </Text>
          </View>
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>🌊 Tide & Current</Text>
            <Text style={styles.mockCardText}>
              Flooding +2.1m • Peak at 14:30
            </Text>
          </View>
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>⚠️ Contingency Plans</Text>
            <Text style={styles.mockCardText}>
              3 plans ready • Shift delays, postponement, course changes
            </Text>
          </View>
        </CollapsibleSection>

        {/* Priority 4: Course & Strategy */}
        <CollapsibleSection
          id="test-course-strategy"
          title="Course & Strategy"
          icon={<Map size={20} color="#10B981" />}
          priority={4}
        >
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>🗺️ Tactical Map</Text>
            <Text style={styles.mockCardText}>
              Olympic Triangle • Windward/Leeward
            </Text>
            <View style={styles.mockMap}>
              <Text style={styles.mockMapText}>📍 Map renders here</Text>
            </View>
          </View>
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>💡 AI Venue Insights</Text>
            <Text style={styles.mockCardText}>
              Current typically stronger on eastern shore...
            </Text>
          </View>
        </CollapsibleSection>

        {/* Priority 5: Boat Setup */}
        <CollapsibleSection
          id="test-boat-setup"
          title="Boat Setup"
          icon={<Settings size={20} color="#8B5CF6" />}
          priority={5}
        >
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>⚙️ Rig Tuning</Text>
            <Text style={styles.mockCardText}>
              Band C recommended for 15-18kt
            </Text>
            <Text style={styles.mockCardDetail}>
              • Prebend: 15mm
            </Text>
            <Text style={styles.mockCardDetail}>
              • Mast ram: Medium
            </Text>
            <Text style={styles.mockCardDetail}>
              • Jib halyard: 6.5
            </Text>
          </View>
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>🔧 Rig Planner</Text>
            <Text style={styles.mockCardText}>
              Current setup: Band C • Notes: Check shroud tension
            </Text>
          </View>
        </CollapsibleSection>

        {/* Priority 6: Team & Logistics */}
        <CollapsibleSection
          id="test-team-logistics"
          title="Team & Logistics"
          icon={<Users size={20} color="#F59E0B" />}
          badge="15 items"
          badgeVariant="default"
          priority={6}
        >
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>👥 Crew & Equipment</Text>
            <Text style={styles.mockCardText}>
              2 crew confirmed • All equipment packed
            </Text>
          </View>
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>⛵ Fleet Racers</Text>
            <Text style={styles.mockCardText}>
              12 boats registered • 3 from your club
            </Text>
          </View>
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>📄 Race Documents</Text>
            <Text style={styles.mockCardText}>
              3 documents • NoR, SIs, Course diagram
            </Text>
          </View>
        </CollapsibleSection>

        {/* Priority 7: Regulatory & Rules */}
        <CollapsibleSection
          id="test-regulatory"
          title="Regulatory & Rules"
          icon={<FileText size={20} color="#6366F1" />}
          badge="2/5 ack'd"
          badgeVariant="warning"
          priority={7}
        >
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>✅ Regulatory Digest</Text>
            <Text style={styles.mockCardText}>
              5 important items • 2 acknowledged
            </Text>
            <Text style={styles.mockCardDetail}>
              ⚠️ Black flag rule in effect
            </Text>
            <Text style={styles.mockCardDetail}>
              ⚠️ Mark rounding procedures modified
            </Text>
          </View>
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>📐 Course Outline</Text>
            <Text style={styles.mockCardText}>
              Olympic Triangle • 3 laps • Approx 60min
            </Text>
          </View>
        </CollapsibleSection>

        {/* Priority 8: Post-Race Analysis */}
        <CollapsibleSection
          id="test-post-race"
          title="Post-Race Analysis"
          icon={<Trophy size={20} color="#EF4444" />}
          badge="Available"
          badgeVariant="success"
          priority={8}
        >
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>🏆 Performance Review</Text>
            <Text style={styles.mockCardText}>
              Position: 3rd of 12 • Time: 58:42
            </Text>
          </View>
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>📊 GPS Track Replay</Text>
            <Text style={styles.mockCardText}>
              Track recorded • Ready for analysis
            </Text>
          </View>
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>💬 AI Coaching Feedback</Text>
            <Text style={styles.mockCardText}>
              Strong start, but lost ground on first downwind leg...
            </Text>
          </View>
        </CollapsibleSection>

        {/* Test Force-Expanded Section */}
        <View style={styles.testSection}>
          <Text style={styles.testSectionTitle}>🧪 Force-Expanded Test</Text>
          <Text style={styles.testSectionText}>
            This section is force-expanded (cannot be collapsed):
          </Text>
        </View>

        <CollapsibleSection
          id="test-force-expanded"
          title="Force-Expanded Section"
          icon={<Trophy size={20} color="#EF4444" />}
          badge="Cannot collapse"
          badgeVariant="info"
          priority={8}
          forceExpanded={true}
        >
          <View style={styles.mockCard}>
            <Text style={styles.mockCardTitle}>🔒 Always Visible</Text>
            <Text style={styles.mockCardText}>
              This content is always expanded, simulating post-race completion.
              Try tapping the header - it won't collapse!
            </Text>
          </View>
        </CollapsibleSection>

        {/* Testing Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>📝 Testing Notes</Text>
          <Text style={styles.notesText}>
            1. Check smooth animation when expanding/collapsing
          </Text>
          <Text style={styles.notesText}>
            2. Close and reopen the app - states should persist
          </Text>
          <Text style={styles.notesText}>
            3. Verify badge colors: info (blue), success (green), warning (yellow)
          </Text>
          <Text style={styles.notesText}>
            4. Test force-expanded section cannot be collapsed
          </Text>
          <Text style={styles.notesText}>
            5. Verify accessibility labels work with screen readers
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  instructionsCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3730A3',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#4C1D95',
    marginBottom: 4,
    lineHeight: 20,
  },
  alwaysVisibleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  alwaysVisibleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  alwaysVisibleText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  mockButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mockButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  mockButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  mockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  mockCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  mockCardText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  mockCardDetail: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    marginLeft: 8,
  },
  mockMap: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 40,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  mockMapText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  testSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  testSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  testSectionText: {
    fontSize: 14,
    color: '#92400E',
  },
  notesCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 4,
    lineHeight: 20,
  },
});
