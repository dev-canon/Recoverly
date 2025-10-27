import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// This endpoint will receive abandoned checkout webhooks from Shopify
export async function POST(req: NextRequest) {
  const event = await req.json();
  // TODO: Validate webhook signature for security

  // Save the abandoned checkout event to Supabase (for analytics, recovery, etc.)
  const { error } = await supabase.from('abandoned_checkouts').insert({
    shop_domain: event.shop_domain,
    checkout_id: event.id,
    email: event.email,
    line_items: event.line_items,
    abandoned_at: event.abandoned_checkout_url ? new Date() : null,
    raw: event
  });
  if (error) {
    return NextResponse.json({ error: 'Failed to save abandoned checkout', details: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
