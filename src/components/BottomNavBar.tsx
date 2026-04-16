'use client';

import Link from 'next/link';
import React from 'react';
import { motion } from 'framer-motion';

interface BottomNavBarProps {
  activeTab?: 'home' | 'books' | 'movies' | 'clubs' | 'users';
}

export default function BottomNavBar({ activeTab = 'home' }: BottomNavBarProps) {
  const getIconStyle = (tab: string) => {
    return tab === activeTab ? { fontVariationSettings: "'FILL' 1" } : { fontVariationSettings: "'FILL' 0" };
  };

  const tabs = [
    { id: 'home', icon: 'home', label: 'Главная', href: '/' },
    { id: 'books', icon: 'menu_book', label: 'Книги', href: '/library' },
    { id: 'movies', icon: 'movie', label: 'Фильмы', href: '/movies' },
    { id: 'clubs', icon: 'groups', label: 'Клубы', href: '/clubs' },
    { id: 'users', icon: 'leaderboard', label: 'Рейтинг', href: '/leaderboard' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-3xl border-t border-on-surface/5 z-50 md:hidden pb-safe shadow-[0_-4px_20px_rgb(0,0,0,0.04)]">
      <div className="flex justify-around items-center px-4 py-3 gap-0">
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <Link 
              key={tab.id} 
              href={tab.href}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 transition-all duration-300`}
            >
              {isActive && (
                <motion.div 
                  layoutId="bottomNavHighlight"
                  className="absolute inset-x-2 inset-y-1 bg-accent-lilac/20 rounded-xl z-0"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              
              <span 
                className={`material-symbols-outlined text-[26px] z-10 transition-colors duration-300 ${
                  isActive ? 'text-[#6A5AE0] font-bold' : 'text-on-surface-variant/70'
                }`} 
                style={getIconStyle(tab.id)}
              >
                {tab.icon}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
