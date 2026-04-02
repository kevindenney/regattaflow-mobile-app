/**
 * CompetencyDashboard Component
 *
 * Full competency overview for a student: summary progress ring,
 * status breakdown, and competency cards grouped by category.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import type {
  CompetencyWithProgress,
  CompetencyDashboardSummary,
  CompetencyCategory,
  CompetencyStatus,
} from '@/types/competency';
import { COMPETENCY_STATUS_CONFIG } from '@/types/competency';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CompetencyDashboardProps {
  competencies: CompetencyWithProgress[];
  summary: CompetencyDashboardSummary | null;
  onSelectCompetency: (competency: CompetencyWithProgress) => void;
  accentColor?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ACCENT = '#0097A7';
const RING_SIZE = 96;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Preferred category display order — categories not listed here appear after these.
// Includes both legacy categories and AACN domain names.
const CATEGORY_ORDER: CompetencyCategory[] = [
  'Knowledge for Nursing Practice',
  'Person-Centered Care',
  'Population Health',
  'Scholarship for the Nursing Discipline',
  'Quality and Safety',
  'Interprofessional Partnerships',
  'Systems-Based Practice',
  'Informatics and Healthcare Technologies',
  'Professionalism',
  'Personal, Professional, and Leadership Development',
  'Assessment Skills',
  'Medication Administration',
  'Clinical Procedures',
  'Patient Care',
  'Critical Thinking',
];

const STATUS_PILL_ORDER: CompetencyStatus[] = [
  'learning',
  'practicing',
  'validated',
  'competent',
];

// ---------------------------------------------------------------------------
// Animated Progress Ring
// ---------------------------------------------------------------------------

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ProgressRing({
  percent,
  accentColor,
}: {
  percent: number;
  accentColor: string;
}) {
  const isWeb = Platform.OS === 'web';
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: percent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [RING_CIRCUMFERENCE, 0],
    extrapolate: 'clamp',
  });
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const webStrokeDashoffset = RING_CIRCUMFERENCE - (clampedPercent / 100) * RING_CIRCUMFERENCE;

  return (
    <View style={ringStyles.container}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        {/* Background track */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke="#E5E7EB"
          strokeWidth={RING_STROKE}
          fill="none"
        />
        {/* Filled arc */}
        {isWeb ? (
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={accentColor}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${RING_CIRCUMFERENCE}`}
            strokeDashoffset={webStrokeDashoffset}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        ) : (
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={accentColor}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${RING_CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            rotation="-90"
            originX={RING_SIZE / 2}
            originY={RING_SIZE / 2}
          />
        )}
      </Svg>
      {/* Center label */}
      <View style={ringStyles.labelWrap}>
        <Text style={[ringStyles.percent, { color: accentColor }]}>
          {Math.round(percent)}%
        </Text>
        <Text style={ringStyles.completeLabel}>Complete</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percent: {
    fontSize: 22,
    fontWeight: '700',
  },
  completeLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: -2,
  },
});

// ---------------------------------------------------------------------------
// Summary Header
// ---------------------------------------------------------------------------

function SummaryHeader({
  summary,
  accentColor,
}: {
  summary: CompetencyDashboardSummary;
  accentColor: string;
}) {
  return (
    <View style={headerStyles.wrapper}>
      <ProgressRing percent={summary.overallPercent} accentColor={accentColor} />

      <View style={headerStyles.stats}>
        <Text style={headerStyles.total}>
          {summary.byStatus.validated + summary.byStatus.competent} of{' '}
          {summary.total}{' '}
          <Text style={headerStyles.totalLabel}>competencies</Text>
        </Text>

        <View style={headerStyles.pills}>
          {STATUS_PILL_ORDER.map((status) => {
            const count = summary.byStatus[status];
            if (count === 0) return null;
            const cfg = COMPETENCY_STATUS_CONFIG[status];
            return (
              <View key={status} style={[headerStyles.pill, { backgroundColor: cfg.bg }]}>
                <View style={[headerStyles.dot, { backgroundColor: cfg.color }]} />
                <Text style={[headerStyles.pillText, { color: cfg.color }]}>
                  {count} {cfg.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stats: {
    flex: 1,
    marginLeft: 16,
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  totalLabel: {
    fontWeight: '400',
    color: '#6B7280',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

// ---------------------------------------------------------------------------
// Category Section
// ---------------------------------------------------------------------------

function CategorySection({
  category,
  items,
  completed,
  total,
  accentColor,
  numColumns,
  onSelectCompetency,
}: {
  category: string;
  items: CompetencyWithProgress[];
  completed: number;
  total: number;
  accentColor: string;
  numColumns: number;
  onSelectCompetency: (c: CompetencyWithProgress) => void;
}) {
  const progressFraction = total > 0 ? completed / total : 0;

  return (
    <View style={catStyles.section}>
      {/* Category header */}
      <View style={catStyles.headerRow}>
        <Text style={catStyles.headerLabel}>{category}</Text>
        <Text style={catStyles.headerFraction}>
          {completed}/{total}
        </Text>
      </View>

      {/* Mini progress bar */}
      <View style={catStyles.barTrack}>
        <View
          style={[
            catStyles.barFill,
            {
              width: `${Math.round(progressFraction * 100)}%`,
              backgroundColor: accentColor,
            },
          ]}
        />
      </View>

      {/* Grid of cards */}
      <View style={catStyles.grid}>
        {items.map((item, idx) => (
          <View
            key={item.id}
            style={[
              catStyles.cardWrapper,
              {
                width:
                  numColumns === 2
                    ? '48.5%'
                    : '100%',
                marginRight:
                  numColumns === 2 && idx % 2 === 0 ? '3%' : 0,
              },
            ]}
          >
            <CompetencyCard
              competency={item}
              accentColor={accentColor}
              onPress={() => onSelectCompetency(item)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const catStyles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerFraction: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 1.5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: 3,
    borderRadius: 1.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardWrapper: {
    marginBottom: 10,
  },
});

// ---------------------------------------------------------------------------
// Competency Card
// ---------------------------------------------------------------------------

function CompetencyCard({
  competency,
  accentColor,
  onPress,
}: {
  competency: CompetencyWithProgress;
  accentColor: string;
  onPress: () => void;
}) {
  const status: CompetencyStatus = competency.progress?.status ?? 'not_started';
  const cfg = COMPETENCY_STATUS_CONFIG[status];
  const isActive = status !== 'not_started';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        cardStyles.card,
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={cardStyles.row}>
        {/* Number circle */}
        <View
          style={[
            cardStyles.numberCircle,
            {
              backgroundColor: isActive ? accentColor : '#E5E7EB',
            },
          ]}
        >
          <Text
            style={[
              cardStyles.numberText,
              { color: isActive ? '#FFFFFF' : '#9CA3AF' },
            ]}
          >
            {competency.competency_number}
          </Text>
        </View>

        {/* Title + status badge */}
        <View style={cardStyles.center}>
          <Text style={cardStyles.title} numberOfLines={2}>
            {competency.title}
          </Text>
          <View style={[cardStyles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[cardStyles.badgeText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </View>

        {/* Status icon */}
        <Ionicons
          name={cfg.icon as any}
          size={20}
          color={cfg.color}
          style={cardStyles.statusIcon}
        />
      </View>

      {/* Supervision badge */}
      {competency.requires_supervision && (
        <View style={cardStyles.supervisedRow}>
          <Ionicons name="lock-closed-outline" size={11} color="#9CA3AF" />
          <Text style={cardStyles.supervisedText}>Supervised</Text>
        </View>
      )}
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  numberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 18,
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusIcon: {
    marginLeft: 4,
  },
  supervisedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  supervisedText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 4,
    fontWeight: '500',
  },
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CompetencyDashboard({
  competencies,
  summary,
  onSelectCompetency,
  accentColor = DEFAULT_ACCENT,
}: CompetencyDashboardProps) {
  const { width } = useWindowDimensions();
  const numColumns = width >= 600 ? 2 : 1;

  // ── Empty state ──────────────────────────────────────────────────────
  if (competencies.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="school-outline" size={48} color="#D1D5DB" />
        <Text style={styles.emptyText}>
          No competencies defined for this interest yet.
        </Text>
      </View>
    );
  }

  // ── Group by category ────────────────────────────────────────────────
  const grouped = new Map<
    string,
    { items: CompetencyWithProgress[]; completed: number; total: number }
  >();

  for (const cat of CATEGORY_ORDER) {
    grouped.set(cat, { items: [], completed: 0, total: 0 });
  }

  for (const c of competencies) {
    const bucket = grouped.get(c.category);
    if (bucket) {
      bucket.items.push(c);
      bucket.total += 1;
      const s = c.progress?.status;
      if (s === 'validated' || s === 'competent') {
        bucket.completed += 1;
      }
    } else {
      // Category not in predefined order — add dynamically
      const status = c.progress?.status;
      const isComplete = status === 'validated' || status === 'competent';
      grouped.set(c.category, {
        items: [c],
        completed: isComplete ? 1 : 0,
        total: 1,
      });
    }
  }

  // Sort items within each category by sort_order
  for (const bucket of grouped.values()) {
    bucket.items.sort((a, b) => a.sort_order - b.sort_order);
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Summary ring + pills */}
      {summary && (
        <SummaryHeader summary={summary} accentColor={accentColor} />
      )}

      {/* Category sections */}
      {Array.from(grouped.entries()).map(([cat, bucket]) => {
        if (bucket.items.length === 0) return null;
        return (
          <CategorySection
            key={cat}
            category={cat}
            items={bucket.items}
            completed={bucket.completed}
            total={bucket.total}
            accentColor={accentColor}
            numColumns={numColumns}
            onSelectCompetency={onSelectCompetency}
          />
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Root Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
});
