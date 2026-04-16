import { supabase } from './supabase';
import type { Award, AwardType } from './types';

/** Метаданные для красивого отображения каждого типа бейджа. */
export const AWARD_META: Record<
  AwardType,
  { title: string; description: string; icon: string; tone: string }
> = {
  first_review: {
    title: 'Первая рецензия',
    description: 'Опубликована первая рецензия',
    icon: 'reviews',
    tone: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  ten_reviews: {
    title: '10 рецензий',
    description: 'Десять опубликованных рецензий',
    icon: 'auto_awesome',
    tone: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  hundred_reviews: {
    title: 'Сотня рецензий',
    description: 'Целых сто рецензий — вы легенда',
    icon: 'military_tech',
    tone: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  first_publication: {
    title: 'Первая публикация',
    description: 'Контент прошёл модерацию',
    icon: 'workspace_premium',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  ten_publications: {
    title: '10 публикаций',
    description: 'Десять одобренных публикаций',
    icon: 'stars',
    tone: 'bg-rose-50 text-rose-700 border-rose-100',
  },
  first_club: {
    title: 'Первый клуб',
    description: 'Вступление в первый клуб',
    icon: 'groups',
    tone: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
  },
  marathon_winner: {
    title: 'Победитель марафона',
    description: 'Пройден марафон от начала до конца',
    icon: 'rocket_launch',
    tone: 'bg-orange-50 text-orange-700 border-orange-100',
  },
};

type Row = {
  id: string;
  user_id: string;
  type: AwardType;
  payload: Record<string, unknown> | null;
  earned_at: string;
};

const mapRow = (r: Row): Award => ({
  id: r.id,
  userId: r.user_id,
  type: r.type,
  payload: r.payload ?? {},
  earnedAt: r.earned_at,
});

export async function getAwardsForUser(userId: string): Promise<Award[]> {
  const { data, error } = await supabase
    .from('user_awards')
    .select('id, user_id, type, payload, earned_at')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });
  if (error) {
    console.error('getAwardsForUser:', error);
    return [];
  }
  return (data ?? []).map(mapRow);
}
