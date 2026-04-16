'use client';

import React, { useEffect, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import Link from "next/link";
import { getApprovedContent } from "@/lib/db";
import { ContentItem } from "@/lib/types";
import ContentDetailsModal from "@/components/ContentDetailsModal";

export default function Movies() {
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

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
      <main className="pt-24 px-4 pb-32 max-w-lg mx-auto md:max-w-4xl">
        {/* Page Header */}
        <section className="py-8">
           <h1 className="text-6xl font-black tracking-tighter leading-none text-on-surface mb-2">Все фильмы</h1>
           <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">
             кинотека сообщества
           </span>
        </section>

        {/* Movie Grid / Empty State */}
        {loading ? (
             <div className="flex justify-center p-12">
               <div className="w-10 h-10 border-4 border-on-surface border-t-transparent rounded-full animate-spin"></div>
             </div>
        ) : movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
             {/* Illustration Mockup */}
             <div className="relative mb-8">
                <div className="flex items-center justify-center gap-4 text-8xl grayscale opacity-20">
                   <span className="material-symbols-outlined text-9xl">movie_filter</span>
                   <span className="material-symbols-outlined text-9xl">potted_plant</span>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl font-black text-on-surface/5 drop-shadow-2xl">0</div>
             </div>
             <p className="text-xl font-black text-on-surface mb-3 tracking-tight">Пока нет фильмов. Добавьте первый!</p>
             <Link 
               href="/create" 
               className="mt-6 px-8 py-4 bg-on-surface text-surface rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
             >
               Добавить фильм
             </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {movies.map(movie => (
              <div 
                key={movie.id} 
                className="group flex bg-surface p-4 rounded-[24px] border border-on-surface/5 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] cursor-pointer"
                onClick={() => setSelectedContent(movie)}
              >
                {/* Movie Poster */}
                <div className="relative w-20 aspect-[4/5] flex-shrink-0 rounded-[14px] overflow-hidden bg-on-surface/5 shadow-md">
                  {movie.imageUrl ? (
                    <img
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={movie.imageUrl}
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
                      <span className="text-[11px] font-black text-red-500 uppercase tracking-wider">
                        {movie.year}
                      </span>
                    )}
                    <span className="text-[11px] font-black text-on-surface-variant/40 uppercase tracking-wider">•</span>
                    <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-wider">
                      {movie.director || 'Неизвестный режиссер'}
                    </p>
                  </div>
                  
                  {movie.actors && movie.actors.length > 0 && (
                    <p className="text-[10px] font-medium text-on-surface-variant/60 line-clamp-1">
                      В ролях: {movie.actors.join(', ')}
                    </p>
                  )}
                  
                  {movie.description && (
                    <p className="mt-2 text-xs text-on-surface-variant line-clamp-2 max-w-md opacity-70">
                      {movie.description}
                    </p>
                  )}
                </div>
              </div>
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
