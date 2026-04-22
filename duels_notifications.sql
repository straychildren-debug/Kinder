-- =====================================================================
-- Notifications for Duels (Arena of Opinions)
--   Automatically alerts challenger and defender when a duel is created.
-- =====================================================================

-- Function to handle notifications when a duel is created
create or replace function public.on_duel_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_challenger_user uuid;
    v_defender_user uuid;
    v_content_title text;
begin
    -- 1. Get challenger's user_id
    select user_id into v_challenger_user
    from public.reviews
    where id = new.challenger_review_id;

    -- 2. Get defender's user_id
    select user_id into v_defender_user
    from public.reviews
    where id = new.defender_review_id;

    -- 3. Get content title
    select title into v_content_title
    from public.content
    where id = new.content_id;

    -- 4. Create notification for challenger
    if v_challenger_user is not null then
        insert into public.notifications (user_id, actor_id, type, payload)
        values (
            v_challenger_user,
            new.created_by, -- NULL for auto-duels
            'duel_nomination',
            jsonb_build_object(
                'title', v_content_title,
                'duel_id', new.id
            )
        );
    end if;

    -- 5. Create notification for defender (if different from challenger)
    if v_defender_user is not null and v_defender_user <> coalesce(v_challenger_user, '00000000-0000-0000-0000-000000000000'::uuid) then
        insert into public.notifications (user_id, actor_id, type, payload)
        values (
            v_defender_user,
            new.created_by,
            'duel_nomination',
            jsonb_build_object(
                'title', v_content_title,
                'duel_id', new.id
            )
        );
    end if;

    return new;
end;
$$;

-- Trigger for new duels
drop trigger if exists trg_on_duel_created on public.duels;
create trigger trg_on_duel_created
    after insert on public.duels
    for each row execute function public.on_duel_created();
