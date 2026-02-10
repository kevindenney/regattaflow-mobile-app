/**
 * CoursePositionEditor Component
 *
 * Full-featured modal for positioning race course marks on a map.
 * Allows editing course type, wind direction, leg length, and mark positions.
 *
 * Web: Interactive MapLibre GL map with draggable marks
 * Native: Placeholder (MapLibre not stable in modals on native)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
  TextInput,
  Switch,
} from 'react-native';
import { X, RotateCcw, Navigation2, Anchor, ChevronDown, Info, Move, Compass, Ship, Minus, Plus, Waves } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import {
  CoursePositioningService,
  COURSE_TEMPLATES,
} from '@/services/CoursePositioningService';
import type {
  CourseType,
  PositionedCourse,
  PositionedMark,
  StartLinePosition,
} from '@/types/courses';
import { BathymetryCurrentLayer } from '@/components/map/layers/BathymetryCurrentLayer.web';

const isWeb = Platform.OS === 'web';

// iOS-style colors
const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  yellow: '#FFCC00',
  purple: '#5856D6',
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
  background: '#FFFFFF',
  groupedBackground: '#F2F2F7',
  separator: 'rgba(60, 60, 67, 0.36)',
  teal: '#0D9488',
};

// Mark colors by type
const MARK_COLORS: Record<string, string> = {
  windward: '#eab308',
  leeward: '#ef4444',
  gate: '#f97316',
  wing: '#22c55e',
  offset: '#3b82f6',
};

/** Forecast data point for sparklines */
export interface ForecastDataPoint {
  time: string;
  value: number;
  direction?: number; // degrees for wind/current direction
}

interface CoursePositionEditorProps {
  visible: boolean;
  regattaId: string;
  initialCourseType?: CourseType;
  initialLocation?: { lat: number; lng: number };
  initialWindDirection?: number;
  initialWindSpeed?: number;
  initialLegLength?: number;
  existingCourse?: PositionedCourse | null;
  /** Current direction in degrees (0-360, direction current flows TO) */
  currentDirection?: number;
  /** Current speed in knots */
  currentSpeed?: number;
  /** Wind forecast data for sparkline */
  windForecast?: ForecastDataPoint[];
  /** Current forecast data for sparkline */
  currentForecast?: ForecastDataPoint[];
  /** Number of boats expected at start (for start line calculation) */
  numberOfBoats?: number;
  /** Boat class LOA in meters (from boat_classes metadata) */
  boatLengthM?: number;
  onSave: (course: Omit<PositionedCourse, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

// Course type options
const COURSE_TYPE_OPTIONS: { value: CourseType; label: string; description: string }[] = [
  { value: 'windward_leeward', label: 'Windward/Leeward', description: 'Classic upwind/downwind' },
  { value: 'triangle', label: 'Triangle', description: 'With reaching leg' },
  { value: 'olympic', label: 'Olympic', description: 'Multiple legs' },
  { value: 'trapezoid', label: 'Trapezoid', description: 'Four-mark course' },
];

/**
 * Wind direction compass picker component
 */
function WindDirectionPicker({
  direction,
  onChange,
}: {
  direction: number;
  onChange: (dir: number) => void;
}) {
  const [inputValue, setInputValue] = useState(String(Math.round(direction)));

  const handleInputChange = (text: string) => {
    setInputValue(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 0 && num <= 360) {
      onChange(num % 360);
    }
  };

  const adjustDirection = (delta: number) => {
    const newDir = ((direction + delta) % 360 + 360) % 360;
    onChange(newDir);
    setInputValue(String(Math.round(newDir)));
  };

  // Update input when direction changes externally
  useEffect(() => {
    setInputValue(String(Math.round(direction)));
  }, [direction]);

  const cardinalLabel = useMemo(() => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(direction / 45) % 8;
    return dirs[index];
  }, [direction]);

  return (
    <View style={pickerStyles.container}>
      <View style={pickerStyles.labelRow}>
        <Navigation2
          size={16}
          color={COLORS.blue}
          style={{ transform: [{ rotate: `${direction}deg` }] }}
        />
        <Text style={pickerStyles.label}>Wind Direction</Text>
      </View>
      <View style={pickerStyles.controls}>
        <TouchableOpacity
          style={pickerStyles.adjustButton}
          onPress={() => adjustDirection(-5)}
        >
          <Text style={pickerStyles.adjustButtonText}>-5°</Text>
        </TouchableOpacity>
        <View style={pickerStyles.inputContainer}>
          <TextInput
            style={pickerStyles.input}
            value={inputValue}
            onChangeText={handleInputChange}
            keyboardType="number-pad"
            maxLength={3}
            selectTextOnFocus
          />
          <Text style={pickerStyles.unit}>° {cardinalLabel}</Text>
        </View>
        <TouchableOpacity
          style={pickerStyles.adjustButton}
          onPress={() => adjustDirection(5)}
        >
          <Text style={pickerStyles.adjustButtonText}>+5°</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustButton: {
    width: 44,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.blue,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray6,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.label,
    textAlign: 'center',
  },
  unit: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 4,
  },
});

/**
 * Leg length slider component
 */
function LegLengthSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const min = 0.2;
  const max = 1.5;

  // Handle slider change from web input
  const handleWebSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(event.target.value));
  };

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.labelRow}>
        <Anchor size={16} color={COLORS.teal} />
        <Text style={sliderStyles.label}>Leg Length</Text>
        <Text style={sliderStyles.value}>{value.toFixed(2)} nm</Text>
      </View>
      {isWeb ? (
        <input
          type="range"
          min={min}
          max={max}
          step={0.05}
          value={value}
          onChange={handleWebSliderChange as any}
          style={{
            width: '100%',
            height: 36,
            accentColor: COLORS.teal,
          }}
        />
      ) : (
        <View style={sliderStyles.sliderTrack}>
          <View
            style={[
              sliderStyles.sliderFill,
              { width: `${((value - min) / (max - min)) * 100}%` },
            ]}
          />
        </View>
      )}
      <View style={sliderStyles.labels}>
        <Text style={sliderStyles.minMax}>{min} nm</Text>
        <Text style={sliderStyles.minMax}>{max} nm</Text>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.teal,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gray5,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: COLORS.teal,
    borderRadius: 3,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  minMax: {
    fontSize: 11,
    color: COLORS.gray,
  },
});

/**
 * Start Line Length control component
 * Calculates start line based on fleet size: 1.5 × LOA × numberOfBoats
 */
function StartLineLengthControl({
  numberOfBoats,
  boatLengthM,
  calculatedLength,
  onNumberOfBoatsChange,
  onBoatLengthChange,
}: {
  numberOfBoats: number;
  boatLengthM: number;
  calculatedLength: number;
  onNumberOfBoatsChange: (n: number) => void;
  onBoatLengthChange: (l: number) => void;
}) {
  const [boatInputValue, setBoatInputValue] = useState(String(numberOfBoats));
  const [loaInputValue, setLoaInputValue] = useState(String(boatLengthM));

  const handleBoatCountChange = (text: string) => {
    setBoatInputValue(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 1 && num <= 200) {
      onNumberOfBoatsChange(num);
    }
  };

  const handleLoaChange = (text: string) => {
    setLoaInputValue(text);
    const num = parseFloat(text);
    if (!isNaN(num) && num >= 2 && num <= 30) {
      onBoatLengthChange(num);
    }
  };

  const adjustBoatCount = (delta: number) => {
    const newCount = Math.max(1, Math.min(200, numberOfBoats + delta));
    onNumberOfBoatsChange(newCount);
    setBoatInputValue(String(newCount));
  };

  // Update inputs when values change externally
  useEffect(() => {
    setBoatInputValue(String(numberOfBoats));
  }, [numberOfBoats]);

  useEffect(() => {
    setLoaInputValue(String(boatLengthM));
  }, [boatLengthM]);

  return (
    <View style={startLineStyles.container}>
      <View style={startLineStyles.labelRow}>
        <Ship size={16} color={COLORS.green} />
        <Text style={startLineStyles.label}>Start Line</Text>
      </View>

      {/* Horizontal layout: Boats, LOA, Result */}
      <View style={startLineStyles.horizontalRow}>
        {/* Boat Count Input */}
        <View style={startLineStyles.inputGroup}>
          <Text style={startLineStyles.inputLabel}>Boats</Text>
          <View style={startLineStyles.inputWithButtons}>
            <TouchableOpacity
              style={startLineStyles.adjustButton}
              onPress={() => adjustBoatCount(-5)}
            >
              <Minus size={12} color={COLORS.blue} />
            </TouchableOpacity>
            <View style={startLineStyles.inputContainer}>
              <TextInput
                style={startLineStyles.input}
                value={boatInputValue}
                onChangeText={handleBoatCountChange}
                keyboardType="number-pad"
                maxLength={3}
                selectTextOnFocus
              />
            </View>
            <TouchableOpacity
              style={startLineStyles.adjustButton}
              onPress={() => adjustBoatCount(5)}
            >
              <Plus size={12} color={COLORS.blue} />
            </TouchableOpacity>
          </View>
        </View>

        {/* LOA Input */}
        <View style={startLineStyles.inputGroup}>
          <Text style={startLineStyles.inputLabel}>LOA</Text>
          <View style={startLineStyles.inputContainer}>
            <TextInput
              style={startLineStyles.input}
              value={loaInputValue}
              onChangeText={handleLoaChange}
              keyboardType="decimal-pad"
              maxLength={4}
              selectTextOnFocus
            />
            <Text style={startLineStyles.unit}>m</Text>
          </View>
        </View>

        {/* Calculated Length Display */}
        <View style={startLineStyles.resultGroup}>
          <Text style={startLineStyles.inputLabel}>Line Length</Text>
          <View style={startLineStyles.resultBadge}>
            <Text style={startLineStyles.resultValue}>{Math.round(calculatedLength)}m</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const startLineStyles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  horizontalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '500',
  },
  inputWithButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adjustButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray6,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 28,
  },
  input: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.label,
    textAlign: 'center',
    minWidth: 36,
  },
  unit: {
    fontSize: 11,
    color: COLORS.gray,
    marginLeft: 2,
  },
  resultGroup: {
    gap: 4,
  },
  resultBadge: {
    backgroundColor: `${COLORS.green}15`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 28,
    justifyContent: 'center',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.green,
  },
});

/**
 * Sparkline component for showing forecast trends
 */
