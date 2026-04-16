'use client';

import React, { useEffect, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import Link from "next/link";
import { getApprovedContent } from "@/lib/db";
import { ContentItem } from "@/lib/types";

export default function Movies() {
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const allContent = await getApprovedContent();
      // To show "popular", could sort by rating if available, but for now just filter by movie type
      setMovies(allContent.filter(c => c.type === 'movie'));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <TopNavBar />
      <main className="pt-24 px-4 pb-32 max-w-lg mx-auto md:max-w-7xl">
        {/* Page Header */}
        <section className="py-8">
           <h1 className="text-6xl font-black tracking-tighter leading-none text-white mb-2">Все фильмы</h1>
           <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">
             кинотека сообщества
           </span>
        </section>

        {/* Movie Grid / Empty State */}
        {loading ? (
             <div className="flex justify-center p-12">
               <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             </div>
        ) : movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
             {/* Illustration Mockup */}
             <div className="relative mb-8">
                <div className="flex items-center justify-center gap-4 text-8xl grayscale opacity-40">
                   <span className="material-symbols-outlined text-9xl">movie_filter</span>
                   <span className="material-symbols-outlined text-9xl">potted_plant</span>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl font-black text-white/5 drop-shadow-2xl">0</div>
             </div>
             <p className="text-xl font-black text-white mb-3">Пока нет фильмов. Добавьте первый!</p>
             <Link 
               href="/create" 
               className="mt-6 px-8 py-4 glass-btn text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform"
             >
               Добавить фильм
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-12">
            {movies.map(movie => (
              <div key={movie.id} className="group flex flex-col">
                <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden bg-surface-container shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-primary/20">
                  {movie.imageUrl ? (
                    <img
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      src={movie.imageUrl}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-container-high border border-white/5">
                      <span className="material-symbols-outlined text-on-surface-variant text-4xl opacity-20">movie</span>
                    </div>
                  )}
                  {/* Rating Bubble */}
                  {movie.rating && (
                    <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10 shadow-lg">
                      <span className="material-symbols-outlined text-white text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-white text-[10px] font-black">{movie.rating}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-5 px-1">
                  <h4 className="font-black text-white text-base leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">{movie.title}</h4>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{movie.director || movie.author || 'Неизвестный режиссер'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNavBar activeTab="movies" />
    </>
  );
}
