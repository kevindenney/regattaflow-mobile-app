/**
 * Telegram Bot API client — thin fetch-based wrapper.
 * No external Telegram SDK needed.
 */

import { formatForTelegram } from './formatting';
import type { InlineKeyboardButton } from './formatting';

const TELEGRAM_API = 'https://api.telegram.org';
const MAX_MESSAGE_LENGTH = 4096;

interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

interface SendMessageOptions {
  parseMode?: 'MarkdownV2' | 'Markdown' | 'HTML';
  replyToMessageId?: number;
  replyMarkup?: { inline_keyboard: InlineKeyboardButton[][] };
}

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');
  return token;
}

function apiUrl(method: string): string {
  return `${TELEGRAM_API}/bot${getBotToken()}/${method}`;
}

function fileUrl(filePath: string): string {
  return `${TELEGRAM_API}/file/bot${getBotToken()}/${filePath}`;
}

/**
 * Send a text message, auto-splitting at paragraph boundaries if too long.
 * Defaults to MarkdownV2 formatting with plaintext fallback on error.
 */
export async function sendMessage(
  chatId: number,
  text: string,
  options?: SendMessageOptions,
): Promise<TelegramResponse> {
  const useMarkdown = options?.parseMode !== undefined ? options.parseMode === 'MarkdownV2' : true;
  const formattedText = useMarkdown ? formatForTelegram(text) : text;
  const chunks = splitMessage(formattedText);

  let lastResponse: TelegramResponse = { ok: true };
  for (let i = 0; i < chunks.length; i++) {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: chunks[i],
    };

    if (useMarkdown) body.parse_mode = 'MarkdownV2';
    else if (options?.parseMode) body.parse_mode = options.parseMode;

    // Only attach reply_markup to the last chunk
    if (i === chunks.length - 1 && options?.replyMarkup) {
      body.reply_markup = JSON.stringify(options.replyMarkup);
    }

    if (options?.replyToMessageId && i === 0) {
      body.reply_to_message_id = options.replyToMessageId;
    }

    lastResponse = await callTelegram('sendMessage', body);

    // Fallback: if MarkdownV2 failed for any reason, retry this chunk as plaintext
    if (!lastResponse.ok && useMarkdown) {
      const plainChunks = splitMessage(text);
      const plainBody: Record<string, unknown> = {
        chat_id: chatId,
        text: plainChunks[i] ?? chunks[i],
      };
      if (i === plainChunks.length - 1 && options?.replyMarkup) {
        plainBody.reply_markup = JSON.stringify(options.replyMarkup);
      }
      lastResponse = await callTelegram('sendMessage', plainBody);
    }
  }

  return lastResponse;
}

/**
 * Acknowledge an inline keyboard button press.
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
): Promise<TelegramResponse> {
  const body: Record<string, unknown> = { callback_query_id: callbackQueryId };
  if (text) body.text = text;
  return callTelegram('answerCallbackQuery', body);
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
    allowed_updates: ['message', 'callback_query'],
  });
}

// ---------------------------------------------------------------------------
// File download (for photos and voice notes)
// ---------------------------------------------------------------------------

/**
 * Get the download URL for a Telegram file by file_id.
 */
export async function getFileUrl(fileId: string): Promise<string | null> {
  const response = await callTelegram('getFile', { file_id: fileId });
  if (!response.ok || !response.result) return null;
  const filePath = (response.result as { file_path?: string }).file_path;
  if (!filePath) return null;
  return fileUrl(filePath);
}

/**
 * Download a file from Telegram by file_id. Returns the raw Buffer.
 */
export async function downloadFile(fileId: string): Promise<Buffer | null> {
  const url = await getFileUrl(fileId);
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Telegram file download failed: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Telegram file download error:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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
