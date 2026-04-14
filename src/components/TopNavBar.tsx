'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import ProfileSidebar from './ProfileSidebar';
import Link from 'next/link';

interface TopNavBarProps {
  title?: string;
}

export default function TopNavBar({ title = 'Кинотека' }: TopNavBarProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-sm shadow-black/5 flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tighter text-[#2b3438] dark:text-slate-100">
              {title}
            </h1>
            <span className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-[0.2em]">
              Сообщество
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/create"
            className="p-2 text-[#575e70] dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors rounded-full"
          >
            <span className="material-symbols-outlined">add_circle</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
          >
            {user?.avatarUrl ? (
              <img
                alt="Профиль"
                src={user.avatarUrl}
                className="w-9 h-9 rounded-full border-2 border-surface-container-highest object-cover"
              />
            ) : user ? (
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0)}
              </div>
            ) : (
              <span className="material-symbols-outlined text-[#575e70] dark:text-slate-300 text-[28px]">
                account_circle
              </span>
            )}
          </button>
        </div>
      </header>

      <ProfileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
