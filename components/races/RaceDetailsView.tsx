/**
 * Race Details View Component
 * Displays and allows editing of comprehensive race information
 * Organized into collapsible sections matching the race entry form
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { CourseSelector } from './CourseSelector';
import type { RaceCourse } from '@/types/courses';
import { createLogger } from '@/lib/utils/logger';

interface RaceDetailsViewProps {
  raceData: any;
  onUpdate?: () => void;
}

interface StartSequence {
  class: string;
  warning: string;
  start: string;
}

interface MarkBoat {
  mark: string;
  boat: string;
  position: string;
}

interface ClassDivision {
  name: string;
  fleet_size: number;
}

const logger = createLogger('RaceDetailsView');
export function RaceDetailsView({ raceData, onUpdate }: RaceDetailsViewProps) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set() // Will be populated by useEffect based on data
  );

  // State for all editable fields
  const [raceName, setRaceName] = useState(raceData.name || '');
  const [raceDate, setRaceDate] = useState(raceData.start_date || '');
  const [endDate, setEndDate] = useState(raceData.end_date || '');
  const [venue, setVenue] = useState(raceData.metadata?.venue_name || '');
  const [description, setDescription] = useState(raceData.description || '');

  // Timing & Sequence
  const [warningSignalTime, setWarningSignalTime] = useState(raceData.warning_signal_time || '');
  const [warningSignalType, setWarningSignalType] = useState(raceData.warning_signal_type || '');
  const [preparatoryMinutes, setPreparatoryMinutes] = useState(raceData.preparatory_signal_minutes?.toString() || '4');
  const [classIntervalMinutes, setClassIntervalMinutes] = useState(raceData.class_interval_minutes?.toString() || '5');
  const [totalStarts, setTotalStarts] = useState(raceData.total_starts?.toString() || '1');
  const [startSequence, setStartSequence] = useState<StartSequence[]>(raceData.start_sequence_details || []);
  const [plannedFinishTime, setPlannedFinishTime] = useState(raceData.planned_finish_time || '');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(raceData.time_limit_minutes?.toString() || '');

  // Communications
  const [vhfChannel, setVhfChannel] = useState(raceData.vhf_channel || '');
  const [vhfBackupChannel, setVhfBackupChannel] = useState(raceData.vhf_backup_channel || '');
  const [safetyChannel, setSafetyChannel] = useState(raceData.safety_channel || 'VHF 16');
  const [rcBoatName, setRcBoatName] = useState(raceData.rc_boat_name || '');
  const [rcBoatPosition, setRcBoatPosition] = useState(raceData.rc_boat_position || '');
  const [markBoats, setMarkBoats] = useState<MarkBoat[]>(raceData.mark_boat_positions || []);
  const [raceOfficer, setRaceOfficer] = useState(raceData.race_officer || '');
  const [protestCommittee, setProtestCommittee] = useState(raceData.protest_committee || '');

  // Course
  const [startAreaName, setStartAreaName] = useState(raceData.start_area_name || '');
  const [startAreaDescription, setStartAreaDescription] = useState(raceData.start_area_description || '');
  const [startLineLength, setStartLineLength] = useState(raceData.start_line_length_meters?.toString() || '');
  const [potentialCourses, setPotentialCourses] = useState<string[]>(raceData.potential_courses || []);
  const [courseSelectionCriteria, setCourseSelectionCriteria] = useState(raceData.course_selection_criteria || '');
  const [courseDiagramUrl, setCourseDiagramUrl] = useState(raceData.course_diagram_url || '');

  // Rules
  const [scoringSystem, setScoringSystem] = useState(raceData.scoring_system || 'Low Point');
  const [penaltySystem, setPenaltySystem] = useState(raceData.penalty_system || '720°');
  const [penaltyDetails, setPenaltyDetails] = useState(raceData.penalty_details || '');
  const [specialRules, setSpecialRules] = useState<string[]>(raceData.special_rules || []);
  const [sailingInstructionsUrl, setSailingInstructionsUrl] = useState(raceData.sailing_instructions_url || '');
  const [noticeOfRaceUrl, setNoticeOfRaceUrl] = useState(raceData.notice_of_race_url || '');

  // Fleet
  const [classDivisions, setClassDivisions] = useState<ClassDivision[]>(raceData.class_divisions || []);
  const [expectedFleetSize, setExpectedFleetSize] = useState(raceData.expected_fleet_size?.toString() || '');

  // Weather - check metadata first, then database columns
  const getWeatherFromMetadata = () => {
    const metadata = raceData.metadata;
    if (metadata?.wind && metadata?.tide) {
      return {
        windDirection: metadata.wind.direction || '',
        windSpeedMin: metadata.wind.speedMin?.toString() || '',
        windSpeedMax: metadata.wind.speedMax?.toString() || '',
        conditions: metadata.weather_provider ? `Weather from ${metadata.weather_provider}` : '',
        tideAtStart: metadata.tide.state
          ? `${metadata.tide.state} tide (${metadata.tide.height}m)${metadata.tide.direction ? ` flowing ${metadata.tide.direction}` : ''}`
          : '',
      };
    }
    return null;
  };

  const weatherData = getWeatherFromMetadata();

  const [expectedWindDirection, setExpectedWindDirection] = useState(
    raceData.expected_wind_direction?.toString() || weatherData?.windDirection || ''
  );
  const [expectedWindSpeedMin, setExpectedWindSpeedMin] = useState(
    raceData.expected_wind_speed_min?.toString() || weatherData?.windSpeedMin || ''
  );
  const [expectedWindSpeedMax, setExpectedWindSpeedMax] = useState(
    raceData.expected_wind_speed_max?.toString() || weatherData?.windSpeedMax || ''
  );
  const [expectedConditions, setExpectedConditions] = useState(
    raceData.expected_conditions || weatherData?.conditions || ''
  );
  const [tideAtStart, setTideAtStart] = useState(
    raceData.tide_at_start || weatherData?.tideAtStart || ''
  );

  // Tactical
  const [venueSpecificNotes, setVenueSpecificNotes] = useState(raceData.venue_specific_notes || '');
  const [favoredSide, setFavoredSide] = useState(raceData.favored_side || '');
  const [laylineStrategy, setLaylineStrategy] = useState(raceData.layline_strategy || '');
  const [startStrategy, setStartStrategy] = useState(raceData.start_strategy || '');

  // Registration
  const [registrationDeadline, setRegistrationDeadline] = useState(raceData.registration_deadline || '');
  const [entryFeeAmount, setEntryFeeAmount] = useState(raceData.entry_fee_amount?.toString() || '');
  const [entryFeeCurrency, setEntryFeeCurrency] = useState(raceData.entry_fee_currency || 'USD');
  const [checkInTime, setCheckInTime] = useState(raceData.check_in_time || '');
  const [skipperBriefingTime, setSkipperBriefingTime] = useState(raceData.skipper_briefing_time || '');

  // Course Selector
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<RaceCourse | null>(null);

  // Sync state with raceData when it changes (e.g., after loading from database)
  useEffect(() => {
    setRaceName(raceData.name || '');
    setRaceDate(raceData.start_date || '');
    setEndDate(raceData.end_date || '');
    setVenue(raceData.metadata?.venue_name || '');
    setDescription(raceData.description || '');

    // Timing & Sequence
    setWarningSignalTime(raceData.warning_signal_time || '');
    setWarningSignalType(raceData.warning_signal_type || '');
    setPreparatoryMinutes(raceData.preparatory_signal_minutes?.toString() || '4');
    setClassIntervalMinutes(raceData.class_interval_minutes?.toString() || '5');
    setTotalStarts(raceData.total_starts?.toString() || '1');
    setStartSequence(raceData.start_sequence_details || []);
    setPlannedFinishTime(raceData.planned_finish_time || '');
    setTimeLimitMinutes(raceData.time_limit_minutes?.toString() || '');

    // Communications
    setVhfChannel(raceData.vhf_channel || '');
    setVhfBackupChannel(raceData.vhf_backup_channel || '');
    setSafetyChannel(raceData.safety_channel || 'VHF 16');
    setRcBoatName(raceData.rc_boat_name || '');
    setRcBoatPosition(raceData.rc_boat_position || '');
    setMarkBoats(raceData.mark_boat_positions || []);
    setRaceOfficer(raceData.race_officer || '');
    setProtestCommittee(raceData.protest_committee || '');

    // Course
    setStartAreaName(raceData.start_area_name || '');
    setStartAreaDescription(raceData.start_area_description || '');
    setStartLineLength(raceData.start_line_length_meters?.toString() || '');
    setPotentialCourses(raceData.potential_courses || []);
    setCourseSelectionCriteria(raceData.course_selection_criteria || '');
    setCourseDiagramUrl(raceData.course_diagram_url || '');

    // Rules
    setScoringSystem(raceData.scoring_system || 'Low Point');
    setPenaltySystem(raceData.penalty_system || '720°');
    setPenaltyDetails(raceData.penalty_details || '');
    setSpecialRules(raceData.special_rules || []);
    setSailingInstructionsUrl(raceData.sailing_instructions_url || '');
    setNoticeOfRaceUrl(raceData.notice_of_race_url || '');

    // Fleet
    setClassDivisions(raceData.class_divisions || []);
    setExpectedFleetSize(raceData.expected_fleet_size?.toString() || '');

    // Weather - check metadata first, then database columns
    const metadata = raceData.metadata;
    const hasWeatherMetadata = metadata?.wind && metadata?.tide;

    setExpectedWindDirection(
      raceData.expected_wind_direction?.toString() ||
      (hasWeatherMetadata ? metadata.wind.direction : '') || ''
    );
    setExpectedWindSpeedMin(
      raceData.expected_wind_speed_min?.toString() ||
      (hasWeatherMetadata ? metadata.wind.speedMin?.toString() : '') || ''
    );
    setExpectedWindSpeedMax(
      raceData.expected_wind_speed_max?.toString() ||
      (hasWeatherMetadata ? metadata.wind.speedMax?.toString() : '') || ''
    );
    setExpectedConditions(
      raceData.expected_conditions ||
      (hasWeatherMetadata && metadata.weather_provider ? `Weather from ${metadata.weather_provider}` : '') || ''
    );
    setTideAtStart(
      raceData.tide_at_start ||
      (hasWeatherMetadata && metadata.tide.state
        ? `${metadata.tide.state} tide (${metadata.tide.height}m)${metadata.tide.direction ? ` flowing ${metadata.tide.direction}` : ''}`
        : '') || ''
    );

    // Tactical
    setVenueSpecificNotes(raceData.venue_specific_notes || '');
    setFavoredSide(raceData.favored_side || '');
    setLaylineStrategy(raceData.layline_strategy || '');
    setStartStrategy(raceData.start_strategy || '');

    // Registration
    setRegistrationDeadline(raceData.registration_deadline || '');
    setEntryFeeAmount(raceData.entry_fee_amount?.toString() || '');
    setEntryFeeCurrency(raceData.entry_fee_currency || 'USD');
    setCheckInTime(raceData.check_in_time || '');
    setSkipperBriefingTime(raceData.skipper_briefing_time || '');
  }, [raceData]); // Re-sync whenever raceData changes

  // Auto-expand sections that have data
  useEffect(() => {
    const sectionsWithData = new Set<string>();

    // Always show basic information
    sectionsWithData.add('basic');

    // Timing & Start Sequence - show if any timing data exists
    if (warningSignalTime || warningSignalType || preparatoryMinutes !== '4' ||
        classIntervalMinutes !== '5' || totalStarts !== '1' || startSequence.length > 0 ||
        plannedFinishTime || timeLimitMinutes) {
      sectionsWithData.add('timing');
    }

    // Communications & Control - show if any comm data exists
    if (vhfChannel || vhfBackupChannel || safetyChannel !== 'VHF 16' ||
        rcBoatName || rcBoatPosition || markBoats.length > 0 ||
        raceOfficer || protestCommittee) {
      sectionsWithData.add('communications');
    }

    // Course & Start Area - show if any course data exists
    if (startAreaName || startAreaDescription || startLineLength ||
        potentialCourses.length > 0 || courseSelectionCriteria || courseDiagramUrl) {
      sectionsWithData.add('course');
    }

    // Rules & Penalties - show if any rules data exists
    if (scoringSystem !== 'Low Point' || penaltySystem !== '720°' || penaltyDetails ||
        specialRules.length > 0 || sailingInstructionsUrl || noticeOfRaceUrl) {
      sectionsWithData.add('rules');
    }

    // Class & Fleet - show if any fleet data exists
    if (classDivisions.length > 0 || expectedFleetSize) {
      sectionsWithData.add('fleet');
    }

    // Weather & Conditions - show if any weather data exists
    if (expectedWindDirection || expectedWindSpeedMin || expectedWindSpeedMax ||
        expectedConditions || tideAtStart) {
      sectionsWithData.add('weather');
    }

    // Tactical Intelligence - show if any tactical data exists
    if (venueSpecificNotes || favoredSide || laylineStrategy || startStrategy) {
      sectionsWithData.add('tactical');
    }

    // Registration & Logistics - show if any registration data exists
    if (registrationDeadline || entryFeeAmount || checkInTime || skipperBriefingTime) {
      sectionsWithData.add('registration');
    }

    setExpandedSections(sectionsWithData);
  }, [raceData.id]); // Re-run when race data changes

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updates = {
        name: raceName.trim(),
        start_date: raceDate,
        end_date: endDate || null,
        description: description.trim() || null,
        metadata: {
          ...raceData.metadata,
          venue_name: venue.trim(),
        },

        // Timing
        warning_signal_time: warningSignalTime || null,
        warning_signal_type: warningSignalType || null,
        preparatory_signal_minutes: preparatoryMinutes ? parseInt(preparatoryMinutes) : 4,
        class_interval_minutes: classIntervalMinutes ? parseInt(classIntervalMinutes) : 5,
        total_starts: totalStarts ? parseInt(totalStarts) : 1,
        start_sequence_details: startSequence.length > 0 ? startSequence : null,
        planned_finish_time: plannedFinishTime || null,
        time_limit_minutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : null,

        // Communications
        vhf_channel: vhfChannel.trim() || null,
        vhf_backup_channel: vhfBackupChannel.trim() || null,
        safety_channel: safetyChannel.trim() || 'VHF 16',
        rc_boat_name: rcBoatName.trim() || null,
        rc_boat_position: rcBoatPosition.trim() || null,
        mark_boat_positions: markBoats.length > 0 ? markBoats : null,
        race_officer: raceOfficer.trim() || null,
        protest_committee: protestCommittee.trim() || null,

        // Course
        start_area_name: startAreaName.trim() || null,
        start_area_description: startAreaDescription.trim() || null,
        start_line_length_meters: startLineLength ? parseFloat(startLineLength) : null,
        potential_courses: potentialCourses.length > 0 ? potentialCourses : null,
        course_selection_criteria: courseSelectionCriteria.trim() || null,
        course_diagram_url: courseDiagramUrl.trim() || null,

        // Rules
        scoring_system: scoringSystem || 'Low Point',
        penalty_system: penaltySystem || '720°',
        penalty_details: penaltyDetails.trim() || null,
        special_rules: specialRules.length > 0 ? specialRules : null,
        sailing_instructions_url: sailingInstructionsUrl.trim() || null,
        notice_of_race_url: noticeOfRaceUrl.trim() || null,

        // Fleet
        class_divisions: classDivisions.filter((d) => d.name.trim()).length > 0 ? classDivisions : null,
        expected_fleet_size: expectedFleetSize ? parseInt(expectedFleetSize) : null,

        // Weather
        expected_wind_direction: expectedWindDirection ? parseInt(expectedWindDirection) : null,
        expected_wind_speed_min: expectedWindSpeedMin ? parseInt(expectedWindSpeedMin) : null,
        expected_wind_speed_max: expectedWindSpeedMax ? parseInt(expectedWindSpeedMax) : null,
        expected_conditions: expectedConditions.trim() || null,
        tide_at_start: tideAtStart.trim() || null,

        // Tactical
        venue_specific_notes: venueSpecificNotes.trim() || null,
        favored_side: favoredSide || null,
        layline_strategy: laylineStrategy || null,
        start_strategy: startStrategy || null,

        // Registration
        registration_deadline: registrationDeadline || null,
        entry_fee_amount: entryFeeAmount ? parseFloat(entryFeeAmount) : null,
        entry_fee_currency: entryFeeCurrency || 'USD',
        check_in_time: checkInTime || null,
        skipper_briefing_time: skipperBriefingTime || null,

        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('regattas')
        .update(updates)
        .eq('id', raceData.id);

      if (error) throw error;

      Alert.alert('Success', 'Race details updated successfully');
      setEditMode(false);
      onUpdate?.();
    } catch (error: any) {
      console.error('Error saving race details:', error);
      Alert.alert('Error', error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset all fields to original values
    setRaceName(raceData.name || '');
    setRaceDate(raceData.start_date || '');
    setEndDate(raceData.end_date || '');
    setVenue(raceData.metadata?.venue_name || '');
    setDescription(raceData.description || '');
    // ... reset all other fields
    setEditMode(false);
  };

  const handleCourseSelected = (course: RaceCourse) => {
    logger.debug('[RaceDetails] Course selected:', course.name);

    // Store the selected course
    setSelectedCourse(course);

    // Populate course fields
    setStartAreaName(course.name);
    setStartAreaDescription(course.description || '');

    // Set course type in potential courses
    const courseTypeName = course.course_type.replace('_', '/').toUpperCase();
    setPotentialCourses([courseTypeName]);

    // TODO: In Phase 2, we'll also populate race_marks table
    // For now, just populate the basic course info

    Alert.alert(
      'Course Selected',
      `${course.name} has been selected. The course details have been populated.`,
      [{ text: 'OK' }]
    );
  };

  const renderSectionHeader = (title: string, icon: string, sectionKey: string) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => toggleSection(sectionKey)}
    >
      <View style={styles.sectionHeaderLeft}>
        <MaterialCommunityIcons name={icon as any} size={20} color="#0284c7" />
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
      </View>
      <MaterialCommunityIcons
        name={expandedSections.has(sectionKey) ? 'chevron-up' : 'chevron-down'}
        size={20}
        color="#64748B"
      />
    </TouchableOpacity>
  );

  const renderField = (label: string, value: string, onChangeText?: (text: string) => void, options?: {
    placeholder?: string;
    multiline?: boolean;
    keyboardType?: 'default' | 'numeric';
  }) => {
    if (!editMode) {
      // View mode
      return (
        <View style={styles.fieldView}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={value ? styles.fieldValue : styles.fieldValueEmpty}>
            {value || 'Not set'}
          </Text>
        </View>
      );
    }

    // Edit mode
    return (
      <View style={styles.fieldEdit}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={options?.placeholder}
          placeholderTextColor="#9CA3AF"
          multiline={options?.multiline}
          keyboardType={options?.keyboardType}
          style={[
            styles.fieldInput,
            options?.multiline && styles.fieldInputMultiline,
          ]}
        />
      </View>
    );
  };

  const renderStartSequenceTable = () => {
    if (startSequence.length === 0 && !editMode) {
      return <Text style={styles.emptyTableText}>No start sequence defined</Text>;
    }

    return (
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Class</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Warning</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Start</Text>
        </View>
        {startSequence.map((seq, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1 }]}>{seq.class}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{seq.warning}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{seq.start}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMarkBoatsTable = () => {
    if (markBoats.length === 0 && !editMode) {
      return <Text style={styles.emptyTableText}>No mark boats defined</Text>;
    }

    return (
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Mark</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Boat</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Position</Text>
        </View>
        {markBoats.map((boat, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1 }]}>{boat.mark}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{boat.boat}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{boat.position || '-'}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderClassDivisionsTable = () => {
    if (classDivisions.length === 0 && !editMode) {
      return <Text style={styles.emptyTableText}>No class divisions defined</Text>;
    }

    return (
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Class</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Fleet Size</Text>
        </View>
        {classDivisions.map((div, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{div.name}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{div.fleet_size}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Edit Mode Header */}
      {editMode && (
        <View style={styles.editModeHeader}>
          <TouchableOpacity
            style={[styles.editModeButton, styles.cancelButton]}
            onPress={handleCancel}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editModeButton, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        {renderSectionHeader('Basic Information', 'information-outline', 'basic')}
        {expandedSections.has('basic') && (
          <View style={styles.sectionContent}>
            {renderField('Race Name', raceName, setRaceName, { placeholder: 'e.g., Hong Kong Dragon Championship 2025' })}
            {renderField('Race Date', raceDate, setRaceDate, { placeholder: 'YYYY-MM-DD' })}
            {renderField('End Date', endDate, setEndDate, { placeholder: 'YYYY-MM-DD' })}
            {renderField('Venue', venue, setVenue, { placeholder: 'e.g., Victoria Harbour, Hong Kong' })}
            {renderField('Description', description, setDescription, { placeholder: 'Race series, event details...', multiline: true })}
          </View>
        )}

        {/* Timing & Start Sequence */}
        {renderSectionHeader('Timing & Start Sequence', 'clock-outline', 'timing')}
        {expandedSections.has('timing') && (
          <View style={styles.sectionContent}>
            {renderField('Warning Signal Time', warningSignalTime, setWarningSignalTime, { placeholder: '10:00' })}
            {renderField('Warning Signal Type', warningSignalType, setWarningSignalType, { placeholder: 'sound, flag, both' })}
            {renderField('Preparatory Minutes', preparatoryMinutes, setPreparatoryMinutes, { placeholder: '4', keyboardType: 'numeric' })}
            {renderField('Class Interval (min)', classIntervalMinutes, setClassIntervalMinutes, { placeholder: '5', keyboardType: 'numeric' })}
            {renderField('Total Starts', totalStarts, setTotalStarts, { placeholder: '1', keyboardType: 'numeric' })}
            {renderField('Planned Finish Time', plannedFinishTime, setPlannedFinishTime, { placeholder: '12:00' })}
            {renderField('Time Limit (minutes)', timeLimitMinutes, setTimeLimitMinutes, { placeholder: '90', keyboardType: 'numeric' })}

            <View style={styles.tableSection}>
              <Text style={styles.tableSectionTitle}>Start Sequence</Text>
              {renderStartSequenceTable()}
            </View>
          </View>
        )}

        {/* Communications & Race Control */}
        {renderSectionHeader('Communications & Control', 'radio', 'comms')}
        {expandedSections.has('comms') && (
          <View style={styles.sectionContent}>
            {renderField('VHF Channel', vhfChannel, setVhfChannel, { placeholder: '72' })}
            {renderField('VHF Backup Channel', vhfBackupChannel, setVhfBackupChannel, { placeholder: '73' })}
            {renderField('Safety Channel', safetyChannel, setSafetyChannel, { placeholder: 'VHF 16' })}
            {renderField('RC Boat Name', rcBoatName, setRcBoatName, { placeholder: 'Committee Boat Alpha' })}
            {renderField('RC Boat Position', rcBoatPosition, setRcBoatPosition, { placeholder: 'East end of start line' })}
            {renderField('Race Officer', raceOfficer, setRaceOfficer, { placeholder: 'Principal Race Officer name' })}
            {renderField('Protest Committee', protestCommittee, setProtestCommittee, { placeholder: 'Contact info' })}

            <View style={styles.tableSection}>
              <Text style={styles.tableSectionTitle}>Mark Boats</Text>
              {renderMarkBoatsTable()}
            </View>
          </View>
        )}

        {/* Course & Start Area */}
        {renderSectionHeader('Course & Start Area', 'map-marker-path', 'course')}
        {expandedSections.has('course') && (
          <View style={styles.sectionContent}>
            {/* Course Selector Button */}
            <TouchableOpacity
              style={styles.courseSelectorButton}
              onPress={() => setShowCourseSelector(true)}
            >
              <MaterialCommunityIcons name="library" size={20} color="#2196F3" />
              <Text style={styles.courseSelectorButtonText}>
                {selectedCourse
                  ? `Selected: ${selectedCourse.name}`
                  : 'Select Course from Library'}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#2196F3" />
            </TouchableOpacity>

            {renderField('Start Area Name', startAreaName, setStartAreaName, { placeholder: 'Starting Area A' })}
            {renderField('Start Area Description', startAreaDescription, setStartAreaDescription, { placeholder: 'Detailed location', multiline: true })}
            {renderField('Start Line Length (m)', startLineLength, setStartLineLength, { placeholder: '100', keyboardType: 'numeric' })}
            {renderField('Course Selection Criteria', courseSelectionCriteria, setCourseSelectionCriteria, { placeholder: 'Based on wind direction', multiline: true })}
            {renderField('Course Diagram URL', courseDiagramUrl, setCourseDiagramUrl, { placeholder: 'https://...' })}

            {potentialCourses.length > 0 && !editMode && (
              <View style={styles.fieldView}>
                <Text style={styles.fieldLabel}>Potential Courses</Text>
                <Text style={styles.fieldValue}>{potentialCourses.join(', ')}</Text>
              </View>
            )}
          </View>
        )}

        {/* Rules & Penalties */}
        {renderSectionHeader('Rules & Penalties', 'flag-outline', 'rules')}
        {expandedSections.has('rules') && (
          <View style={styles.sectionContent}>
            {renderField('Scoring System', scoringSystem, setScoringSystem, { placeholder: 'Low Point' })}
            {renderField('Penalty System', penaltySystem, setPenaltySystem, { placeholder: '720°' })}
            {renderField('Penalty Details', penaltyDetails, setPenaltyDetails, { placeholder: 'Additional rules', multiline: true })}
            {renderField('Sailing Instructions URL', sailingInstructionsUrl, setSailingInstructionsUrl, { placeholder: 'https://...' })}
            {renderField('Notice of Race URL', noticeOfRaceUrl, setNoticeOfRaceUrl, { placeholder: 'https://...' })}

            {specialRules.length > 0 && !editMode && (
              <View style={styles.fieldView}>
                <Text style={styles.fieldLabel}>Special Rules</Text>
                {specialRules.map((rule, idx) => (
                  <Text key={idx} style={styles.specialRuleItem}>• {rule}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Fleet & Classes */}
        {renderSectionHeader('Fleet & Classes', 'sail-boat', 'fleet')}
        {expandedSections.has('fleet') && (
          <View style={styles.sectionContent}>
            {renderField('Expected Fleet Size', expectedFleetSize, setExpectedFleetSize, { placeholder: '20', keyboardType: 'numeric' })}

            <View style={styles.tableSection}>
              <Text style={styles.tableSectionTitle}>Class Divisions</Text>
              {renderClassDivisionsTable()}
            </View>
          </View>
        )}

        {/* Weather & Conditions */}
        {renderSectionHeader('Weather & Conditions', 'weather-partly-cloudy', 'weather')}
        {expandedSections.has('weather') && (
          <View style={styles.sectionContent}>
            {renderField('Expected Wind Direction (°)', expectedWindDirection, setExpectedWindDirection, { placeholder: '180', keyboardType: 'numeric' })}
            {renderField('Expected Wind Min (kts)', expectedWindSpeedMin, setExpectedWindSpeedMin, { placeholder: '8', keyboardType: 'numeric' })}
            {renderField('Expected Wind Max (kts)', expectedWindSpeedMax, setExpectedWindSpeedMax, { placeholder: '12', keyboardType: 'numeric' })}
            {renderField('Expected Conditions', expectedConditions, setExpectedConditions, { placeholder: 'Light air, moderate breeze...' })}
            {renderField('Tide at Start', tideAtStart, setTideAtStart, { placeholder: 'High tide +2:30' })}
          </View>
        )}

        {/* Tactical Strategy */}
        {renderSectionHeader('Tactical Strategy', 'compass-outline', 'tactical')}
        {expandedSections.has('tactical') && (
          <View style={styles.sectionContent}>
            {renderField('Venue-Specific Notes', venueSpecificNotes, setVenueSpecificNotes, { placeholder: 'Local knowledge...', multiline: true })}
            {renderField('Favored Side', favoredSide, setFavoredSide, { placeholder: 'Left/Right/Middle' })}
            {renderField('Layline Strategy', laylineStrategy, setLaylineStrategy, { placeholder: 'Conservative/Aggressive' })}
            {renderField('Start Strategy', startStrategy, setStartStrategy, { placeholder: 'Pin/Boat/Middle' })}
          </View>
        )}

        {/* Registration & Logistics */}
        {renderSectionHeader('Registration & Logistics', 'calendar-check', 'logistics')}
        {expandedSections.has('logistics') && (
          <View style={styles.sectionContent}>
            {renderField('Registration Deadline', registrationDeadline, setRegistrationDeadline, { placeholder: 'YYYY-MM-DD HH:MM' })}
            {renderField('Entry Fee Amount', entryFeeAmount, setEntryFeeAmount, { placeholder: '100', keyboardType: 'numeric' })}
            {renderField('Entry Fee Currency', entryFeeCurrency, setEntryFeeCurrency, { placeholder: 'USD' })}
            {renderField('Check-in Time', checkInTime, setCheckInTime, { placeholder: '08:00' })}
            {renderField('Skipper Briefing Time', skipperBriefingTime, setSkipperBriefingTime, { placeholder: '09:00' })}
          </View>
        )}
      </ScrollView>

      {/* Floating Edit Button (only in view mode) */}
      {!editMode && (
        <TouchableOpacity
          style={styles.floatingEditButton}
          onPress={() => setEditMode(true)}
        >
          <MaterialCommunityIcons name="pencil" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Course Selector Modal */}
      <CourseSelector
        visible={showCourseSelector}
        onClose={() => setShowCourseSelector(false)}
        onCourseSelected={handleCourseSelected}
        onCreateNew={() => {
          setShowCourseSelector(false);
          Alert.alert(
            'Create Course',
            'Course builder coming in Phase 2!',
            [{ text: 'OK' }]
          );
        }}
        venueId={raceData.metadata?.venue_id}
        clubId={raceData.metadata?.club_id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  editModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  editModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 16,
  },
  fieldView: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  fieldValue: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
  },
  fieldValueEmpty: {
    fontSize: 15,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  fieldEdit: {
    gap: 6,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  fieldInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tableSection: {
    marginTop: 8,
  },
  tableSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tableCell: {
    fontSize: 14,
    color: '#1E293B',
  },
  emptyTableText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  specialRuleItem: {
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 4,
  },
  floatingEditButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  courseSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2196F3',
    gap: 12,
  },
  courseSelectorButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
});
