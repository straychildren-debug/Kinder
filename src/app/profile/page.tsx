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
            <h2 className="text-3xl font-black tracking-tighter text-on-surface">Ваш профиль</h2>
            <p className="text-on-surface-muted text-[13px] font-medium max-w-[240px] mx-auto leading-relaxed">
              Авторизуйтесь, чтобы видеть свои достижения и историю публикаций
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-4 bg-on-surface text-surface rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-xl shadow-on-surface/10"
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
            <h1 className="text-3xl font-black tracking-tighter text-on-surface leading-none mb-2">{user.name}</h1>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-muted opacity-60">
              {user.role === 'superadmin' ? 'Создатель контента' : 'Участник сообщества'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 mb-8 w-full border-t border-b border-on-surface/5 py-6">
            <div className="text-center">
              <span className="block text-xl font-black text-on-surface leading-none mb-1">{approvedCount}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-muted">Опубликовано</span>
            </div>
            <div className="text-center border-l border-r border-on-surface/5">
              <span className="block text-xl font-black text-on-surface leading-none mb-1">{user.stats?.awards || 0}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-muted">Награды</span>
            </div>
            <div className="text-center">
               <span className="block text-xl font-black text-on-surface leading-none mb-1">{(user.stats?.avgRating || 0).toFixed(1)}</span>
               <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-muted">Рейтинг</span>
            </div>
          </div>

          {/* QuickCreateForm was here, now only in TopNavBar plus button */}
        </section>

        {/* Dynamic Content System */}
        <section className="mt-4 px-4">
          {/* Sticky Tabs */}
          <div className="sticky top-[72px] z-20 bg-surface/80 backdrop-blur-md pt-4 pb-2 mb-2 -mx-4 px-4 flex items-center gap-1.5 overflow-x-auto scrollbar-hide border-b border-on-surface/5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`relative px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id 
                    ? 'bg-on-surface text-surface shadow-lg' 
                    : 'bg-surface-container-low text-on-surface-muted hover:bg-surface-container'
                }`}
              >
                <span className={`material-symbols-outlined text-[16px]`}>
                  {tab.icon}
                </span>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[8px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-accent-lilac text-white'}`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div layoutId="active-tab" className="absolute inset-0 rounded-2xl border-2 border-on-surface/10 pointer-events-none" />
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
                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                      pubFilter === filter.id 
                        ? 'bg-accent-lilac text-white' 
                        : 'bg-surface-container text-on-surface-muted'
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
              <div className="py-20 flex flex-col items-center text-center space-y-4 px-6 opacity-40">
                <span className="material-symbols-outlined text-6xl">inventory_2</span>
                <p className="text-xs font-black uppercase tracking-widest">Здесь пока ничего нет</p>
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
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-surface-container border border-on-surface/5 shadow-sm group-hover:shadow-xl transition-all duration-500">
                      {item.imageUrl ? (
                        <Image
                          alt={item.title}
                          src={item.imageUrl}
                          fill
                          sizes="200px"
                          placeholder="blur"
                          blurDataURL={defaultBlurDataURL}
                          className="object-cover group-hover:scale-110 transition-transform duration-[1.5s]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20 text-on-surface">
                          <span className="material-symbols-outlined text-4xl">{item.type === 'movie' ? 'movie' : 'menu_book'}</span>
                        </div>
                      )}
                      
                      {/* Status Badges */}
                      {item.status === 'pending' && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[7px] font-black uppercase tracking-widest shadow-xl z-10">
                          Модерация
                        </div>
                      )}
                      
                      {item.status === 'rejected' && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg bg-red-500 text-white text-[7px] font-black uppercase tracking-widest shadow-xl z-10 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px] font-bold">close</span>
                          <span>Отказ</span>
                        </div>
                      )}

                      <div className="absolute top-2 right-2 z-10">
                        <div className="bg-white/80 backdrop-blur-md w-6 h-6 rounded-lg flex items-center justify-center border border-white shrink-0 shadow-sm">
                          <span className="material-symbols-outlined text-[12px] text-on-surface">
                            {item.type === 'movie' ? 'movie' : 'menu_book'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 px-1">
                      <h4 className="text-xs font-black leading-tight tracking-tight line-clamp-2 min-h-[2rem] text-on-surface group-hover:text-accent-lilac transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                         <span className="text-[9px] font-black text-on-surface-muted uppercase tracking-widest truncate">
                            {item.type === 'movie' ? 'Кино' : 'Книга'}
                         </span>
                         {item.status === 'approved' && item.rating && (
                           <>
                             <span className="w-1 h-1 rounded-full bg-on-surface/10" />
                             <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px] text-accent-lilac" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span className="text-[10px] font-black">{item.rating.toFixed(1)}</span>
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
        <section className="px-6 mt-16 space-y-12">
            <div>
               <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-on-surface-variant opacity-40 mb-6">Избранное</h2>
               <WishlistShelf userId={user.id} onOpenContent={(c) => setOpenedContent(c)} />
            </div>

            <div>
               <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-on-surface-variant opacity-40 mb-6">Ваши достижения</h2>
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
