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

interface ClubEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  return new Date(iso).getTime() > Date.now() - 2 * 60 * 60 * 1000;
}

const RSVP_LABEL: Record<RsvpStatus, string> = {
  going: 'Иду',
  maybe: 'Возможно',
  declined: 'Не смогу',
};

export default function ClubEventsModal({ isOpen, onClose, clubId, canManage }: ClubEventsModalProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<ClubEvent[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = async () => {
    const list = await getClubEvents(clubId, user?.id);
    setEvents(list);
  };

  useEffect(() => {
    if (isOpen) {
      refresh();
      const unsub = subscribeToClubEvents(clubId, () => {
        refresh();
      });
      return unsub;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, user?.id, isOpen]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-[110] glass-modal-overlay flex items-center justify-center p-6" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-modal rounded-[40px] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-on-surface/5">
          <div>
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.4em] block mb-2 opacity-40 ">События сообщества</span>
            <h2 className="text-3xl font-black tracking-tighter leading-none">Календарь</h2>
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <button
                onClick={() => setShowCreate(true)}
                className="px-6 py-3 bg-on-surface text-surface rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md active:scale-95 transition-transform flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Создать
              </button>
            )}
            <button onClick={onClose} className="w-12 h-12 rounded-2xl glass-btn flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-6">
          {events === null ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 rounded-[28px] bg-on-surface/5 animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 px-4 bg-surface-container-lowest rounded-[32px] border border-dashed border-on-surface/10">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-6 opacity-30">
                <span className="material-symbols-outlined text-4xl">event_busy</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                Пока событий нет
              </p>
              {canManage && (
                <p className="text-[10px] text-on-surface-variant/40 mt-2">
                  Используйте кнопку «Создать», чтобы собрать участников на встречу
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 pb-8">
              {upcoming.length > 0 && upcoming.map((e) => (
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
                  <div className="flex items-center gap-4 py-6 opacity-40">
                    <div className="h-[1px] flex-1 bg-on-surface/20" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em]">Прошедшие</span>
                    <div className="h-[1px] flex-1 bg-on-surface/20" />
                  </div>
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
        </div>
      </motion.div>

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
    </div>
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
      className={`flex gap-5 p-5 rounded-[28px] border transition-all ${
        past
          ? 'bg-surface-container-lowest border-on-surface/5 opacity-60 grayscale'
          : 'bg-white/40 backdrop-blur-sm border-on-surface/5 shadow-sm hover:shadow-xl hover:bg-white/60'
      }`}
    >
      {/* Дата-бейдж */}
      <div className="flex-shrink-0 w-20 h-20 rounded-[24px] bg-primary/5 text-primary flex flex-col items-center justify-center border border-primary/10">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
          {when.month}
        </span>
        <span className="text-3xl font-black tracking-tighter leading-none">
          {when.day}
        </span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-base font-black text-on-surface truncate tracking-tight">
            {event.title}
          </h4>
          <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant/60 flex-shrink-0 tabular-nums">
            {when.time}
          </span>
        </div>

        {event.location && (
          <p className="text-[11px] font-bold text-primary/60 mt-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">place</span>
            {event.location}
          </p>
        )}

        {event.description && (
          <p className="text-xs text-on-surface-variant/70 mt-3 line-clamp-2 leading-relaxed font-medium">
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-on-surface/5 mt-4">
          <div className="flex items-center gap-4 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-green-500">check_circle</span> {event.counts?.going ?? 0}</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-amber-500">help</span> {event.counts?.maybe ?? 0}</span>
          </div>
          
          {!past && (
            <div className="flex items-center gap-1">
              {(['going', 'maybe', 'declined'] as RsvpStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onRsvp(event.id, s)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    event.myRsvp === s
                      ? 'bg-on-surface text-surface shadow-xl'
                      : 'bg-surface-container text-on-surface-variant hover:bg-on-surface/5'
                  }`}
                >
                  {RSVP_LABEL[s]}
                </button>
              ))}
              {canManage && (
                <button
                  onClick={() => onDelete(event.id)}
                  className="ml-3 w-8 h-8 rounded-xl text-on-surface-variant/40 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
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
      className="fixed inset-0 z-[120] bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4 shadow-2xl"
      onClick={onClose}
    >
      <motion.form
        onSubmit={handleSubmit}
        initial={{ y: 20, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 10, opacity: 0, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-[40px] p-10 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.3)] border border-on-surface/5 space-y-6"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-black text-on-surface tracking-tighter">
            Новое событие
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-surface-container transition-all flex items-center justify-center text-on-surface-variant/40"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-2 block ml-1">
              Название
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-surface-container-lowest border border-on-surface/5 rounded-[20px] px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Обсуждение «Тёмной башни»"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-2 block ml-1">
                Дата
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-surface-container-lowest border border-on-surface/5 rounded-[20px] px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-2 block ml-1">
                Время
              </span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full bg-surface-container-lowest border border-on-surface/5 rounded-[20px] px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-2 block ml-1">
              Место
            </span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-surface-container-lowest border border-on-surface/5 rounded-[20px] px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Zoom / кафе / адрес"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-2 block ml-1">
              Описание
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-surface-container-lowest border border-on-surface/5 rounded-[20px] px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
              placeholder="Что обсуждаем, что подготовить…"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 hover:bg-surface-container hover:text-on-surface transition-all"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={busy || !title.trim() || !date || !time}
            className="px-10 py-4 bg-on-surface text-surface rounded-[24px] text-[10px] font-black uppercase tracking-widest disabled:opacity-30 shadow-2xl active:scale-95 transition-all"
          >
            {busy ? 'Создаём…' : 'Опубликовать'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
