/**
 * Venue Intelligence Test Route
 * Test page for Global Venue Intelligence integration
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { GlobalVenueIntelligence } from '@/components/venue/GlobalVenueIntelligence';

export default function VenueTestScreen() {
  console.log('🌍 VenueTest Route: Loading venue intelligence test');

  const [selectedVenue, setSelectedVenue] = React.useState<any>(null);

  const handleVenueSelected = (venue: any) => {
    console.log('🌍 Venue selected:', venue.name);
    setSelectedVenue(venue);
  };

  // Auto-select Hong Kong for testing
  React.useEffect(() => {
    // Simulate venue selection after component loads
    const testVenue = {
      id: 'hong-kong-victoria-harbor',
      name: 'Hong Kong - Victoria Harbor',
      coordinates: [114.1694, 22.3193],
      country: 'Hong Kong SAR',
      region: 'asia-pacific',
      venueType: 'premier'
    };

    setTimeout(() => {
      console.log('🌍 Auto-selecting test venue:', testVenue.name);
      setSelectedVenue(testVenue);
    }, 2000); // Wait 2 seconds to show the loading state
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Global Venue Intelligence Test',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🌍 Global Venue Intelligence Test</Text>
          <Text style={styles.subtitle}>Testing the "OnX Maps for Sailing" system</Text>
          {selectedVenue && (
            <Text style={styles.selectedVenue}>Selected: {selectedVenue.name}</Text>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <GlobalVenueIntelligence
            onVenueSelected={handleVenueSelected}
            showNearbyVenues={true}
            showCulturalBriefing={true}
            currentLocation={[114.1694, 22.3193]} // Hong Kong coordinates for testing
          />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  selectedVenue: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
});