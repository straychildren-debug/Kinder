'use client';

import React, { useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { useAuth } from "@/components/AuthProvider";
import { ContentItem } from "@/lib/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AwardsShelf from "@/components/AwardsShelf";
import ContentDetailsModal from "@/components/ContentDetailsModal";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [openedContent, setOpenedContent] = useState<ContentItem | null>(null);
  const [counts, setCounts] = useState({
    publications: 0,
    bookmarks: 0,
    drafts: 0,
    awards: 0,
    reviews: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const loadProfileStats = async () => {
    if (!user) return;
    try {
      const [content, wishlist, reviews] = await Promise.all([
        import('@/lib/db').then(m => m.getContentByUser(user.id)),
        import('@/lib/wishlist').then(m => m.getWishlist(user.id)),
        import('@/lib/db').then(m => m.getReviewsByUser(user.id))
      ]);

      setCounts({
        publications: content.filter(i => i.status === 'approved').length,
        bookmarks: wishlist.length,
        drafts: content.filter(i => i.status === 'draft' || i.status === 'rejected').length,
        awards: user.stats?.awards || 0,
        reviews: reviews.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  React.useEffect(() => {
    if (user) loadProfileStats();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-on-surface/5 border-t-accent-lilac rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <TopNavBar />
        <main className="pt-24 pb-32 px-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-10">
          <div className="w-24 h-24 rounded-[32px] bg-surface-container flex items-center justify-center border border-on-surface/5 shadow-2xl relative">
             <div className="absolute inset-0 bg-accent-lilac/5 animate-pulse rounded-[32px]" />
             <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 relative">person</span>
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Ваш профиль</h2>
            <p className="text-on-surface-muted text-[13px] font-medium max-w-[240px] mx-auto leading-relaxed">
              Авторизуйтесь, чтобы видеть свои достижения и историю публикаций
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-on-surface text-surface rounded-xl font-semibold text-sm transition-transform active:scale-95"
          >
            Войти в систему
          </button>
        </main>
        <BottomNavBar />
      </>
    );
  }

  return (
    <>
      <TopNavBar />
      <main className="pt-20 pb-32 max-w-lg mx-auto">
        {/* Premium User Header */}
        <section className="px-6 pb-8 pt-6 flex flex-col items-center border-b border-on-surface/[0.03]">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-[36px] overflow-hidden border-2 border-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] relative">
              {user.avatarUrl ? (
                <Image alt={user.name} fill sizes="112px" className="object-cover" src={user.avatarUrl} />
              ) : (
                <div className="w-full h-full bg-accent-lilac/5 flex items-center justify-center text-3xl font-black text-accent-lilac uppercase tracking-tighter">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            {user.role !== 'user' && (
              <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-on-surface/[0.03]">
                <span className="material-symbols-outlined text-accent-lilac text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            )}
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight text-on-surface leading-tight mb-1">{user.name}</h1>
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60">
                {user.role === 'superadmin' ? 'Суперадмин' : user.role === 'admin' ? 'Создатель контента' : 'Участник сообщества'}
              </span>
            </div>
          </div>
        </section>

        {/* Unified Navigation Hub */}
        <section className="mt-8 px-6 space-y-10">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
             {[
               { label: 'Публикации', value: counts.publications },
               { label: 'Награды', value: counts.awards },
               { label: 'Рейтинг', value: (user.stats?.avgRating || 0).toFixed(1) }
             ].map((stat, i) => (
               <div key={i} className="flex flex-col items-center text-center">
                 <span className="text-xl font-black text-on-surface tracking-tighter leading-none mb-1">
                   {loadingStats ? '...' : stat.value}
                 </span>
                 <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/40 leading-none">{stat.label}</span>
               </div>
             ))}
          </div>

          {/* Navigation List */}
          <div className="bg-surface-container-low/30 rounded-[32px] border border-on-surface/[0.03] overflow-hidden">
            {[
              { id: 'pubs', label: 'Мои публикации', path: '/my-publications', icon: 'library_books', count: counts.publications },
              { id: 'reviews', label: 'Мои отзывы', path: '/my-reviews', icon: 'rate_review', count: counts.reviews },
              { id: 'twin', label: 'Двойник по вкусу', path: '/taste-twin', icon: 'diversity_2', count: 0 },
              { id: 'bookmarks', label: 'Закладки', path: '/bookmarks', icon: 'bookmark', count: counts.bookmarks },
              { id: 'drafts', label: 'Черновики', path: '/drafts', icon: 'edit_note', count: counts.drafts }
            ].map((item, i, arr) => (
              <button 
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center justify-between p-5 group transition-colors hover:bg-on-surface/[0.02] ${i !== arr.length - 1 ? 'border-b border-on-surface/[0.03]' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]" style={item.id === 'bookmarks' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                      {item.icon}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-on-surface/90">{item.label}</span>
                    {!loadingStats && item.count > 0 && (
                      <div className="min-w-[20px] h-[20px] px-1.5 flex items-center justify-center rounded-full bg-on-surface/[0.05] border border-on-surface/[0.03]">
                        <span className="text-[10px] font-black text-on-surface-variant/70">{item.count}</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant/30 text-[18px] group-hover:translate-x-0.5 transition-transform">chevron_right</span>
              </button>
            ))}
          </div>

          {/* Awards Section */}
          <div>
            <div className="flex items-center justify-between mb-5 px-1">
              <h2 className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-[0.2em]">Ваши достижения</h2>
              <div className="w-1.5 h-1.5 rounded-full bg-accent-lilac/30" />
            </div>
            <div className="bg-surface-container-low/30 rounded-[32px] border border-on-surface/[0.03] p-6">
              <AwardsShelf userId={user.id} />
            </div>
          </div>
        </section>
      </main>

      {openedContent && (
        <ContentDetailsModal
          content={openedContent}
          onClose={() => setOpenedContent(null)}
        />
      )}
      <BottomNavBar activeTab="profile" />
    </>
  );
}
