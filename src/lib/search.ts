import { supabase } from './supabase';
import type { Club, ContentItem, User } from './types';

type ContentRow = {
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

function mapContent(row: ContentRow): ContentItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    status: row.status as ContentItem['status'],
    createdBy: row.created_by,
    createdAt: row.created_at,
    rejectionReason: row.rejection_reason ?? undefined,
    ...(row.metadata || {}),
  };
}

/** Ищет одобренный контент по названию/описанию. */
export async function searchContent(
  query: string,
  limit = 8
): Promise<ContentItem[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('status', 'approved')
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(limit);
  if (error || !data) {
    console.error('searchContent:', error);
    return [];
  }
  return (data as ContentRow[]).map(mapContent);
}

/** Ищет клубы по имени/описанию. */
export async function searchClubs(query: string, limit = 8): Promise<Club[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name, description, category, image_url, owner_id, created_at, club_members(count)')
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(limit);
  if (error || !data) {
    console.error('searchClubs:', error);
    return [];
  }
  return (data as any[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    imageUrl: row.image_url,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    memberCount: row.club_members?.[0]?.count ?? 0,
    unreadCount: 0,
  }));
}

/** Ищет пользователей по имени. */
export async function searchUsers(
  query: string,
  limit = 8
): Promise<User[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('name', `%${q}%`)
    .limit(limit);
  if (error || !data) return [];
  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    avatarUrl: d.avatar_url,
    bio: d.bio,
    role: d.role,
    stats: d.stats,
    joinedAt: d.joined_at,
  }));
}

export interface OmnisearchResult {
  content: ContentItem[];
  clubs: Club[];
  users: User[];
}

/** Параллельный поиск по всем сущностям. */
export async function omnisearch(
  query: string
): Promise<OmnisearchResult> {
  const q = query.trim();
  if (!q) return { content: [], clubs: [], users: [] };
  const [content, clubs, users] = await Promise.all([
    searchContent(q),
    searchClubs(q),
    searchUsers(q),
  ]);
  return { content, clubs, users };
}
