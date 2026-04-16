'use client';

import Link from 'next/link';
import React from 'react';

interface BottomNavBarProps {
  activeTab?: 'home' | 'books' | 'movies' | 'clubs' | 'users';
}

export default function BottomNavBar({ activeTab = 'home' }: BottomNavBarProps) {
  const getTabClass = (tab: string) => {
    if (tab === activeTab) {
      return 'relative flex flex-col items-center justify-center text-white px-5 py-2.5 transition-all duration-500 z-10';
    }
    return 'relative flex flex-col items-center justify-center text-on-surface-variant hover:text-white transition-all px-5 py-2.5';
  };

  const getIconStyle = (tab: string) => {
    return tab === activeTab ? { fontVariationSettings: "'FILL' 1" } : {};
  };

  const tabs = [
    { id: 'home', icon: 'home', label: 'Главная', href: '/' },
    { id: 'books', icon: 'menu_book', label: 'Книги', href: '/library' },
    { id: 'movies', icon: 'movie', label: 'Фильмы', href: '/movies' },
    { id: 'clubs', icon: 'groups', label: 'Клубы', href: '/clubs' },
    { id: 'users', icon: 'leaderboard', label: 'Рейтинг', href: '/leaderboard' },
  ];

  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-surface/80 backdrop-blur-2xl border-t border-black/5 z-50 md:hidden pb-safe">
      <div className="relative flex justify-between items-center px-4 py-3">
        {/* Active Indicator (Centered Pill) */}
        <div 
          className="absolute h-14 bg-on-surface rounded-[24px] transition-all duration-500 ease-out shadow-lg shadow-black/10"
          style={{ 
            width: '80px',
            left: `calc(1rem + ${activeIndex} * ((100% - 2rem) / ${tabs.length}) + (((100% - 2rem) / ${tabs.length}) - 80px) / 2)` 
          }}
        />
        
        {tabs.map(tab => (
          <Link 
            key={tab.id} 
            href={tab.href}
            className={`relative flex-1 flex flex-col items-center justify-center py-2 transition-all duration-300 z-10 ${
              tab.id === activeTab ? 'text-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[26px]" style={getIconStyle(tab.id)}>
              {tab.icon}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-90">
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
