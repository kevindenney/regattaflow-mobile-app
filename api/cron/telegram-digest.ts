import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendMessage } from '../../lib/telegram/client';
import { buildMorningDigest, buildEveningDigest } from '../../lib/telegram/digest';

const MAX_USERS_PER_RUN = 50;

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase config');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const digestType = (req.query.type as string) || 'morning';
  const buildDigest = digestType === 'evening' ? buildEveningDigest : buildMorningDigest;

  try {
    // Get all active linked users with a chat_id and digests enabled
    const { data: links, error } = await supabase
      .from('telegram_links')
      .select('user_id, telegram_chat_id')
      .eq('is_active', true)
      .eq('digest_enabled', true)
      .not('linked_at', 'is', null)
      .not('telegram_chat_id', 'is', null)
      .limit(MAX_USERS_PER_RUN);

    if (error) {
      console.error('Digest query error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    if (!links?.length) {
      return res.status(200).json({ ok: true, sent: 0, message: 'No eligible users' });
    }

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const link of links) {
      try {
        const digest = await buildDigest(supabase, link.user_id);
        if (!digest) {
          skipped++;
          continue;
        }

        await sendMessage(link.telegram_chat_id, digest);
        sent++;
      } catch (err) {
        console.error(`Digest error for user ${link.user_id}:`, err);
        errors++;
      }
    }

    console.log(`Telegram ${digestType} digest: sent=${sent}, skipped=${skipped}, errors=${errors}`);
    return res.status(200).json({ ok: true, type: digestType, sent, skipped, errors });
  } catch (error: any) {
    console.error('Telegram digest cron error:', error);
    return res.status(500).json({ error: 'Digest cron failed', detail: error?.message });
  }
};

export default handler;
