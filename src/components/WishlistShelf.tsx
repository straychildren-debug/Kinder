'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getWishlist } from '@/lib/wishlist';
import type { WishlistItem, ContentItem } from '@/lib/types';
import { defaultBlurDataURL } from '@/lib/image-blur';
import { formatAuthor } from '@/lib/format';

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
    <div className="grid grid-cols-3 gap-x-1 gap-y-4 sm:gap-x-3 sm:gap-y-6">
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
            {/* Card with Backing (Library Style) */}
            <div className="w-full bg-white p-1 pb-2.5 rounded-[12px] border border-on-surface/[0.03] shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all duration-500">
              {/* Poster Container with 2/3 Aspect Ratio */}
              <div className="relative aspect-[2/3] rounded-[8px] overflow-hidden bg-surface-container-low/50 border border-on-surface/[0.03]">
                {/* Year Badge */}
                {c.year && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md flex items-center gap-1 z-20 border border-white/10">
                    <span className="material-symbols-rounded text-white" style={{ fontSize: '11px', fontVariationSettings: "'FILL' 1" }}>event</span>
                    <span className="text-[10px] font-bold text-white leading-none">{c.year}</span>
                  </div>
                )}

                {/* Badge Overlay */}
                <div className="absolute top-1.5 right-1.5 z-20">
                  {c.rating && (
                    <div className="px-1.5 py-0.5 rounded-md bg-amber-400 backdrop-blur-md flex items-center gap-1 border border-amber-500/20 shadow-lg shadow-amber-500/20 animate-in fade-in zoom-in duration-500">
                      <span className="material-symbols-rounded text-amber-950" style={{ fontVariationSettings: "'FILL' 1", fontSize: '9px' }}>star</span>
                      <span className="text-[9px] font-black text-amber-950 leading-none">{c.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt={c.title}
                    fill
                    sizes="200px"
                    placeholder="blur"
                    blurDataURL={defaultBlurDataURL}
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20 text-on-surface">
                    <span className="material-symbols-outlined text-3xl">
                      {c.type === 'movie' ? 'movie' : 'menu_book'}
                    </span>
                  </div>
                )}

                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 pt-10 pb-2 px-2 bg-gradient-to-t from-black via-black/40 to-transparent z-10 transition-transform">
                  <h4 className="text-[10px] font-bold text-white leading-tight line-clamp-2 tracking-tight">
                    {c.title}
                  </h4>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
