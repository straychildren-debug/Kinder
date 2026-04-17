'use client';

import React, { useState, useEffect } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { useAuth } from "@/components/AuthProvider";
import { getContentByUser, getContentById } from "@/lib/db";
import { ContentItem } from "@/lib/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { defaultBlurDataURL } from "@/lib/image-blur";
import AwardsShelf from "@/components/AwardsShelf";
import WishlistShelf from "@/components/WishlistShelf";
import ContentDetailsModal from "@/components/ContentDetailsModal";
import QuickCreateForm from "@/components/QuickCreateForm";
import { motion, AnimatePresence } from "framer-motion";

type ProfileTab = 'publications' | 'moderation' | 'drafts';
type PublicationType = 'all' | 'movie' | 'book';

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  const [userContent, setUserContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openedContent, setOpenedContent] = useState<ContentItem | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('publications');
  const [pubFilter, setPubFilter] = useState<PublicationType>('all');

  const loadData = async () => {
    if (user) {
      const content = await getContentByUser(user.id);
      setUserContent(content);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

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

  const approvedCount = userContent.filter(c => c.status === 'approved').length;
  const moderationCount = userContent.filter(c => c.status === 'pending').length;
  const draftsCount = userContent.filter(c => c.status === 'draft' || c.status === 'rejected').length;

  const filteredContent = userContent.filter(item => {
    if (activeTab === 'publications') {
      const isApproved = item.status === 'approved';
      if (!isApproved) return false;
      if (pubFilter === 'all') return true;
      return item.type === pubFilter;
    }
    if (activeTab === 'moderation') return item.status === 'pending';
    if (activeTab === 'drafts') return item.status === 'draft' || item.status === 'rejected';
    return true;
  });

  const TABS = [
    { id: 'publications', label: 'Мои публикации', icon: 'auto_awesome', count: approvedCount },
    { id: 'moderation', label: 'На модерации', icon: 'pending_actions', count: moderationCount },
    { id: 'drafts', label: 'Черновики', icon: 'edit_note', count: draftsCount },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-on-surface/5 border-t-accent-lilac rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <TopNavBar />
      <main className="pt-20 pb-32 max-w-lg mx-auto">
        {/* Compact Private Header */}
        <section className="px-6 pb-6 pt-4 flex flex-col items-center">
          <div className="relative mb-6">
             <div className="w-32 h-32 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl relative">
              {user.avatarUrl ? (
                <Image alt={user.name} fill sizes="128px" className="object-cover" src={user.avatarUrl} />
              ) : (
                <div className="w-full h-full bg-accent-lilac/10 flex items-center justify-center text-4xl font-black text-accent-lilac uppercase">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            {user.role !== 'user' && (
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-on-surface/5">
                <span className="material-symbols-outlined text-accent-lilac text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            )}
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface leading-tight mb-1">{user.name}</h1>
            <p className="text-sm font-medium text-on-surface-muted">
              {user.role === 'superadmin' ? 'Создатель контента' : 'Участник сообщества'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 mb-8 w-full border-t border-b border-on-surface/5 py-5">
            <div className="text-center">
              <span className="block text-xl font-bold text-on-surface leading-none mb-1">{approvedCount}</span>
              <span className="text-[11px] font-medium text-on-surface-muted">Опубликовано</span>
            </div>
            <div className="text-center border-l border-r border-on-surface/5">
              <span className="block text-xl font-bold text-on-surface leading-none mb-1">{user.stats?.awards || 0}</span>
              <span className="text-[11px] font-medium text-on-surface-muted">Награды</span>
            </div>
            <div className="text-center">
              <span className="block text-xl font-bold text-on-surface leading-none mb-1">{(user.stats?.avgRating || 0).toFixed(1)}</span>
              <span className="text-[11px] font-medium text-on-surface-muted">Рейтинг</span>
            </div>
          </div>

          {/* QuickCreateForm was here, now only in TopNavBar plus button */}
        </section>

        {/* Dynamic Content System */}
        <section className="mt-4 px-4">
          {/* Sticky Tabs */}
          <div className="sticky top-[72px] z-20 bg-surface/80 backdrop-blur-md pt-6 mb-8 -mx-4 px-6 flex items-center gap-10 overflow-x-auto scrollbar-hide border-b border-on-surface/5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`relative pb-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-on-surface text-on-surface'
                    : 'border-transparent text-on-surface-muted hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] leading-none">
                  {tab.icon}
                </span>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                    activeTab === tab.id ? 'bg-on-surface text-surface' : 'bg-on-surface/10 text-on-surface-muted'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="profileTabUnderline" 
                    className="absolute bottom-[-3px] left-0 right-0 h-[3px] bg-on-surface" 
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Sub-filters for My Publications */}
          <AnimatePresence>
            {activeTab === 'publications' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-2 mb-6"
              >
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'movie', label: 'Кино' },
                  { id: 'book', label: 'Книги' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setPubFilter(filter.id as PublicationType)}
                    className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap ${
                      pubFilter === filter.id
                        ? 'bg-on-surface text-surface'
                        : 'bg-surface-container-low text-on-surface-muted hover:bg-surface-container'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* History Grid */}
          <div className="min-h-[400px]">
            {filteredContent.length === 0 ? (
              <div className="py-16 flex flex-col items-center text-center space-y-3 px-6 text-on-surface-muted">
                <span className="material-symbols-outlined text-5xl opacity-30">inventory_2</span>
                <p className="text-sm font-medium">Здесь пока ничего нет</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-x-3 gap-y-8">
                {filteredContent.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group cursor-pointer flex flex-col"
                    onClick={() => setOpenedContent(item)}
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-container">
                      {item.imageUrl ? (
                        <Image
                          alt={item.title}
                          src={item.imageUrl}
                          fill
                          sizes="200px"
                          placeholder="blur"
                          blurDataURL={defaultBlurDataURL}
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20 text-on-surface">
                          <span className="material-symbols-outlined text-4xl">{item.type === 'movie' ? 'movie' : 'menu_book'}</span>
                        </div>
                      )}

                      {/* Status Badges */}
                      {item.status === 'pending' && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-semibold z-10">
                          Модерация
                        </div>
                      )}

                      {item.status === 'rejected' && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-semibold z-10 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">close</span>
                          <span>Отказ</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 px-0.5">
                      <h4 className="text-xs font-semibold leading-snug tracking-tight line-clamp-2 text-on-surface">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-medium text-on-surface-muted truncate">
                          {item.type === 'movie' ? 'Кино' : 'Книга'}
                        </span>
                        {item.status === 'approved' && item.rating && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-on-surface/10" />
                            <div className="flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[11px] text-on-surface-muted" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              <span className="text-[11px] font-semibold">{item.rating.toFixed(1)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Existing Sections for non-empty state or bottom support */}
        <section className="px-6 mt-12 space-y-10">
            <div>
              <h2 className="text-sm font-semibold text-on-surface-variant mb-4">Избранное</h2>
              <WishlistShelf userId={user.id} onOpenContent={(c) => setOpenedContent(c)} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-on-surface-variant mb-4">Ваши достижения</h2>
              <AwardsShelf userId={user.id} />
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
