import { supabase } from './supabase';

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false;
  const { error } = await supabase
    .from('follows')
    .upsert(
      { follower_id: followerId, following_id: followingId },
      { onConflict: 'follower_id,following_id' }
    );
  if (error) {
    console.error('followUser:', error);
    return false;
  }
  return true;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  if (error) {
    console.error('unfollowUser:', error);
    return false;
  }
  return true;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (!followerId || !followingId || followerId === followingId) return false;
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  if (error) {
    console.error('isFollowing:', error);
    return false;
  }
  return !!data;
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (error) {
    console.error('getFollowingIds:', error);
    return [];
  }
  return ((data as { following_id: string }[] | null) || []).map((r) => r.following_id);
}

export async function getFollowerIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId);
  if (error) {
    console.error('getFollowerIds:', error);
    return [];
  }
  return ((data as { follower_id: string }[] | null) || []).map((r) => r.follower_id);
}

export async function getFollowCounts(
  userId: string
): Promise<{ followers: number; following: number }> {
  const [followersRes, followingRes] = await Promise.all([
    supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('follows')
      .select('following_id', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ]);
  return {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
  };
}
