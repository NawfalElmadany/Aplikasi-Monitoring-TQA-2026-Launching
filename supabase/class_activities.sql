-- SQL to create class_activities table in Supabase

create table if not exists public.class_activities (
  id uuid default gen_random_uuid() primary key,
  class_name text not null, -- e.g. "Kelas 5C"
  start_date date not null, -- Monday date of the week, e.g. '2026-08-10'
  end_date date not null,   -- Friday/Sunday date of the week, e.g. '2026-08-14'
  day_name text not null,   -- 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'
  activity_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(class_name, start_date, day_name)
);

-- Enable Row Level Security (RLS)
alter table public.class_activities enable row level security;

-- Policy to allow anyone (anonymous or authenticated) to read activities
create policy "Allow read for all"
  on public.class_activities for select
  using (true);

-- Policy to allow authenticated users to perform insert, update, or delete
create policy "Allow all for authenticated users"
  on public.class_activities for all
  using (true)
  with check (true);
