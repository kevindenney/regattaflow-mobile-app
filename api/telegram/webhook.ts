import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { sendMessage, sendChatAction, answerCallbackQuery, downloadFile } from '../../lib/telegram/client';
import { getAnthropicTools, executeTool, getToolResponseKeyboard } from '../../lib/telegram/tools';
import { normalizeTier } from '../../lib/subscriptions/sailorTiers';
import { transcribeVoiceNote } from '../../lib/telegram/transcription';
import type { InlineKeyboardButton } from '../../lib/telegram/formatting';
import type { AuthContext } from '../../services/mcp/server';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_TOOL_ITERATIONS = 5;
const MAX_CONVERSATION_MESSAGES = 20;
const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://better.at';

const SYSTEM_PROMPT = `You are the BetterAt AI assistant, helping users manage their learning timeline via Telegram.
You help them track progress, create steps, mark tasks done, and plan next activities.
Keep responses concise — this is a chat interface, not a document.
Use short paragraphs. Use *bold* for emphasis and _italic_ for secondary info.
Use bullet points with - for lists. Use \`code\` for IDs or technical values.
Avoid markdown headers — Telegram doesn't render them.
When tool results contain lists, summarize the key points rather than dumping raw data.
If the user asks something you can't do with available tools, say so directly.

CRITICAL RULES — READ CAREFULLY:
1. You MUST call tools to perform ANY action. NEVER pretend you did something without calling a tool.
2. NEVER say "Done" or "I've added" without having ACTUALLY called a tool first.
3. If the user wants to see their timeline, you MUST call get_student_timeline.
4. If the user wants to add evidence/photos to a step, you MUST call attach_step_evidence.
5. If the user wants nutrition logged, you MUST call log_nutrition with a step_id so it appears in the Review tab.
6. If the user wants a new step, you MUST call create_step.
7. Do NOT describe what you would do — actually DO it by calling the tool.
8. Every request that involves data REQUIRES at least one tool call.

SUB-STEP TRACKING:
- When the user mentions completing a task or sub-step, call get_step_detail to see their sub-steps, then use toggle_sub_step to mark it done. Report progress (e.g. "3/5 sub-steps done!").
- When the user says they did something differently than planned, use log_sub_step_deviation to record what they actually did.
- When showing step details, highlight incomplete sub-steps so the user knows what's left.`;

const PHOTO_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

The user has sent a photo. A photo_url has been uploaded and is available for you to attach to a step.

CRITICAL RULE: ALWAYS call get_student_timeline FIRST (with NO interest filter) to see ALL the user's steps across ALL interests. Then decide what to do based on the results.

CRITICAL RULE FOR FOOD PHOTOS: You must ALWAYS make TWO tool calls for food photos:
1. attach_step_evidence — to save the photo on the Train tab
2. log_nutrition with step_id — to extract and save nutritional data for the Review tab
Do NOT stop after attach_step_evidence. You are NOT done until log_nutrition has also been called.
If you only attach the photo without logging nutrition, the Review tab will have no nutrition data.

Your priority order:
1. If the user's caption mentions a step name or activity (e.g. "my IV insertion practice", "Monday nutrition", "add this to my drawing step"):
   - You ALREADY called get_student_timeline — look through the results for a step whose title matches
   - Use attach_step_evidence with the photo_url to attach it as evidence on the Act tab
   - Do NOT create a new step if one already exists with a matching title
   - If the photo is food/a meal: after attaching, you MUST also call log_nutrition with the step_id
2. If no step is mentioned and the photo appears to be food/a meal:
   - Find a matching nutrition step from get_student_timeline results
   - Call attach_step_evidence with the step_id
   - Call log_nutrition with the step_id to extract and save nutritional data
3. If neither applies, respond helpfully about what you see.

IMPORTANT: Do NOT pass an interest filter to get_student_timeline. The user has steps across many interests (fitness, sailing, nursing, art, etc.) and you must search all of them. Do NOT create a new step unless you searched and confirmed no matching step exists.

