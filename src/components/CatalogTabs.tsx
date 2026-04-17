'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type CatalogTab = 'catalog' | 'mylist';

interface CatalogTabsProps {
  activeTab: CatalogTab;
  onTabChange: (tab: CatalogTab) => void;
  catalogLabel: string;
  myListLabel: string;
  myListCount?: number;
}

export default function CatalogTabs({
  activeTab,
  onTabChange,
  catalogLabel,
  myListLabel,
  myListCount
}: CatalogTabsProps) {
  return (
    <div className="flex gap-10 mb-10 border-b border-on-surface/5 overflow-x-auto whitespace-nowrap scrollbar-hide px-2 w-full">
      <button
        onClick={() => onTabChange('catalog')}
        className={`relative pb-4 border-b-[3px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
          activeTab === 'catalog' 
            ? 'border-on-surface text-on-surface' 
            : 'border-transparent text-on-surface-muted hover:text-on-surface hover:opacity-100'
        }`}
      >
        <span>{catalogLabel}</span>
        {activeTab === 'catalog' && (
          <motion.div
            layoutId="catalogTabUnderline"
            className="absolute bottom-[-3px] left-0 right-0 h-[3px] bg-on-surface"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </button>

      <button
        onClick={() => onTabChange('mylist')}
        className={`relative pb-4 border-b-[3px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 ${
          activeTab === 'mylist' 
            ? 'border-on-surface text-on-surface' 
            : 'border-transparent text-on-surface-muted hover:text-on-surface hover:opacity-100'
        }`}
      >
        <span>{myListLabel}</span>
        {myListCount !== undefined && myListCount > 0 && (
          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${
            activeTab === 'mylist' ? 'bg-on-surface text-surface' : 'bg-on-surface/10 text-on-surface-muted'
          }`}>
            {myListCount}
          </span>
        )}
        {activeTab === 'mylist' && (
          <motion.div
            layoutId="catalogTabUnderline"
            className="absolute bottom-[-3px] left-0 right-0 h-[3px] bg-on-surface"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </button>
    </div>
  );
}
