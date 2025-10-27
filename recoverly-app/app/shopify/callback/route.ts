import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// TODO: Replace with your Shopify app credentials
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI || 'https://dev-canon.github.io/Recoverly/api/shopify/callback';

// Supabase setup (use service role key for server-side writes)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function validateHmac(query: URLSearchParams, secret: string) {
  const { hmac, ...rest } = Object.fromEntries(query.entries());
  const message = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join('&');
  const generated = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  return generated === hmac;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params = url.searchParams;
  const shop = params.get('shop');
  const code = params.get('code');
  const hmac = params.get('hmac');
  if (!shop || !code || !hmac) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }
  // Validate HMAC
  const valid = await validateHmac(params, SHOPIFY_API_SECRET!);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid HMAC' }, { status: 400 });
  }
  // Exchange code for access token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  });
  if (!tokenRes.ok) {
    return NextResponse.json({ error: 'Failed to get access token' }, { status: 400 });
  }
  const tokenData = await tokenRes.json();
  // Get current user from Supabase session (JWT in cookie)
  let user_id = null;
  const cookieStore = cookies();
  const supabaseToken = (await cookieStore).get('sb-access-token')?.value;
  if (supabaseToken) {
    const { data: userData } = await supabase.auth.getUser(supabaseToken);
    user_id = userData?.user?.id || null;
  }
  // Store access token and shop info in Supabase, linked to user_id if available
  const { error: dbError } = await supabase.from('shopify_shops').upsert({
    shop_domain: shop,
    access_token: tokenData.access_token,
    user_id
  });
  if (dbError) {
    return NextResponse.json({ error: 'Failed to save shop info', details: dbError.message }, { status: 500 });
  }
  // Register webhook for abandoned checkouts
  const webhookRes = await fetch(`https://${shop}/admin/api/2023-10/webhooks.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': tokenData.access_token
    },
    body: JSON.stringify({
      webhook: {
        topic: 'checkouts/create',
        address: `${process.env.WEBHOOK_URL || 'https://dev-canon.github.io/Recoverly/api/shopify/webhook'}`,
        format: 'json'
      }
    })
  });
  if (!webhookRes.ok) {
    const err = await webhookRes.text();
    return NextResponse.json({ error: 'Failed to register webhook', details: err }, { status: 500 });
  }
  return NextResponse.json({ success: true, shop, user_id, webhook: 'registered' });
}
