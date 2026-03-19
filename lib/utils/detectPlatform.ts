/**
 * detectPlatform — shared URL → platform detection utilities.
 * Used by ActTab (media links) and Library (auto-fill).
 */

import type { MediaLinkPlatform } from '@/types/step-detail';
import type { ResourceType } from '@/types/library';

const PLATFORM_PATTERNS: { pattern: RegExp; platform: MediaLinkPlatform; display: string }[] = [
  { pattern: /youtube\.com|youtu\.be/i, platform: 'youtube', display: 'YouTube' },
  { pattern: /instagram\.com/i, platform: 'instagram', display: 'Instagram' },
  { pattern: /tiktok\.com/i, platform: 'tiktok', display: 'TikTok' },
  { pattern: /photos\.google\.com/i, platform: 'google_photos', display: 'Google Photos' },
  { pattern: /icloud\.com\/photos/i, platform: 'apple_photos', display: 'Apple Photos' },
];

const SOURCE_PLATFORM_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /youtube\.com|youtu\.be/i, name: 'YouTube' },
  { pattern: /instagram\.com/i, name: 'Instagram' },
  { pattern: /tiktok\.com/i, name: 'TikTok' },
  { pattern: /udemy\.com/i, name: 'Udemy' },
  { pattern: /coursera\.org/i, name: 'Coursera' },
  { pattern: /skillshare\.com/i, name: 'Skillshare' },
  { pattern: /masterclass\.com/i, name: 'MasterClass' },
  { pattern: /vimeo\.com/i, name: 'Vimeo' },
  { pattern: /spotify\.com/i, name: 'Spotify' },
  { pattern: /podcasts\.apple\.com/i, name: 'Apple Podcasts' },
  { pattern: /medium\.com/i, name: 'Medium' },
  { pattern: /substack\.com/i, name: 'Substack' },
  { pattern: /twitter\.com|x\.com/i, name: 'X (Twitter)' },
  { pattern: /facebook\.com/i, name: 'Facebook' },
  { pattern: /drive\.google\.com/i, name: 'Google Drive' },
  { pattern: /dropbox\.com/i, name: 'Dropbox' },
  { pattern: /amazon\.com|amzn\./i, name: 'Amazon' },
];

/**
 * Detect media link platform from URL (for ActTab media links).
 */
export function detectMediaPlatform(url: string): MediaLinkPlatform {
  for (const { pattern, platform } of PLATFORM_PATTERNS) {
    if (pattern.test(url)) return platform;
  }
  return 'other';
}

/**
 * Detect source platform display name from URL (for Library).
 */
export function detectSourcePlatform(url: string): string | null {
  for (const { pattern, name } of SOURCE_PLATFORM_PATTERNS) {
    if (pattern.test(url)) return name;
  }
  return null;
}

/**
 * Suggest a library resource type based on URL patterns.
 */
export function suggestResourceType(url: string): ResourceType | null {
  if (/youtube\.com\/watch|youtu\.be\//i.test(url)) return 'youtube_video';
  if (/youtube\.com\/(c\/|channel\/|@)/i.test(url)) return 'youtube_channel';
  if (/udemy\.com|coursera\.org|skillshare\.com|masterclass\.com/i.test(url)) return 'online_course';
  if (/instagram\.com|tiktok\.com|twitter\.com|x\.com|facebook\.com/i.test(url)) return 'social_media';
  if (/drive\.google\.com|dropbox\.com/i.test(url)) return 'cloud_folder';
  if (/amazon\.com.*\/dp\//i.test(url)) return 'book_physical';
  return null;
}
