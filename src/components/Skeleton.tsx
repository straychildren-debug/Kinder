'use client';

import React from 'react';

/**
 * Базовый «шиммер»-блок. Используется как строительный кирпич
 * для скелетонов. Любой размер/форма задаётся через className.
 */
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      aria-hidden="true"
    />
  );
}

/** Скелетон карточки фида главной (крупная обложка + заголовок + мета). */
export function FeedCardSkeleton() {
  return (
    <article className="overflow-hidden bg-surface rounded-3xl border border-on-surface/5 shadow-md">
      <SkeletonBlock className="aspect-[3/2] md:aspect-video w-full" />
      <div className="relative -mt-6 mx-4 mb-4 p-6 rounded-3xl bg-white/70 backdrop-blur-xl border border-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <SkeletonBlock className="w-9 h-9 rounded-xl" />
          <div className="flex flex-col gap-2">
            <SkeletonBlock className="h-2.5 w-24 rounded-md" />
            <SkeletonBlock className="h-1.5 w-16 rounded-md opacity-40" />
          </div>
        </div>
        <SkeletonBlock className="h-8 w-4/5 rounded-xl mb-3" />
        <SkeletonBlock className="h-2.5 w-full rounded-md mb-1.5" />
        <SkeletonBlock className="h-2.5 w-2/3 rounded-md mb-6" />
        <div className="flex items-center justify-between pt-4 border-t border-on-surface/5">
          <div className="flex gap-4">
            <SkeletonBlock className="h-3 w-10 rounded-md" />
            <SkeletonBlock className="h-3 w-10 rounded-md" />
          </div>
          <SkeletonBlock className="h-8 w-14 rounded-xl" />
        </div>
      </div>
    </article>
  );
}

/** Горизонтальная карточка списка (library/movies). */
export function ListCardSkeleton() {
  return (
    <div className="flex bg-surface p-3 rounded-2xl border border-on-surface/5 shadow-sm">
      <SkeletonBlock className="w-16 aspect-[4/5] rounded-xl flex-shrink-0" />
      <div className="ml-4 flex flex-col justify-center flex-1 gap-2">
        <div className="flex justify-between items-start">
          <SkeletonBlock className="h-4 w-3/4 rounded-md" />
          <SkeletonBlock className="h-4 w-8 rounded-full" />
        </div>
        <SkeletonBlock className="h-2.5 w-1/4 rounded-md opacity-40" />
        <div className="mt-2 space-y-1">
          <SkeletonBlock className="h-2 w-full rounded-md" />
          <SkeletonBlock className="h-2 w-2/3 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/** Карточка клуба на странице /clubs. */
export function ClubCardSkeleton() {
  return (
    <div className="bg-surface p-5 rounded-3xl border border-on-surface/5 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <SkeletonBlock className="w-12 h-12 rounded-xl" />
        <div className="flex flex-col gap-2 flex-1">
          <SkeletonBlock className="h-3.5 w-2/3 rounded-md" />
          <SkeletonBlock className="h-2 w-1/4 rounded-md opacity-40" />
        </div>
      </div>
      <div className="space-y-1.5 mb-6">
        <SkeletonBlock className="h-2.5 w-full rounded-md" />
        <SkeletonBlock className="h-2.5 w-4/5 rounded-md" />
      </div>
      <div className="flex justify-between items-center">
        <SkeletonBlock className="h-2 w-16 rounded-md opacity-30" />
        <SkeletonBlock className="h-9 w-9 rounded-xl" />
      </div>
    </div>
  );
}

/** Сообщение в чате клуба (аватар + пузырь). */
export function MessageSkeleton({ align = 'left' }: { align?: 'left' | 'right' }) {
  const right = align === 'right';
  return (
    <div className={`flex items-end gap-2 ${right ? 'flex-row-reverse' : ''}`}>
      <SkeletonBlock className="w-7 h-7 rounded-xl flex-shrink-0" />
      <div className={`flex flex-col gap-1.5 ${right ? 'items-end' : 'items-start'}`}>
        <SkeletonBlock className="h-2 w-16 rounded-md opacity-40" />
        <SkeletonBlock className={`h-12 w-40 ${right ? 'rounded-tl-2xl rounded-tr-sm rounded-bl-2xl rounded-br-2xl' : 'rounded-tr-2xl rounded-tl-sm rounded-bl-2xl rounded-br-2xl'}`} />
      </div>
    </div>
  );
}

/** Готовые «обёртки», рендерящие N скелетонов. */
export function FeedSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-8">
      {Array.from({ length: count }).map((_, i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
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

