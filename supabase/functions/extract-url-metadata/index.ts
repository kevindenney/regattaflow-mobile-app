/**
 * Extract URL Metadata Edge Function
 * Fetches a URL and extracts Open Graph / meta tag metadata for library resources.
 * Returns: title, description, image, siteName, author
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

interface UrlMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  author: string | null;
  body_text: string | null;
}

/**
 * Extract content from a meta tag by property or name attribute.
 */
function getMetaContent(html: string, attr: string): string | null {
  // Try property="..." (Open Graph)
  const ogPattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${attr}["'][^>]+content=["']([^"']*)["']`,
    'i',
  );
  const ogMatch = html.match(ogPattern);
  if (ogMatch) return ogMatch[1].trim() || null;

  // Try content="..." before property (reversed attribute order)
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${attr}["']`,
    'i',
  );
  const reverseMatch = html.match(reversePattern);
  if (reverseMatch) return reverseMatch[1].trim() || null;

  return null;
}

/**
 * Extract <title> tag content.
 */
function getTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() || null : null;
}

/**
 * Decode common HTML entities.
 */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Strip HTML tags and extract readable body text.
 * Removes scripts, styles, nav, header, footer, then strips tags.
 */
function extractBodyText(html: string): string | null {
  let text = html;
  // Remove script/style/nav/header/footer blocks
  text = text.replace(/<(script|style|nav|header|footer|aside|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common entities
  text = decodeEntities(text);
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  // Return null if too short to be useful
  return text.length > 100 ? text.slice(0, 8000) : null;
}

/**
 * Reject URLs that resolve to private/internal network ranges (SSRF prevention).
 */
function isPrivateUrl(urlString: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(urlString).hostname;
  } catch {
    return true; // unparseable — treat as private
  }

  // Reject loopback and link-local names
  if (hostname === 'localhost' || hostname === '::1') return true;

  // IPv4 address check
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [, a, b, c] = ipv4.map(Number);
    if (a === 127) return true;                          // 127.x.x.x loopback
    if (a === 10) return true;                           // 10.x.x.x private
    if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16-31.x private
    if (a === 192 && b === 168) return true;             // 192.168.x private
    if (a === 169 && b === 254) return true;             // 169.254.x link-local
    if (a === 0) return true;                            // 0.x.x.x reserved
  }

  return false;
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'No URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // SSRF prevention: only https:// URLs pointing to public hosts
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (parsedUrl.protocol !== 'https:') {
      return new Response(
        JSON.stringify({ error: 'Only https:// URLs are allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (isPrivateUrl(url)) {
      return new Response(
        JSON.stringify({ error: 'URL resolves to a disallowed network range' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch the page
    let html: string;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; BetterAt/1.0; Library Resource Metadata)',
          Accept: 'text/html,application/xhtml+xml,*/*',
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('html') && !contentType.includes('text')) {
        // For PDFs and other non-HTML, extract a readable title from the URL path
        let fileTitle: string | null = null;
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/').filter(Boolean);
          const lastPart = pathParts[pathParts.length - 1] || '';
          fileTitle = lastPart
            .replace(/\.\w+$/, '')        // remove extension
            .replace(/[-_]+/g, ' ')       // separators to spaces
            .replace(/%20/g, ' ')         // URL-encoded spaces
            .replace(/\b\w/g, (c: string) => c.toUpperCase()) // title case
            .trim() || null;
        } catch { /* ignore URL parse errors */ }

        let siteName: string | null = null;
        try {
          siteName = new URL(url).hostname.replace('www.', '').split('.')[0] || null;
          if (siteName) siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
        } catch { /* ignore */ }

        return new Response(
          JSON.stringify({
            title: fileTitle,
            description: contentType.includes('pdf') ? 'PDF document' : null,
            image: null,
            siteName,
            author: null,
            body_text: null,
          } satisfies UrlMetadata),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Only read first 100KB — metadata is always in <head>
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let accumulated = '';
      const decoder = new TextDecoder();
      while (accumulated.length < 100_000) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }
      reader.cancel();
      html = accumulated;
    } catch (fetchError: any) {
      const message =
        fetchError.name === 'AbortError'
          ? 'Request timed out'
          : `Could not fetch URL: ${fetchError.message}`;
      return new Response(
        JSON.stringify({ error: message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Extract metadata with priority: OG > Twitter > standard meta > <title>
    const rawTitle =
      getMetaContent(html, 'og:title') ??
      getMetaContent(html, 'twitter:title') ??
      getTitleTag(html);

    const rawDescription =
      getMetaContent(html, 'og:description') ??
      getMetaContent(html, 'twitter:description') ??
      getMetaContent(html, 'description');

    const rawImage =
      getMetaContent(html, 'og:image') ??
      getMetaContent(html, 'twitter:image');

    const rawSiteName =
      getMetaContent(html, 'og:site_name') ??
      getMetaContent(html, 'application-name');

    const rawAuthor =
      getMetaContent(html, 'author') ??
      getMetaContent(html, 'article:author') ??
      getMetaContent(html, 'twitter:creator');

    // Resolve relative image URL
    let image = rawImage;
    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, url).href;
      } catch {
        // leave as-is
      }
    }

    const metadata: UrlMetadata = {
      title: rawTitle ? decodeEntities(rawTitle) : null,
      description: rawDescription ? decodeEntities(rawDescription) : null,
      image,
      siteName: rawSiteName ? decodeEntities(rawSiteName) : null,
      author: rawAuthor ? decodeEntities(rawAuthor) : null,
      body_text: extractBodyText(html),
    };

    return new Response(JSON.stringify(metadata), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[extract-url-metadata] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to extract metadata' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
