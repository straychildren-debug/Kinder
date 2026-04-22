'use client';

import Link from 'next/link';
import React from 'react';
import { motion } from 'framer-motion';

interface BottomNavBarProps {
  activeTab?: 'home' | 'books' | 'movies' | 'clubs' | 'users' | 'profile';
}

export default function BottomNavBar({ activeTab = 'home' }: BottomNavBarProps) {
  const tabs = [
    { id: 'home', icon: 'home', label: 'Главная', href: '/' },
    { id: 'books', icon: 'menu_book', label: 'Книги', href: '/library' },
    { id: 'movies', icon: 'movie', label: 'Фильмы', href: '/movies' },
    { id: 'clubs', icon: 'forum', label: 'Сообщество', href: '/clubs' },
    { id: 'users', icon: 'leaderboard', label: 'Рейтинг', href: '/leaderboard' },
  ];

  return (
    <nav className="fixed bottom-safe left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50 md:hidden pb-4">
      <div className="glass-panel neon-border rounded-3xl flex justify-between items-center px-2 py-2 overflow-hidden shadow-2xl">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Link 
              key={tab.id} 
              href={tab.href}
              className="relative flex-1 flex flex-col items-center justify-center py-2.5 outline-none group"
            >
              {isActive && (
                <motion.div 
                  layoutId="navTabHighlight"
                  className="absolute inset-1 bg-accent-neon/20 rounded-2xl z-0"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {isActive && (
                <motion.div 
                   layoutId="navTabGlow"
                   className="absolute -bottom-1 w-6 h-1 bg-accent-neon rounded-t-full shadow-[0_0_8px_rgba(168,85,247,0.8)] z-0" 
                   initial={false}
                   transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              
              <span 
                className={`material-symbols-outlined text-[24px] z-10 transition-colors duration-300 ${
                  isActive ? 'text-accent-neon neon-text-glow scale-110' : 'text-on-surface-muted group-hover:text-on-surface-variant'
                }`} 
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
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
