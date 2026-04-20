'use client';

import React, { useEffect, useState } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { defaultBlurDataURL } from '@/lib/image-blur';
import { getActiveDuels } from '@/lib/duels';
import type { Duel } from '@/lib/types';

export default function DuelsPage() {
  const { user } = useAuth();
  const [duels, setDuels] = useState<Duel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await getActiveDuels(user?.id, 30);
      setDuels(list);
      setLoading(false);
    })();
  }, [user]);

  return (
    <>
      <TopNavBar title="Арена мнений" showBack={true} backPath="/" />
      <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
        <section className="pb-8">
          <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Дебаты критиков</span>
          <h1 className="text-2xl font-bold tracking-tight leading-tight text-on-surface">Арена мнений</h1>
          <p className="mt-2 text-sm font-medium text-on-surface-muted leading-relaxed">
            Два критика — одна публикация. Присоединитесь к стороне, чьи аргументы убедительнее.
          </p>
        </section>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-surface-container-low animate-pulse" />
            ))}
          </div>
        ) : duels.length === 0 ? (
          <div className="text-center py-20 px-6 bg-surface rounded-3xl border border-on-surface/5">
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-[24px] text-on-surface-muted">forum</span>
            </div>
            <p className="text-on-surface font-semibold text-base mb-1">Пока тихо</p>
            <p className="text-on-surface-muted text-sm font-medium leading-relaxed max-w-xs mx-auto">
              Дуэли появятся, когда два критика оставят полярные развёрнутые отзывы на одну публикацию
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {duels.map((duel) => (
              <DuelListCard key={duel.id} duel={duel} />
            ))}
          </div>
        )}
      </main>
      <BottomNavBar activeTab="home" />
    </>
  );
}

function DuelListCard({ duel }: { duel: Duel }) {
  const c = duel.challengerVotes || 0;
  const d = duel.defenderVotes || 0;
  const total = c + d;
  const cPct = total ? Math.round((c / total) * 100) : 50;

  return (
    <Link
      href={`/duels/${duel.id}`}
      className="block bg-surface rounded-2xl p-4 border border-on-surface/5 hover:border-on-surface/10 transition-all active:scale-[0.995]"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-surface-container border border-on-surface/5 shrink-0">
          {duel.content?.imageUrl ? (
            <Image
              src={duel.content.imageUrl}
              alt={duel.content.title}
              fill
              sizes="48px"
              placeholder="blur"
              blurDataURL={defaultBlurDataURL}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-muted">
              <span className="material-symbols-outlined text-lg">
                {duel.content?.type === 'movie' ? 'movie' : 'menu_book'}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-on-surface-muted uppercase tracking-wider mb-0.5">
            {duel.content?.type === 'movie' ? 'Кино' : 'Книга'}
          </p>
          <h3 className="text-sm font-semibold text-on-surface leading-snug line-clamp-2">
            {duel.content?.title || 'Публикация'}
          </h3>
        </div>
        {duel.source === 'auto' && (
          <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-on-surface-muted bg-surface-container px-2 py-1 rounded-md">
            Авто
          </span>
        )}
      </div>

      {/* Sides */}
      <div className="flex items-center gap-3 text-xs mb-3">
        <SideLabel review={duel.challengerReview} accent="emerald" />
        <span className="text-on-surface-muted font-semibold">vs</span>
        <SideLabel review={duel.defenderReview} accent="rose" align="right" />
      </div>

      {/* Progress */}
      <div className="relative h-2 rounded-full bg-surface-container-low overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-emerald-400/80 transition-all"
          style={{ width: `${cPct}%` }}
        />
        <div
          className="absolute top-0 right-0 h-full bg-rose-400/80 transition-all"
          style={{ width: `${100 - cPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2 text-[11px] font-medium text-on-surface-muted">
        <span>{c} голосов</span>
        <span>{duel.commentCount || 0} комментариев</span>
        <span>{d} голосов</span>
      </div>
    </Link>
  );
}

function SideLabel({
  review,
  accent,
  align = 'left',
}: {
  review: Duel['challengerReview'];
  accent: 'emerald' | 'rose';
  align?: 'left' | 'right';
}) {
  const color = accent === 'emerald' ? 'text-emerald-600' : 'text-rose-600';
  return (
    <div className={`flex-1 min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
      <p className={`font-semibold text-xs truncate ${color}`}>{review?.user?.name || 'Критик'}</p>
      <p className="text-on-surface-muted text-[11px] font-medium line-clamp-1">
        {review?.rating ? `★ ${review.rating}` : ''}
      </p>
    </div>
  );
}
