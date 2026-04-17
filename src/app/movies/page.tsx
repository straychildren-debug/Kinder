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
           <h1 className="text-6xl font-black tracking-tighter leading-none text-on-surface mb-2">Все фильмы</h1>
           <span className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.3em]">
             кинотека сообщества
           </span>
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
                className="group flex bg-surface p-3.5 rounded-3xl border border-on-surface/5 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] cursor-pointer"
                onClick={() => setSelectedContent(movie)}
              >
                {/* Movie Poster */}
                <div className="relative w-20 aspect-[4/5] flex-shrink-0 rounded-xl overflow-hidden bg-on-surface/5 shadow-md">
                  {movie.imageUrl ? (
                    <Image
                      src={movie.imageUrl}
                      alt={movie.title}
                      fill
                      sizes="80px"
                      placeholder="blur"
                      blurDataURL={defaultBlurDataURL}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-2xl opacity-20">movie</span>
                    </div>
                  )}
                  {movie.rating && (
                    <div className="absolute top-1.5 right-1.5 bg-accent-lilac/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-white/50 shadow-sm">
                      <span className="material-symbols-outlined text-on-accent-lilac text-[9px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-on-accent-lilac text-[10px] font-black">{movie.rating}</span>
                    </div>
                  )}
                </div>
                
                {/* Movie Metadata */}
                <div className="ml-5 flex flex-col justify-center">
                  <h4 className="font-black text-on-surface text-lg leading-tight mb-1 group-hover:text-on-surface-variant transition-colors">
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {movie.year && (
                      <span className="text-[11px] font-black text-red-500 uppercase tracking-widest leading-none">
                        {movie.year}
                      </span>
                    )}
                    <span className="text-[11px] font-black text-on-surface-muted uppercase leading-none opacity-40">•</span>
                    <p className="text-[10px] font-black text-on-surface-muted tracking-widest leading-none">
                      {movie.director || 'Неизвестный режиссер'}
                    </p>
                  </div>
                  
                  {movie.actors && movie.actors.length > 0 && (
                    <p className="text-[10px] font-medium text-on-surface-variant/60 line-clamp-1">
                      В ролях: {movie.actors.join(', ')}
                    </p>
                  )}
                  
                  {movie.description && (
                    <p className="mt-2 text-xs text-on-surface-muted line-clamp-2 max-w-md opacity-70">
                      {movie.description}
                    </p>
                  )}
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
