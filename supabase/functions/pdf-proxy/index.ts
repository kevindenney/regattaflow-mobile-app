import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Check if bytes represent a valid PDF (starts with %PDF-)
 */
function isPdfContent(bytes: Uint8Array): boolean {
  return bytes.length >= 5 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2D;   // -
}

/**
 * Check if bytes represent HTML content
 */
function isHtmlContent(bytes: Uint8Array): boolean {
  const firstChars = new TextDecoder().decode(bytes.slice(0, 500)).toLowerCase();
  return firstChars.includes('<!doctype') ||
         firstChars.includes('<html') ||
         firstChars.includes('<head') ||
         firstChars.includes('<body');
}

/**
 * Generate browser-like headers for fetching PDFs
 */
function getBrowserHeaders(url: string, minimal = false): Record<string, string> {
  const origin = new URL(url).origin;

  if (minimal) {
    // Minimal headers - some servers reject "too perfect" browser signatures
    return {
      'User-Agent': 'Mozilla/5.0 (compatible; PDFBot/1.0)',
      'Accept': '*/*',
    };
  }

  // Full browser headers to mimic real Chrome browser
  return {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/pdf,application/octet-stream,*/*;q=0.9',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': origin + '/',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };
}

/**
 * Fetch PDF with retry logic and different header strategies
 */
async function fetchPdfWithRetry(url: string): Promise<{
  success: boolean;
  buffer?: ArrayBuffer;
  contentType?: string;
  error?: string;
}> {
  const strategies = [
    { name: 'full browser headers', minimal: false },
    { name: 'minimal headers', minimal: true },
  ];

  for (const strategy of strategies) {
    try {
      const headers = getBrowserHeaders(url, strategy.minimal);
      const response = await fetch(url, {
        headers,
        redirect: 'follow',
      });

      const contentType = response.headers.get('content-type') || 'unknown';

      if (!response.ok) {
        continue;
      }

      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      if (isPdfContent(bytes)) {
        return { success: true, buffer, contentType: 'application/pdf' };
      }

      if (isHtmlContent(bytes)) {
        continue;
      }

      // Not PDF and not HTML - might be a different binary format, return it anyway
      return { success: true, buffer, contentType };

    } catch (fetchError) {
      continue;
    }
  }

  return {
    success: false,
    error: 'Could not fetch PDF. The server may be blocking automated requests or returning a login/error page. Try downloading the PDF manually and uploading it directly.'
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const targetUrl = url.searchParams.get('url')

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(targetUrl)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Security: only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new Response(
        JSON.stringify({ error: 'Only HTTP/HTTPS URLs are allowed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch PDF with retry logic
    const result = await fetchPdfWithRetry(targetUrl);

    if (!result.success || !result.buffer) {
      return new Response(
        JSON.stringify({
          error: result.error || 'Failed to fetch PDF',
          hint: 'Try downloading the PDF manually and uploading it directly.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const bytes = new Uint8Array(result.buffer);
    const isPdf = isPdfContent(bytes);

    // Return the data
    return new Response(result.buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': result.contentType || 'application/octet-stream',
        'Content-Length': result.buffer.byteLength.toString(),
        'X-PDF-Detected': isPdf ? 'true' : 'false',
      },
    })

  } catch (error) {
    console.error('[pdf-proxy] Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
