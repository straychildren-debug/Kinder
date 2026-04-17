'use client';

import React, { useEffect, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
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

export default function Library() {
  const { user } = useAuth();
  const [books, setBooks] = useState<ContentItem[]>([]);
  const [wishlistBooks, setWishlistBooks] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CatalogTab>('catalog');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const allContent = await getApprovedContent();
        setBooks(allContent.filter(c => c.type === 'book'));
        
        if (user) {
          const wish = await getWishlist(user.id);
          const userBooks = wish
            .map(w => w.content)
            .filter((c): c is ContentItem => !!c && c.type === 'book');
          setWishlistBooks(userBooks);
        }
      } catch (err) {
        console.error('Library load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const displayBooks = activeTab === 'catalog' ? books : wishlistBooks;

  return (
    <>
      <TopNavBar />
      <main className="pt-24 px-4 pb-32 max-w-lg mx-auto md:max-w-4xl">
        {/* Page Header */}
        <section className="py-8">
           <h1 className="text-6xl font-black tracking-tighter leading-none text-on-surface mb-2">Все книги</h1>
           <span className="text-[10px] font-black text-on-surface-muted uppercase tracking-[0.3em]">
             каталог библиотеки
           </span>
        </section>

        {/* Tab Switcher */}
        {user && (
          <CatalogTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            catalogLabel="Каталог"
            myListLabel="Мой список"
            myListCount={wishlistBooks.length}
          />
        )}

        {/* Books List (Horizontal Cards) */}
        {loading ? (
          <ListSkeletonList count={6} />
        ) : displayBooks.length === 0 ? (
          <div className="text-center py-20 px-6 bg-surface rounded-3xl border border-on-surface/5 shadow-sm">
             <div className="text-6xl mb-4 grayscale opacity-40">
               {activeTab === 'catalog' ? '📚' : '🔖'}
             </div>
             <p className="text-on-surface-muted font-black uppercase text-[10px] tracking-widest leading-relaxed">
               {activeTab === 'catalog' 
                 ? 'В библиотеке пока нет книг' 
                 : 'Ваш список пуст — добавляйте интересное на будущее'
               }
             </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayBooks.map((book, index) => (
              <MotionListItem key={book.id} index={index}>
              <div
                className="group flex bg-surface p-3.5 rounded-3xl border border-on-surface/5 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] cursor-pointer"
                onClick={() => setSelectedContent(book)}
              >
                {/* Book Thumbnail */}
                <div className="relative w-20 aspect-[4/5] flex-shrink-0 rounded-xl overflow-hidden bg-on-surface/5 shadow-md">
                  {book.imageUrl ? (
                    <Image
                      src={book.imageUrl}
                      alt={book.title}
                      fill
                      sizes="80px"
                      placeholder="blur"
                      blurDataURL={defaultBlurDataURL}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
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
                  <div className="flex items-center gap-2 flex-wrap leading-none">
                    <p className="text-[11px] font-black text-on-surface-muted uppercase tracking-widest">
                      {book.author || 'Неизвестный автор'}
                    </p>
                    {book.year && (
                      <span className="text-[11px] font-black text-on-surface-muted uppercase tracking-widest opacity-40">
                        • {book.year}
                      </span>
                    )}
                  </div>
                  {book.description && (
                    <p className="mt-2 text-xs text-on-surface-muted line-clamp-2 max-w-md opacity-70">
                      {book.description}
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
      <BottomNavBar activeTab="books" />
    </>
  );
}