The uploaded photo URL is provided in the message as [Photo uploaded: URL]. Use this exact URL when calling attach_step_evidence.`;

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

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: TelegramUser;
    chat: { id: number; type: string };
    date: number;
    text?: string;
    photo?: { file_id: string; file_unique_id: string; width: number; height: number; file_size?: number }[];
    voice?: { file_id: string; duration: number; mime_type?: string; file_size?: number };
    caption?: string;
  };
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: { chat: { id: number }; message_id: number };
    data?: string;
  };
}

// ---------------------------------------------------------------------------
// Supabase + Auth context helpers
// ---------------------------------------------------------------------------

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function resolveAuthContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<AuthContext> {
  const clubId = await resolveClubId(supabase, userId);
  const { data: userRow } = await supabase
    .from('users')
    .select('subscription_tier, email')
    .eq('id', userId)
    .maybeSingle();

  return {
    userId,
    email: userRow?.email ?? null,
    clubId,
    tier: normalizeTier(userRow?.subscription_tier),
  };
}

// ---------------------------------------------------------------------------
// Callback query handler (inline keyboard button presses)
// ---------------------------------------------------------------------------

async function handleCallbackQuery(
  callbackQuery: NonNullable<TelegramUpdate['callback_query']>,
): Promise<void> {
  const { id: queryId, from, data, message: cbMessage } = callbackQuery;
  if (!data || !cbMessage) {
    await answerCallbackQuery(queryId, 'Invalid action');
    return;
  }

  const supabase = createSupabaseClient();
  if (!supabase) {
    await answerCallbackQuery(queryId, 'Service not configured');
    return;
  }

  // Parse callback data: "done:<step_id>" | "wip:<step_id>" | "skip:<step_id>" | "attach:<step_id>" | "substep_done:<step_id>:<sub_step_id>"
  const colonIdx = data.indexOf(':');
  if (colonIdx < 0) {
    await answerCallbackQuery(queryId, 'Invalid action');
    return;
  }
  const action = data.slice(0, colonIdx);
  const rest = data.slice(colonIdx + 1);
  if (!action || !rest) {
    await answerCallbackQuery(queryId, 'Invalid action');
    return;
  }
  // For substep_done, rest = "<step_id>:<sub_step_id>"; for others, rest = "<step_id>"
  const stepId = action === 'substep_done' ? rest.slice(0, rest.indexOf(':')) : rest;

  // Resolve auth
  const { data: link } = await supabase
    .from('telegram_links')
    .select('user_id, linked_at')
    .eq('telegram_user_id', from.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!link?.user_id || !link.linked_at) {
    await answerCallbackQuery(queryId, 'Account not linked');
    return;
  }

  const auth = await resolveAuthContext(supabase, link.user_id);
  const chatId = cbMessage.chat?.id;

  // Handle photo attachment callback
  if (action === 'attach') {
    // Look up pending photo from conversation
    const { data: convo } = await supabase
      .from('telegram_conversations')
      .select('pending_photo_url')
      .eq('telegram_chat_id', chatId)
      .maybeSingle();

    const photoUrl = convo?.pending_photo_url as string | null;
    if (!photoUrl) {
      await answerCallbackQuery(queryId, 'No photo to attach — send a photo first');
      return;
    }

    // Attach the photo to the step
    const result = await executeTool(
      'attach_step_evidence',
      { step_id: stepId, photo_url: photoUrl, caption: 'Added via Telegram' },
      supabase,
      auth,
    );

    const parsed = JSON.parse(result);
    if (parsed.error) {
      await answerCallbackQuery(queryId, `Error: ${parsed.error}`);
      return;
    }

    // Clear pending photo
    await supabase
      .from('telegram_conversations')
      .update({ pending_photo_url: null })
      .eq('telegram_chat_id', chatId);

    await answerCallbackQuery(queryId, `📎 Photo attached to: ${parsed.step_title ?? 'step'}`);
    if (chatId) {
      await sendMessage(chatId, `📎 Photo attached as evidence to *${parsed.step_title ?? 'step'}*`);
    }
    return;
  }

  // Handle sub-step toggle callback
  if (action === 'substep_done') {
    const subStepId = rest.slice(rest.indexOf(':') + 1);
    if (!stepId || !subStepId) {
      await answerCallbackQuery(queryId, 'Invalid sub-step action');
      return;
    }

    const toggleResult = await executeTool(
      'toggle_sub_step',
      { step_id: stepId, sub_step_id: subStepId, completed: true },
      supabase,
      auth,
    );

    const toggleParsed = JSON.parse(toggleResult);
    if (toggleParsed.error) {
      await answerCallbackQuery(queryId, `Error: ${toggleParsed.error}`);
      return;
    }

    await answerCallbackQuery(queryId, `☑️ ${toggleParsed.sub_step_title ?? 'Sub-step'} done!`);
    if (chatId) {
      await sendMessage(chatId, `☑️ *${toggleParsed.sub_step_title ?? 'Sub-step'}* marked done\\! ${toggleParsed.progress ?? ''}`);
    }
    return;
  }

  // Handle status update callbacks (done/wip/skip)
  const statusMap: Record<string, string> = {
    done: 'completed',
    wip: 'in_progress',
    skip: 'skipped',
  };
  const newStatus = statusMap[action];
  if (!newStatus) {
    await answerCallbackQuery(queryId, 'Unknown action');
    return;
  }

  const result = await executeTool(
    'update_step_status',
    { step_id: stepId, status: newStatus },
    supabase,
    auth,
  );

  const parsed = JSON.parse(result);
  if (parsed.error) {
    await answerCallbackQuery(queryId, `Error: ${parsed.error}`);
    return;
  }

  const label = newStatus === 'completed' ? '✅ Done' : newStatus === 'in_progress' ? '▶️ Started' : '⏭️ Skipped';
  await answerCallbackQuery(queryId, `${label}: ${parsed.step?.title ?? 'step'}`);
}

// ---------------------------------------------------------------------------
// Message handler (text, photo, voice)
// ---------------------------------------------------------------------------

async function handleMessage(
  message: NonNullable<TelegramUpdate['message']>,
): Promise<void> {
  const telegramUserId = message.from?.id;
  const chatId = message.chat.id;
  const username = message.from?.username ?? null;

  if (!telegramUserId || !message.from) return;

  // Determine message type and content
  const hasText = !!message.text;
  const hasPhoto = !!(message.photo && message.photo.length > 0);
  const hasVoice = !!message.voice;

  // Skip if no usable content
  if (!hasText && !hasPhoto && !hasVoice) return;

  const text = message.text?.trim() ?? '';

  // --- Supabase ---
  const supabase = createSupabaseClient();
  if (!supabase) {
    await sendMessage(chatId, 'Sorry, the service is not configured yet. Please try again later.');
    return;
  }

  // --- Handle /start command ---
  if (hasText && text.startsWith('/start')) {
    const payload = text.split(' ')[1];
    if (payload?.startsWith('link_')) {
      await sendMessage(
        chatId,
        `To link your account, open this URL while logged into BetterAt:\n\n${APP_URL}/settings/telegram?code=${payload.replace('link_', '')}`,
      );
    } else {
      await sendMessage(
        chatId,
        "Welcome to BetterAt! 👋\n\nI'm your AI learning assistant. I can help you:\n\n" +
          '- Check your timeline and progress\n' +
          '- Create new learning steps\n' +
          '- Mark tasks as done\n' +
          '- Get suggestions for what to do next\n' +
          '- Analyze meal photos for nutrition tracking\n' +
          '- Process voice notes\n\n' +
          "Send me any message to get started. If this is your first time, I'll help you link your account.",
      );
    }
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
    const code = generateLinkCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('telegram_links')
      .insert({
        telegram_user_id: telegramUserId,
        telegram_username: username,
        link_code: code,
        link_code_expires_at: expiresAt,
        is_active: true,
      });

    if (insertError) {
      const { error: updateError } = await supabase
        .from('telegram_links')
        .update({
          link_code: code,
          link_code_expires_at: expiresAt,
          telegram_username: username,
          linked_at: null,
          is_active: true,
        })
        .eq('telegram_user_id', telegramUserId);

      if (updateError) {
        console.error('Telegram link update error:', updateError.message);
        await sendMessage(chatId, 'Sorry, something went wrong setting up your link. Please try again.');
        return;
      }
    }

    // Also store chat_id for digest cron
    await supabase
      .from('telegram_links')
      .update({ telegram_chat_id: chatId })
      .eq('telegram_user_id', telegramUserId);

    await sendMessage(
      chatId,
      `I don't recognize your account yet. Let's link it!\n\nOpen this URL while logged into BetterAt:\n${APP_URL}/settings/telegram?code=${code}\n\nThis link expires in 15 minutes. Send me another message after linking.`,
    );
    return;
  }

  const userId = link.user_id;

  // Ensure chat_id is stored for digest cron
  await supabase
    .from('telegram_links')
    .update({ telegram_chat_id: chatId })
    .eq('telegram_user_id', telegramUserId);

  // --- Build auth context ---
  const auth = await resolveAuthContext(supabase, userId);

  // --- Send typing indicator ---
  await sendChatAction(chatId, 'typing');

  // --- Handle voice notes: transcribe → treat as text ---
  let userText = text;
  let historyPrefix = '';

  if (hasVoice && message.voice) {
    const audioBuffer = await downloadFile(message.voice.file_id);
    if (!audioBuffer) {
      await sendMessage(chatId, "Sorry, I couldn't download your voice note. Please try again.");
      return;
    }

    const transcription = await transcribeVoiceNote(
      audioBuffer,
      message.voice.mime_type || 'audio/ogg',
    );

    if (!transcription) {
      await sendMessage(chatId, "Sorry, I couldn't transcribe your voice note. Please try typing your message instead.");
      return;
    }

    userText = transcription;
    historyPrefix = '[Voice note]: ';
  }

  // --- Build Claude messages ---
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
  const recentHistory = history.slice(-MAX_CONVERSATION_MESSAGES);

  // Build user content — text or photo+caption
  let userContent: Anthropic.ContentBlockParam[] | string;
  let systemPrompt = SYSTEM_PROMPT;
  let historyEntry = `${historyPrefix}${userText}`;
  let uploadedPhotoUrl = ''; // Hoisted so we can inject it into tool calls

  if (hasPhoto && message.photo) {
    // Use the largest photo (last in array)
    const largestPhoto = message.photo[message.photo.length - 1];
    const photoBuffer = await downloadFile(largestPhoto.file_id);

    if (photoBuffer) {
      // Upload to Supabase Storage so it's permanently available
      const fileId = `tg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const storagePath = `${userId}/telegram/${fileId}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('step-media')
        .upload(storagePath, photoBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      let photoUrl = '';
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('step-media')
          .getPublicUrl(storagePath);
        photoUrl = urlData.publicUrl;
        uploadedPhotoUrl = photoUrl; // Make available to tool loop
      } else {
        console.error('Photo upload error:', uploadError.message);
      }

      const base64 = photoBuffer.toString('base64');
      const captionText = message.caption || 'What is this? If it\'s food, analyze and log the nutrition.';
      const photoUrlNote = photoUrl ? `\n\n[Photo uploaded: ${photoUrl}]` : '';

      userContent = [
        {
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: base64 },
        },
        {
          type: 'text' as const,
          text: `${captionText}${photoUrlNote}`,
        },
      ];
      systemPrompt = PHOTO_SYSTEM_PROMPT;
      historyEntry = `[Sent a photo${message.caption ? `: ${message.caption}` : ''}]${photoUrl ? ` [url: ${photoUrl}]` : ''}`;

      // Store pending photo URL so callback buttons can attach it
      if (photoUrl && conversation?.id) {
        await supabase
          .from('telegram_conversations')
          .update({ pending_photo_url: photoUrl })
          .eq('id', conversation.id);
      }
    } else {
      await sendMessage(chatId, "Sorry, I couldn't download your photo. Please try again.");
      return;
    }
  } else {
    userContent = userText;

    // Clear any pending photo when the user sends a text message (no longer relevant)
    if (conversation?.id) {
      await supabase
        .from('telegram_conversations')
        .update({ pending_photo_url: null })
        .eq('id', conversation.id);
    }
  }

  const messages: Anthropic.MessageParam[] = [
    ...recentHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userContent },
  ];

  // --- Call Claude ---
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const tools = getAnthropicTools();

  let response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    messages,
  });

  // --- Tool use loop ---
  let iterations = 0;
  let lastKeyboard: InlineKeyboardButton[][] | null = null;

  while (response.stop_reason === 'tool_use' && iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ContentBlockParam & { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
        b.type === 'tool_use',
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      // Inject photo_url for attach_step_evidence — Claude often omits this optional param
      let toolInput = block.input;
      if (block.name === 'attach_step_evidence' && uploadedPhotoUrl) {
        toolInput = { ...block.input, photo_url: uploadedPhotoUrl };
      }
      const result = await executeTool(block.name, toolInput, supabase, auth);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: result,
      });
      // Check if this tool result warrants inline buttons
      // When a photo is pending, show "Attach to" buttons instead of Start/Done
      const keyboard = getToolResponseKeyboard(block.name, result, hasPhoto);
      if (keyboard !== null) {
        // Empty array = explicitly clear keyboard (e.g. after successful attachment)
        lastKeyboard = keyboard.length > 0 ? keyboard : null;
      }
    }

    messages.push({ role: 'assistant', content: response.content as Anthropic.ContentBlockParam[] });
    messages.push({ role: 'user', content: toolResults });

    await sendChatAction(chatId, 'typing');

    response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    });
  }

  // --- Extract final text response ---
  const textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === 'text',
  );
  const responseText = textBlocks.map(b => b.text).join('\n\n') || "I processed your request but don't have anything to say.";

  // --- Send to Telegram (with optional inline keyboard) ---
  const sendOptions: {
    replyMarkup?: { inline_keyboard: InlineKeyboardButton[][] };
  } = {};

  if (lastKeyboard) {
    sendOptions.replyMarkup = { inline_keyboard: lastKeyboard };
  }

  await sendMessage(chatId, responseText, sendOptions);

  // --- Save conversation ---
  // IMPORTANT: Only save Claude's final text response — do NOT save tool call
  // summaries like "[Called tool_name]" because Claude Haiku will mimic those
  // patterns in future turns instead of actually calling tools.
  const savedAssistantContent = responseText;

  const updatedHistory = [
    ...recentHistory,
    { role: 'user', content: historyEntry },
    { role: 'assistant', content: savedAssistantContent },
  ];

  await supabase
    .from('telegram_conversations')
    .update({
      messages: updatedHistory,
      last_active_at: new Date().toISOString(),
      user_id: userId,
    })
    .eq('id', conversation?.id);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    // Handle inline keyboard button presses
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      ok();
      return;
    }

    // Handle messages (text, photo, voice)
    if (update.message?.from) {
      await handleMessage(update.message);
    }

    ok();
  } catch (error) {
    console.error('Telegram webhook error:', error);

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
