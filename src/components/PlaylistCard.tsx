'use client';

import React from 'react';
import Link from 'next/link';
import { Playlist } from '@/lib/playlists';
import { motion } from 'framer-motion';

interface PlaylistCardProps {
  playlist: Playlist;
  className?: string;
}

// Пакет премиальных градиентов (Mesh Gradients)
const GRADIENTS = [
  'from-[#450A0A] via-[#7F1D1D] to-[#991B1B]', // Crimson Heritage (Exact mockup color)
  'from-[#0F172A] via-[#1E293B] to-[#34495E]', // Deep Space
  'from-[#1E1B4B] via-[#312E81] to-[#4338CA]', // Indigo Night
  'from-[#022C22] via-[#064E3B] to-[#065F46]', // Emerald Deep
  'from-[#3B0764] via-[#581C87] to-[#701A75]', // Purple Haze
  'from-[#164E63] via-[#0891B2] to-[#0E7490]', // Oceanic Teal
];

export default function PlaylistCard({ playlist, className = '' }: PlaylistCardProps) {
  // Выбираем градиент на основе ID плейлиста для консистентности
  const gradientIndex = React.useMemo(() => {
    if (!playlist.id) return 0;
    const charCodeSum = playlist.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return charCodeSum % GRADIENTS.length;
  }, [playlist.id]);

  const gradient = GRADIENTS[gradientIndex];

  return (
    <Link href={`/playlists/${playlist.id}`} className={`block group ${className}`}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 group-hover:shadow-primary/20 transition-all duration-500"
      >
        {/* Фоновый градиент (Premium Mesh) */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} z-0 opacity-95 group-hover:opacity-100 transition-opacity`} />
        
        {/* Абстрактные световые эффекты */}
        <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[120%] rounded-full bg-white/5 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[80%] rounded-full bg-primary/10 blur-[80px]" />

        {/* Content Container (Vertical Stack as per mockup) */}
        <div className="relative z-20 flex flex-col p-6 sm:p-7 gap-5">
          {/* TITLE - Top Level, Full Width */}
          <div className="w-full">
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight group-hover:text-white transition-colors">
              {playlist.title}
            </h3>
          </div>

          {/* LOWER SECTION - Metadata & Posters */}
          <div className="flex flex-row items-end justify-between gap-4">
            {/* Info Section (Left) */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-row items-center gap-3">
                <div className="h-0.5 w-6 bg-accent-neon rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                  {playlist.itemCount || 0} ЭЛЕМЕНТОВ
                </p>
              </div>

              {playlist.author && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 shadow-sm">
                    {playlist.author.avatarUrl ? (
                      <img src={playlist.author.avatarUrl} alt={playlist.author.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center text-[10px] text-white">
                        {playlist.author.name[0]}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-white/60 lowercase">
                    @{playlist.author.name.replace(/\s+/g, '').toLowerCase()}
                  </p>
                </div>
              )}
            </div>

            {/* Posters Gallery (Right) */}
            <div className="flex items-center justify-end shrink-0 pl-4">
              {playlist.previewImages && playlist.previewImages.length > 0 ? (
                <div className="flex -space-x-4">
                  {playlist.previewImages.slice(0, 5).map((img, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-10 h-14 sm:w-16 sm:h-24 rounded-lg border border-white/20 overflow-hidden shadow-2xl transform transition-all group-hover:scale-110 group-hover:shadow-primary/30"
                      style={{ zIndex: 10 - i }}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="w-16 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/20 text-3xl">collections</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Glossy Overlay effect */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-tr from-white/10 via-transparent to-white/5" />
      </motion.div>
    </Link>
  );
}
