'use client';

import React, { useEffect, useState } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { getTasteTwins, type TasteTwin } from '@/lib/tasteTwins';
import { defaultBlurDataURL } from '@/lib/image-blur';
import ContentDetailsModal from '@/components/ContentDetailsModal';
import type { ContentItem } from '@/lib/types';

export default function TasteTwinPage() {
  const { user } = useAuth();
  const [twins, setTwins] = useState<TasteTwin[]>([]);
  const [loading, setLoading] = useState(true);
  const [openContent, setOpenContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    (async () => {
      const t = await getTasteTwins(user.id, 5);
      setTwins(t);
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <>
      <TopNavBar title="Двойник по вкусу" showBack={true} backPath="/profile" />
      <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
        <section className="pb-8">
          <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">
            Люди с похожим вкусом
          </span>
          <h1 className="text-2xl font-bold tracking-tight leading-tight text-on-surface">
            Двойник по вкусу
          </h1>
          <p className="mt-2 text-sm font-medium text-on-surface-muted leading-relaxed">
            Мы нашли пользователей, чьи любимые книги и фильмы пересекаются с вашими.
          </p>
        </section>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-surface-container-low animate-pulse" />
            ))}
          </div>
        ) : !user ? (
          <EmptyState
            icon="lock"
            title="Нужен вход"
            subtitle="Войдите, чтобы увидеть своих двойников по вкусу"
          />
        ) : twins.length === 0 ? (
          <EmptyState
            icon="radar"
            title="Пока никого"
            subtitle="Лайкайте публикации, оставляйте оценки и добавляйте в закладки — так мы сможем найти вам двойника"
          />
        ) : (
          <div className="space-y-4">
            {twins.map((twin) => (
              <TwinCard
                key={twin.user.id}
                twin={twin}
                onOpenContent={(c) => setOpenContent(c)}
              />
            ))}
          </div>
        )}
      </main>
      {openContent && (
        <ContentDetailsModal
          content={openContent}
          onClose={() => setOpenContent(null)}
        />
      )}
      <BottomNavBar activeTab="profile" />
    </>
  );
}

function TwinCard({
  twin,
  onOpenContent,
}: {
  twin: TasteTwin;
  onOpenContent: (c: ContentItem) => void;
}) {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-on-surface/5">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-surface-container border border-on-surface/5 shrink-0">
          {twin.user.avatarUrl ? (
            <Image
              src={twin.user.avatarUrl}
              alt={twin.user.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-on-surface-muted">
              {twin.user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">{twin.user.name}</p>
          <p className="text-xs font-medium text-on-surface-muted mt-0.5">
            {twin.sharedCount} {twin.sharedCount === 1 ? 'общий выбор' : 'общих выбора'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-accent-lilac leading-none tracking-tight">
            {twin.matchPercent}%
          </p>
          <p className="text-[10px] font-medium text-on-surface-muted uppercase tracking-wider mt-0.5">
            совпадение
          </p>
        </div>
      </div>

      {twin.sharedContent.length > 0 && (
        <>
          <p className="text-[10px] font-medium text-on-surface-muted uppercase tracking-wider mb-2.5">
            Вы оба оценили
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
            {twin.sharedContent.slice(0, 8).map((c) => (
              <button
                key={c.id}
                onClick={() => onOpenContent(c)}
                className="group shrink-0 w-14 text-left outline-none"
                title={c.title}
              >
                <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-surface-container border border-on-surface/5">
                  {c.imageUrl ? (
                    <Image
                      src={c.imageUrl}
                      alt={c.title}
                      fill
                      sizes="56px"
                      placeholder="blur"
                      blurDataURL={defaultBlurDataURL}
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-muted">
                      <span className="material-symbols-outlined text-sm">
                        {c.type === 'movie' ? 'movie' : 'menu_book'}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center py-20 px-6 bg-surface rounded-3xl border border-on-surface/5">
      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-5">
        <span className="material-symbols-outlined text-[24px] text-on-surface-muted">{icon}</span>
      </div>
      <p className="text-on-surface font-semibold text-base mb-1">{title}</p>
      <p className="text-on-surface-muted text-sm font-medium leading-relaxed max-w-xs mx-auto">
        {subtitle}
      </p>
    </div>
  );
}
