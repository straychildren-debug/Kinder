'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './AuthProvider';
import {
  ClubEvent,
  RsvpStatus,
  clearEventRsvp,
  createClubEvent,
  deleteClubEvent,
  getClubEvents,
  setEventRsvp,
  subscribeToClubEvents,
} from '@/lib/events';

interface Props {
  clubId: string;
  canManage: boolean;
}

function formatWhen(iso: string): { day: string; time: string; month: string } {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('ru-RU', { day: 'numeric' }),
    month: d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', ''),
    time: d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
  };
}

function isUpcoming(iso: string): boolean {
  return new Date(iso).getTime() > Date.now() - 2 * 60 * 60 * 1000; // в течение 2 ч после старта считаем актуальным
}

const RSVP_LABEL: Record<RsvpStatus, string> = {
  going: 'Иду',
  maybe: 'Возможно',
  declined: 'Не смогу',
};

export default function ClubEventsPanel({ clubId, canManage }: Props) {
  const { user } = useAuth();
  const [events, setEvents] = useState<ClubEvent[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = async () => {
    const list = await getClubEvents(clubId, user?.id);
    setEvents(list);
  };

  useEffect(() => {
    refresh();
    const unsub = subscribeToClubEvents(clubId, () => {
      refresh();
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, user?.id]);

  const upcoming = (events || []).filter((e) => isUpcoming(e.startsAt));
  const past = (events || []).filter((e) => !isUpcoming(e.startsAt));

  const handleRsvp = async (eventId: string, status: RsvpStatus) => {
    if (!user) return;
    const current = events?.find((e) => e.id === eventId)?.myRsvp;
    try {
      if (current === status) {
        await clearEventRsvp(eventId, user.id);
      } else {
        await setEventRsvp(eventId, user.id, status);
      }
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Удалить событие?')) return;
    try {
      await deleteClubEvent(eventId);
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <section className="bg-surface rounded-[32px] border border-on-surface/5 shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-on-surface tracking-tight">
            Календарь клуба
          </h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 mt-1">
            Встречи, созвоны, обсуждения
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-on-surface text-surface rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md active:scale-95 transition-transform flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Событие
          </button>
        )}
      </div>

      {events === null ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-on-surface/5 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 px-4 bg-surface-container-lowest rounded-2xl border border-dashed border-on-surface/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
            Пока событий нет
          </p>
          {canManage && (
            <p className="text-[10px] text-on-surface-variant/40 mt-2">
              Создайте первое — соберите клуб на обсуждение
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              canManage={canManage}
              onRsvp={handleRsvp}
              onDelete={handleDelete}
            />
          ))}
          {past.length > 0 && (
            <>
              <p className="pt-4 pb-1 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                Прошедшие
              </p>
              {past.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  canManage={canManage}
                  onRsvp={handleRsvp}
                  onDelete={handleDelete}
                  past
                />
              ))}
            </>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreate && user && (
          <CreateEventModal
            clubId={clubId}
            userId={user.id}
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              refresh();
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function EventCard({
  event,
  canManage,
  onRsvp,
  onDelete,
  past = false,
}: {
  event: ClubEvent;
  canManage: boolean;
  onRsvp: (id: string, s: RsvpStatus) => void;
  onDelete: (id: string) => void;
  past?: boolean;
}) {
  const when = formatWhen(event.startsAt);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex gap-4 p-4 rounded-2xl border ${
        past
          ? 'bg-surface-container-lowest border-on-surface/5 opacity-70'
          : 'bg-white border-on-surface/5 shadow-sm'
      }`}
    >
      {/* Дата-бейдж */}
      <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-accent-lilac/30 text-on-surface flex flex-col items-center justify-center border border-accent-lilac/30">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
          {when.month}
        </span>
        <span className="text-2xl font-black tracking-tighter leading-none">
          {when.day}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-black text-on-surface truncate">
            {event.title}
          </h4>
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 flex-shrink-0">
            {when.time}
          </span>
        </div>

        {event.location && (
          <p className="text-[11px] font-medium text-on-surface-variant mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">place</span>
            {event.location}
          </p>
        )}

        {event.description && (
          <p className="text-xs text-on-surface-variant mt-2 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Счётчики + RSVP */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-on-surface/5">
          <div className="flex items-center gap-3 text-[10px] font-black text-on-surface-variant/70 uppercase tracking-widest">
            <span>✓ {event.counts?.going ?? 0}</span>
            <span>? {event.counts?.maybe ?? 0}</span>
          </div>
          {!past && (
            <div className="flex items-center gap-1">
              {(['going', 'maybe', 'declined'] as RsvpStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onRsvp(event.id, s)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    event.myRsvp === s
                      ? 'bg-on-surface text-surface shadow'
                      : 'bg-surface-container text-on-surface-variant hover:bg-on-surface/10'
                  }`}
                >
                  {RSVP_LABEL[s]}
                </button>
              ))}
              {canManage && (
                <button
                  onClick={() => onDelete(event.id)}
                  className="ml-2 p-1 rounded-lg text-on-surface-variant/60 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="Удалить событие"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CreateEventModal({
  clubId,
  userId,
  onClose,
  onCreated,
}: {
  clubId: string;
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;
    setBusy(true);
    try {
      const startsAt = new Date(`${date}T${time}`).toISOString();
      await createClubEvent({
        clubId,
        createdBy: userId,
        title: title.trim(),
        description: description.trim() || undefined,
        startsAt,
        location: location.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      console.error(err);
      alert('Не удалось создать событие');
    }
    setBusy(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.form
        onSubmit={handleSubmit}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-[32px] p-6 md:p-8 shadow-2xl border border-on-surface/5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-on-surface tracking-tight">
            Новое событие
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant/60 hover:text-on-surface"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
            Название
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full bg-surface-container-lowest border border-on-surface/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-accent-lilac"
            placeholder="Обсуждение «Тёмной башни»"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
              Дата
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1 w-full bg-surface-container-lowest border border-on-surface/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-accent-lilac"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
              Время
            </span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="mt-1 w-full bg-surface-container-lowest border border-on-surface/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-accent-lilac"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
            Место (необязательно)
          </span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full bg-surface-container-lowest border border-on-surface/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-accent-lilac"
            placeholder="Zoom / кафе / адрес"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
            Описание (необязательно)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full bg-surface-container-lowest border border-on-surface/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-accent-lilac resize-none"
            placeholder="Что обсуждаем, что подготовить…"
          />
        </label>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={busy || !title.trim() || !date || !time}
            className="px-5 py-2.5 bg-on-surface text-surface rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 shadow-md transition-all"
          >
            {busy ? 'Создаём…' : 'Создать'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
