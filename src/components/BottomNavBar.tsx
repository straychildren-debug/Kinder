'use client';

import Link from 'next/link';
import React from 'react';

interface BottomNavBarProps {
  activeTab?: 'home' | 'books' | 'movies' | 'clubs' | 'users';
}

export default function BottomNavBar({ activeTab = 'home' }: BottomNavBarProps) {
  const getTabClass = (tab: string) => {
    if (tab === activeTab) {
      return 'flex flex-col items-center justify-center bg-[#575e70] text-white rounded-2xl px-4 py-2 scale-110 transition-all shadow-lg shadow-primary/30';
    }
    return 'flex flex-col items-center justify-center text-[#586065] dark:text-slate-400 px-4 py-2 opacity-60 hover:opacity-100 transition-opacity active:scale-90 duration-300';
  };

  const getIconStyle = (tab: string) => {
    return tab === activeTab ? { fontVariationSettings: "'FILL' 1" } : {};
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.04)] z-50 rounded-t-3xl md:hidden">
      <Link className={getTabClass('home')} href="/">
        <span className="material-symbols-outlined" style={getIconStyle('home')}>home</span>
        <span className="font-['Inter'] text-[10px] font-semibold uppercase tracking-widest mt-1">Главная</span>
      </Link>
      <Link className={getTabClass('books')} href="/library">
        <span className="material-symbols-outlined" style={getIconStyle('books')}>menu_book</span>
        <span className="font-['Inter'] text-[10px] font-semibold uppercase tracking-widest mt-1">Книги</span>
      </Link>
      <Link className={getTabClass('movies')} href="/movies">
        <span className="material-symbols-outlined" style={getIconStyle('movies')}>movie</span>
        <span className="font-['Inter'] text-[10px] font-semibold uppercase tracking-widest mt-1">Фильмы</span>
      </Link>
      <Link className={getTabClass('clubs')} href="/clubs">
        <span className="material-symbols-outlined" style={getIconStyle('clubs')}>groups</span>
        <span className="font-['Inter'] text-[10px] font-semibold uppercase tracking-widest mt-1">Клубы</span>
      </Link>
      <Link className={getTabClass('users')} href="/users">
        <span className="material-symbols-outlined" style={getIconStyle('users')}>leaderboard</span>
        <span className="font-['Inter'] text-[10px] font-semibold uppercase tracking-widest mt-1">Рейтинг</span>
      </Link>
    </nav>
  );
}
