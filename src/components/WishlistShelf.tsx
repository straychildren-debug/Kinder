'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getWishlist } from '@/lib/wishlist';
import type { WishlistItem, ContentItem } from '@/lib/types';
import { defaultBlurDataURL } from '@/lib/image-blur';

export default function WishlistShelf({
  userId,
  onOpenContent,
}: {
  userId: string;
  onOpenContent?: (c: ContentItem) => void;
}) {
  const [items, setItems] = useState<WishlistItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    getWishlist(userId).then((list) => {
      if (alive) setItems(list);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  if (items === null) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-on-surface/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-surface-container-low border border-dashed border-on-surface/10 rounded-[32px] p-10 text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface/10">
          bookmark
        </span>
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
          Список пуст — добавляйте интересное на будущее
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-10 sm:gap-x-5 sm:gap-y-12">
      {items.map((w, i) => {
        const c = w.content;
        if (!c) return null;
        return (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="group cursor-pointer flex flex-col"
            onClick={() => onOpenContent?.(c)}
          >
            {/* Poster Container with 2/3 Aspect Ratio (Library Style) */}
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface-container-low/50 border border-on-surface/[0.03] shadow-[0_4px_12px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-300">
              {/* Rating Label (Top Right) */}
              {c.rating && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 z-10">
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1", fontSize: '10px' }}>star</span>
                  <span className="text-[10px] font-black text-white">{c.rating.toFixed(1)}</span>
                </div>
              )}

              {c.imageUrl ? (
                <Image
                  src={c.imageUrl}
                  alt={c.title}
                  fill
                  sizes="200px"
                  placeholder="blur"
                  blurDataURL={defaultBlurDataURL}
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-20 text-on-surface">
                  <span className="material-symbols-outlined text-3xl">
                    {c.type === 'movie' ? 'movie' : 'menu_book'}
                  </span>
                </div>
              )}
            </div>

            {/* Simple Metadata (Library Style) */}
            <div className="mt-2.5 px-0.5 flex flex-col">
              <h4 className="text-[11px] font-bold text-on-surface leading-tight line-clamp-2 tracking-tight mb-1 group-hover:text-primary transition-colors">
                {c.title}
              </h4>
              <p className="text-[10px] font-medium text-on-surface-variant/80 truncate tracking-tight">
                {(c as any).author || (c as any).director || (c.type === 'movie' ? 'Режиссер' : 'Автор')}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
