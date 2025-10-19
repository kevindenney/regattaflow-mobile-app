/**
 * Component Template - Use this as a starting point for new components
 *
 * This template demonstrates RegattaFlow component conventions:
 * - TypeScript interfaces with JSDoc
 * - Proper import order
 * - StyleSheet organization
 * - Semantic naming
 *
 * To use: Copy this file, rename, and modify for your component
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * ComponentName - Brief description of what this component does
 *
 * @param item - The data object to display
 * @param onPress - Handler called when component is pressed
 * @param onAction - Optional handler for secondary action
 */
interface ComponentNameProps {
  item: {
    id: string;
    title: string;
    subtitle?: string;
    status?: 'active' | 'inactive' | 'pending';
  };
  onPress: () => void;
  onAction?: (id: string) => void;
}

export function ComponentName({ item, onPress, onAction }: ComponentNameProps) {
  // Status color mapping
  const statusColors = {
    active: '#10B981',
    inactive: '#94A3B8',
    pending: '#F59E0B',
  };

  const status = item.status || 'inactive';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="bookmark" size={24} color="#3B82F6" />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          )}
        </View>

        {/* Status Indicator */}
        <View
          style={[
            styles.statusDot,
            { backgroundColor: statusColors[status] }
          ]}
        />
      </View>

      {/* Action Section (if onAction provided) */}
      {onAction && (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation(); // Prevent parent onPress
              onAction(item.id);
            }}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Action</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Elevation (Android)
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#EFF6FF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  actions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
