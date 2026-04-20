'use client';

import React, { useEffect, useState } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { getFollowedActivity } from '@/lib/activity';
import { AWARD_META } from '@/lib/awards';
import type { ActivityEvent, AwardType } from '@/lib/types';

const TYPE_ICON: Record<string, { icon: string; color: string; bg: string }> = {
  reviewed_content: { icon: 'rate_review', color: 'text-sky-600', bg: 'bg-sky-50' },
  published_content: { icon: 'auto_stories', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  joined_club: { icon: 'groups', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
  completed_marathon: { icon: 'rocket_launch', color: 'text-orange-600', bg: 'bg-orange-50' },
  earned_award: { icon: 'workspace_premium', color: 'text-amber-600', bg: 'bg-amber-50' },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'сейчас';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function eventText(e: ActivityEvent): React.ReactNode {
  const name = e.userName || 'Участник';
  const p = e.payload || {};
  switch (e.type) {
    case 'reviewed_content': {
      const title = (p.title as string) || 'на контент';
      return (
        <>
          <b className="text-on-surface font-semibold">{name}</b> оставил(а) отзыв на{' '}
          <b className="text-on-surface font-semibold">«{title}»</b>
        </>
      );
    }
    case 'published_content': {
      const title = (p.title as string) || 'новый контент';
      return (
        <>
          <b className="text-on-surface font-semibold">{name}</b> опубликовал(а){' '}
          <b className="text-on-surface font-semibold">«{title}»</b>
        </>
      );
    }
    case 'joined_club': {
      const club = (p.club_name as string) || 'клуб';
      return (
        <>
          <b className="text-on-surface font-semibold">{name}</b> вступил(а) в клуб{' '}
          <b className="text-on-surface font-semibold">«{club}»</b>
        </>
      );
    }
    case 'completed_marathon': {
      const title = (p.title as string) || 'марафон';
      return (
        <>
          <b className="text-on-surface font-semibold">{name}</b> завершил(а) марафон{' '}
          <b className="text-on-surface font-semibold">«{title}»</b>
        </>
      );
    }
    case 'earned_award': {
      const type = (p.type as AwardType) || 'first_review';
      const meta = AWARD_META[type];
      return (
        <>
          <b className="text-on-surface font-semibold">{name}</b> получил(а) награду{' '}
          <b className="text-on-surface font-semibold">«{meta?.title || 'Достижение'}»</b>
        </>
      );
    }
    default:
      return <b className="text-on-surface font-semibold">{name}</b>;
  }
}

export default function FeedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setItems([]);
      return;
    }
    let alive = true;
    getFollowedActivity(user.id, 40)
      .then((list) => {
        if (alive) setItems(list);
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [user?.id]);

  return (
    <>
      <TopNavBar title="Моя лента" showBack={true} backPath="/" />
      <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
        <section className="pb-8">
          <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Подписки</span>
          <h1 className="text-2xl font-bold tracking-tight leading-tight text-on-surface">Моя лента</h1>
          <p className="mt-2 text-sm font-medium text-on-surface-muted leading-relaxed">
            Что происходит у людей, на которых вы подписаны.
          </p>
        </section>

        {!user ? (
          <Empty icon="lock" title="Нужен вход" subtitle="Войдите, чтобы видеть свою ленту" />
        ) : items === null ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-surface-container-low animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 px-6 bg-surface rounded-3xl border border-on-surface/5">
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-[24px] text-on-surface-muted">
                person_add
              </span>
            </div>
            <p className="text-on-surface font-semibold text-base mb-1">Лента пуста</p>
            <p className="text-on-surface-muted text-sm font-medium leading-relaxed max-w-xs mx-auto mb-5">
              Подпишитесь на критиков и авторов, чтобы видеть их активность
            </p>
            <Link
              href="/taste-twin"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-on-surface text-surface rounded-xl font-semibold text-sm transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">diversity_2</span>
              Найти двойника
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((e) => {
              const meta = TYPE_ICON[e.type] || TYPE_ICON.reviewed_content;
              return (
                <li
                  key={e.id}
                  className="flex items-start gap-3 bg-surface rounded-2xl p-4 border border-on-surface/5"
                >
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-surface-container border border-on-surface/5 shrink-0">
                    {e.userAvatar ? (
                      <Image src={e.userAvatar} alt={e.userName || ''} fill sizes="40px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-on-surface-muted">
                        {(e.userName || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-surface-muted leading-snug">{eventText(e)}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${meta.bg} ${meta.color}`}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}
                        >
                          {meta.icon}
                        </span>
                      </span>
                      <span className="text-[10px] font-medium text-on-surface-muted">
                        {formatWhen(e.createdAt)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <BottomNavBar activeTab="home" />
    </>
  );
}

function Empty({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
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
