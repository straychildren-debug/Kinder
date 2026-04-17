import { supabase } from './supabase';

export type RsvpStatus = 'going' | 'maybe' | 'declined';

export interface ClubEvent {
  id: string;
  clubId: string;
  createdBy: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  createdAt: string;
  creatorName?: string;
  creatorAvatar?: string;
  myRsvp?: RsvpStatus | null;
  counts?: { going: number; maybe: number; declined: number };
}

type Row = {
  id: string;
  club_id: string;
  created_by: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  created_at: string;
  profiles?: { name?: string; avatar_url?: string } | null;
  club_event_rsvps?: { user_id: string; status: RsvpStatus }[];
};

function mapEvent(row: Row, userId?: string): ClubEvent {
  const rsvps = row.club_event_rsvps || [];
  const counts = { going: 0, maybe: 0, declined: 0 };
  for (const r of rsvps) counts[r.status] += 1;
  const mine = userId ? rsvps.find((r) => r.user_id === userId)?.status : null;
  return {
    id: row.id,
    clubId: row.club_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    createdAt: row.created_at,
    creatorName: row.profiles?.name,
    creatorAvatar: row.profiles?.avatar_url,
    myRsvp: mine ?? null,
    counts,
  };
}

export async function getClubEvents(
  clubId: string,
  userId?: string
): Promise<ClubEvent[]> {
  const { data, error } = await supabase
    .from('club_events')
    .select(
      '*, profiles:created_by(name, avatar_url), club_event_rsvps(user_id, status)'
    )
    .eq('club_id', clubId)
    .order('starts_at', { ascending: true });

  if (error || !data) {
    console.error('getClubEvents:', error);
    return [];
  }
  return (data as Row[]).map((r) => mapEvent(r, userId));
}

export async function createClubEvent(input: {
  clubId: string;
  createdBy: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
}): Promise<ClubEvent> {
  const { data, error } = await supabase
    .from('club_events')
    .insert({
      club_id: input.clubId,
      created_by: input.createdBy,
      title: input.title,
      description: input.description || null,
      starts_at: input.startsAt,
      ends_at: input.endsAt || null,
      location: input.location || null,
    })
    .select('*, profiles:created_by(name, avatar_url)')
    .single();

  if (error || !data) {
    console.error('createClubEvent:', error);
    throw error;
  }
  return mapEvent(data as Row, input.createdBy);
}

export async function deleteClubEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('club_events')
    .delete()
    .eq('id', eventId);
  if (error) throw error;
}

export async function setEventRsvp(
  eventId: string,
  userId: string,
  status: RsvpStatus
): Promise<void> {
  const { error } = await supabase
    .from('club_event_rsvps')
    .upsert(
      { event_id: eventId, user_id: userId, status },
      { onConflict: 'event_id,user_id' }
    );
  if (error) {
    console.error('setEventRsvp:', error);
    throw error;
  }
}

export async function clearEventRsvp(
  eventId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('club_event_rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);
  if (error) throw error;
}

export function subscribeToClubEvents(
  clubId: string,
  onChange: () => void
): () => void {
  const channel = supabase
    .channel(`club-events-${clubId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'club_events', filter: `club_id=eq.${clubId}` },
      () => onChange()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'club_event_rsvps' },
      () => onChange()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
