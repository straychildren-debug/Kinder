import { supabase } from './supabase';
import { User, ContentItem, Review, Club, ClubMember, ClubMessage, ClubMarathon, ClubRole, ClubCategory, MarathonItem, MarathonParticipantProgress, PinnedMessage, ClubPoll, ClubPollOption } from './types';

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

export async function searchProfiles(query: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);

  if (error || !data) {
    console.error('Error searching profiles:', error);
    return [];
  }

  return data.map(d => ({
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

export async function updateUserRole(userId: string, role: User['role']): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
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
    rejectionReason: row.rejection_reason,
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

export async function getContentById(id: string): Promise<ContentItem | null> {
  const { data, error } = await supabase
    .from('content')
    .select('*, profiles:created_by(*)')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching content by id:', error);
    return null;
  }
  
  // Create a richer object if we want author profile data, but sticking to standard ContentItem for now
  return mapContentItem(data);
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
  
  // Сбрасываем причину отклонения при любом обновлении (предполагаем это правка)
  updateData.rejection_reason = null;

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
export async function updateContentStatus(id: string, status: 'approved' | 'rejected' | 'draft', rejectionReason?: string) {
  const { data, error } = await supabase
    .from('content')
    .update({ 
      status,
      rejection_reason: rejectionReason || null
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating content status:', error);
    throw error;
  }
  return mapContentItem(data);
}

// ===== Reviews (Рецензии) =====

export async function getReviewsForContent(contentId: string): Promise<Review[]> {
  // Fetch reviews, grabbing user profile, and trying to count comments/ratings if possible. 
  // Since we don't have views, we'll do basic joins.
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles:user_id(name, avatar_url),
      review_comments(count),
      review_ratings(rating)
    `)
    .eq('content_id', contentId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data.map((r: any) => {
    // calculate average rating for review itself
    const ratings = r.review_ratings || [];
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum: number, item: any) => sum + item.rating, 0) / ratings.length 
      : 0;

    return {
      id: r.id,
      contentId: r.content_id,
      userId: r.user_id,
      text: r.text,
      rating: r.rating,
      likes: r.likes,
      commentCount: r.review_comments?.[0]?.count ?? 0,
      avgRating: Number(avgRating.toFixed(1)),
      reviewRatingCount: ratings.length,
      createdAt: r.created_at,
      user: r.profiles ? { 
        id: r.user_id, 
        name: r.profiles.name, 
        avatarUrl: r.profiles.avatar_url 
      } as User : undefined
    };
  });
}

export async function submitReview(contentId: string, userId: string, text: string, rating: number) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([{
      content_id: contentId,
      user_id: userId,
      text,
      rating
    }])
    .select()
    .single();

  if (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
  return data;
}

export async function rateReview(reviewId: string, userId: string, rating: number) {
  const { data, error } = await supabase
    .from('review_ratings')
    .upsert({
      review_id: reviewId,
      user_id: userId,
      rating
    }, { onConflict: 'review_id, user_id' });

  if (error) {
    console.error('Error rating review:', error);
    throw error;
  }
  return data;
}

export async function addReviewComment(reviewId: string, userId: string, text: string) {
  const { data, error } = await supabase
    .from('review_comments')
    .insert([{
      review_id: reviewId,
      user_id: userId,
      text
    }])
    .select('*, profiles:user_id(name, avatar_url)')
    .single();

  if (error) {
    console.error('Error adding review comment:', error);
    throw error;
  }
  return data;
}

export async function getReviewComments(reviewId: string) {
  const { data, error } = await supabase
    .from('review_comments')
    .select('*, profiles:user_id(name, avatar_url)')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((c: any) => ({
    id: c.id,
    reviewId: c.review_id,
    userId: c.user_id,
    text: c.text,
    createdAt: c.created_at,
    user: c.profiles ? { 
      id: c.user_id, 
      name: c.profiles.name, 
      avatarUrl: c.profiles.avatar_url 
    } as User : undefined
  }));
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

export async function canCreateClub(user: User): Promise<boolean> {
  if (user.role === 'admin' || user.role === 'moderator' || user.role === 'superadmin') return true;
  
  const count = await getUserApprovedCount(user.id);
  return count >= 20;
}

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
    .select('*, profiles:user_id(name, avatar_url), reactions:club_message_reactions(*), parent:reply_to_id(text, parent_profiles:user_id(name))')
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
    isEdited: row.is_edited,
    replyToId: row.reply_to_id,
    repliedMessage: row.parent ? {
      text: row.parent.text,
      senderName: row.parent.parent_profiles?.name || 'User'
    } : null,
    createdAt: row.created_at,
    senderName: row.profiles?.name,
    senderAvatar: row.profiles?.avatar_url,
    reactions: row.reactions || [],
  }));
}

export async function sendMessage(
  clubId: string,
  userId: string,
  text: string | null,
  fileUrl?: string | null,
  fileType?: 'image' | 'file' | null,
  replyToId?: string | null
): Promise<ClubMessage> {
  const { data, error } = await supabase
    .from('club_messages')
    .insert([{
      club_id: clubId,
      user_id: userId,
      text,
      file_url: fileUrl || null,
      file_type: fileType || null,
      reply_to_id: replyToId || null,
    }])
    .select('*, profiles:user_id(name, avatar_url), parent:reply_to_id(text, parent_profiles:user_id(name))')
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
    isEdited: data.is_edited,
    replyToId: data.reply_to_id,
    repliedMessage: (data as any).parent ? {
      text: (data as any).parent.text,
      senderName: (data as any).parent.parent_profiles?.name || 'User'
    } : null,
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
  createdBy: string,
  items: { contentId: string, title: string }[]
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

  if (items && items.length > 0) {
    const itemsData = items.map(t => ({ marathon_id: data.id, title: t.title, content_id: t.contentId }));
    await supabase.from('club_marathon_items').insert(itemsData);
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

export async function getMarathonItems(marathonId: string): Promise<MarathonItem[]> {
  const { data, error } = await supabase
    .from('club_marathon_items')
    .select('*')
    .eq('marathon_id', marathonId)
    .order('created_at', { ascending: true });
  
  if (error) return [];
  return data.map((d: any) => ({
    id: d.id,
    marathonId: d.marathon_id,
    title: d.title,
    contentId: d.content_id,
  }));
}

export async function getMarathonProgress(marathonId: string): Promise<MarathonParticipantProgress[]> {
  const { data, error } = await supabase
    .from('club_marathon_participants')
    .select('*, profiles:user_id(name, avatar_url)')
    .eq('marathon_id', marathonId);

  if (error) return [];
  return data.map((d: any) => ({
    id: d.id,
    marathonId: d.marathon_id,
    userId: d.user_id,
    itemId: d.item_id,
    isCompleted: d.is_completed,
    reviewText: d.review_text,
    updatedAt: d.updated_at,
    userName: d.profiles?.name,
    userAvatar: d.profiles?.avatar_url,
  }));
}

export async function updateMarathonProgressItem(
  marathonId: string,
  userId: string,
  itemId: string,
  isCompleted: boolean,
  reviewText: string
): Promise<void> {
  const { error } = await supabase
    .from('club_marathon_participants')
    .upsert({
      marathon_id: marathonId,
      user_id: userId,
      item_id: itemId,
      is_completed: isCompleted,
      review_text: reviewText || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id, item_id' });
    
  if (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
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
    role: data.role as ClubRole,
    joinedAt: data.joined_at,
  };
}


export async function updateMessage(messageId: string, newText: string): Promise<void> {
  const { error } = await supabase
    .from('club_messages')
    .update({ text: newText, is_edited: true })
    .eq('id', messageId);

  if (error) {
    console.error('Error updating message:', error);
    throw error;
  }
}

export async function toggleReaction(messageId: string, userId: string, emoji: string): Promise<void> {
  // First, check if already exists
  const { data: existing, error: checkError } = await supabase
    .from('club_message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existing) {
    // Remove
    const { error } = await supabase
      .from('club_message_reactions')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    // Add
    const { error } = await supabase
      .from('club_message_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        emoji
      });
    if (error) throw error;
  }
}

// ===== Закреплённые сообщения =====

export async function pinMessage(clubId: string, messageId: string, pinnedBy: string): Promise<void> {
  const { error } = await supabase
    .from('club_pinned_messages')
    .insert({ club_id: clubId, message_id: messageId, pinned_by: pinnedBy });

  if (error) {
    console.error('Error pinning message:', error);
    throw error;
  }
}

export async function unpinMessage(clubId: string, messageId: string): Promise<void> {
  const { error } = await supabase
    .from('club_pinned_messages')
    .delete()
    .eq('club_id', clubId)
    .eq('message_id', messageId);

  if (error) {
    console.error('Error unpinning message:', error);
    throw error;
  }
}

export async function getPinnedMessages(clubId: string): Promise<PinnedMessage[]> {
  const { data, error } = await supabase
    .from('club_pinned_messages')
    .select('*, club_messages:message_id(*, profiles:user_id(name, avatar_url))')
    .eq('club_id', clubId)
    .order('pinned_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching pinned messages:', error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    clubId: row.club_id,
    messageId: row.message_id,
    pinnedBy: row.pinned_by,
    pinnedAt: row.pinned_at,
    message: row.club_messages ? {
      id: row.club_messages.id,
      clubId: row.club_messages.club_id,
      userId: row.club_messages.user_id,
      text: row.club_messages.text,
      fileUrl: row.club_messages.file_url,
      fileType: row.club_messages.file_type,
      createdAt: row.club_messages.created_at,
      senderName: row.club_messages.profiles?.name,
      senderAvatar: row.club_messages.profiles?.avatar_url,
    } : undefined,
  }));
}

export async function getPinnedMessageIds(clubId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('club_pinned_messages')
    .select('message_id')
    .eq('club_id', clubId);

  if (error || !data) return new Set();
  return new Set(data.map((r: any) => r.message_id));
}

// ===== Опросы и голосования =====

export async function createPoll(
  clubId: string,
  createdBy: string,
  question: string,
  options: string[],
  isAnonymous = false,
  isMultiple = false
): Promise<ClubPoll> {
  const { data: pollData, error: pollError } = await supabase
    .from('club_polls')
    .insert({
      club_id: clubId,
      created_by: createdBy,
      question,
      is_anonymous: isAnonymous,
      is_multiple: isMultiple,
    })
    .select()
    .single();

  if (pollError || !pollData) {
    console.error('Error creating poll:', pollError);
    throw pollError;
  }

  // Insert options
  const optionsData = options.map((text, i) => ({
    poll_id: pollData.id,
    text,
    sort_order: i,
  }));

  const { data: optRows, error: optError } = await supabase
    .from('club_poll_options')
    .insert(optionsData)
    .select();

  if (optError) {
    console.error('Error creating poll options:', optError);
  }

  return {
    id: pollData.id,
    clubId: pollData.club_id,
    createdBy: pollData.created_by,
    question: pollData.question,
    isAnonymous: pollData.is_anonymous,
    isMultiple: pollData.is_multiple,
    isActive: pollData.is_active,
    createdAt: pollData.created_at,
    options: (optRows || []).map((o: any) => ({
      id: o.id,
      pollId: o.poll_id,
      text: o.text,
      sortOrder: o.sort_order,
      voteCount: 0,
      votedByMe: false,
    })),
    totalVotes: 0,
  };
}

export async function getClubPolls(clubId: string, userId: string): Promise<ClubPoll[]> {
  const { data, error } = await supabase
    .from('club_polls')
    .select('*, profiles:created_by(name, avatar_url), club_poll_options(*, club_poll_votes(user_id))')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching polls:', error);
    return [];
  }

  return data.map((p: any) => {
    const options: ClubPollOption[] = (p.club_poll_options || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((o: any) => ({
        id: o.id,
        pollId: o.poll_id,
        text: o.text,
        sortOrder: o.sort_order,
        voteCount: (o.club_poll_votes || []).length,
        votedByMe: (o.club_poll_votes || []).some((v: any) => v.user_id === userId),
      }));

    const totalVotes = options.reduce((sum, o) => sum + (o.voteCount || 0), 0);

    return {
      id: p.id,
      clubId: p.club_id,
      createdBy: p.created_by,
      question: p.question,
      isAnonymous: p.is_anonymous,
      isMultiple: p.is_multiple,
      isActive: p.is_active,
      createdAt: p.created_at,
      options,
      creatorName: p.profiles?.name,
      creatorAvatar: p.profiles?.avatar_url,
      totalVotes,
    };
  });
}

export async function votePoll(pollId: string, optionId: string, userId: string): Promise<void> {
  // For single-choice polls, remove existing vote first
  const { data: pollData } = await supabase
    .from('club_polls')
    .select('is_multiple')
    .eq('id', pollId)
    .single();

  if (!pollData?.is_multiple) {
    // Remove existing votes for this user on this poll
    await supabase
      .from('club_poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', userId);
  }

  const { error } = await supabase
    .from('club_poll_votes')
    .insert({ poll_id: pollId, option_id: optionId, user_id: userId });

  if (error) {
    console.error('Error voting:', error);
    throw error;
  }
}

export async function unvotePoll(pollId: string, optionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('club_poll_votes')
    .delete()
    .eq('poll_id', pollId)
    .eq('option_id', optionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error unvoting:', error);
    throw error;
  }
}

export async function closePoll(pollId: string): Promise<void> {
  const { error } = await supabase
    .from('club_polls')
    .update({ is_active: false })
    .eq('id', pollId);

  if (error) {
    console.error('Error closing poll:', error);
    throw error;
  }
}

// ===== Поиск по чату =====

export async function searchMessages(clubId: string, query: string, limit = 30): Promise<ClubMessage[]> {
  const { data, error } = await supabase
    .from('club_messages')
    .select('*, profiles:user_id(name, avatar_url)')
    .eq('club_id', clubId)
    .ilike('text', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('Error searching messages:', error);
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

// ===== Голосовые сообщения =====

export async function uploadVoiceMessage(blob: Blob, durationSeconds: number): Promise<{ url: string; duration: number }> {
  const fileName = `voice-${Date.now()}-${Math.random().toString(36).substring(2)}.webm`;
  const filePath = `voice/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('club-files')
    .upload(filePath, blob, { contentType: 'audio/webm' });

  if (uploadError) {
    console.error('Error uploading voice:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('club-files')
    .getPublicUrl(filePath);

  return { url: data.publicUrl, duration: durationSeconds };
}

export async function sendVoiceMessage(
  clubId: string,
  userId: string,
  voiceUrl: string,
  durationSeconds: number,
  replyToId?: string | null
): Promise<ClubMessage> {
  const { data, error } = await supabase
    .from('club_messages')
    .insert([{
      club_id: clubId,
      user_id: userId,
      text: null,
      file_url: voiceUrl,
      file_type: 'voice',
      voice_duration_seconds: durationSeconds,
      reply_to_id: replyToId || null,
    }])
    .select('*, profiles:user_id(name, avatar_url)')
    .single();

  if (error || !data) {
    console.error('Error sending voice message:', error);
    throw error;
  }

  await updateLastReadAt(clubId, userId);

  return {
    id: data.id,
    clubId: data.club_id,
    userId: data.user_id,
    text: null,
    fileUrl: data.file_url,
    fileType: 'voice',
    voiceDurationSeconds: data.voice_duration_seconds,
    createdAt: data.created_at,
    senderName: (data as any).profiles?.name,
    senderAvatar: (data as any).profiles?.avatar_url,
  };
}

// ===== Упоминания: поиск участников клуба =====

export async function searchClubMembers(clubId: string, query: string): Promise<ClubMember[]> {
  const { data, error } = await supabase
    .from('club_members')
    .select('*, profiles:user_id(name, avatar_url)')
    .eq('club_id', clubId)
    .limit(10);

  if (error || !data) return [];

  // Filter by name on client side (supabase can't ilike on joined column easily)
  return data
    .filter((row: any) => {
      if (!query) return true;
      return row.profiles?.name?.toLowerCase().includes(query.toLowerCase());
    })
    .map((row: any) => ({
      id: row.id,
      clubId: row.club_id,
      userId: row.user_id,
      role: row.role,
      joinedAt: row.joined_at,
      userName: row.profiles?.name,
      userAvatar: row.profiles?.avatar_url,
    }));
}
