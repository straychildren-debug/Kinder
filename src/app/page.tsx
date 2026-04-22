'use client';

import React, { useEffect, useRef, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { getApprovedContent, getTopAuthorsByLikes, getTopCommenters, getTopPublicists, getUserById } from "@/lib/db";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import Image from "next/image";
import { ContentItem, LeaderboardUser, User } from "@/lib/types";
import { defaultBlurDataURL } from "@/lib/image-blur";
import ContentDetailsModal from "@/components/ContentDetailsModal";
import PublicProfileModal from "@/components/PublicProfileModal";
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
  const [selectedLeaderboardUser, setSelectedLeaderboardUser] = useState<User | null>(null);

  async function openLeaderboardUser(userId: string) {
    const u = await getUserById(userId);
    if (u) setSelectedLeaderboardUser(u);
  }
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
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 12;
  const filteredContent = activeFilter === 'all'
    ? approvedContent
    : approvedContent.filter(item => item.type === activeFilter);
  const totalPages = Math.max(1, Math.ceil(filteredContent.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleContent = filteredContent.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Сброс на первую страницу при смене фильтра или перезагрузке ленты.
  useEffect(() => {
    setPage(1);
  }, [activeFilter, approvedContent.length]);

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
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl pointer-events-none z-10">
              {searching ? 'hourglass_empty' : 'search'}
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => handleQuery(e.target.value)}
              placeholder="Поиск"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-on-surface/5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-on-surface/10 transition-all placeholder:text-on-surface-muted"
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
              className="group flex flex-col gap-2 glass-panel rounded-3xl p-5 border-0 shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all active:scale-[0.98] overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-neon/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-accent-neon/30 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-surface/50 border border-white/10 flex items-center justify-center backdrop-blur-md mb-2">
                <span
                  className="material-symbols-outlined text-[24px] text-accent-neon"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  swipe
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-base font-black text-white leading-tight tracking-tight">Откройте для себя</p>
                <p className="text-xs font-semibold text-on-surface-muted mt-1 leading-snug">
                  Свайпните карточки
                </p>
              </div>
            </Link>
            <Link
              href="/feed"
              className="group flex flex-col gap-2 glass-panel rounded-3xl p-5 border-0 shadow-lg hover:shadow-[0_0_20px_rgba(52,211,153,0.2)] transition-all active:scale-[0.98] overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-emerald/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-accent-emerald/30 transition-colors" />
              <div className="w-12 h-12 rounded-2xl bg-surface/50 border border-white/10 flex items-center justify-center backdrop-blur-md mb-2">
                <span
                  className="material-symbols-outlined text-[24px] text-accent-emerald"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  dynamic_feed
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-base font-black text-white leading-tight tracking-tight">Моя лента</p>
                <p className="text-xs font-semibold text-on-surface-muted mt-1 leading-snug">
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
                <span className="text-xs font-bold text-accent-neon uppercase tracking-widest mb-1.5 block drop-shadow-md">Дебаты критиков</span>
                <h2 className="text-3xl font-black text-white leading-tight drop-shadow-lg">Арена мнений</h2>
              </div>
              <Link
                href="/duels"
                className="text-xs font-black text-on-surface-variant hover:text-white transition-colors uppercase tracking-wider"
              >
                Все
              </Link>
            </div>
            <div className="space-y-4">
              {activeDuels.map((duel) => {
                const c = duel.challengerVotes || 0;
                const d = duel.defenderVotes || 0;
                const total = c + d;
                const cPct = total ? Math.round((c / total) * 100) : 50;
                return (
                  <Link
                    key={duel.id}
                    href={`/duels/${duel.id}`}
                    className="relative block w-full rounded-3xl overflow-hidden glass-panel border-0 neon-border p-5 group active:scale-[0.98] transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-emerald/10 via-transparent to-accent-rose/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10 text-center mb-6">
                      <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-1.5 drop-shadow-md">
                        {duel.content?.type === 'movie' ? 'Кино' : 'Книга'}
                      </p>
                      <h3 className="text-base font-black text-white leading-tight drop-shadow-lg max-w-[85%] mx-auto line-clamp-2">
                        {duel.content?.title || 'Публикация'}
                      </h3>
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex-1 flex flex-col items-center">
                        <div className="relative w-14 h-14 rounded-full bg-surface border-2 border-accent-emerald shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center justify-center overflow-hidden mb-2 group-hover:shadow-[0_0_30px_rgba(52,211,153,0.6)] transition-shadow">
                          {duel.challengerReview?.user?.avatarUrl ? (
                            <Image src={duel.challengerReview.user.avatarUrl} alt="1" fill className="object-cover" />
                          ) : (
                             <span className="text-lg font-black text-accent-emerald">{duel.challengerReview?.user?.name?.charAt(0) || '1'}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-accent-emerald text-center drop-shadow-md line-clamp-1 w-full px-2 uppercase tracking-tight">
                          {duel.challengerReview?.user?.name || 'Критик 1'}
                        </span>
                        <span className="text-2xl font-black text-white mt-1 drop-shadow-lg">{cPct}%</span>
                      </div>

                      <div className="shrink-0 px-3 flex flex-col items-center justify-center -translate-y-4">
                        <span className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-accent-neon to-white drop-shadow-[0_0_20px_rgba(168,85,247,0.8)] leading-tight p-2">VS</span>
                      </div>

                      <div className="flex-1 flex flex-col items-center">
                        <div className="relative w-14 h-14 rounded-full bg-surface border-2 border-accent-rose shadow-[0_0_20px_rgba(251,113,133,0.3)] flex items-center justify-center overflow-hidden mb-2 group-hover:shadow-[0_0_30px_rgba(251,113,133,0.6)] transition-shadow">
                          {duel.defenderReview?.user?.avatarUrl ? (
                            <Image src={duel.defenderReview.user.avatarUrl} alt="2" fill className="object-cover" />
                          ) : (
                             <span className="text-lg font-black text-accent-rose">{duel.defenderReview?.user?.name?.charAt(0) || '2'}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-accent-rose text-center drop-shadow-md line-clamp-1 w-full px-2 uppercase tracking-tight">
                          {duel.defenderReview?.user?.name || 'Критик 2'}
                        </span>
                        <span className="text-2xl font-black text-white mt-1 drop-shadow-lg tracking-tighter">{100 - cPct}%</span>
                      </div>
                    </div>

                    <div className="relative z-10 mt-6 h-2 rounded-full bg-surface/50 overflow-hidden flex shadow-inner backdrop-blur-md">
                      <div className="h-full bg-accent-emerald shadow-[0_0_10px_rgba(52,211,153,0.8)] transition-all duration-1000 ease-out" style={{ width: `${cPct}%` }} />
                      <div className="h-full bg-accent-rose shadow-[0_0_10px_rgba(251,113,133,0.8)] transition-all duration-1000 ease-out" style={{ width: `${100 - cPct}%` }} />
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
              <span className="text-xs font-bold text-accent-neon uppercase tracking-widest mb-1.5 block drop-shadow-md">Новое в комьюнити</span>
              <h2 className="text-3xl font-black tracking-tight text-white leading-tight drop-shadow-lg">Публикации</h2>
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
                  flex items-center gap-2 px-5 py-2.5 rounded-xl whitespace-nowrap text-xs font-black uppercase tracking-wider transition-all duration-300 border
                  ${activeFilter === f.id 
                    ? 'bg-accent-neon text-white border-accent-neon shadow-[0_4px_15px_rgba(168,85,247,0.5)] scale-[1.05]' 
                    : 'glass-panel text-on-surface-variant border-white/5 hover:border-white/20 hover:text-white'}
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
              {visibleContent.map((item, index) => (
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
                        <h3 className="text-sm md:text-base font-bold text-white leading-relaxed line-clamp-2">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                </button>
                </MotionListItem>
              ))}
            </div>
          )}

          {!loading && filteredContent.length > PAGE_SIZE && (
            <Pagination
              page={currentPage}
              total={totalPages}
              onChange={(p) => {
                setPage(p);
                if (typeof window !== 'undefined') {
                  window.scrollTo({ top: window.scrollY, behavior: 'auto' });
                }
              }}
            />
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

        {/* Профиль героя форума */}
        {selectedLeaderboardUser && (
          <PublicProfileModal
            user={selectedLeaderboardUser}
            onClose={() => setSelectedLeaderboardUser(null)}
            onOpenContent={(c) => {
              setSelectedLeaderboardUser(null);
              setSelectedContent(c);
            }}
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
              onUserClick={openLeaderboardUser}
            />
            {/* Top Commenters */}
            <LeaderboardColumn
              title="Комментаторы"
              subtitle="Самые активные в обсуждениях"
              icon="forum"
              users={topCommenters}
              metricLabel="ответов"
              onUserClick={openLeaderboardUser}
            />
            {/* Top Publicists */}
            <LeaderboardColumn
              title="Публицисты"
              subtitle="Главные поставщики контента"
              icon="library_add"
              users={topPublicists}
              metricLabel="публ."
              onUserClick={openLeaderboardUser}
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
  metricLabel,
  onUserClick,
}: {
  title: string,
  subtitle: string,
  icon: string,
  users: LeaderboardUser[],
  metricLabel: string,
  onUserClick?: (userId: string) => void,
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
          <button
            type="button"
            key={u.id}
            onClick={() => onUserClick?.(u.id)}
            disabled={!onUserClick}
            className="flex items-center gap-3 group w-full text-left rounded-xl p-1 -m-1 hover:bg-on-surface/[0.03] transition-colors disabled:hover:bg-transparent disabled:cursor-default"
          >
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="relative w-full h-full rounded-full bg-surface-container overflow-hidden border border-on-surface/5">
                {u.avatarUrl ? (
                  <Image src={u.avatarUrl} alt={u.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-black">{u.name.charAt(0)}</div>
                )}
              </div>
              {/* Rank Badge */}
              <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-surface z-10 shadow-sm ${
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
          </button>
        ))}
      </div>
    </div>
  );
}

// Компактная пагинация: «< 1 … 4 5 6 … N >». Показывает до пяти номеров + многоточия.
function paginationRange(current: number, total: number): (number | 'dots')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | 'dots')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('dots');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('dots');
  pages.push(total);
  return pages;
}

function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const range = paginationRange(page, total);
  const btnBase =
    'min-w-9 h-9 px-3 rounded-xl flex items-center justify-center text-xs font-black tracking-tight transition-colors border';
  return (
    <nav
      aria-label="Пагинация публикаций"
      className="mt-10 flex items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Предыдущая страница"
        className={`${btnBase} bg-surface text-on-surface border-on-surface/5 hover:border-on-surface/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-on-surface/5`}
      >
        <span className="material-symbols-rounded text-[18px]">chevron_left</span>
      </button>

      {range.map((p, idx) =>
        p === 'dots' ? (
          <span
            key={`dots-${idx}`}
            className="min-w-6 text-center text-on-surface-variant/40 text-xs font-black select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${btnBase} ${
              p === page
                ? 'bg-on-surface text-surface border-on-surface shadow-sm'
                : 'bg-surface text-on-surface border-on-surface/5 hover:border-on-surface/20'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(Math.min(total, page + 1))}
        disabled={page === total}
        aria-label="Следующая страница"
        className={`${btnBase} bg-surface text-on-surface border-on-surface/5 hover:border-on-surface/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-on-surface/5`}
      >
        <span className="material-symbols-rounded text-[18px]">chevron_right</span>
      </button>
    </nav>
  );
}
