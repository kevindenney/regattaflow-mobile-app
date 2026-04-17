import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
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

/** Short labels that fit under pipeline nodes without overlap. */
const PIPELINE_SHORT_LABELS: Record<CompetencyStatus, string> = {
  not_started: 'Not\nStarted',
  learning: 'Learning',
  practicing: 'Practicing',
  checkoff_ready: 'Checkoff\nReady',
  validated: 'Validated',
  competent: 'Competent',
};

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

/** Horizontal sign-off chain pipeline — pure flexbox columns. */
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
      {/* Main row: columns (node+label) with flex lines between them */}
      <View style={styles.pipelineRow}>
        {STATUS_ORDER.map((status, idx) => {
          const ordinal = statusOrdinal(status);
          const isComplete = ordinal < currentOrdinal;
          const isCurrent = ordinal === currentOrdinal;
          const cfg = COMPETENCY_STATUS_CONFIG[status];

          const nodeColor = isComplete
            ? '#15803D'
            : isCurrent
              ? accentColor
              : '#FFFFFF';
          const borderColor = isComplete
            ? '#15803D'
            : isCurrent
              ? accentColor
              : '#D1D5DB';

          return (
            <React.Fragment key={status}>
              {/* Connecting line (except before first node) */}
              {idx > 0 && (
                <View style={styles.pipelineLineWrap}>
                  <View
                    style={[
                      styles.pipelineLine,
                      { backgroundColor: idx <= currentOrdinal ? '#15803D' : '#D1D5DB' },
                    ]}
                  />
                </View>
              )}
              {/* Column: node on top, label below */}
              <View style={styles.pipelineColumn}>
                <View style={styles.pipelineNodeWrap}>
                  {isCurrent && <PulseRing color={accentColor} />}
                  <View
                    style={[
                      styles.pipelineNode,
                      { backgroundColor: nodeColor, borderColor },
                    ]}
                  >
                    <Ionicons
                      name={isComplete ? 'checkmark' : (cfg.icon as any)}
                      size={isComplete || isCurrent ? 16 : 12}
                      color={isComplete || isCurrent ? '#FFFFFF' : '#9CA3AF'}
                    />
                  </View>
                </View>
                <Text
                  style={[
                    styles.pipelineLabel,
                    {
                      fontWeight: isCurrent ? '700' : '400',
                      color: isCurrent ? accentColor : '#6B7280',
                    },
                  ]}
                  numberOfLines={2}
                >
                  {PIPELINE_SHORT_LABELS[status]}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {/* Responsibility row */}
      <View style={styles.responsibilityFlexRow}>
        <View style={[styles.responsibilityBadge, { flex: 3 }]}>
          <Text style={styles.responsibilityText}>Student</Text>
        </View>
        <View style={{ width: 4 }} />
        <View style={[styles.responsibilityBadge, { flex: 3 }]}>
          <Text style={styles.responsibilityText}>Preceptor</Text>
        </View>
        <View style={{ width: 4 }} />
        <View style={[styles.responsibilityBadge, { flex: 2 }]}>
          <Text style={styles.responsibilityText}>Faculty</Text>
        </View>
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
  const { user } = useAuth();
  const { competency, progress, attempts, reviews } = detail;
  const currentStatus: CompetencyStatus = progress?.status ?? 'not_started';

  // Fetch steps that reference this competency via plan.competency_ids
  const { data: relatedSteps } = useQuery({
    queryKey: ['competency-steps', competency.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('betterat_timeline_steps')
        .select('id, title, status, created_at, plan, review')
        .eq('user_id', user.id)
        .not('plan', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      // Filter client-side: plan.competency_ids includes this competency
      return (data ?? []).filter((row: any) => {
        const ids = row.plan?.competency_ids;
        return Array.isArray(ids) && ids.includes(competency.id);
      }).slice(0, 10);
    },
    enabled: !!user?.id,
  });
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
      {/* 6. Related Steps with Evidence                                    */}
      {/* ----------------------------------------------------------------- */}
      {(relatedSteps ?? []).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Related Steps ({(relatedSteps ?? []).length})
          </Text>
          <View style={{ gap: 8 }}>
            {(relatedSteps ?? []).map((step: any) => {
              // Find this competency's assessment evidence from the step review
              const assessment = step.review?.competency_assessment;
              const evidence = [
                ...(assessment?.planned_competency_results ?? []),
                ...(assessment?.additional_competencies_found ?? []),
              ].find(
                (item: any) =>
                  item.competency_id === competency.id ||
                  item.competency_title === competency.title,
              );

              return (
                <Pressable
                  key={step.id}
                  style={styles.relatedStepCard}
                  onPress={() => router.push(`/step/${step.id}` as any)}
                >
                  <View style={styles.relatedStepRow}>
                    <Ionicons
                      name={
                        step.status === 'completed'
                          ? 'checkmark-circle'
                          : step.status === 'in_progress'
                            ? 'time-outline'
                            : 'ellipse-outline'
                      }
                      size={18}
                      color={
                        step.status === 'completed'
                          ? '#15803D'
                          : step.status === 'in_progress'
                            ? accentColor
                            : '#9CA3AF'
                      }
                    />
                    <Text style={styles.relatedStepTitle} numberOfLines={1}>
                      {step.title || 'Untitled step'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                  </View>

                  {/* Evidence from AI assessment */}
                  {evidence && (
                    <View style={styles.evidenceRow}>
                      <View
                        style={[
                          styles.evidenceLevelBadge,
                          {
                            backgroundColor:
                              evidence.demonstrated_level === 'proficient'
                                ? '#DCFCE7'
                                : evidence.demonstrated_level === 'developing'
                                  ? '#FEF3C7'
                                  : evidence.demonstrated_level === 'initial_exposure'
                                    ? '#DBEAFE'
                                    : '#FEE2E2',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.evidenceLevelText,
                            {
                              color:
                                evidence.demonstrated_level === 'proficient'
                                  ? '#15803D'
                                  : evidence.demonstrated_level === 'developing'
                                    ? '#B45309'
                                    : evidence.demonstrated_level === 'initial_exposure'
                                      ? '#2563EB'
                                      : '#DC2626',
                            },
                          ]}
                        >
                          {evidence.demonstrated_level === 'initial_exposure'
                            ? 'Initial Exposure'
                            : evidence.demonstrated_level === 'not_demonstrated'
                              ? 'Not Demonstrated'
                              : evidence.demonstrated_level.charAt(0).toUpperCase() +
                                evidence.demonstrated_level.slice(1)}
                        </Text>
                      </View>
                      {evidence.evidence_basis && (
                        <Text style={styles.evidenceBasis} numberOfLines={2}>
                          {evidence.evidence_basis}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Step date */}
                  <Text style={styles.relatedStepDate}>
                    {formatRelativeDate(step.created_at)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

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
    gap: 8,
  },
  pipelineScrollContent: {
    paddingVertical: 4,
    paddingRight: 20,
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pipelineColumn: {
    alignItems: 'center',
    gap: 4,
    minWidth: 52,
  },
  pipelineLineWrap: {
    flex: 1,
    justifyContent: 'center',
    height: NODE_RADIUS * 2,
    paddingHorizontal: 2,
  },
  pipelineLine: {
    height: 3,
    borderRadius: 1.5,
  },
  pipelineNodeWrap: {
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipelineNode: {
    width: NODE_RADIUS * 2 - 2,
    height: NODE_RADIUS * 2 - 2,
    borderRadius: NODE_RADIUS,
    borderWidth: 2,
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
  pipelineLabel: {
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
  responsibilityFlexRow: {
    flexDirection: 'row',
  },
  responsibilityBadge: {
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

  // 6. Related Steps with Evidence
  relatedStepCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  relatedStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  relatedStepTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  relatedStepDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  evidenceRow: {
    gap: 4,
    paddingLeft: 26,
  },
  evidenceLevelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  evidenceLevelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  evidenceBasis: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },
});
