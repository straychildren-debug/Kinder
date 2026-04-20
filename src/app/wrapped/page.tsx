'use client';

import React, { useEffect, useState } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { getWrappedStats, type WrappedStats } from '@/lib/wrapped';
import { defaultBlurDataURL } from '@/lib/image-blur';
import ContentDetailsModal from '@/components/ContentDetailsModal';
import type { ContentItem } from '@/lib/types';

export default function WrappedPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [period, setPeriod] = useState<'year' | 'all'>('year');
  const [loading, setLoading] = useState(true);
  const [openedContent, setOpenedContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getWrappedStats(user.id, period).then((s) => {
      if (!cancelled) {
        setStats(s);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, period]);

  return (
    <>
      <TopNavBar title="Год в Kinder" showBack={true} backPath="/profile" />
      <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
        <section className="pb-6">
          <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">
            Ваша персональная статистика
          </span>
          <h1 className="text-2xl font-bold tracking-tight leading-tight text-on-surface">
            {period === 'year' ? `Год в Kinder · ${stats?.year || new Date().getFullYear()}` : 'Всё время в Kinder'}
          </h1>
          <p className="mt-2 text-sm font-medium text-on-surface-muted leading-relaxed">
            Итоги вашего чтения и просмотров — в цифрах и любимых жанрах.
          </p>
        </section>

        {/* Period toggle */}
        <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl mb-6">
          <button
            onClick={() => setPeriod('year')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              period === 'year' ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-muted'
            }`}
          >
            Этот год
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              period === 'all' ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-muted'
            }`}
          >
            Всё время
          </button>
        </div>

        {!user ? (
          <EmptyBlock icon="lock" title="Нужен вход" subtitle="Войдите, чтобы увидеть свою статистику" />
        ) : loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-surface-container-low animate-pulse"
              />
            ))}
          </div>
        ) : !stats || stats.totals.reviews + stats.totals.swipes === 0 ? (
          <EmptyBlock
            icon="insights"
            title="Пока мало данных"
            subtitle="Оставьте пару отзывов и поставьте лайки — здесь появится ваш персональный отчёт"
          />
        ) : (
          <div className="space-y-4">
            {/* Hero: reviews number */}
            <HeroCard
              big={stats.totals.reviews}
              label="отзывов оставлено"
              sub={
                stats.mostActiveMonth
                  ? `Самый активный месяц — ${stats.mostActiveMonth.month}`
                  : stats.firstReviewAt
                  ? `С ${new Date(stats.firstReviewAt).toLocaleDateString('ru-RU', {
                      month: 'long',
                      year: 'numeric',
                    })}`
                  : undefined
              }
            />

            {/* Avg rating + engagement grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon="star"
                label="Средняя оценка"
                value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
                accent="amber"
              />
              <StatCard
                icon="swipe"
                label="Всего свайпов"
                value={stats.totals.swipes}
                accent="sky"
              />
              <StatCard
                icon="bookmark"
                label="В закладках"
                value={stats.totals.wishlist}
                accent="lilac"
              />
              <StatCard
                icon="playlist_play"
                label="Подборок создано"
                value={stats.totals.playlists}
                accent="emerald"
              />
            </div>

            {/* Book vs movie */}
            {(stats.bookVsMovie.books > 0 || stats.bookVsMovie.movies > 0) && (
              <BookVsMovie books={stats.bookVsMovie.books} movies={stats.bookVsMovie.movies} />
            )}

            {/* Top genres */}
            {stats.topGenres.length > 0 && (
              <Panel title="Любимые жанры" icon="category">
                <div className="space-y-2">
                  {stats.topGenres.map((g, i) => {
                    const max = stats.topGenres[0].count || 1;
                    const pct = Math.round((g.count / max) * 100);
                    return (
                      <div key={g.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-on-surface">
                            {i + 1}. {g.label}
                          </span>
                          <span className="text-on-surface-muted font-medium">{g.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-container-low overflow-hidden">
                          <div
                            className="h-full bg-accent-lilac/80 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* Top authors / directors */}
            {(stats.topAuthors.length > 0 || stats.topDirectors.length > 0) && (
              <div className="grid grid-cols-1 gap-3">
                {stats.topAuthors.length > 0 && (
                  <Panel title="Любимые авторы" icon="menu_book">
                    <ul className="space-y-1.5">
                      {stats.topAuthors.map((a, i) => (
                        <li key={a.label} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-on-surface truncate max-w-[70%]">
                            {i + 1}. {a.label}
                          </span>
                          <span className="text-on-surface-muted font-medium">
                            {a.count} {a.count === 1 ? 'произв.' : 'произв.'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                )}
                {stats.topDirectors.length > 0 && (
                  <Panel title="Любимые режиссёры" icon="movie">
                    <ul className="space-y-1.5">
                      {stats.topDirectors.map((d, i) => (
                        <li key={d.label} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-on-surface truncate max-w-[70%]">
                            {i + 1}. {d.label}
                          </span>
                          <span className="text-on-surface-muted font-medium">
                            {d.count} {d.count === 1 ? 'фильм' : 'фильма'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                )}
              </div>
            )}

            {/* Top rated content */}
            {stats.topRatedContent.length > 0 && (
              <Panel title="Вам особенно понравились" icon="favorite">
                <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
                  {stats.topRatedContent.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setOpenedContent(c)}
                      className="group shrink-0 w-16 text-left outline-none"
                      title={c.title}
                    >
                      <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-surface-container border border-on-surface/5">
                        {c.imageUrl ? (
                          <Image
                            src={c.imageUrl}
                            alt={c.title}
                            fill
                            sizes="64px"
                            placeholder="blur"
                            blurDataURL={defaultBlurDataURL}
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-surface-muted">
                              {c.type === 'movie' ? 'movie' : 'menu_book'}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-medium text-on-surface leading-snug line-clamp-2 mt-1.5">
                        {c.title}
                      </p>
                    </button>
                  ))}
                </div>
              </Panel>
            )}

            {/* Community: followers / following / awards */}
            <div className="grid grid-cols-3 gap-3">
              <MiniStat icon="group" label="Подписчики" value={stats.totals.followers} />
              <MiniStat icon="person_add" label="Подписки" value={stats.totals.following} />
              <MiniStat icon="workspace_premium" label="Награды" value={stats.totals.awards} />
            </div>
          </div>
        )}
      </main>
      {openedContent && (
        <ContentDetailsModal content={openedContent} onClose={() => setOpenedContent(null)} />
      )}
      <BottomNavBar activeTab="profile" />
    </>
  );
}

function HeroCard({ big, label, sub }: { big: number; label: string; sub?: string }) {
  return (
    <div className="bg-gradient-to-br from-accent-lilac/10 via-surface to-amber-100/20 rounded-3xl p-6 border border-on-surface/5">
      <p className="text-[10px] font-semibold text-on-surface-muted uppercase tracking-wider mb-2">
        Главное
      </p>
      <div className="flex items-end gap-3">
        <span className="text-6xl font-bold tracking-tight text-on-surface leading-none">{big}</span>
        <span className="text-sm font-medium text-on-surface-muted pb-2">{label}</span>
      </div>
      {sub && <p className="mt-3 text-xs font-medium text-on-surface-muted leading-relaxed">{sub}</p>}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: number | string;
  accent: 'amber' | 'sky' | 'lilac' | 'emerald';
}) {
  const bg = {
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
    lilac: 'bg-accent-lilac/10 text-accent-lilac',
    emerald: 'bg-emerald-50 text-emerald-700',
  }[accent];
  return (
    <div className="bg-surface rounded-2xl p-4 border border-on-surface/5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-on-surface leading-none">{value}</p>
      <p className="text-[11px] font-medium text-on-surface-muted mt-1">{label}</p>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="bg-surface rounded-2xl p-3 border border-on-surface/5 text-center">
      <span
        className="material-symbols-outlined text-[18px] text-on-surface-muted"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <p className="text-xl font-bold tracking-tight text-on-surface leading-none mt-1">{value}</p>
      <p className="text-[10px] font-medium text-on-surface-muted mt-1">{label}</p>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-on-surface/5">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="material-symbols-outlined text-[18px] text-on-surface-muted"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
        <h3 className="text-sm font-bold text-on-surface">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function BookVsMovie({ books, movies }: { books: number; movies: number }) {
  const total = books + movies || 1;
  const booksPct = Math.round((books / total) * 100);
  const moviesPct = 100 - booksPct;
  return (
    <div className="bg-surface rounded-2xl p-5 border border-on-surface/5">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="material-symbols-outlined text-[18px] text-on-surface-muted"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          balance
        </span>
        <h3 className="text-sm font-bold text-on-surface">Книги vs Кино</h3>
      </div>
      <div className="flex items-center justify-between text-xs font-semibold mb-2">
        <span className="text-emerald-600">
          Книги — {books} ({booksPct}%)
        </span>
        <span className="text-sky-600 text-right">
          Кино — {movies} ({moviesPct}%)
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-surface-container-low overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-emerald-400/80 transition-all"
          style={{ width: `${booksPct}%` }}
        />
        <div
          className="absolute top-0 right-0 h-full bg-sky-400/80 transition-all"
          style={{ width: `${moviesPct}%` }}
        />
      </div>
    </div>
  );
}

function EmptyBlock({
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
