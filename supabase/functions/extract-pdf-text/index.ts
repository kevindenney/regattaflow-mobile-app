import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';

// Use pdf-parse library via npm specifier
import pdf from "npm:pdf-parse@1.1.1";
// Import Buffer from Node.js compatibility layer
import { Buffer } from "node:buffer";

/**
 * Extract Text from PDF Edge Function
 * Fetches a PDF from URL and extracts text using pdf-parse library
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'No URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[extract-pdf-text] Fetching PDF from:', url);

    // Fetch the PDF
    const pdfResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,*/*',
      },
    });

    if (!pdfResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch PDF: ${pdfResponse.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get PDF as ArrayBuffer
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Check if it's actually a PDF
    const isPdf = pdfBytes.length >= 5 &&
      pdfBytes[0] === 0x25 && // %
      pdfBytes[1] === 0x50 && // P
      pdfBytes[2] === 0x44 && // D
      pdfBytes[3] === 0x46 && // F
      pdfBytes[4] === 0x2D;   // -

    if (!isPdf) {
      const firstChars = new TextDecoder().decode(pdfBytes.slice(0, 200));
      const isHtml = firstChars.includes('<!DOCTYPE') || firstChars.includes('<html');

      return new Response(
        JSON.stringify({
          success: false,
          error: isHtml
            ? 'URL returned an HTML page instead of PDF. Try downloading and uploading manually.'
            : 'URL did not return a valid PDF file.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[extract-pdf-text] PDF size:', pdfBytes.length, 'bytes');

    // Extract text using pdf-parse
    // Convert Uint8Array to Buffer for pdf-parse
    const buffer = Buffer.from(pdfBuffer);

    console.log('[extract-pdf-text] Parsing PDF with pdf-parse...');
    const data = await pdf(buffer);

    const extractedText = data.text || '';
    console.log('[extract-pdf-text] Extracted text length:', extractedText.length);
    console.log('[extract-pdf-text] Number of pages:', data.numpages);

    if (!extractedText || extractedText.trim().length < 10) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not extract meaningful text from this PDF. The PDF may be image-based or corrupted.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: extractedText,
        pdfSize: pdfBytes.length,
        numPages: data.numpages,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[extract-pdf-text] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
