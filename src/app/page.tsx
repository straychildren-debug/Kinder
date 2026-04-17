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
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-on-surface/5 shadow-2xl shadow-black/10 z-40 overflow-hidden max-h-[60vh] overflow-y-auto">
                {searching && !hasResults ? (
                  <div className="flex items-center justify-center py-8 gap-3 text-on-surface-muted">
                    <div className="w-4 h-4 border-2 border-on-surface/10 border-t-on-surface/50 rounded-full animate-spin" />
                    <span className="text-xs font-medium">Поиск...</span>
                  </div>
                ) : !hasResults ? (
                  <div className="py-8 text-center text-xs font-medium text-on-surface-muted">Ничего не найдено</div>
                ) : (
                  <div className="divide-y divide-on-surface/5">
                    {results.content.length > 0 && (
                      <div className="p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-on-surface/30 px-2 mb-2">Контент</p>
                        {results.content.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => { setSelectedContent(item); setQuery(''); setResults(EMPTY_RESULTS); }}
                            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface-container transition-all text-left group"
                          >
                            <div className="relative w-9 h-12 rounded-lg overflow-hidden bg-surface-container shrink-0">
                              {item.imageUrl
                                ? <Image src={item.imageUrl} alt={item.title} fill sizes="36px" className="object-cover" />
                                : <span className="text-[8px] font-black text-on-surface/20 flex items-center justify-center h-full">NA</span>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black tracking-tight truncate">{item.title}</p>
                              <p className="text-[10px] text-on-surface-muted truncate">{item.author || item.director || ''}</p>
                            </div>
                            <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-on-surface/20 shrink-0">{item.type === 'movie' ? 'Кино' : 'Книга'}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {results.clubs.length > 0 && (
                      <div className="p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-on-surface/30 px-2 mb-2">Клубы</p>
                        {results.clubs.map((club) => (
                          <Link
                            key={club.id}
                            href={`/clubs/${club.id}`}
                            onClick={() => { setQuery(''); setResults(EMPTY_RESULTS); }}
                            className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface-container transition-all"
                          >
                            <span className="material-symbols-outlined text-on-surface/30 text-[20px]">groups</span>
                            <div className="min-w-0">
                              <p className="text-sm font-black tracking-tight truncate">{club.name}</p>
                              <p className="text-[10px] text-on-surface-muted">{club.memberCount} участников</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {results.users.length > 0 && (
                      <div className="p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-on-surface/30 px-2 mb-2">Люди</p>
                        {results.users.map((u) => (
                          <div key={u.id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface-container transition-all">
                            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs font-black text-on-surface/40 shrink-0">
                              {(u.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <p className="text-sm font-black tracking-tight truncate">{u.name}</p>
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

        {/* Category Tabs */}
        <section className="flex gap-3 overflow-x-auto scrollbar-hide py-4 mb-4">
          {['Все', 'Кино', 'Книги', 'Клубы'].map((tab, i) => (
            <button 
              key={tab} 
              className={`flex-1 whitespace-nowrap px-3 py-2 rounded-xl text-[11px] font-black tracking-tight transition-all active:scale-95 ${
                i === 0 ? 'bg-on-surface text-surface shadow-lg shadow-on-surface/10' : 'bg-surface-container text-on-surface-muted hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {tab}
            </button>
          ))}
        </section>

        {/* Community Feed Content */}
        <div className="flex flex-col gap-10">
          {loading ? (
            <FeedSkeletonList count={3} />
          ) : approvedContent.length === 0 ? (
            <div className="text-center py-20 px-6 bg-surface rounded-3xl border border-on-surface/5">
               <div className="text-6xl mb-4 grayscale opacity-40">🎬</div>
               <p className="text-on-surface-variant font-black uppercase text-[10px] tracking-widest">Лента сообщества пока пуста</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-10">
              {approvedContent.map((item, index) => (
                <MotionListItem key={item.id} index={index}>
                <article
                  onClick={() => setSelectedContent(item)}
                  className="group cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-surface-container border border-on-surface/5 shadow-sm group-hover:shadow-xl transition-all duration-500">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(min-width: 1024px) 20rem, 50vw"
                        placeholder="blur"
                        blurDataURL={defaultBlurDataURL}
                        className="object-cover group-hover:scale-110 transition-transform duration-[1500ms] ease-out"
                      />
                    )}
                    <div className="absolute top-2 right-2">
                       <div className="bg-white/80 backdrop-blur-md w-7 h-7 rounded-lg flex items-center justify-center border border-white shrink-0 shadow-sm">
                          <span className="material-symbols-outlined text-[14px] text-on-surface">
                            {item.type === 'movie' ? 'movie' : 'menu_book'}
                          </span>
                       </div>
                    </div>
                  </div>

                  <div className="mt-4 px-1">
                    <h3 className="text-sm font-black text-on-surface leading-tight tracking-tight mb-1 line-clamp-2 min-h-[2.5rem] group-hover:text-accent-lilac transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest truncate max-w-[70%]">
                        {item.author || item.director || 'Автор'}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                         <span className="material-symbols-outlined text-[12px] text-accent-lilac" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                         <span className="text-[11px] font-black">{item.rating ? item.rating.toFixed(1) : '—'}</span>
                      </div>
                    </div>
                  </div>
                </article>
                </MotionListItem>
              ))}
            </div>
          )}

          {/* Details Modal */}
          {selectedContent && (
            <ContentDetailsModal 
              content={selectedContent} 
              onClose={() => setSelectedContent(null)} 
            />
          )}

          {/* Лента активности сообщества */}
          <ActivityFeed />

          {/* Social Proof & Sidebar Elements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
             {!user && (
               <div className="bg-surface p-10 rounded-3xl border border-on-surface/5 space-y-6 shadow-sm">
                 <h3 className="text-3xl font-black tracking-tighter leading-none text-on-surface">Присоединяйтесь!</h3>
                 <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                   Войдите, чтобы создавать контент, оставлять отзывы и участвовать в рейтинге сообщества.
                 </p>
                 <Link
                   href="/login"
                   className="block w-full py-4 bg-on-surface text-surface rounded-2xl font-black text-center text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-xl shadow-on-surface/10"
                 >
                   Войти
                 </Link>
               </div>
             )}

            <div className="bg-surface-container-low p-10 rounded-3xl border border-on-surface/5">
              <h3 className="text-xl font-black text-on-surface mb-8 tracking-tight">Лучшие авторы</h3>
              <div className="grid grid-cols-1 gap-8">
                {[
                  { icon: 'auto_stories', name: 'Елена Радуга', detail: '203 отзыва • ★ 9.5' },
                  { icon: 'movie_filter', name: 'Анастасия Волкова', detail: '142 отзыва • ★ 9.1' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6 group cursor-pointer">
                    <div className="w-16 h-16 rounded-xl bg-surface border border-on-surface/5 flex items-center justify-center shadow-sm transition-all group-hover:scale-105">
                      <span className="material-symbols-outlined text-on-surface text-3xl">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-base font-black tracking-tight text-on-surface leading-none mb-1">{item.name}</p>
                      <p className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest mt-1">
                         {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNavBar activeTab="home" />
    </>
  );
}
