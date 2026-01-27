/**
 * IOSClientDetail - Health App-Style Client Progress
 *
 * Apple Health-style client detail screen:
 * - Large trend chart with percentage change
 * - Grouped sections: Progress, Sessions, Goals
 * - Session list with disclosure chevrons
 * - Ring progress indicators
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Line, G } from 'react-native-svg';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

// Types
interface ClientProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  boatClass: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  memberSince: Date;
  status: 'active' | 'inactive' | 'on_hold';
}

interface ProgressMetric {
  label: string;
  current: number;
  previous: number;
  unit?: string;
  higherIsBetter?: boolean;
}

interface TrendDataPoint {
  date: Date;
  value: number;
}

interface Goal {
  id: string;
  title: string;
  progress: number; // 0-100
  target: string;
  deadline?: Date;
  status: 'on_track' | 'at_risk' | 'achieved';
}

interface Session {
  id: string;
  type: 'analysis' | 'live' | 'race_day' | 'call';
  date: Date;
  duration: number; // minutes
  notes?: string;
  outcome?: string;
}

interface IOSClientDetailProps {
  client: ClientProfile;
  metrics: ProgressMetric[];
  trendData: TrendDataPoint[];
  goals: Goal[];
  recentSessions: Session[];
  onScheduleSession?: () => void;
  onSessionPress?: (session: Session) => void;
  onGoalPress?: (goal: Goal) => void;
  onAddGoal?: () => void;
  onEditClient?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Mini line chart component
interface MiniTrendChartProps {
  data: TrendDataPoint[];
  width?: number;
  height?: number;
  color?: string;
}

function MiniTrendChart({ data, width = 280, height = 120, color = IOS_COLORS.systemBlue }: MiniTrendChartProps) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Generate path
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.value - min) / range) * chartHeight;
    return { x, y };
  });

  const pathData = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  return (
    <Svg width={width} height={height}>
      {/* Grid lines */}
      <Line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke={IOS_COLORS.systemGray5} strokeWidth={1} />
      <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={IOS_COLORS.systemGray5} strokeWidth={1} />

      {/* Trend line */}
      <Path d={pathData} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* End point dot */}
      <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={5} fill={color} />
    </Svg>
  );
}

// Progress Ring component
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

