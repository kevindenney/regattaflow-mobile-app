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

    // Fetch the PDF from the target URL
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'RegattaFlow/1.0 (PDF Extraction Service)',
        'Accept': 'application/pdf,*/*',
      },
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
    const contentType = response.headers.get('content-type') || 'application/pdf'

    // Stream the PDF back to the client
    const blob = await response.blob()

    console.log(`[pdf-proxy] Successfully fetched ${blob.size} bytes`)

    return new Response(blob, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Length': blob.size.toString(),
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
