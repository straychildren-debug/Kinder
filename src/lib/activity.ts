import { supabase } from './supabase';
import type { ActivityEvent, ActivityType } from './types';

type Row = {
  id: string;
  user_id: string;
  type: ActivityType;
  ref_id: string | null;
  ref_type: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  user?: { name: string | null; avatar_url: string | null } | null;
};

const mapRow = (r: Row): ActivityEvent => ({
  id: r.id,
  userId: r.user_id,
  type: r.type,
  refId: r.ref_id,
  refType: r.ref_type,
  payload: r.payload ?? {},
  createdAt: r.created_at,
  userName: r.user?.name ?? undefined,
  userAvatar: r.user?.avatar_url ?? undefined,
});

/** Глобальная лента — что происходит в сообществе прямо сейчас. */
export async function getGlobalActivity(limit = 30): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from('activity_events')
    .select(
      `id, user_id, type, ref_id, ref_type, payload, created_at,
       user:profiles!activity_events_user_id_fkey(name, avatar_url)`
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getGlobalActivity:', error);
    return [];
  }
  return ((data ?? []) as unknown as Row[]).map(mapRow);
}

export async function getUserActivity(
  userId: string,
  limit = 30
): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from('activity_events')
    .select(
      `id, user_id, type, ref_id, ref_type, payload, created_at,
       user:profiles!activity_events_user_id_fkey(name, avatar_url)`
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getUserActivity:', error);
    return [];
  }
  return ((data ?? []) as unknown as Row[]).map(mapRow);
}

/** Realtime-подписка на новые события ленты. */
export function subscribeToActivity(
  onInsert: (e: ActivityEvent) => void
): () => void {
  const channel = supabase
    .channel('activity-feed-global')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'activity_events' },
      async (payload) => {
        const id = (payload.new as { id: string }).id;
        const { data } = await supabase
          .from('activity_events')
          .select(
            `id, user_id, type, ref_id, ref_type, payload, created_at,
             user:profiles!activity_events_user_id_fkey(name, avatar_url)`
          )
          .eq('id', id)
          .maybeSingle();
        if (data) onInsert(mapRow(data as unknown as Row));
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
