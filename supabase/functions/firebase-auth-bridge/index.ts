/**
 * Firebase Auth Bridge Edge Function
 * Exchanges Firebase ID token for RegattaFlow/Supabase session
 * Uses direct REST API calls to avoid supabase-js bundling issues
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') || 'dragon-worlds-app';
const FIREBASE_API_KEY = Deno.env.get('FIREBASE_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface BridgeRequest {
  firebaseToken: string;
  profile?: {
    displayName?: string;
    boatClass?: string;
    clubName?: string;
    photoUrl?: string;
  };
  communitySlug?: string;
}

// Direct Supabase REST API helper
async function supabaseQuery(
  table: string,
  options: {
    method?: string;
    select?: string;
    filter?: Record<string, string>;
    body?: Record<string, unknown>;
    upsert?: boolean;
  } = {}
) {
  const { method = 'GET', select, filter, body, upsert } = options;

  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  const params = new URLSearchParams();

  if (select) params.set('select', select);
  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      params.set(key, value);
    }
  }

  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  const headers: Record<string, string> = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  if (upsert) {
    headers['Prefer'] = 'resolution=merge-duplicates';
  }
  if (method === 'GET') {
    headers['Prefer'] = 'return=representation';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error: ${error}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Create user via Supabase Auth Admin API
async function createAuthUser(email: string, metadata: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      email_confirm: true,
      user_metadata: metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create auth user');
  }

  return response.json();
}

// Decode JWT payload
function decodeJwt(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
  return JSON.parse(atob(padded));
}

// Verify Firebase token
async function verifyFirebaseToken(idToken: string) {
  if (FIREBASE_API_KEY) {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    const data = await response.json();
    const user = data.users?.[0];
    if (!user) throw new Error('User not found');

    return {
      localId: user.localId,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoUrl,
    };
  }

  // Fallback: decode and validate
  const payload = decodeJwt(idToken);
  const now = Math.floor(Date.now() / 1000);

  if (!payload.sub) throw new Error('Invalid token');
  if (payload.exp && (payload.exp as number) < now) throw new Error('Token expired');
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) throw new Error('Invalid issuer');
  if (payload.aud !== FIREBASE_PROJECT_ID) throw new Error('Invalid audience');

  return {
    localId: payload.sub as string,
    email: payload.email as string,
    displayName: payload.name as string | undefined,
    photoUrl: payload.picture as string | undefined,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: BridgeRequest = await req.json().catch(() => ({}));

    // Accept Firebase token from body OR Authorization header
    let firebaseToken = body.firebaseToken;
    if (!firebaseToken) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        firebaseToken = authHeader.slice(7);
      }
    }

    if (!firebaseToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firebase token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify Firebase token
    let firebaseUser;
    try {
      firebaseUser = await verifyFirebaseToken(firebaseToken);
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired Firebase token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userId: string;
    let isNewUser = false;

    // Check for existing user by firebase_uid
    const existingByFirebase = await supabaseQuery('users', {
      select: 'id',
      filter: { firebase_uid: `eq.${firebaseUser.localId}` },
    });

    if (existingByFirebase?.[0]) {
      userId = existingByFirebase[0].id;
    } else {
      // Check by email
      const existingByEmail = await supabaseQuery('users', {
        select: 'id',
        filter: { email: `eq.${firebaseUser.email.toLowerCase()}` },
      });

      if (existingByEmail?.[0]) {
        userId = existingByEmail[0].id;
        // Link Firebase UID
        await supabaseQuery('users', {
          method: 'PATCH',
          filter: { id: `eq.${userId}` },
          body: { firebase_uid: firebaseUser.localId, auth_source: 'dragon_worlds' },
        });
      } else {
        // Create new user
        isNewUser = true;
        const displayName = body.profile?.displayName || firebaseUser.displayName || firebaseUser.email.split('@')[0];

        const authUser = await createAuthUser(firebaseUser.email, {
          full_name: displayName,
          avatar_url: body.profile?.photoUrl || firebaseUser.photoUrl,
          firebase_uid: firebaseUser.localId,
          auth_source: 'dragon_worlds',
        });

        userId = authUser.id;

        // Create profile
        await supabaseQuery('users', {
          method: 'POST',
          body: {
            id: userId,
            email: firebaseUser.email.toLowerCase(),
            full_name: displayName,
            avatar_url: body.profile?.photoUrl || firebaseUser.photoUrl,
            firebase_uid: firebaseUser.localId,
            auth_source: 'dragon_worlds',
            user_type: 'sailor',
            onboarding_completed: true,
          },
          upsert: true,
        });
      }
    }

    // Auto-join community
    const communitySlug = body.communitySlug || '2027-hk-dragon-worlds';
    const communities = await supabaseQuery('communities', {
      select: 'id',
      filter: { slug: `eq.${communitySlug}` },
    });

    if (communities?.[0]) {
      await supabaseQuery('community_memberships', {
        method: 'POST',
        body: {
          user_id: userId,
          community_id: communities[0].id,
          role: 'member',
          notifications_enabled: true,
        },
        upsert: true,
      });
    }

    // Generate bridge token
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 300;
    const accessToken = btoa(JSON.stringify({
      sub: userId,
      email: firebaseUser.email,
      type: 'firebase_bridge',
      iat: now,
      exp,
    }));

    // Get profile
    const profiles = await supabaseQuery('users', {
      select: 'full_name',
      filter: { id: `eq.${userId}` },
    });

    // Return response in format expected by Dragon Worlds client
    return new Response(
      JSON.stringify({
        success: true,
        session: {
          accessToken,
          userId,
          email: firebaseUser.email,
          expiresAt: exp * 1000, // Convert to milliseconds for client
          refreshToken: '',
        },
        // Also include flat fields for backwards compatibility
        accessToken,
        refreshToken: '',
        expiresIn: 300,
        expiresAt: exp,
        user: {
          id: userId,
          email: firebaseUser.email,
          fullName: profiles?.[0]?.full_name,
          isNewUser,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Bridge error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
