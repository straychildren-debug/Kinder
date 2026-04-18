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
              {user.role === 'superadmin' ? 'Суперадмин' : user.role === 'admin' ? 'Создатель контента' : 'Участник сообщества'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 mb-8 w-full border-t border-b border-on-surface/5 py-5">
            <div className="text-center">
              <span className="block text-xl font-bold text-on-surface leading-none mb-1">{user.stats?.publications || 0}</span>
              <span className="text-[11px] font-medium text-on-surface-muted">Публикации</span>
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
        </section>

        {/* Simplified Profile Content */}
        <section className="px-6 mt-4 space-y-12">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-on-surface uppercase tracking-widest">Ваши достижения</h2>
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                   <span className="material-symbols-outlined text-lg">emoji_events</span>
                </div>
              </div>
              <AwardsShelf userId={user.id} />
            </div>

            <div className="p-6 rounded-[32px] bg-surface-container-low border border-on-surface/5 flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors"
                 onClick={() => router.push('/my-publications')}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-on-surface text-surface flex items-center justify-center">
                    <span className="material-symbols-outlined">library_books</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">Мои публикации</h3>
                    <p className="text-[11px] text-on-surface-muted uppercase font-bold tracking-widest mt-0.5">Перейти к управлению</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-muted group-hover:translate-x-1 transition-transform">chevron_right</span>
            </div>

            <div className="p-6 rounded-[32px] bg-surface-container-low border border-on-surface/5 flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors"
                 onClick={() => router.push('/bookmarks')}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent-lilac text-white flex items-center justify-center">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">Закладки</h3>
                    <p className="text-[11px] text-on-surface-muted uppercase font-bold tracking-widest mt-0.5">Вся ваша история</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-muted group-hover:translate-x-1 transition-transform">chevron_right</span>
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
