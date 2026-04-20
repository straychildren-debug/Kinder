import { supabase } from './supabase';
import type { Duel, DuelComment, DuelSide, DuelSource, Review, User, ContentItem } from './types';

// ---------- Mappers ----------

function mapContent(row: any): ContentItem | undefined {
  if (!row) return undefined;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    ...(row.metadata || {}),
  };
}

function mapReview(row: any): Review | undefined {
  if (!row) return undefined;
  return {
    id: row.id,
    contentId: row.content_id,
    userId: row.user_id,
    text: row.text,
    rating: row.rating,
    createdAt: row.created_at,
    user: row.profiles
      ? ({ id: row.user_id, name: row.profiles.name, avatarUrl: row.profiles.avatar_url } as User)
      : undefined,
  };
}

function mapDuel(row: any): Duel {
  return {
    id: row.id,
    contentId: row.content_id,
    challengerReviewId: row.challenger_review_id,
    defenderReviewId: row.defender_review_id,
    status: row.status,
    source: row.source,
    winnerReviewId: row.winner_review_id,
    createdBy: row.created_by,
    startedAt: row.started_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    content: mapContent(row.content),
    challengerReview: mapReview(row.challenger_review),
    defenderReview: mapReview(row.defender_review),
  };
}

const DUEL_SELECT = `
  *,
  content:content_id(*),
  challenger_review:challenger_review_id(*, profiles:user_id(name, avatar_url)),
  defender_review:defender_review_id(*, profiles:user_id(name, avatar_url))
`;

// ---------- Vote aggregation ----------

async function attachVoteStats(duels: Duel[], currentUserId?: string): Promise<Duel[]> {
  if (duels.length === 0) return duels;
  const ids = duels.map((d) => d.id);

  const { data, error } = await supabase
    .from('duel_votes')
    .select('duel_id, side, user_id, weight')
    .in('duel_id', ids);

  if (error || !data) return duels;

  const stats = new Map<string, { challenger: number; defender: number; mine?: DuelSide }>();
  for (const v of data as any[]) {
    const bucket = stats.get(v.duel_id) || { challenger: 0, defender: 0 };
    if (v.side === 'challenger') bucket.challenger += v.weight || 1;
    else bucket.defender += v.weight || 1;
    if (currentUserId && v.user_id === currentUserId) bucket.mine = v.side;
    stats.set(v.duel_id, bucket);
  }

  // Comment counts
  const { data: cc } = await supabase
    .from('duel_comments')
    .select('duel_id')
    .in('duel_id', ids);

  const commentMap = new Map<string, number>();
  for (const r of (cc || []) as any[]) {
    commentMap.set(r.duel_id, (commentMap.get(r.duel_id) || 0) + 1);
  }

  return duels.map((d) => {
    const s = stats.get(d.id) || { challenger: 0, defender: 0 };
    return {
      ...d,
      challengerVotes: s.challenger,
      defenderVotes: s.defender,
      mySide: s.mine ?? null,
      commentCount: commentMap.get(d.id) || 0,
    };
  });
}

// ---------- Queries ----------

export async function getActiveDuels(currentUserId?: string, limit = 20): Promise<Duel[]> {
  const { data, error } = await supabase
    .from('duels')
    .select(DUEL_SELECT)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('getActiveDuels:', error);
    return [];
  }

  const mapped = (data as any[]).map(mapDuel);
  return attachVoteStats(mapped, currentUserId);
}

export async function getDuelsForContent(contentId: string, currentUserId?: string): Promise<Duel[]> {
  const { data, error } = await supabase
    .from('duels')
    .select(DUEL_SELECT)
    .eq('content_id', contentId)
    .order('started_at', { ascending: false });

  if (error || !data) return [];
  return attachVoteStats((data as any[]).map(mapDuel), currentUserId);
}

