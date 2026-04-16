import { supabase } from './supabase';
import type { ContentItem, WishlistItem } from './types';

type ContentRow = {
  id: string;
  type: 'book' | 'movie';
  title: string;
  description: string;
  image_url: string;
  status: ContentItem['status'];
  created_by: string;
  created_at: string;
  rejection_reason?: string | null;
  metadata?: Record<string, unknown> | null;
};

function mapContent(row: ContentRow): ContentItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    rejectionReason: row.rejection_reason ?? undefined,
    ...(row.metadata || {}),
  };
}

/** Полный список желаний пользователя с прикреплённым контентом. */
export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from('user_wishlists')
    .select('id, user_id, content_id, created_at, content:content_id(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getWishlist:', error);
    return [];
  }

  return (data ?? []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    contentId: r.content_id,
    createdAt: r.created_at,
    content: r.content ? mapContent(r.content as ContentRow) : undefined,
  }));
}

/** Быстрая проверка — есть ли конкретный контент в вишлисте. */
export async function isInWishlist(
  userId: string,
  contentId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

/** Добавить в вишлист. Идемпотентно — при дубликате просто возвращаем ок. */
export async function addToWishlist(
  userId: string,
  contentId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_wishlists')
    .insert({ user_id: userId, content_id: contentId });
  // unique_violation (23505) — уже добавлено, игнорируем
  if (error && error.code !== '23505') {
    console.error('addToWishlist:', error);
    throw error;
  }
}

export async function removeFromWishlist(
  userId: string,
  contentId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('content_id', contentId);
  if (error) console.error('removeFromWishlist:', error);
}

/** Множественная проверка — возвращает Set id контента, который у юзера в вишлисте. */
export async function getWishlistContentIds(
  userId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_wishlists')
    .select('content_id')
    .eq('user_id', userId);
  if (error) return new Set();
  return new Set((data ?? []).map((r: { content_id: string }) => r.content_id));
}
