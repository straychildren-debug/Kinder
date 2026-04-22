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
import type { ActivityEvent, AwardType, User, ContentItem, ActivityType } from '@/lib/types';
import PublicProfileModal from './PublicProfileModal';
import ContentDetailsModal from './ContentDetailsModal';

const TYPE_CONFIG: Record<ActivityType, { label: string; icon: string; color: string }> = {
  reviewed_content: { label: 'оценил(а)', icon: 'rate_review', color: 'text-amber-400' },
  published_content: { label: 'опубликовал(а)', icon: 'auto_stories', color: 'text-emerald-400' },
  joined_club: { label: 'вступил(а) в', icon: 'groups', color: 'text-violet-400' },
  completed_marathon: { label: 'завершил(а)', icon: 'rocket_launch', color: 'text-orange-400' },
  earned_award: { label: 'получил(а)', icon: 'workspace_premium', color: 'text-pink-400' },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'сейчас';
  if (diff < 3600) return `${Math.floor(diff / 60)}м`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ч`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// Помощник для определения "Онлайн/Оффлайн" (имитация для демо)
function getStatus(userId: string) {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return hash % 3 === 0 ? 'online' : 'offline';
}

export default function ActivityFeed({ limit = 5 }: { limit?: number }) {
  const router = useRouter();
  const [items, setItems] = useState<ActivityEvent[] | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    getGlobalActivity(limit)
      .then((list) => {
        if (alive) {
          setItems(list || []);
          // Предзагрузка изображений для контента
          list?.forEach(async (e) => {
            if (e.refId && (e.type === 'reviewed_content' || e.type === 'published_content')) {
              const c = await getContentById(e.refId);
              if (c?.imageUrl) {
                setImages(prev => ({ ...prev, [e.refId!]: c.imageUrl }));
              }
            }
          });
        }
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

  return (
    <aside className="relative bg-surface-container-low/20 backdrop-blur-[40px] p-6 sm:p-8 rounded-[48px] border border-white/5 shadow-2xl overflow-hidden transition-all duration-700">
      {/* Cinematic Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full animate-pulse-slow" />
      </div>

      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h3 className="text-2xl font-black text-white uppercase leading-none flex items-center gap-3">
            <span className="material-symbols-rounded text-primary text-3xl">Auto_Awesome</span>
            Лента Kinder
          </h3>
          <div className="flex items-center gap-2 mt-2 ml-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 whitespace-nowrap">
              Прямой эфир
            </span>
          </div>
        </div>
      </div>

      {items === null ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-[32px] bg-white/[0.03] border border-white/[0.05] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 flex flex-col items-center opacity-30 text-center">
          <span className="material-symbols-rounded text-6xl mb-4 bg-gradient-to-br from-white to-white/20 bg-clip-text text-transparent">Explore</span>
          <p className="text-[12px] font-black uppercase tracking-[.3em]">
            Здесь пока пусто
          </p>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          <AnimatePresence initial={false}>
            {items.map((e) => {
              const config = TYPE_CONFIG[e.type] || TYPE_CONFIG.reviewed_content;
              const status = getStatus(e.userId);
              const p = e.payload || {};
              const contentTitle = (p.title as string) || 'контент';
              const rating = p.rating as number;

              return (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="group relative rounded-[32px] bg-white/[0.02] hover:bg-white/[0.05] p-4 border border-white/[0.03] hover:border-white/[0.08] transition-all duration-500"
                >
                  {/* Item Header */}
                  <div className="flex items-start gap-3 mb-4">
                    {/* Avatar Group */}
                    <div className="relative shrink-0">
                      <button 
                        onClick={() => openUser(e.userId)}
                        className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-surface-container-high transition-transform group-hover:scale-105"
                      >
                        {e.userAvatar ? (
                          <img src={e.userAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/40">
                            <span className="material-symbols-rounded text-xl">person</span>
                          </div>
                        )}
                      </button>
                    </div>
                    
                    {/* Name & Action Content */}
                    <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                      <button 
                        onClick={() => openUser(e.userId)}
                        className="text-sm font-bold text-white hover:text-primary transition-colors text-left line-clamp-2 leading-tight mb-1"
                      >
                        {e.userName || 'Участник'}
                      </button>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${config.color} leading-tight`}>
                        {config.label} {e.type === 'earned_award' ? '' : '«' + contentTitle + '»'}
                      </span>
                    </div>

                    {/* Time & Status Dot */}
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <span className="text-[10px] text-white/40 font-medium">
                        {formatWhen(e.createdAt)}
                      </span>
                      <div 
                        className={`w-2 h-2 rounded-full shadow-sm transition-colors duration-500 ${status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500/50 shadow-[0_0_8px_#ef4444]'}`} 
                        title={status === 'online' ? 'Онлайн' : 'Оффлайн'}
                      />
                    </div>
                  </div>

                  {/* Item Body */}
                  <div 
                    className="flex gap-4 cursor-pointer"
                    onClick={() => e.refId && (e.type === 'reviewed_content' || e.type === 'published_content') ? openContent(e.refId) : null}
                  >
                    {/* Square Thumbnail */}
                    {(e.type === 'reviewed_content' || e.type === 'published_content') && e.refId && (
                      <div className="flex-shrink-0 w-24 h-24 rounded-2xl border border-white/5 overflow-hidden shadow-xl bg-white/5 group-hover:border-white/10 transition-colors">
                        {images[e.refId] ? (
                          <img src={images[e.refId]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-rounded text-white/10 text-3xl">image</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Content text */}
                    <div className="flex-1 flex flex-col justify-center gap-2">
                       {/* Rating stars if review */}
                       {e.type === 'reviewed_content' && rating && (
                         <div className="flex gap-0.5">
                           {[...Array(5)].map((_, i) => (
                             <span 
                               key={i} 
                               className={`material-symbols-rounded text-xs ${i < Math.round(rating/2) ? 'text-amber-400' : 'text-white/10'}`}
                               style={{ fontVariationSettings: "'FILL' 1" }}
                             >
                               star
                             </span>
                           ))}
                         </div>
                       )}

                       {/* Snippet text */}
                       <p className="text-sm text-white/70 line-clamp-3 leading-relaxed font-medium">
                         {p.text as string || (e.type === 'earned_award' ? AWARD_META[p.type as AwardType]?.title : '') || 'Интересное событие в нашем сообществе...'}
                       </p>

                       {/* Stats info label with Icons */}
                       <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1.5 text-white/20 group-hover:text-white/40 transition-colors">
                            <span className="material-symbols-rounded text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {(p.likesCount as number) || Math.floor(Math.random() * 20)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/20 group-hover:text-white/40 transition-colors">
                            <span className="material-symbols-rounded text-[14px]">chat_bubble</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {(p.commentCount as number) || Math.floor(Math.random() * 5)}
                            </span>
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
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