export async function getDuelById(id: string, currentUserId?: string): Promise<Duel | null> {
  const { data, error } = await supabase
    .from('duels')
    .select(DUEL_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  const [withStats] = await attachVoteStats([mapDuel(data)], currentUserId);
  return withStats;
}

// ---------- Mutations ----------

export async function voteInDuel(duelId: string, userId: string, side: DuelSide) {
  const { error } = await supabase
    .from('duel_votes')
    .upsert(
      { duel_id: duelId, user_id: userId, side, weight: 1 },
      { onConflict: 'duel_id,user_id' }
    );
  if (error) throw error;
}

export async function removeVote(duelId: string, userId: string) {
  const { error } = await supabase
    .from('duel_votes')
    .delete()
    .eq('duel_id', duelId)
    .eq('user_id', userId);
  if (error) throw error;
}

/**
 * Nominate a target review for duel. The challenger must have their own review
 * (the counter-argument) already submitted — we expect the UI to enforce that.
 */
export async function nominateDuel(params: {
  contentId: string;
  challengerReviewId: string;
  defenderReviewId: string;
  createdBy: string;
  source?: DuelSource;
}): Promise<Duel | null> {
  const { data, error } = await supabase
    .from('duels')
    .insert({
      content_id: params.contentId,
      challenger_review_id: params.challengerReviewId,
      defender_review_id: params.defenderReviewId,
      created_by: params.createdBy,
      source: params.source || 'nomination',
    })
    .select(DUEL_SELECT)
    .single();

  if (error) {
    console.error('nominateDuel:', error);
    throw error;
  }
  return mapDuel(data);
}

/**
 * Check if a new review triggers an automatic duel.
 * Rule: a rating-5 review >=200 chars collides with a rating-1 review >=200 chars
 * (or vice versa) on the same content, and neither is currently in an active duel.
 */
export async function maybeCreateAutoDuel(
  contentId: string,
  newReview: { id: string; rating?: number; text: string; userId: string }
): Promise<Duel | null> {
  if (!newReview.text || newReview.text.length < 200) return null;
  if (newReview.rating !== 1 && newReview.rating !== 5) return null;

  const oppositeRating = newReview.rating === 5 ? 1 : 5;

  const { data: candidates, error } = await supabase
    .from('reviews')
    .select('id, user_id, rating, text')
    .eq('content_id', contentId)
    .eq('rating', oppositeRating)
    .neq('user_id', newReview.userId);

  if (error || !candidates || candidates.length === 0) return null;

  const eligible = (candidates as any[]).find(
    (r) => typeof r.text === 'string' && r.text.length >= 200
  );
  if (!eligible) return null;

  // Check there's no active duel involving either review.
  const { data: busy } = await supabase
    .from('duels')
    .select('id')
    .eq('status', 'active')
    .or(
      `challenger_review_id.eq.${newReview.id},defender_review_id.eq.${newReview.id},challenger_review_id.eq.${eligible.id},defender_review_id.eq.${eligible.id}`
    )
    .limit(1);

  if (busy && busy.length > 0) return null;

  const { data: created, error: insErr } = await supabase
    .from('duels')
    .insert({
      content_id: contentId,
      challenger_review_id: newReview.id,
      defender_review_id: eligible.id,
      source: 'auto',
    })
    .select(DUEL_SELECT)
    .single();

  if (insErr) {
    console.error('maybeCreateAutoDuel insert:', insErr);
    return null;
  }
  return mapDuel(created);
}

// ---------- Comments ----------

export async function getDuelComments(duelId: string): Promise<DuelComment[]> {
  const { data, error } = await supabase
    .from('duel_comments')
    .select('*, profiles:user_id(name, avatar_url)')
    .eq('duel_id', duelId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return (data as any[]).map((c) => ({
    id: c.id,
    duelId: c.duel_id,
    userId: c.user_id,
    text: c.text,
    createdAt: c.created_at,
    user: c.profiles
      ? ({ id: c.user_id, name: c.profiles.name, avatarUrl: c.profiles.avatar_url } as User)
      : undefined,
  }));
}

export async function addDuelComment(duelId: string, userId: string, text: string): Promise<DuelComment> {
  const { data, error } = await supabase
    .from('duel_comments')
    .insert({ duel_id: duelId, user_id: userId, text })
    .select('*, profiles:user_id(name, avatar_url)')
    .single();

  if (error) throw error;
  return {
    id: data.id,
    duelId: data.duel_id,
    userId: data.user_id,
    text: data.text,
    createdAt: data.created_at,
    user: data.profiles
      ? { id: data.user_id, name: data.profiles.name, avatarUrl: data.profiles.avatar_url } as User
      : undefined,
  };
}

/**
 * Finalize a duel whose ends_at has passed: set status=finished and pick winner.
 */
export async function finalizeDuelIfExpired(duel: Duel): Promise<Duel> {
  if (duel.status !== 'active') return duel;
  if (new Date(duel.endsAt).getTime() > Date.now()) return duel;

  const challengerVotes = duel.challengerVotes || 0;
  const defenderVotes = duel.defenderVotes || 0;
  let winner: string | null = null;
  if (challengerVotes > defenderVotes) winner = duel.challengerReviewId;
  else if (defenderVotes > challengerVotes) winner = duel.defenderReviewId;

  const { error } = await supabase
    .from('duels')
    .update({ status: 'finished', winner_review_id: winner })
    .eq('id', duel.id)
    .eq('status', 'active');

  if (error) {
    console.error('finalizeDuelIfExpired:', error);
    return duel;
  }
  return { ...duel, status: 'finished', winnerReviewId: winner };
}
