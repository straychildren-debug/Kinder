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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {items.map((w, i) => {
        const c = w.content;
        if (!c) return null;
        return (
          <motion.button
            key={w.id}
            onClick={() => onOpenContent?.(c)}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-on-surface/5 text-left"
          >
            {c.imageUrl ? (
              <Image
                src={c.imageUrl}
                alt={c.title}
                fill
                sizes="(min-width: 768px) 20vw, 50vw"
                placeholder="blur"
                blurDataURL={defaultBlurDataURL}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl">
                  {c.type === 'movie' ? 'movie' : 'auto_stories'}
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
              <p className="text-white text-xs font-black tracking-tight line-clamp-2 leading-snug">
                {c.title}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
