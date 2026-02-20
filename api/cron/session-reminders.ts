import type { VercelRequest, VercelResponse } from '@vercel/node';

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/session-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    });

    const body = await response.text();
    console.log(`session-reminders: ${response.status}`, body);

    return res.status(response.status).json({
      ok: response.ok,
      status: response.status,
      body: body ? JSON.parse(body) : null,
    });
  } catch (error: any) {
    console.error('session-reminders cron error:', error);
    return res.status(500).json({ error: 'Failed to invoke edge function', detail: error?.message });
  }
};

export default handler;
