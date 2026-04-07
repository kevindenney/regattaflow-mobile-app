/**
 * playbook-qa
 *
 * Synchronous Q&A against a Playbook. Input:
 *   { playbook_id: string, question: string }
 *
 * Retrieves top-k snippets across concepts, resources, and recent debriefs
 * using simple `ilike` keyword match (no pgvector in this repo). Hands the
 * snippets + question to Gemini and returns { answer_md, sources } to the
 * client. The client chooses whether to pin it → playbook_qa row.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { callGemini } from '../_shared/gemini.ts';
import {
  assertPlaybookOwnership,
  authenticate,
  corsHeaders,
  jsonResponse,
} from '../_shared/playbook.ts';

function extractKeywords(question: string): string[] {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 6);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const auth = await authenticate(req);
    if (auth instanceof Response) return auth;
    const { userId, supabase } = auth;

    const { playbook_id, question } = await req.json();
    if (!playbook_id || !question) {
      return jsonResponse({ error: 'playbook_id and question required' }, 400);
    }

    const { interest_id } = await assertPlaybookOwnership(
      supabase,
      userId,
      playbook_id,
    );

    const keywords = extractKeywords(question);
    const orQuery = (col: string) =>
      keywords.length > 0
        ? keywords.map((k) => `${col}.ilike.%${k}%`).join(',')
        : `${col}.ilike.%${question.slice(0, 40)}%`;

    // Concepts (owned + baselines in this interest)
    const { data: concepts = [] } = await supabase
      .from('playbook_concepts')
      .select('id, title, body_md, origin')
      .eq('interest_id', interest_id)
      .or(`playbook_id.eq.${playbook_id},playbook_id.is.null`)
      .or(orQuery('title') + ',' + orQuery('body_md'))
      .limit(8);

    // Resources
    const { data: resources = [] } = await supabase
      .from('playbook_resources')
      .select('id, title, description, url')
      .eq('playbook_id', playbook_id)
      .or(orQuery('title') + ',' + orQuery('description'))
      .limit(8);

    // Recent debriefs (last 20 steps with debriefs)
    const { data: recentSteps = [] } = await supabase
      .from('timeline_steps')
      .select('id, title, metadata, starts_at')
      .eq('user_id', userId)
      .eq('interest_id', interest_id)
      .order('starts_at', { ascending: false })
      .limit(20);

    const stepSnippets = (recentSteps ?? [])
      .filter((s: any) => (s.metadata as Record<string, unknown>)?.review)
      .slice(0, 6)
      .map((s: any) => ({
        id: s.id,
        title: s.title,
        review: s.metadata.review,
      }));

    const system = `You are the user's personal Playbook — a compiled knowledge base of their practice in one interest area. Answer the user's question using ONLY the snippets provided. Cite sources inline like [C1], [R2], [D3] where C=concept, R=resource, D=debrief.

Return ONLY a JSON object:
{
  "answer_md": "<markdown answer with inline citations>",
  "sources": [{"type": "concept"|"resource"|"debrief", "id": "<uuid>", "label": "<display title>"}]
}

If the snippets don't contain enough information, say so honestly in answer_md and return an empty sources array.`;

    const sourceBlocks: string[] = [];
    (concepts ?? []).forEach((c: any, i: number) => {
      sourceBlocks.push(`[C${i + 1}] CONCEPT ${c.id} — ${c.title}\n${c.body_md?.slice(0, 800) ?? ''}`);
    });
    (resources ?? []).forEach((r: any, i: number) => {
      sourceBlocks.push(`[R${i + 1}] RESOURCE ${r.id} — ${r.title}\n${r.description?.slice(0, 400) ?? ''}`);
    });
    stepSnippets.forEach((s: any, i: number) => {
      sourceBlocks.push(`[D${i + 1}] DEBRIEF ${s.id} — ${s.title}\n${JSON.stringify(s.review).slice(0, 600)}`);
    });

    const userPrompt = `QUESTION: ${question}

SNIPPETS:
${sourceBlocks.join('\n\n')}`;

    const aiText = await callGemini({
      system,
      userContent: [{ text: userPrompt }],
      maxOutputTokens: 1500,
      temperature: 0.3,
    });

    // Extract JSON (tolerant)
    let parsed: { answer_md?: string; sources?: unknown[] } = {};
    try {
      const cleaned = aiText.replace(/```(?:json)?\s*/g, '').replace(/```$/g, '').trim();
      const first = cleaned.indexOf('{');
      const last = cleaned.lastIndexOf('}');
      if (first !== -1 && last !== -1) {
        parsed = JSON.parse(cleaned.slice(first, last + 1));
      }
    } catch {
      parsed = { answer_md: aiText, sources: [] };
    }

    return jsonResponse({
      answer_md: parsed.answer_md ?? aiText,
      sources: parsed.sources ?? [],
    });
  } catch (err) {
    console.error('playbook-qa error', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Internal error' },
      500,
    );
  }
});
