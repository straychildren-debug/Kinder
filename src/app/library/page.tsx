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
      <main className="pt-24 px-6 pb-32 max-w-lg mx-auto md:max-w-4xl">
        {/* Page Header */}
        <section className="pb-8 pt-0">
           <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Каталог библиотеки</span>
           <h1 className="text-2xl font-bold tracking-tight leading-tight text-on-surface">Все книги</h1>
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
                className="group flex bg-white p-5 rounded-[32px] border border-on-surface/5 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer items-start gap-5"
                onClick={() => setSelectedContent(book)}
              >
                {/* Book Thumbnail */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className="relative w-16 h-24 rounded-2xl overflow-hidden bg-surface-container border border-on-surface/5 shadow-lg group-hover:scale-105 transition-transform duration-500">
                    {book.imageUrl ? (
                      <Image
                        src={book.imageUrl}
                        alt={book.title}
                        fill
                        sizes="64px"
                        placeholder="blur"
                        blurDataURL={defaultBlurDataURL}
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface/10 text-2xl">auto_stories</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Book Metadata */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">
                        {book.year || '—'}
                      </span>
                    </div>
                    {book.rating && (
                      <div className="flex items-center gap-1.5 opacity-60">
                        <span className="material-symbols-outlined text-[14px] text-amber-500 fill-1">star</span>
                        <span className="text-[11px] font-black text-on-surface">{book.rating}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-on-surface truncate uppercase tracking-tighter leading-none mb-1 group-hover:text-on-surface transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant font-bold opacity-40 truncate mb-4">
                    {book.author || 'Неизвестный автор'}
                  </p>
                  
                  {book.description && (
                    <div className="p-4 bg-surface-container/30 rounded-[20px] border border-on-surface/5 relative group-hover:bg-surface-container/50 transition-colors">
                      <p className="text-[11px] font-medium text-on-surface-variant/70 leading-relaxed line-clamp-2">
                        {book.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="self-center shrink-0 w-10 h-10 rounded-full bg-surface-container/50 flex items-center justify-center opacity-30 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <span className="material-symbols-outlined text-[18px] text-on-surface">chevron_right</span>
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
