import { supabase } from './supabase';
import { User, ContentItem, Review, Club, ClubMember, ClubMessage, ClubMarathon } from './types';

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

// Функция для обновления контента (например, редактирования черновика)
export async function updateContent(id: string, content: Partial<ContentItem>) {
  const { title, type, description, imageUrl, status, createdBy, ...metadata } = content;

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (type !== undefined) updateData.type = type;
  if (description !== undefined) updateData.description = description;
  if (imageUrl !== undefined) updateData.image_url = imageUrl;
  if (status !== undefined) updateData.status = status;
  if (Object.keys(metadata).length > 0) updateData.metadata = metadata;

  const { data, error } = await supabase
    .from('content')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating content:', error);
    throw error;
  }
  return mapContentItem(data);
}

// Функция для обновления статуса модератором
export async function updateContentStatus(id: string, status: 'approved' | 'rejected' | 'draft') {
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

// ===== Storage (Обложки) =====

export async function uploadCover(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `covers/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('covers')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading cover:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('covers')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// ===== Клубы =====

export async function getClubs(userId?: string): Promise<Club[]> {
  if (userId) {
    // Fetch clubs with unread count via RPC
    const { data, error } = await supabase.rpc('get_clubs_with_unread', { p_user_id: userId });

    if (error || !data) {
      console.error('Error fetching clubs with RPC:', error);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      imageUrl: row.image_url,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      memberCount: parseInt(row.member_count),
      unreadCount: parseInt(row.unread_count),
    }));
  }

  // Fallback for public/unauthorized view
  const { data, error } = await supabase
    .from('clubs')
    .select('*, club_members(count)')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching clubs:', error);
    return [];
  }

  return data.map((row: any) => ({
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

export async function getClubById(id: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*, club_members(count)')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching club:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    imageUrl: data.image_url,
    ownerId: data.owner_id,
    createdAt: data.created_at,
    memberCount: data.club_members?.[0]?.count ?? 0,
  };
}

export async function createClub(
  name: string,
  description: string,
  category: string,
  imageUrl: string,
  ownerId: string
): Promise<Club> {
  // 1. Insert the club
  const { data: clubData, error: clubError } = await supabase
    .from('clubs')
    .insert([{
      name,
      description,
      category,
      image_url: imageUrl,
      owner_id: ownerId,
    }])
    .select()
    .single();

  if (clubError || !clubData) {
    console.error('Error creating club:', clubError);
    throw clubError;
  }

  // 2. Add the creator as owner member
  const { error: memberError } = await supabase
    .from('club_members')
    .insert([{
      club_id: clubData.id,
      user_id: ownerId,
      role: 'owner',
    }]);

  if (memberError) {
    console.error('Error adding owner as member:', memberError);
  }

  return {
    id: clubData.id,
    name: clubData.name,
    description: clubData.description,
    category: clubData.category,
    imageUrl: clubData.image_url,
    ownerId: clubData.owner_id,
    createdAt: clubData.created_at,
    memberCount: 1,
  };
}

export async function joinClub(clubId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('club_members')
    .insert([{
      club_id: clubId,
      user_id: userId,
      role: 'member',
    }]);

  if (error) {
    console.error('Error joining club:', error);
    throw error;
  }
}

export async function leaveClub(clubId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error leaving club:', error);
    throw error;
  }
}

export async function updateMemberRole(clubId: string, userId: string, role: string): Promise<void> {
  const { error } = await supabase
    .from('club_members')
    .update({ role })
    .eq('club_id', clubId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating member role:', error);
    throw error;
  }
}

export async function removeMember(clubId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing member:', error);
    throw error;
  }
}

export async function getClubMembers(clubId: string): Promise<ClubMember[]> {
  const { data, error } = await supabase
    .from('club_members')
    .select('*, profiles:user_id(name, avatar_url)')
    .eq('club_id', clubId)
    .order('joined_at', { ascending: true });

  if (error || !data) {
    console.error('Error fetching club members:', error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    clubId: row.club_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    userName: row.profiles?.name,
    userAvatar: row.profiles?.avatar_url,
  }));
}

// ===== Сообщения клуба =====

export async function getClubMessages(clubId: string, limit = 50): Promise<ClubMessage[]> {
  const { data, error } = await supabase
    .from('club_messages')
    .select('*, profiles:user_id(name, avatar_url)')
    .eq('club_id', clubId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !data) {
    console.error('Error fetching club messages:', error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    clubId: row.club_id,
    userId: row.user_id,
    text: row.text,
    fileUrl: row.file_url,
    fileType: row.file_type,
    createdAt: row.created_at,
    senderName: row.profiles?.name,
    senderAvatar: row.profiles?.avatar_url,
  }));
}

export async function sendMessage(
  clubId: string,
  userId: string,
  text: string | null,
  fileUrl?: string | null,
  fileType?: 'image' | 'file' | null
): Promise<ClubMessage> {
  const { data, error } = await supabase
    .from('club_messages')
    .insert([{
      club_id: clubId,
      user_id: userId,
      text,
      file_url: fileUrl || null,
      file_type: fileType || null,
    }])
    .select('*, profiles:user_id(name, avatar_url)')
    .single();

  if (error || !data) {
    console.error('Error sending message:', error);
    throw error;
  }

  // Update last_read_at for the sender immediately
  await updateLastReadAt(clubId, userId);

  return {
    id: data.id,
    clubId: data.club_id,
    userId: data.user_id,
    text: data.text,
    fileUrl: data.file_url,
    fileType: data.file_type,
    createdAt: data.created_at,
    senderName: (data as any).profiles?.name,
    senderAvatar: (data as any).profiles?.avatar_url,
  };
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('club_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

export async function updateLastReadAt(clubId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('club_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('club_id', clubId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating last_read_at:', error);
  }
}

// ===== Марафоны =====

export async function getActiveMarathon(clubId: string): Promise<ClubMarathon | null> {
  const { data, error } = await supabase
    .from('club_marathons')
    .select('*')
    .eq('club_id', clubId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('Error fetching active marathon:', error);
    return null;
  }

  return {
    id: data.id,
    clubId: data.club_id,
    title: data.title,
    endsAt: data.ends_at,
    createdBy: data.created_by,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}

export async function createMarathon(
  clubId: string,
  title: string,
  endsAt: string,
  createdBy: string
): Promise<ClubMarathon> {
  // Deactivate any existing active marathon first
  await supabase
    .from('club_marathons')
    .update({ is_active: false })
    .eq('club_id', clubId)
    .eq('is_active', true);

  const { data, error } = await supabase
    .from('club_marathons')
    .insert([{
      club_id: clubId,
      title,
      ends_at: endsAt,
      created_by: createdBy,
      is_active: true,
    }])
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating marathon:', error);
    throw error;
  }

  return {
    id: data.id,
    clubId: data.club_id,
    title: data.title,
    endsAt: data.ends_at,
    createdBy: data.created_by,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}

export async function endMarathon(marathonId: string): Promise<void> {
  const { error } = await supabase
    .from('club_marathons')
    .update({ is_active: false })
    .eq('id', marathonId);

  if (error) {
    console.error('Error ending marathon:', error);
    throw error;
  }
}

// ===== Утилиты =====

export async function getUserApprovedCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('content')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', userId)
    .eq('status', 'approved');

  if (error) {
    console.error('Error counting approved content:', error);
    return 0;
  }

  return count ?? 0;
}

export async function uploadClubFile(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('club-files')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading club file:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('club-files')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function getUserMembership(clubId: string, userId: string): Promise<ClubMember | null> {
  const { data, error } = await supabase
    .from('club_members')
    .select('*')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    clubId: data.club_id,
    userId: data.user_id,
    role: data.role,
    joinedAt: data.joined_at,
  };
}

