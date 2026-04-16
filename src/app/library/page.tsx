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
      <main className="pt-24 px-4 pb-32 max-w-lg mx-auto md:max-w-7xl">
        {/* Page Header */}
        <section className="py-8">
           <h1 className="text-6xl font-black tracking-tighter leading-none text-white mb-2">Все книги</h1>
           <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">
             каталог библиотеки
           </span>
        </section>

        {/* Book Grid */}
        {loading ? (
           <div className="flex justify-center p-12">
             <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 px-6 glass-card rounded-[32px]">
             <div className="text-6xl mb-4">📚</div>
             <p className="text-on-surface-variant font-medium">В библиотеке пока нет книг</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-12">
            {books.map(book => (
              <div key={book.id} className="group flex flex-col">
                <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden bg-surface-container shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-primary/20">
                  {book.imageUrl ? (
                    <img
                      alt={book.title}
                      className="w-full h-full object-cover"
                      src={book.imageUrl}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-container-high border border-white/5">
                      <span className="material-symbols-outlined text-on-surface-variant text-4xl opacity-20">auto_stories</span>
                    </div>
                  )}
                  {/* Rating Bubble */}
                  {book.rating && (
                    <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10 shadow-lg">
                      <span className="material-symbols-outlined text-white text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-white text-[10px] font-black">{book.rating}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-5 px-1">
                  <h4 className="font-black text-white text-base leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">{book.title}</h4>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{book.author || 'Неизвестный автор'}</p>
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
