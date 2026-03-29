/**
 * Telegram Bot API client — thin fetch-based wrapper.
 * No external Telegram SDK needed.
 */

const TELEGRAM_API = 'https://api.telegram.org';
const MAX_MESSAGE_LENGTH = 4096;

interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');
  return token;
}

function apiUrl(method: string): string {
  return `${TELEGRAM_API}/bot${getBotToken()}/${method}`;
}

export async function sendMessage(
  chatId: number,
  text: string,
  options?: { parseMode?: 'Markdown' | 'HTML'; replyToMessageId?: number },
): Promise<TelegramResponse> {
  // Split long messages at paragraph boundaries
  const chunks = splitMessage(text);

  let lastResponse: TelegramResponse = { ok: true };
  for (const chunk of chunks) {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: chunk,
    };
    if (options?.parseMode) body.parse_mode = options.parseMode;
    if (options?.replyToMessageId) {
      body.reply_to_message_id = options.replyToMessageId;
      // Only reply to the first chunk
      delete options.replyToMessageId;
    }

    lastResponse = await callTelegram('sendMessage', body);
  }

  return lastResponse;
}

export async function sendChatAction(
  chatId: number,
  action: 'typing' = 'typing',
): Promise<TelegramResponse> {
  return callTelegram('sendChatAction', { chat_id: chatId, action });
}

export async function setWebhook(
  url: string,
  secretToken: string,
): Promise<TelegramResponse> {
  return callTelegram('setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['message'],
  });
}

async function callTelegram(
  method: string,
  body: Record<string, unknown>,
): Promise<TelegramResponse> {
  try {
    const response = await fetch(apiUrl(method), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json() as TelegramResponse;
    if (!data.ok) {
      console.error(`Telegram API error (${method}):`, data.description);
    }
    return data;
  } catch (error) {
    console.error(`Telegram API call failed (${method}):`, error);
    return { ok: false, description: String(error) };
  }
}

function splitMessage(text: string): string[] {
  if (text.length <= MAX_MESSAGE_LENGTH) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > MAX_MESSAGE_LENGTH) {
    // Try to split on double newline (paragraph break)
    let splitIdx = remaining.lastIndexOf('\n\n', MAX_MESSAGE_LENGTH);
    if (splitIdx === -1 || splitIdx < MAX_MESSAGE_LENGTH / 2) {
      // Fall back to single newline
      splitIdx = remaining.lastIndexOf('\n', MAX_MESSAGE_LENGTH);
    }
    if (splitIdx === -1 || splitIdx < MAX_MESSAGE_LENGTH / 2) {
      // Fall back to space
      splitIdx = remaining.lastIndexOf(' ', MAX_MESSAGE_LENGTH);
    }
    if (splitIdx === -1) {
      // Hard split as last resort
      splitIdx = MAX_MESSAGE_LENGTH;
    }

    chunks.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx).trimStart();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}
