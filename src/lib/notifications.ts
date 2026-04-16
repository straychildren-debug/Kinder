import { supabase } from './supabase';
import type { Notification, NotificationType } from './types';

type Row = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  club_id: string | null;
  message_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
  actor?: { name: string | null; avatar_url: string | null } | null;
  club?: { name: string | null } | null;
};

const mapRow = (r: Row): Notification => ({
  id: r.id,
  userId: r.user_id,
  actorId: r.actor_id,
  type: r.type,
  clubId: r.club_id,
  messageId: r.message_id,
  payload: r.payload ?? {},
  createdAt: r.created_at,
  readAt: r.read_at,
  actorName: r.actor?.name ?? undefined,
  actorAvatar: r.actor?.avatar_url ?? undefined,
  clubName: r.club?.name ?? undefined,
});

/** Последние уведомления пользователя (самые свежие сверху). */
export async function getNotifications(
  userId: string,
  limit = 30
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      `
      id, user_id, actor_id, type, club_id, message_id, payload, created_at, read_at,
      actor:profiles!notifications_actor_id_fkey(name, avatar_url),
      club:clubs(name)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getNotifications:', error);
    return [];
  }
  return ((data ?? []) as unknown as Row[]).map(mapRow);
}

/** Число непрочитанных (для бейджа на колокольчике). */
export async function getUnreadNotificationsCount(
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) return 0;
  return count ?? 0;
}

/** Пометить одно уведомление прочитанным. */
export async function markNotificationRead(id: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
}

/** Пометить все непрочитанные пользователя прочитанными. */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
}

/**
 * Realtime-подписка на новые уведомления пользователя.
 * Возвращает функцию-ансубскрайб.
 */
export function subscribeToNotifications(
  userId: string,
  onInsert: (n: Notification) => void
): () => void {
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        // payload.new не содержит join'ов — дёрнем отдельный запрос,
        // чтобы сразу получить actor/club для красивой отрисовки.
        const rowId = (payload.new as { id: string }).id;
        const { data } = await supabase
          .from('notifications')
          .select(
            `
            id, user_id, actor_id, type, club_id, message_id, payload, created_at, read_at,
            actor:profiles!notifications_actor_id_fkey(name, avatar_url),
            club:clubs(name)
          `
          )
          .eq('id', rowId)
          .maybeSingle();
        if (data) onInsert(mapRow(data as unknown as Row));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
