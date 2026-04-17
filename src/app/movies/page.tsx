'use client';

import React, { useEffect, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import Link from "next/link";
import { getApprovedContent } from "@/lib/db";
import { getWishlist } from "@/lib/wishlist";
import { useAuth } from "@/components/AuthProvider";
import { ContentItem } from "@/lib/types";
import ContentDetailsModal from "@/components/ContentDetailsModal";
import { ListSkeletonList } from "@/components/Skeleton";
import { MotionListItem } from "@/components/Motion";
import CatalogTabs, { CatalogTab } from "@/components/CatalogTabs";
import Image from "next/image";
import { defaultBlurDataURL } from "@/lib/image-blur";

export default function Movies() {
  const { user } = useAuth();
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [wishlistMovies, setWishlistMovies] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CatalogTab>('catalog');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const allContent = await getApprovedContent();
        setMovies(allContent.filter(c => c.type === 'movie'));

        if (user) {
          const wish = await getWishlist(user.id);
          const userMovies = wish
            .map(w => w.content)
            .filter((c): c is ContentItem => !!c && c.type === 'movie');
          setWishlistMovies(userMovies);
        }
      } catch (err) {
        console.error('Movies load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const displayMovies = activeTab === 'catalog' ? movies : wishlistMovies;

  return (
    <>
      <TopNavBar />
      <main className="pt-24 px-6 pb-32 max-w-lg mx-auto md:max-w-4xl">
        {/* Page Header */}
        <section className="py-8">
           <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Кинотека сообщества</span>
           <h1 className="text-2xl font-bold tracking-tight leading-tight text-on-surface">Все фильмы</h1>
        </section>

        {/* Tab Switcher */}
        {user && (
          <CatalogTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            catalogLabel="Каталог"
            myListLabel="Мой список"
            myListCount={wishlistMovies.length}
          />
        )}

        {/* Movie Grid / Empty State */}
        {loading ? (
          <ListSkeletonList count={6} />
        ) : displayMovies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
             <div className="relative mb-8">
                <div className="flex items-center justify-center gap-4 text-8xl grayscale opacity-20">
                   <span className="material-symbols-outlined text-9xl">
                     {activeTab === 'catalog' ? 'movie_filter' : 'bookmark_heart'}
                   </span>
                </div>
                {activeTab === 'catalog' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl font-black text-on-surface/5 drop-shadow-2xl">0</div>
                )}
             </div>
             <p className="text-xl font-black text-on-surface mb-3 tracking-tight">
               {activeTab === 'catalog' 
                 ? 'Пока нет фильмов. Добавьте первый!' 
                 : 'Ваш список фильмов пуст'}
             </p>
             {activeTab === 'catalog' ? (
               <Link 
                 href="/create" 
                 className="mt-6 px-6 py-3 bg-on-surface text-surface rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md shadow-on-surface/5 hover:scale-105 transition-transform"
               >
                 Добавить фильм
               </Link>
             ) : (
               <p className="text-xs text-on-surface-muted font-medium opacity-60">Сохраняйте интересное кино, чтобы посмотреть его позже</p>
             )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayMovies.map((movie, index) => (
              <MotionListItem key={movie.id} index={index}>
              <div
                className="group flex bg-surface p-5 rounded-2xl border border-on-surface/5 shadow-[0_4px_20_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1 cursor-pointer transform-gpu"
                onClick={() => setSelectedContent(movie)}
              >
                {/* Movie Poster */}
                <div className="relative w-[60px] h-[90px] flex-shrink-0 rounded-lg overflow-hidden bg-surface-container shadow-sm border border-on-surface/5">
                  {movie.imageUrl ? (
                    <Image
                      src={movie.imageUrl}
                      alt={movie.title}
                      fill
                      sizes="60px"
                      placeholder="blur"
                      blurDataURL={defaultBlurDataURL}
                      className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface/10 text-2xl">movie</span>
                    </div>
                  )}
                </div>
                
                {/* Movie Metadata */}
                <div className="ml-6 flex-1 flex flex-col h-[90px] min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-on-surface text-[15px] leading-tight mb-0.5 line-clamp-1 flex-1">
                        {movie.title}
                      </h4>
                      {movie.rating && (
                        <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
                          <span className="material-symbols-outlined text-accent-lilac leading-none" style={{ fontVariationSettings: "'FILL' 1", fontSize: '15px' }}>star</span>
                          <span className="text-on-surface text-[10px] font-bold leading-none">{movie.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mb-1.5 leading-none text-on-surface">
                      <p className="text-[11px] font-bold">
                        {movie.director || 'Неизвестный режиссер'}
                      </p>
                      {movie.year && (
                        <span className="text-[11px] text-on-surface/80 font-bold">
                          {movie.year}
                        </span>
                      )}
                    </div>
                    {movie.description && (
                      <div className="bg-on-surface/[0.04] -ml-2 px-2 py-1.5 rounded-lg mt-2">
                        <p className="text-[11px] text-on-surface font-semibold line-clamp-3 leading-[1.3] text-pretty">
                          {movie.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
      </main>
      <BottomNavBar activeTab="movies" />
    </>
  );
}
