import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

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

    console.log(`[pdf-proxy] Fetching: ${targetUrl}`)

    // Fetch the PDF from the target URL with browser-like headers
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,application/octet-stream,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      redirect: 'follow', // Follow redirects
    })

    if (!response.ok) {
      console.error(`[pdf-proxy] Fetch failed: ${response.status} ${response.statusText}`)
      return new Response(
        JSON.stringify({
          error: `Failed to fetch PDF: ${response.status} ${response.statusText}`
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || ''
    console.log(`[pdf-proxy] Response content-type: ${contentType}`)

    // Get the response as array buffer first
    const arrayBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    
    console.log(`[pdf-proxy] Fetched ${arrayBuffer.byteLength} bytes`)
    
    // Check if it's actually a PDF by looking at the magic bytes
    // PDF files start with "%PDF-"
    const isPdf = bytes.length >= 5 && 
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46 && // F
      bytes[4] === 0x2D    // -

    // Log first 100 bytes for debugging
    const firstBytes = Array.from(bytes.slice(0, 100))
      .map(b => String.fromCharCode(b))
      .join('')
    console.log(`[pdf-proxy] First 100 chars: ${firstBytes.substring(0, 100)}`)

    if (!isPdf) {
      // Check if it's HTML (common for login pages, errors, redirects)
      const isHtml = firstBytes.includes('<!DOCTYPE') || 
                     firstBytes.includes('<html') || 
                     firstBytes.includes('<HTML')
      
      if (isHtml) {
        console.error('[pdf-proxy] Received HTML instead of PDF - likely a login page or redirect')
        return new Response(
          JSON.stringify({
            error: 'The server returned an HTML page instead of a PDF. This usually means the PDF requires authentication or the URL redirects to a login page.',
            hint: 'Try downloading the PDF manually and uploading it directly.',
            receivedContentType: contentType,
            firstChars: firstBytes.substring(0, 200),
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      // Not a PDF and not HTML - might be binary but corrupt
      console.warn('[pdf-proxy] Response does not appear to be a valid PDF')
    }

    // Return the data
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': isPdf ? 'application/pdf' : (contentType || 'application/octet-stream'),
        'Content-Length': arrayBuffer.byteLength.toString(),
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
