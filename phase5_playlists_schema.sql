-- =====================================================================
-- Phase 5 — Playlists / Collections
--   1) playlists        — user-curated collections of books/movies
--   2) playlist_items   — many-to-many with position + uniqueness
--
-- Apply via Supabase SQL Editor. Safe to re-run (idempotent).
-- =====================================================================

-- ---------- 1. PLAYLISTS ----------
create table if not exists public.playlists (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references public.profiles(id) on delete cascade,
    title        text not null check (char_length(title) between 1 and 120),
    description  text,
    cover_url    text,
    is_public    boolean not null default true,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create index if not exists playlists_user_idx       on public.playlists (user_id, updated_at desc);
create index if not exists playlists_public_idx     on public.playlists (is_public, updated_at desc) where is_public = true;

alter table public.playlists enable row level security;

drop policy if exists "playlists_read_public_or_own" on public.playlists;
drop policy if exists "playlists_insert_own"         on public.playlists;
drop policy if exists "playlists_update_own"         on public.playlists;
drop policy if exists "playlists_delete_own"         on public.playlists;

-- Anyone can read public playlists; owners can read their own private ones.
create policy "playlists_read_public_or_own" on public.playlists
    for select using (is_public = true or auth.uid() = user_id);

create policy "playlists_insert_own" on public.playlists
    for insert with check (auth.uid() = user_id);

create policy "playlists_update_own" on public.playlists
    for update using (auth.uid() = user_id);

create policy "playlists_delete_own" on public.playlists
    for delete using (auth.uid() = user_id);

-- ---------- 2. PLAYLIST ITEMS ----------
create table if not exists public.playlist_items (
    playlist_id  uuid not null references public.playlists(id) on delete cascade,
    content_id   uuid not null references public.content(id)   on delete cascade,
    position     int  not null default 0,
    added_at     timestamptz not null default now(),
    primary key (playlist_id, content_id)
);

create index if not exists playlist_items_playlist_idx on public.playlist_items (playlist_id, position);
create index if not exists playlist_items_content_idx  on public.playlist_items (content_id);

alter table public.playlist_items enable row level security;

drop policy if exists "playlist_items_read_if_playlist_visible" on public.playlist_items;
drop policy if exists "playlist_items_write_if_owner"           on public.playlist_items;
drop policy if exists "playlist_items_update_if_owner"          on public.playlist_items;
drop policy if exists "playlist_items_delete_if_owner"          on public.playlist_items;

-- SELECT: readable whenever the parent playlist is readable
create policy "playlist_items_read_if_playlist_visible" on public.playlist_items
    for select using (
        exists (
            select 1 from public.playlists p
            where p.id = playlist_id
              and (p.is_public = true or p.user_id = auth.uid())
        )
    );

-- INSERT/UPDATE/DELETE: only playlist owner
create policy "playlist_items_write_if_owner" on public.playlist_items
    for insert with check (
        exists (
            select 1 from public.playlists p
            where p.id = playlist_id and p.user_id = auth.uid()
        )
    );

create policy "playlist_items_update_if_owner" on public.playlist_items
    for update using (
        exists (
            select 1 from public.playlists p
            where p.id = playlist_id and p.user_id = auth.uid()
        )
    );

create policy "playlist_items_delete_if_owner" on public.playlist_items
    for delete using (
        exists (
            select 1 from public.playlists p
            where p.id = playlist_id and p.user_id = auth.uid()
        )
    );
