'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from '@/lib/notifications';
import type { Notification } from '@/lib/types';

const TYPE_ICON: Record<string, string> = {
  reply: 'reply',
  reaction: 'mood',
  mention: 'alternate_email',
  club_invite: 'group_add',
  marathon: 'rocket_launch',
  duel_nomination: 'swords',
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'сейчас';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function notificationText(n: Notification): string {
  const actor = n.actorName || 'Кто-то';
  const club = n.clubName ? ` в «${n.clubName}»` : '';
  switch (n.type) {
    case 'reply': {
      const preview = (n.payload?.preview as string) || '';
      return `${actor} ответил(а)${club}${preview ? `: «${preview}»` : ''}`;
    }
    case 'reaction': {
      const emoji = (n.payload?.emoji as string) || '';
      return `${actor} отреагировал(а) ${emoji}${club}`;
    }
    case 'mention':
      return `${actor} упомянул(а) вас${club}`;
    case 'club_invite':
      return `${actor} пригласил(а) вас в клуб${club}`;
    case 'marathon':
      return `Новости марафона${club}`;
    case 'duel_nomination': {
      const title = (n.payload?.title as string) || 'публикации';
      return `Ваш отзыв выбран для Дуэли Критиков по «${title}»!`;
    }
    default:
      return `${actor}${club}`;
  }
}

export default function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Первичная загрузка + счётчик.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const [list, count] = await Promise.all([
        getNotifications(user.id, 30),
        getUnreadNotificationsCount(user.id),
      ]);
      if (!alive) return;
      setItems(list);
      setUnread(count);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  // Realtime-подписка на новые уведомления.
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.id, (n) => {
      setItems((prev) => [n, ...prev].slice(0, 30));
      setUnread((c) => c + 1);
    });
    return unsub;
  }, [user]);

  // Закрытие по клику вне.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  if (!user) return null;

  const handleItemClick = async (n: Notification) => {
    if (!n.readAt) {
      await markNotificationRead(n.id);
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x
        )
      );
      setUnread((c) => Math.max(0, c - 1));
    }
    setOpen(false);
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead(user.id);
    setItems((prev) =>
      prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() }))
    );
    setUnread(0);
  };

  return (
    <div ref={boxRef} className="relative">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((v) => !v)}
        className="relative text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
        aria-label="Уведомления"
      >
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow"
            >
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-3 w-[360px] max-h-[480px] bg-white/90 backdrop-blur-xl border border-white shadow-2xl rounded-3xl overflow-hidden z-[60]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-on-surface/5">
              <h3 className="text-sm font-black tracking-tight text-on-surface">
                Уведомления
              </h3>
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Прочитать все
                </button>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto divide-y divide-on-surface/5">
              {items.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface/10">
                    notifications_off
                  </span>
                  <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                    Пока ничего нет
                  </p>
                </div>
              ) : (
                items.map((n) => {
                  let href = '#';
                  if (n.clubId) href = `/clubs/${n.clubId}`;
                  else if (n.payload?.duel_id) href = `/duels/${n.payload.duel_id}`;

                  const isUnread = !n.readAt;
                  return (
                    <Link
                      key={n.id}
                      href={href}
                      onClick={() => handleItemClick(n)}
                      className={`flex gap-3 px-5 py-3 transition-colors ${
                        isUnread
                          ? 'bg-accent-lilac/15 hover:bg-accent-lilac/25'
                          : 'hover:bg-on-surface/[0.03]'
                      }`}
                    >
                      <div className="relative flex-shrink-0 mt-0.5">
                        {n.actorAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={n.actorAvatar}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-accent-lilac/40 flex items-center justify-center text-[11px] font-black text-on-accent-lilac">
                            {(n.actorName || '?').charAt(0)}
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white border border-on-surface/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface text-[11px]">
                            {TYPE_ICON[n.type] || 'circle'}
                          </span>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-on-surface leading-snug line-clamp-2">
                          {notificationText(n)}
                        </p>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/60">
                          {formatWhen(n.createdAt)}
                        </p>
                      </div>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
