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
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-black/5 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-on-surface uppercase italic">
              {title}
            </h1>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] -mt-1">
              сообщество
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">search</span>
          </button>
          
          {user && (
            <Link 
              href="/create" 
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all"
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
                className="w-10 h-10 rounded-full border border-black/5 group-hover:border-on-surface transition-all object-cover"
              />
            ) : user ? (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm group-hover:ring-4 group-hover:ring-primary/10 transition-all">
                {user.name.charAt(0)}
              </div>
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface text-[32px] transition-colors">
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
