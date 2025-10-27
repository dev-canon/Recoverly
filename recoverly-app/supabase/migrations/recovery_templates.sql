-- Table to store user recovery message templates
create table if not exists recovery_templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  subject text not null default 'Come back and complete your purchase! 🎉',
  body text not null default 'Hi {{customer}},\n\nWe noticed you left something in your cart. Click below to complete your order!\n\n{{checkout_url}}',
  created_at timestamp with time zone default now()
);
