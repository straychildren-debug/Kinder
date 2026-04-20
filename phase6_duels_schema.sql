-- =====================================================================
-- Phase 6 — Critic Duels ("Дуэль критиков")
--   1) duels          — two polar reviews pitched against each other
--   2) duel_votes     — user votes for a side (one vote per user per duel)
--   3) duel_comments  — dedicated discussion thread for a duel
--
-- Apply via Supabase SQL Editor. Safe to re-run (idempotent).
-- =====================================================================

-- ---------- 1. DUELS ----------
create table if not exists public.duels (
    id                      uuid primary key default gen_random_uuid(),
    content_id              uuid not null references public.content(id) on delete cascade,
    challenger_review_id    uuid not null references public.reviews(id) on delete cascade,
    defender_review_id      uuid not null references public.reviews(id) on delete cascade,
    status                  text not null default 'active' check (status in ('active','finished','cancelled')),
    source                  text not null default 'auto'   check (source in ('auto','nomination','admin')),
    winner_review_id        uuid references public.reviews(id) on delete set null,
    created_by              uuid references public.profiles(id) on delete set null,
    started_at              timestamptz not null default now(),
    ends_at                 timestamptz not null default (now() + interval '7 days'),
    created_at              timestamptz not null default now(),
    constraint duels_distinct_reviews check (challenger_review_id <> defender_review_id)
);

-- Only one active duel per pair of reviews
create unique index if not exists duels_pair_uniq
    on public.duels (
        least(challenger_review_id, defender_review_id),
        greatest(challenger_review_id, defender_review_id)
    )
    where status = 'active';

create index if not exists duels_content_idx   on public.duels (content_id, status);
create index if not exists duels_status_idx    on public.duels (status, started_at desc);

alter table public.duels enable row level security;

drop policy if exists "duels_read_all"          on public.duels;
drop policy if exists "duels_insert_auth"       on public.duels;
drop policy if exists "duels_update_admin"      on public.duels;

create policy "duels_read_all"  on public.duels
    for select using (true);

create policy "duels_insert_auth" on public.duels
    for insert with check (auth.uid() is not null);

-- Only admins/superadmins (or duel creator) can update
create policy "duels_update_admin" on public.duels
    for update using (
        auth.uid() = created_by
        or exists (
            select 1 from public.profiles
            where id = auth.uid() and role in ('admin','superadmin','moderator')
        )
    );

-- ---------- 2. DUEL VOTES ----------
create table if not exists public.duel_votes (
    duel_id     uuid not null references public.duels(id) on delete cascade,
    user_id     uuid not null references public.profiles(id) on delete cascade,
    side        text not null check (side in ('challenger','defender')),
    weight      int  not null default 1,
    created_at  timestamptz not null default now(),
    primary key (duel_id, user_id)
);

create index if not exists duel_votes_duel_idx on public.duel_votes (duel_id);

alter table public.duel_votes enable row level security;

drop policy if exists "duel_votes_read_all"   on public.duel_votes;
drop policy if exists "duel_votes_insert_own" on public.duel_votes;
drop policy if exists "duel_votes_update_own" on public.duel_votes;
drop policy if exists "duel_votes_delete_own" on public.duel_votes;

create policy "duel_votes_read_all"   on public.duel_votes for select using (true);
create policy "duel_votes_insert_own" on public.duel_votes for insert with check (auth.uid() = user_id);
create policy "duel_votes_update_own" on public.duel_votes for update using (auth.uid() = user_id);
create policy "duel_votes_delete_own" on public.duel_votes for delete using (auth.uid() = user_id);

-- ---------- 3. DUEL COMMENTS ----------
create table if not exists public.duel_comments (
    id          uuid primary key default gen_random_uuid(),
    duel_id     uuid not null references public.duels(id) on delete cascade,
    user_id     uuid not null references public.profiles(id) on delete cascade,
    text        text not null check (char_length(text) between 1 and 2000),
    created_at  timestamptz not null default now()
);

create index if not exists duel_comments_duel_idx on public.duel_comments (duel_id, created_at);

alter table public.duel_comments enable row level security;

drop policy if exists "duel_comments_read_all"   on public.duel_comments;
drop policy if exists "duel_comments_insert_own" on public.duel_comments;
drop policy if exists "duel_comments_update_own" on public.duel_comments;
drop policy if exists "duel_comments_delete_own" on public.duel_comments;

create policy "duel_comments_read_all"   on public.duel_comments for select using (true);
create policy "duel_comments_insert_own" on public.duel_comments for insert with check (auth.uid() = user_id);
create policy "duel_comments_update_own" on public.duel_comments for update using (auth.uid() = user_id);
create policy "duel_comments_delete_own" on public.duel_comments for delete using (auth.uid() = user_id);
