-- Users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  unique_id text not null unique,
  first_name text not null,
  last_name text not null,
  password_hash text not null,
  role text not null default 'user',
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  rating numeric not null default 0,
  review_count integer not null default 0
);

-- Listings table
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price numeric not null,
  currency text not null,
  category text not null,
  server_id text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  images text[] not null default '{}',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  rejection_reason text
);

-- Chats table
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  participants uuid[] not null,
  listing_id uuid references public.listings(id) on delete set null,
  unread_count integer not null default 0
);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  timestamp timestamptz not null default now()
);

-- Reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.users(id) on delete cascade,
  to_user_id uuid not null references public.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  related_id uuid
);

-- Helpful indexes
create index if not exists idx_users_name on public.users (first_name, last_name);
create index if not exists idx_listings_user on public.listings (user_id);
create index if not exists idx_messages_chat on public.messages (chat_id);
create index if not exists idx_notifications_user on public.notifications (user_id); 