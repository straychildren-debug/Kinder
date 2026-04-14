import { supabase } from './supabase';
import { User, ContentItem, Review } from './types';

// ===== Пользователи (Профили) =====

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching user:', error);
    return null;
  }

  // Маппинг из БД в локальный тип
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    role: data.role,
    stats: data.stats,
    joinedAt: data.joined_at,
  };
}

export async function getUsersRanked(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error || !data) {
    console.error('Error fetching users for leaderboard:', error);
    return [];
  }

  const users: User[] = data.map(d => ({
    id: d.id,
    name: d.name,
    email: d.email,
    avatarUrl: d.avatar_url,
    bio: d.bio,
    role: d.role,
    stats: d.stats,
    joinedAt: d.joined_at,
  }));

  // В реальности это лучше делать через SQL View, но для простоты расчета:
  return users.sort((a, b) => {
    const scoreA = (a.stats?.publications || 0) * 3 + (a.stats?.reviews || 0) * 2 + (a.stats?.avgRating || 0) * 10 + (a.stats?.awards || 0);
    const scoreB = (b.stats?.publications || 0) * 3 + (b.stats?.reviews || 0) * 2 + (b.stats?.avgRating || 0) * 10 + (b.stats?.awards || 0);
    return scoreB - scoreA;
  });
}

// ===== Контент =====

function mapContentItem(row: any): ContentItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    ...row.metadata // Разворачиваем JSONB поле (director, author, rating и т.д.)
  };
}

export async function getApprovedContent(): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching approved content:', error);
    return [];
  }
  return data.map(mapContentItem);
}

export async function getPendingContent(): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending content:', error);
    return [];
  }
  return data.map(mapContentItem);
}

export async function getContentByUser(userId: string): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user content:', error);
    return [];
  }
  return data.map(mapContentItem);
}

// Функция для создания контента
export async function createContent(content: Partial<ContentItem> & { createdBy: string; type: 'movie' | 'book'; title: string }) {
  // Выделяем базовые поля и metadata
  const { title, type, description, imageUrl, status, createdBy, ...metadata } = content;
  
  const { data, error } = await supabase
    .from('content')
    .insert([{
      title,
      type,
      description,
      image_url: imageUrl,
      status: status || 'pending',
      created_by: createdBy,
      metadata: metadata, // сохраняем специфичные поля (год, режиссер и др.) в JSONB
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating content:', error);
    throw error;
  }
  return mapContentItem(data);
}

// Функция для обновления статуса модератором
export async function updateContentStatus(id: string, status: 'approved' | 'rejected') {
  const { data, error } = await supabase
    .from('content')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating content status:', error);
    throw error;
  }
  return mapContentItem(data);
}
