'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getGlobalActivity,
  subscribeToActivity,
} from '@/lib/activity';
import { getUserById, getContentById } from '@/lib/db';
import { AWARD_META } from '@/lib/awards';
import type { ActivityEvent, AwardType, User, ContentItem } from '@/lib/types';
import PublicProfileModal from './PublicProfileModal';
import ContentDetailsModal from './ContentDetailsModal';

const TYPE_ICON: Record<string, { icon: string; color: string; glow: string; border: string }> = {
  reviewed_content: { icon: 'rate_review', color: 'text-amber-400', glow: 'bg-amber-400/10', border: 'border-amber-400/20' },
  published_content: { icon: 'auto_stories', color: 'text-emerald-400', glow: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  joined_club: { icon: 'groups', color: 'text-violet-400', glow: 'bg-violet-400/10', border: 'border-violet-400/20' },
  completed_marathon: { icon: 'rocket_launch', color: 'text-orange-400', glow: 'bg-orange-400/10', border: 'border-orange-400/20' },
  earned_award: { icon: 'workspace_premium', color: 'text-pink-400', glow: 'bg-pink-400/10', border: 'border-pink-400/20' },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'сейчас';
  if (diff < 3600) return `${Math.floor(diff / 60)}м назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ч назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function ActivityFeed({ limit = 5 }: { limit?: number }) {
  const router = useRouter();
  const [items, setItems] = useState<ActivityEvent[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    let alive = true;
    getGlobalActivity(limit)
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
        setItems((prev) => [e, ...(prev ?? [])].slice(0, limit));
      });
    } catch (err) {
      console.error('ActivityFeed subscription error:', err);
    }
    return () => {
      alive = false;
      unsub();
    };
  }, [limit]);

  async function openUser(userId: string) {
    const u = await getUserById(userId);
    if (u) setSelectedUser(u);
  }

  async function openContent(contentId: string) {
    const c = await getContentById(contentId);
    if (c) setSelectedContent(c);
  }

  function renderEventText(e: ActivityEvent): React.ReactNode {
    const name = e.userName || 'Участник';
    const p = e.payload || {};
    const nameBtn = (
      <button
        type="button"
        onClick={() => openUser(e.userId)}
        className="font-bold text-white hover:text-primary transition-colors inline-flex items-center gap-1"
      >
        {name}
      </button>
    );

    switch (e.type) {
      case 'reviewed_content': {
        const title = (p.title as string) || 'на контент';
        return (
          <>
            {nameBtn} <span className="opacity-60 mx-1">оставил(а) отзыв на</span>{' '}
            {e.refId ? (
              <button
                type="button"
                onClick={() => openContent(e.refId!)}
                className="font-bold text-white/90 hover:underline underline-offset-4 decoration-on-surface/40 italic"
              >
                «{title}»
              </button>
            ) : (
              <b className="italic">«{title}»</b>
            )}
          </>
        );
      }
      case 'published_content': {
        const title = (p.title as string) || 'новый контент';
        return (
          <>
            {nameBtn} <span className="opacity-60 mx-1">опубликовал(а)</span>{' '}
            {e.refId ? (
              <button
                type="button"
                onClick={() => openContent(e.refId!)}
                className="font-bold text-white/90 hover:underline underline-offset-4 decoration-on-surface/40 italic"
              >
                «{title}»
              </button>
            ) : (
              <b className="italic">«{title}»</b>
            )}
          </>
        );
      }
      case 'joined_club': {
        const club = (p.club_name as string) || 'клуб';
        return (
          <>
            {nameBtn} <span className="opacity-60 mx-1">вступил(а) в</span>{' '}
            {e.refId ? (
              <button
                type="button"
                onClick={() => router.push(`/clubs/${e.refId}`)}
                className="font-bold text-white/90 hover:underline underline-offset-4 decoration-on-surface/40 italic"
              >
                «{club}»
              </button>
            ) : (
              <b className="italic">«{club}»</b>
            )}
          </>
        );
      }
      case 'completed_marathon': {
        const title = (p.title as string) || 'марафон';
        return (
          <>
            {nameBtn} <span className="opacity-60 mx-1">завершил(а) марафон</span> <b className="italic text-white">«{title}»</b>
          </>
        );
      }
      case 'earned_award': {
        const type = (p.type as AwardType) || 'first_review';
        const meta = AWARD_META[type];
        return (
          <>
            {nameBtn} <span className="opacity-60 mx-1">получил(а) награду</span>{' '}
            <b className="text-amber-400">«{meta?.title || 'Достижение'}»</b>
          </>
        );
      }
      default:
        return nameBtn;
    }
  }

  return (
    <aside className="relative group bg-surface/40 backdrop-blur-3xl p-8 rounded-[40px] border border-on-surface/10 shadow-2xl overflow-hidden transition-all duration-700">
      {/* Background Glow Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full -ml-32 -mb-32 animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
            Лента сообщества
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 whitespace-nowrap">
              Прямой эфир
            </span>
          </div>
        </div>
      </div>

      {items === null ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-[24px] bg-white/[0.03] border border-white/[0.05] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 flex flex-col items-center opacity-30">
          <span className="material-symbols-outlined text-4xl mb-3">auto_awesome</span>
          <p className="text-[10px] font-black uppercase tracking-widest">
            Здесь будет ваша история
          </p>
        </div>
      ) : (
        <ul className="space-y-4 relative z-10">
          <AnimatePresence initial={false}>
            {items.map((e) => {
              const meta = TYPE_ICON[e.type] || TYPE_ICON.reviewed_content;
              return (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                  className="group/item relative rounded-[24px] bg-white/[0.02] hover:bg-white/[0.05] p-3 border border-white/[0.03] hover:border-white/[0.08] transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon with Glow */}
                    <div className={`flex-shrink-0 w-11 h-11 rounded-2xl ${meta.glow} border ${meta.border} flex items-center justify-center ${meta.color} transition-transform duration-500 group-hover/item:rotate-[10deg] group-hover/item:scale-110`}>
                      <span
                        className="material-symbols-rounded text-[20px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {meta.icon}
                      </span>
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-on-surface-variant leading-relaxed">
                        {renderEventText(e)}
                      </div>
                      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.1em] text-white/20 group-hover/item:text-white/40 transition-colors">
                        {formatWhen(e.createdAt)}
                      </p>
                    </div>
                    {/* Hover Glow Line */}
                    <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-full ${meta.color.replace('text-', 'bg-')} opacity-0 group-hover/item:opacity-100 transition-opacity blur-[2px] shadow-lg`} />
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {selectedUser && (
        <PublicProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onOpenContent={(c) => {
            setSelectedUser(null);
            setSelectedContent(c);
          }}
        />
      )}

      {selectedContent && (
        <ContentDetailsModal
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
        />
      )}
    </aside>
  );
}
