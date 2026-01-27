/**
 * ExtractedDetailsSummary Component
 *
 * Collapsible section showing all extracted details from AI analysis.
 * Supports inline editing of all fields with onChange callback.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Users,
  AlertTriangle,
  DollarSign,
  Trophy,
  Radio,
  Ship,
  FileText,
  MapPin,
  Navigation,
  Waves,
  Clock,
  Shield,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from './tufteFormStyles';
import { IOS_COLORS } from '@/components/cards/constants';

// Type definitions
interface ScheduleEvent {
  date: string;
  time: string;
  event: string;
  location?: string;
  mandatory?: boolean;
}

interface ProhibitedArea {
  name: string;
  description?: string;
  coordinates?: Array<{ lat: number; lng: number }>;
}

interface EntryFee {
  type: string;
  amount: string;
  deadline?: string;
}

interface VHFChannel {
  channel: string;
  purpose?: string;
}

interface RouteWaypoint {
  name: string;
  latitude?: number;
  longitude?: number;
  type?: string;
  notes?: string;
}

interface TideGate {
  location: string;
  optimalTime?: string;
  notes?: string;
}

export interface ExtractedDetailsData {
  // Schedule
  schedule?: ScheduleEvent[];

  // Crew
  minimumCrew?: number;
  crewRequirements?: string;
  minorSailorRules?: string;

  // Areas
  prohibitedAreas?: ProhibitedArea[];
  startAreaName?: string;
  startAreaDescription?: string;
  startAreaCoordinates?: { lat: number; lng: number };
  finishAreaName?: string;
  finishAreaDescription?: string;
  finishAreaCoordinates?: { lat: number; lng: number };

  // Route (for distance races)
  routeWaypoints?: RouteWaypoint[];
  trafficSeparationSchemes?: string[];
  tideGates?: TideGate[];

  // Entry
  entryFees?: EntryFee[];
  entryDeadline?: string;
  entryFormUrl?: string;

  // Scoring
  scoringFormulaDescription?: string;
  handicapSystem?: string[];

  // Motoring
  motoringDivisionAvailable?: boolean;
  motoringDivisionRules?: string;

  // Communications
  vhfChannels?: VHFChannel[];

  // Organization
  organizingAuthority?: string;
  eventWebsite?: string;
  contactEmail?: string;

  // Safety
  safetyRequirements?: string;
  retirementNotification?: string;
  insuranceRequirements?: string;
  classRules?: string[];
  eligibilityRequirements?: string;

  // Weather
  expectedConditions?: string;
  expectedWindDirection?: string;
  expectedWindSpeedMin?: number;
  expectedWindSpeedMax?: number;

  // Prizes
  prizesDescription?: string;
}

export interface ExtractedDetailsSummaryProps {
  /** Extracted data from AI */
  data: ExtractedDetailsData | null;
  /** Whether the section is expanded */
  expanded?: boolean;
  /** Callback when data changes (for editable mode) */
  onChange?: (data: ExtractedDetailsData) => void;
}

