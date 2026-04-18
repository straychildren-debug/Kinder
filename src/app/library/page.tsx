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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {displayBooks.map((book, index) => (
              <MotionListItem key={book.id} index={index} className="h-full">
                <button
                  className="w-full h-full flex flex-col group text-left outline-none bg-white p-3 rounded-[32px] border border-on-surface/5 shadow-sm hover:shadow-xl transition-all duration-500"
                  onClick={() => setSelectedContent(book)}
                >
                  {/* Fixed Aspect Ratio Poster */}
                  <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden bg-surface-container border border-on-surface/5 shadow-sm group-hover:scale-[1.02] transition-transform duration-500 mb-4 ring-1 ring-on-surface/5">
                    {book.rating && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 z-10">
                        <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1", fontSize: '10px' }}>star</span>
                        <span className="text-[10px] font-black text-white">{book.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {book.imageUrl ? (
                      <Image
                        src={book.imageUrl}
                        alt={book.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        placeholder="blur"
                        blurDataURL={defaultBlurDataURL}
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface/10 text-3xl">auto_stories</span>
                      </div>
                    )}
                  </div>

                  {/* Metadata Block */}
                  <div className="px-1 flex flex-col flex-1">
                    <h3 className="text-[11px] font-black text-[#1a1c1e] leading-tight line-clamp-2 uppercase tracking-tight group-hover:text-amber-600 transition-colors mb-1">
                      {book.title}
                    </h3>
                    <span className="text-[10px] font-bold text-on-surface-variant/40 truncate leading-none mb-3 block">
                      {book.author || 'Unknown Author'}
                    </span>
                    
                    {book.description && (
                      <p className="text-[10px] font-medium text-on-surface-variant/60 leading-normal line-clamp-2 mt-auto">
                        {book.description}
                      </p>
                    )}
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
      <BottomNavBar activeTab="books" />
    </>
  );
}
