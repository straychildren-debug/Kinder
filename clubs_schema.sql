-- ============================================================
-- Clubs Feature — Database Schema
-- ============================================================

-- 1. Clubs table
CREATE TABLE public.clubs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('кино', 'книги')),
    image_url TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Everyone can view clubs
CREATE POLICY "Clubs are viewable by everyone"
ON public.clubs FOR SELECT USING (true);

-- Authenticated users can create clubs
CREATE POLICY "Authenticated users can create clubs"
ON public.clubs FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Only owner can update their club
CREATE POLICY "Owner can update their club"
ON public.clubs FOR UPDATE USING (auth.uid() = owner_id);

-- Only owner can delete their club
CREATE POLICY "Owner can delete their club"
ON public.clubs FOR DELETE USING (auth.uid() = owner_id);


-- 2. Club Members table
CREATE TABLE public.club_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- Everyone can view club members
CREATE POLICY "Club members are viewable by everyone"
ON public.club_members FOR SELECT USING (true);

-- Authenticated users can join a club (insert themselves as member)
CREATE POLICY "Users can join clubs"
ON public.club_members FOR INSERT WITH CHECK (
    auth.uid() = user_id AND role = 'member'
);

-- Owner/admin can insert members with any role (for invites/promotions)
CREATE POLICY "Owner and admin can manage members"
ON public.club_members FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);

-- Owner/admin can update member roles
CREATE POLICY "Owner and admin can update member roles"
ON public.club_members FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);

-- Users can leave (delete themselves) or owner/admin can remove
CREATE POLICY "Users can leave clubs"
ON public.club_members FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);


-- 3. Club Messages table
CREATE TABLE public.club_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    text TEXT,
    file_url TEXT,
    file_type TEXT CHECK (file_type IN ('image', 'file') OR file_type IS NULL),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.club_messages ENABLE ROW LEVEL SECURITY;

-- Club members can view messages
CREATE POLICY "Club members can view messages"
ON public.club_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_messages.club_id
        AND cm.user_id = auth.uid()
    )
);

-- Club members can send messages
CREATE POLICY "Club members can send messages"
ON public.club_messages FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_messages.club_id
        AND cm.user_id = auth.uid()
    )
);

-- Owner/admin can delete messages (moderation)
CREATE POLICY "Owner and admin can delete messages"
ON public.club_messages FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_messages.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);


-- 4. Club Marathons table
CREATE TABLE public.club_marathons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.club_marathons ENABLE ROW LEVEL SECURITY;

-- Everyone can view marathons
CREATE POLICY "Marathons are viewable by everyone"
ON public.club_marathons FOR SELECT USING (true);

-- Owner/admin can create marathons
CREATE POLICY "Owner and admin can create marathons"
ON public.club_marathons FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_marathons.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);

-- Owner/admin can update marathons (e.g. deactivate)
CREATE POLICY "Owner and admin can update marathons"
ON public.club_marathons FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_marathons.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);

-- Owner/admin can delete marathons
CREATE POLICY "Owner and admin can delete marathons"
ON public.club_marathons FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_marathons.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
);


-- 5. Enable Realtime on club_messages for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_messages;


-- 6. Storage bucket for club file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-files', 'club-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for club-files
CREATE POLICY "Public read access for club files" ON storage.objects
FOR SELECT USING (bucket_id = 'club-files');

CREATE POLICY "Authenticated users can upload club files" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'club-files' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own club files" ON storage.objects
FOR DELETE USING (
    bucket_id = 'club-files' AND
    auth.uid() = owner
);

-- 7. Marathon Items table
CREATE TABLE public.club_marathon_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    marathon_id UUID REFERENCES public.club_marathons(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.club_marathon_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marathon items viewable by everyone" ON public.club_marathon_items FOR SELECT USING (true);
CREATE POLICY "Marathon items insertable by admin/owner" ON public.club_marathon_items FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.club_members cm
        JOIN public.club_marathons m ON m.club_id = cm.club_id
        WHERE cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
        AND m.id = marathon_id
    )
);

-- 8. Marathon Participants table
CREATE TABLE public.club_marathon_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    marathon_id UUID REFERENCES public.club_marathons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES public.club_marathon_items(id) ON DELETE CASCADE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    review_text TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

ALTER TABLE public.club_marathon_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marathon progress viewable by everyone" ON public.club_marathon_participants FOR SELECT USING (true);
CREATE POLICY "Users can insert own progress" ON public.club_marathon_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.club_marathon_participants FOR UPDATE USING (auth.uid() = user_id);

