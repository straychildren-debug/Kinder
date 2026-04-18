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
import { motion } from "framer-motion";
import { formatAuthor } from "@/lib/format";

export default function DraftsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [userContent, setUserContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openedContent, setOpenedContent] = useState<ContentItem | null>(null);

  const loadData = async () => {
    if (user) {
      const content = await getContentByUser(user.id);
      // Filter only drafts and rejected
      setUserContent(content.filter(item => item.status === 'draft' || item.status === 'rejected'));
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

  return (
    <>
      <TopNavBar title="Черновики" showBack={true} backPath="/profile" />
      <main className="pt-24 pb-32 max-w-lg mx-auto">
        <header className="px-6 mb-8 text-center">
          <h1 className="text-3xl font-black text-on-surface tracking-tighter uppercase mb-2">Черновики</h1>
          <p className="text-on-surface-variant text-sm font-medium">Ваши неопубликованные материалы</p>
        </header>

        <section className="px-4">
          <div className="min-h-[400px]">
            {userContent.length === 0 ? (
              <div className="py-20 flex flex-col items-center text-center space-y-4 px-6 text-on-surface-muted bg-surface-container-lowest/50 rounded-[32px] border border-dashed border-on-surface/5">
                <span className="material-symbols-outlined text-5xl opacity-20">edit_note</span>
                <p className="text-sm font-medium uppercase tracking-widest text-[10px]">У вас пока нет черновиков</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-x-1 gap-y-4">
                {userContent.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group cursor-pointer flex flex-col"
                    onClick={() => setOpenedContent(item)}
                  >
                    {/* Card with Backing (Library Style) */}
                    <div className="w-full bg-white p-1 pb-2.5 rounded-[12px] border border-on-surface/[0.03] shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all duration-500">
                      {/* Compact Poster */}
                      <div className="relative aspect-[2/3] w-full rounded-[8px] overflow-hidden bg-surface-container-low/50 border border-on-surface/[0.03]">
                        {item.status === 'rejected' && (
                          <div className="absolute top-1 left-1 px-1 py-0.5 rounded-sm bg-red-500 text-white text-[7px] font-bold z-10 shadow-lg flex items-center gap-1">
                            <span className="material-symbols-outlined text-[8px]">block</span>
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
                      <div className="mt-2 px-1 flex flex-col">
                        <h3 className="text-[10px] font-bold text-on-surface leading-tight line-clamp-2 tracking-tight mb-0.5 group-hover:text-primary transition-colors min-h-[2.4em]">
                          {item.title}
                        </h3>
                        <p className="text-[9px] font-medium text-on-surface-variant/80 truncate tracking-tight">
                          {formatAuthor((item as any).author || (item as any).director || '')}
                        </p>
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
