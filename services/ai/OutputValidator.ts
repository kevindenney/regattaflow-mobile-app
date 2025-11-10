import { z } from 'zod';

const documentSchema = z.object({
  title: z.string().min(5).max(140),
  markdown: z.string().min(50),
  sections: z.array(
    z.object({
      heading: z.string(),
      body: z.string(),
    })
  ),
  confidence: z.number().optional(),
});

const commsSchema = z.object({
  urgency: z.enum(['low', 'medium', 'high']),
  sms: z.string().min(10),
  email: z.string().min(50),
  notice_board: z.string().min(20),
  suggested_send_time: z.string().nullable().optional(),
});

const supportSchema = z.object({
  reply: z.string().min(10),
  suggested_action: z.string().nullable().optional(),
  needs_handoff: z.boolean().optional(),
});

const summarySchema = z.object({
  headline: z.string().min(10),
  highlights: z.array(z.string()),
  blockers: z.array(z.string()).optional(),
  upcoming: z.array(z.string()).optional(),
});

export function parseDocumentDraft(raw: string) {
  const parsed = safeJson(raw);
  return documentSchema.parse(parsed);
}

export function parseRaceComms(raw: string) {
  const parsed = safeJson(raw);
  return commsSchema.parse(parsed);
}

export function parseSupportReply(raw: string) {
  const parsed = safeJson(raw);
  return supportSchema.parse(parsed);
}

export function parseDailySummary(raw: string) {
  const parsed = safeJson(raw);
  return summarySchema.parse(parsed);
}

function safeJson(raw: string) {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (error) {
    throw new Error('Claude response was not valid JSON');
  }
}

