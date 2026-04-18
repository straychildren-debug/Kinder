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
               { label: 'Публикации', value: user.stats?.publications || 0 },
               { label: 'Награды', value: user.stats?.awards || 0 },
               { label: 'Рейтинг', value: (user.stats?.avgRating || 0).toFixed(1) }
             ].map((stat, i) => (
               <div key={i} className="flex flex-col">
                 <span className="text-xl font-black text-on-surface tracking-tighter">{stat.value}</span>
                 <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/50">{stat.label}</span>
               </div>
             ))}
          </div>

          {/* Navigation List */}
          <div className="bg-surface-container-low/30 rounded-[32px] border border-on-surface/[0.03] overflow-hidden">
            {[
              { id: 'pubs', label: 'Мои публикации', path: '/my-publications', icon: 'library_books', count: user.stats?.publications },
              { id: 'bookmarks', label: 'Закладки', path: '/bookmarks', icon: 'bookmark', count: null },
              { id: 'drafts', label: 'Черновики', path: '/drafts', icon: 'edit_note', count: null }
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
                  <span className="text-sm font-bold text-on-surface/90">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {item.count !== null && item.count > 0 && (
                    <span className="text-[10px] font-black text-on-surface-variant/40">{item.count}</span>
                  )}
                  <span className="material-symbols-outlined text-on-surface-variant/30 text-[18px] group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                </div>
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
