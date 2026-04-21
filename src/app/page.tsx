'use client';

import React, { useEffect, useRef, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { getApprovedContent, getTopAuthorsByLikes, getTopCommenters, getTopPublicists } from "@/lib/db";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import Image from "next/image";
import { ContentItem, LeaderboardUser } from "@/lib/types";
import { defaultBlurDataURL } from "@/lib/image-blur";
import ContentDetailsModal from "@/components/ContentDetailsModal";
import { FeedSkeletonList } from "@/components/Skeleton";
import { MotionListItem } from "@/components/Motion";
import ActivityFeed from "@/components/ActivityFeed";
import { omnisearch, type OmnisearchResult } from "@/lib/search";
import { getActiveDuels } from "@/lib/duels";
import { getPersonalizedRecommendations } from "@/lib/recommendations";
import { getPublicPlaylists, type Playlist } from "@/lib/playlists";
import type { Duel } from "@/lib/types";

const EMPTY_RESULTS: OmnisearchResult = { content: [], clubs: [], users: [] };

export default function Home() {
  const { user } = useAuth();
  const [approvedContent, setApprovedContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OmnisearchResult>(EMPTY_RESULTS);
  const [searching, setSearching] = useState(false);
  const [topAuthors, setTopAuthors] = useState<LeaderboardUser[]>([]);
  const [topCommenters, setTopCommenters] = useState<LeaderboardUser[]>([]);
  const [topPublicists, setTopPublicists] = useState<LeaderboardUser[]>([]);
  const [activeDuels, setActiveDuels] = useState<Duel[]>([]);
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [popularPlaylists, setPopularPlaylists] = useState<Playlist[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'movie' | 'book'>('all');

  const visibleContent = activeFilter === 'all' 
    ? approvedContent 
    : approvedContent.filter(item => item.type === activeFilter);

  const handleQuery = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setResults(EMPTY_RESULTS); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const r = await omnisearch(val.trim());
      setResults(r);
      setSearching(false);
    }, 220);
  };

  const hasResults = results.content.length > 0 || results.clubs.length > 0 || results.users.length > 0;

  useEffect(() => {
    async function load() {
      try {
        const [contentData, authors, commenters, publicists, duels, playlists] = await Promise.all([
          getApprovedContent(),
          getTopAuthorsByLikes(5),
          getTopCommenters(5),
          getTopPublicists(5),
          getActiveDuels(user?.id, 3),
          getPublicPlaylists(6)
        ]);
        setApprovedContent(contentData);
        setTopAuthors(authors);
        setTopCommenters(commenters);
        setTopPublicists(publicists);
        setActiveDuels(duels);
        setPopularPlaylists(playlists);
      } catch (err) {
        console.error('Initial load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setRecommendations([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const recs = await getPersonalizedRecommendations(user.id, 12);
        if (!cancelled) setRecommendations(recs);
      } catch (err) {
        console.error('Recommendations load failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <>
      <TopNavBar />
      <main className="pt-24 px-4 pb-32 max-w-lg mx-auto md:max-w-7xl">
        {/* Search Bar */}
        <section className="mb-10">
          <div className="relative max-w-2xl mx-auto">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface/40 text-[22px] pointer-events-none z-10">
              {searching ? 'hourglass_empty' : 'search'}
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => handleQuery(e.target.value)}
              placeholder="Поиск"
              className="w-full bg-surface-container border-2 border-on-surface/5 rounded-2xl pl-14 pr-10 py-4 text-sm font-medium focus:outline-none focus:border-accent-lilac focus:bg-white focus:shadow-xl focus:shadow-accent-lilac/5 transition-all duration-300 placeholder:text-on-surface-muted shadow-sm"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults(EMPTY_RESULTS); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-on-surface/10 flex items-center justify-center hover:bg-on-surface/20 transition-all"
              >
                <span className="material-symbols-outlined text-[14px] text-on-surface/60">close</span>
              </button>
            )}

            {/* Inline results dropdown */}
            {query.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-on-surface/5 shadow-xl shadow-black/5 z-40 overflow-hidden max-h-[60vh] overflow-y-auto">
                {searching && !hasResults ? (
                  <div className="flex items-center justify-center py-8 gap-3 text-on-surface-muted">
                    <div className="w-4 h-4 border-2 border-on-surface/10 border-t-on-surface/50 rounded-full animate-spin" />
                    <span className="text-xs font-medium">Поиск…</span>
                  </div>
                ) : !hasResults ? (
                  <div className="py-8 text-center text-sm font-medium text-on-surface-muted">Ничего не найдено</div>
                ) : (
                  <div className="divide-y divide-on-surface/5">
                    {results.content.length > 0 && (
                      <div className="p-3">
                        <p className="text-[11px] font-semibold text-on-surface-muted px-2 mb-2">Контент</p>
                        {results.content.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => { setSelectedContent(item); setQuery(''); setResults(EMPTY_RESULTS); }}
                            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-surface-container transition-all text-left"
                          >
                            <div className="relative w-9 h-12 rounded-md overflow-hidden bg-surface-container shrink-0">
                              {item.imageUrl
                                ? <Image src={item.imageUrl} alt={item.title} fill sizes="36px" className="object-cover" />
                                : <span className="text-[9px] font-medium text-on-surface/30 flex items-center justify-center h-full">—</span>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold tracking-tight truncate">{item.title}</p>
                              <p className="text-xs text-on-surface-muted truncate">{item.author || item.director || ''}</p>
                            </div>
                            <span className="ml-auto text-[11px] font-medium text-on-surface-muted shrink-0">{item.type === 'movie' ? 'Кино' : 'Книга'}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {results.clubs.length > 0 && (
                      <div className="p-3">
                        <p className="text-[11px] font-semibold text-on-surface-muted px-2 mb-2">Клубы</p>
                        {results.clubs.map((club) => (
                          <Link
                            key={club.id}
                            href={`/clubs/${club.id}`}
                            onClick={() => { setQuery(''); setResults(EMPTY_RESULTS); }}
                            className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-surface-container transition-all"
                          >
                            <span className="material-symbols-outlined text-on-surface-muted text-[20px]">groups</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold tracking-tight truncate">{club.name}</p>
                              <p className="text-xs text-on-surface-muted">{club.memberCount} участников</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {results.users.length > 0 && (
                      <div className="p-3">
                        <p className="text-[11px] font-semibold text-on-surface-muted px-2 mb-2">Люди</p>
                        {results.users.map((u) => (
                          <div key={u.id} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-surface-container transition-all">
                            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs font-semibold text-on-surface-muted shrink-0">
                              {(u.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <p className="text-sm font-semibold tracking-tight truncate">{u.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Discover + Feed CTAs */}
        {user && (
          <section className="mb-10 px-2 grid grid-cols-2 gap-3">
            <Link
              href="/discover"
              className="group flex flex-col gap-2 bg-surface rounded-2xl p-4 border border-on-surface/5 hover:border-on-surface/10 transition-all active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-on-surface/5 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[20px] text-on-surface"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  swipe
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface leading-tight">Откройте для себя</p>
                <p className="text-[11px] font-medium text-on-surface-muted mt-0.5 leading-snug">
                  Свайпните карточки
                </p>
              </div>
            </Link>
            <Link
              href="/feed"
              className="group flex flex-col gap-2 bg-surface rounded-2xl p-4 border border-on-surface/5 hover:border-on-surface/10 transition-all active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-on-surface/5 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[20px] text-on-surface"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  dynamic_feed
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface leading-tight">Моя лента</p>
                <p className="text-[11px] font-medium text-on-surface-muted mt-0.5 leading-snug">
                  От ваших подписок
                </p>
              </div>
            </Link>
          </section>
        )}

        {/* Arena of Opinions */}
        {activeDuels.length > 0 && (
          <section className="mb-12 px-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Дебаты критиков</span>
                <h2 className="text-2xl font-bold tracking-tight text-on-surface leading-tight">Арена мнений</h2>
              </div>
              <Link
                href="/duels"
                className="text-xs font-semibold text-on-surface-muted hover:text-on-surface transition-colors"
              >
                Все
              </Link>
            </div>
            <div className="space-y-3">
              {activeDuels.map((duel) => {
                const c = duel.challengerVotes || 0;
                const d = duel.defenderVotes || 0;
                const total = c + d;
                const cPct = total ? Math.round((c / total) * 100) : 50;
                return (
                  <Link
                    key={duel.id}
                    href={`/duels/${duel.id}`}
                    className="block bg-surface rounded-2xl p-4 border border-on-surface/5 hover:border-on-surface/10 transition-all active:scale-[0.995]"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-surface-container border border-on-surface/5 shrink-0">
                        {duel.content?.imageUrl ? (
                          <Image
                            src={duel.content.imageUrl}
                            alt={duel.content.title}
                            fill
                            sizes="40px"
                            placeholder="blur"
                            blurDataURL={defaultBlurDataURL}
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-on-surface-muted uppercase tracking-wider mb-0.5">
                          {duel.content?.type === 'movie' ? 'Кино' : 'Книга'}
                        </p>
                        <p className="text-sm font-semibold text-on-surface leading-snug line-clamp-2">
                          {duel.content?.title || 'Публикация'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
                      <span className="text-emerald-600 truncate max-w-[40%]">
                        {duel.challengerReview?.user?.name || 'Критик 1'}
                      </span>
                      <span className="text-rose-600 truncate max-w-[40%] text-right">
                        {duel.defenderReview?.user?.name || 'Критик 2'}
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full bg-surface-container-low overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-emerald-400/80"
                        style={{ width: `${cPct}%` }}
                      />
                      <div
                        className="absolute top-0 right-0 h-full bg-rose-400/80"
                        style={{ width: `${100 - cPct}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Personalized Recommendations */}
        {user && recommendations.length > 0 && (
          <section className="mb-12">
            <div className="flex items-end justify-between mb-5 px-2">
              <div>
                <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">По вашему вкусу</span>
                <h2 className="text-2xl font-bold tracking-tight text-on-surface leading-tight">Для вас</h2>
              </div>
            </div>
            <div className="-mx-4 overflow-x-auto scrollbar-none">
              <div className="flex gap-3 px-4 pb-2 snap-x snap-mandatory">
                {recommendations.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedContent(item)}
                    className="group shrink-0 w-36 snap-start text-left outline-none"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-surface-container border border-on-surface/5 shadow-sm group">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="144px"
                          placeholder="blur"
                          blurDataURL={defaultBlurDataURL}
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      )}
                      
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md flex items-center gap-1 z-20 border border-white/10">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '10px' }}>
                          {item.type === 'movie' ? 'movie' : 'menu_book'}
                        </span>
                        <span className="text-[9px] font-black text-white leading-none uppercase tracking-widest">
                          {item.type === 'movie' ? 'Кино' : 'Книга'}
                        </span>
                      </div>

                      {/* Content Overlay */}
                      <div className="absolute inset-x-0 bottom-0 pt-10 pb-2 px-2 bg-gradient-to-t from-black via-black/40 to-transparent z-10 transition-transform">
                        <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.15em] mb-0.5 truncate leading-none">
                          {item.author || item.director || 'Автор'}
                        </p>
                        <h3 className="text-[10px] font-bold text-white leading-tight line-clamp-2 tracking-tight">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Community Playlists */}
        {popularPlaylists.length > 0 && (
          <section className="mb-12">
            <div className="flex items-end justify-between mb-5 px-2">
              <div>
                <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Подборки читателей</span>
                <h2 className="text-2xl font-bold tracking-tight text-on-surface leading-tight">Коллекции</h2>
              </div>
              <Link
                href="/playlists"
                className="text-xs font-semibold text-on-surface-muted hover:text-on-surface transition-colors"
              >
                Все
              </Link>
            </div>
            <div className="-mx-4 overflow-x-auto scrollbar-none">
              <div className="flex gap-3 px-4 pb-2 snap-x snap-mandatory">
                {popularPlaylists.map((pl) => (
                  <Link
                    key={pl.id}
                    href={`/playlists/${pl.id}`}
                    className="group shrink-0 w-56 snap-start bg-surface rounded-2xl p-4 border border-on-surface/5 hover:border-on-surface/10 transition-all active:scale-[0.99]"
                  >
                    <div className="w-11 h-11 rounded-xl bg-on-surface/5 flex items-center justify-center mb-3">
                      <span
                        className="material-symbols-outlined text-[22px] text-on-surface"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        playlist_play
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-on-surface leading-snug line-clamp-2 mb-1">
                      {pl.title}
                    </h3>
                    <p className="text-[11px] font-medium text-on-surface-muted leading-snug line-clamp-2">
                      {pl.description || `${pl.itemCount || 0} ${(pl.itemCount || 0) === 1 ? 'элемент' : 'элементов'}`}
                    </p>
                    {pl.author && (
                      <p className="mt-2.5 text-[11px] font-semibold text-on-surface-muted truncate">
                        @{pl.author.name}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* New Publications Grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Рекомендации</span>
              <h2 className="text-2xl font-bold tracking-tight text-on-surface leading-tight">Новые публикации</h2>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none px-2 mb-8 -mt-2">
            {[
              { id: 'all', label: 'Все', icon: 'apps' },
              { id: 'movie', label: 'Кино', icon: 'movie' },
              { id: 'book', label: 'Книги', icon: 'menu_book' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap text-xs font-bold transition-all duration-300 border
                  ${activeFilter === f.id 
                    ? 'bg-on-surface text-surface border-on-surface shadow-lg shadow-black/5 scale-[1.02]' 
                    : 'bg-surface-container/40 text-on-surface/30 border-transparent hover:border-on-surface/10 hover:text-on-surface/50'}
                `}
              >
                <span className="material-symbols-rounded" style={{ fontSize: '16px', fontVariationSettings: activeFilter === f.id ? "'FILL' 1" : "'FILL' 0" }}>{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <FeedSkeletonList count={3} />
          ) : visibleContent.length === 0 ? (
            <div className="text-center py-16 px-6 bg-surface rounded-2xl border border-on-surface/5">
              <div className="text-5xl mb-4 grayscale opacity-40">🎬</div>
              <p className="text-on-surface-variant font-medium text-sm">
                Лента сообщества пока пуста
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6">
              {visibleContent.slice(0, 6).map((item, index) => (
                <MotionListItem key={item.id} index={index} className="h-full">
                <button
                  onClick={() => setSelectedContent(item)}
                  className="group w-full flex flex-col text-left outline-none"
                >
                                  <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-surface-container border border-on-surface/5 shadow-sm group">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="(min-width: 1024px) 20rem, 50vw"
                          placeholder="blur"
                          blurDataURL={defaultBlurDataURL}
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      )}
                      
                      {/* Type Badge */}
                      <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md flex items-center gap-1.5 z-20 border border-white/10">
                        <span className="material-symbols-rounded text-white" style={{ fontSize: '11px', fontVariationSettings: "'FILL' 1" }}>{item.type === 'movie' ? 'movie' : 'menu_book'}</span>
                        <span className="text-[10px] font-black text-white leading-none uppercase tracking-widest">{item.type === 'movie' ? 'Кино' : 'Книга'}</span>
                      </div>
                      
                      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-20">
                        {/* Year Badge */}
                        {item.year && (
                          <div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10">
                            <span className="text-[10px] font-black text-white leading-none">{item.year}</span>
                          </div>
                        )}
                        {/* Rating Badge */}
                        {item.rating && (
                          <div className="px-2 py-1 rounded-lg bg-amber-400 backdrop-blur-md flex items-center justify-center gap-1 border border-amber-500/20 shadow-lg shadow-amber-500/20">
                            <span className="material-symbols-rounded text-amber-950" style={{ fontSize: '10px', fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-[10px] font-black text-amber-950 leading-none">{item.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* Content Overlay */}
                      <div className="absolute inset-x-0 bottom-0 pt-20 pb-4 px-4 bg-gradient-to-t from-black via-black/40 to-transparent z-10 transition-transform">
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1 truncate leading-none">
                          {(item.author || item.director || 'Автор')}
                        </p>
                        <h3 className="text-sm md:text-base font-bold text-white leading-tight line-clamp-2 tracking-tight">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                </button>
                </MotionListItem>
              ))}
            </div>
          )}
        </section>

        {/* Лента активности сообщества */}
        <section className="mb-16">
          <ActivityFeed limit={5} />
        </section>

        {/* Details Modal */}
        {selectedContent && (
          <ContentDetailsModal 
            content={selectedContent} 
            onClose={() => setSelectedContent(null)} 
          />
        )}

        {/* Leaderboards Section */}
        <section className="pb-16">
          <div className="flex flex-col gap-2 mb-10">
            <h2 className="text-3xl font-black text-on-surface tracking-tighter uppercase leading-none">Герои нашего форума</h2>
            <div className="h-1 w-12 bg-amber-500 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Authors */}
            <LeaderboardColumn 
              title="Лучшие авторы" 
              subtitle="Больше всего лайков за отзывы"
              icon="stars" 
              users={topAuthors} 
              metricLabel="лайков"
            />
            {/* Top Commenters */}
            <LeaderboardColumn 
              title="Комментаторы" 
              subtitle="Самые активные в обсуждениях"
              icon="forum" 
              users={topCommenters} 
              metricLabel="ответов"
            />
            {/* Top Publicists */}
            <LeaderboardColumn 
              title="Публицисты" 
              subtitle="Главные поставщики контента"
              icon="library_add" 
              users={topPublicists} 
              metricLabel="публ."
            />
          </div>
        </section>

        {!user && (
          <div className="bg-surface-container-high/40 backdrop-blur-sm p-8 rounded-3xl border border-on-surface/5 mb-16 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors duration-1000"></div>
            <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto space-y-4">
              <h3 className="text-2xl font-black tracking-tight leading-tight text-on-surface uppercase">Присоединяйтесь к нам</h3>
              <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                Войдите, чтобы создавать контент, оставлять отзывы и занять своё место в рейтинге лучших участников клуба.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3 bg-on-surface text-surface rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10"
              >
                <span>Стать участником</span>
                <span className="material-symbols-outlined text-[18px]">login</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      <BottomNavBar activeTab="home" />
    </>
  );
}

function LeaderboardColumn({ 
  title, 
  subtitle, 
  icon, 
  users, 
  metricLabel 
}: { 
  title: string, 
  subtitle: string, 
  icon: string, 
  users: LeaderboardUser[], 
  metricLabel: string 
}) {
  return (
    <div className="bg-surface rounded-3xl p-6 border border-on-surface/5 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-on-surface/5 flex items-center justify-center text-on-surface">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <h3 className="font-black text-sm text-on-surface uppercase tracking-tight leading-none">{title}</h3>
      </div>
      <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-6 ml-[52px]">
        {subtitle}
      </p>

      <div className="space-y-3 flex-1">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 opacity-20 italic text-xs">Нет данных</div>
        ) : users.map((u, i) => (
          <div key={u.id} className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-full bg-surface-container overflow-hidden border border-on-surface/5 flex-shrink-0">
              {u.avatarUrl ? (
                <Image src={u.avatarUrl} alt={u.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-black">{u.name.charAt(0)}</div>
              )}
              {/* Rank Badge */}
              <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-surface ${
                i === 0 ? 'bg-amber-400 text-amber-950' : 
                i === 1 ? 'bg-slate-300 text-slate-900' : 
                i === 2 ? 'bg-orange-400 text-orange-950' : 
                'bg-surface-container-high text-on-surface-variant'
              }`}>
                {i + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-on-surface truncate tracking-tight">{u.name}</p>
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">
                {u.metricValue} {metricLabel}
              </p>
            </div>
            {i === 0 && (
              <span className="material-symbols-outlined text-amber-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
