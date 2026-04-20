import { supabase } from './supabase';
import type { ContentItem, User } from './types';

export interface TasteTwin {
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  sharedCount: number;
  matchPercent: number;
  sharedContent: ContentItem[];
}

type Signal = { content_id: string; user_id: string };

async function getUserPositiveContentIds(userId: string): Promise<Set<string>> {
  const [swipesRes, reviewsRes, wishlistRes] = await Promise.all([
    supabase
      .from('swipes')
      .select('content_id, direction')
      .eq('user_id', userId),
    supabase
      .from('reviews')
      .select('content_id, rating')
      .eq('user_id', userId),
    supabase.from('wishlist').select('content_id').eq('user_id', userId),
  ]);

  const ids = new Set<string>();
  ((swipesRes.data as { content_id: string; direction: string }[] | null) || [])
    .forEach((r) => {
      if (r.direction === 'like' || r.direction === 'seen') ids.add(r.content_id);
    });
  ((reviewsRes.data as { content_id: string; rating: number }[] | null) || [])
    .forEach((r) => {
      if (r.rating >= 4) ids.add(r.content_id);
    });
  ((wishlistRes.data as { content_id: string }[] | null) || [])
    .forEach((r) => ids.add(r.content_id));
  return ids;
}

/**
 * Находит «двойников по вкусу» — пользователей, у которых пересекаются
 * положительные сигналы (лайки-свайпы, оценки ≥4, закладки).
 *
 * Метрика — cosine similarity: shared / sqrt(|A| * |B|).
 * Переводится в процент совпадения вкуса.
 */
export async function getTasteTwins(
  userId: string,
  limit = 5
): Promise<TasteTwin[]> {
  const myIds = await getUserPositiveContentIds(userId);
  if (myIds.size < 3) return [];

  const myIdArr = Array.from(myIds);

  // Кандидаты — все, у кого есть положительный сигнал на наш контент
  const [candSwipesRes, candReviewsRes, candWishlistRes] = await Promise.all([
    supabase
      .from('swipes')
      .select('content_id, user_id, direction')
      .in('content_id', myIdArr)
      .neq('user_id', userId),
    supabase
      .from('reviews')
      .select('content_id, user_id, rating')
      .in('content_id', myIdArr)
      .neq('user_id', userId),
    supabase
      .from('wishlist')
      .select('content_id, user_id')
      .in('content_id', myIdArr)
      .neq('user_id', userId),
  ]);

  const sharedMap = new Map<string, Set<string>>(); // userId -> set of shared content IDs
  const bump = (uid: string, cid: string) => {
    if (!sharedMap.has(uid)) sharedMap.set(uid, new Set());
    sharedMap.get(uid)!.add(cid);
  };

  ((candSwipesRes.data as { content_id: string; user_id: string; direction: string }[] | null) || [])
    .forEach((r) => {
      if (r.direction === 'like' || r.direction === 'seen') bump(r.user_id, r.content_id);
    });
  ((candReviewsRes.data as { content_id: string; user_id: string; rating: number }[] | null) || [])
    .forEach((r) => {
      if (r.rating >= 4) bump(r.user_id, r.content_id);
    });
  ((candWishlistRes.data as Signal[] | null) || []).forEach((r) =>
    bump(r.user_id, r.content_id)
  );

  // Отфильтруем тех, у кого 2+ совпадений (убирает случайные шумовые совпадения)
  const candidates = Array.from(sharedMap.entries())
    .filter(([, set]) => set.size >= 2)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 30); // cap кандидатов для последующих запросов

  if (candidates.length === 0) return [];

  // Узнаем размер «вкуса» каждого кандидата для нормализации
  const candIds = candidates.map(([uid]) => uid);
  const [candAllSwipes, candAllReviews, candAllWishlist] = await Promise.all([
    supabase
      .from('swipes')
      .select('user_id, content_id, direction')
      .in('user_id', candIds),
    supabase
      .from('reviews')
      .select('user_id, content_id, rating')
      .in('user_id', candIds),
    supabase
      .from('wishlist')
      .select('user_id, content_id')
      .in('user_id', candIds),
  ]);

  const totalCounts = new Map<string, Set<string>>();
  const bumpTotal = (uid: string, cid: string) => {
    if (!totalCounts.has(uid)) totalCounts.set(uid, new Set());
    totalCounts.get(uid)!.add(cid);
  };
  ((candAllSwipes.data as { user_id: string; content_id: string; direction: string }[] | null) || [])
    .forEach((r) => {
      if (r.direction === 'like' || r.direction === 'seen') bumpTotal(r.user_id, r.content_id);
    });
  ((candAllReviews.data as { user_id: string; content_id: string; rating: number }[] | null) || [])
    .forEach((r) => {
      if (r.rating >= 4) bumpTotal(r.user_id, r.content_id);
    });
  ((candAllWishlist.data as { user_id: string; content_id: string }[] | null) || [])
    .forEach((r) => bumpTotal(r.user_id, r.content_id));

  // Подтягиваем профили кандидатов
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', candIds);
  const profileMap = new Map<string, { id: string; name: string; avatarUrl: string }>();
  ((profiles as { id: string; name: string; avatar_url: string }[] | null) || [])
    .forEach((p) => {
      profileMap.set(p.id, { id: p.id, name: p.name || 'Читатель', avatarUrl: p.avatar_url || '' });
    });

  // Получим сам shared-контент (общий набор всех ID, что встретились)
  const allSharedIds = new Set<string>();
  candidates.forEach(([, set]) => set.forEach((id) => allSharedIds.add(id)));
  const { data: contentRows } = await supabase
    .from('content')
    .select('id, type, title, image_url, author, director, year')
    .in('id', Array.from(allSharedIds));
  const contentMap = new Map<string, ContentItem>();
  ((contentRows as {
    id: string; type: 'book' | 'movie'; title: string; image_url: string;
    author?: string; director?: string; year?: number;
  }[] | null) || []).forEach((r) => {
    contentMap.set(r.id, {
      id: r.id,
      type: r.type,
      title: r.title,
      description: '',
      imageUrl: r.image_url,
      status: 'approved',
      createdBy: '',
      createdAt: '',
      author: r.author,
      director: r.director,
      year: r.year,
    });
  });

  const mySize = myIds.size;
  const twins: TasteTwin[] = candidates
    .map(([uid, sharedSet]) => {
      const profile = profileMap.get(uid);
      if (!profile) return null;
      const theirSize = totalCounts.get(uid)?.size || sharedSet.size;
      const cos = sharedSet.size / Math.sqrt(mySize * theirSize);
      const matchPercent = Math.min(99, Math.round(cos * 100));
      const sharedContent = Array.from(sharedSet)
        .map((id) => contentMap.get(id))
        .filter((x): x is ContentItem => !!x);
      return {
        user: profile,
        sharedCount: sharedSet.size,
        matchPercent,
        sharedContent,
      };
    })
    .filter((x): x is TasteTwin => !!x && x.matchPercent > 0)
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, limit);

  return twins;
}
