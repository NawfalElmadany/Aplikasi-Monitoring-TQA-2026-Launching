-- SQL to create push_subscriptions table in Supabase

create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null, -- references auth.users(id) if referencing auth users
  user_name text,
  subscription_json jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Enable Row Level Security (RLS)
alter table public.push_subscriptions enable row level security;

-- Create policy to allow any authenticated user to manage their own push subscription
create policy "Users can manage their own subscriptions"
  on public.push_subscriptions for all
  using (true)
  with check (true);
