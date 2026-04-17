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
                className="group flex bg-surface p-5 rounded-2xl border border-on-surface/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1 cursor-pointer transform-gpu"
                onClick={() => setSelectedContent(book)}
              >
                {/* Book Thumbnail */}
                <div className="relative w-[60px] h-[90px] flex-shrink-0 rounded-lg overflow-hidden bg-surface-container shadow-sm border border-on-surface/5">
                  {book.imageUrl ? (
                    <Image
                      src={book.imageUrl}
                      alt={book.title}
                      fill
                      sizes="60px"
                      placeholder="blur"
                      blurDataURL={defaultBlurDataURL}
                      className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface/10 text-2xl">auto_stories</span>
                    </div>
                  )}
                </div>
                
                {/* Book Metadata */}
                <div className="ml-6 flex-1 flex flex-col h-[90px] min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-on-surface text-[15px] leading-tight mb-0.5 line-clamp-1 flex-1">
                        {book.title}
                      </h4>
                      {book.rating && (
                        <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
                          <span className="material-symbols-outlined text-accent-lilac leading-none flex items-center justify-center shrink-0" style={{ fontVariationSettings: "'FILL' 1", fontSize: '15px', width: '15px', height: '15px' }}>star</span>
                          <span className="text-on-surface text-[10px] font-bold leading-none">{book.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mb-1.5 leading-none text-on-surface">
                      <p className="text-[11px] font-bold">
                        {book.author || 'Неизвестный автор'}
                      </p>
                      {book.year && (
                        <span className="text-[11px] text-on-surface/80 font-bold">
                          {book.year}
                        </span>
                      )}
                    </div>
                    {book.description && (
                      <div className="bg-on-surface/[0.04] -ml-2 px-2 py-1.5 rounded-lg mt-2">
                        <p className="text-[11px] text-on-surface font-semibold line-clamp-3 leading-[1.3] text-pretty">
                          {book.description}
                        </p>
                      </div>
                    )}
                  </div>
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
