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
    <div className="flex p-1.5 bg-on-surface/[0.03] backdrop-blur-xl rounded-2xl border border-on-surface/5 w-fit mb-8">
      <button
        onClick={() => onTabChange('catalog')}
        className={`relative px-6 py-2.5 rounded-xl text-[13px] font-black transition-all duration-300 ${
          activeTab === 'catalog' ? 'text-surface shadow-lg' : 'text-on-surface-muted hover:text-on-surface'
        }`}
      >
        <span className="relative z-10">{catalogLabel}</span>
        {activeTab === 'catalog' && (
          <motion.div
            layoutId="catalogTabActive"
            className="absolute inset-0 bg-on-surface rounded-xl z-0"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </button>

      <button
        onClick={() => onTabChange('mylist')}
        className={`relative px-6 py-2.5 rounded-xl text-[13px] font-black transition-all duration-300 flex items-center gap-2 ${
          activeTab === 'mylist' ? 'text-surface shadow-lg' : 'text-on-surface-muted hover:text-on-surface'
        }`}
      >
        <span className="relative z-10">{myListLabel}</span>
        {myListCount !== undefined && myListCount > 0 && (
          <span className={`relative z-10 text-[9px] px-1.5 py-0.5 rounded-full ${
            activeTab === 'mylist' ? 'bg-white/20' : 'bg-on-surface/10'
          }`}>
            {myListCount}
          </span>
        )}
        {activeTab === 'mylist' && (
          <motion.div
            layoutId="catalogTabActive"
            className="absolute inset-0 bg-on-surface rounded-xl z-0"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </button>
    </div>
  );
}
