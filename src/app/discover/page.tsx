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
  onInfo: (item: ContentItem) => void;
  isTop: boolean;
  depth: number;
}

function StackCard({ item, onSwipe, onInfo, isTop, depth }: StackCardProps) {
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
    if (depth === 1) return { scale: 0.96, translateY: 12, opacity: 0.75 };
    return { scale: 0.92, translateY: 24, opacity: 0.4 };
  }, [depth]);

  return (
    <motion.div
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      style={isTop ? { x, rotate } : undefined}
      initial={{ scale: stackedStyle.scale, y: stackedStyle.translateY, opacity: 0 }}
      animate={{ scale: stackedStyle.scale, y: stackedStyle.translateY, opacity: stackedStyle.opacity }}
      exit={{ x: x.get() > 0 ? 500 : -500, opacity: 0, transition: { duration: 0.3 } }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className={`absolute inset-0 ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-surface border border-on-surface/5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] select-none">
        {/* Poster */}
        <div className="relative w-full h-full bg-surface-container">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              placeholder="blur"
              blurDataURL={defaultBlurDataURL}
              className="object-cover pointer-events-none"
              priority={isTop}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-on-surface-muted/30">
                {item.type === 'movie' ? 'movie' : 'menu_book'}
              </span>
            </div>
          )}

          {/* Dark gradient at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

          {/* Type chip */}
          <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-black/55 backdrop-blur-md flex items-center gap-1.5">
            <span
              className="material-symbols-outlined text-white text-[13px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {item.type === 'movie' ? 'movie' : 'menu_book'}
            </span>
            <span className="text-[11px] font-semibold text-white leading-none tracking-tight">
              {item.type === 'movie' ? 'Кино' : 'Книга'}
            </span>
          </div>

          {/* Info button */}
          {isTop && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfo(item);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
              aria-label="Подробнее"
            >
              <span className="material-symbols-outlined text-[18px]">info</span>
            </button>
          )}

          {/* Rating Badge */}
          {item.rating && (
            <div 
              className={`absolute right-4 px-2 py-1 rounded-xl bg-black/60 backdrop-blur-md flex items-center gap-1.5 z-10 border border-white/10 shadow-lg ${isTop ? 'top-[60px]' : 'top-4'}`}
            >
              <span className="material-symbols-rounded text-amber-400" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-sm font-black text-white leading-none">{item.rating.toFixed(1)}</span>
            </div>
          )}

          {/* Swipe labels */}
          {isTop && (
            <>
              <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute top-10 left-6 px-3 py-1.5 rounded-lg border-2 border-emerald-400 bg-emerald-500/10 backdrop-blur-sm -rotate-12"
              >
                <span className="text-emerald-400 text-sm font-bold tracking-wide">ИНТЕРЕСНО</span>
              </motion.div>
              <motion.div
                style={{ opacity: skipOpacity }}
                className="absolute top-10 right-6 px-3 py-1.5 rounded-lg border-2 border-rose-400 bg-rose-500/10 backdrop-blur-sm rotate-12"
              >
                <span className="text-rose-400 text-sm font-bold tracking-wide">НЕ МОЁ</span>
              </motion.div>
            </>
          )}

          {/* Metadata */}
          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <h3 className="text-xl font-bold leading-tight tracking-tight line-clamp-2 mb-1.5">
              {item.title}
            </h3>
            <p className="text-sm font-medium text-white/80 line-clamp-1">
              {formatAuthor(item.author || item.director || 'Автор не указан')}
              {item.year ? ` · ${item.year}` : ''}
            </p>

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
  const [history, setHistory] = useState<Array<{ item: ContentItem; direction: SwipeDirection }>>([]);
  const [counts, setCounts] = useState({ like: 0, skip: 0, seen: 0 });
  const [loading, setLoading] = useState(true);
  const [openedInfo, setOpenedInfo] = useState<ContentItem | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const [seenModalItem, setSeenModalItem] = useState<ContentItem | null>(null);

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
      if (direction === 'like') {
        // Silent add to wishlist; ignore "already exists" noise.
        addToWishlist(user.id, current.id).catch(() => {});
      }
    } catch (e) {
      console.error(e);
    }

    if (rest.length === 0) {
      // Try to fetch more; if still empty we mark exhausted.
      const more = await getSwipeableContent(user.id, 30);
      if (more.length > 0) setQueue(more);
      else setExhausted(true);
    }
  };

  const handleSeen = () => {
    if (queue.length === 0) return;
    setSeenModalItem(queue[0]);
  };

  const handleRewind = async () => {
    if (!user || history.length === 0) return;
    const last = history[history.length - 1];
    try {
      await undoLastSwipe(user.id, last.item.id);
    } catch (e) {
      console.error(e);
      return;
    }
    setHistory((h) => h.slice(0, -1));
    setQueue((q) => [last.item, ...q]);
    setCounts((c) => ({ ...c, [last.direction]: Math.max(0, c[last.direction] - 1) }));
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
      <main className="pt-20 pb-32 px-6 max-w-lg mx-auto">
        {/* Header with counters */}
        <section className="pt-4 pb-6">
          <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Свайпните, чтобы найти своё</span>
          <h1 className="text-2xl font-bold tracking-tight leading-tight text-on-surface">
            Откройте для себя
          </h1>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { label: 'Интересно', value: counts.like, icon: 'favorite' },
              { label: 'Не моё', value: counts.skip, icon: 'close' },
              { label: 'Уже знаю', value: counts.seen, icon: 'check' },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2 border border-on-surface/5"
              >
                <span className="material-symbols-outlined text-[16px] text-on-surface-muted">{s.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-on-surface-muted leading-tight truncate">{s.label}</p>
                  <p className="text-sm font-semibold text-on-surface leading-tight">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Card stack */}
        <section className="relative mx-auto w-full aspect-[3/4] max-w-sm">
          {loading ? (
            <div className="absolute inset-0 rounded-3xl bg-surface-container-low animate-pulse" />
          ) : exhausted || queue.length === 0 ? (
            <div className="absolute inset-0 rounded-3xl bg-surface border border-on-surface/5 flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-5">
                <span
                  className="material-symbols-outlined text-[28px] text-on-surface-muted"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
              </div>
              <h2 className="text-lg font-semibold text-on-surface mb-2">Вы всё пересмотрели</h2>
              <p className="text-sm text-on-surface-muted font-medium leading-relaxed mb-6 max-w-xs">
                Новые публикации появляются регулярно. Загляните позже или обновите колоду.
              </p>
              <button
                onClick={loadQueue}
                className="bg-on-surface text-surface px-5 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
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
                  onInfo={setOpenedInfo}
                />
              ))}
            </AnimatePresence>
          )}
        </section>

        {/* Action buttons */}
        {!exhausted && queue.length > 0 && (
          <section className="mt-8 flex items-center justify-center gap-5">
            <button
              onClick={handleRewind}
              disabled={history.length === 0}
              className="w-12 h-12 rounded-full bg-surface border border-on-surface/10 flex items-center justify-center text-on-surface-muted active:scale-90 transition-transform disabled:opacity-30 disabled:active:scale-100 shadow-sm"
              aria-label="Вернуть последнюю карточку"
            >
              <span className="material-symbols-outlined text-[22px]">undo</span>
            </button>
            <button
              onClick={() => handleSwipe('skip')}
              className="w-14 h-14 rounded-full bg-surface border border-on-surface/10 flex items-center justify-center text-rose-500 active:scale-90 transition-transform shadow-sm hover:border-rose-200"
              aria-label="Не моё"
            >
              <span className="material-symbols-outlined text-[26px]">close</span>
            </button>
            <button
              onClick={handleSeen}
              className="w-12 h-12 rounded-full bg-surface border border-on-surface/10 flex items-center justify-center text-on-surface active:scale-90 transition-transform shadow-sm"
              aria-label="Уже знаю"
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check
              </span>
            </button>
            <button
              onClick={() => handleSwipe('like')}
              className="w-14 h-14 rounded-full bg-on-surface text-surface flex items-center justify-center active:scale-90 transition-transform shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
              aria-label="Интересно"
            >
              <span
                className="material-symbols-outlined text-[26px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
            </button>
          </section>
        )}

        {/* Hint */}
        {!exhausted && queue.length > 0 && (
          <p className="mt-5 text-center text-xs font-medium text-on-surface-muted">
            Свайпните вправо, если интересно, или влево — если не ваше
          </p>
        )}
      </main>

      {openedInfo && (
        <ContentDetailsModal content={openedInfo} onClose={() => setOpenedInfo(null)} />
      )}

      {/* Seen modal: pick a rating and remove from queue */}
      {seenModalItem && (
        <SeenRatingModal
          item={seenModalItem}
          onCancel={() => setSeenModalItem(null)}
          onConfirm={async (rating) => {
            if (!user) return;
            try {
              await recordSwipe(user.id, seenModalItem.id, 'seen');
              if (rating > 0) {
                const { submitReview } = await import('@/lib/db');
                await submitReview(seenModalItem.id, user.id, '', rating);
              }
            } catch (e) {
              console.error(e);
            }
            const current = seenModalItem;
            setSeenModalItem(null);
            setQueue((q) => q.filter((it) => it.id !== current.id));
            setCounts((c) => ({ ...c, seen: c.seen + 1 }));
            setHistory((h) => [...h, { item: current, direction: 'seen' }]);
          }}
        />
      )}

      <BottomNavBar activeTab="home" />
    </>
  );
}

function SeenRatingModal({
  item,
  onCancel,
  onConfirm,
}: {
  item: ContentItem;
  onCancel: () => void;
  onConfirm: (rating: number) => void;
}) {
  const [rating, setRating] = useState(0);
  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-surface rounded-3xl p-6 border border-on-surface/5 animate-in slide-in-from-bottom-4 duration-300">
        <h3 className="text-base font-semibold text-on-surface mb-1">Уже знакомо?</h3>
        <p className="text-sm text-on-surface-muted font-medium mb-5 line-clamp-2">{item.title}</p>
        <p className="text-xs font-medium text-on-surface-muted mb-2">Оцените (необязательно)</p>
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star === rating ? 0 : star)}
              className="transition-transform hover:scale-110"
            >
              <span
                className={`material-symbols-outlined text-2xl ${star <= rating ? 'text-amber-500' : 'text-on-surface-variant/20'}`}
                style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}
              >
                star
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => onConfirm(rating)}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-on-surface text-surface active:scale-95 transition-transform"
          >
            Отметить
          </button>
        </div>
      </div>
    </div>
  );
}
