'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useAuth } from '@/components/AuthProvider';
import { searchContent } from '@/lib/search';
import { getReviewsForContent } from '@/lib/db';
import { nominateDuel } from '@/lib/duels';
import type { ContentItem, Review } from '@/lib/types';

export default function CreateDuelPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const canCreate =
    !!user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'moderator');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContentItem[]>([]);
  const [searching, setSearching] = useState(false);

  const [content, setContent] = useState<ContentItem | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [challengerId, setChallengerId] = useState<string | null>(null);
  const [defenderId, setDefenderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced content search.
  useEffect(() => {
    if (content) return; // skip while already picked
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const r = await searchContent(q, 12);
      setResults(r);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query, content]);

  // Load reviews once content is picked.
  useEffect(() => {
    if (!content) {
      setReviews([]);
      return;
    }
    setLoadingReviews(true);
    (async () => {
      const list = await getReviewsForContent(content.id, user?.id);
      setReviews(list);
      setLoadingReviews(false);
    })();
  }, [content, user?.id]);

  if (isLoading) {
    return (
      <>
        <TopNavBar title="Создание дуэли" showBack={true} backPath="/duels" />
        <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
          <div className="h-40 rounded-2xl bg-surface-container-low animate-pulse" />
        </main>
        <BottomNavBar activeTab="home" />
      </>
    );
  }

  if (!canCreate) {
    return (
      <>
        <TopNavBar title="Создание дуэли" showBack={true} backPath="/duels" />
        <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
          <div className="text-center py-20 px-6 bg-surface rounded-3xl border border-on-surface/5">
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-[24px] text-on-surface-muted">
                lock
              </span>
            </div>
            <p className="text-on-surface font-semibold text-base mb-1">Доступ ограничен</p>
            <p className="text-on-surface-muted text-sm font-medium leading-relaxed max-w-xs mx-auto">
              Создавать дуэли могут только модераторы и администраторы.
            </p>
          </div>
        </main>
        <BottomNavBar activeTab="home" />
      </>
    );
  }

  const handleSubmit = async () => {
    if (!content || !challengerId || !defenderId || !user || submitting) return;
    if (challengerId === defenderId) {
      setError('Выберите два разных отзыва');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const duel = await nominateDuel({
        contentId: content.id,
        challengerReviewId: challengerId,
        defenderReviewId: defenderId,
        createdBy: user.id,
        source: 'admin',
      });
      if (duel) router.push(`/duels/${duel.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Не удалось создать дуэль';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const step: 1 | 2 = content ? 2 : 1;

  const togglePick = (reviewId: string) => {
    // Cycle: unpicked → challenger → defender → unpicked
    if (challengerId === reviewId) {
      setChallengerId(null);
      setDefenderId(reviewId);
    } else if (defenderId === reviewId) {
      setDefenderId(null);
    } else if (!challengerId) {
      setChallengerId(reviewId);
    } else if (!defenderId) {
      setDefenderId(reviewId);
    } else {
      // both slots taken — replace challenger by default
      setChallengerId(reviewId);
    }
  };

  return (
    <>
      <TopNavBar title="Создание дуэли" showBack={true} backPath="/duels" />
      <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
        <section className="pb-6">
          <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">
            Шаг {step} из 2
          </span>
          <h1 className="text-2xl font-bold tracking-tight leading-tight text-on-surface">
            {step === 1 ? 'Выберите публикацию' : 'Выберите два отзыва'}
          </h1>
          <p className="mt-2 text-sm font-medium text-on-surface-muted leading-relaxed">
            {step === 1
              ? 'Найдите книгу или фильм, вокруг которого разгорится спор критиков.'
              : 'Обвинитель и защитник должны быть разными авторами. Ставьте их отзывы на дуэль.'}
          </p>
        </section>

        {step === 1 && (
          <section className="bg-surface rounded-2xl border border-on-surface/5 overflow-hidden">
            <div className="relative">
              <span className="material-symbols-outlined text-[18px] text-on-surface-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Название книги или фильма…"
                autoFocus
                className="w-full bg-surface pl-10 pr-3 py-3 text-sm font-medium focus:outline-none placeholder:text-on-surface-muted/70"
              />
            </div>
            {query.trim() && (
              <div className="border-t border-on-surface/5 max-h-96 overflow-y-auto">
                {searching ? (
                  <div className="py-6 text-center text-xs font-medium text-on-surface-muted">
                    Ищем…
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-6 text-center text-xs font-medium text-on-surface-muted">
                    Ничего не нашли
                  </div>
                ) : (
                  <ul className="divide-y divide-on-surface/5">
                    {results.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => {
                            setContent(c);
                            setQuery('');
                            setResults([]);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-container-low transition-colors"
                        >
                          <div className="relative w-10 h-14 rounded-md overflow-hidden bg-surface-container border border-on-surface/5 shrink-0">
                            {c.imageUrl ? (
                              <Image
                                src={c.imageUrl}
                                alt={c.title}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px] text-on-surface-muted">
                                  {c.type === 'movie' ? 'movie' : 'menu_book'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-on-surface leading-snug line-clamp-1">
                              {c.title}
                            </p>
                            <p className="text-[11px] font-medium text-on-surface-muted mt-0.5 line-clamp-1">
                              {c.type === 'movie' ? 'Фильм' : 'Книга'}
                              {c.author ? ` · ${c.author}` : ''}
                              {c.director ? ` · ${c.director}` : ''}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        )}

        {step === 2 && content && (
          <>
            {/* Selected content summary */}
            <section className="mb-5 bg-surface rounded-2xl p-4 border border-on-surface/5 flex items-center gap-3">
              <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-surface-container border border-on-surface/5 shrink-0">
                {content.imageUrl ? (
                  <Image
                    src={content.imageUrl}
                    alt={content.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-muted">
                      {content.type === 'movie' ? 'movie' : 'menu_book'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-on-surface-muted uppercase tracking-wider mb-0.5">
                  {content.type === 'movie' ? 'Кино' : 'Книга'}
                </p>
                <p className="text-sm font-semibold text-on-surface leading-snug line-clamp-2">
                  {content.title}
                </p>
              </div>
              <button
                onClick={() => {
                  setContent(null);
                  setChallengerId(null);
                  setDefenderId(null);
                }}
                className="shrink-0 text-[11px] font-semibold text-on-surface-muted bg-surface-container px-2.5 py-1.5 rounded-lg hover:bg-surface-container-high"
              >
                Сменить
              </button>
            </section>

            {/* Reviews list */}
            <section className="space-y-3">
              {loadingReviews ? (
                [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-28 rounded-2xl bg-surface-container-low animate-pulse"
                  />
                ))
              ) : reviews.length < 2 ? (
                <div className="text-center py-12 px-6 bg-surface rounded-3xl border border-on-surface/5">
                  <p className="text-on-surface font-semibold text-base mb-1">
                    Недостаточно отзывов
                  </p>
                  <p className="text-on-surface-muted text-sm font-medium leading-relaxed max-w-xs mx-auto">
                    Для дуэли нужно минимум два отзыва на публикацию.
                  </p>
                </div>
              ) : (
                reviews.map((r) => {
                  const role =
                    challengerId === r.id
                      ? 'challenger'
                      : defenderId === r.id
                      ? 'defender'
                      : null;
                  const ring =
                    role === 'challenger'
                      ? 'border-emerald-400 ring-2 ring-emerald-400/30'
                      : role === 'defender'
                      ? 'border-rose-400 ring-2 ring-rose-400/30'
                      : 'border-on-surface/5 hover:border-on-surface/10';
                  return (
                    <button
                      key={r.id}
                      onClick={() => togglePick(r.id)}
                      className={`w-full text-left bg-surface rounded-2xl p-4 border transition-all ${ring}`}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-surface-container border border-on-surface/5 shrink-0">
                          {r.user?.avatarUrl ? (
                            <Image
                              src={r.user.avatarUrl}
                              alt={r.user.name}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-on-surface-muted">
                              {(r.user?.name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface leading-tight truncate">
                            {r.user?.name || 'Критик'}
                          </p>
                          <p className="text-[11px] font-medium text-on-surface-muted mt-0.5">
                            {r.rating ? `★ ${r.rating}` : 'Без оценки'} · {r.text.length} зн.
                          </p>
                        </div>
                        {role && (
                          <span
                            className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                              role === 'challenger'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {role === 'challenger' ? 'Обвинитель' : 'Защитник'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-on-surface leading-relaxed line-clamp-3">
                        {r.text}
                      </p>
                    </button>
                  );
                })
              )}
            </section>

            {reviews.length >= 2 && (
              <div className="mt-6 space-y-3">
                {error && (
                  <div className="text-xs font-medium text-rose-600 bg-rose-50 rounded-xl px-3 py-2">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!challengerId || !defenderId || submitting}
                  className="w-full py-3 bg-on-surface text-surface rounded-xl font-semibold text-sm transition-transform active:scale-95 disabled:opacity-40"
                >
                  {submitting
                    ? 'Создаём…'
                    : !challengerId || !defenderId
                    ? 'Выберите обвинителя и защитника'
                    : 'Создать дуэль'}
                </button>
                <p className="text-[11px] font-medium text-on-surface-muted text-center leading-relaxed">
                  Первый клик по отзыву — обвинитель, второй — защитник. Повторный клик снимает
                  выбор.
                </p>
              </div>
            )}
          </>
        )}
      </main>
      <BottomNavBar activeTab="home" />
    </>
  );
}
