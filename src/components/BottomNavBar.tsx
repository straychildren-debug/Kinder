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
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-8 pt-4 bg-background/90 backdrop-blur-2xl border-t border-white/5 z-50 rounded-t-[32px] md:hidden">
      {/* Active Indicator Shadow/Pill */}
      <div 
        className="absolute h-14 bg-surface-container-high rounded-2xl transition-all duration-500 ease-out shadow-xl shadow-black/20"
        style={{ 
          width: '72px',
          left: `calc(4px + ${activeIndex * (100 / tabs.length)}% + (100% / ${tabs.length} - 72px) / 2)` 
        }}
      />
      
      {tabs.map(tab => (
        <Link key={tab.id} className={getTabClass(tab.id)} href={tab.href}>
          <span className="material-symbols-outlined text-[26px]" style={getIconStyle(tab.id)}>
            {tab.icon}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] mt-1.5 opacity-80">
            {tab.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
