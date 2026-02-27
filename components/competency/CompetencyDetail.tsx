import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Circle } from 'react-native-svg';
import type {
  CompetencyDetail as CompetencyDetailType,
  CompetencyAttempt,
  CompetencyReview,
  CompetencyStatus,
  SelfRating,
  PreceptorRating,
  FacultyDecision,
} from '@/types/competency';
import {
  COMPETENCY_STATUS_CONFIG,
  SELF_RATING_CONFIG,
  PRECEPTOR_RATING_CONFIG,
} from '@/types/competency';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CompetencyDetailProps {
  detail: CompetencyDetailType;
  isCurrentUserPreceptor?: boolean;
  isCurrentUserFaculty?: boolean;
  onLogAttempt?: () => void;
  onValidate?: (progressId: string) => void;
  onReview?: (progressId: string) => void;
  accentColor?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_ORDER: CompetencyStatus[] = [
  'not_started',
  'learning',
  'practicing',
  'checkoff_ready',
  'validated',
  'competent',
];

const RESPONSIBILITY_LABELS: Record<string, string[]> = {
  Student: ['learning', 'practicing'],
  Preceptor: ['checkoff_ready', 'validated'],
  Faculty: ['competent'],
};

const FACULTY_DECISION_CONFIG: Record<
  FacultyDecision,
  { label: string; color: string; bg: string; icon: string }
> = {
  approved: {
    label: 'Approved',
    color: '#15803D',
    bg: '#DCFCE7',
    icon: 'checkmark-circle',
  },
  needs_more_practice: {
    label: 'Needs More Practice',
    color: '#B45309',
    bg: '#FEF3C7',
    icon: 'refresh-circle',
  },
  remediation_required: {
    label: 'Remediation Required',
    color: '#DC2626',
    bg: '#FEE2E2',
    icon: 'warning',
  },
};

const NODE_RADIUS = 16;
const NODE_SPACING = 56;
const PIPELINE_WIDTH = (STATUS_ORDER.length - 1) * NODE_SPACING + NODE_RADIUS * 2;
const PIPELINE_HEIGHT = 72;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 30) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  if (diffDay > 0) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  if (diffHr > 0) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  return 'just now';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusOrdinal(status: CompetencyStatus): number {
  return COMPETENCY_STATUS_CONFIG[status].ordinal;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Pulsing ring shown around the current-status node in the pipeline. */
function PulseRing({ color }: { color: string }) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.6,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          borderColor: color,
          transform: [{ scale: pulseAnim }],
          opacity: pulseAnim.interpolate({
            inputRange: [1, 1.6],
            outputRange: [0.6, 0],
          }),
        },
      ]}
    />
  );
}

