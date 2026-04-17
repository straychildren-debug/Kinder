-- =====================================================================
-- Phase 5 — Clubs+
--   club_events             — события клуба (встречи, созвоны, обсуждения)
--   club_event_rsvps        — «иду / не иду / возможно»
--   Триггер на активность + уведомления участникам клуба при создании
--
-- Apply via Supabase SQL Editor. Idempotent where possible.
-- =====================================================================

-- 1. Таблица событий
create table if not exists public.club_events (
    id           uuid primary key default gen_random_uuid(),
    club_id      uuid not null references public.clubs(id) on delete cascade,
    created_by   uuid not null references public.profiles(id) on delete cascade,
    title        text not null,
    description  text,
    starts_at    timestamptz not null,
    ends_at      timestamptz,
    location     text,
    created_at   timestamptz not null default now()
);

create index if not exists club_events_club_idx       on public.club_events(club_id);
create index if not exists club_events_starts_at_idx  on public.club_events(starts_at);

alter table public.club_events enable row level security;

drop policy if exists "members can read events" on public.club_events;
create policy "members can read events" on public.club_events
    for select using (
        exists(
            select 1 from public.club_members m
            where m.club_id = club_events.club_id
              and m.user_id = auth.uid()
        )
    );

drop policy if exists "admins can insert events" on public.club_events;
create policy "admins can insert events" on public.club_events
    for insert with check (
        exists(
            select 1 from public.club_members m
            where m.club_id = club_events.club_id
              and m.user_id = auth.uid()
              and m.role in ('owner','admin')
        )
    );

drop policy if exists "admins can update events" on public.club_events;
create policy "admins can update events" on public.club_events
    for update using (
        exists(
            select 1 from public.club_members m
            where m.club_id = club_events.club_id
              and m.user_id = auth.uid()
              and m.role in ('owner','admin')
        )
    );

drop policy if exists "admins can delete events" on public.club_events;
create policy "admins can delete events" on public.club_events
    for delete using (
        exists(
            select 1 from public.club_members m
            where m.club_id = club_events.club_id
              and m.user_id = auth.uid()
              and m.role in ('owner','admin')
        )
    );

-- 2. RSVP
create table if not exists public.club_event_rsvps (
    id         uuid primary key default gen_random_uuid(),
    event_id   uuid not null references public.club_events(id) on delete cascade,
    user_id    uuid not null references public.profiles(id) on delete cascade,
    status     text not null check (status in ('going','maybe','declined')),
    created_at timestamptz not null default now(),
    unique (event_id, user_id)
);

create index if not exists club_event_rsvps_event_idx on public.club_event_rsvps(event_id);

alter table public.club_event_rsvps enable row level security;

drop policy if exists "members can read rsvps" on public.club_event_rsvps;
create policy "members can read rsvps" on public.club_event_rsvps
    for select using (
        exists(
            select 1
              from public.club_events e
              join public.club_members m
                on m.club_id = e.club_id
             where e.id = club_event_rsvps.event_id
               and m.user_id = auth.uid()
        )
    );

drop policy if exists "user manages own rsvp" on public.club_event_rsvps;
create policy "user manages own rsvp" on public.club_event_rsvps
    for all using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- 3. Триггер: при создании события логируем активность + уведомляем участников
create or replace function public._on_event_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_club record;
begin
    select id, name into v_club from public.clubs where id = new.club_id;

    -- Активность создателя
    insert into public.activity_events (user_id, type, ref_id, ref_type, payload)
    values (
        new.created_by,
        'published_content',
        new.id,
        'event',
        jsonb_build_object(
            'title', new.title,
            'club_id', new.club_id,
            'club_name', v_club.name,
            'starts_at', new.starts_at
        )
    );

    -- Уведомления участникам клуба (кроме автора)
    insert into public.notifications (user_id, actor_id, type, club_id, payload)
    select m.user_id,
           new.created_by,
           'marathon',
           new.club_id,
           jsonb_build_object(
               'event_id', new.id,
               'event_title', new.title,
               'club_name', v_club.name,
               'starts_at', new.starts_at
           )
      from public.club_members m
     where m.club_id = new.club_id
       and m.user_id <> new.created_by;

    return new;
end;
$$;

drop trigger if exists trg_on_event_insert on public.club_events;
create trigger trg_on_event_insert
after insert on public.club_events
for each row execute function public._on_event_insert();

-- 4. Realtime publication
alter publication supabase_realtime add table public.club_events;
alter publication supabase_realtime add table public.club_event_rsvps;
