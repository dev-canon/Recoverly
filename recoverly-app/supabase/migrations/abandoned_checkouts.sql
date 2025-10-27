-- Table to store abandoned checkout events from Shopify
create table if not exists abandoned_checkouts (
  id uuid default uuid_generate_v4() primary key,
  shop_domain text not null,
  checkout_id text not null,
  email text,
  line_items jsonb,
  abandoned_at timestamp with time zone,
  raw jsonb,
  created_at timestamp with time zone default now()
);
