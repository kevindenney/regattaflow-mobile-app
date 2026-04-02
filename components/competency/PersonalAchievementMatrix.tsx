/**
 * PersonalAchievementMatrix — Cross-interest capability achievement grid.
 *
 * Shows the user's competency achievement across all their interests in a
 * heatmap-style matrix. Categories on the Y-axis, interests as columns.
 * Expandable rows reveal individual competency statuses.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { CompetencyWithProgress, CompetencyStatus } from '@/types/competency';
import { COMPETENCY_STATUS_CONFIG } from '@/types/competency';
import {
  achievementColor,
  achievementTextColor,
  statusCellColor,
  statusAbbrev,
} from '@/lib/utils/competencyColors';
import type {
  InterestCompetencyData,
  CategoryAchievement,
} from '@/hooks/useAllInterestCompetencies';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PersonalAchievementMatrixProps {
  data: InterestCompetencyData[];
  aggregate: {
    total: number;
    completed: number;
    percent: number;
    byStatus: Record<CompetencyStatus, number>;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RING_SIZE = 80;
const RING_STROKE = 7;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const STATUS_PILL_ORDER: CompetencyStatus[] = [
  'learning',
  'practicing',
  'validated',
  'competent',
];

const CATEGORY_ORDER = [
  // Sailing (RYA)
  'Starts',
  'Boat-Handling',
  'Speed',
  'Tactics',
  'Strategy',
  // Nursing (AACN)
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
  // Nursing (Clinical)
  'Assessment Skills',
  'Medication Administration',
  'Clinical Procedures',
  'Patient Care',
  'Critical Thinking',
];

// ---------------------------------------------------------------------------
// Progress Ring (compact)
// ---------------------------------------------------------------------------

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ProgressRing({ percent, color }: { percent: number; color: string }) {
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
  const clamped = Math.max(0, Math.min(100, percent));
  const webOffset = RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE;

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
          stroke="#E5E7EB" strokeWidth={RING_STROKE} fill="none"
        />
        {isWeb ? (
          <Circle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
            stroke={color} strokeWidth={RING_STROKE} fill="none"
            strokeLinecap="round"
            strokeDasharray={`${RING_CIRCUMFERENCE}`}
            strokeDashoffset={webOffset}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        ) : (
          <AnimatedCircle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
            stroke={color} strokeWidth={RING_STROKE} fill="none"
            strokeLinecap="round"
            strokeDasharray={`${RING_CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            rotation="-90"
            originX={RING_SIZE / 2} originY={RING_SIZE / 2}
          />
        )}
      </Svg>
      <View style={StyleSheet.absoluteFill as any}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color }}>{Math.round(percent)}%</Text>
          <Text style={{ fontSize: 9, color: '#6B7280', marginTop: -1 }}>Complete</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

function Legend() {
  const items = [
    { color: '#10B981', label: '≥80%' },
    { color: '#F59E0B', label: '50-79%' },
    { color: '#F97316', label: '25-49%' },
    { color: '#EF4444', label: '1-24%' },
    { color: '#E5E7EB', label: '0%' },
  ];
  return (
    <View style={s.legend}>
      {items.map((item) => (
        <View key={item.label} style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: item.color }]} />
          <Text style={s.legendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Category Row
// ---------------------------------------------------------------------------

function CategoryRow({
  category,
  interestData,
  expanded,
  onToggle,
}: {
  category: string;
  interestData: { interest: InterestCompetencyData; achievement: CategoryAchievement | null }[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={s.categoryBlock}>
      <Pressable onPress={onToggle} style={s.categoryRow}>
        <View style={s.categoryLabelWrap}>
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-forward'}
            size={14}
            color="#6B7280"
            style={{ marginRight: 6 }}
          />
          <Text style={s.categoryLabel} numberOfLines={2}>{category}</Text>
        </View>
        <View style={s.cellRow}>
          {interestData.map(({ interest, achievement }) => {
            const pct = achievement?.percent ?? 0;
            return (
              <View
                key={interest.interest.id}
                style={[s.achievementCell, { backgroundColor: achievementColor(pct) }]}
              >
                <Text style={[s.achievementCellText, { color: achievementTextColor(pct) }]}>
                  {pct > 0 ? `${pct}%` : '—'}
                </Text>
              </View>
            );
          })}
        </View>
      </Pressable>

      {expanded && (
        <View style={s.expandedSection}>
          {/* Collect all unique competencies across interests for this category */}
          {(() => {
            // Build unified list of competency titles across all interests
            const competencyMap = new Map<string, {
              title: string;
              sortOrder: number;
              byInterest: Map<string, CompetencyWithProgress>;
            }>();

            for (const { interest, achievement } of interestData) {
              if (!achievement) continue;
              for (const c of achievement.competencies) {
                // Use title as key since competency IDs differ across interests
                const key = c.title;
                let entry = competencyMap.get(key);
                if (!entry) {
                  entry = { title: c.title, sortOrder: c.sort_order, byInterest: new Map() };
                  competencyMap.set(key, entry);
                }
                entry.byInterest.set(interest.interest.id, c);
              }
            }

            const sorted = Array.from(competencyMap.values()).sort(
              (a, b) => a.sortOrder - b.sortOrder,
            );

            return sorted.map((comp) => (
              <View key={comp.title} style={s.compRow}>
                <Text style={s.compLabel} numberOfLines={1}>{comp.title}</Text>
                <View style={s.cellRow}>
                  {interestData.map(({ interest }) => {
                    const c = comp.byInterest.get(interest.interest.id);
                    const status: CompetencyStatus = c?.progress?.status ?? 'not_started';
                    const abbrev = statusAbbrev(status);
                    return (
                      <Pressable
                        key={interest.interest.id}
                        style={[s.statusCell, { backgroundColor: statusCellColor(status) }]}
                        onPress={() => {
                          if (c) {
                            router.push({ pathname: '/competency-detail', params: { competencyId: c.id } });
                          }
                        }}
                      >
                        <Text style={s.statusCellText}>{abbrev}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ));
          })()}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PersonalAchievementMatrix({
  data,
  aggregate,
}: PersonalAchievementMatrixProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  if (data.length === 0) return null;

  // Collect all unique categories, preserving a stable order
  const allCategories = (() => {
    const seen = new Set<string>();
    const ordered: string[] = [];

    // First pass: add categories in CATEGORY_ORDER
    for (const cat of CATEGORY_ORDER) {
      for (const d of data) {
        if (d.categories.some((c) => c.category === cat) && !seen.has(cat)) {
          seen.add(cat);
          ordered.push(cat);
        }
      }
    }

    // Second pass: add any remaining categories not in the predefined order
    for (const d of data) {
      for (const c of d.categories) {
        if (!seen.has(c.category)) {
          seen.add(c.category);
          ordered.push(c.category);
        }
      }
    }

    return ordered;
  })();

  // Determine column width based on number of interests
  const isSingle = data.length === 1;
  const needsScroll = data.length > 3;
  const cellWidth = isSingle ? 64 : Math.max(56, Math.min(72, (width - 200) / data.length));

  const accentColor = data[0]?.interest.accent_color || '#0097A7';

  return (
    <View style={s.container}>
      {/* Summary header */}
      <View style={s.summaryRow}>
        <ProgressRing percent={aggregate.percent} color={accentColor} />
        <View style={s.summaryStats}>
          <Text style={s.summaryTotal}>
            {aggregate.completed} of {aggregate.total}{' '}
            <Text style={s.summaryTotalLabel}>capabilities</Text>
          </Text>
          <View style={s.pills}>
            {STATUS_PILL_ORDER.map((status) => {
              const count = aggregate.byStatus[status];
              if (count === 0) return null;
              const cfg = COMPETENCY_STATUS_CONFIG[status];
              return (
                <View key={status} style={[s.pill, { backgroundColor: cfg.bg }]}>
                  <View style={[s.pillDot, { backgroundColor: cfg.color }]} />
                  <Text style={[s.pillText, { color: cfg.color }]}>
                    {count} {cfg.label}
                  </Text>
                </View>
              );
            })}
          </View>
          {data.length > 1 && (
            <Text style={s.interestCount}>
              Across {data.length} interests
            </Text>
          )}
        </View>
      </View>

      {/* Legend */}
      <Legend />

      {/* Matrix */}
      <View style={s.matrixContainer}>
        {/* Interest column headers */}
        <View style={s.headerRow}>
          <View style={s.labelColumn} />
          <ScrollViewOrView needsScroll={needsScroll}>
            <View style={s.cellRow}>
              {data.map((d) => (
                <View key={d.interest.id} style={[s.headerCell, { width: cellWidth }]}>
                  <View style={[s.headerDot, { backgroundColor: d.interest.accent_color || '#94A3B8' }]} />
                  <Text style={s.headerText} numberOfLines={1}>{d.interest.name}</Text>
                  <Text style={s.headerPercent}>
                    {d.summary ? `${d.summary.overallPercent}%` : '—'}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollViewOrView>
        </View>

        {/* Category rows */}
        {allCategories.map((cat) => {
          const interestData = data.map((d) => ({
            interest: d,
            achievement: d.categories.find((c) => c.category === cat) ?? null,
          }));

          return (
            <CategoryRow
              key={cat}
              category={cat}
              interestData={interestData}
              expanded={expandedCategory === cat}
              onToggle={() =>
                setExpandedCategory(expandedCategory === cat ? null : cat)
              }
            />
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ScrollViewOrView({
  needsScroll,
  children,
}: {
  needsScroll: boolean;
  children: React.ReactNode;
}) {
  if (needsScroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {children}
      </ScrollView>
    );
  }
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryStats: {
    flex: 1,
    marginLeft: 14,
  },
  summaryTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  summaryTotalLabel: {
    fontWeight: '400',
    color: '#6B7280',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  interestCount: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: '#64748B',
  },

  // Matrix
  matrixContainer: {
    gap: 0,
  },

  // Headers
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  labelColumn: {
    width: 140,
  },
  headerCell: {
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 3,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  headerPercent: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },

  // Category row
  categoryBlock: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  categoryLabelWrap: {
    width: 140,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  cellRow: {
    flexDirection: 'row',
    flex: 1,
  },
  achievementCell: {
    flex: 1,
    minWidth: 48,
    maxWidth: 72,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  achievementCellText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Expanded section
  expandedSection: {
    paddingLeft: 20,
    paddingBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#E2E8F0',
    marginLeft: 6,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  compLabel: {
    width: 114,
    fontSize: 11,
    color: '#64748B',
    paddingRight: 6,
  },
  statusCell: {
    flex: 1,
    minWidth: 48,
    maxWidth: 72,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  statusCellText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
