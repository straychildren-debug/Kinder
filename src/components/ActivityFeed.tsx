'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getGlobalActivity,
  subscribeToActivity,
} from '@/lib/activity';
import { AWARD_META } from '@/lib/awards';
import type { ActivityEvent, AwardType } from '@/lib/types';

const TYPE_ICON: Record<string, { icon: string; color: string }> = {
  reviewed_content: { icon: 'rate_review', color: 'text-sky-600' },
  published_content: { icon: 'auto_stories', color: 'text-emerald-600' },
  joined_club: { icon: 'groups', color: 'text-fuchsia-600' },
  completed_marathon: { icon: 'rocket_launch', color: 'text-orange-600' },
  earned_award: { icon: 'workspace_premium', color: 'text-amber-600' },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'сейчас';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function eventText(e: ActivityEvent): React.ReactNode {
  const name = e.userName || 'Участник';
  const p = e.payload || {};
  switch (e.type) {
    case 'reviewed_content': {
      const title = (p.title as string) || 'на контент';
      return (
        <>
          <b>{name}</b> оставил(а) рецензию на <b>«{title}»</b>
        </>
      );
    }
    case 'published_content': {
      const title = (p.title as string) || 'новый контент';
      return (
        <>
          <b>{name}</b> опубликовал(а) <b>«{title}»</b>
        </>
      );
    }
    case 'joined_club': {
      const club = (p.club_name as string) || 'клуб';
      return (
        <>
          <b>{name}</b> вступил(а) в клуб <b>«{club}»</b>
        </>
      );
    }
    case 'completed_marathon': {
      const title = (p.title as string) || 'марафон';
      return (
        <>
          <b>{name}</b> завершил(а) марафон <b>«{title}»</b>
        </>
      );
    }
    case 'earned_award': {
      const type = (p.type as AwardType) || 'first_review';
      const meta = AWARD_META[type];
      return (
        <>
          <b>{name}</b> получил(а) награду{' '}
          <b>«{meta?.title || 'Достижение'}»</b>
        </>
      );
    }
    default:
      return <b>{name}</b>;
  }
}

function eventHref(e: ActivityEvent): string | null {
  if (e.type === 'joined_club' && e.refId) return `/clubs/${e.refId}`;
  if (e.type === 'completed_marathon' && e.refId) {
    // нет прямой страницы марафона — можно вернуться в клуб, но clubId не известен здесь
    return null;
  }
  return null;
}

export default function ActivityFeed() {
  const [items, setItems] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    let alive = true;
    getGlobalActivity(20)
      .then((list) => {
        if (alive) setItems(list || []);
      })
      .catch((err) => {
        console.error('ActivityFeed fetch error:', err);
        if (alive) setItems([]);
      });

    let unsub = () => {};
    try {
      unsub = subscribeToActivity((e) => {
        setItems((prev) => [e, ...(prev ?? [])].slice(0, 20));
      });
    } catch (err) {
      console.error('ActivityFeed subscription error:', err);
    }
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  return (
    <aside className="bg-surface p-8 rounded-3xl border border-on-surface/5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-on-surface tracking-tight">
          Лента сообщества
        </h3>
        <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
          в реальном времени
        </span>
      </div>

      {items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-2xl bg-on-surface/5 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">
          Пока тихо — будь первым
        </p>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {items.map((e) => {
              const meta = TYPE_ICON[e.type] || TYPE_ICON.reviewed_content;
              const href = eventHref(e);
              const body = (
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl bg-white border border-on-surface/5 flex items-center justify-center ${meta.color}`}>
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {meta.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-on-surface leading-snug">
                      {eventText(e)}
                    </p>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">
                      {formatWhen(e.createdAt)}
                    </p>
                  </div>
                </div>
              );
              return (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl hover:bg-on-surface/[0.03] p-2 -mx-2"
                >
                  {href ? <Link href={href}>{body}</Link> : body}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </aside>
  );
}
