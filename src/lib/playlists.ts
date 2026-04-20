import { supabase } from './supabase';
import type { ContentItem } from './types';

export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  author?: { id: string; name: string; avatarUrl: string };
  items?: ContentItem[];
}

type PlaylistRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  author?: { id: string; name: string | null; avatar_url: string | null } | null;
};

type ContentRow = {
  id: string;
  type: 'book' | 'movie';
  title: string;
  description: string | null;
  image_url: string | null;
  status: string;
  created_by: string;
  created_at: string;
  author?: string | null;
  director?: string | null;
  year?: number | null;
  metadata?: Record<string, unknown> | null;
};

function mapPlaylist(r: PlaylistRow, itemCount?: number): Playlist {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    description: r.description ?? undefined,
    coverUrl: r.cover_url ?? undefined,
    isPublic: r.is_public,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    itemCount,
    author: r.author
      ? {
          id: r.author.id,
          name: r.author.name || 'Читатель',
          avatarUrl: r.author.avatar_url || '',
        }
      : undefined,
  };
}

function mapContent(r: ContentRow): ContentItem {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description || '',
    imageUrl: r.image_url || '',
    status: r.status as ContentItem['status'],
    createdBy: r.created_by,
    createdAt: r.created_at,
    author: r.author || undefined,
    director: r.director || undefined,
    year: r.year ?? undefined,
    ...(r.metadata || {}),
  };
}

const PLAYLIST_SELECT =
  `id, user_id, title, description, cover_url, is_public, created_at, updated_at,
   author:profiles!playlists_user_id_fkey(id, name, avatar_url)`;

/** Публичные плейлисты сообщества (+ count items в каждом). */
export async function getPublicPlaylists(limit = 30): Promise<Playlist[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select(PLAYLIST_SELECT)
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('getPublicPlaylists:', error);
    return [];
  }
  const rows = (data as unknown as PlaylistRow[] | null) || [];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const { data: itemRows } = await supabase
    .from('playlist_items')
    .select('playlist_id')
    .in('playlist_id', ids);
  const counts = new Map<string, number>();
  ((itemRows as { playlist_id: string }[] | null) || []).forEach((r) => {
    counts.set(r.playlist_id, (counts.get(r.playlist_id) || 0) + 1);
  });

  return rows.map((r) => mapPlaylist(r, counts.get(r.id) || 0));
}

/** Все плейлисты, созданные пользователем (включая приватные). */
export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  const { data, error } = await supabase
    .from('playlists')
    .select(PLAYLIST_SELECT)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('getUserPlaylists:', error);
    return [];
  }
  const rows = (data as unknown as PlaylistRow[] | null) || [];
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const { data: itemRows } = await supabase
    .from('playlist_items')
    .select('playlist_id')
    .in('playlist_id', ids);
  const counts = new Map<string, number>();
  ((itemRows as { playlist_id: string }[] | null) || []).forEach((r) => {
    counts.set(r.playlist_id, (counts.get(r.playlist_id) || 0) + 1);
  });
  return rows.map((r) => mapPlaylist(r, counts.get(r.id) || 0));
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  const { data, error } = await supabase
    .from('playlists')
    .select(PLAYLIST_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error('getPlaylist:', error);
    return null;
  }
  const playlist = mapPlaylist(data as unknown as PlaylistRow);

  const { data: items } = await supabase
    .from('playlist_items')
    .select(
      `position, added_at,
       content:content!playlist_items_content_id_fkey(
         id, type, title, description, image_url, status, created_by, created_at,
         author, director, year, metadata
       )`
    )
    .eq('playlist_id', id)
    .order('position', { ascending: true });

  playlist.items = ((items as unknown as { content: ContentRow }[] | null) || [])
    .map((r) => mapContent(r.content))
    .filter((c) => !!c.id);
  playlist.itemCount = playlist.items.length;
  return playlist;
}

export async function createPlaylist(
  userId: string,
  title: string,
  options: { description?: string; coverUrl?: string; isPublic?: boolean } = {}
): Promise<Playlist | null> {
  const payload = {
    user_id: userId,
    title: title.trim(),
    description: options.description?.trim() || null,
    cover_url: options.coverUrl || null,
    is_public: options.isPublic !== false,
  };
  const { data, error } = await supabase
    .from('playlists')
    .insert(payload)
    .select(PLAYLIST_SELECT)
    .maybeSingle();
  if (error || !data) {
    console.error('createPlaylist:', error);
    return null;
  }
  return mapPlaylist(data as unknown as PlaylistRow, 0);
}

export async function updatePlaylist(
  id: string,
  patch: { title?: string; description?: string; coverUrl?: string; isPublic?: boolean }
): Promise<boolean> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) payload.title = patch.title.trim();
  if (patch.description !== undefined) payload.description = patch.description.trim() || null;
  if (patch.coverUrl !== undefined) payload.cover_url = patch.coverUrl || null;
  if (patch.isPublic !== undefined) payload.is_public = patch.isPublic;
  const { error } = await supabase.from('playlists').update(payload).eq('id', id);
  if (error) {
    console.error('updatePlaylist:', error);
    return false;
  }
  return true;
}

export async function deletePlaylist(id: string): Promise<boolean> {
  // items удалятся каскадом через FK, но на всякий случай явно:
  await supabase.from('playlist_items').delete().eq('playlist_id', id);
  const { error } = await supabase.from('playlists').delete().eq('id', id);
  if (error) {
    console.error('deletePlaylist:', error);
    return false;
  }
  return true;
}

export async function addToPlaylist(
  playlistId: string,
  contentId: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('playlist_items')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPos = ((existing as { position: number } | null)?.position ?? -1) + 1;
  const { error } = await supabase
    .from('playlist_items')
    .upsert(
      { playlist_id: playlistId, content_id: contentId, position: nextPos },
      { onConflict: 'playlist_id,content_id' }
    );
  if (error) {
    console.error('addToPlaylist:', error);
    return false;
  }
  await supabase
    .from('playlists')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', playlistId);
  return true;
}

export async function removeFromPlaylist(
  playlistId: string,
  contentId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('playlist_items')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('content_id', contentId);
  if (error) {
    console.error('removeFromPlaylist:', error);
    return false;
  }
  return true;
}

/** Плейлисты, в которых уже лежит данный контент (для текущего юзера). */
export async function getPlaylistsContainingContent(
  userId: string,
  contentId: string
): Promise<Set<string>> {
  const { data: userLists } = await supabase
    .from('playlists')
    .select('id')
    .eq('user_id', userId);
  const ids = ((userLists as { id: string }[] | null) || []).map((r) => r.id);
  if (ids.length === 0) return new Set();
  const { data } = await supabase
    .from('playlist_items')
    .select('playlist_id')
    .eq('content_id', contentId)
    .in('playlist_id', ids);
  return new Set(
    ((data as { playlist_id: string }[] | null) || []).map((r) => r.playlist_id)
  );
}
