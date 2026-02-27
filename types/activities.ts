/**
 * Activity Catalog Types
 *
 * Types for activity templates published by organizations and coaches,
 * and user enrollments in those templates.
 */

// =============================================================================
// ACTIVITY TEMPLATE
// =============================================================================

export type PublisherType = 'organization' | 'user';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number;       // 0=Sunday ... 6=Saturday
  dayOfMonth?: number;
  startDate?: string;
  endDate?: string;
  count?: number;
}

export interface ActivityTemplate {
  id: string;
  publisherType: PublisherType;
  publisherId: string;
  interestId: string;
  eventType: string;
  eventSubtype?: string;
  title: string;
  description?: string;
  scheduledDate?: string;
  recurrence?: RecurrenceRule;
  location?: string;
  prefilledData: Record<string, unknown>;
  tags: string[];
  published: boolean;
  enrollmentCount: number;
  createdAt: string;
  updatedAt: string;
  /** Joined data — publisher name/logo */
  publisherName?: string;
  publisherLogoUrl?: string;
}

export interface ActivityTemplateRow {
  id: string;
  publisher_type: string;
  publisher_id: string;
  interest_id: string;
  event_type: string;
  event_subtype: string | null;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  recurrence: RecurrenceRule | null;
  location: string | null;
  prefilled_data: Record<string, unknown>;
  tags: string[];
  published: boolean;
  enrollment_count: number;
  created_at: string;
  updated_at: string;
}

export function rowToActivityTemplate(row: ActivityTemplateRow): ActivityTemplate {
  return {
    id: row.id,
    publisherType: row.publisher_type as PublisherType,
    publisherId: row.publisher_id,
    interestId: row.interest_id,
    eventType: row.event_type,
    eventSubtype: row.event_subtype ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    scheduledDate: row.scheduled_date ?? undefined,
    recurrence: row.recurrence ?? undefined,
    location: row.location ?? undefined,
    prefilledData: row.prefilled_data ?? {},
    tags: row.tags ?? [],
    published: row.published,
    enrollmentCount: row.enrollment_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// ACTIVITY ENROLLMENT
// =============================================================================

export interface ActivityEnrollment {
  id: string;
  userId: string;
  templateId: string;
  eventId?: string;
  enrolledAt: string;
}

export interface ActivityEnrollmentRow {
  id: string;
  user_id: string;
  template_id: string;
  event_id: string | null;
  enrolled_at: string;
}

export function rowToActivityEnrollment(row: ActivityEnrollmentRow): ActivityEnrollment {
  return {
    id: row.id,
    userId: row.user_id,
    templateId: row.template_id,
    eventId: row.event_id ?? undefined,
    enrolledAt: row.enrolled_at,
  };
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface CreateActivityTemplateInput {
  publisherType: PublisherType;
  publisherId: string;
  interestId: string;
  eventType: string;
  eventSubtype?: string;
  title: string;
  description?: string;
  scheduledDate?: string;
  recurrence?: RecurrenceRule;
  location?: string;
  prefilledData?: Record<string, unknown>;
  tags?: string[];
}

export interface UpdateActivityTemplateInput {
  title?: string;
  description?: string;
  scheduledDate?: string;
  recurrence?: RecurrenceRule;
  location?: string;
  prefilledData?: Record<string, unknown>;
  tags?: string[];
  published?: boolean;
}

export interface EnrollInTemplateInput {
  templateId: string;
  eventId?: string;
}

// =============================================================================
// CATALOG QUERY TYPES
// =============================================================================

export interface CatalogFilters {
  interestId: string;
  eventType?: string;
  publisherType?: PublisherType;
  publisherId?: string;
  tags?: string[];
  search?: string;
}

export interface CatalogGroup {
  publisherName: string;
  publisherLogoUrl?: string;
  publisherType: PublisherType;
  publisherId: string;
  templates: ActivityTemplate[];
}
