'use client';

import React from 'react';

/**
 * Базовый «шиммер»-блок. Используется как строительный кирпич
 * для скелетонов. Любой размер/форма задаётся через className.
 */
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-on-surface/5 ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

/** Скелетон карточки фида главной (крупная обложка + заголовок + мета). */
export function FeedCardSkeleton() {
  return (
    <article className="overflow-hidden bg-surface rounded-[40px] border border-on-surface/5 shadow-xl">
      <SkeletonBlock className="aspect-[3/2] md:aspect-video w-full" />
      <div className="relative -mt-8 mx-4 mb-4 p-8 rounded-[32px] bg-white/70 backdrop-blur-xl border border-white shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <SkeletonBlock className="w-10 h-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <SkeletonBlock className="h-3 w-32 rounded-md" />
            <SkeletonBlock className="h-2 w-20 rounded-md" />
          </div>
        </div>
        <SkeletonBlock className="h-10 w-4/5 rounded-xl mb-4" />
        <SkeletonBlock className="h-3 w-full rounded-md mb-2" />
        <SkeletonBlock className="h-3 w-2/3 rounded-md mb-8" />
        <div className="flex items-center justify-between pt-6 border-t border-on-surface/5">
          <div className="flex gap-6">
            <SkeletonBlock className="h-4 w-12 rounded-md" />
            <SkeletonBlock className="h-4 w-12 rounded-md" />
          </div>
          <SkeletonBlock className="h-9 w-16 rounded-2xl" />
        </div>
      </div>
    </article>
  );
}

/** Горизонтальная карточка списка (library/movies). */
export function ListCardSkeleton() {
  return (
    <div className="flex bg-surface p-4 rounded-[24px] border border-on-surface/5 shadow-sm">
      <SkeletonBlock className="w-20 aspect-[4/5] rounded-[14px] flex-shrink-0" />
      <div className="ml-5 flex flex-col justify-center flex-1 gap-2">
        <SkeletonBlock className="h-5 w-3/4 rounded-md" />
        <SkeletonBlock className="h-3 w-1/3 rounded-md" />
        <SkeletonBlock className="h-3 w-full rounded-md mt-1" />
        <SkeletonBlock className="h-3 w-2/3 rounded-md" />
      </div>
    </div>
  );
}

/** Карточка клуба на странице /clubs. */
export function ClubCardSkeleton() {
  return (
    <div className="bg-surface p-5 rounded-[28px] border border-on-surface/5 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <SkeletonBlock className="w-14 h-14 rounded-2xl" />
        <div className="flex flex-col gap-2 flex-1">
          <SkeletonBlock className="h-4 w-2/3 rounded-md" />
          <SkeletonBlock className="h-3 w-1/3 rounded-md" />
        </div>
      </div>
      <SkeletonBlock className="h-3 w-full rounded-md mb-2" />
      <SkeletonBlock className="h-3 w-4/5 rounded-md mb-5" />
      <SkeletonBlock className="h-10 w-full rounded-2xl" />
    </div>
  );
}

/** Сообщение в чате клуба (аватар + пузырь). */
export function MessageSkeleton({ align = 'left' }: { align?: 'left' | 'right' }) {
  const right = align === 'right';
  return (
    <div className={`flex items-end gap-2 ${right ? 'flex-row-reverse' : ''}`}>
      <SkeletonBlock className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className={`flex flex-col gap-1 ${right ? 'items-end' : 'items-start'}`}>
        <SkeletonBlock className="h-3 w-20 rounded-md" />
        <SkeletonBlock className="h-10 w-48 rounded-2xl" />
      </div>
    </div>
  );
}

/** Готовые «обёртки», рендерящие N скелетонов. */
export function FeedSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-10">
      {Array.from({ length: count }).map((_, i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ClubSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ClubCardSkeleton key={i} />
      ))}
    </div>
  );
}
