'use client';

import React, { useEffect, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { getApprovedContent } from "@/lib/db";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { ContentItem } from "@/lib/types";

export default function Home() {
  const { user } = useAuth();
  const [approvedContent, setApprovedContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        {/* Category Tabs */}
        <section className="flex gap-3 overflow-x-auto scrollbar-hide py-4 mb-2">
          {['Новое сегодня', 'Все книги', 'Все фильмы', 'Клубы'].map((tab, i) => (
            <button 
              key={tab} 
              className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-[13px] font-bold tracking-tight transition-all active:scale-95 ${
                i === 0 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container text-on-surface-variant hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </section>

        {/* Community Feed Content */}
        <div className="flex flex-col gap-10">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : approvedContent.length === 0 ? (
            <div className="text-center py-20 px-6">
               <div className="text-6xl mb-4">🎬</div>
               <p className="text-on-surface-variant font-medium">Лента сообщества пока пуста</p>
            </div>
          ) : (
            <div className="space-y-10">
              {approvedContent.map((item, index) => (
                <article key={item.id} className="group relative">
                  {/* Content Image with Premium Overlay */}
                  <div className="relative aspect-[4/5] md:aspect-video w-full rounded-[32px] overflow-hidden shadow-2xl transition-all group-hover:shadow-primary/10">
                    <img
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms] ease-out"
                      alt={item.title}
                      src={item.imageUrl}
                    />
                    {/* Editorial Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e14] via-transparent to-black/20"></div>
                    
                    {/* Floating Info */}
                    <div className="absolute bottom-10 left-8 right-8">
                       <div className="flex items-center gap-2 mb-4">
                         <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] border border-white/10">
                           {item.type === 'movie' ? 'Кино' : 'Книга'}
                         </span>
                         {item.rating && (
                            <div className="bg-primary/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 border border-white/5">
                              <span className="material-symbols-outlined text-white text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              <span className="text-white text-[11px] font-black">{item.rating}</span>
                            </div>
                         )}
                       </div>
                       
                       <h2 className="text-4xl md:text-5xl font-black text-white leading-[0.9] tracking-tighter mb-4 group-hover:translate-x-2 transition-transform duration-500">
                         {item.title}
                       </h2>
                       
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-primary/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] font-black text-white">
                             {item.author?.charAt(0) || 'U'}
                           </div>
                           <div className="flex flex-col">
                             <span className="text-xs font-bold text-white">{item.author || 'Автор'}</span>
                             <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">{item.type === 'movie' ? 'Режиссер' : 'Писатель'}</span>
                           </div>
                         </div>
                         
                         <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-5 py-2 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10 transition-colors">
                            {item.type === 'movie' ? 'Трейлер' : 'Анонс'}
                         </button>
                       </div>
                    </div>
                  </div>

                  {/* Metadata & Description (Optional depending on design, in Stitch its simpler) */}
                  <div className="mt-8 px-4 flex justify-between items-start">
                    <div className="flex-1">
                       <div className="flex items-center gap-3 mb-2">
                          <div className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-[9px] font-bold text-primary">U</div>
                          <span className="text-xs font-bold text-on-surface-variant">Пользователь</span>
                       </div>
                       <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2 max-w-xl">
                         {item.description}
                       </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                       <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 text-on-surface-variant text-[11px] font-bold">
                            <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                            {item.likeCount || 0}
                          </span>
                          <span className="flex items-center gap-1.5 text-on-surface-variant text-[11px] font-bold">
                            <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                            {item.reviewCount || 0}
                          </span>
                       </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Social Proof & Sidebar Elements (Integrated into grid for desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
             {!user && (
               <div className="glass-card p-10 rounded-[32px] space-y-6">
                 <h3 className="text-3xl font-black tracking-tighter leading-none">Присоединяйтесь!</h3>
                 <p className="text-sm text-on-surface-variant leading-relaxed">
                   Войдите, чтобы создавать контент, оставлять рецензии и участвовать в рейтинге сообщества.
                 </p>
                 <Link
                   href="/login"
                   className="block w-full py-4 glass-btn text-white rounded-2xl font-black text-center text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-xl"
                 >
                   Войти
                 </Link>
               </div>
             )}

            <div className="bg-surface-container-low p-10 rounded-[32px]">
              <h3 className="text-xl font-bold mb-8">Лучшие авторы</h3>
              <div className="grid grid-cols-1 gap-8">
                {[
                  { icon: 'auto_stories', name: 'Елена Радуга', detail: '203 рецензии • ★ 9.5' },
                  { icon: 'movie_filter', name: 'Анастасия Волкова', detail: '142 рецензии • ★ 9.1' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[24px] bg-background border border-white/5 flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined text-primary text-3xl">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-base font-black tracking-tight">{item.name}</p>
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

      {/* FAB: Добавить контент */}
      {user && (
        <Link
          href="/create"
          className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-14 h-14 glass-btn rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform z-50"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>add</span>
        </Link>
      )}

      <BottomNavBar activeTab="home" />
    </>
  );
}
