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
              <div className="grid grid-cols-3 gap-x-3 gap-y-10">
                {filteredContent.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group cursor-pointer flex flex-col"
                    onClick={() => setOpenedContent(item)}
                  >
                    {/* Poster Container with 2/3 Aspect Ratio */}
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface-container-low/50 border border-on-surface/[0.03] shadow-[0_4px_12px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-300">
                      {/* Rating Label (Library Style) */}
                      {item.status === 'approved' && item.rating && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 z-10 shadow-lg">
                          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1", fontSize: '10px' }}>star</span>
                          <span className="text-[10px] font-black text-white">{item.rating.toFixed(1)}</span>
                        </div>
                      )}

                      {/* Status Badges (Top Left) */}
                      {item.status === 'pending' && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold z-10 shadow-lg border border-white/20">
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold z-10 shadow-lg">
                          ОЖИДАЕТ
                        </div>
                      )}

                      {item.status === 'rejected' && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-500 text-white text-[9px] font-bold z-10 shadow-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">block</span>
                          <span>ОТКАЗ</span>
                        </div>
                      )}

                      {item.imageUrl ? (
                        <Image
                          alt={item.title}
                          src={item.imageUrl}
                          fill
                          sizes="200px"
                          placeholder="blur"
                          blurDataURL={defaultBlurDataURL}
                          className="object-cover group-hover:scale-[1.05] transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20 text-on-surface">
                          <span className="material-symbols-outlined text-3xl">{item.type === 'movie' ? 'movie' : 'menu_book'}</span>
                        </div>
                      )}
                    </div>

                    {/* Simple Metadata (Library Style) */}
                    <div className="mt-2.5 px-0.5 flex flex-col">
                      <h4 className="text-[11px] font-bold text-on-surface leading-tight line-clamp-2 tracking-tight mb-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[10px] font-medium text-on-surface-variant/80 tracking-tight">
                          {item.type === 'movie' ? 'Кино' : 'Книга'}
                        </span>
                        <span className="w-0.5 h-0.5 rounded-full bg-on-surface-variant/30" />
                        <span className="text-[10px] font-medium text-on-surface-variant/80 truncate tracking-tight">
                          {(item as any).author || (item as any).director || 'Автор'}
                        </span>
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
