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

type ProfileTab = 'all' | 'movies' | 'books' | 'pending';

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  const [userContent, setUserContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openedContent, setOpenedContent] = useState<ContentItem | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('all');

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
  const pendingCount = userContent.filter(c => c.status === 'pending').length;

  const filteredContent = userContent.filter(item => {
    if (activeTab === 'all') return item.status === 'approved';
    if (activeTab === 'movies') return item.type === 'movie' && item.status === 'approved';
    if (activeTab === 'books') return item.type === 'book' && item.status === 'approved';
    if (activeTab === 'pending') return item.status === 'pending' || item.status === 'rejected';
    return true;
  });

  const TABS = [
    { id: 'all', label: 'Все', icon: 'grid_view' },
    { id: 'movies', label: 'Кино', icon: 'movie' },
    { id: 'books', label: 'Книги', icon: 'menu_book' },
    { id: 'pending', label: 'Мои черновики', icon: 'pending_actions', color: 'text-amber-500', count: pendingCount },
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

          <QuickCreateForm userId={user.id} onSuccess={loadData} />
        </section>

        {/* Dynamic Content System */}
        <section className="mt-4 px-4">
          {/* Sticky Tabs */}
          <div className="sticky top-[72px] z-20 bg-surface/80 backdrop-blur-md py-4 mb-6 -mx-4 px-4 flex items-center gap-2 overflow-x-auto scrollbar-hide border-b border-on-surface/5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`relative px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-on-surface text-surface shadow-lg' 
                    : 'bg-surface-container-low text-on-surface-muted hover:bg-surface-container'
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] ${activeTab !== tab.id && (tab as any).color ? (tab as any).color : ''}`}>
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

          {/* History Grid */}
          <div className="min-h-[400px]">
            {filteredContent.length === 0 ? (
              <div className="py-20 flex flex-col items-center text-center space-y-4 px-6 opacity-40">
                <span className="material-symbols-outlined text-6xl">inventory_2</span>
                <p className="text-xs font-black uppercase tracking-widest">Здесь пока ничего нет</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredContent.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group flex flex-col"
                    onClick={() => setOpenedContent(item)}
                  >
                    <div className="relative aspect-[3/4] rounded-[28px] overflow-hidden bg-surface-container border border-on-surface/5 shadow-sm group-active:scale-95 transition-all cursor-pointer">
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
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                          <span className="material-symbols-outlined text-4xl">{item.type === 'movie' ? 'movie' : 'menu_book'}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Interaction Layer */}
                      <div className="absolute inset-0 p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] bg-black/20">
                         <div className="flex justify-end">
                            <span className="bg-white/90 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-on-surface">Детали</span>
                         </div>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="flex items-center gap-1 mb-1 opacity-60">
                           <span className="material-symbols-outlined text-[12px]">{item.type === 'movie' ? 'movie' : 'menu_book'}</span>
                           <span className="text-[8px] font-black uppercase tracking-widest">{item.type === 'movie' ? 'Кино' : 'Книга'}</span>
                        </div>
                        <h4 className="text-sm font-black leading-tight tracking-tight line-clamp-2">{item.title}</h4>
                      </div>

                      {/* Status Badge for Moderation view */}
                      {activeTab === 'pending' && (
                        <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest shadow-xl ${
                          item.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {item.status === 'pending' ? 'Модерация' : 'Отклонено'}
                        </div>
                      )}
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
               <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-on-surface-variant opacity-40 mb-6">Ваши достижения</h2>
               <AwardsShelf userId={user.id} />
            </div>

            <div>
               <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-on-surface-variant opacity-40 mb-6">Список желаний</h2>
               <WishlistShelf userId={user.id} onOpenContent={(c) => setOpenedContent(c)} />
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
