'use client';

import React, { useState, useEffect } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { useAuth } from "@/components/AuthProvider";
import { getContentByUser } from "@/lib/db";
import { ContentItem } from "@/lib/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { defaultBlurDataURL } from "@/lib/image-blur";
import ContentDetailsModal from "@/components/ContentDetailsModal";
import { motion, AnimatePresence } from "framer-motion";

type ProfileTab = 'publications' | 'moderation' | 'drafts';
type PublicationType = 'all' | 'movie' | 'book';

export default function MyPublicationsPage() {
  const { user, isLoading } = useAuth();
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
    if (!isLoading && !user) {
        router.push('/login');
    }
    if (user) loadData();
  }, [user, isLoading]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-on-surface/5 border-t-accent-lilac rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

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
    { id: 'publications', label: 'Опубликовано', icon: 'auto_awesome', count: approvedCount },
    { id: 'moderation', label: 'На модерации', icon: 'pending_actions', count: moderationCount },
    { id: 'drafts', label: 'Черновики', icon: 'edit_note', count: draftsCount },
  ];

  return (
    <>
      <TopNavBar title="Мои публикации" />
      <main className="pt-24 pb-32 max-w-lg mx-auto">
        <header className="px-6 mb-8 text-center">
          <h1 className="text-3xl font-black text-on-surface tracking-tighter uppercase mb-2">Мои публикации</h1>
          <p className="text-on-surface-variant text-sm font-medium">Управление вашим контентом</p>
        </header>

        {/* Dynamic Content System */}
        <section className="px-4 overflow-hidden">
          {/* Sticky Tabs */}
          <div className="sticky top-[72px] z-20 bg-surface/80 backdrop-blur-md pt-4 mb-8 flex items-center justify-between border-b border-on-surface/5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`relative flex-1 pb-3 border-b-2 text-[12px] font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
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
                    layoutId="pubTabUnderline" 
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

          {/* List/Grid */}
          <div className="min-h-[400px]">
            {filteredContent.length === 0 ? (
              <div className="py-16 flex flex-col items-center text-center space-y-3 px-6 text-on-surface-muted">
                <span className="material-symbols-outlined text-5xl opacity-30">inventory_2</span>
                <p className="text-sm font-medium">Здесь пока ничего нет</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-x-3 gap-y-8">
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
                          Ожидает
                        </div>
                      )}

                      {item.status === 'rejected' && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-semibold z-10 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">block</span>
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
      </main>

      {openedContent && (
        <ContentDetailsModal
          content={openedContent}
          onClose={() => setOpenedContent(null)}
        />
      )}
      <BottomNavBar />
    </>
  );
}
