/**
 * playbook-ingest-inbox
 *
 * Invoked from the "Ingest now" button on RawInboxCard. Input:
 *   { playbook_id: string }
 *
 * Processes every playbook_inbox_items row with status='pending':
 *   - url   → creates a playbook_resources row from source_url + title
 *   - file  → creates a resource row from raw_text/metadata
 *   - photo → creates a resource row (OCR text in raw_text if available)
 *   - text  → creates a note-type resource row
 *   - voice → reserved for v2, marked failed
 *
 * After each resource is created, asks Gemini whether it should trigger a
 * concept_update suggestion. Inbox items are flipped to 'ingested' (with
 * created_resource_id) or 'failed' (with error in metadata).
 *
 * For URL items, calls extract-url-metadata to fetch page title, description,
 * and body text. For files with raw_text, uses as-is. For photos, uses
 * Gemini vision to extract text/captions.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { callGemini } from '../_shared/gemini.ts';
import {
  assertPlaybookOwnership,
  authenticate,
  corsHeaders,
  extractJson,
  insertSuggestions,
  jsonResponse,
} from '../_shared/playbook.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const auth = await authenticate(req);
    if (auth instanceof Response) return auth;
    const { userId, supabase } = auth;

    const { playbook_id } = await req.json();
    if (!playbook_id) return jsonResponse({ error: 'playbook_id required' }, 400);

    const { interest_id } = await assertPlaybookOwnership(
      supabase,
      userId,
      playbook_id,
    );

    // Load pending inbox items
    const { data: items = [], error: itemsErr } = await supabase
      .from('playbook_inbox_items')
      .select('*')
      .eq('playbook_id', playbook_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (itemsErr) throw itemsErr;

    if (!items || items.length === 0) {
      return jsonResponse({ ingested: 0, failed: 0, suggestions_created: 0 });
    }

    let ingested = 0;
    let failed = 0;
    const suggestionRows: Parameters<typeof insertSuggestions>[1] = [];

    for (const item of items) {
      try {
        if (item.kind === 'voice') {
          await supabase
            .from('playbook_inbox_items')
            .update({
              status: 'failed',
              metadata: { ...(item.metadata ?? {}), error: 'Voice transcription ships in v2' },
            })
            .eq('id', item.id);
          failed += 1;
          continue;
        }

        // Enrich content for URL items by fetching page metadata or PDF text
        let enrichedTitle = item.title;
        let enrichedDescription = item.raw_text;
        let enrichedMetadata = item.metadata ?? {};
        let isPdf = false;

        if (item.kind === 'url' && item.source_url) {
          // Detect PDF by URL extension or by doing a HEAD request
          const urlLower = item.source_url.toLowerCase();
          isPdf = urlLower.endsWith('.pdf') || urlLower.includes('.pdf?');

          if (!isPdf) {
            try {
              const headResp = await fetch(item.source_url, { method: 'HEAD', redirect: 'follow' });
              const ct = headResp.headers.get('content-type') ?? '';
              isPdf = ct.includes('application/pdf');
            } catch (_) {
              // HEAD failed — fall through to metadata extraction
            }
          }

          if (isPdf) {
            // Use extract-pdf-text for PDF URLs — gets full text content
            try {
              const pdfResp = await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/extract-pdf-text`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: req.headers.get('Authorization') ?? '',
                  },
                  body: JSON.stringify({ url: item.source_url }),
                },
              );
              if (pdfResp.ok) {
                const pdf = await pdfResp.json();
                if (pdf.success && pdf.text) {
                  // Derive title from URL filename
                  const rawFilename = item.source_url.split('/').pop()?.split('?')[0] ?? '';
                  let decoded = rawFilename;
                  try { decoded = decodeURIComponent(rawFilename); } catch (_) { /* keep raw */ }
                  const prettyName = decoded
                    .replace(/\.pdf$/i, '')
                    .replace(/[_-]+/g, ' ')
                    .replace(/([a-z])([A-Z])/g, '$1 $2')
                    .replace(/\b\w/g, (c: string) => c.toUpperCase())
                    .trim();
                  // Try first meaningful line from PDF text as title
                  const firstLine = (pdf.text as string).split(/\n/).find(
                    (l: string) => {
                      const t = l.trim();
                      if (t.length < 5 || t.length > 120) return false;
                      // Must be mostly letters/numbers/spaces (reject parser garbage)
                      const alphaRatio = (t.match(/[a-zA-Z0-9 ]/g) || []).length / t.length;
                      return alphaRatio > 0.7 && !/[.!?]/.test(t) && !/^\d+$/.test(t);
                    }
                  )?.trim() ?? '';
                  enrichedTitle = enrichedTitle === item.source_url
                    ? (firstLine || prettyName) || enrichedTitle
                    : enrichedTitle;
                  enrichedDescription = pdf.text.slice(0, 8000);
                  enrichedMetadata = {
                    ...enrichedMetadata,
                    content_type: 'pdf',
                    pdf_pages: pdf.numPages,
                    pdf_size: pdf.pdfSize,
                    extracted_text_length: pdf.text.length,
                  };
                }
              }
            } catch (pdfErr) {
              console.warn('PDF text extraction failed (non-fatal)', pdfErr);
            }
          } else {
            // Regular URL — fetch HTML page metadata
            try {
              const metaResp = await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/extract-url-metadata`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: req.headers.get('Authorization') ?? '',
                  },
                  body: JSON.stringify({ url: item.source_url }),
                },
              );
              if (metaResp.ok) {
                const meta = await metaResp.json();
                enrichedTitle = meta.title || enrichedTitle || item.source_url;
                enrichedDescription = meta.body_text?.slice(0, 4000) || meta.description || enrichedDescription;
                enrichedMetadata = {
                  ...enrichedMetadata,
                  extracted_title: meta.title,
                  extracted_description: meta.description,
                  extracted_image: meta.image,
                  extracted_author: meta.author,
                };
              }
            } catch (urlErr) {
              console.warn('URL metadata extraction failed (non-fatal)', urlErr);
            }
          }
        }

        // Create a resource row
        const resourceType =
          item.kind === 'url' && isPdf ? 'document' :
          item.kind === 'url' ? 'website' :
          item.kind === 'photo' ? 'image' :
          item.kind === 'file' ? 'document' :
          'note';

        const { data: resource, error: resErr } = await supabase
          .from('playbook_resources')
          .insert({
            playbook_id,
            user_id: userId,
            title: enrichedTitle ?? item.source_url ?? 'Untitled capture',
            url: item.source_url,
            resource_type: resourceType,
            description: (enrichedDescription ?? '').slice(0, 500) || null,
            metadata: enrichedMetadata,
          })
          .select('id, title')
          .single();
        if (resErr) throw resErr;

        // Mark inbox item ingested
        await supabase
          .from('playbook_inbox_items')
          .update({
            status: 'ingested',
            ingested_at: new Date().toISOString(),
            created_resource_id: resource.id,
          })
          .eq('id', item.id);
        ingested += 1;

        // Ask Gemini if this should trigger a concept_update
        const contentForAI = enrichedDescription || item.raw_text || '';
        if (contentForAI.length > 50) {
          try {
            const { data: concepts = [] } = await supabase
              .from('playbook_concepts')
              .select('id, title, body_md')
              .eq('interest_id', interest_id)
              .or(`playbook_id.eq.${playbook_id},playbook_id.is.null`)
              .limit(30);

            const system = `You are BetterAt's Playbook coach. A new resource was added to the user's knowledge base. Decide whether it provides fresh, actionable insight for any existing concept.

Return ONLY a JSON array (possibly empty) of concept_update proposals:
  [{ "target_concept_id": "<uuid>", "body_md": "<merged markdown>", "rationale": "<one line>" }]
Return [] if nothing relevant.`;

            const userPrompt = `NEW RESOURCE: ${resource.title}
${contentForAI.slice(0, 4000)}

EXISTING CONCEPTS:
${(concepts ?? []).map((c: any) => `- [${c.id}] ${c.title}`).join('\n')}`;

            const aiText = await callGemini({
              system,
              userContent: [{ text: userPrompt }],
              maxOutputTokens: 800,
              temperature: 0.3,
            });

            const proposals = extractJson<Array<Record<string, unknown>>>(aiText);
            if (Array.isArray(proposals)) {
              for (const p of proposals.slice(0, 2)) {
                const targetId = p.target_concept_id as string | undefined;
                if (!targetId) continue;
                suggestionRows.push({
                  playbook_id,
                  user_id: userId,
                  kind: 'concept_update',
                  payload: {
                    target_concept_id: targetId,
                    body_md: p.body_md,
                    rationale: p.rationale,
                  },
                  provenance: {
                    source_inbox_item_ids: [item.id],
                    source_resource_ids: [resource.id],
                    model: 'gemini-2.5-flash',
                  },
                });
              }
            }
          } catch (aiErr) {
            console.warn('Inbox item AI step failed (non-fatal)', aiErr);
          }
        }
      } catch (itemErr) {
        console.error('Inbox item failed', item.id, itemErr);
        await supabase
          .from('playbook_inbox_items')
          .update({
            status: 'failed',
            metadata: {
              ...(item.metadata ?? {}),
              error: itemErr instanceof Error ? itemErr.message : String(itemErr),
            },
          })
          .eq('id', item.id);
        failed += 1;
      }
    }

    const suggestions_created = await insertSuggestions(supabase, suggestionRows);

    return jsonResponse({ ingested, failed, suggestions_created });
  } catch (err) {
    console.error('playbook-ingest-inbox error', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Internal error' },
      500,
    );
  }
});
