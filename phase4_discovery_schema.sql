-- =====================================================================
-- Phase 4 — Discovery
--   Добавляем profiles.pinned_content_id — «любимая книга/фильм»,
--   которая закрепляется в шапке профиля.
--
-- Apply via Supabase SQL Editor. Idempotent.
-- =====================================================================

alter table public.profiles
    add column if not exists pinned_content_id uuid
    references public.content(id) on delete set null;

create index if not exists profiles_pinned_content_idx
    on public.profiles (pinned_content_id)
    where pinned_content_id is not null;
