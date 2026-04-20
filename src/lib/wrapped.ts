import { supabase } from './supabase';
import type { ContentItem } from './types';

export interface TopEntry {
  label: string;
  count: number;
}

export interface WrappedStats {
  period: 'year' | 'all';
  year: number;
  totals: {
    reviews: number;
    swipes: number;
    likes: number;
    seen: number;
    skips: number;
    wishlist: number;
    playlists: number;
    awards: number;
    followers: number;
    following: number;
  };
  avgRating: number;
  bookVsMovie: { books: number; movies: number };
  topGenres: TopEntry[];
  topAuthors: TopEntry[];
  topDirectors: TopEntry[];
  topRatedContent: ContentItem[];
  mostActiveMonth: { month: string; count: number } | null;
  firstReviewAt: string | null;
}

type ContentRow = {
  id: string;
  type: 'book' | 'movie';
  title: string;
  image_url: string | null;
  author?: string | null;
  director?: string | null;
  genre?: string[] | string | null;
  metadata?: Record<string, unknown> | null;
};

function normalizeGenres(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string')
    return v
      .split(/[,;/]/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

function topN(map: Map<string, number>, n: number): TopEntry[] {
  return Array.from(map.entries())
    .filter(([k]) => !!k)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));
}

/** Собирает годовой (или пожизненный) отчёт пользователя. */
export async function getWrappedStats(
  userId: string,
  period: 'year' | 'all' = 'year'
): Promise<WrappedStats> {
  const now = new Date();
  const year = now.getFullYear();
  const since = period === 'year'
    ? new Date(year, 0, 1).toISOString()
    : null;

  const applyPeriod = <T extends { gte: (col: string, v: string) => T }>(
    q: T,
    col = 'created_at'
  ): T => (since ? q.gte(col, since) : q);

  const reviewsQuery = applyPeriod(
    supabase.from('reviews').select('id, content_id, rating, created_at').eq('user_id', userId)
  );
  const swipesQuery = applyPeriod(
    supabase.from('swipes').select('content_id, direction, created_at').eq('user_id', userId)
  );
  const wishlistQuery = applyPeriod(
    supabase.from('wishlist').select('id').eq('user_id', userId)
  );
  const playlistsQuery = applyPeriod(
    supabase.from('playlists').select('id').eq('user_id', userId)
  );
  const awardsQuery = applyPeriod(
    supabase.from('awards').select('id').eq('user_id', userId),
    'earned_at'
  );
  const followersPromise = supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('following_id', userId);
  const followingPromise = supabase
    .from('follows')
    .select('following_id', { count: 'exact', head: true })
    .eq('follower_id', userId);

  const [reviewsRes, swipesRes, wishlistRes, playlistsRes, awardsRes, followersRes, followingRes] =
    await Promise.all([
      reviewsQuery,
      swipesQuery,
      wishlistQuery,
      playlistsQuery,
      awardsQuery,
      followersPromise,
      followingPromise,
    ]);

  const reviewRows =
    (reviewsRes.data as { id: string; content_id: string; rating: number; created_at: string }[] | null) ||
    [];
  const swipeRows =
    (swipesRes.data as { content_id: string; direction: string; created_at: string }[] | null) || [];
  const wishlistRows = (wishlistRes.data as { id: string }[] | null) || [];
  const playlistRows = (playlistsRes.data as { id: string }[] | null) || [];
  const awardsRows = (awardsRes.data as { id: string }[] | null) || [];

  // Вытащим контент из отзывов и лайк-свайпов, чтобы посчитать жанры/авторов
  const contentIdSet = new Set<string>();
  reviewRows.forEach((r) => contentIdSet.add(r.content_id));
  swipeRows.forEach((r) => {
    if (r.direction === 'like' || r.direction === 'seen') contentIdSet.add(r.content_id);
  });

  let contentMap = new Map<string, ContentRow>();
  if (contentIdSet.size > 0) {
    const { data: contentRows } = await supabase
      .from('content')
      .select('id, type, title, image_url, author, director, genre, metadata')
      .in('id', Array.from(contentIdSet));
    ((contentRows as ContentRow[] | null) || []).forEach((r) => contentMap.set(r.id, r));
  }

  // Агрегаты
  const genres = new Map<string, number>();
  const authors = new Map<string, number>();
  const directors = new Map<string, number>();
  let books = 0;
  let movies = 0;

  const countRow = (cid: string) => {
    const c = contentMap.get(cid);
    if (!c) return;
    if (c.type === 'book') books += 1;
    else if (c.type === 'movie') movies += 1;
    const g = normalizeGenres(c.genre ?? (c.metadata as { genre?: unknown } | null)?.genre);
    g.forEach((x) => genres.set(x, (genres.get(x) || 0) + 1));
    if (c.author) authors.set(c.author, (authors.get(c.author) || 0) + 1);
    if (c.director) directors.set(c.director, (directors.get(c.director) || 0) + 1);
  };
  reviewRows.forEach((r) => countRow(r.content_id));
  swipeRows.forEach((r) => {
    if (r.direction === 'like' || r.direction === 'seen') countRow(r.content_id);
  });

  // Средняя оценка (из отзывов с rating)
  const ratings = reviewRows.filter((r) => r.rating && r.rating > 0);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
      : 0;

  // Самый активный месяц (по отзывам)
  const monthCounts = new Map<string, number>();
  reviewRows.forEach((r) => {
    const d = new Date(r.created_at);
    const key = d.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
    monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
  });
  const mostActiveMonth =
    monthCounts.size === 0
      ? null
      : Array.from(monthCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([month, count]) => ({ month, count }))[0];

  // Топ оценённого контента (ваши ≥4)
  const topRated = ratings
    .filter((r) => r.rating >= 4)
    .slice(0, 10)
    .map((r) => contentMap.get(r.content_id))
    .filter((c): c is ContentRow => !!c);
  const topRatedContent: ContentItem[] = topRated.map((c) => ({
    id: c.id,
    type: c.type,
    title: c.title,
    description: '',
    imageUrl: c.image_url || '',
    status: 'approved',
    createdBy: '',
    createdAt: '',
    author: c.author || undefined,
    director: c.director || undefined,
  }));

  const swipeLikes = swipeRows.filter((r) => r.direction === 'like').length;
  const swipeSeen = swipeRows.filter((r) => r.direction === 'seen').length;
  const swipeSkips = swipeRows.filter((r) => r.direction === 'skip').length;

  const firstReview = reviewRows.reduce<string | null>(
    (acc, r) => (acc === null || r.created_at < acc ? r.created_at : acc),
    null
  );

  return {
    period,
    year,
    totals: {
      reviews: reviewRows.length,
      swipes: swipeRows.length,
      likes: swipeLikes,
      seen: swipeSeen,
      skips: swipeSkips,
      wishlist: wishlistRows.length,
      playlists: playlistRows.length,
      awards: awardsRows.length,
      followers: followersRes.count ?? 0,
      following: followingRes.count ?? 0,
    },
    avgRating,
    bookVsMovie: { books, movies },
    topGenres: topN(genres, 5),
    topAuthors: topN(authors, 3),
    topDirectors: topN(directors, 3),
    topRatedContent,
    mostActiveMonth,
    firstReviewAt: firstReview,
  };
}