function Sparkline({
  data,
  color,
  width = 60,
  height = 24,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  if (!isWeb) return null;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Wind and Current display with sparklines
 */
function ConditionsDisplay({
  windDirection,
  windSpeed,
  currentDirection,
  currentSpeed,
  windForecast,
  currentForecast,
  onWindDirectionChange,
}: {
  windDirection: number;
  windSpeed?: number;
  currentDirection?: number;
  currentSpeed?: number;
  windForecast?: ForecastDataPoint[];
  currentForecast?: ForecastDataPoint[];
  onWindDirectionChange: (dir: number) => void;
}) {
  const [inputValue, setInputValue] = useState(String(Math.round(windDirection)));

  const handleInputChange = (text: string) => {
    setInputValue(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 0 && num <= 360) {
      onWindDirectionChange(num % 360);
    }
  };

  const adjustDirection = (delta: number) => {
    const newDir = ((windDirection + delta) % 360 + 360) % 360;
    onWindDirectionChange(newDir);
    setInputValue(String(Math.round(newDir)));
  };

  // Update input when direction changes externally
  useEffect(() => {
    setInputValue(String(Math.round(windDirection)));
  }, [windDirection]);

  const windCardinal = useMemo(() => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(windDirection / 45) % 8;
    return dirs[index];
  }, [windDirection]);

  const currentCardinal = useMemo(() => {
    if (currentDirection === undefined) return '';
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(currentDirection / 45) % 8;
    return dirs[index];
  }, [currentDirection]);

  const windForecastValues = windForecast?.map(d => d.value) || [];
  const currentForecastValues = currentForecast?.map(d => d.value) || [];

  return (
    <View style={conditionsStyles.container}>
      {/* Wind Section */}
      <View style={conditionsStyles.section}>
        <View style={conditionsStyles.labelRow}>
          <Navigation2
            size={14}
            color="#22c55e"
            style={{ transform: [{ rotate: `${windDirection}deg` }] }}
          />
          <Text style={conditionsStyles.label}>Wind</Text>
          {windSpeed !== undefined && (
            <Text style={[conditionsStyles.speedBadge, { backgroundColor: '#22c55e15', color: '#22c55e' }]}>{Math.round(windSpeed)} kts</Text>
          )}
        </View>
        <View style={conditionsStyles.row}>
          <TouchableOpacity
            style={conditionsStyles.adjustButton}
            onPress={() => adjustDirection(-5)}
          >
            <Text style={conditionsStyles.adjustText}>-5°</Text>
          </TouchableOpacity>
          <View style={conditionsStyles.inputContainer}>
            <TextInput
              style={conditionsStyles.input}
              value={inputValue}
              onChangeText={handleInputChange}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
            />
            <Text style={conditionsStyles.unit}>° {windCardinal}</Text>
          </View>
          <TouchableOpacity
            style={conditionsStyles.adjustButton}
            onPress={() => adjustDirection(5)}
          >
            <Text style={conditionsStyles.adjustText}>+5°</Text>
          </TouchableOpacity>
        </View>
        {windForecastValues.length > 2 && (
          <View style={conditionsStyles.sparklineRow}>
            <Text style={conditionsStyles.sparklineLabel}>Forecast</Text>
            <Sparkline data={windForecastValues} color="#22c55e" width={80} height={20} />
          </View>
        )}
      </View>

      {/* Current Section - Always show, with placeholder if no data */}
      <View style={conditionsStyles.section}>
        <View style={conditionsStyles.labelRow}>
          <Waves size={14} color="#0EA5E9" />
          <Text style={conditionsStyles.label}>Current</Text>
          {currentSpeed !== undefined && (
            <Text style={[conditionsStyles.speedBadge, { backgroundColor: '#0EA5E915', color: '#0EA5E9' }]}>
              {currentSpeed.toFixed(1)} kts
            </Text>
          )}
        </View>
        <View style={conditionsStyles.currentValueRow}>
          {currentDirection !== undefined ? (
            <View style={[conditionsStyles.currentValue, { backgroundColor: '#0EA5E910' }]}>
              <Navigation2
                size={12}
                color="#0EA5E9"
                style={{ transform: [{ rotate: `${currentDirection}deg` }] }}
              />
              <Text style={[conditionsStyles.currentText, { color: '#0EA5E9' }]}>
                {Math.round(currentDirection)}° {currentCardinal}
              </Text>
            </View>
          ) : (
            <View style={conditionsStyles.noDataBadge}>
              <Text style={conditionsStyles.noDataText}>No data</Text>
            </View>
          )}
        </View>
        {currentForecastValues.length > 2 && (
          <View style={conditionsStyles.sparklineRow}>
            <Text style={conditionsStyles.sparklineLabel}>Forecast</Text>
            <Sparkline data={currentForecastValues} color="#0EA5E9" width={80} height={20} />
          </View>
        )}
      </View>
    </View>
  );
}

const conditionsStyles = StyleSheet.create({
  container: {
    gap: 12,
  },
  section: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    flex: 1,
  },
  speedBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
    backgroundColor: '#22c55e15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adjustButton: {
    width: 40,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.blue,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray6,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 32,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.label,
    textAlign: 'center',
  },
  unit: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  currentValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0EA5E910',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  currentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0EA5E9',
  },
  noDataBadge: {
    backgroundColor: COLORS.gray6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  sparklineLabel: {
    fontSize: 10,
    color: COLORS.gray,
  },
});

/**
 * Course type selector dropdown
 */
