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
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-accent-lilac/5 rounded-[32px] px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-on-surface uppercase">
              {title}
            </h1>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] -mt-1">
              сообщество
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            <button className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">search</span>
            </button>

            <NotificationsBell />

            {user && (
              <Link 
                href="/create" 
                className="w-10 h-10 rounded-full flex items-center justify-center bg-accent-lilac/30 text-on-accent-lilac hover:bg-accent-lilac/50 transition-all border border-accent-lilac/20 shadow-inner"
              >
                <span className="material-symbols-outlined text-[24px]">add</span>
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
                  className="w-10 h-10 rounded-full border border-accent-lilac/30 group-hover:border-on-surface transition-all object-cover"
                />
              ) : user ? (
                <div className="w-10 h-10 rounded-full bg-accent-lilac flex items-center justify-center text-on-accent-lilac font-black text-sm group-hover:ring-4 group-hover:ring-accent-lilac/20 transition-all border border-white/50 shadow-sm">
                  {user.name.charAt(0)}
                </div>
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface text-[32px] transition-colors">
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
