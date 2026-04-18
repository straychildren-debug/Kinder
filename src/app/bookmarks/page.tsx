'use client';

import React, { useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import WishlistShelf from "@/components/WishlistShelf";
import ContentDetailsModal from "@/components/ContentDetailsModal";
import { ContentItem } from "@/lib/types";
import { motion } from "framer-motion";

export default function BookmarksPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [openedContent, setOpenedContent] = useState<ContentItem | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-on-surface/5 border-t-accent-lilac rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <TopNavBar title="Закладки" showBack={true} backPath="/profile" />
      <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[24px] bg-accent-lilac/5 text-accent-lilac mb-4">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
          </div>
          <h1 className="text-3xl font-black text-on-surface tracking-tighter uppercase">Закладки</h1>
          <p className="text-on-surface-variant text-sm font-medium mt-2">Ваша персональная коллекция</p>
        </header>

        <section className="min-h-[400px]">
          <WishlistShelf 
            userId={user.id} 
            onOpenContent={(c) => setOpenedContent(c)} 
          />
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