export function ExtractedDetailsSummary({
  data,
  expanded: initialExpanded = false,
  onChange,
}: ExtractedDetailsSummaryProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const isEditable = !!onChange;

  // Defensive check: warn if we receive wrapper format (should be unwrapped in TufteAddRaceForm)
  if (data && (data as any).races) {
    console.warn('[ExtractedDetailsSummary] Received wrapper object - data should be unwrapped to races[0]');
  }

  // Only show if there's data (don't show empty sections even in editable mode)
  if (!data) {
    return null;
  }

  // Ensure we have a data object to work with
  const safeData = data || {};

  // Count how many detail categories have data (for the badge)
  const detailCount = [
    safeData.schedule?.length,
    safeData.minimumCrew || safeData.crewRequirements,
    safeData.prohibitedAreas?.length,
    safeData.routeWaypoints?.length,
    safeData.entryFees?.length,
    safeData.scoringFormulaDescription,
    safeData.motoringDivisionAvailable,
    safeData.vhfChannels?.length,
    safeData.classRules?.length,
    safeData.safetyRequirements,
    safeData.expectedConditions,
    safeData.tideGates?.length,
  ].filter(Boolean).length;

  // In read-only mode with no data, hide
  if (detailCount === 0 && !isEditable) {
    return null;
  }

  // Total possible field categories (for showing extraction coverage)
  const totalCategories = 12;

  // Update helper
  const updateField = <K extends keyof ExtractedDetailsData>(
    field: K,
    value: ExtractedDetailsData[K]
  ) => {
    if (onChange) {
      onChange({ ...data, [field]: value });
    }
  };

  // Array update helpers
  const updateArrayItem = <T,>(
    field: keyof ExtractedDetailsData,
    index: number,
    itemUpdates: Partial<T>
  ) => {
    const array = data[field] as T[] | undefined;
    if (!array || !onChange) return;
    const updated = [...array];
    updated[index] = { ...updated[index], ...itemUpdates };
    onChange({ ...data, [field]: updated });
  };

  const removeArrayItem = (field: keyof ExtractedDetailsData, index: number) => {
    const array = data[field] as any[] | undefined;
    if (!array || !onChange) return;
    const updated = array.filter((_, i) => i !== index);
    onChange({ ...data, [field]: updated });
  };

  const addArrayItem = <T,>(field: keyof ExtractedDetailsData, newItem: T) => {
    const array = (data[field] as T[] | undefined) || [];
    if (!onChange) return;
    onChange({ ...data, [field]: [...array, newItem] });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerLeft}>
          <FileText size={16} color={IOS_COLORS.blue} />
          <Text style={styles.headerLabel}>
            {isEditable ? 'RACE DETAILS' : 'EXTRACTED DETAILS'}
          </Text>
          {isEditable && (
            <Pencil size={12} color={TUFTE_FORM_COLORS.secondaryLabel} />
          )}
          <View style={[styles.badge, detailCount === 0 && styles.badgeEmpty]}>
            <Text style={styles.badgeText}>
              {isEditable ? `${detailCount}/${totalCategories}` : detailCount}
            </Text>
          </View>
        </View>
        {expanded ? (
          <ChevronDown size={20} color={TUFTE_FORM_COLORS.secondaryLabel} />
        ) : (
          <ChevronRight size={20} color={TUFTE_FORM_COLORS.secondaryLabel} />
        )}
      </Pressable>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.content}>
          {/* Schedule */}
          {safeData.schedule?.length > 0 && (
            <DetailSection
              icon={<Calendar size={16} color={IOS_COLORS.orange} />}
              title="Schedule"
              onAdd={isEditable ? () => addArrayItem('schedule', { date: '', time: '', event: '' }) : undefined}
            >
              {(safeData.schedule || []).map((event, i) => (
                <View key={i} style={styles.scheduleItem}>
                  {isEditable ? (
                    <>
                      <View style={styles.inlineRow}>
                        <EditableText
                          value={event.date}
                          onChange={(v) => updateArrayItem<ScheduleEvent>('schedule', i, { date: v })}
                          placeholder="Date"
                          style={styles.scheduleDate}
                        />
                        <EditableText
                          value={event.time}
                          onChange={(v) => updateArrayItem<ScheduleEvent>('schedule', i, { time: v })}
                          placeholder="Time"
                          style={styles.scheduleDate}
                        />
                        <Pressable onPress={() => removeArrayItem('schedule', i)}>
                          <Trash2 size={14} color={IOS_COLORS.red} />
                        </Pressable>
                      </View>
                      <EditableText
                        value={event.event}
                        onChange={(v) => updateArrayItem<ScheduleEvent>('schedule', i, { event: v })}
                        placeholder="Event description"
                        style={styles.scheduleEvent}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.scheduleDate}>
                        {event.date} {event.time}
                      </Text>
                      <Text style={styles.scheduleEvent}>
                        {event.event}
                        {event.mandatory && (
                          <Text style={styles.mandatory}> [MANDATORY]</Text>
                        )}
                      </Text>
                      {event.location && (
                        <Text style={styles.scheduleLocation}>{event.location}</Text>
                      )}
                    </>
                  )}
                </View>
              ))}
            </DetailSection>
          )}

          {/* Route Waypoints - for distance races */}
          {safeData.routeWaypoints?.length > 0 && (
            <DetailSection
              icon={<Navigation size={16} color={IOS_COLORS.blue} />}
              title={`Route Waypoints${safeData.routeWaypoints?.length ? ` (${safeData.routeWaypoints.length})` : ''}`}
              onAdd={isEditable ? () => addArrayItem('routeWaypoints', { name: '' }) : undefined}
            >
              {(safeData.routeWaypoints || []).map((wp, i) => (
                <View key={i} style={styles.waypointItem}>
                  {isEditable ? (
                    <View style={styles.inlineRow}>
                      <Text style={styles.waypointNumber}>{i + 1}.</Text>
                      <EditableText
                        value={wp.name}
                        onChange={(v) => updateArrayItem<RouteWaypoint>('routeWaypoints', i, { name: v })}
                        placeholder="Waypoint name"
                        style={styles.waypointName}
                      />
                      <Pressable onPress={() => removeArrayItem('routeWaypoints', i)}>
                        <Trash2 size={14} color={IOS_COLORS.red} />
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.listItem}>
                      {i + 1}. {wp.name}
                      {wp.type && <Text style={styles.listItemNote}> ({wp.type})</Text>}
                    </Text>
                  )}
                </View>
              ))}
            </DetailSection>
          )}

          {/* VHF Channels */}
          {safeData.vhfChannels?.length > 0 && (
            <DetailSection
              icon={<Radio size={16} color={IOS_COLORS.teal} />}
              title="VHF Channels"
              onAdd={isEditable ? () => addArrayItem('vhfChannels', { channel: '' }) : undefined}
            >
              {(safeData.vhfChannels || []).map((ch, i) => (
                <View key={i} style={styles.inlineRow}>
                  {isEditable ? (
                    <>
                      <Text style={styles.channelLabel}>Ch</Text>
                      <EditableText
                        value={ch.channel}
                        onChange={(v) => updateArrayItem<VHFChannel>('vhfChannels', i, { channel: v })}
                        placeholder="##"
                        style={[styles.channelNumber, { width: 40 }]}
                      />
                      <EditableText
                        value={ch.purpose || ''}
                        onChange={(v) => updateArrayItem<VHFChannel>('vhfChannels', i, { purpose: v })}
                        placeholder="Purpose"
                        style={styles.channelPurpose}
                      />
                      <Pressable onPress={() => removeArrayItem('vhfChannels', i)}>
                        <Trash2 size={14} color={IOS_COLORS.red} />
                      </Pressable>
                    </>
                  ) : (
                    <Text style={styles.detailText}>
                      Ch {ch.channel}
                      {ch.purpose && <Text style={styles.listItemNote}> - {ch.purpose}</Text>}
                    </Text>
                  )}
                </View>
              ))}
            </DetailSection>
          )}

          {/* Crew Requirements */}
          {(safeData.minimumCrew || safeData.crewRequirements || safeData.minorSailorRules) && (
            <DetailSection
              icon={<Users size={16} color={IOS_COLORS.purple} />}
              title="Crew Requirements"
            >
              {safeData.minimumCrew !== undefined && (
                <View style={styles.inlineRow}>
                  <Text style={styles.fieldLabel}>Minimum crew:</Text>
                  {isEditable ? (
                    <EditableText
                      value={safeData.minimumCrew?.toString() || ''}
                      onChange={(v) => updateField('minimumCrew', v ? parseInt(v, 10) : undefined)}
                      placeholder="0"
                      style={styles.highlight}
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.highlight}>{safeData.minimumCrew}</Text>
                  )}
                </View>
              )}
              {safeData.crewRequirements && (
                isEditable ? (
                  <EditableText
                    value={safeData.crewRequirements || ''}
                    onChange={(v) => updateField('crewRequirements', v)}
                    placeholder="Crew requirements..."
                    style={styles.detailText}
                    multiline
                  />
                ) : (
                  <Text style={styles.detailText}>{safeData.crewRequirements}</Text>
                )
              )}
              {safeData.minorSailorRules && (
                <Text style={styles.detailTextSecondary}>Under 18: {safeData.minorSailorRules}</Text>
              )}
            </DetailSection>
          )}

          {/* Prohibited Areas */}
          {safeData.prohibitedAreas?.length > 0 && (
            <DetailSection
              icon={<AlertTriangle size={16} color={IOS_COLORS.red} />}
              title={`Prohibited Areas${safeData.prohibitedAreas?.length ? ` (${safeData.prohibitedAreas.length})` : ''}`}
              onAdd={isEditable ? () => addArrayItem('prohibitedAreas', { name: '' }) : undefined}
            >
              {(safeData.prohibitedAreas || []).map((area, i) => (
                <View key={i} style={styles.inlineRow}>
                  {isEditable ? (
                    <>
                      <Text style={styles.bulletPoint}>•</Text>
                      <EditableText
                        value={area.name}
                        onChange={(v) => updateArrayItem<ProhibitedArea>('prohibitedAreas', i, { name: v })}
                        placeholder="Area name"
                        style={styles.listItemEditable}
                      />
                      <Pressable onPress={() => removeArrayItem('prohibitedAreas', i)}>
                        <Trash2 size={14} color={IOS_COLORS.red} />
                      </Pressable>
                    </>
                  ) : (
                    <Text style={styles.listItem}>
                      • {area.name}
                      {area.description && area.description !== 'Out of bounds' && (
                        <Text style={styles.listItemNote}> ({area.description})</Text>
                      )}
                    </Text>
                  )}
                </View>
              ))}
            </DetailSection>
          )}

          {/* Tide Gates */}
          {safeData.tideGates?.length > 0 && (
            <DetailSection
              icon={<Waves size={16} color={IOS_COLORS.blue} />}
              title="Tide Gates"
              onAdd={isEditable ? () => addArrayItem('tideGates', { location: '' }) : undefined}
            >
              {(safeData.tideGates || []).map((gate, i) => (
                <View key={i} style={styles.tideGateItem}>
                  {isEditable ? (
                    <View style={styles.inlineRow}>
                      <EditableText
                        value={gate.location}
                        onChange={(v) => updateArrayItem<TideGate>('tideGates', i, { location: v })}
                        placeholder="Location"
                        style={styles.tideGateLocation}
                      />
                      <EditableText
                        value={gate.optimalTime || ''}
                        onChange={(v) => updateArrayItem<TideGate>('tideGates', i, { optimalTime: v })}
                        placeholder="Optimal time"
                        style={styles.tideGateTime}
                      />
                      <Pressable onPress={() => removeArrayItem('tideGates', i)}>
                        <Trash2 size={14} color={IOS_COLORS.red} />
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.detailText}>
                      {gate.location}
                      {gate.optimalTime && <Text style={styles.listItemNote}> - {gate.optimalTime}</Text>}
                    </Text>
                  )}
                </View>
              ))}
            </DetailSection>
          )}

          {/* Entry Fees */}
          {(safeData.entryFees?.length > 0 || safeData.entryDeadline) && (
            <DetailSection
              icon={<DollarSign size={16} color={IOS_COLORS.green} />}
              title="Entry Fees"
              onAdd={isEditable ? () => addArrayItem('entryFees', { type: '', amount: '' }) : undefined}
            >
              {(safeData.entryFees || []).map((fee, i) => (
                <View key={i} style={styles.inlineRow}>
                  {isEditable ? (
                    <>
                      <EditableText
                        value={fee.type}
                        onChange={(v) => updateArrayItem<EntryFee>('entryFees', i, { type: v })}
                        placeholder="Fee type"
                        style={styles.feeType}
                      />
                      <Text style={styles.colon}>:</Text>
                      <EditableText
                        value={fee.amount}
                        onChange={(v) => updateArrayItem<EntryFee>('entryFees', i, { amount: v })}
                        placeholder="Amount"
                        style={styles.feeAmount}
                      />
                      <Pressable onPress={() => removeArrayItem('entryFees', i)}>
                        <Trash2 size={14} color={IOS_COLORS.red} />
                      </Pressable>
                    </>
                  ) : (
                    <Text style={styles.detailText}>
                      {fee.type}: <Text style={styles.highlight}>{fee.amount}</Text>
                      {fee.deadline && <Text style={styles.listItemNote}> (by {fee.deadline})</Text>}
                    </Text>
                  )}
                </View>
              ))}
              {(safeData.entryDeadline) && (
                <View style={styles.inlineRow}>
                  <Text style={styles.fieldLabel}>Entry deadline:</Text>
                  {isEditable ? (
                    <EditableText
                      value={safeData.entryDeadline || ''}
                      onChange={(v) => updateField('entryDeadline', v)}
                      placeholder="Deadline"
                      style={styles.detailTextSecondary}
                    />
                  ) : (
                    <Text style={styles.detailTextSecondary}>{safeData.entryDeadline}</Text>
                  )}
                </View>
              )}
            </DetailSection>
          )}

          {/* Safety Requirements (NEW) */}
          {(safeData.safetyRequirements || safeData.retirementNotification || safeData.insuranceRequirements) && (
            <DetailSection
              icon={<Shield size={16} color={IOS_COLORS.orange} />}
              title="Safety & Insurance"
            >
              {(safeData.safetyRequirements) && (
                isEditable ? (
                  <EditableText
                    value={safeData.safetyRequirements || ''}
                    onChange={(v) => updateField('safetyRequirements', v)}
                    placeholder="Safety requirements..."
                    style={styles.detailText}
                    multiline
                  />
                ) : (
                  <Text style={styles.detailText}>{safeData.safetyRequirements}</Text>
                )
              )}
              {(safeData.retirementNotification) && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Retirement notification:</Text>
                  {isEditable ? (
                    <EditableText
                      value={safeData.retirementNotification || ''}
                      onChange={(v) => updateField('retirementNotification', v as string)}
                      placeholder="Notification procedure"
                      style={styles.detailTextSecondary}
                    />
                  ) : (
                    <Text style={styles.detailTextSecondary}>{safeData.retirementNotification}</Text>
                  )}
                </View>
              )}
              {(safeData.insuranceRequirements) && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Insurance:</Text>
                  {isEditable ? (
                    <EditableText
                      value={safeData.insuranceRequirements || ''}
                      onChange={(v) => updateField('insuranceRequirements', v)}
                      placeholder="Insurance requirements"
                      style={styles.detailTextSecondary}
                    />
                  ) : (
                    <Text style={styles.detailTextSecondary}>{safeData.insuranceRequirements}</Text>
                  )}
                </View>
              )}
            </DetailSection>
          )}

          {/* Expected Conditions (NEW) */}
          {(safeData.expectedConditions || safeData.expectedWindDirection) && (
            <DetailSection
              icon={<Waves size={16} color={IOS_COLORS.cyan} />}
              title="Expected Conditions"
            >
              {(safeData.expectedConditions) && (
                isEditable ? (
                  <EditableText
                    value={safeData.expectedConditions || ''}
                    onChange={(v) => updateField('expectedConditions', v)}
                    placeholder="Expected conditions..."
                    style={styles.detailText}
                    multiline
                  />
                ) : (
                  <Text style={styles.detailText}>{safeData.expectedConditions}</Text>
                )
              )}
              {(safeData.expectedWindDirection) && (
                <View style={styles.inlineRow}>
                  <Text style={styles.fieldLabel}>Wind:</Text>
                  {isEditable ? (
                    <>
                      <EditableText
                        value={safeData.expectedWindDirection || ''}
                        onChange={(v) => updateField('expectedWindDirection', v)}
                        placeholder="Direction"
                        style={styles.windField}
                      />
                      <EditableText
                        value={safeData.expectedWindSpeedMin?.toString() || ''}
                        onChange={(v) => updateField('expectedWindSpeedMin', v ? parseInt(v, 10) : undefined)}
                        placeholder="Min"
                        style={styles.windSpeed}
                        keyboardType="numeric"
                      />
                      <Text style={styles.windDash}>-</Text>
                      <EditableText
                        value={safeData.expectedWindSpeedMax?.toString() || ''}
                        onChange={(v) => updateField('expectedWindSpeedMax', v ? parseInt(v, 10) : undefined)}
                        placeholder="Max"
                        style={styles.windSpeed}
                        keyboardType="numeric"
                      />
                      <Text style={styles.windUnit}>kts</Text>
                    </>
                  ) : (
                    <Text style={styles.detailTextSecondary}>
                      {safeData.expectedWindDirection}
                      {safeData.expectedWindSpeedMin && safeData.expectedWindSpeedMax &&
                        ` ${safeData.expectedWindSpeedMin}-${safeData.expectedWindSpeedMax} kts`}
                    </Text>
                  )}
                </View>
              )}
            </DetailSection>
          )}

          {/* Scoring */}
          {(safeData.scoringFormulaDescription || safeData.handicapSystem?.length > 0) && (
            <DetailSection
              icon={<Trophy size={16} color={IOS_COLORS.yellow} />}
              title="Scoring"
            >
              {isEditable ? (
                <EditableText
                  value={safeData.scoringFormulaDescription || ''}
                  onChange={(v) => updateField('scoringFormulaDescription', v)}
                  placeholder="Scoring formula description..."
                  style={styles.detailText}
                  multiline
                />
              ) : (
                <Text style={styles.detailText}>{safeData.scoringFormulaDescription}</Text>
              )}
              {safeData.handicapSystem && safeData.handicapSystem.length > 0 && (
                <Text style={styles.detailTextSecondary}>
                  Handicap: {safeData.handicapSystem.join(', ')}
                </Text>
              )}
            </DetailSection>
          )}

          {/* Motoring Division */}
          {(safeData.motoringDivisionAvailable || safeData.motoringDivisionRules) && (
            <DetailSection
              icon={<Ship size={16} color={IOS_COLORS.teal} />}
              title="Motoring Division"
            >
              {isEditable && (
                <View style={styles.switchRow}>
                  <Text style={styles.fieldLabel}>Available:</Text>
                  <Switch
                    value={safeData.motoringDivisionAvailable || false}
                    onValueChange={(v) => updateField('motoringDivisionAvailable', v)}
                    trackColor={{ false: '#E5E5EA', true: IOS_COLORS.green }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              )}
              {(safeData.motoringDivisionRules) && (
                isEditable ? (
                  <EditableText
                    value={safeData.motoringDivisionRules || ''}
                    onChange={(v) => updateField('motoringDivisionRules', v)}
                    placeholder="Motoring rules..."
                    style={styles.detailText}
                    multiline
                  />
                ) : (
                  <Text style={styles.detailText}>
                    {safeData.motoringDivisionRules || 'Available - see sailing instructions'}
                  </Text>
                )
              )}
            </DetailSection>
          )}

          {/* Start/Finish Areas */}
          {(safeData.startAreaName || safeData.finishAreaName) && (
            <DetailSection
              icon={<MapPin size={16} color={IOS_COLORS.blue} />}
              title="Course Areas"
            >
              {(safeData.startAreaName) && (
                <View style={styles.inlineRow}>
                  <Text style={styles.fieldLabel}>Start:</Text>
                  {isEditable ? (
                    <EditableText
                      value={safeData.startAreaName || ''}
                      onChange={(v) => updateField('startAreaName', v)}
                      placeholder="Start area"
                      style={styles.areaName}
                    />
                  ) : (
                    <Text style={styles.detailText}>{safeData.startAreaName}</Text>
                  )}
                </View>
              )}
              {(safeData.finishAreaName) && (
                <View style={styles.inlineRow}>
                  <Text style={styles.fieldLabel}>Finish:</Text>
                  {isEditable ? (
                    <EditableText
                      value={safeData.finishAreaName || ''}
                      onChange={(v) => updateField('finishAreaName', v)}
                      placeholder="Finish area"
                      style={styles.areaName}
                    />
                  ) : (
                    <Text style={styles.detailText}>{safeData.finishAreaName}</Text>
                  )}
                </View>
              )}
            </DetailSection>
          )}

          {/* Prizes */}
          {safeData.prizesDescription && (
            <DetailSection
              icon={<Trophy size={16} color={IOS_COLORS.gold} />}
              title="Prizes"
            >
              {isEditable ? (
                <EditableText
                  value={safeData.prizesDescription || ''}
                  onChange={(v) => updateField('prizesDescription', v)}
                  placeholder="Prize description..."
                  style={styles.detailText}
                  multiline
                />
              ) : (
                <Text style={styles.detailText}>{safeData.prizesDescription}</Text>
              )}
            </DetailSection>
          )}

          {/* Safety & Rules */}
          {safeData.classRules && safeData.classRules.length > 0 && (
            <DetailSection
              icon={<FileText size={16} color={TUFTE_FORM_COLORS.secondaryLabel} />}
              title="Rules & Requirements"
            >
              {safeData.classRules.map((rule, i) => (
                <Text key={i} style={styles.listItem}>• {rule}</Text>
              ))}
              {safeData.eligibilityRequirements && (
                <Text style={styles.detailTextSecondary}>
                  Eligibility: {safeData.eligibilityRequirements}
                </Text>
              )}
            </DetailSection>
          )}

          {/* Contact & Links */}
          {(safeData.organizingAuthority || safeData.eventWebsite || safeData.contactEmail) && (
            <DetailSection
              icon={<Radio size={16} color={TUFTE_FORM_COLORS.secondaryLabel} />}
              title="Contact"
            >
              {(safeData.organizingAuthority) && (
                isEditable ? (
                  <EditableText
                    value={safeData.organizingAuthority || ''}
                    onChange={(v) => updateField('organizingAuthority', v)}
                    placeholder="Organizing authority"
                    style={styles.detailText}
                  />
                ) : (
                  <Text style={styles.detailText}>{safeData.organizingAuthority}</Text>
                )
              )}
              {(safeData.eventWebsite) && (
                isEditable ? (
                  <EditableText
                    value={safeData.eventWebsite || ''}
                    onChange={(v) => updateField('eventWebsite', v)}
                    placeholder="Event website URL"
                    style={styles.linkText}
                  />
                ) : (
                  <Text style={styles.linkText}>{safeData.eventWebsite}</Text>
                )
              )}
              {(safeData.contactEmail) && (
                isEditable ? (
                  <EditableText
                    value={safeData.contactEmail || ''}
                    onChange={(v) => updateField('contactEmail', v)}
                    placeholder="Contact email"
                    style={styles.linkText}
                  />
                ) : (
                  <Text style={styles.linkText}>{safeData.contactEmail}</Text>
                )
              )}
            </DetailSection>
          )}
        </View>
      )}
    </View>
  );
}

