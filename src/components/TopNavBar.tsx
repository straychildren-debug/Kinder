'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import ProfileSidebar from './ProfileSidebar';
import NotificationsBell from './NotificationsBell';
import Link from 'next/link';

interface TopNavBarProps {
  title?: string;
}

export default function TopNavBar({ title = 'Кинотека' }: TopNavBarProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-on-surface/5 px-4 md:px-8 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-on-surface text-surface rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <span className="text-lg md:text-xl font-black italic">K</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-black tracking-tighter text-on-surface uppercase leading-none">
                Kinder
              </span>
              <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-[0.2em] opacity-60">
                сообщество
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-3 md:gap-6">
            <NotificationsBell />

            {user && (
              <Link 
                href="/create" 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-accent-lilac/20 text-on-accent-lilac hover:bg-accent-lilac/40 transition-all border border-accent-lilac/10 shadow-sm"
              >
                <span className="material-symbols-outlined text-[22px] md:text-[24px]">add</span>
              </Link>
            )}

            <button
              onClick={() => setSidebarOpen(true)}
              className="group relative flex items-center justify-center"
            >
              {user?.avatarUrl ? (
                <img
                  alt="Профиль"
                  src={user.avatarUrl}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-accent-lilac/20 group-hover:border-on-surface transition-all object-cover shadow-sm"
                />
              ) : user ? (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent-lilac flex items-center justify-center text-on-accent-lilac font-black text-xs md:text-sm group-hover:ring-4 group-hover:ring-accent-lilac/20 transition-all border border-white/50 shadow-sm">
                  {user.name.charAt(0)}
                </div>
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface text-[28px] md:text-[32px] transition-colors">
                  account_circle
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <ProfileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
