-- 1. Добавление колонки времени последнего прочтения
ALTER TABLE public.club_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Функция для получения списка клубов с количеством непрочитанных сообщений
-- Она возвращает все клубы, но для тех, где пользователь состоит, считает unread_count
CREATE OR REPLACE FUNCTION get_clubs_with_unread(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    image_url TEXT,
    owner_id UUID,
    created_at TIMESTAMPTZ,
    member_count BIGINT,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.category, 
        c.image_url, 
        c.owner_id, 
        c.created_at,
        (SELECT count(*) FROM public.club_members cm WHERE cm.club_id = c.id) as member_count,
        COALESCE(
            (SELECT count(*) FROM public.club_messages msg 
             JOIN public.club_members mem ON mem.club_id = c.id AND mem.user_id = p_user_id
             WHERE msg.club_id = c.id AND msg.created_at > mem.last_read_at), 
            0
        ) as unread_count
    FROM public.clubs c;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 1. Add is_edited to club_messages
ALTER TABLE public.club_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;

-- 2. Add UPDATE policy to club_messages
DROP POLICY IF EXISTS "Club members can update own messages" ON public.club_messages;
CREATE POLICY "Club members can update own messages"
ON public.club_messages FOR UPDATE USING (
    auth.uid() = user_id
);

-- 3. Create reactions table
CREATE TABLE IF NOT EXISTS public.club_message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES public.club_messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- 4. Set up permissions for reactions
ALTER TABLE public.club_message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reactions viewable by everyone" ON public.club_message_reactions;
CREATE POLICY "Reactions viewable by everyone" 
ON public.club_message_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add reactions" ON public.club_message_reactions;
CREATE POLICY "Users can add reactions" 
ON public.club_message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their reactions" ON public.club_message_reactions;
CREATE POLICY "Users can remove their reactions" 
ON public.club_message_reactions FOR DELETE USING (auth.uid() = user_id);

-- 5. Add reactions table to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_message_reactions;
