'use client';

import React, { useEffect, useMemo, useState } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { ContentItem } from '@/lib/types';
import { defaultBlurDataURL } from '@/lib/image-blur';
import {
  getSwipeableContent,
  recordSwipe,
  undoLastSwipe,
  getSwipeCounts,
  SwipeDirection,
} from '@/lib/swipes';
import { addToWishlist } from '@/lib/wishlist';
import { formatAuthor } from '@/lib/format';
import ContentDetailsModal from '@/components/ContentDetailsModal';

const SWIPE_THRESHOLD = 110;
const ROTATION_LIMIT = 14;

interface StackCardProps {
  item: ContentItem;
  onSwipe: (direction: SwipeDirection) => void;
  onBookmark: (item: ContentItem) => void;
  onRewind: () => void;
  canRewind: boolean;
  onInfo: (item: ContentItem) => void;
  isTop: boolean;
  depth: number;
}

function StackCard({ 
  item, 
  onSwipe, 
  onBookmark, 
  onRewind,
  canRewind,
  onInfo, 
  isTop, 
  depth 
}: StackCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-ROTATION_LIMIT, 0, ROTATION_LIMIT]);
  const likeOpacity = useTransform(x, [0, 120], [0, 1]);
  const skipOpacity = useTransform(x, [-120, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) onSwipe('like');
    else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe('skip');
  };

  const stackedStyle = useMemo(() => {
    if (depth === 0) return { scale: 1, translateY: 0, opacity: 1 };
    if (depth === 1) return { scale: 0.96, translateY: 10, opacity: 0.9 };
    return { scale: 0.92, translateY: 20, opacity: 0.6 };
  }, [depth]);

  return (
    <motion.div
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      style={isTop ? { x, rotate, zIndex: 10 - depth } : { zIndex: 10 - depth }}
      initial={{ scale: stackedStyle.scale, y: stackedStyle.translateY, opacity: 0 }}
      animate={{ scale: stackedStyle.scale, y: stackedStyle.translateY, opacity: stackedStyle.opacity }}
      exit={{ x: x.get() > 0 ? 500 : -500, opacity: 0, transition: { duration: 0.3 } }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className={`absolute inset-0 ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
      onClick={() => isTop && onInfo(item)}
    >
      <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-[#0A0A0A] border border-white/5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.4)] select-none">
        {/* Poster */}
        <div className="relative w-full h-full">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              placeholder="blur"
              blurDataURL={defaultBlurDataURL}
              className={`object-cover transition-transform duration-1000 ${isTop ? 'group-hover:scale-105' : ''}`}
              priority={isTop}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container">
              <span className="material-symbols-outlined text-6xl text-on-surface-muted/30">
                {item.type === 'movie' ? 'movie' : 'menu_book'}
              </span>
            </div>
          )}

          {/* Cinematic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-90 pointer-events-none" />

          {/* Top Actions & Metadata (Aligned with bottom grid: 32px/8px) */}
          {isTop && (
            <div className="absolute top-8 inset-x-8 flex justify-between items-start z-20 pointer-events-none">
              {/* Left Group: Undo + Badge */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Rewind (Back) Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRewind();
                  }}
                  disabled={!canRewind}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-3xl border border-white/10 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-0 disabled:pointer-events-none hover:bg-white/20"
                  aria-label="Вернуть назад"
                >
                  <span className="material-symbols-rounded text-[20px]">undo</span>
                </button>

                {/* Type Chip (Sleek Inline) */}
                <div className="h-10 px-3 rounded-xl bg-white/10 backdrop-blur-3xl border border-white/10 flex items-center gap-1.5 shadow-sm">
                  <span className="material-symbols-rounded text-white/80 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {item.type === 'movie' ? 'movie' : 'menu_book'}
                  </span>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                    {item.type === 'movie' ? 'Кино' : 'Книга'}
                  </span>
                </div>
              </div>

              {/* Right Group: Bookmark */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark(item);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-3xl border border-white/10 text-white flex items-center justify-center shadow-xl active:scale-90 transition-all hover:bg-white/20 group/bookmark pointer-events-auto"
                aria-label="Хочу прочитать"
              >
                <span className="material-symbols-rounded text-[20px] group-hover/bookmark:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
              </button>
            </div>
          )}

          {/* Rating Badge (Repositioned to match 32px block) */}
          {isTop && item.rating && (
            <div className="absolute top-[88px] right-8 px-2.5 py-1.5 rounded-xl bg-white/15 backdrop-blur-3xl border border-white/10 flex items-center gap-1.5 shadow-sm z-10">
              <span className="material-symbols-rounded text-amber-400 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-[11px] font-black text-white leading-none">{item.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Swipe Labels (STAMPS style in center) */}
          {isTop && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <motion.div
                style={{ opacity: likeOpacity, scale: useTransform(x, [0, 150], [0.8, 1]) }}
                className="px-8 py-4 rounded-3xl border-4 border-emerald-400 bg-emerald-500/10 backdrop-blur-md -rotate-12 shadow-[0_0_40px_rgba(52,211,153,0.2)]"
              >
                <span className="text-emerald-400 text-3xl font-black uppercase tracking-[0.2em]">КЛАСС!</span>
              </motion.div>
              <motion.div
                style={{ opacity: skipOpacity, scale: useTransform(x, [0, -150], [0.8, 1]) }}
                className="absolute px-8 py-4 rounded-3xl border-4 border-rose-400 bg-rose-500/10 backdrop-blur-md rotate-12 shadow-[0_0_40px_rgba(251,113,133,0.2)]"
              >
                <span className="text-rose-400 text-3xl font-black uppercase tracking-[0.2em]">НЕ МОЁ</span>
              </motion.div>
            </div>
          )}

          {/* Integrated Text Content */}
          <div className="absolute inset-x-0 bottom-0 p-8 pt-24 text-white z-10 transition-transform duration-700" style={{ transform: isTop ? 'translateY(0)' : 'translateY(10px)' }}>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-2 leading-none">
              {formatAuthor(item.author || item.director || 'Автор не указан')}
              {item.year ? ` · ${item.year}` : ''}
            </p>
            <h3 className="text-2xl font-black leading-tight tracking-tight line-clamp-2 max-w-[90%] mb-3">
              {item.title}
            </h3>
            <div className="flex items-center gap-2 text-white/30 group cursor-pointer" onClick={(e) => { e.stopPropagation(); onInfo(item); }}>
              <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-white transition-colors">Об издании</span>
              <span className="material-symbols-rounded text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function DiscoverPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<ContentItem[]>([]);
  const [history, setHistory] = useState<Array<{ item: ContentItem; direction: SwipeDirection | 'bookmark' | 'skip_neutral' }>>([]);
  const [counts, setCounts] = useState({ like: 0, skip: 0, seen: 0 });
  const [loading, setLoading] = useState(true);
  const [openedInfo, setOpenedInfo] = useState<ContentItem | null>(null);
  const [exhausted, setExhausted] = useState(false);

  const loadQueue = async () => {
    if (!user) return;
    setLoading(true);
    const [items, c] = await Promise.all([
      getSwipeableContent(user.id, 30),
      getSwipeCounts(user.id),
    ]);
    setQueue(items);
    setCounts(c);
    setExhausted(items.length === 0);
    setLoading(false);
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) loadQueue();
  }, [user, isLoading]);

  const handleSwipe = async (direction: SwipeDirection) => {
    if (!user || queue.length === 0) return;
    const [current, ...rest] = queue;

    // Optimistic UI
    setQueue(rest);
    setHistory((h) => [...h, { item: current, direction }]);
    setCounts((c) => ({ ...c, [direction]: c[direction] + 1 }));

    try {
      await recordSwipe(user.id, current.id, direction);
      // No automatic wishlist on simple 'like' anymore, as per user's request:
      // "Нравится - не обязательно хочу прочитать"
    } catch (e) {
      console.error(e);
    }

    if (rest.length === 0) {
      const more = await getSwipeableContent(user.id, 30);
      if (more.length > 0) setQueue(more);
      else setExhausted(true);
    }
  };

  const handleBookmarkAction = async (item: ContentItem) => {
    if (!user || !item) return;
    
    // Optimistic UI
    setQueue(prev => prev.filter(it => it.id !== item.id));
    setHistory((h) => [...h, { item, direction: 'bookmark' }]);
    setCounts((c) => ({ ...c, seen: c.seen + 1 })); // Use 'seen' counter for Wishlist UI label

    try {
      await addToWishlist(user.id, item.id);
      await recordSwipe(user.id, item.id, 'like');
    } catch (e) {
      console.error(e);
    }
  };

  const handleNeutralSkip = () => {
    if (queue.length === 0) return;
    const [current, ...rest] = queue;
    setQueue(rest);
    setHistory((h) => [...h, { item: current, direction: 'skip_neutral' }]);
  };

  const handleRewind = async () => {
    if (!user || history.length === 0) return;
    const last = history[history.length - 1];
    
    if (last.direction !== 'skip_neutral') {
      try {
        await undoLastSwipe(user.id, last.item.id);
        if (last.direction === 'bookmark') {
          const { removeFromWishlist } = await import('@/lib/wishlist');
          await removeFromWishlist(user.id, last.item.id);
        }
      } catch (e) {
        console.error(e);
        return;
      }
    }

    setHistory((h) => h.slice(0, -1));
    setQueue((q) => [last.item, ...q]);
    
    // Update counters
    if (last.direction === 'bookmark') {
      setCounts((c) => ({ ...c, seen: Math.max(0, c.seen - 1) }));
    } else if (last.direction !== 'skip_neutral') {
      const dir = last.direction as SwipeDirection;
      setCounts((c) => ({ ...c, [dir]: Math.max(0, c[dir] - 1) }));
    }
    setExhausted(false);
  };

  const topCard = queue[0];

  if (isLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-on-surface/5 border-t-accent-lilac rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <TopNavBar title="Откройте для себя" showBack={true} backPath="/" />
      <main className="pt-20 pb-20 px-6 max-w-lg mx-auto flex flex-col min-h-screen">
        {/* Header with counters */}
        <section className="pt-4 pb-6">
          <span className="text-[10px] font-black text-on-surface-muted/50 mb-2 block uppercase tracking-[0.2em]">Личные рекомендации</span>
          <h1 className="text-3xl font-black tracking-tight leading-tight text-on-surface mb-6">
            Для вас
          </h1>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Нравится', value: counts.like, icon: 'favorite', color: 'text-emerald-500' },
              { label: 'Не моё', value: counts.skip, icon: 'close', color: 'text-rose-500' },
              { label: 'Виш-лист', value: counts.seen, icon: 'bookmark', color: 'text-amber-500' },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-1 bg-surface-container-low rounded-[1.5rem] p-3 border border-white/5 shadow-sm"
              >
                <span className={`material-symbols-rounded text-[20px] ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {s.icon}
                </span>
                <p className="text-sm font-black text-on-surface leading-tight">{s.value}</p>
                <p className="text-[9px] font-bold text-on-surface-muted/60 uppercase tracking-wider leading-none mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Card stack */}
        <section className="relative flex-1 w-full mx-auto max-w-sm max-h-[520px] aspect-[2/3] pt-2">
          {loading ? (
            <div className="absolute inset-0 rounded-[2.5rem] bg-surface-container-low animate-pulse" />
          ) : exhausted || queue.length === 0 ? (
            <div className="absolute inset-0 rounded-[2.5rem] bg-surface-container-low border border-on-surface/5 flex flex-col items-center justify-center text-center px-10">
              <div className="w-20 h-20 rounded-[2rem] bg-surface-container flex items-center justify-center mb-6 shadow-xl">
                <span className="material-symbols-rounded text-4xl text-on-surface-muted/40" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
              </div>
              <h2 className="text-xl font-black text-on-surface mb-3">Колода пуста</h2>
              <p className="text-sm text-on-surface-muted/80 font-medium leading-relaxed mb-8">
                Мы скоро найдем для вас что-нибудь новенькое. Загляните позже!
              </p>
              <button
                onClick={loadQueue}
                className="bg-on-surface text-surface px-8 py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg"
              >
                Обновить
              </button>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {queue.slice(0, 3).map((item, i) => (
                <StackCard
                  key={item.id}
                  item={item}
                  isTop={i === 0}
                  depth={i}
                  onSwipe={handleSwipe}
                  onBookmark={handleBookmarkAction}
                  onRewind={handleRewind}
                  canRewind={history.length > 0}
                  onInfo={setOpenedInfo}
                />
              ))}
            </AnimatePresence>
          )}
        </section>

        {/* Bottom Action Bar */}
        {!exhausted && queue.length > 0 && (
          <section className="mt-8 mb-4 h-20 flex items-center justify-center gap-6 relative max-w-sm mx-auto w-full px-8">
            {/* Neutral Skip (Left, glass) */}
            <button
              onClick={handleNeutralSkip}
              className="absolute left-8 w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/40 active:scale-90 transition-all hover:bg-white/10 group"
              aria-label="Пропустить"
            >
              <span className="material-symbols-rounded text-[24px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>

            {/* Center Pair (Dislike/Like) */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => handleSwipe('skip')}
                className="w-16 h-16 rounded-[1.8rem] bg-white/15 backdrop-blur-3xl border border-white/20 text-rose-500 flex items-center justify-center active:scale-90 transition-all shadow-[0_15px_30px_rgba(225,29,72,0.15)] hover:bg-white/20 group"
                aria-label="Не нравится"
              >
                <span className="material-symbols-rounded text-[34px] group-hover:scale-110 transition-transform">close</span>
              </button>

              <button
                onClick={() => handleSwipe('like')}
                className="w-16 h-16 rounded-[1.8rem] bg-white/15 backdrop-blur-3xl border border-white/20 text-emerald-500 flex items-center justify-center active:scale-90 transition-all shadow-[0_15px_30px_rgba(16,185,129,0.15)] hover:bg-white/20 group"
                aria-label="Нравится"
              >
                <span className="material-symbols-rounded text-[34px] group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </button>
            </div>
          </section>
        )}
      </main>

      {openedInfo && (
        <ContentDetailsModal content={openedInfo} onClose={() => setOpenedInfo(null)} />
      )}

      <BottomNavBar activeTab="home" />
    </>
  );
}
