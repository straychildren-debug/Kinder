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
          <div className="grid grid-cols-3 gap-x-1 gap-y-4 sm:gap-x-3 sm:gap-y-6">
            {displayMovies.map((movie, index) => (
              <MotionListItem key={movie.id} index={index}>
                <button
                  className="w-full flex flex-col group text-left outline-none"
                  onClick={() => setSelectedContent(movie)}
                >
                  {/* Card with Backing */}
                  <div className="w-full bg-white p-1 pb-2.5 rounded-[12px] border border-on-surface/[0.03] shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all duration-500">
                    {/* Compact Poster */}
                    <div className="relative aspect-[2/3] w-full rounded-[8px] overflow-hidden bg-surface-container-low/50 border border-on-surface/[0.03]">
                      {movie.rating && (
                        <div className="absolute top-1 right-1 px-1 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 z-10">
                          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1", fontSize: '8px' }}>star</span>
                          <span className="text-[8px] font-black text-white">{movie.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {movie.imageUrl ? (
                        <Image
                          src={movie.imageUrl}
                          alt={movie.title}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          placeholder="blur"
                          blurDataURL={defaultBlurDataURL}
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black opacity-20 uppercase">No Poster</div>
                      )}
                    </div>

                    {/* Simple Metadata */}
                    <div className="mt-2 px-1 flex flex-col">
                      <h3 className="text-[10px] font-bold text-on-surface leading-tight line-clamp-2 tracking-tight mb-0.5 group-hover:text-primary transition-colors min-h-[2.4em]">
                        {movie.title}
                      </h3>
                      <p className="text-[9px] font-medium text-on-surface-variant/80 truncate tracking-tight">
                        {formatAuthor(movie.director || 'Неизвестный')}
                      </p>
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
