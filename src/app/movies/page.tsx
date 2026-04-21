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
import { formatAuthor } from "@/lib/format";

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
        <section className="pb-8 pt-0">
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
          <div className="grid grid-cols-3 gap-x-3 gap-y-6">
            {displayMovies.map((movie, index) => (
              <MotionListItem key={movie.id} index={index}>
                <button
                  className="group w-full flex flex-col text-left outline-none"
                  onClick={() => setSelectedContent(movie)}
                >
                  <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-surface-container border border-on-surface/5 shadow-sm group">
                    {movie.imageUrl ? (
                      <Image
                        src={movie.imageUrl}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 768px) 33vw, 25vw"
                        placeholder="blur"
                        blurDataURL={defaultBlurDataURL}
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-medium text-on-surface-muted">Нет обложки</div>
                    )}
                    <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md flex items-center gap-1.5 z-20 border border-white/10">
                      <span className="material-symbols-rounded text-white" style={{ fontSize: '11px', fontVariationSettings: "'FILL' 1" }}>movie</span>
                      <span className="text-[10px] font-black text-white leading-none uppercase tracking-widest">Кино</span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-20">
                      {/* Year Badge */}
                      {movie.year && (
                        <div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10">
                          <span className="text-[10px] font-black text-white leading-none">{movie.year}</span>
                        </div>
                      )}
                      {/* Rating Badge */}
                      {movie.rating && (
                        <div className="px-2 py-1 rounded-lg bg-amber-400 backdrop-blur-md flex items-center justify-center gap-1 border border-amber-500/20 shadow-lg shadow-amber-500/20">
                          <span className="material-symbols-rounded text-amber-950" style={{ fontSize: '10px', fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-[10px] font-black text-amber-950 leading-none">{movie.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-x-0 bottom-0 pt-20 pb-4 px-4 bg-gradient-to-t from-black via-black/40 to-transparent z-10">
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1 truncate leading-none">
                        {formatAuthor(movie.director || 'Неизвестный')}
                      </p>
                      <h3 className="text-sm md:text-base font-bold text-white leading-tight line-clamp-2 tracking-tight">
                        {movie.title}
                      </h3>
                    </div>
                  </div>
                </button>
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
