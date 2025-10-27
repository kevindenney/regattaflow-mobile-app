import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';

interface FacilitiesListProps {
  facilities: string[];
}

const facilityIcons: { [key: string]: string } = {
  marina: '⚓',
  clubhouse: '🏛️',
  restaurant: '🍽️',
  bar: '🍺',
  showers: '🚿',
  lockers: '🗄️',
  parking: '🅿️',
  storage: '📦',
  workshop: '🔧',
  fuel: '⛽',
  wifi: '📶',
  pool: '🏊',
  gym: '💪',
  sauna: '🧖',
  laundry: '👕',
  chandlery: '🛒',
  training: '📚',
  racing: '🏁',
};

const getIcon = (facility: string): string => {
  const normalized = facility.toLowerCase().trim();
  for (const [key, icon] of Object.entries(facilityIcons)) {
    if (normalized.includes(key)) {
      return icon;
    }
  }
  return '🔷'; // Default icon
};

export default function FacilitiesList({ facilities }: FacilitiesListProps) {
  if (!facilities || facilities.length === 0) {
    return (
      <Text style={styles.emptyText}>No facilities information available</Text>
    );
  }

  return (
    <View style={styles.container}>
      {facilities.map((facility, index) => (
        <View key={index} style={styles.facilityRow}>
          <Text style={styles.icon}>{getIcon(facility)}</Text>
          <Text style={styles.facilityText}>{facility}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  facilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  facilityText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