/** Horizontal sign-off chain pipeline. */
function SignOffPipeline({
  currentStatus,
  accentColor,
}: {
  currentStatus: CompetencyStatus;
  accentColor: string;
}) {
  const currentOrdinal = statusOrdinal(currentStatus);

  return (
    <View style={styles.pipelineContainer}>
      {/* SVG connecting lines */}
      <View style={styles.pipelineSvgRow}>
        <Svg width={PIPELINE_WIDTH} height={PIPELINE_HEIGHT}>
          {STATUS_ORDER.map((_, idx) => {
            if (idx === STATUS_ORDER.length - 1) return null;
            const x1 = NODE_RADIUS + idx * NODE_SPACING + NODE_RADIUS;
            const x2 = NODE_RADIUS + (idx + 1) * NODE_SPACING - NODE_RADIUS;
            const y = PIPELINE_HEIGHT / 2;
            const filled = idx < currentOrdinal;
            return (
              <Line
                key={`line-${idx}`}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={filled ? '#15803D' : '#D1D5DB'}
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}
          {STATUS_ORDER.map((status, idx) => {
            const cx = NODE_RADIUS + idx * NODE_SPACING;
            const cy = PIPELINE_HEIGHT / 2;
            const ordinal = statusOrdinal(status);
            const isComplete = ordinal < currentOrdinal;
            const isCurrent = ordinal === currentOrdinal;
            return (
              <Circle
                key={`node-${status}`}
                cx={cx}
                cy={cy}
                r={NODE_RADIUS - 1}
                fill={
                  isComplete
                    ? '#15803D'
                    : isCurrent
                      ? accentColor
                      : '#FFFFFF'
                }
                stroke={
                  isComplete
                    ? '#15803D'
                    : isCurrent
                      ? accentColor
                      : '#D1D5DB'
                }
                strokeWidth={2}
              />
            );
          })}
        </Svg>

        {/* Overlay: icons + pulse ring on current node */}
        {STATUS_ORDER.map((status, idx) => {
          const ordinal = statusOrdinal(status);
          const isComplete = ordinal < currentOrdinal;
          const isCurrent = ordinal === currentOrdinal;
          const cfg = COMPETENCY_STATUS_CONFIG[status];
          const left = idx * NODE_SPACING;

          return (
            <View
              key={`overlay-${status}`}
              style={[
                styles.nodeOverlay,
                { left, width: NODE_RADIUS * 2 },
              ]}
            >
              {isCurrent && <PulseRing color={accentColor} />}
              <Ionicons
                name={
                  isComplete
                    ? 'checkmark'
                    : (cfg.icon as any)
                }
                size={isComplete || isCurrent ? 16 : 12}
                color={
                  isComplete || isCurrent ? '#FFFFFF' : '#9CA3AF'
                }
              />
            </View>
          );
        })}
      </View>

      {/* Status labels under each node */}
      <View style={[styles.pipelineLabels, { width: PIPELINE_WIDTH }]}>
        {STATUS_ORDER.map((status, idx) => {
          const isCurrent = statusOrdinal(status) === currentOrdinal;
          return (
            <Text
              key={`label-${status}`}
              style={[
                styles.pipelineLabel,
                {
                  left: idx * NODE_SPACING - 20,
                  width: NODE_RADIUS * 2 + 40,
                  fontWeight: isCurrent ? '700' : '400',
                  color: isCurrent ? accentColor : '#6B7280',
                },
              ]}
              numberOfLines={1}
            >
              {COMPETENCY_STATUS_CONFIG[status].label}
            </Text>
          );
        })}
      </View>

      {/* Responsibility row */}
      <View style={styles.responsibilityRow}>
        {Object.entries(RESPONSIBILITY_LABELS).map(([role, statuses]) => {
          const startIdx = STATUS_ORDER.indexOf(statuses[0]);
          const endIdx = STATUS_ORDER.indexOf(statuses[statuses.length - 1]);
          const left = startIdx * NODE_SPACING;
          const width = (endIdx - startIdx) * NODE_SPACING + NODE_RADIUS * 2;
          return (
            <View key={role} style={[styles.responsibilityBadge, { left, width }]}>
              <Text style={styles.responsibilityText}>{role}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Badge for a self-rating value. */
function SelfRatingBadge({ rating }: { rating: SelfRating }) {
  const cfg = SELF_RATING_CONFIG[rating];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.color + '18' }]}>
      <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

/** Badge for a preceptor rating value. */
function PreceptorRatingBadge({ rating }: { rating: PreceptorRating }) {
  const cfg = PRECEPTOR_RATING_CONFIG[rating];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.color + '18' }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

/** Badge for a faculty decision. */
function FacultyDecisionBadge({ decision }: { decision: FacultyDecision }) {
  const cfg = FACULTY_DECISION_CONFIG[decision];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

/** Card showing a single attempt. */
function AttemptCard({ attempt }: { attempt: CompetencyAttempt }) {
  const selfRatingColor = attempt.self_rating
    ? SELF_RATING_CONFIG[attempt.self_rating].color
    : '#D1D5DB';

  return (
    <View style={[styles.attemptCard, { borderLeftColor: selfRatingColor }]}>
      <View style={styles.attemptHeader}>
        <Text style={styles.attemptNumber}>
          Attempt #{attempt.attempt_number}
        </Text>
        <Text style={styles.attemptDate}>{formatDate(attempt.created_at)}</Text>
      </View>

      {attempt.clinical_context && (
        <View style={styles.clinicalContextRow}>
          <Ionicons name="medkit-outline" size={14} color="#6B7280" />
          <Text style={styles.clinicalContextText}>
            {attempt.clinical_context}
          </Text>
        </View>
      )}

      {attempt.self_rating && (
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Self-rating:</Text>
          <SelfRatingBadge rating={attempt.self_rating} />
        </View>
      )}

      {attempt.self_notes && (
        <Text style={styles.notesText}>{attempt.self_notes}</Text>
      )}

      {/* Preceptor section */}
      {attempt.preceptor_reviewed_at ? (
        <View style={styles.preceptorSection}>
          <View style={styles.preceptorDivider} />
          <Text style={styles.preceptorSectionTitle}>Preceptor Review</Text>
          {attempt.preceptor_rating && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Rating:</Text>
              <PreceptorRatingBadge rating={attempt.preceptor_rating} />
            </View>
          )}
          {attempt.preceptor_notes && (
            <Text style={styles.notesText}>{attempt.preceptor_notes}</Text>
          )}
          <Text style={styles.reviewedDate}>
            Reviewed {formatDate(attempt.preceptor_reviewed_at)}
          </Text>
        </View>
      ) : attempt.preceptor_id ? (
        <View style={styles.awaitingReviewRow}>
          <Ionicons name="time-outline" size={14} color="#B45309" />
          <Text style={styles.awaitingReviewText}>
            Awaiting preceptor review
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Card showing a faculty review. */
function ReviewCard({ review }: { review: CompetencyReview }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <FacultyDecisionBadge decision={review.decision} />
        <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
      </View>
      {review.notes && (
        <Text style={styles.notesText}>{review.notes}</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CompetencyDetail({
  detail,
  isCurrentUserPreceptor = false,
  isCurrentUserFaculty = false,
  onLogAttempt,
  onValidate,
  onReview,
  accentColor = '#0097A7',
}: CompetencyDetailProps) {
  const { competency, progress, attempts, reviews } = detail;
  const currentStatus: CompetencyStatus = progress?.status ?? 'not_started';
  const statusCfg = COMPETENCY_STATUS_CONFIG[currentStatus];

  const sortedAttempts = useMemo(
    () =>
      [...attempts].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [attempts],
  );

  const sortedReviews = useMemo(
    () =>
      [...reviews].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [reviews],
  );

  // Determine the action button for the current user
  const actionButton = useMemo(() => {
    if (!progress) {
      // No progress record yet -- student can log first attempt
      if (onLogAttempt) {
        return {
          label: 'Log New Attempt',
          icon: 'add-circle-outline' as const,
          onPress: onLogAttempt,
        };
      }
      return null;
    }

    const ord = statusOrdinal(currentStatus);

    // Student: can log attempts while status < validated
    if (ord < 4 && onLogAttempt) {
      return {
        label: 'Log New Attempt',
        icon: 'add-circle-outline' as const,
        onPress: onLogAttempt,
      };
    }

    // Preceptor: can validate when checkoff_ready
    if (
      isCurrentUserPreceptor &&
      currentStatus === 'checkoff_ready' &&
      onValidate
    ) {
      return {
        label: 'Validate Competency',
        icon: 'shield-checkmark-outline' as const,
        onPress: () => onValidate(progress.id),
      };
    }

    // Faculty: can review when validated
    if (
      isCurrentUserFaculty &&
      currentStatus === 'validated' &&
      onReview
    ) {
      return {
        label: 'Review & Approve',
        icon: 'ribbon-outline' as const,
        onPress: () => onReview(progress.id),
      };
    }

    return null;
  }, [
    progress,
    currentStatus,
    isCurrentUserPreceptor,
    isCurrentUserFaculty,
    onLogAttempt,
    onValidate,
    onReview,
  ]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ----------------------------------------------------------------- */}
      {/* 1. Competency Header                                              */}
      {/* ----------------------------------------------------------------- */}
      <View style={styles.card}>
        <Text style={styles.competencyNumber}>
          Competency #{competency.competency_number}
        </Text>
        <Text style={styles.competencyTitle}>{competency.title}</Text>

        <View style={styles.badgeRow}>
          <View style={[styles.categoryBadge, { backgroundColor: accentColor + '18' }]}>
            <Text style={[styles.categoryBadgeText, { color: accentColor }]}>
              {competency.category}
            </Text>
          </View>
          {competency.requires_supervision && (
            <View style={styles.supervisionBadge}>
              <Ionicons name="eye-outline" size={13} color="#B45309" />
              <Text style={styles.supervisionBadgeText}>
                Requires Supervision
              </Text>
            </View>
          )}
        </View>

        {competency.description && (
          <Text style={styles.descriptionText}>{competency.description}</Text>
        )}
      </View>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Sign-Off Chain Pipeline                                        */}
      {/* ----------------------------------------------------------------- */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sign-Off Chain</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pipelineScrollContent}
        >
          <SignOffPipeline
            currentStatus={currentStatus}
            accentColor={accentColor}
          />
        </ScrollView>
      </View>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Current Status Card                                            */}
      {/* ----------------------------------------------------------------- */}
      <View style={[styles.card, styles.statusCard]}>
        <View style={styles.statusHeaderRow}>
          <View
            style={[
              styles.statusIconCircle,
              { backgroundColor: statusCfg.bg },
            ]}
          >
            <Ionicons
              name={statusCfg.icon as any}
              size={28}
              color={statusCfg.color}
            />
          </View>
          <View style={styles.statusHeaderText}>
            <Text style={[styles.statusLabel, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
            <Text style={styles.statusSubLabel}>Current Status</Text>
          </View>
        </View>

        <View style={styles.statusMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {progress?.attempts_count ?? 0}
            </Text>
            <Text style={styles.metricLabel}>Attempts</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {progress?.last_attempt_at
                ? formatRelativeDate(progress.last_attempt_at)
                : '--'}
            </Text>
            <Text style={styles.metricLabel}>Last Attempt</Text>
          </View>
        </View>

        {progress?.validated_at && (
          <View style={styles.signOffRow}>
            <Ionicons
              name="shield-checkmark"
              size={16}
              color="#15803D"
            />
            <Text style={styles.signOffText}>
              Validated {formatDate(progress.validated_at)}
            </Text>
          </View>
        )}

        {progress?.approved_at && (
          <View style={styles.signOffRow}>
            <Ionicons name="ribbon" size={16} color="#047857" />
            <Text style={styles.signOffText}>
              Approved {formatDate(progress.approved_at)}
            </Text>
          </View>
        )}

        {actionButton && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: accentColor }]}
            onPress={actionButton.onPress}
            activeOpacity={0.8}
          >
            <Ionicons
              name={actionButton.icon as any}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.actionButtonText}>{actionButton.label}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Attempt History                                                */}
      {/* ----------------------------------------------------------------- */}
      {sortedAttempts.length > 0 && (
        <View>
          <Text style={styles.sectionHeading}>
            Attempt History ({sortedAttempts.length})
          </Text>
          {sortedAttempts.map((attempt) => (
            <AttemptCard key={attempt.id} attempt={attempt} />
          ))}
        </View>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 5. Faculty Reviews                                                */}
      {/* ----------------------------------------------------------------- */}
      {sortedReviews.length > 0 && (
        <View>
          <Text style={styles.sectionHeading}>
            Faculty Reviews ({sortedReviews.length})
          </Text>
          {sortedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </View>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 6. Related Lesson Link                                            */}
      {/* ----------------------------------------------------------------- */}
      <View style={[styles.card, styles.lessonLinkCard]}>
        <View style={styles.lessonLinkRow}>
          <View
            style={[
              styles.lessonLinkIcon,
              { backgroundColor: accentColor + '18' },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={22}
              color={accentColor}
            />
          </View>
          <View style={styles.lessonLinkText}>
            <Text style={styles.lessonLinkTitle}>Study this skill</Text>
            <Text style={styles.lessonLinkSubtitle}>
              Review the lesson for Competency #{competency.competency_number}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </View>

      {/* Bottom spacer */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Section titles
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    marginTop: 6,
    paddingHorizontal: 2,
  },

  // 1. Competency Header
  competencyNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  competencyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 28,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  supervisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  supervisionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
  },

  // 2. Pipeline
  pipelineContainer: {
    alignItems: 'flex-start',
  },
  pipelineScrollContent: {
    paddingVertical: 4,
    paddingRight: 20,
  },
  pipelineSvgRow: {
    width: PIPELINE_WIDTH,
    height: PIPELINE_HEIGHT,
    position: 'relative',
  },
  nodeOverlay: {
    position: 'absolute',
    top: 0,
    height: PIPELINE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: NODE_RADIUS * 2 + 8,
    height: NODE_RADIUS * 2 + 8,
    borderRadius: NODE_RADIUS + 4,
    borderWidth: 2,
  },
  pipelineLabels: {
    position: 'relative',
    height: 18,
    marginTop: 4,
  },
  pipelineLabel: {
    position: 'absolute',
    fontSize: 9,
    textAlign: 'center',
    top: 0,
  },
  responsibilityRow: {
    position: 'relative',
    width: PIPELINE_WIDTH,
    height: 24,
    marginTop: 8,
  },
  responsibilityBadge: {
    position: 'absolute',
    top: 0,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  responsibilityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // 3. Current Status Card
  statusCard: {
    borderTopWidth: 3,
    borderTopColor: '#E5E7EB',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  statusHeaderText: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '800',
  },
  statusSubLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  signOffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  signOffText: {
    fontSize: 13,
    color: '#374151',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 4. Attempt Cards
  attemptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attemptNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  attemptDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  clinicalContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clinicalContextText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ratingLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  notesText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 4,
  },

  // Preceptor section inside attempt card
  preceptorSection: {
    marginTop: 4,
  },
  preceptorDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  preceptorSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  reviewedDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  awaitingReviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  awaitingReviewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },

  // Badges
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // 5. Review Cards
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // 6. Lesson Link Card
  lessonLinkCard: {
    marginTop: 6,
  },
  lessonLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lessonLinkText: {
    flex: 1,
  },
  lessonLinkTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  lessonLinkSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
