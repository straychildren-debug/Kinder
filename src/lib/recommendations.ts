import { supabase } from './supabase';
import type { ContentItem } from './types';

type Row = {
  id: string;
  type: 'book' | 'movie';
  title: string;
  description: string;
  image_url: string;
  status: string;
  created_by: string;
  created_at: string;
  rejection_reason?: string | null;
  metadata?: Record<string, unknown> | null;
};

const map = (r: Row): ContentItem => ({
  id: r.id,
  type: r.type,
  title: r.title,
  description: r.description,
  imageUrl: r.image_url,
  status: r.status as ContentItem['status'],
  createdBy: r.created_by,
  createdAt: r.created_at,
  rejectionReason: r.rejection_reason ?? undefined,
  ...(r.metadata || {}),
});

function normalizeGenres(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).toLowerCase().trim());
  if (typeof v === 'string')
    return v
      .split(/[,;/]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  return [];
}

/**
 * Простая рекомендательная логика:
 *   1) Берём contentId, смотрим его жанры/год/автора/режиссёра.
 *   2) Вытаскиваем одобренный контент того же типа.
 *   3) Скорим по пересечению жанров + близости года + совпадению
 *      автора/режиссёра. Сортируем по скору.
 *   4) Исключаем сам контент.
 *
 * Это дешёвый in-memory подход — для маленького каталога хватает;
 * можно заменить на Postgres-запрос с трilGram/векторами позднее.
 */
export async function getSimilarContent(
  contentId: string,
  limit = 6
): Promise<ContentItem[]> {
  const { data: seedRow, error: e1 } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .maybeSingle();
  if (e1 || !seedRow) return [];

  const seed = map(seedRow as Row);
  const seedGenres = normalizeGenres(seed.genre);
  const seedYear = typeof seed.year === 'number' ? seed.year : null;
  const seedAuthor = (seed.author || '').toLowerCase().trim();
  const seedDirector = (seed.director || '').toLowerCase().trim();

  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('status', 'approved')
    .eq('type', seed.type)
    .neq('id', contentId)
    .limit(200);
  if (error || !data) return [];

  const scored = (data as Row[])
    .map(map)
    .map((c) => {
      let score = 0;
      const g = normalizeGenres(c.genre);
      const overlap = g.filter((x) => seedGenres.includes(x)).length;
      score += overlap * 3;

      if (seedYear && typeof c.year === 'number') {
        const delta = Math.abs(c.year - seedYear);
        if (delta <= 2) score += 2;
        else if (delta <= 5) score += 1;
      }

      if (seedAuthor && (c.author || '').toLowerCase().trim() === seedAuthor)
        score += 4;
      if (
        seedDirector &&
        (c.director || '').toLowerCase().trim() === seedDirector
      )
        score += 4;

      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.c);
}

/**
 * Персональные рекомендации на основе вкуса пользователя.
 *   1) Собираем положительные сигналы: лайк-свайпы, оценки ≥4, закладки.
 *   2) Вытаскиваем топ-жанры/авторов/режиссёров из «любимого» контента.
 *   3) Скорим одобренный каталог по совпадениям.
 *   4) Исключаем всё, что пользователь уже видел/оценил/добавил в свайпы,
 *      и его собственные публикации.
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit = 12
): Promise<ContentItem[]> {
  // Положительные сигналы
  const [likesRes, reviewsRes, wishlistRes, skipsRes, seenReviewsRes] =
    await Promise.all([
      supabase
        .from('swipes')
        .select('content_id, direction')
        .eq('user_id', userId),
      supabase
        .from('reviews')
        .select('content_id, rating')
        .eq('user_id', userId),
      supabase.from('wishlist').select('content_id').eq('user_id', userId),
      supabase
        .from('swipes')
        .select('content_id')
        .eq('user_id', userId),
      supabase.from('reviews').select('content_id').eq('user_id', userId),
    ]);

  const swipeRows =
    (likesRes.data as { content_id: string; direction: string }[] | null) || [];
  const reviewRows =
    (reviewsRes.data as { content_id: string; rating: number }[] | null) || [];
  const wishlistRows =
    (wishlistRes.data as { content_id: string }[] | null) || [];

  const likedIds = new Set<string>();
  swipeRows.forEach((r) => {
    if (r.direction === 'like' || r.direction === 'seen') likedIds.add(r.content_id);
  });
  reviewRows.forEach((r) => {
    if (r.rating >= 4) likedIds.add(r.content_id);
  });
  wishlistRows.forEach((r) => likedIds.add(r.content_id));

  // Всё, что показывать НЕ надо
  const excludeIds = new Set<string>();
  (skipsRes.data as { content_id: string }[] | null)?.forEach((r) =>
    excludeIds.add(r.content_id)
  );
  (seenReviewsRes.data as { content_id: string }[] | null)?.forEach((r) =>
    excludeIds.add(r.content_id)
  );

  // Если сигналов нет — отдаём свежий одобренный контент (без его собственных)
  if (likedIds.size === 0) {
    const { data } = await supabase
      .from('content')
      .select('*')
      .eq('status', 'approved')
      .neq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(limit * 2);
    const rows = (data as Row[] | null) || [];
    return rows
      .map(map)
      .filter((c) => !excludeIds.has(c.id))
      .slice(0, limit);
  }

  // Вытаскиваем сами «любимые» записи
  const { data: likedRows } = await supabase
    .from('content')
    .select('*')
    .in('id', Array.from(likedIds));
  const liked = ((likedRows as Row[] | null) || []).map(map);

  // Считаем вкусовой профиль
  const genreWeight = new Map<string, number>();
  const authorWeight = new Map<string, number>();
  const directorWeight = new Map<string, number>();
  const typeCount = { book: 0, movie: 0 };

  liked.forEach((c) => {
    if (c.type === 'book') typeCount.book += 1;
    else if (c.type === 'movie') typeCount.movie += 1;
    normalizeGenres(c.genre).forEach((g) =>
      genreWeight.set(g, (genreWeight.get(g) || 0) + 1)
    );
    const a = (c.author || '').toLowerCase().trim();
    if (a) authorWeight.set(a, (authorWeight.get(a) || 0) + 1);
    const d = (c.director || '').toLowerCase().trim();
    if (d) directorWeight.set(d, (directorWeight.get(d) || 0) + 1);
  });

  // Кандидаты — одобренный контент, исключая всё уже виденное
  const { data: candRows } = await supabase
    .from('content')
    .select('*')
    .eq('status', 'approved')
    .neq('created_by', userId)
    .limit(500);
  const candidates = ((candRows as Row[] | null) || []).map(map);

  const now = Date.now();
  const scored = candidates
    .filter((c) => !likedIds.has(c.id) && !excludeIds.has(c.id))
    .map((c) => {
      let score = 0;

      // Жанры
      const g = normalizeGenres(c.genre);
      g.forEach((x) => {
        const w = genreWeight.get(x);
        if (w) score += w * 2;
      });

      // Автор/режиссёр
      const a = (c.author || '').toLowerCase().trim();
      if (a && authorWeight.get(a)) score += authorWeight.get(a)! * 5;
      const d = (c.director || '').toLowerCase().trim();
      if (d && directorWeight.get(d)) score += directorWeight.get(d)! * 5;

      // Тип (если пользователь явно предпочитает книги или кино)
      if (c.type === 'book' && typeCount.book > typeCount.movie) score += 1;
      if (c.type === 'movie' && typeCount.movie > typeCount.book) score += 1;

      // Лёгкий буст за свежесть (< 30 дней)
      if (c.createdAt) {
        const ageDays =
          (now - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays < 30) score += 0.5;
      }

      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.c);
}
