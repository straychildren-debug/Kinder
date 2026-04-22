'use client';

import React, { useEffect, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { getApprovedContent, getApprovedContentCount } from "@/lib/db";
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
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 20;

export default function Library() {
  const { user } = useAuth();
  const [books, setBooks] = useState<ContentItem[]>([]);
  const [wishlistBooks, setWishlistBooks] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CatalogTab>('catalog');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // Fetch only approved books for the current page
        const [paginatedBooks, count] = await Promise.all([
          getApprovedContent({ type: 'book', page, pageSize: PAGE_SIZE }),
          getApprovedContentCount('book')
        ]);
        
        setBooks(paginatedBooks);
        setTotalItems(count);
        
        if (user && wishlistBooks.length === 0) {
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
  }, [user, page]); // Reload when page changes

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

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
          <div className="grid grid-cols-3 gap-x-3 gap-y-6">
            {displayBooks.map((book, index) => (
              <MotionListItem key={book.id} index={index}>
                <button
                  className="group w-full flex flex-col text-left outline-none"
                  onClick={() => setSelectedContent(book)}
                >
                  <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-surface-container border border-on-surface/5 shadow-sm group">
                    {book.imageUrl ? (
                      <Image
                        src={book.imageUrl}
                        alt={book.title}
                        fill
                        sizes="(max-width: 768px) 33vw, 25vw"
                        placeholder="blur"
                        blurDataURL={defaultBlurDataURL}
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-medium text-on-surface-muted">Нет обложки</div>
                    )}
                    
                    {/* Top Left: Category */}
                    <div className="absolute top-2 left-2 px-1.5 py-1 rounded-lg bg-black/60 backdrop-blur-md flex items-center gap-1 z-20 border border-white/10">
                      <span className="material-symbols-rounded text-white" style={{ fontSize: '10px', fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                      <span className="text-[9px] font-black text-white leading-none uppercase tracking-widest">Книга</span>
                    </div>

                    {/* Bottom Right: Rating */}
                    {book.rating && (
                      <div className="absolute bottom-2 right-2 px-1.5 py-1 rounded-lg bg-amber-400 flex items-center justify-center gap-1 shadow-lg shadow-amber-500/20 z-20">
                        <span className="material-symbols-rounded text-amber-950" style={{ fontSize: '10px', fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="text-[10px] font-black text-amber-950 leading-none">{book.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Text Content Below Image */}
                  <div className="pt-3 px-0.5">
                    <h3 className="text-[13px] font-bold text-on-surface leading-tight line-clamp-2 tracking-tight group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                  </div>
                </button>
              </MotionListItem>
            ))}
          </div>
        )}

        {activeTab === 'catalog' && (
          <Pagination 
            page={page} 
            total={totalPages} 
            onChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            ariaLabel="Пагинация книг"
          />
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
