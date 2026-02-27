/**
 * Onboarding Entity Extractor
 * Uses AI to extract sailing-related entities from free-form text
 * Calls Supabase Edge Function to protect API keys
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('OnboardingEntityExtractor');

export interface ExtractedEntities {
  // Basic Info
  clubs?: { name: string; confidence: number }[];
  venues?: { name: string; location?: string; confidence: number }[];
  boatClasses?: { name: string; confidence: number }[];
  sailNumbers?: { number: string; boatClass?: string; confidence: number }[];
  boatNames?: { name: string; sailNumber?: string; confidence: number }[];

  // Role & People
  role?: 'owner' | 'crew' | 'both';
  crewMembers?: { name: string; position?: string }[];

  // Equipment
  sailMakers?: string[];
  hullMakers?: string[];
  mastMakers?: string[];
  rigMakers?: string[];

  // Associations & Memberships
  classAssociations?: string[];

  // URLs Found
  urls: {
    url: string;
    type: 'club' | 'class' | 'calendar' | 'unknown';
    confidence: number;
  }[];

  // Raw text for reference
  originalText: string;
}

export async function extractEntitiesFromText(
  text: string
): Promise<ExtractedEntities> {
  try {
    // Call Supabase Edge Function to extract entities
    const { data, error } = await supabase.functions.invoke('extract-onboarding-entities', {
      body: { text },
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from extraction service');
    }

    return data as ExtractedEntities;
  } catch (error) {
    logger.error('Error extracting entities', error);
    // Return minimal structure on error with regex fallback
    return {
      urls: extractURLsRegex(text),
      originalText: text,
    };
  }
}

/**
 * Fallback: Extract URLs using regex
 */
function extractURLsRegex(text: string): {
  url: string;
  type: 'club' | 'class' | 'calendar' | 'unknown';
  confidence: number;
}[] {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-z0-9-]+\.(com|org|net|edu|gov|hk|uk|au)[^\s]*)/gi;
  const matches = text.match(urlRegex) || [];

  return matches.map(url => {
    // Normalize URL
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Guess type from URL path
    let type: 'club' | 'class' | 'calendar' | 'unknown' = 'unknown';
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('class') || lowerUrl.includes('dragon') || lowerUrl.includes('j70')) {
      type = 'class';
    } else if (lowerUrl.includes('calendar') || lowerUrl.includes('event') || lowerUrl.includes('race')) {
      type = 'calendar';
    } else if (lowerUrl.includes('club') || lowerUrl.includes('yacht') || lowerUrl.includes('sailing')) {
      type = 'club';
    }

    return {
      url: normalizedUrl,
      type,
      confidence: 0.7,
    };
  });
}

/**
 * Discover URLs for entities using AI
 */
export async function discoverURLsForEntities(
  entities: ExtractedEntities
): Promise<{ url: string; type: string; source: string; confidence: number }[]> {
  try {
    // Call Supabase Edge Function to discover URLs
    const { data, error } = await supabase.functions.invoke('discover-entity-urls', {
      body: { entities },
    });

    if (error) {
      throw error;
    }

    if (!data || !data.discovered) {
      return [];
    }

    return data.discovered;
  } catch (error) {
    logger.error('Error discovering URLs', error);
    return [];
  }
}
