'use client';

import React, { useState, useEffect } from 'react';
import { User, ContentItem, Review, WishlistItem } from '@/lib/types';
import { getContentByUser, getReviewsByUser, rateReview } from '@/lib/db';
import { getWishlist } from '@/lib/wishlist';
import { formatAuthor } from '@/lib/format';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useAuth } from './AuthProvider';

const defaultBlurDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

interface PublicProfileModalProps {
  user: User;
  onClose: () => void;
  onOpenContent?: (content: ContentItem) => void;
}

type TabType = 'publications' | 'bookmarks' | 'reviews';

export default function PublicProfileModal({ user, onClose, onOpenContent }: PublicProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('publications');
  const [publications, setPublications] = useState<ContentItem[]>([]);
  const [bookmarks, setBookmarks] = useState<WishlistItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const { user: currentUser } = useAuth();

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      try {
        const [pubs, wish, revs] = await Promise.all([
          getContentByUser(user.id),
          getWishlist(user.id),
          getReviewsByUser(user.id)
        ]);
        
        // Only show approved publications publicly
        setPublications(pubs.filter(p => p.status === 'approved'));
        setBookmarks(wish);
        setReviews(revs);
      } catch (err) {
        console.error('Error loading public profile data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, [user.id]);

  const handleRateReview = async (reviewId: string, rating: number) => {
    if (!currentUser) return;
    
    // Optimistic update
    if (selectedReview && selectedReview.id === reviewId) {
      const isRemoving = selectedReview.myVote === rating;
      const newVote = isRemoving ? 0 : rating;
      
      const updated = { ...selectedReview };
      
      // Remove old vote
      if (selectedReview.myVote === 5) updated.likesCount = Math.max(0, (updated.likesCount || 0) - 1);
      if (selectedReview.myVote === 1) updated.dislikesCount = Math.max(0, (updated.dislikesCount || 0) - 1);
      
      // Add new vote
      if (newVote === 5) updated.likesCount = (updated.likesCount || 0) + 1;
      if (newVote === 1) updated.dislikesCount = (updated.dislikesCount || 0) + 1;
      
      updated.myVote = newVote;
      setSelectedReview(updated);
      
      // Update in main list too
      setReviews(prev => prev.map(r => r.id === reviewId ? updated : r));
    }

    try {
      await rateReview(reviewId, currentUser.id, rating);
    } catch (err) {
      console.error('Error rating review:', err);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-safe">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg bg-surface rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-surface/80 backdrop-blur-md flex items-center justify-center text-on-surface-variant hover:bg-surface transition-colors border border-on-surface/5"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          {/* User Header */}
          <div className="p-6 pb-4 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-[28px] overflow-hidden border-2 border-white shadow-lg mb-4 relative">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.name} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-accent-lilac/5 flex items-center justify-center text-2xl font-black text-accent-lilac uppercase">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            <h2 className="text-xl font-black text-on-surface mb-1">{user.name}</h2>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
              {user.role === 'superadmin' ? 'Суперадмин' : user.role === 'admin' ? 'Администратор' : 'Участник сообщества'}
            </span>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-8 mt-6 w-full max-w-[280px]">
              <div className="flex flex-col items-center">
                <span className="text-base font-black text-on-surface leading-none mb-1">{publications.length}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/40">Публикации</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base font-black text-on-surface leading-none mb-1">{reviews.length}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/40">Отзывы</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base font-black text-on-surface leading-none mb-1">{reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0.0'}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/40">Рейтинг</span>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="px-6 mt-4 flex border-b border-on-surface/[0.03]">
            {[
              { id: 'publications', label: 'Публикации', count: publications.length },
              { id: 'bookmarks', label: 'Закладки', count: bookmarks.length },
              { id: 'reviews', label: 'Отзывы', count: reviews.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                  activeTab === tab.id ? 'text-primary' : 'text-on-surface-variant/40'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full bg-current/10 text-[9px] font-black`}>
                      {tab.count}
                    </span>
                  )}
                </div>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabPublic"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto min-h-[300px] bg-surface-container-lowest/30 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-3 border-on-surface/5 border-t-accent-lilac rounded-full animate-spin" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'publications' && (
                  <motion.div
                    key="pubs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-3 gap-1"
                  >
                    {publications.length === 0 ? (
                      <EmptyState icon="auto_stories" text="Нет публикаций" />
                    ) : (
                      publications.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item) => (
                        <ContentCard key={item.id} item={item} onClick={() => onOpenContent?.(item)} />
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === 'bookmarks' && (
                  <motion.div
                    key="wish"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-3 gap-1"
                  >
                    {bookmarks.length === 0 ? (
                      <EmptyState icon="bookmark" text="Список закладок пуст" />
                    ) : (
                      bookmarks.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((wish) => (
                        wish.content && <ContentCard key={wish.id} item={wish.content} onClick={() => onOpenContent?.(wish.content!)} />
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === 'reviews' && (
                  <motion.div
                    key="revs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {reviews.length === 0 ? (
                      <EmptyState icon="rate_review" text="Пользователь еще не оставлял отзывы" />
                    ) : (
                      reviews.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((review) => (
                        <ReviewItem key={review.id} review={review} onClick={() => setSelectedReview(review)} />
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Pagination Controls */}
          {!loading && (
            (() => {
              const currentListLength = activeTab === 'publications' ? publications.length : activeTab === 'bookmarks' ? bookmarks.length : reviews.length;
              const totalPages = Math.ceil(currentListLength / pageSize);
              
              if (totalPages <= 1) return null;
              
              return (
                <div className="px-6 py-4 bg-surface border-t border-on-surface/[0.03] flex items-center justify-between">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-full bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant disabled:opacity-20 transition-all active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-0.5">Страница</span>
                    <span className="text-xs font-black text-on-surface">{currentPage} <span className="text-on-surface-variant/30 mx-1">из</span> {totalPages}</span>
                  </div>
                  
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="w-10 h-10 rounded-full bg-on-surface/[0.03] flex items-center justify-center text-on-surface-variant disabled:opacity-20 transition-all active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              );
            })()
          )}
        </motion.div>

        {/* Full Review Sub-Modal */}
        <AnimatePresence>
          {selectedReview && (
            <div className="fixed inset-0 z-[2100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedReview(null)}
                className="fixed inset-0 bg-on-surface/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-sm bg-surface rounded-[32px] p-8 shadow-2xl overflow-hidden"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex gap-4">
                    {selectedReview.content && (
                      <div className="relative w-12 h-16 rounded-lg overflow-hidden shadow-md shrink-0 border border-on-surface/5">
                        <Image 
                          src={selectedReview.content.imageUrl || defaultBlurDataURL} 
                          alt={selectedReview.content.title} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-on-surface leading-tight mb-1">
                        {selectedReview.content?.title}
                      </h3>
                      <div className="flex items-center gap-1 text-accent-amber">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: i < (selectedReview.rating || 0) ? "'FILL' 1" : "'FILL' 0" }}>
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedReview(null)}
                    className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                <div className="max-h-[40vh] overflow-y-auto mb-8 pr-2 custom-scrollbar">
                  <p className="text-[15px] font-medium text-on-surface/90 leading-[1.6] italic">
                    «{selectedReview.text}»
                  </p>
                </div>

                {/* Interactive Capsule */}
                <div className="mb-8">
                  <div className="w-full flex items-center bg-on-surface/[0.03] backdrop-blur-xl rounded-full p-1.5 border border-on-surface/5">
                    {/* Voting */}
                    <div className="flex items-center flex-1 justify-around sm:justify-start sm:gap-8 px-4">
                      <button
                        onClick={() => handleRateReview(selectedReview.id, 5)}
                        disabled={!currentUser}
                        className={`flex items-center gap-2.5 transition-all hover:scale-110 ${
                          selectedReview.myVote === 5 ? 'text-primary' : 'text-on-surface-variant/40'
                        } ${!currentUser ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <span className="material-symbols-rounded text-[22px]" style={{ fontVariationSettings: selectedReview.myVote === 5 ? "'FILL' 1" : "'FILL' 0" }}>thumb_up</span>
                        <span className="text-sm font-black">{selectedReview.likesCount || 0}</span>
                      </button>
                      <button
                        onClick={() => handleRateReview(selectedReview.id, 1)}
                        disabled={!currentUser}
                        className={`flex items-center gap-2.5 transition-all hover:scale-110 ${
                          selectedReview.myVote === 1 ? 'text-red-500' : 'text-on-surface-variant/40'
                        } ${!currentUser ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <span className="material-symbols-rounded text-[22px]" style={{ fontVariationSettings: selectedReview.myVote === 1 ? "'FILL' 1" : "'FILL' 0" }}>thumb_down</span>
                        <span className="text-sm font-black">{selectedReview.dislikesCount || 0}</span>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-6 bg-on-surface/5 mx-2" />

                    {/* Comments Info - Now a button to open full content */}
                    <button 
                      type="button"
                      onClick={() => {
                        if (selectedReview.content) {
                          onOpenContent?.(selectedReview.content);
                          setSelectedReview(null);
                        }
                      }}
                      className="flex items-center gap-2.5 px-6 py-2.5 text-primary hover:bg-primary/10 rounded-full transition-all active:scale-95"
                    >
                      <span className="material-symbols-rounded text-[20px]">chat_bubble</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {selectedReview.commentCount || 0}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {selectedReview.content && (
                    <button
                      onClick={() => {
                        onOpenContent?.(selectedReview.content!);
                        setSelectedReview(null);
                      }}
                      className="w-full py-4 btn-premium rounded-2xl text-[10px] uppercase tracking-[0.2em]"
                    >
                      К произведению
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40"
                  >
                    Закрыть
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>,
    document.body
  );
}

function ContentCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col text-left outline-none"
    >
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-surface-container border border-on-surface/5 shadow-sm group">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="150px"
            placeholder="blur"
            blurDataURL={defaultBlurDataURL}
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
           <div className="w-full h-full flex items-center justify-center opacity-20">
             <span className="material-symbols-outlined">{item.type === 'movie' ? 'movie' : 'menu_book'}</span>
           </div>
        )}

        {/* Content Overlay */}
        <div className="absolute inset-x-0 bottom-0 pt-10 pb-2 px-2 bg-gradient-to-t from-black via-black/40 to-transparent z-10 transition-transform">
          <h4 className="text-[10px] font-bold text-white leading-tight line-clamp-2 tracking-tight">
            {item.title}
          </h4>
        </div>
      </div>
    </button>
  );
}

function ReviewItem({ review, onClick }: { review: Review; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/[0.02] backdrop-blur-md p-4 rounded-2xl border border-white/[0.05] shadow-sm hover:bg-white/[0.05] hover:border-white/[0.1] transition-all group"
    >
      <div className="flex gap-3 mb-3">
        {review.content && (
          <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-surface-container shrink-0 shadow-sm border border-on-surface/5">
            {review.content.imageUrl ? (
              <Image src={review.content.imageUrl} alt={review.content.title} fill sizes="40px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <span className="material-symbols-outlined text-[16px]">{review.content.type === 'movie' ? 'movie' : 'menu_book'}</span>
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-[10px] font-black text-on-surface truncate uppercase tracking-widest group-hover:text-primary transition-colors">{review.content?.title || 'Без названия'}</h4>
            {review.rating && (
               <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber">
                 <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                 <span className="text-[10px] font-black">{review.rating}</span>
               </div>
            )}
          </div>
          <span className="text-[8px] font-bold text-on-surface-variant/40 uppercase tracking-widest block">
            {new Date(review.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
      <p className="text-[11px] font-medium text-on-surface/80 leading-relaxed line-clamp-3 italic">
        «{review.text}»
      </p>
    </button>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="col-span-3 flex flex-col items-center justify-center py-12 text-center opacity-30">
      <span className="material-symbols-outlined text-4xl mb-2">{icon}</span>
      <p className="text-[10px] font-black uppercase tracking-widest">{text}</p>
    </div>
  );
}
