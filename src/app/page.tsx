'use client';

import React, { useEffect, useRef, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { getApprovedContent } from "@/lib/db";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import Image from "next/image";
import { ContentItem } from "@/lib/types";
import { defaultBlurDataURL } from "@/lib/image-blur";
import ContentDetailsModal from "@/components/ContentDetailsModal";
import { FeedSkeletonList } from "@/components/Skeleton";
import { MotionListItem } from "@/components/Motion";
import ActivityFeed from "@/components/ActivityFeed";
import { omnisearch, type OmnisearchResult } from "@/lib/search";

const EMPTY_RESULTS: OmnisearchResult = { content: [], clubs: [], users: [] };

export default function Home() {
  const { user } = useAuth();
  const [approvedContent, setApprovedContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OmnisearchResult>(EMPTY_RESULTS);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleContent = approvedContent;

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
        const data = await getApprovedContent();
        setApprovedContent(data);
      } catch (err) {
        console.error('Initial load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

        {/* Лента активности сообщества */}
        <section className="mb-12">
          <ActivityFeed />
        </section>

        {/* New Publications Grid */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Рекомендации</span>
              <h2 className="text-2xl font-bold tracking-tight text-on-surface leading-tight">Новые публикации</h2>
            </div>
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
            <div className="grid grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-8">
              {visibleContent.map((item, index) => (
                <MotionListItem key={item.id} index={index}>
                <article
                  onClick={() => setSelectedContent(item)}
                  className="group cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-surface-container">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(min-width: 1024px) 20rem, 50vw"
                        placeholder="blur"
                        blurDataURL={defaultBlurDataURL}
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                      />
                    )}
                  </div>

                  <div className="mt-3 px-0.5">
                    <h3 className="text-sm font-semibold text-on-surface leading-snug tracking-tight mb-1 line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-[13px] font-medium text-on-surface/80 truncate flex-1 min-w-0">
                        {item.author || item.director || 'Автор'}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-on-surface-muted flex items-center justify-center" style={{ fontVariationSettings: "'FILL' 1", fontSize: '15px', width: '15px', height: '15px' }}>star</span>
                        <span className="text-[13px] font-semibold text-on-surface leading-none">{item.rating ? item.rating.toFixed(1) : '—'}</span>
                      </div>
                    </div>
                  </div>
                </article>
                </MotionListItem>
              ))}
            </div>
          )}
        </section>

        {/* Details Modal */}
        {selectedContent && (
          <ContentDetailsModal 
            content={selectedContent} 
            onClose={() => setSelectedContent(null)} 
          />
        )}

        {/* Social Proof & Sidebar Elements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
           {!user && (
             <div className="bg-surface p-8 rounded-2xl border border-on-surface/5 space-y-5">
               <h3 className="text-2xl font-bold tracking-tight leading-tight text-on-surface">Присоединяйтесь</h3>
               <p className="text-sm text-on-surface-variant leading-relaxed">
                 Войдите, чтобы создавать контент, оставлять отзывы и участвовать в рейтинге сообщества.
               </p>
               <Link
                 href="/login"
                 className="block w-full py-3 bg-on-surface text-surface rounded-xl font-semibold text-center text-sm transition-all hover:opacity-90 active:scale-[0.98]"
               >
                 Войти
               </Link>
             </div>
           )}

          <div className="bg-surface-container-low p-8 rounded-2xl border border-on-surface/5">
            <h3 className="text-lg font-bold text-on-surface mb-6 tracking-tight">Лучшие авторы</h3>
            <div className="flex flex-col gap-5">
              {[
                { icon: 'auto_stories', name: 'Елена Радуга', detail: '203 отзыва · ★ 9.5' },
                { icon: 'movie_filter', name: 'Анастасия Волкова', detail: '142 отзыва · ★ 9.1' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-surface border border-on-surface/5 flex items-center justify-center transition-all group-hover:bg-surface-container">
                    <span className="material-symbols-outlined text-on-surface text-xl">{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-on-surface leading-tight">{item.name}</p>
                    <p className="text-xs font-medium text-on-surface-muted mt-0.5">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <BottomNavBar activeTab="home" />
    </>
  );
}
