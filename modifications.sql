-- 1. Добавление колонки времени последнего прочтения
ALTER TABLE public.club_members ADD COLUMN last_read_at TIMESTAMPTZ DEFAULT NOW();

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
