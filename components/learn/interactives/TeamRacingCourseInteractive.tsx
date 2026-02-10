/**
 * Team Racing Course Layout Interactive
 * Explore common team racing course configurations (S-Course, Digital N, W/L)
 * with SVG diagrams showing marks, sailing legs, and annotations.
 *
 * Features:
 * - Toggle between three course layouts via chip buttons
 * - SVG course diagram with marks, dashed sailing paths, and annotations
 * - Course info card with description, key features, and usage info
 * - Tracks viewed courses and fires onComplete when all 3 viewed
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Line, Circle, Rect, Text as SvgText, Path, Defs, Polygon } from 'react-native-svg';

import {
  COURSE_LAYOUTS,
  COURSE_OVERVIEW,
  type CourseLayout,
  type CourseMark,
  type SailingLeg,
} from './data/teamRacingCourseData';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEG_COLORS: Record<string, string> = {
  upwind: '#3B82F6',
  downwind: '#10B981',
  reaching: '#F59E0B',
};

const LEG_LABELS: Record<string, string> = {
  upwind: 'Upwind',
  downwind: 'Downwind',
  reaching: 'Reaching',
};

// Start line position for legs that originate from "start"
const START_X = 200;
const START_Y = 560;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMarkPosition(
  marks: CourseMark[],
  markId: string,
): { x: number; y: number } | null {
  if (markId === 'start') return { x: START_X, y: START_Y };
  const mark = marks.find((m) => m.id === markId);
  return mark ? { x: mark.x, y: mark.y } : null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TeamRacingCourseInteractiveProps {
  onComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TeamRacingCourseInteractive({
  onComplete,
}: TeamRacingCourseInteractiveProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewedCourses, setViewedCourses] = useState<Set<string>>(
    new Set([COURSE_LAYOUTS[0].id]),
  );

  const course = COURSE_LAYOUTS[selectedIndex];

  // Track viewed courses
  const handleSelectCourse = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      setViewedCourses((prev) => {
        const next = new Set(prev);
        next.add(COURSE_LAYOUTS[index].id);
        return next;
      });
    },
    [],
  );

  // Fire onComplete when all courses viewed
  useEffect(() => {
    if (viewedCourses.size >= COURSE_LAYOUTS.length) {
      onComplete?.();
    }
  }, [viewedCourses, onComplete]);

  // Build unique sailing path legs (skip duplicates like two gate exits)
  const visibleLegs = useMemo(() => {
    const seen = new Set<string>();
    const result: SailingLeg[] = [];
    for (const leg of course.legs) {
      const from = getMarkPosition(course.marks, leg.from);
      const to = getMarkPosition(course.marks, leg.to);
      if (!from || !to) continue;
      const key = `${from.x},${from.y}-${to.x},${to.y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(leg);
    }
    return result;
  }, [course]);

  // Annotation style helpers
  const annotationColors = (type: string) => {
    if (type === 'warning') return { bg: '#FEF3C7', fg: '#92400E' };
    if (type === 'action') return { bg: '#DBEAFE', fg: '#1E40AF' };
    return { bg: '#F1F5F9', fg: '#475569' };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Overview header */}
      <View style={styles.overviewCard}>
        <Text style={styles.overviewTitle}>{COURSE_OVERVIEW.title}</Text>
        <Text style={styles.overviewDesc}>{COURSE_OVERVIEW.description}</Text>
      </View>

      {/* Course toggle chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {COURSE_LAYOUTS.map((layout, i) => {
          const active = i === selectedIndex;
          const viewed = viewedCourses.has(layout.id);
          return (
            <TouchableOpacity
              key={layout.id}
              style={[
                styles.chip,
                active && styles.chipActive,
                !active && viewed && styles.chipViewed,
              ]}
              onPress={() => handleSelectCourse(i)}
              activeOpacity={0.7}
            >
              {viewed && !active && (
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              )}
              <Text
                style={[styles.chipText, active && styles.chipTextActive]}
              >
                {layout.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Progress indicator */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {viewedCourses.size} of {COURSE_LAYOUTS.length} courses explored
        </Text>
        <View style={styles.progressDots}>
          {COURSE_LAYOUTS.map((layout, i) => (
            <View
              key={layout.id}
              style={[
                styles.progressDot,
                viewedCourses.has(layout.id) && styles.progressDotComplete,
                i === selectedIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* SVG Course Diagram */}
      <View style={styles.svgWrap}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 600"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Water background */}
          <Rect width="400" height="600" fill="#E0EFFE" />

          {/* Subtle wave lines */}
          {[100, 200, 300, 400, 500].map((y) => (
            <Path
              key={`wave-${y}`}
              d={`M0 ${y} Q100 ${y - 5},200 ${y} T400 ${y}`}
              stroke="#B4D4F0"
              strokeWidth="0.8"
              fill="none"
              opacity={0.4}
            />
          ))}

          {/* Wind arrow at top */}
          <G>
            <Line
              x1="200"
              y1="15"
              x2="200"
              y2="50"
              stroke="#64748B"
              strokeWidth="2"
            />
            <Polygon points="194,50 200,62 206,50" fill="#64748B" />
            <SvgText
              x="200"
              y="12"
              textAnchor="middle"
              fontSize="10"
              fill="#64748B"
              fontWeight="600"
            >
              WIND
            </SvgText>
          </G>

          {/* Start line */}
          <Line
            x1="140"
            y1={START_Y}
            x2="260"
            y2={START_Y}
            stroke="#1E293B"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />
          <SvgText
            x="200"
            y={START_Y + 16}
            textAnchor="middle"
            fontSize="9"
            fill="#64748B"
            fontWeight="600"
          >
            START / FINISH
          </SvgText>

          {/* Sailing path legs (dashed) */}
          {visibleLegs.map((leg, i) => {
            const from = getMarkPosition(course.marks, leg.from);
            const to = getMarkPosition(course.marks, leg.to);
            if (!from || !to) return null;
            return (
              <Line
                key={`leg-${i}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={LEG_COLORS[leg.type] ?? '#94A3B8'}
                strokeWidth="2.5"
                strokeDasharray="8,4"
                opacity={0.7}
              />
            );
          })}

          {/* Marks */}
          {course.marks.map((mark) => (
            <G key={mark.id}>
              <Circle
                cx={mark.x}
                cy={mark.y}
                r="10"
                fill="#F97316"
                stroke="#EA580C"
                strokeWidth="2"
              />
              <SvgText
                x={mark.x}
                y={mark.y + 4}
                textAnchor="middle"
                fontSize="8"
                fill="#FFFFFF"
                fontWeight="700"
              >
                {mark.type === 'windward'
                  ? 'W'
                  : mark.type === 'leeward'
                    ? 'L'
                    : mark.type === 'gate'
                      ? 'G'
                      : mark.type === 'spreader'
                        ? 'S'
                        : mark.type === 'wing'
                          ? 'Wi'
                          : 'M'}
              </SvgText>
              <SvgText
                x={mark.x}
                y={mark.y - 16}
                textAnchor="middle"
                fontSize="9"
                fill="#1E293B"
                fontWeight="600"
              >
                {mark.label}
              </SvgText>
            </G>
          ))}

          {/* Annotations */}
          {course.annotations.map((ann, i) => {
            const { bg, fg } = annotationColors(ann.type);
            const textWidth = ann.text.length * 5.5 + 12;
            return (
              <G key={`ann-${i}`}>
                <Rect
                  x={ann.x - textWidth / 2}
                  y={ann.y - 9}
                  width={textWidth}
                  height={16}
                  rx="4"
                  fill={bg}
                  opacity={0.9}
                />
                <SvgText
                  x={ann.x}
                  y={ann.y + 2}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="600"
                  fill={fg}
                >
                  {ann.text}
                </SvgText>
              </G>
            );
          })}

          {/* Leg type legend */}
          <G transform="translate(20, 575)">
            {Object.entries(LEG_COLORS).map(([type, color], i) => (
              <G key={type} transform={`translate(${i * 120}, 0)`}>
                <Line
                  x1="0"
                  y1="0"
                  x2="20"
                  y2="0"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeDasharray="6,3"
                />
                <SvgText
                  x="26"
                  y="4"
                  fontSize="9"
                  fill="#475569"
                  fontWeight="500"
                >
                  {LEG_LABELS[type]}
                </SvgText>
              </G>
            ))}
          </G>
        </Svg>
      </View>

      {/* Course info card */}
      <View style={styles.infoCard}>
        <Text style={styles.courseName}>{course.name}</Text>
        <Text style={styles.courseDesc}>{course.description}</Text>

        {/* Used in */}
        <View style={styles.usedInRow}>
          <Ionicons name="location-outline" size={14} color="#3B82F6" />
          <Text style={styles.usedInText}>{course.usedIn}</Text>
        </View>
      </View>

      {/* Key features */}
      <View style={styles.featuresCard}>
        <View style={styles.featuresHeader}>
          <Ionicons name="list-outline" size={16} color="#1E293B" />
          <Text style={styles.featuresTitle}>Key Features</Text>
        </View>
        {course.keyFeatures.map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#10B981"
              style={{ marginTop: 2 }}
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Leg breakdown */}
      <View style={styles.legsCard}>
        <View style={styles.featuresHeader}>
          <Ionicons name="navigate-outline" size={16} color="#1E293B" />
          <Text style={styles.featuresTitle}>Course Legs</Text>
        </View>
        {visibleLegs.map((leg, i) => (
          <View key={i} style={styles.legRow}>
            <View
              style={[
                styles.legDot,
                { backgroundColor: LEG_COLORS[leg.type] ?? '#94A3B8' },
              ]}
            />
            <View style={styles.legInfo}>
              <Text style={styles.legLabel}>{leg.label}</Text>
              <Text style={styles.legType}>
                {LEG_LABELS[leg.type] ?? leg.type}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const shadow = Platform.OS === 'web'
  ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' as any }
  : { elevation: 2 };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 12, gap: 10, paddingBottom: 32 },

  // -- Overview card --
  overviewCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    gap: 6,
    ...shadow,
  },
  overviewTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  overviewDesc: { fontSize: 13, color: '#475569', lineHeight: 19 },

  // -- Chip row --
  chipRow: { gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipViewed: {
    borderColor: '#10B981',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#FFFFFF' },

  // -- Progress --
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  progressText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  progressDots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  progressDotComplete: { backgroundColor: '#10B981' },
  progressDotActive: {
    backgroundColor: '#3B82F6',
    width: 16,
  },

  // -- SVG --
  svgWrap: {
    width: '100%',
    aspectRatio: 400 / 600,
    backgroundColor: '#E0EFFE',
    borderRadius: 12,
    overflow: 'hidden',
    ...shadow,
  },

  // -- Info card --
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    ...shadow,
  },
  courseName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  courseDesc: { fontSize: 13, color: '#475569', lineHeight: 20 },
  usedInRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
  },
  usedInText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
    fontWeight: '500',
  },

  // -- Features card --
  featuresCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    ...shadow,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  featuresTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  featureRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  featureText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 19 },

  // -- Legs card --
  legsCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    ...shadow,
  },
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legInfo: { flex: 1, gap: 1 },
  legLabel: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  legType: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
});

export default TeamRacingCourseInteractive;
