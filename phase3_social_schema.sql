-- =====================================================================
-- Phase 3 — Social mechanics
--   1) user_wishlists     — «Хочу посмотреть/прочитать»
--   2) user_awards        — Достижения/бейджи
--   3) activity_events    — Публичная лента активности
--
-- Apply via Supabase SQL Editor. Safe to re-run (idempotent).
-- After applying:
--   alter publication supabase_realtime add table public.user_awards;
--   alter publication supabase_realtime add table public.activity_events;
-- =====================================================================

-- ---------- 1. WISHLISTS ----------
create table if not exists public.user_wishlists (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references public.profiles(id) on delete cascade,
    content_id  uuid not null references public.content(id) on delete cascade,
    created_at  timestamptz not null default now(),
    unique (user_id, content_id)
);

create index if not exists user_wishlists_user_idx
    on public.user_wishlists (user_id, created_at desc);

alter table public.user_wishlists enable row level security;

drop policy if exists "wishlists_select_own" on public.user_wishlists;
create policy "wishlists_select_own" on public.user_wishlists
    for select using (auth.uid() = user_id);

drop policy if exists "wishlists_insert_own" on public.user_wishlists;
create policy "wishlists_insert_own" on public.user_wishlists
    for insert with check (auth.uid() = user_id);

drop policy if exists "wishlists_delete_own" on public.user_wishlists;
create policy "wishlists_delete_own" on public.user_wishlists
    for delete using (auth.uid() = user_id);

-- ---------- 2. AWARDS ----------
create table if not exists public.user_awards (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references public.profiles(id) on delete cascade,
    type        text not null,
    payload     jsonb default '{}'::jsonb,
    earned_at   timestamptz not null default now(),
    unique (user_id, type)
);

create index if not exists user_awards_user_idx
    on public.user_awards (user_id, earned_at desc);

alter table public.user_awards enable row level security;

drop policy if exists "awards_select_all" on public.user_awards;
create policy "awards_select_all" on public.user_awards
    for select using (true);  -- публично видимы

-- Inserts всегда делаются триггерами (security definer).

-- ---------- 3. ACTIVITY EVENTS ----------
create table if not exists public.activity_events (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references public.profiles(id) on delete cascade,
    type        text not null,
    ref_id      uuid,
    ref_type    text,
    payload     jsonb default '{}'::jsonb,
    created_at  timestamptz not null default now()
);

create index if not exists activity_events_created_idx
    on public.activity_events (created_at desc);

create index if not exists activity_events_user_idx
    on public.activity_events (user_id, created_at desc);

alter table public.activity_events enable row level security;

drop policy if exists "activity_select_all" on public.activity_events;
create policy "activity_select_all" on public.activity_events
    for select using (true);