function CourseTypeSelector({
  value,
  onChange,
}: {
  value: CourseType;
  onChange: (type: CourseType) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = COURSE_TYPE_OPTIONS.find((o) => o.value === value);

  return (
    <View style={selectorStyles.container}>
      <Pressable
        style={selectorStyles.trigger}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={selectorStyles.triggerText}>
          {selectedOption?.label || 'Select course type'}
        </Text>
        <ChevronDown size={16} color={COLORS.gray} />
      </Pressable>
      {isOpen && (
        <View style={selectorStyles.dropdown}>
          {COURSE_TYPE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                selectorStyles.option,
                option.value === value && selectorStyles.optionSelected,
              ]}
              onPress={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <Text
                style={[
                  selectorStyles.optionLabel,
                  option.value === value && selectorStyles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text style={selectorStyles.optionDescription}>
                {option.description}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const selectorStyles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.label,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gray5,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      default: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
    }),
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray5,
  },
  optionSelected: {
    backgroundColor: `${COLORS.blue}10`,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.label,
  },
  optionLabelSelected: {
    color: COLORS.blue,
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
});

/**
 * Main CoursePositionEditor component
 */
export function CoursePositionEditor({
  visible,
  regattaId,
  initialCourseType = 'windward_leeward',
  initialLocation,
  initialWindDirection = 225,
  initialWindSpeed,
  initialLegLength,
  existingCourse,
  currentDirection,
  currentSpeed,
  windForecast,
  currentForecast,
  numberOfBoats: initialNumberOfBoats = 20,
  boatLengthM: initialBoatLengthM = 8,
  onSave,
  onCancel,
}: CoursePositionEditorProps) {
  // State
  const [courseType, setCourseType] = useState<CourseType>(
    existingCourse?.courseType || initialCourseType
  );
  const [windDirection, setWindDirection] = useState(
    existingCourse?.windDirection || initialWindDirection
  );
  const [legLength, setLegLength] = useState(
    existingCourse?.legLengthNm ||
      initialLegLength ||
      COURSE_TEMPLATES[courseType]?.defaultLegLengthNm ||
      0.5
  );
  const [marks, setMarks] = useState<PositionedMark[]>(
    existingCourse?.marks || []
  );
  const [startLine, setStartLine] = useState<StartLinePosition | null>(
    existingCourse?.startLine || null
  );
  const [hasManualAdjustments, setHasManualAdjustments] = useState(
    existingCourse?.hasManualAdjustments || false
  );

  // Start line length state - derived from fleet size
  const [numberOfBoats, setNumberOfBoats] = useState(initialNumberOfBoats);
  const [boatLengthM, setBoatLengthM] = useState(initialBoatLengthM);
  const [startLineLengthM, setStartLineLengthM] = useState(
    existingCourse?.startLineLengthM ||
      CoursePositioningService.calculateStartLineLength(initialNumberOfBoats, initialBoatLengthM)
  );

  // Map refs and state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  // Depth-modulated current visualization
  const [showDepthCurrent, setShowDepthCurrent] = useState(false);

  // Toggle for scattered wind/current arrows on map
  const [showWindArrows, setShowWindArrows] = useState(true);
  const [showCurrentArrowsOnMap, setShowCurrentArrowsOnMap] = useState(true);

  // Calculate or recalculate course
  const calculateCourse = useCallback(() => {
    if (!initialLocation) {
      console.log('[CoursePositionEditor] calculateCourse: no initialLocation');
      return;
    }

    console.log('[CoursePositionEditor] Calculating course:', {
      initialLocation,
      windDirection,
      legLength,
      courseType,
      startLineLengthM,
    });

    const result = CoursePositioningService.calculatePositionedCourse({
      startLineCenter: initialLocation,
      windDirection,
      legLengthNm: legLength,
      courseType,
    });

    // Calculate start line with the dynamic length
    const newStartLine = CoursePositioningService.calculateStartLine(
      initialLocation,
      windDirection,
      startLineLengthM
    );

    console.log('[CoursePositionEditor] Course result:', {
      marksCount: result.marks.length,
      startLine: newStartLine,
      startLineLengthM,
    });

    setMarks(result.marks);
    setStartLine(newStartLine);
    setHasManualAdjustments(false);
  }, [initialLocation, windDirection, legLength, courseType, startLineLengthM]);

  // Handle start line length changes (from fleet size)
  const handleNumberOfBoatsChange = useCallback((count: number) => {
    setNumberOfBoats(count);
    const newLength = CoursePositioningService.calculateStartLineLength(count, boatLengthM);
    setStartLineLengthM(newLength);

    // Recalculate start line with new length
    const center = startLine
      ? {
          lat: (startLine.pin.lat + startLine.committee.lat) / 2,
          lng: (startLine.pin.lng + startLine.committee.lng) / 2,
        }
      : initialLocation;

    if (center) {
      const newStartLine = CoursePositioningService.calculateStartLine(
        center,
        windDirection,
        newLength
      );
      setStartLine(newStartLine);
    }
  }, [boatLengthM, startLine, initialLocation, windDirection]);

  const handleBoatLengthChange = useCallback((length: number) => {
    setBoatLengthM(length);
    const newLength = CoursePositioningService.calculateStartLineLength(numberOfBoats, length);
    setStartLineLengthM(newLength);

    // Recalculate start line with new length
    const center = startLine
      ? {
          lat: (startLine.pin.lat + startLine.committee.lat) / 2,
          lng: (startLine.pin.lng + startLine.committee.lng) / 2,
        }
      : initialLocation;

    if (center) {
      const newStartLine = CoursePositioningService.calculateStartLine(
        center,
        windDirection,
        newLength
      );
      setStartLine(newStartLine);
    }
  }, [numberOfBoats, startLine, initialLocation, windDirection]);

  // Initialize course on first render or when dependencies change
  useEffect(() => {
    if (!visible || !initialLocation) return;

    // Only calculate if we don't have existing marks
    if (marks.length === 0) {
      calculateCourse();
    }
  }, [visible, initialLocation, calculateCourse, marks.length]);

  // Handle course type change
  const handleCourseTypeChange = useCallback(
    (type: CourseType) => {
      setCourseType(type);
      // Use current start line center if course has been moved, otherwise use initialLocation
      const center = startLine
        ? {
            lat: (startLine.pin.lat + startLine.committee.lat) / 2,
            lng: (startLine.pin.lng + startLine.committee.lng) / 2,
          }
        : initialLocation;

      if (center) {
        const result = CoursePositioningService.calculatePositionedCourse({
          startLineCenter: center,
          windDirection,
          legLengthNm: legLength,
          courseType: type,
        });
        // Calculate start line with the dynamic length
        const newStartLine = CoursePositioningService.calculateStartLine(
          center,
          windDirection,
          startLineLengthM
        );
        setMarks(result.marks);
        setStartLine(newStartLine);
        setHasManualAdjustments(false);
      }
    },
    [initialLocation, startLine, windDirection, legLength, startLineLengthM]
  );

  // Handle wind direction change
  const handleWindDirectionChange = useCallback(
    (dir: number) => {
      setWindDirection(dir);
      // Recalculate marks that aren't user-adjusted
      // Use current start line center if course has been moved, otherwise use initialLocation
      const center = startLine
        ? {
            lat: (startLine.pin.lat + startLine.committee.lat) / 2,
            lng: (startLine.pin.lng + startLine.committee.lng) / 2,
          }
        : initialLocation;

      if (center && marks.length > 0) {
        const newMarks = CoursePositioningService.recalculateForWindChange(
          marks,
          center,
          windDirection,
          dir,
          legLength,
          courseType
        );
        setMarks(newMarks);
        // Also recalculate start line with current length
        const newStartLine = CoursePositioningService.calculateStartLine(
          center,
          dir,
          startLineLengthM
        );
        setStartLine(newStartLine);
      }
    },
    [initialLocation, startLine, marks, windDirection, legLength, courseType, startLineLengthM]
  );

  // Handle leg length change
  const handleLegLengthChange = useCallback(
    (len: number) => {
      setLegLength(len);
      // Recalculate marks
      // Use current start line center if course has been moved, otherwise use initialLocation
      const center = startLine
        ? {
            lat: (startLine.pin.lat + startLine.committee.lat) / 2,
            lng: (startLine.pin.lng + startLine.committee.lng) / 2,
          }
        : initialLocation;

      if (center && marks.length > 0) {
        const newMarks = CoursePositioningService.recalculateForLegLengthChange(
          marks,
          center,
          windDirection,
          legLength,
          len,
          courseType
        );
        setMarks(newMarks);
      }
    },
    [initialLocation, startLine, marks, windDirection, legLength, courseType]
  );

  // Reset course to template
  const handleReset = useCallback(() => {
    triggerHaptic('impactMedium');
    calculateCourse();
  }, [calculateCourse]);

  // Move course to current map center
  const handleCenterCourseHere = useCallback(() => {
    if (!mapRef.current || !startLine) return;
    triggerHaptic('impactMedium');
    const mapCenter = mapRef.current.getCenter();
    const newCenter = { lat: mapCenter.lat, lng: mapCenter.lng };

    const result = CoursePositioningService.repositionCourse(marks, startLine, newCenter);
    setMarks(result.marks);
    setStartLine(result.startLine);
  }, [marks, startLine]);

  // Realign course to current wind direction
  const handleAlignToWind = useCallback(() => {
    if (!startLine) return;
    triggerHaptic('impactMedium');
    const center = {
      lat: (startLine.pin.lat + startLine.committee.lat) / 2,
      lng: (startLine.pin.lng + startLine.committee.lng) / 2,
    };

    const newMarks = CoursePositioningService.realignCourseToWind(
      marks,
      center,
      windDirection,
      legLength,
      courseType
    );
    const newStartLine = CoursePositioningService.calculateStartLine(center, windDirection, startLineLengthM);

    setMarks(newMarks);
    setStartLine(newStartLine);
    setHasManualAdjustments(false);
  }, [marks, startLine, windDirection, legLength, courseType, startLineLengthM]);

  // Save course
  const handleSave = useCallback(() => {
    triggerHaptic('notificationSuccess');
    onSave({
      regattaId,
      userId: '', // Will be filled by the parent
      courseType,
      marks,
      startLine: startLine!,
      windDirection,
      legLengthNm: legLength,
      startLineLengthM,
      hasManualAdjustments,
    });
  }, [
    regattaId,
    courseType,
    marks,
    startLine,
    windDirection,
    legLength,
    startLineLengthM,
    hasManualAdjustments,
    onSave,
  ]);

  // Initialize web map
  useEffect(() => {
    if (!isWeb || !visible || !mapContainerRef.current || !initialLocation) return;
    if (mapRef.current) return; // Already initialized

    const initMap = async () => {
      try {
        const maplibregl = await import('maplibre-gl');
        await import('maplibre-gl/dist/maplibre-gl.css');

        const map = new maplibregl.default.Map({
          container: mapContainerRef.current!,
          style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          center: [initialLocation.lng, initialLocation.lat],
          zoom: 14,
          attributionControl: false,
        });

        map.on('load', () => {
          console.log('[CoursePositionEditor] Map loaded');
          mapRef.current = map;
          setMapReady(true);
        });
      } catch (error) {
        console.error('[CoursePositionEditor] Failed to initialize map:', error);
      }
    };

    initMap();

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, [visible, initialLocation]);

  // Update map markers when marks change or map becomes ready
  useEffect(() => {
    console.log('[CoursePositionEditor] Marker effect:', {
      isWeb,
      mapReady,
      hasMapRef: !!mapRef.current,
      marksLength: marks.length,
    });
    if (!isWeb || !mapReady || !mapRef.current || !marks.length) return;

    console.log('[CoursePositionEditor] Adding markers to map');
    const updateMarkers = async () => {
      const maplibregl = await import('maplibre-gl');
      const map = mapRef.current;

      // Guard against race condition where map becomes null after async import
      if (!map) return;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      // Add start line (with coordinate validation to prevent NaN errors)
      const hasValidStartLine = startLine &&
        !isNaN(startLine.pin.lat) && !isNaN(startLine.pin.lng) &&
        !isNaN(startLine.committee.lat) && !isNaN(startLine.committee.lng);

      if (hasValidStartLine) {
        // Remove existing start line layer if it exists
        if (map.getLayer('start-line-layer')) {
          map.removeLayer('start-line-layer');
        }
        if (map.getSource('start-line')) {
          map.removeSource('start-line');
        }

        map.addSource('start-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [startLine.pin.lng, startLine.pin.lat],
                [startLine.committee.lng, startLine.committee.lat],
              ],
            },
          },
        });

        map.addLayer({
          id: 'start-line-layer',
          type: 'line',
          source: 'start-line',
          paint: {
            'line-color': COLORS.green,
            'line-width': 4,
          },
        });

        // Add Pin marker
        const pinEl = document.createElement('div');
        pinEl.style.cssText = `
          width: 36px;
          height: 36px;
          background: ${COLORS.orange};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4);
        `;
        pinEl.textContent = 'P';
        const pinMarker = new maplibregl.default.Marker({ element: pinEl })
          .setLngLat([startLine.pin.lng, startLine.pin.lat])
          .addTo(map);
        markersRef.current.set('start-pin', pinMarker);

        // Add Committee Boat marker
        const cbEl = document.createElement('div');
        cbEl.style.cssText = `
          width: 36px;
          height: 36px;
          background: ${COLORS.blue};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4);
        `;
        cbEl.textContent = 'CB';
        const cbMarker = new maplibregl.default.Marker({ element: cbEl })
          .setLngLat([startLine.committee.lng, startLine.committee.lat])
          .addTo(map);
        markersRef.current.set('start-committee', cbMarker);

        // Add Finish marker (white, opposite pin from committee boat)
        const finishPos = CoursePositioningService.calculateFinishMark(startLine, windDirection);
        const finishEl = document.createElement('div');
        finishEl.style.cssText = `
          width: 32px;
          height: 32px;
          background: #ffffff;
          border: 3px solid #333;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4);
        `;
        finishEl.textContent = 'F';
        const finishMarker = new maplibregl.default.Marker({ element: finishEl })
          .setLngLat([finishPos.lng, finishPos.lat])
          .addTo(map);
        markersRef.current.set('finish', finishMarker);
      }

      // Add course line
      if (marks.length >= 2) {
        // Remove existing course line if it exists
        if (map.getLayer('course-line-layer')) {
          map.removeLayer('course-line-layer');
        }
        if (map.getSource('course-line')) {
          map.removeSource('course-line');
        }

        // Filter and sort marks with valid coordinates
        const sortedMarks = [...marks]
          .filter(m => !isNaN(m.longitude) && !isNaN(m.latitude))
          .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

        // Only add course line if we have at least 2 valid points
        if (sortedMarks.length < 2) {
          console.warn('[CoursePositionEditor] Not enough valid marks for course line');
        } else {
          map.addSource('course-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: sortedMarks.map((m) => [m.longitude, m.latitude]),
            },
          },
        });

        map.addLayer({
          id: 'course-line-layer',
          type: 'line',
          source: 'course-line',
          paint: {
            'line-color': '#f97316',
            'line-width': 3,
            'line-dasharray': [6, 3],
            'line-opacity': 0.9,
          },
        });
        }
      }

      // Add mark markers (draggable) - filter out marks with invalid coordinates
      const validMarks = marks.filter(m =>
        !isNaN(m.longitude) && !isNaN(m.latitude) &&
        m.longitude !== undefined && m.latitude !== undefined
      );
      validMarks.forEach((mark) => {
        const color = MARK_COLORS[mark.type] || '#64748b';
        const size = 32;

        const el = document.createElement('div');
        el.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 13px;
          cursor: grab;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4);
          ${mark.isUserAdjusted ? 'box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.5), 0 4px 12px rgba(0,0,0,0.4);' : ''}
        `;

        const label =
          mark.type === 'windward'
            ? 'W'
            : mark.type === 'leeward'
              ? 'L'
              : mark.type === 'gate'
                ? 'G'
                : mark.type === 'wing'
                  ? 'R'
                  : mark.type === 'offset'
                    ? 'O'
                    : '•';
        el.textContent = label;

        const marker = new maplibregl.default.Marker({
          element: el,
          draggable: true,
        })
          .setLngLat([mark.longitude, mark.latitude])
          .addTo(map);

        // Handle drag end
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          setMarks((prev) =>
            CoursePositioningService.updateMarkPosition(prev, mark.id, {
              lat: lngLat.lat,
              lng: lngLat.lng,
            })
          );
          setHasManualAdjustments(true);
        });

        markersRef.current.set(mark.id, marker);
      });

      // Fit bounds to show all marks
      if (validMarks.length > 0 && hasValidStartLine) {
        const bounds = new maplibregl.default.LngLatBounds();
        validMarks.forEach((m) => bounds.extend([m.longitude, m.latitude]));
        bounds.extend([startLine!.pin.lng, startLine!.pin.lat]);
        bounds.extend([startLine!.committee.lng, startLine!.committee.lat]);

        map.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
          duration: 500,
        });
      }
    };

    // Small delay to ensure map is ready
    const timeout = setTimeout(updateMarkers, 100);
    return () => clearTimeout(timeout);
  }, [marks, startLine, mapReady, windDirection]);

  if (!visible) return null;

  // Native placeholder
  if (!isWeb) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onCancel}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Course Position Editor</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <X size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.nativePlaceholder}>
            <Info size={48} color={COLORS.blue} />
            <Text style={styles.placeholderTitle}>Map Editor</Text>
            <Text style={styles.placeholderText}>
              Interactive course positioning is available on web. On mobile, courses are set
              from race documents or the web app.
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Web editor
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        {/* Header - Apple Modal Style */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Position Course</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!marks.length || !startLine}
            style={styles.headerButton}
          >
            <Text style={[
              styles.headerButtonTextSave,
              (!marks.length || !startLine) && styles.headerButtonDisabled
            ]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {initialLocation ? (
            <>
              <div
                ref={mapContainerRef}
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
              {/* Wind Direction Overlay - Top Left */}
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  pointerEvents: 'none',
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '2px solid rgba(34, 197, 94, 0.5)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 32 32"
                    style={{ transform: `rotate(${(windDirection + 180) % 360}deg)` }}
                  >
                    <path d="M16 4 L16 24" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                    <path d="M16 4 L10 12 M16 4 L22 12" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#22c55e',
                  }}
                >
                  Wind
                </div>
              </div>

              {/* Current Direction Overlay - Top Right */}
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  pointerEvents: 'none',
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: `2px solid ${currentDirection !== undefined ? 'rgba(14, 165, 233, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    opacity: currentDirection !== undefined ? 1 : 0.6,
                  }}
                >
                  {currentDirection !== undefined ? (
                    <svg
                      width="36"
                      height="24"
                      viewBox="0 0 28 20"
                      fill="none"
                      style={{ transform: `rotate(${currentDirection}deg)` }}
                    >
                      {/* Wavy arrow matching scattered current arrows */}
                      <path d="M4 10 Q7 6, 10 10 Q13 14, 16 10 Q19 6, 22 10"
                            stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                      <path d="M22 10 L18 6 M22 10 L18 14"
                            stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      {/* Waves icon for current with no direction */}
                      <path
                        d="M2 12c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2"
                        stroke="#6b7280"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <path
                        d="M2 17c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2"
                        stroke="#6b7280"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: currentDirection !== undefined ? '#0EA5E9' : '#6b7280',
                  }}
                >
                  {currentDirection !== undefined
                    ? `Current ${currentSpeed !== undefined ? `${currentSpeed.toFixed(1)}kt` : ''}`
                    : 'Current —'
                  }
                </div>
              </div>

              {/* Consolidated MAP LAYERS Toggle Panel */}
              <div
                style={{
                  position: 'absolute',
                  top: 115,
                  right: 16,
                  background: 'rgba(15, 23, 42, 0.95)',
                  borderRadius: 10,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                  zIndex: 100,
                  overflow: 'hidden',
                  minWidth: 160,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', letterSpacing: 0.5 }}>
                    MAP LAYERS
                  </span>
                </div>

                {/* Wind Toggle Row */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: 'rotate(180deg)' }}>
                      <path d="M12 4 L12 18" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"/>
                      <path d="M12 4 L7 10 M12 4 L17 10" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 12, fontWeight: 500, color: showWindArrows ? '#22c55e' : '#94A3B8' }}>
                      Wind
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showWindArrows}
                    onChange={(e) => setShowWindArrows(e.target.checked)}
                    style={{ width: 36, height: 20, accentColor: '#22c55e', cursor: 'pointer' }}
                  />
                </div>

                {/* Current Toggle Row */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="10" viewBox="0 0 28 20" fill="none">
                      <path d="M4 10 Q7 6, 10 10 Q13 14, 16 10 Q19 6, 22 10"
                            stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      <path d="M22 10 L18 6 M22 10 L18 14"
                            stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 12, fontWeight: 500, color: showCurrentArrowsOnMap ? '#0EA5E9' : '#94A3B8' }}>
                      Current
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showCurrentArrowsOnMap}
                    onChange={(e) => setShowCurrentArrowsOnMap(e.target.checked)}
                    style={{ width: 36, height: 20, accentColor: '#0EA5E9', cursor: 'pointer' }}
                  />
                </div>

                {/* Depth Toggle Row */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2"
                        stroke="#64B5F6"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M2 17c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2"
                        stroke="#64B5F6"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span style={{ fontSize: 12, fontWeight: 500, color: showDepthCurrent ? '#64B5F6' : '#94A3B8' }}>
                      Depth
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showDepthCurrent}
                    onChange={(e) => setShowDepthCurrent(e.target.checked)}
                    style={{ width: 36, height: 20, accentColor: '#64B5F6', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Scattered Wind Arrows across the map - reduced count and opacity for subtlety */}
              {showWindArrows && (() => {
                // Wind direction is where wind comes FROM, arrows point opposite (+180)
                const arrowDir = (windDirection + 180) % 360;
                const positions = [
                  { x: 18, y: 25 }, { x: 48, y: 22 }, { x: 78, y: 28 },
                  { x: 28, y: 45 }, { x: 58, y: 42 }, { x: 88, y: 48 },
                  { x: 15, y: 62 }, { x: 45, y: 58 }, { x: 75, y: 65 },
                  { x: 25, y: 78 }, { x: 55, y: 75 }, { x: 85, y: 80 },
                ];
                return positions.map((pos, i) => (
                  <div
                    key={`wind-${i}`}
                    style={{
                      position: 'absolute',
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: `translate(-50%, -50%) rotate(${arrowDir}deg)`,
                      pointerEvents: 'none',
                      zIndex: 5,
                      opacity: 0.6,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4 L12 18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M12 4 L7 10 M12 4 L17 10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ));
              })()}

              {/* Scattered Current/Tide Arrows across the map - reduced count and opacity */}
              {showCurrentArrowsOnMap && currentDirection !== undefined && (() => {
                const arrowDir = currentDirection;
                const positions = [
                  { x: 22, y: 30 }, { x: 52, y: 28 }, { x: 82, y: 32 },
                  { x: 32, y: 48 }, { x: 62, y: 45 }, { x: 92, y: 50 },
                  { x: 20, y: 65 }, { x: 50, y: 62 }, { x: 80, y: 68 },
                  { x: 30, y: 82 }, { x: 60, y: 78 }, { x: 90, y: 84 },
                ];
                return positions.map((pos, i) => (
                  <div
                    key={`current-${i}`}
                    style={{
                      position: 'absolute',
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: `translate(-50%, -50%) rotate(${arrowDir}deg)`,
                      pointerEvents: 'none',
                      zIndex: 5,
                      opacity: 0.6,
                    }}
                  >
                    <svg width="18" height="12" viewBox="0 0 28 20" fill="none">
                      <path d="M4 10 Q7 6, 10 10 Q13 14, 16 10 Q19 6, 22 10"
                            stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" fill="none"/>
                      <path d="M22 10 L18 6 M22 10 L18 14"
                            stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ));
              })()}

              {/* Depth visualization layer (depth numbers + nautical overlay) */}
              {mapReady && showDepthCurrent && initialLocation && (
                <BathymetryCurrentLayer
                  map={mapRef.current}
                  center={initialLocation}
                  radiusKm={5}
                  targetTime={new Date()}
                  showContours={true}
                  showArrows={false}
                  opacity={0.85}
                  visible={showDepthCurrent}
                />
              )}
            </>
          ) : (
            <View style={styles.noLocationMessage}>
              <Text style={styles.noLocationText}>
                No venue location available. Set a venue to position the course.
              </Text>
            </View>
          )}
        </View>

        {/* Controls Panel - Two Row Layout */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: 16,
            backgroundColor: COLORS.background,
            borderTop: `1px solid ${COLORS.separator}`,
          }}
        >
          {/* Row 1: Primary Controls - Course Type, Wind & Current, Leg Length */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            {/* Course Type */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <Text style={styles.controlLabel}>Course Type</Text>
              <CourseTypeSelector
                value={courseType}
                onChange={handleCourseTypeChange}
              />
            </div>

            {/* Wind & Current Conditions */}
            <div style={{ flex: 1.5, minWidth: 240 }}>
              <ConditionsDisplay
                windDirection={windDirection}
                windSpeed={initialWindSpeed}
                currentDirection={currentDirection}
                currentSpeed={currentSpeed}
                windForecast={windForecast}
                currentForecast={currentForecast}
                onWindDirectionChange={handleWindDirectionChange}
              />
            </div>

            {/* Leg Length */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <LegLengthSlider value={legLength} onChange={handleLegLengthChange} />
            </div>
          </div>

          {/* Row 2: Secondary Controls - Start Line, Actions */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            {/* Start Line Length (Fleet Size) */}
            <div style={{ flex: 2, minWidth: 280 }}>
              <StartLineLengthControl
                numberOfBoats={numberOfBoats}
                boatLengthM={boatLengthM}
                calculatedLength={startLineLengthM}
                onNumberOfBoatsChange={handleNumberOfBoatsChange}
                onBoatLengthChange={handleBoatLengthChange}
              />
            </div>

            {/* Course Actions */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <Text style={styles.controlLabel}>Actions</Text>
              <View style={styles.actionButtonRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleCenterCourseHere}
                >
                  <Move size={16} color={COLORS.blue} />
                  <Text style={styles.actionButtonText}>Move</Text>
                </TouchableOpacity>
                {hasManualAdjustments && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleAlignToWind}
                  >
                    <Compass size={16} color={COLORS.blue} />
                    <Text style={styles.actionButtonText}>Align</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleReset}
                >
                  <RotateCcw size={16} color={COLORS.orange} />
                  <Text style={[styles.actionButtonText, { color: COLORS.orange }]}>Reset</Text>
                </TouchableOpacity>
              </View>
            </div>
          </div>
        </div>

        {/* Hint */}
        {hasManualAdjustments && (
          <View style={styles.hintBar}>
            <Info size={14} color={COLORS.orange} />
            <Text style={styles.hintText}>
              Marks have been manually adjusted. They won't move when wind changes.
            </Text>
          </View>
        )}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  closeButton: {
    padding: 8,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 17,
    color: COLORS.blue,
  },
  headerButtonTextSave: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.blue,
  },
  headerButtonDisabled: {
    color: COLORS.gray3,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: COLORS.gray6,
  },
  noLocationMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noLocationText: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
  },
  controlGroup: {
    minWidth: 160,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    marginBottom: 8,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gray6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.blue,
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: `${COLORS.orange}15`,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.orange,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray4,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nativePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.label,
  },
  placeholderText: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default CoursePositionEditor;
