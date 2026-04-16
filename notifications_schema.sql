-- =====================================================================
-- Notifications schema + RLS + triggers for replies / reactions
-- Apply via Supabase SQL editor.
-- =====================================================================

create table if not exists public.notifications (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references public.profiles(id) on delete cascade, -- recipient
    actor_id    uuid references public.profiles(id) on delete set null,         -- who triggered it
    type        text not null,  -- 'reply' | 'reaction' | 'mention' | 'club_invite' | 'marathon'
    club_id     uuid references public.clubs(id) on delete cascade,
    message_id  uuid references public.club_messages(id) on delete cascade,
    payload     jsonb default '{}'::jsonb,  -- extra fields (emoji, text preview, etc.)
    created_at  timestamptz not null default now(),
    read_at     timestamptz
);

create index if not exists notifications_user_created_idx
    on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
    on public.notifications (user_id) where read_at is null;

-- ---------- RLS ----------
alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
    for select
    using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
    for update
    using (auth.uid() = user_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
    for delete
    using (auth.uid() = user_id);

-- Inserts are done by server-side triggers (security definer).

-- ---------- Trigger: new reply to a message ----------
create or replace function public.on_club_message_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_target_user uuid;
    v_preview text;
begin
    if new.reply_to_id is null then
        return new;
    end if;

    select user_id into v_target_user
    from public.club_messages
    where id = new.reply_to_id;

    if v_target_user is null or v_target_user = new.user_id then
        return new;
    end if;

    v_preview := coalesce(left(new.text, 140), '');

    insert into public.notifications (user_id, actor_id, type, club_id, message_id, payload)
    values (
        v_target_user,
        new.user_id,
        'reply',
        new.club_id,
        new.id,
        jsonb_build_object('preview', v_preview)
    );

    return new;
end;
$$;

drop trigger if exists trg_on_club_message_reply on public.club_messages;
create trigger trg_on_club_message_reply
    after insert on public.club_messages
    for each row execute function public.on_club_message_reply();

-- ---------- Trigger: new reaction on user's message ----------
create or replace function public.on_club_message_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_msg record;
begin
    select user_id, club_id into v_msg
    from public.club_messages
    where id = new.message_id;

    if v_msg.user_id is null or v_msg.user_id = new.user_id then
        return new;
    end if;

    insert into public.notifications (user_id, actor_id, type, club_id, message_id, payload)
    values (
        v_msg.user_id,
        new.user_id,
        'reaction',
        v_msg.club_id,
        new.message_id,
        jsonb_build_object('emoji', new.emoji)
    );

    return new;
end;
$$;

drop trigger if exists trg_on_club_message_reaction on public.club_message_reactions;
create trigger trg_on_club_message_reaction
    after insert on public.club_message_reactions
    for each row execute function public.on_club_message_reaction();

-- ---------- Enable realtime ----------
-- In Supabase Dashboard → Database → Replication → tables:
-- toggle `notifications` ON for the `supabase_realtime` publication.
-- Or run:
-- alter publication supabase_realtime add table public.notifications;
