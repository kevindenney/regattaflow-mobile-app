/**
 * RouteMapCard Component
 * Displays route visualization for distance/offshore races
 * Shows waypoints, gates, start/finish locations on a map
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { 
  Map, 
  Navigation, 
  Flag, 
  Anchor, 
  Circle,
  ArrowRight,
  Route,
  ChevronRight,
  Info
} from 'lucide-react-native';

export interface RouteWaypoint {
  name: string;
  latitude: number;
  longitude: number;
  type: 'start' | 'waypoint' | 'gate' | 'finish';
  required: boolean;
  passingSide?: 'port' | 'starboard' | 'either';
  notes?: string;
}

interface RouteMapCardProps {
  waypoints: RouteWaypoint[];
  totalDistanceNm?: number;
  raceName?: string;
  onWaypointPress?: (waypoint: RouteWaypoint, index: number) => void;
  expanded?: boolean;
}

export function RouteMapCard({
  waypoints,
  totalDistanceNm,
  raceName,
  onWaypointPress,
  expanded = false,
}: RouteMapCardProps) {
  // Calculate leg distances (simplified - would need proper geo calculation)
  const legs = useMemo(() => {
    const result: Array<{ from: string; to: string; estimatedNm?: number }> = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      result.push({
        from: waypoints[i].name,
        to: waypoints[i + 1].name,
      });
    }
    return result;
  }, [waypoints]);

  // Get icon for waypoint type
  const getWaypointIcon = (type: RouteWaypoint['type']) => {
    switch (type) {
      case 'start':
        return <Flag size={16} color="#10B981" />;
      case 'finish':
        return <Anchor size={16} color="#EF4444" />;
      case 'gate':
        return <Navigation size={16} color="#F59E0B" />;
      default:
        return <Circle size={14} color="#7C3AED" />;
    }
  };

  // Get passing side label
  const getPassingSideLabel = (side?: 'port' | 'starboard' | 'either') => {
    switch (side) {
      case 'port':
        return 'Leave to Port';
      case 'starboard':
        return 'Leave to Starboard';
      case 'either':
        return 'Either side';
      default:
        return null;
    }
  };

  if (waypoints.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Route size={20} color="#7C3AED" />
          <Text style={styles.title}>Race Route</Text>
        </View>
        <View style={styles.emptyState}>
          <Map size={32} color="#CBD5E1" />
          <Text style={styles.emptyText}>No route waypoints defined</Text>
          <Text style={styles.emptySubtext}>
            Add waypoints to see the race route
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Route size={20} color="#7C3AED" />
          <Text style={styles.title}>Race Route</Text>
        </View>
        {totalDistanceNm && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{totalDistanceNm} nm</Text>
          </View>
        )}
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Map size={40} color="#94A3B8" />
          <Text style={styles.mapPlaceholderText}>Interactive Map</Text>
          <Text style={styles.mapPlaceholderSubtext}>
            {waypoints.length} waypoints • {legs.length} legs
          </Text>
        </View>
      </View>

      {/* Waypoint List */}
      <View style={styles.waypointSection}>
        <Text style={styles.sectionTitle}>Route Waypoints</Text>
        
        <ScrollView 
          style={styles.waypointList}
          showsVerticalScrollIndicator={false}
        >
          {waypoints.map((waypoint, index) => (
            <Pressable
              key={`${waypoint.name}-${index}`}
              style={[
                styles.waypointItem,
                index === waypoints.length - 1 && styles.waypointItemLast,
              ]}
              onPress={() => onWaypointPress?.(waypoint, index)}
            >
              {/* Connector line */}
              {index < waypoints.length - 1 && (
                <View style={styles.connectorLine} />
              )}
              
              {/* Waypoint icon */}
              <View style={[
                styles.waypointIcon,
                waypoint.type === 'start' && styles.waypointIconStart,
                waypoint.type === 'finish' && styles.waypointIconFinish,
                waypoint.type === 'gate' && styles.waypointIconGate,
              ]}>
                {getWaypointIcon(waypoint.type)}
              </View>
              
              {/* Waypoint details */}
              <View style={styles.waypointDetails}>
                <View style={styles.waypointHeader}>
                  <Text style={styles.waypointName}>{waypoint.name}</Text>
                  <Text style={styles.waypointType}>
                    {waypoint.type.charAt(0).toUpperCase() + waypoint.type.slice(1)}
                  </Text>
                </View>
                
                {/* Coordinates */}
                <Text style={styles.waypointCoords}>
                  {waypoint.latitude.toFixed(4)}°N, {waypoint.longitude.toFixed(4)}°E
                </Text>
                
                {/* Passing side */}
                {waypoint.passingSide && (
                  <View style={styles.passingSide}>
                    <Info size={12} color="#64748B" />
                    <Text style={styles.passingSideText}>
                      {getPassingSideLabel(waypoint.passingSide)}
                    </Text>
                  </View>
                )}
                
                {/* Notes */}
                {waypoint.notes && (
                  <Text style={styles.waypointNotes}>{waypoint.notes}</Text>
                )}
              </View>
              
              <ChevronRight size={16} color="#CBD5E1" />
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Route Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Legs</Text>
          <Text style={styles.summaryValue}>{legs.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Waypoints</Text>
          <Text style={styles.summaryValue}>
            {waypoints.filter(w => w.type === 'waypoint').length}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Gates</Text>
          <Text style={styles.summaryValue}>
            {waypoints.filter(w => w.type === 'gate').length}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  distanceBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  mapContainer: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
  waypointSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  waypointList: {
    maxHeight: 300,
  },
  waypointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingLeft: 8,
    paddingRight: 4,
    position: 'relative',
  },
  waypointItemLast: {
    borderBottomWidth: 0,
  },
  connectorLine: {
    position: 'absolute',
    left: 23,
    top: 40,
    bottom: -12,
    width: 2,
    backgroundColor: '#E2E8F0',
  },
  waypointIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  waypointIconStart: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  waypointIconFinish: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  waypointIconGate: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  waypointDetails: {
    flex: 1,
  },
  waypointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  waypointName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  waypointType: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  waypointCoords: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  passingSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  passingSideText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  waypointNotes: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default RouteMapCard;

