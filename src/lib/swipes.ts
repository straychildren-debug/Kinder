import { supabase } from './supabase';
import { ContentItem } from './types';

export type SwipeDirection = 'like' | 'skip' | 'seen';

function mapContent(row: any): ContentItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    rejectionReason: row.rejection_reason,
    moderatedBy: row.metadata?.moderatedBy,
    ...row.metadata,
  };
}

/**
 * Fetch approved content the user hasn't swiped yet, limited to N items.
 * Excludes the user's own publications.
 */
export async function getSwipeableContent(userId: string, limit = 30): Promise<ContentItem[]> {
  // 1. Get the ids of content already swiped by this user.
  const { data: swiped, error: swipedErr } = await supabase
    .from('swipes')
    .select('content_id')
    .eq('user_id', userId);

  if (swipedErr) {
    console.error('Error fetching swipes:', swipedErr);
    return [];
  }

  const swipedIds = (swiped || []).map((s) => s.content_id);

  // 2. Fetch approved content, excluding swiped ones and own.
  let query = supabase
    .from('content')
    .select('*')
    .eq('status', 'approved')
    .neq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (swipedIds.length > 0) {
    query = query.not('id', 'in', `(${swipedIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching swipeable content:', error);
    return [];
  }

  return (data || []).map(mapContent);
}

/**
 * Record a swipe. Upsert so re-swiping the same card overrides the previous direction.
 */
export async function recordSwipe(userId: string, contentId: string, direction: SwipeDirection) {
  const { error } = await supabase
    .from('swipes')
    .upsert(
      { user_id: userId, content_id: contentId, direction },
      { onConflict: 'user_id,content_id' }
    );

  if (error) {
    console.error('Error recording swipe:', error);
    throw error;
  }
}

/**
 * Undo the last swipe (deletes the record). Returns the deleted row so the caller can restore UI state.
 */
export async function undoLastSwipe(userId: string, contentId: string) {
  const { error } = await supabase
    .from('swipes')
    .delete()
    .eq('user_id', userId)
    .eq('content_id', contentId);

  if (error) {
    console.error('Error undoing swipe:', error);
    throw error;
  }
}

/**
 * Aggregate counters for the user's swipe history. Used on the discover page header.
 */
export async function getSwipeCounts(userId: string): Promise<{ like: number; skip: number; seen: number }> {
  const { data, error } = await supabase
    .from('swipes')
    .select('direction')
    .eq('user_id', userId);

  if (error || !data) return { like: 0, skip: 0, seen: 0 };

  return data.reduce(
    (acc, row: any) => {
      const d = row.direction as SwipeDirection;
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    },
    { like: 0, skip: 0, seen: 0 } as { like: number; skip: number; seen: number }
  );
}
