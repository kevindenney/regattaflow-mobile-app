/**
 * TufteDistanceFields Component
 *
 * Distance racing specific fields.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Switch, StyleSheet, Platform, Pressable, Modal, SafeAreaView } from 'react-native';
import { MapPin, X, Route, Check } from 'lucide-react-native';
import { TufteFieldRow } from './TufteFieldRow';
import { TufteSectionLabel } from './TufteSectionLabel';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from './tufteFormStyles';
import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';
import type { DistanceRaceData } from './DistanceRaceFields';
import type { RouteWaypoint } from '@/types/raceEvents';

// Dynamically import DistanceRouteMap (web only)
let DistanceRouteMap: any = null;
if (Platform.OS === 'web') {
  DistanceRouteMap = require('../DistanceRouteMap').DistanceRouteMap;
}

export interface TufteDistanceFieldsProps {
  /** Distance race data */
  data: DistanceRaceData;
  /** Update handler */
  onChange: (data: DistanceRaceData) => void;
  /** Fields that were populated by AI */
  aiExtractedFields?: Set<string>;
}

export function TufteDistanceFields({
  data,
  onChange,
  aiExtractedFields = new Set(),
}: TufteDistanceFieldsProps) {
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [tempWaypoints, setTempWaypoints] = useState<RouteWaypoint[]>([]);

  const handleChange = (field: keyof DistanceRaceData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  const handleOpenRouteMap = useCallback(() => {
    // Initialize with existing waypoints if any
    setTempWaypoints(data.routeWaypoints || []);
    setShowRouteMap(true);
  }, [data.routeWaypoints]);

  const handleSaveWaypoints = useCallback(() => {
    onChange({
      ...data,
      routeWaypoints: tempWaypoints,
    });
    setShowRouteMap(false);
  }, [data, tempWaypoints, onChange]);

  const handleTotalDistanceChange = useCallback((distance: number) => {
    // Auto-update total distance when waypoints change
    onChange({
      ...data,
      totalDistanceNm: distance.toString(),
    });
  }, [data, onChange]);

  const waypointCount = data.routeWaypoints?.length || 0;

  return (
    <View>
      <TufteSectionLabel>DISTANCE DETAILS</TufteSectionLabel>

      <View style={styles.row}>
        <TufteFieldRow
          label="Total distance"
          value={data.totalDistanceNm || ''}
          onChangeText={(v) => handleChange('totalDistanceNm', v)}
          placeholder="e.g., 26"
          keyboardType="decimal-pad"
          halfWidth
          suffix="nm"
          aiExtracted={aiExtractedFields.has('distance.totalDistanceNm')}
        />
        <TufteFieldRow
          label="Time limit"
          value={data.timeLimitHours || ''}
          onChangeText={(v) => handleChange('timeLimitHours', v)}
          placeholder="e.g., 9"
          keyboardType="decimal-pad"
          halfWidth
          suffix="hrs"
          aiExtracted={aiExtractedFields.has('distance.timeLimitHours')}
        />
      </View>

      {/* Plot Route Button */}
      {Platform.OS === 'web' && DistanceRouteMap ? (
        <Pressable style={styles.plotRouteButton} onPress={handleOpenRouteMap}>
          <Route size={20} color={IOS_COLORS.blue} />
          <View style={styles.plotRouteTextContainer}>
            <Text style={styles.plotRouteLabel}>Route waypoints</Text>
            <Text style={styles.plotRouteValue}>
              {waypointCount > 0 ? `${waypointCount} waypoint${waypointCount !== 1 ? 's' : ''} plotted` : 'Tap to plot on map'}
            </Text>
          </View>
          <Text style={styles.plotRouteAction}>Edit</Text>
        </Pressable>
      ) : (
        <View style={styles.nativeNotice}>
          <MapPin size={16} color={TUFTE_FORM_COLORS.secondaryLabel} />
          <Text style={styles.nativeNoticeText}>
            Route plotting available on web. Add waypoints after creating the race.
          </Text>
        </View>
      )}

      <TufteFieldRow
        label="Route description"
        value={data.routeDescription || ''}
        onChangeText={(v) => handleChange('routeDescription', v)}
        placeholder="e.g., Start → Green Island → Waglan → Finish"
        multiline
        aiExtracted={aiExtractedFields.has('distance.routeDescription')}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Start and finish at same location</Text>
        <Switch
          value={data.startFinishSameLocation ?? false}
          onValueChange={(v) => handleChange('startFinishSameLocation', v)}
          trackColor={{ false: IOS_COLORS.gray5, true: IOS_COLORS.blue }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Route Map Modal (Web only) */}
      {Platform.OS === 'web' && DistanceRouteMap && (
        <Modal
          visible={showRouteMap}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowRouteMap(false)}
        >
          <SafeAreaView style={styles.mapModalContainer}>
            <View style={styles.mapModalHeader}>
              <Pressable style={styles.mapModalButton} onPress={() => setShowRouteMap(false)}>
                <X size={24} color={IOS_COLORS.gray} />
              </Pressable>
              <Text style={styles.mapModalTitle}>Plot Route</Text>
              <Pressable
                style={[styles.mapModalButton, styles.mapModalSaveButton]}
                onPress={handleSaveWaypoints}
              >
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.mapModalSaveText}>Save</Text>
              </Pressable>
            </View>
            <View style={styles.mapContainer}>
              <DistanceRouteMap
                waypoints={tempWaypoints}
                onWaypointsChange={setTempWaypoints}
                onTotalDistanceChange={handleTotalDistanceChange}
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: TUFTE_FORM_SPACING.sm,
    marginBottom: TUFTE_FORM_SPACING.md,
  },
  switchLabel: {
    fontSize: 15,
    color: TUFTE_FORM_COLORS.label,
  },
  // Plot Route Button styles
  plotRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: TUFTE_FORM_COLORS.separator,
    gap: 12,
  },
  plotRouteTextContainer: {
    flex: 1,
  },
  plotRouteLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.secondaryLabel,
    marginBottom: 2,
  },
  plotRouteValue: {
    fontSize: 15,
    color: TUFTE_FORM_COLORS.label,
  },
  plotRouteAction: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  nativeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: TUFTE_FORM_COLORS.tertiaryBackground,
    borderRadius: 8,
    marginBottom: 12,
  },
  nativeNoticeText: {
    flex: 1,
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  // Route Map Modal styles
  mapModalContainer: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
  },
  mapModalButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.label,
  },
  mapModalSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    width: 'auto',
  },
  mapModalSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
  },
});

export default TufteDistanceFields;
