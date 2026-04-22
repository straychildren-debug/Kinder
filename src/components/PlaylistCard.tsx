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
  'from-[#0F172A] via-[#1E293B] to-[#34495E]', // Deep Space
  'from-[#1E1B4B] via-[#312E81] to-[#4338CA]', // Indigo Night
  'from-[#022C22] via-[#064E3B] to-[#065F46]', // Emerald Deep
  'from-[#450A0A] via-[#7F1D1D] to-[#991B1B]', // Crimson Rose
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
        whileHover={{ y: -4, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="relative min-h-[160px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 group-hover:shadow-primary/20 transition-all duration-500 flex flex-row"
      >
        {/* Фоновый градиент (Mesh Effect) */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} z-0 opacity-90`} />
        
        {/* Абстрактные световые пятна для эффекта Mesh */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[120%] rounded-full bg-white/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[80%] rounded-full bg-primary/20 blur-[80px]" />

        {/* Если есть обложка, накладываем её поверх */}
        {playlist.coverUrl && (
          <div 
            className="absolute inset-0 z-10 bg-cover bg-center opacity-30 mix-blend-overlay grayscale group-hover:grayscale-0 transition-all duration-700"
            style={{ backgroundImage: `url(${playlist.coverUrl})` }}
          />
        )}

          <div className="relative z-20 flex flex-1 flex-row p-6 items-stretch gap-6">
            {/* Info Section (Left) */}
            <div className="flex-1 flex flex-col justify-center min-w-0 text-left">
              <h3 className="text-xl font-black text-white leading-tight mb-2 line-clamp-2 tracking-tight group-hover:text-primary transition-colors">
                {playlist.title}
              </h3>
              
              <div className="flex flex-row items-center gap-3">
                <div className="h-0.5 w-6 bg-primary rounded-full" />
                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                  {playlist.itemCount || 0} ЭЛЕМЕНТОВ
                </p>
              </div>
  
              {playlist.author && (
                <div className="mt-4 flex items-center justify-start gap-2">
                <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
                  {playlist.author.avatarUrl ? (
                    <img src={playlist.author.avatarUrl} alt={playlist.author.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-[10px] text-white">
                      {playlist.author.name[0]}
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-white/70">
                  @{playlist.author.name}
                </p>
              </div>
            )}
          </div>

            {/* Posters Gallery (Right) */}
            <div className="flex items-center justify-end shrink-0">
              {playlist.previewImages && playlist.previewImages.length > 0 ? (
                <div className="flex -space-x-3 sm:-space-x-4">
                  {playlist.previewImages.slice(0, 5).map((img, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-10 h-14 sm:w-16 sm:h-24 rounded-lg sm:rounded-xl border-2 border-white/20 overflow-hidden shadow-2xl transform transition-all group-hover:scale-110 group-hover:rotate-2 group-hover:shadow-primary/30"
                      style={{ zIndex: 10 - i }}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </motion.div>
                  ))}
                </div>
              ) : (
              <div className="w-32 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-white/20 text-3xl">collections</span>
              </div>
            )}
          </div>
        </div>

        {/* Floating Arrow (Desktop only) */}
        <div className="absolute top-1/2 -translate-y-1/2 right-6 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hidden md:flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 transition-all group-hover:right-8">
          <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            arrow_forward
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
