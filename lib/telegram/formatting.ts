/**
 * Telegram MarkdownV2 formatting utilities.
 *
 * Telegram's MarkdownV2 is strict — unescaped special chars cause the entire
 * message to be rejected. Strategy: convert Claude's plain/Markdown output to
 * MarkdownV2-safe text, with a plaintext fallback if sending fails.
 */

// Characters that must be escaped outside of formatting blocks in MarkdownV2
const SPECIAL_CHARS = /([_*\[\]()~`>#+\-=|{}.!\\])/g;

/**
 * Escape all MarkdownV2 special characters in a plain-text string.
 */
export function escapeMarkdownV2(text: string): string {
  return text.replace(SPECIAL_CHARS, '\\$1');
}

/**
 * Convert Claude's Markdown-ish output to Telegram MarkdownV2.
 *
 * Handles:
 *  - **bold** → *bold*
 *  - _italic_ (unchanged but re-escaped)
 *  - `code` (unchanged)
 *  - ```code blocks``` (unchanged)
 *  - Bullet lists (- item)
 *  - Everything else: escaped
 *
 * This is intentionally conservative — we preserve a small set of formatting
 * and escape everything else to avoid Telegram 400 errors.
 */
export function formatForTelegram(text: string): string {
  // Process the text line by line to handle code blocks correctly
  const lines = text.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    // Toggle code block state
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(inCodeBlock ? '```' : '```');
      continue;
    }

    if (inCodeBlock) {
      // Inside code blocks, no escaping needed (Telegram handles it)
      result.push(line);
      continue;
    }

    result.push(formatLine(line));
  }

  return result.join('\n');
}

/**
 * Format a single line of text for MarkdownV2.
 */
function formatLine(line: string): string {
  // Extract inline code spans first to protect them from escaping
  const codeSpans: string[] = [];
  let processed = line.replace(/`([^`]+)`/g, (_match, code) => {
    codeSpans.push(code);
    return `\x00CODE${codeSpans.length - 1}\x00`;
  });

  // Extract bold spans (**text** → *text* in MarkdownV2)
  const boldSpans: string[] = [];
  processed = processed.replace(/\*\*([^*]+)\*\*/g, (_match, content) => {
    boldSpans.push(content);
    return `\x00BOLD${boldSpans.length - 1}\x00`;
  });

  // Extract italic spans (_text_ or *text*)
  const italicSpans: string[] = [];
  processed = processed.replace(/(?<!\w)_([^_]+)_(?!\w)/g, (_match, content) => {
    italicSpans.push(content);
    return `\x00ITALIC${italicSpans.length - 1}\x00`;
  });

  // Escape all special chars in remaining plain text
  processed = escapeMarkdownV2(processed);

  // Restore bold spans as MarkdownV2 bold (*text*)
  processed = processed.replace(/\x00BOLD(\d+)\x00/g, (_match, idx) => {
    return `*${escapeMarkdownV2(boldSpans[parseInt(idx)])}*`;
  });

  // Restore italic spans as MarkdownV2 italic (_text_)
  processed = processed.replace(/\x00ITALIC(\d+)\x00/g, (_match, idx) => {
    return `_${escapeMarkdownV2(italicSpans[parseInt(idx)])}_`;
  });

  // Restore code spans (content not escaped inside backticks)
  processed = processed.replace(/\x00CODE(\d+)\x00/g, (_match, idx) => {
    return `\`${codeSpans[parseInt(idx)]}\``;
  });

  return processed;
}

// ---------------------------------------------------------------------------
// Inline keyboard helpers
// ---------------------------------------------------------------------------

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

/**
 * Build "Mark as done" / "Start" buttons for a list of steps.
 * Max 5 buttons to avoid clutter.
 */
export function buildStepButtons(
  steps: { id: string; title: string; status: string }[],
): InlineKeyboardButton[][] {
  const actionable = steps.filter(s => s.status === 'pending' || s.status === 'in_progress');
  const limited = actionable.slice(0, 5);

  return limited.map(step => {
    const label = step.title.length > 25 ? step.title.slice(0, 22) + '...' : step.title;
    if (step.status === 'pending') {
      return [{ text: `▶️ Start: ${label}`, callback_data: `wip:${step.id}` }];
    }
    // in_progress → mark done
    return [{ text: `✅ Done: ${label}`, callback_data: `done:${step.id}` }];
  });
}

/**
 * Build a "Start now" button for a newly created step.
 */
export function buildCreatedStepButtons(
  stepId: string,
): InlineKeyboardButton[][] {
  return [[{ text: '▶️ Start now', callback_data: `wip:${stepId}` }]];
}
