'use client';

import React, { useEffect, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { getApprovedContent } from "@/lib/db";
import { ContentItem } from "@/lib/types";

export default function Library() {
  const [books, setBooks] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const allContent = await getApprovedContent();
      setBooks(allContent.filter(c => c.type === 'book'));
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
           <h1 className="text-6xl font-black tracking-tighter leading-none text-on-surface mb-2">Все книги</h1>
           <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">
             каталог библиотеки
           </span>
        </section>

        {/* Books List (Horizontal Cards) */}
        {loading ? (
           <div className="flex justify-center p-12">
             <div className="w-10 h-10 border-4 border-on-surface border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 px-6 bg-surface rounded-[32px] border border-black/5 shadow-sm">
             <div className="text-6xl mb-4 grayscale opacity-40">📚</div>
             <p className="text-on-surface-variant font-black uppercase text-[10px] tracking-widest">В библиотеке пока нет книг</p>
          </div>
        ) : (
          <div className="space-y-4">
            {books.map(book => (
              <div key={book.id} className="group flex bg-surface p-4 rounded-[24px] border border-black/5 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] cursor-pointer">
                {/* Book Thumbnail */}
                <div className="relative w-20 aspect-[4/5] flex-shrink-0 rounded-[14px] overflow-hidden bg-black/5 shadow-md">
                  {book.imageUrl ? (
                    <img
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={book.imageUrl}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-2xl opacity-20">auto_stories</span>
                    </div>
                  )}
                  {book.rating && (
                    <div className="absolute top-1.5 right-1.5 bg-accent-lilac/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-white/50 shadow-sm">
                      <span className="material-symbols-outlined text-on-accent-lilac text-[9px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-on-accent-lilac text-[10px] font-black">{book.rating}</span>
                    </div>
                  )}
                </div>
                
                {/* Book Metadata */}
                <div className="ml-5 flex flex-col justify-center">
                  <h4 className="font-black text-on-surface text-lg leading-tight mb-1 group-hover:text-on-surface-variant transition-colors">
                    {book.title}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-wider">
                      {book.author || 'Неизвестный автор'}
                    </p>
                    {book.year && (
                      <span className="text-[11px] font-black text-on-surface-variant/40 uppercase tracking-wider">
                        • {book.year}
                      </span>
                    )}
                  </div>
                  {book.description && (
                    <p className="mt-2 text-xs text-on-surface-variant line-clamp-2 max-w-md opacity-70">
                      {book.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNavBar activeTab="books" />
    </>
  );
}
