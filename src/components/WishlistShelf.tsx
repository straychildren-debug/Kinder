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
    <div className="grid grid-cols-3 md:grid-cols-6 gap-x-3 gap-y-8">
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
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-surface-container border border-on-surface/5 shadow-sm group-hover:shadow-xl transition-all duration-500">
              {c.imageUrl ? (
                <Image
                  src={c.imageUrl}
                  alt={c.title}
                  fill
                  sizes="200px"
                  placeholder="blur"
                  blurDataURL={defaultBlurDataURL}
                  className="object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-20 text-on-surface">
                  <span className="material-symbols-outlined text-3xl">
                    {c.type === 'movie' ? 'movie' : 'menu_book'}
                  </span>
                </div>
              )}

              <div className="absolute top-2 right-2">
                 <div className="bg-white/80 backdrop-blur-md w-6 h-6 rounded-lg flex items-center justify-center border border-white shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[12px] text-on-surface">
                      {c.type === 'movie' ? 'movie' : 'menu_book'}
                    </span>
                 </div>
              </div>
            </div>

            <div className="mt-3 px-1">
              <h4 className="text-[11px] font-black leading-tight tracking-tight line-clamp-2 min-h-[1.8rem] text-on-surface group-hover:text-accent-lilac transition-colors">
                {c.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                 <span className="text-[8px] font-black text-on-surface-muted uppercase tracking-widest truncate">
                    {c.type === 'movie' ? 'Кино' : 'Книга'}
                 </span>
                 {c.rating && (
                   <>
                     <span className="w-1 h-1 rounded-full bg-on-surface/10" />
                     <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px] text-accent-lilac" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="text-[10px] font-black">{c.rating.toFixed(1)}</span>
                     </div>
                   </>
                 )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
