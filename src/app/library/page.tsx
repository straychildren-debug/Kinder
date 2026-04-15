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
      <main className="pt-24 px-6 max-w-7xl mx-auto pb-24">
        {/* Hero Section */}
        <section className="mb-4">
          <div className="flex flex-col justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-6xl font-bold text-on-surface tracking-tighter leading-none mb-4">Библиотека смыслов</h2>
            </div>
          </div>
        </section>

        {/* Catalog Filter Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h3 className="text-2xl font-semibold tracking-tight">Все книги</h3>
        </div>

        {/* Book Grid */}
        {loading ? (
           <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : books.length === 0 ? (
          <p className="text-on-surface-variant">Пока нет книг. Добавьте первую!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
            {books.map(book => (
              <div key={book.id} className="group cursor-pointer">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-container-low mb-4 relative shadow-sm">
                  {book.imageUrl ? (
                    <img
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={book.imageUrl}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-container border-2 border-dashed border-outline-variant/30 rounded-xl">
                      <span className="material-symbols-outlined text-outline-variant">auto_stories</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 glass-button p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-sm">bookmark</span>
                  </div>
                </div>
                <h4 className="font-semibold text-sm mb-1 truncate">{book.title}</h4>
                <p className="text-xs text-on-surface-variant mb-2">{book.author || 'Неизвестный автор'}</p>
                {book.rating && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-primary">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    </div>
                    <span className="text-[11px] font-bold">{book.rating}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNavBar activeTab="books" />
    </>
  );
}
