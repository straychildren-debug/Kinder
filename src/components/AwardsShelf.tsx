'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AWARD_META, getAwardsForUser } from '@/lib/awards';
import type { Award } from '@/lib/types';

export default function AwardsShelf({ userId }: { userId: string }) {
  const [awards, setAwards] = useState<Award[] | null>(null);

  useEffect(() => {
    let alive = true;
    getAwardsForUser(userId).then((a) => {
      if (alive) setAwards(a);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  if (awards === null) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-on-surface/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (awards.length === 0) {
    return (
      <div className="bg-surface-container-low border border-dashed border-on-surface/10 rounded-[32px] p-10 text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface/10">
          workspace_premium
        </span>
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
          Пока без наград — но первая уже близко
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
      {awards.map((a, i) => {
        const meta = AWARD_META[a.type];
        if (!meta) return null;
        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: i * 0.04,
              type: 'spring',
              stiffness: 320,
              damping: 22,
            }}
            className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-3 border ${meta.tone} group`}
            title={`${meta.title} · ${meta.description}`}
          >
            <span
              className="material-symbols-outlined text-[34px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {meta.icon}
            </span>
            <span className="mt-2 text-[9px] font-black uppercase tracking-widest text-center leading-tight">
              {meta.title}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