-- ---------- HELPERS ----------
-- Вставка бейджа с «silent»-логикой: если уже есть — ничего не делаем.
create or replace function public._grant_award(
    p_user_id uuid,
    p_type text,
    p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.user_awards (user_id, type, payload)
    values (p_user_id, p_type, p_payload)
    on conflict (user_id, type) do nothing;
end;
$$;

-- Вставка события ленты.
create or replace function public._log_activity(
    p_user_id uuid,
    p_type text,
    p_ref_id uuid,
    p_ref_type text,
    p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.activity_events (user_id, type, ref_id, ref_type, payload)
    values (p_user_id, p_type, p_ref_id, p_ref_type, p_payload);
end;
$$;

-- ---------- TRIGGERS ----------

-- Рецензия: логируем активность + выдаём бейджи 1/10/100 рецензий.
create or replace function public.on_review_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_count int;
    v_title text;
begin
    select count(*) into v_count
    from public.reviews
    where user_id = new.user_id;

    select title into v_title from public.content where id = new.content_id;

    perform public._log_activity(
        new.user_id,
        'reviewed_content',
        new.content_id,
        'content',
        jsonb_build_object(
            'rating', new.rating,
            'title', v_title,
            'preview', left(coalesce(new.text, ''), 160)
        )
    );

    if v_count = 1 then
        perform public._grant_award(new.user_id, 'first_review');
    elsif v_count = 10 then
        perform public._grant_award(new.user_id, 'ten_reviews');
    elsif v_count = 100 then
        perform public._grant_award(new.user_id, 'hundred_reviews');
    end if;

    return new;
end;
$$;

drop trigger if exists trg_on_review_insert on public.reviews;
create trigger trg_on_review_insert
    after insert on public.reviews
    for each row execute function public.on_review_insert();

-- Контент одобрен: активность + бейджи за 1/10 публикаций.
create or replace function public.on_content_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_approved_count int;
begin
    -- Переход в 'approved' и ранее он не был approved
    if new.status = 'approved' and coalesce(old.status, '') <> 'approved' then
        select count(*) into v_approved_count
        from public.content
        where created_by = new.created_by and status = 'approved';

        perform public._log_activity(
            new.created_by,
            'published_content',
            new.id,
            new.type,
            jsonb_build_object('title', new.title)
        );

        if v_approved_count = 1 then
            perform public._grant_award(new.created_by, 'first_publication');
        elsif v_approved_count = 10 then
            perform public._grant_award(new.created_by, 'ten_publications');
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_on_content_approved on public.content;
create trigger trg_on_content_approved
    after update on public.content
    for each row execute function public.on_content_approved();

-- Вступление в клуб: активность + бейдж «первый клуб».
create or replace function public.on_club_member_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_count int;
    v_club_name text;
begin
    select count(*) into v_count
    from public.club_members where user_id = new.user_id;

    select name into v_club_name from public.clubs where id = new.club_id;

    perform public._log_activity(
        new.user_id,
        'joined_club',
        new.club_id,
        'club',
        jsonb_build_object('club_name', v_club_name)
    );

    if v_count = 1 then
        perform public._grant_award(new.user_id, 'first_club');
    end if;

    return new;
end;
$$;

drop trigger if exists trg_on_club_member_insert on public.club_members;
create trigger trg_on_club_member_insert
    after insert on public.club_members
    for each row execute function public.on_club_member_insert();

-- Завершение марафона: если после апдейта у юзера completed по всем пунктам —
-- выдаём 'marathon_winner' и пишем активность.
create or replace function public.on_marathon_progress_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_completed int;
    v_total int;
    v_title text;
begin
    if new.is_completed is not true then
        return new;
    end if;

    select count(*) into v_total
    from public.club_marathon_items
    where marathon_id = new.marathon_id;

    select count(distinct item_id) into v_completed
    from public.club_marathon_participants
    where marathon_id = new.marathon_id
      and user_id = new.user_id
      and is_completed = true;

    if v_total > 0 and v_completed = v_total then
        select title into v_title from public.club_marathons where id = new.marathon_id;

        perform public._log_activity(
            new.user_id,
            'completed_marathon',
            new.marathon_id,
            'marathon',
            jsonb_build_object('title', v_title)
        );

        perform public._grant_award(
            new.user_id,
            'marathon_winner',
            jsonb_build_object('marathon_id', new.marathon_id, 'title', v_title)
        );
    end if;

    return new;
end;
$$;

drop trigger if exists trg_on_marathon_progress_update on public.club_marathon_participants;
create trigger trg_on_marathon_progress_update
    after insert or update on public.club_marathon_participants
    for each row execute function public.on_marathon_progress_update();

-- При получении бейджа: активность в ленте + уведомление пользователю.
create or replace function public.on_award_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public._log_activity(
        new.user_id,
        'earned_award',
        new.id,
        'award',
        jsonb_build_object('type', new.type, 'payload', new.payload)
    );

    insert into public.notifications (user_id, actor_id, type, payload)
    values (
        new.user_id,
        new.user_id,
        'marathon',  -- используем общий тип уведомления; UI отрисует по payload.award_type
        jsonb_build_object('kind', 'award', 'award_type', new.type)
    );

    return new;
end;
$$;

drop trigger if exists trg_on_award_insert on public.user_awards;
create trigger trg_on_award_insert
    after insert on public.user_awards
    for each row execute function public.on_award_insert();

-- ---------- REALTIME ----------
-- В Supabase Dashboard → Database → Replication включите таблицы
-- user_awards и activity_events в публикации supabase_realtime, либо:
--   alter publication supabase_realtime add table public.user_awards;
--   alter publication supabase_realtime add table public.activity_events;
