import { supabase } from './supabase';
import type { ContentItem } from './types';

export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  /** Fallback cover: image of the first item in the playlist, if no explicit coverUrl. */
  firstItemImage?: string;
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
};

type AuthorProfile = { id: string; name: string; avatarUrl: string };

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

function mapPlaylist(
  r: PlaylistRow,
  itemCount?: number,
  author?: AuthorProfile,
  firstItemImage?: string
): Playlist {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    description: r.description ?? undefined,
    coverUrl: r.cover_url ?? undefined,
    firstItemImage,
    isPublic: r.is_public,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    itemCount,
    author,
  };
}

/**
 * Для набора плейлистов возвращает:
 *  - карту count элементов,
 *  - карту первого (по position) content_id,
 *  - карту content_id → image_url.
 * Делает максимум 2 запроса: playlist_items и content.
 */
async function fetchPlaylistCoversAndCounts(playlistIds: string[]): Promise<{
  counts: Map<string, number>;
  firstImageByPlaylist: Map<string, string>;
}> {
  const counts = new Map<string, number>();
  const firstImageByPlaylist = new Map<string, string>();
  if (playlistIds.length === 0) return { counts, firstImageByPlaylist };

  const { data: itemRows } = await supabase
    .from('playlist_items')
    .select('playlist_id, content_id, position')
    .in('playlist_id', playlistIds)
    .order('position', { ascending: true });

  const items =
    (itemRows as { playlist_id: string; content_id: string; position: number }[] | null) || [];

  const firstContentByPlaylist = new Map<string, string>();
  items.forEach((r) => {
    counts.set(r.playlist_id, (counts.get(r.playlist_id) || 0) + 1);
    if (!firstContentByPlaylist.has(r.playlist_id)) {
      firstContentByPlaylist.set(r.playlist_id, r.content_id);
    }
  });

  const firstContentIds = Array.from(new Set(firstContentByPlaylist.values()));
  if (firstContentIds.length > 0) {
    const { data: contentRows } = await supabase
      .from('content')
      .select('id, image_url')
      .in('id', firstContentIds);
    const imageById = new Map<string, string>();
    ((contentRows as { id: string; image_url: string | null }[] | null) || []).forEach((c) => {
      if (c.image_url) imageById.set(c.id, c.image_url);
    });
    firstContentByPlaylist.forEach((contentId, playlistId) => {
      const img = imageById.get(contentId);
      if (img) firstImageByPlaylist.set(playlistId, img);
    });
  }

  return { counts, firstImageByPlaylist };
}

async function fetchAuthorMap(userIds: string[]): Promise<Map<string, AuthorProfile>> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return new Map();
  const { data } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', unique);
  const map = new Map<string, AuthorProfile>();
  ((data as { id: string; name: string | null; avatar_url: string | null }[] | null) || [])
    .forEach((p) => {
      map.set(p.id, {
        id: p.id,
        name: p.name || 'Читатель',
        avatarUrl: p.avatar_url || '',
      });
    });
  return map;
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

const PLAYLIST_SELECT = 'id, user_id, title, description, cover_url, is_public, created_at, updated_at';

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
  const [coversAndCounts, authors] = await Promise.all([
    fetchPlaylistCoversAndCounts(ids),
    fetchAuthorMap(rows.map((r) => r.user_id)),
  ]);
  const { counts, firstImageByPlaylist } = coversAndCounts;

  return rows.map((r) =>
    mapPlaylist(r, counts.get(r.id) || 0, authors.get(r.user_id), firstImageByPlaylist.get(r.id))
  );
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
  const [coversAndCounts, authors] = await Promise.all([
    fetchPlaylistCoversAndCounts(ids),
    fetchAuthorMap([userId]),
  ]);
  const { counts, firstImageByPlaylist } = coversAndCounts;
  return rows.map((r) =>
    mapPlaylist(r, counts.get(r.id) || 0, authors.get(r.user_id), firstImageByPlaylist.get(r.id))
  );
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
  const row = data as unknown as PlaylistRow;
  const authors = await fetchAuthorMap([row.user_id]);
  const playlist = mapPlaylist(row, undefined, authors.get(row.user_id));

  const { data: items } = await supabase
    .from('playlist_items')
    .select('position, added_at, content_id')
    .eq('playlist_id', id)
    .order('position', { ascending: true });

  const itemRows = (items as { position: number; content_id: string }[] | null) || [];
  if (itemRows.length === 0) {
    playlist.items = [];
    playlist.itemCount = 0;
    return playlist;
  }

  const { data: contents } = await supabase
    .from('content')
    .select(
      'id, type, title, description, image_url, status, created_by, created_at, author, director, year, metadata'
    )
    .in(
      'id',
      itemRows.map((r) => r.content_id)
    );
  const contentMap = new Map<string, ContentRow>();
  ((contents as ContentRow[] | null) || []).forEach((c) => contentMap.set(c.id, c));
  playlist.items = itemRows
    .map((r) => contentMap.get(r.content_id))
    .filter((c): c is ContentRow => !!c)
    .map(mapContent);
  playlist.itemCount = playlist.items.length;
  const firstWithImage = playlist.items.find((c) => c.imageUrl);
  if (firstWithImage) playlist.firstItemImage = firstWithImage.imageUrl;
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
  const row = data as unknown as PlaylistRow;
  const authors = await fetchAuthorMap([row.user_id]);
  return mapPlaylist(row, 0, authors.get(row.user_id));
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