// Editable text field component
function EditableText({
  value,
  onChange,
  placeholder,
  style,
  multiline = false,
  keyboardType = 'default',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: any;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'url';
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={TUFTE_FORM_COLORS.placeholder}
      style={[styles.editableInput, style, multiline && styles.multilineInput]}
      multiline={multiline}
      keyboardType={keyboardType}
    />
  );
}

// Helper component for detail sections
function DetailSection({
  icon,
  title,
  children,
  onAdd,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
        {onAdd && (
          <Pressable onPress={onAdd} style={styles.addButton}>
            <Plus size={14} color={IOS_COLORS.blue} />
          </Pressable>
        )}
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: TUFTE_FORM_SPACING.lg,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.sectionLabel,
    letterSpacing: 1.2,
  },
  badge: {
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeEmpty: {
    backgroundColor: TUFTE_FORM_COLORS.tertiaryLabel,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.label,
    flex: 1,
  },
  addButton: {
    padding: 4,
  },
  sectionContent: {
    paddingLeft: 24,
    gap: 4,
  },
  scheduleItem: {
    marginBottom: 8,
  },
  scheduleDate: {
    fontSize: 12,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  scheduleEvent: {
    fontSize: 14,
    color: TUFTE_FORM_COLORS.label,
  },
  scheduleLocation: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
  mandatory: {
    color: IOS_COLORS.red,
    fontWeight: '600',
    fontSize: 11,
  },
  detailText: {
    fontSize: 14,
    color: TUFTE_FORM_COLORS.label,
    lineHeight: 20,
    flex: 1,
  },
  detailTextSecondary: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
    lineHeight: 18,
    marginTop: 4,
  },
  highlight: {
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  listItem: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.label,
    lineHeight: 20,
  },
  listItemEditable: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.label,
    flex: 1,
  },
  listItemNote: {
    color: TUFTE_FORM_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
  linkText: {
    fontSize: 13,
    color: IOS_COLORS.blue,
    lineHeight: 20,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  fieldRow: {
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  editableInput: {
    fontSize: 14,
    color: TUFTE_FORM_COLORS.label,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    minWidth: 60,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  bulletPoint: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.label,
  },
  waypointItem: {
    marginBottom: 4,
  },
  waypointNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.secondaryLabel,
    width: 20,
  },
  waypointName: {
    flex: 1,
    fontSize: 14,
  },
  channelLabel: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  channelNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  channelPurpose: {
    flex: 1,
    fontSize: 13,
  },
  tideGateItem: {
    marginBottom: 4,
  },
  tideGateLocation: {
    flex: 1,
    fontSize: 14,
  },
  tideGateTime: {
    fontSize: 13,
    width: 100,
  },
  feeType: {
    flex: 1,
    fontSize: 14,
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '600',
    width: 80,
  },
  colon: {
    fontSize: 14,
    color: TUFTE_FORM_COLORS.label,
  },
  areaName: {
    flex: 1,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  windField: {
    fontSize: 14,
    width: 60,
  },
  windSpeed: {
    fontSize: 14,
    width: 40,
    textAlign: 'center',
  },
  windDash: {
    fontSize: 14,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  windUnit: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
});

export default ExtractedDetailsSummary;
