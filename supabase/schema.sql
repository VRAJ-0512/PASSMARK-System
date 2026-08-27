create table if not exists public.permits (
  id text primary key,
  visitor_name text not null,
  vehicle_number text not null,
  flat_number text not null,
  purpose text not null default 'guest',
  status text not null default 'pending',
  qr_code text not null,
  entry_time timestamp with time zone default timezone('utc'::text, now()),
  exit_time timestamp with time zone,
  expiry_time timestamp with time zone,
  parking_slot text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.parking_slots (
  id text primary key,
  slot_number text not null unique,
  zone text not null,
  status text not null default 'available',
  occupied_by text references public.permits(id) on delete set null,
  vehicle_number text,
  entry_time timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.system_logs (
  id text primary key,
  timestamp timestamp with time zone default timezone('utc'::text, now()),
  action text not null,
  actor text not null,
  details text not null,
  type text not null default 'info',
  permit_id text,
  slot_number text,
  vehicle_number text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user',
  name text,
  flat_number text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Row Level Security
alter table public.permits enable row level security;
alter table public.parking_slots enable row level security;
alter table public.system_logs enable row level security;
alter table public.profiles enable row level security;

-- Permissive policies for demo / internal deployment
create policy "Allow read access to all users" on public.permits for select using (true);
create policy "Allow write access to all users" on public.permits for all using (true);

create policy "Allow read access to all users" on public.parking_slots for select using (true);
create policy "Allow write access to all users" on public.parking_slots for all using (true);

create policy "Allow read access to all users" on public.system_logs for select using (true);
create policy "Allow write access to all users" on public.system_logs for all using (true);

create policy "Allow read access to all users" on public.profiles for select using (true);
create policy "Allow write access to all users" on public.profiles for all using (true);

-- Realtime replication
alter publication supabase_realtime add table public.permits;
alter publication supabase_realtime add table public.parking_slots;
alter publication supabase_realtime add table public.system_logs;
