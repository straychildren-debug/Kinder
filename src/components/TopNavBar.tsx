'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import ProfileSidebar from './ProfileSidebar';
import OmniSearch from './OmniSearch';
import Link from 'next/link';
import Image from 'next/image';

interface TopNavBarProps {
  title?: string;
}

export default function TopNavBar({ title = 'Кинотека' }: TopNavBarProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  React.useEffect(() => {
    if (!user) return;
    
    // Initial fetch
    import('@/lib/notifications').then(({ getUnreadNotificationsCount, subscribeToNotifications }) => {
      getUnreadNotificationsCount(user.id).then(setUnreadCount);
      
      // Subscribe to new notifications
      const unsub = subscribeToNotifications(user.id, () => {
        setUnreadCount(prev => prev + 1);
      });
      return unsub;
    });
  }, [user]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-on-surface/5 px-4 md:px-8 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-on-surface text-surface rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
              <span className="text-lg md:text-xl font-black italic">K</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-black tracking-tighter text-on-surface uppercase leading-tight">
                Kinder
              </span>
              <span className="text-[7px] font-black text-on-surface-muted uppercase tracking-[0.3em] leading-none mb-0.5">
                сообщество
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-3 md:gap-6">
            {user && (
              <Link
                href="/create"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-accent-lilac/10 text-on-accent-lilac hover:bg-accent-lilac/30 transition-all border border-accent-lilac/10 shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px] md:text-[22px]">add</span>
              </Link>
            )}

            <button
              onClick={() => setSidebarOpen(true)}
              className="group relative flex items-center justify-center"
            >
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 z-10 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-lg shadow-red-500/20 border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {user?.avatarUrl ? (
                <div className="relative w-10 h-10 rounded-full border border-on-surface/5 group-hover:border-on-surface transition-all p-0.5 shadow-sm active:scale-95 overflow-hidden">
                  <Image
                    alt="Профиль"
                    src={user.avatarUrl}
                    fill
                    sizes="40px"
                    className="rounded-full object-cover"
                  />
                </div>
              ) : user ? (
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface font-black text-sm group-hover:bg-on-surface group-hover:text-surface transition-all border border-on-surface/5 shadow-sm active:scale-95">
                  {user.name.charAt(0)}
                </div>
              ) : (
                <span className="material-symbols-outlined text-on-surface-muted group-hover:text-on-surface text-[32px] transition-colors active:scale-95">
                  account_circle
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <ProfileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <OmniSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
