-- Create a table to store Shopify shop info and access tokens
create table if not exists shopify_shops (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  shop_domain text not null unique,
  access_token text not null,
  created_at timestamp with time zone default now()
);