function ProgressRing({ progress, size = 48, strokeWidth = 4, color = IOS_COLORS.systemBlue }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 100) / 100);

  return (
    <Svg width={size} height={size}>
      <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={IOS_COLORS.systemGray5}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

// Session type configuration
function getSessionTypeInfo(type: Session['type']): {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  label: string;
} {
  switch (type) {
    case 'analysis':
      return { icon: 'analytics', color: IOS_COLORS.systemBlue, label: 'Video Analysis' };
    case 'live':
      return { icon: 'videocam', color: IOS_COLORS.systemGreen, label: 'Live Session' };
    case 'race_day':
      return { icon: 'boat', color: IOS_COLORS.systemOrange, label: 'Race Day' };
    case 'call':
      return { icon: 'call', color: IOS_COLORS.systemPurple, label: 'Call' };
    default:
      return { icon: 'calendar', color: IOS_COLORS.systemGray, label: 'Session' };
  }
}

// Goal status configuration
function getGoalStatusInfo(status: Goal['status']): { color: string; label: string } {
  switch (status) {
    case 'on_track':
      return { color: IOS_COLORS.systemGreen, label: 'On Track' };
    case 'at_risk':
      return { color: IOS_COLORS.systemOrange, label: 'At Risk' };
    case 'achieved':
      return { color: IOS_COLORS.systemBlue, label: 'Achieved' };
    default:
      return { color: IOS_COLORS.systemGray, label: status };
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Session Row Component
interface SessionRowProps {
  session: Session;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function SessionRow({ session, onPress, isFirst, isLast }: SessionRowProps) {
  const scale = useSharedValue(1);
  const typeInfo = getSessionTypeInfo(session.type);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.sessionRow,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        animatedStyle,
      ]}
      onPress={() => {
        triggerHaptic('impactLight');
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
    >
      <View style={[styles.sessionIcon, { backgroundColor: `${typeInfo.color}15` }]}>
        <Ionicons name={typeInfo.icon} size={18} color={typeInfo.color} />
      </View>
      <View style={styles.sessionContent}>
        <Text style={styles.sessionType}>{typeInfo.label}</Text>
        <Text style={styles.sessionMeta}>
          {formatDate(session.date)} • {session.duration} min
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={IOS_COLORS.systemGray3} />
    </AnimatedPressable>
  );
}

// Goal Row Component
interface GoalRowProps {
  goal: Goal;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function GoalRow({ goal, onPress, isFirst, isLast }: GoalRowProps) {
  const scale = useSharedValue(1);
  const statusInfo = getGoalStatusInfo(goal.status);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.goalRow,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        animatedStyle,
      ]}
      onPress={() => {
        triggerHaptic('impactLight');
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
    >
      <ProgressRing progress={goal.progress} color={statusInfo.color} />
      <View style={styles.goalContent}>
        <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
        <Text style={styles.goalTarget}>{goal.target}</Text>
      </View>
      <View style={styles.goalTrailing}>
        <Text style={[styles.goalProgress, { color: statusInfo.color }]}>
          {goal.progress}%
        </Text>
        <Ionicons name="chevron-forward" size={18} color={IOS_COLORS.systemGray3} />
      </View>
    </AnimatedPressable>
  );
}

// Main Component
export function IOSClientDetail({
  client,
  metrics,
  trendData,
  goals,
  recentSessions,
  onScheduleSession,
  onSessionPress,
  onGoalPress,
  onAddGoal,
  onEditClient,
}: IOSClientDetailProps) {
  // Calculate overall trend
  const hasImprovement = trendData.length >= 2 &&
    trendData[trendData.length - 1].value > trendData[0].value;
  const changePercent = trendData.length >= 2
    ? Math.round(((trendData[trendData.length - 1].value - trendData[0].value) / trendData[0].value) * 100)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Client Header */}
      <View style={styles.header}>
        <View style={styles.clientInfo}>
          {client.avatarUrl ? (
            <Image source={{ uri: client.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color={IOS_COLORS.systemGray3} />
            </View>
          )}
          <View>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientMeta}>
              {client.boatClass} • {client.level.charAt(0).toUpperCase() + client.level.slice(1)}
            </Text>
          </View>
        </View>
        {onEditClient && (
          <Pressable
            style={styles.editButton}
            onPress={() => {
              triggerHaptic('impactLight');
              onEditClient();
            }}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        )}
      </View>

      {/* Progress Trend Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROGRESS OVERVIEW</Text>
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <View>
              <Text style={styles.trendLabel}>Performance Trend</Text>
              <View style={styles.trendChange}>
                <Ionicons
                  name={hasImprovement ? 'arrow-up' : 'arrow-down'}
                  size={20}
                  color={hasImprovement ? IOS_COLORS.systemGreen : IOS_COLORS.systemRed}
                />
                <Text
                  style={[
                    styles.changePercent,
                    { color: hasImprovement ? IOS_COLORS.systemGreen : IOS_COLORS.systemRed },
                  ]}
                >
                  {Math.abs(changePercent)}%
                </Text>
              </View>
            </View>
            <Text style={styles.trendPeriod}>Last 30 days</Text>
          </View>
          <View style={styles.chartContainer}>
            <MiniTrendChart
              data={trendData}
              color={hasImprovement ? IOS_COLORS.systemGreen : IOS_COLORS.systemRed}
            />
          </View>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>KEY METRICS</Text>
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => {
            const change = metric.current - metric.previous;
            const isPositive = metric.higherIsBetter ? change > 0 : change < 0;

            return (
              <View key={metric.label} style={styles.metricCard}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>
                  {metric.current}
                  {metric.unit && <Text style={styles.metricUnit}>{metric.unit}</Text>}
                </Text>
                {change !== 0 && (
                  <View style={styles.metricChange}>
                    <Ionicons
                      name={change > 0 ? 'arrow-up' : 'arrow-down'}
                      size={12}
                      color={isPositive ? IOS_COLORS.systemGreen : IOS_COLORS.systemRed}
                    />
                    <Text
                      style={[
                        styles.metricChangeText,
                        { color: isPositive ? IOS_COLORS.systemGreen : IOS_COLORS.systemRed },
                      ]}
                    >
                      {Math.abs(change)}{metric.unit || ''}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Goals Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>GOALS</Text>
          {onAddGoal && (
            <Pressable
              style={styles.addButton}
              onPress={() => {
                triggerHaptic('impactLight');
                onAddGoal();
              }}
            >
              <Ionicons name="add" size={20} color={IOS_COLORS.systemBlue} />
            </Pressable>
          )}
        </View>
        {goals.length > 0 ? (
          <View style={styles.listContainer}>
            {goals.map((goal, index) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                onPress={() => onGoalPress?.(goal)}
                isFirst={index === 0}
                isLast={index === goals.length - 1}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No goals set yet</Text>
          </View>
        )}
      </View>

      {/* Recent Sessions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT SESSIONS</Text>
          {onScheduleSession && (
            <Pressable
              style={styles.scheduleButton}
              onPress={() => {
                triggerHaptic('impactLight');
                onScheduleSession();
              }}
            >
              <Text style={styles.scheduleButtonText}>Schedule</Text>
            </Pressable>
          )}
        </View>
        {recentSessions.length > 0 ? (
          <View style={styles.listContainer}>
            {recentSessions.map((session, index) => (
              <SessionRow
                key={session.id}
                session={session}
                onPress={() => onSessionPress?.(session)}
                isFirst={index === 0}
                isLast={index === recentSessions.length - 1}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No sessions yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  scrollContent: {
    paddingBottom: IOS_SPACING.xxxl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.lg,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientName: {
    fontSize: IOS_TYPOGRAPHY.title2.fontSize,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  clientMeta: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
  },
  editButtonText: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },

  // Sections
  section: {
    marginTop: IOS_SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.sm,
  },
  sectionTitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
    paddingHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.sm,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleButton: {
    paddingHorizontal: IOS_SPACING.sm,
  },
  scheduleButtonText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },

  // Trend Card
  trendCard: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: IOS_SPACING.md,
  },
  trendLabel: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  trendChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: IOS_SPACING.xs,
  },
  changePercent: {
    fontSize: IOS_TYPOGRAPHY.title3.fontSize,
    fontWeight: '700',
  },
  trendPeriod: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },
  chartContainer: {
    alignItems: 'center',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: IOS_SPACING.lg,
    gap: IOS_SPACING.sm,
  },
  metricCard: {
    width: '48%',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.md,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  metricLabel: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: IOS_SPACING.xs,
  },
  metricValue: {
    fontSize: IOS_TYPOGRAPHY.title2.fontSize,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  metricUnit: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '400',
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: IOS_SPACING.xs,
  },
  metricChangeText: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    fontWeight: '500',
  },

  // List Container
  listContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },

  // Row styles
  rowFirst: {
    borderTopLeftRadius: IOS_RADIUS.md,
    borderTopRightRadius: IOS_RADIUS.md,
  },
  rowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: IOS_RADIUS.md,
    borderBottomRightRadius: IOS_RADIUS.md,
  },

  // Session Row
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: IOS_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionContent: {
    flex: 1,
  },
  sessionType: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  sessionMeta: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },

  // Goal Row
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  goalContent: {
    flex: 1,
    minWidth: 0,
  },
  goalTitle: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  goalTarget: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  goalTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  goalProgress: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
  },

  // Empty Section
  emptySection: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },
});

export default IOSClientDetail;
