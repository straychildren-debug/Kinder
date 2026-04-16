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
