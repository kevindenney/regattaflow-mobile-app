/**
 * UrlMetadataService — extracts Open Graph / meta tag metadata from any URL
 * via the extract-url-metadata edge function. Falls back to YouTube oEmbed
 * for YouTube URLs (richer data).
 */

import { invokeAIEdgeFunction } from '@/services/ai/invokeAIEdgeFunction';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('UrlMetadataService');

export interface UrlMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  author: string | null;
}

/**
 * Fetch metadata (title, description, image, author) for any URL.
 * Uses the extract-url-metadata edge function which parses OG tags server-side.
 */
export async function fetchUrlMetadata(url: string): Promise<UrlMetadata | null> {
  try {
    const { data, error } = await invokeAIEdgeFunction<UrlMetadata>('extract-url-metadata', {
      body: { url },
      timeoutMs: 15_000,
    });

    if (error || !data) {
      logger.error('URL metadata extraction failed:', error);
      return null;
    }

    // Return null if we got nothing useful
    if (!data.title && !data.description && !data.author) {
      return null;
    }

    return data;
  } catch (err) {
    logger.error('fetchUrlMetadata error:', err);
    return null;
  }
}
