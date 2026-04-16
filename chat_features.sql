-- ============================================================
-- Chat Features Migration
-- ============================================================

-- 1. PINNED MESSAGES
CREATE TABLE IF NOT EXISTS public.club_pinned_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    message_id UUID REFERENCES public.club_messages(id) ON DELETE CASCADE NOT NULL,
    pinned_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pinned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(club_id, message_id)
);

ALTER TABLE public.club_pinned_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pinned messages viewable by club members" ON public.club_pinned_messages;
CREATE POLICY "Pinned messages viewable by club members"
ON public.club_pinned_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_pinned_messages.club_id
        AND cm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins can pin messages" ON public.club_pinned_messages;
CREATE POLICY "Admins can pin messages"
ON public.club_pinned_messages FOR INSERT WITH CHECK (
    auth.uid() = pinned_by
    AND EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_pinned_messages.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);

DROP POLICY IF EXISTS "Admins can unpin messages" ON public.club_pinned_messages;
CREATE POLICY "Admins can unpin messages"
ON public.club_pinned_messages FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_pinned_messages.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);

-- 2. POLLS
CREATE TABLE IF NOT EXISTS public.club_polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    is_multiple BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.club_polls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Polls viewable by club members" ON public.club_polls;
CREATE POLICY "Polls viewable by club members"
ON public.club_polls FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_polls.club_id
        AND cm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Members can create polls" ON public.club_polls;
CREATE POLICY "Members can create polls"
ON public.club_polls FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_polls.club_id
        AND cm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Creator or admin can update polls" ON public.club_polls;
CREATE POLICY "Creator or admin can update polls"
ON public.club_polls FOR UPDATE USING (
    auth.uid() = created_by
    OR EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_polls.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);

DROP POLICY IF EXISTS "Creator or admin can delete polls" ON public.club_polls;
CREATE POLICY "Creator or admin can delete polls"
ON public.club_polls FOR DELETE USING (
    auth.uid() = created_by
    OR EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_polls.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);

-- Poll Options
CREATE TABLE IF NOT EXISTS public.club_poll_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES public.club_polls(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.club_poll_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Poll options viewable by club members" ON public.club_poll_options;
CREATE POLICY "Poll options viewable by club members"
ON public.club_poll_options FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.club_polls p
        JOIN public.club_members cm ON cm.club_id = p.club_id
        WHERE p.id = club_poll_options.poll_id
        AND cm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Poll creator can insert options" ON public.club_poll_options;
CREATE POLICY "Poll creator can insert options"
ON public.club_poll_options FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.club_polls p
        WHERE p.id = club_poll_options.poll_id
        AND p.created_by = auth.uid()
    )
);

-- Poll Votes
CREATE TABLE IF NOT EXISTS public.club_poll_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES public.club_polls(id) ON DELETE CASCADE NOT NULL,
    option_id UUID REFERENCES public.club_poll_options(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poll_id, option_id, user_id)
);

ALTER TABLE public.club_poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Votes viewable by club members" ON public.club_poll_votes;
CREATE POLICY "Votes viewable by club members"
ON public.club_poll_votes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.club_polls p
        JOIN public.club_members cm ON cm.club_id = p.club_id
        WHERE p.id = club_poll_votes.poll_id
        AND cm.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Members can vote" ON public.club_poll_votes;
CREATE POLICY "Members can vote"
ON public.club_poll_votes FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.club_polls p
        JOIN public.club_members cm ON cm.club_id = p.club_id
        WHERE p.id = club_poll_votes.poll_id
        AND cm.user_id = auth.uid()
        AND p.is_active = true
    )
);

DROP POLICY IF EXISTS "Users can remove their vote" ON public.club_poll_votes;
CREATE POLICY "Users can remove their vote"
ON public.club_poll_votes FOR DELETE USING (
    auth.uid() = user_id
);

-- 3. VOICE MESSAGES: Update file_type CHECK constraint
ALTER TABLE public.club_messages DROP CONSTRAINT IF EXISTS club_messages_file_type_check;
ALTER TABLE public.club_messages ADD CONSTRAINT club_messages_file_type_check
  CHECK (file_type IN ('image', 'file', 'voice') OR file_type IS NULL);

-- 4. Add voice_duration_seconds to club_messages for voice playback
ALTER TABLE public.club_messages ADD COLUMN IF NOT EXISTS voice_duration_seconds NUMERIC DEFAULT NULL;

-- 5. Enable realtime on polls for live vote counts
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_poll_votes;
