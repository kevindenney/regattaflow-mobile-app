/**
 * Activity Catalog Service
 *
 * Fetches activity templates from organizations and coaches that the user follows.
 * Groups templates by publisher for the catalog browse UI.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import {
  rowToActivityTemplate,
  rowToActivityEnrollment,
} from '@/types/activities';
import type {
  ActivityTemplate,
  ActivityTemplateRow,
  ActivityEnrollment,
  ActivityEnrollmentRow,
  CatalogFilters,
  CatalogGroup,
  CreateActivityTemplateInput,
  UpdateActivityTemplateInput,
} from '@/types/activities';

const logger = createLogger('activityCatalog');

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Fetch published activity templates for a given interest,
 * grouped by publisher.
 */
export async function getCatalogForInterest(
  interestId: string,
  options?: {
    eventType?: string;
    limit?: number;
  },
): Promise<ActivityTemplate[]> {
  let query = supabase
    .from('betterat_activity_templates')
    .select('*')
    .eq('interest_id', interestId)
    .eq('published', true)
    .order('enrollment_count', { ascending: false });

  if (options?.eventType) {
    query = query.eq('event_type', options.eventType);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('[getCatalogForInterest] Error:', error);
    throw error;
  }

  return (data as ActivityTemplateRow[]).map(rowToActivityTemplate);
}

/**
 * Fetch templates published by a specific organization.
 */
export async function getTemplatesByOrg(orgId: string): Promise<ActivityTemplate[]> {
  const { data, error } = await supabase
    .from('betterat_activity_templates')
    .select('*')
    .eq('publisher_type', 'organization')
    .eq('publisher_id', orgId)
    .eq('published', true)
    .order('scheduled_date', { ascending: true });

  if (error) {
    logger.error('[getTemplatesByOrg] Error:', error);
    throw error;
  }

  return (data as ActivityTemplateRow[]).map(rowToActivityTemplate);
}

/**
 * Fetch templates published by a specific user (coach).
 */
export async function getTemplatesByUser(userId: string): Promise<ActivityTemplate[]> {
  const { data, error } = await supabase
    .from('betterat_activity_templates')
    .select('*')
    .eq('publisher_type', 'user')
    .eq('publisher_id', userId)
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('[getTemplatesByUser] Error:', error);
    throw error;
  }

  return (data as ActivityTemplateRow[]).map(rowToActivityTemplate);
}

/**
 * Get a single template by ID.
 */
export async function getTemplate(templateId: string): Promise<ActivityTemplate | null> {
  const { data, error } = await supabase
    .from('betterat_activity_templates')
    .select('*')
    .eq('id', templateId)
    .maybeSingle();

  if (error) {
    logger.error('[getTemplate] Error:', error);
    throw error;
  }

  return data ? rowToActivityTemplate(data as ActivityTemplateRow) : null;
}

/**
 * Search templates by title or tags.
 */
export async function searchTemplates(
  interestId: string,
  query: string,
): Promise<ActivityTemplate[]> {
  const { data, error } = await supabase
    .from('betterat_activity_templates')
    .select('*')
    .eq('interest_id', interestId)
    .eq('published', true)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('enrollment_count', { ascending: false })
    .limit(20);

  if (error) {
    logger.error('[searchTemplates] Error:', error);
    throw error;
  }

  return (data as ActivityTemplateRow[]).map(rowToActivityTemplate);
}

/**
 * Group templates by publisher for catalog display.
 */
export function groupTemplatesByPublisher(templates: ActivityTemplate[]): CatalogGroup[] {
  const groups = new Map<string, CatalogGroup>();

  for (const t of templates) {
    const key = `${t.publisherType}-${t.publisherId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        publisherName: t.publisherName ?? 'Unknown',
        publisherLogoUrl: t.publisherLogoUrl,
        publisherType: t.publisherType,
        publisherId: t.publisherId,
        templates: [],
      });
    }
    groups.get(key)!.templates.push(t);
  }

  return Array.from(groups.values());
}

// =============================================================================
// ENROLLMENT
// =============================================================================

/**
 * Enroll in a template (add to user's timeline).
 */
export async function enrollInTemplate(
  userId: string,
  templateId: string,
  eventId?: string,
): Promise<ActivityEnrollment> {
  const { data, error } = await supabase
    .from('betterat_activity_enrollments')
    .insert({
      user_id: userId,
      template_id: templateId,
      event_id: eventId ?? null,
    })
    .select('*')
    .single();

  if (error) {
    logger.error('[enrollInTemplate] Error:', error);
    throw error;
  }

  // Increment enrollment count on the template
  await supabase.rpc('increment_enrollment_count', { template_id: templateId }).catch(() => {
    // Non-critical — just a counter
    logger.warn('[enrollInTemplate] Failed to increment count for:', templateId);
  });

  return rowToActivityEnrollment(data as ActivityEnrollmentRow);
}

/**
 * Check if a user is enrolled in a template.
 */
export async function isEnrolled(
  userId: string,
  templateId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('betterat_activity_enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('template_id', templateId)
    .maybeSingle();

  return !!data;
}

/**
 * Get all enrollments for a user.
 */
export async function getUserEnrollments(userId: string): Promise<ActivityEnrollment[]> {
  const { data, error } = await supabase
    .from('betterat_activity_enrollments')
    .select('*')
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });

  if (error) {
    logger.error('[getUserEnrollments] Error:', error);
    throw error;
  }

  return (data as ActivityEnrollmentRow[]).map(rowToActivityEnrollment);
}

// =============================================================================
// MUTATIONS (for publishers)
// =============================================================================

/**
 * Create a new activity template.
 */
export async function createTemplate(
  input: CreateActivityTemplateInput,
): Promise<ActivityTemplate> {
  const { data, error } = await supabase
    .from('betterat_activity_templates')
    .insert({
      publisher_type: input.publisherType,
      publisher_id: input.publisherId,
      interest_id: input.interestId,
      event_type: input.eventType,
      event_subtype: input.eventSubtype ?? null,
      title: input.title,
      description: input.description ?? null,
      scheduled_date: input.scheduledDate ?? null,
      recurrence: input.recurrence ?? null,
      location: input.location ?? null,
      prefilled_data: input.prefilledData ?? {},
      tags: input.tags ?? [],
    })
    .select('*')
    .single();

  if (error) {
    logger.error('[createTemplate] Error:', error);
    throw error;
  }

  return rowToActivityTemplate(data as ActivityTemplateRow);
}

/**
 * Update an existing activity template.
 */
export async function updateTemplate(
  templateId: string,
  input: UpdateActivityTemplateInput,
): Promise<ActivityTemplate> {
  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.scheduledDate !== undefined) updates.scheduled_date = input.scheduledDate;
  if (input.recurrence !== undefined) updates.recurrence = input.recurrence;
  if (input.location !== undefined) updates.location = input.location;
  if (input.prefilledData !== undefined) updates.prefilled_data = input.prefilledData;
  if (input.tags !== undefined) updates.tags = input.tags;
  if (input.published !== undefined) updates.published = input.published;

  const { data, error } = await supabase
    .from('betterat_activity_templates')
    .update(updates)
    .eq('id', templateId)
    .select('*')
    .single();

  if (error) {
    logger.error('[updateTemplate] Error:', error);
    throw error;
  }

  return rowToActivityTemplate(data as ActivityTemplateRow);
}

/**
 * Delete an activity template.
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('betterat_activity_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    logger.error('[deleteTemplate] Error:', error);
    throw error;
  }
}
