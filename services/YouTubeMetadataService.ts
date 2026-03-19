/**
 * YouTubeMetadataService — extracts metadata from YouTube videos
 * using the public oEmbed API (no API key required).
 */

import { fetchWithTimeout } from '@/lib/utils/fetchWithTimeout';
import { invokeAIEdgeFunction } from '@/services/ai/invokeAIEdgeFunction';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('YouTubeMetadataService');

export interface YouTubeMetadata {
  title: string;
  author: string;
  thumbnailUrl: string | null;
  description: string | null;
}

/**
 * Extract the video ID from a YouTube URL.
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Fetch basic metadata using YouTube's oEmbed endpoint.
 * No API key needed — returns title, author_name, thumbnail_url.
 */
async function fetchOEmbed(videoUrl: string): Promise<{
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
} | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    const res = await fetchWithTimeout(oembedUrl, { timeout: 10_000 });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    logger.error('oEmbed fetch failed:', err);
    return null;
  }
}

/**
 * Use AI to generate a useful description/notes for the video,
 * and optionally summarize what it covers based on the title and channel.
 */
async function generateVideoNotes(params: {
  title: string;
  author: string;
  interestName?: string;
}): Promise<string | null> {
  try {
    const { data, error } = await invokeAIEdgeFunction<{ reply?: string }>('race-coaching-chat', {
      body: {
        prompt: `You are a helpful learning assistant. Given this YouTube video info, write 1-2 concise sentences describing why this video would be useful for someone learning ${params.interestName || 'this skill'}. Be specific about what they'll learn.\n\nVideo: "${params.title}"\nChannel: ${params.author}\n\nReply with ONLY the description, no quotes or labels.`,
        max_tokens: 256,
      },
    });

    if (error || !data) return null;
    const reply = typeof data === 'string' ? data : (data as any).text ?? (data as any).reply;
    return reply?.trim() || null;
  } catch (err) {
    logger.error('AI notes generation failed:', err);
    return null;
  }
}

/**
 * Main entry point: fetch YouTube metadata and optionally generate AI notes.
 */
export async function fetchYouTubeMetadata(
  videoUrl: string,
  options?: { interestName?: string; generateNotes?: boolean },
): Promise<YouTubeMetadata | null> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return null;

  const oembed = await fetchOEmbed(videoUrl);
  if (!oembed) return null;

  const metadata: YouTubeMetadata = {
    title: oembed.title || '',
    author: oembed.author_name || '',
    thumbnailUrl: oembed.thumbnail_url || null,
    description: null,
  };

  // Optionally generate AI description
  if (options?.generateNotes !== false && metadata.title && metadata.author) {
    metadata.description = await generateVideoNotes({
      title: metadata.title,
      author: metadata.author,
      interestName: options?.interestName,
    });
  }

  return metadata;
}
