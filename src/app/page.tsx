'use client';

import React, { useEffect, useState } from "react";
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

export default function Home() {
  const { user } = useAuth();
  const [approvedContent, setApprovedContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getApprovedContent();
      setApprovedContent(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <TopNavBar />
      <main className="pt-24 px-4 pb-32 max-w-lg mx-auto md:max-w-7xl">
        {/* Search Bar */}
        <section className="mb-8">
          <div className="relative group max-w-2xl mx-auto">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface transition-all text-[24px] pointer-events-none z-10">
              search
            </span>
            <input 
              type="text"
              placeholder="Поиск книг, фильмов или авторов..."
              className="w-full bg-surface-container border-2 border-on-surface/5 rounded-[28px] pl-16 pr-8 py-5 text-sm md:text-base font-medium focus:outline-none focus:border-accent-lilac focus:bg-white focus:shadow-2xl focus:shadow-accent-lilac/10 transition-all duration-300 placeholder:text-on-surface-variant/40 shadow-sm"
            />
          </div>
        </section>

        {/* Category Tabs */}
        <section className="flex gap-3 overflow-x-auto scrollbar-hide py-4 mb-2">
          {['Новое сегодня', 'Все книги', 'Все фильмы', 'Клубы'].map((tab, i) => (
            <button 
              key={tab} 
              className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-[13px] font-black tracking-tight transition-all active:scale-95 ${
                i === 0 ? 'bg-on-surface text-surface shadow-lg shadow-on-surface/10' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
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
            <div className="text-center py-20 px-6 bg-surface rounded-[32px] border border-on-surface/5">
               <div className="text-6xl mb-4 grayscale opacity-40">🎬</div>
               <p className="text-on-surface-variant font-black uppercase text-[10px] tracking-widest">Лента сообщества пока пуста</p>
            </div>
          ) : (
            <div className="space-y-10">
              {approvedContent.map((item, index) => (
                <MotionListItem key={item.id} index={index}>
                <article
                  onClick={() => setSelectedContent(item)}
                  className="group cursor-pointer overflow-hidden bg-surface rounded-[40px] border border-on-surface/5 shadow-xl hover:shadow-2xl transition-all duration-500"
                >
                  {/* Content Image - Clean and Visible */}
                  <div className="relative aspect-[3/2] md:aspect-video w-full overflow-hidden">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(min-width: 768px) 42rem, 100vw"
                        placeholder="blur"
                        blurDataURL={defaultBlurDataURL}
                        className="object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-out"
                      />
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-on-surface uppercase tracking-[0.2em] shadow-sm border border-white">
                        {item.type === 'movie' ? 'Кино' : 'Книга'}
                      </span>
                    </div>
                  </div>

                  {/* Editorial Content Card - Below the Image */}
                  <div className="relative -mt-8 mx-4 mb-4 p-8 rounded-[32px] bg-white/70 backdrop-blur-xl border border-white shadow-2xl glass-card">
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent-lilac border border-white shadow-inner flex items-center justify-center text-[12px] font-black text-on-accent-lilac">
                            {item.author?.charAt(0) || 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-on-surface tracking-tight">{item.author || 'Автор'}</span>
                            <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">
                              {item.type === 'movie' ? 'Режиссер' : 'Писатель'}
                            </span>
                          </div>
                       </div>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-on-surface leading-[0.9] tracking-tighter mb-6">
                      {item.title}
                    </h2>

                    <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2 font-medium mb-8 opacity-80">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-on-surface/5">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 group/btn">
                          <span className="material-symbols-outlined text-[20px] text-on-surface group-hover/btn:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 0" }}>favorite</span>
                          <span className="text-[12px] font-black text-on-surface">{item.likeCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 group/btn">
                          <span className="material-symbols-outlined text-[20px] text-on-surface group-hover/btn:scale-110 transition-transform">chat_bubble</span>
                          <span className="text-[12px] font-black text-on-surface">{item.reviewCount || 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-on-surface text-surface px-5 py-2.5 rounded-2xl shadow-lg shadow-on-surface/10">
                        <span className="material-symbols-outlined text-accent-lilac text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="text-[14px] font-black tracking-tight">{item.rating ? item.rating.toFixed(1) : '—'}</span>
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
               <div className="bg-surface p-10 rounded-[32px] border border-on-surface/5 space-y-6 shadow-sm">
                 <h3 className="text-3xl font-black tracking-tighter leading-none text-on-surface">Присоединяйтесь!</h3>
                 <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
                   Войдите, чтобы создавать контент, оставлять рецензии и участвовать в рейтинге сообщества.
                 </p>
                 <Link
                   href="/login"
                   className="block w-full py-4 bg-on-surface text-surface rounded-2xl font-black text-center text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-xl shadow-on-surface/10"
                 >
                   Войти
                 </Link>
               </div>
             )}

            <div className="bg-surface-container-low p-10 rounded-[32px] border border-on-surface/5">
              <h3 className="text-xl font-black text-on-surface mb-8 tracking-tight">Лучшие авторы</h3>
              <div className="grid grid-cols-1 gap-8">
                {[
                  { icon: 'auto_stories', name: 'Елена Радуга', detail: '203 рецензии • ★ 9.5' },
                  { icon: 'movie_filter', name: 'Анастасия Волкова', detail: '142 рецензии • ★ 9.1' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6 group cursor-pointer">
                    <div className="w-16 h-16 rounded-[24px] bg-surface border border-on-surface/5 flex items-center justify-center shadow-md transition-all group-hover:scale-105">
                      <span className="material-symbols-outlined text-on-surface text-3xl">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-base font-black tracking-tight text-on-surface">{item.name}</p>
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mt-1 opacity-60">
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
