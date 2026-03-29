import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { sendMessage, sendChatAction } from '../../lib/telegram/client';
import { getAnthropicTools, executeTool } from '../../lib/telegram/tools';
import { normalizeTier } from '../../lib/subscriptions/sailorTiers';
import type { AuthContext } from '../../services/mcp/server';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_TOOL_ITERATIONS = 5;
const MAX_CONVERSATION_MESSAGES = 20;
const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://app.betterat.com';

const SYSTEM_PROMPT = `You are the BetterAt AI assistant, helping users manage their learning timeline via Telegram.
You help them track progress, create steps, mark tasks done, and plan next activities.
Keep responses concise — this is a chat interface, not a document.
Use short paragraphs. Avoid markdown headers (Telegram doesn't render them well).
When tool results contain lists, summarize the key points rather than dumping raw data.
If the user asks something you can't do with available tools, say so directly.`;

// ---------------------------------------------------------------------------
// Auth helpers (mirrored from api/mcp.ts)
// ---------------------------------------------------------------------------

async function resolveClubId(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string | null> {
  const selects = [
    'active_organization_id, organization_id, club_id',
    'organization_id, club_id',
    'club_id',
  ];

  for (const fields of selects) {
    const { data, error } = await supabase
      .from('users')
      .select(fields)
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      const code = String(error?.code ?? '');
      const msg = String(error?.message ?? '').toLowerCase();
      if (['42703', 'PGRST204', 'PGRST205'].includes(code) || msg.includes('column')) continue;
      break;
    }

    const row = (data || {}) as Record<string, unknown>;
    const candidate = row.active_organization_id ?? row.organization_id ?? row.club_id ?? null;
    if (candidate && typeof candidate === 'string') return candidate;
  }

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', userId)
    .in('status', ['active', 'verified'])
    .limit(1)
    .maybeSingle();

  return membership?.organization_id ?? null;
}

function generateLinkCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/1/I for readability
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ---------------------------------------------------------------------------
// Telegram types (subset we need)
// ---------------------------------------------------------------------------

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; is_bot: boolean; first_name: string; username?: string };
    chat: { id: number; type: string };
    date: number;
    text?: string;
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Validate webhook secret
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
    if (secretHeader !== webhookSecret) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  // Always respond 200 to Telegram to prevent retry floods
  const ok = () => res.status(200).json({ ok: true });

  try {
    const update = req.body as TelegramUpdate;
    const message = update?.message;

    // Ignore non-text messages for now
    if (!message?.text || !message.from) {
      ok();
      return;
    }

    const telegramUserId = message.from.id;
    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from.username ?? null;

    // --- Supabase service-role client (bypasses RLS) ---
    const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Telegram webhook: Supabase not configured');
      await sendMessage(chatId, 'Sorry, the service is not configured yet. Please try again later.');
      ok();
      return;
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // --- Handle /start command ---
    if (text.startsWith('/start')) {
      const payload = text.split(' ')[1]; // deep link payload after /start
      if (payload?.startsWith('link_')) {
        await sendMessage(
          chatId,
          `To link your account, open this URL while logged into BetterAt:\n\n${APP_URL}/settings/telegram?code=${payload.replace('link_', '')}`,
        );
      } else {
        await sendMessage(
          chatId,
          "Welcome to BetterAt! 👋\n\nI'm your AI learning assistant. I can help you:\n\n" +
            '• Check your timeline and progress\n' +
            '• Create new learning steps\n' +
            '• Mark tasks as done\n' +
            '• Get suggestions for what to do next\n\n' +
            "Send me any message to get started. If this is your first time, I'll help you link your account.",
        );
      }
      ok();
      return;
    }

    // --- Resolve Telegram user → BetterAt user ---
    const { data: link } = await supabase
      .from('telegram_links')
      .select('user_id, linked_at')
      .eq('telegram_user_id', telegramUserId)
      .eq('is_active', true)
      .maybeSingle();

    if (!link?.user_id || !link.linked_at) {
      // Not linked — generate a code and prompt them
      const code = generateLinkCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

      await supabase
        .from('telegram_links')
        .upsert(
          {
            telegram_user_id: telegramUserId,
            telegram_username: username,
            link_code: code,
            link_code_expires_at: expiresAt,
            is_active: true,
          },
          { onConflict: 'telegram_user_id' },
        );

      await sendMessage(
        chatId,
        `I don't recognize your account yet. Let's link it!\n\nOpen this URL while logged into BetterAt:\n${APP_URL}/settings/telegram?code=${code}\n\nThis link expires in 15 minutes. Send me another message after linking.`,
      );
      ok();
      return;
    }

    const userId = link.user_id;

    // --- Build auth context ---
    const clubId = await resolveClubId(supabase, userId);

    const { data: userRow } = await supabase
      .from('users')
      .select('subscription_tier, email')
      .eq('id', userId)
      .maybeSingle();

    const tier = normalizeTier(userRow?.subscription_tier);
    const auth: AuthContext = {
      userId,
      email: userRow?.email ?? null,
      clubId,
      tier,
    };

    // --- Send typing indicator ---
    await sendChatAction(chatId, 'typing');

    // --- Load conversation history ---
    let { data: conversation } = await supabase
      .from('telegram_conversations')
      .select('id, messages')
      .eq('telegram_chat_id', chatId)
      .maybeSingle();

    if (!conversation) {
      const { data: created } = await supabase
        .from('telegram_conversations')
        .insert({ telegram_chat_id: chatId, user_id: userId, messages: [] })
        .select('id, messages')
        .single();
      conversation = created;
    }

    const history = (conversation?.messages as { role: string; content: string }[]) ?? [];
    // Keep only recent messages to stay within token limits
    const recentHistory = history.slice(-MAX_CONVERSATION_MESSAGES);

    // Append user message
    const messages: Anthropic.MessageParam[] = [
      ...recentHistory.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: text },
    ];

    // --- Call Claude ---
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const tools = getAnthropicTools();

    let response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20250414',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    // --- Tool use loop ---
    let iterations = 0;
    while (response.stop_reason === 'tool_use' && iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ContentBlockParam & { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
          b.type === 'tool_use',
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        const result = await executeTool(block.name, block.input, supabase, auth);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        });
      }

      messages.push({ role: 'assistant', content: response.content as Anthropic.ContentBlockParam[] });
      messages.push({ role: 'user', content: toolResults });

      // Re-send typing indicator for long tool chains
      await sendChatAction(chatId, 'typing');

      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20250414',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });
    }

    // --- Extract final text response ---
    const textBlocks = response.content.filter(
      (b): b is Anthropic.TextBlock => b.type === 'text',
    );
    const responseText = textBlocks.map(b => b.text).join('\n\n') || "I processed your request but don't have anything to say.";

    // --- Send to Telegram ---
    await sendMessage(chatId, responseText);

    // --- Save conversation ---
    const updatedHistory = [
      ...recentHistory,
      { role: 'user', content: text },
      { role: 'assistant', content: responseText },
    ];

    await supabase
      .from('telegram_conversations')
      .update({
        messages: updatedHistory,
        last_active_at: new Date().toISOString(),
        user_id: userId,
      })
      .eq('id', conversation?.id);

    ok();
  } catch (error) {
    console.error('Telegram webhook error:', error);

    // Try to send error message to user
    try {
      const chatId = (req.body as TelegramUpdate)?.message?.chat?.id;
      if (chatId) {
        await sendMessage(chatId, "Sorry, I'm having trouble right now. Please try again in a moment.");
      }
    } catch {
      // Ignore - best effort
    }

    ok(); // Always 200 to prevent Telegram retries
  }
}
