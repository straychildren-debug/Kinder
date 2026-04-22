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
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 group-hover:shadow-primary/20 transition-shadow duration-500"
      >
        {/* Фоновый градиент (Mesh Effect) */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} z-0 opacity-90`} />
        
        {/* Абстрактные световые пятна для эффекта Mesh */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/10 blur-[80px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[60px]" />

        {/* Если есть обложка, накладываем её поверх градиента с прозрачностью */}
        {playlist.coverUrl && (
          <div 
            className="absolute inset-0 z-10 bg-cover bg-center opacity-40 mix-blend-overlay grayscale group-hover:grayscale-0 transition-all duration-700"
            style={{ backgroundImage: `url(${playlist.coverUrl})` }}
          />
        )}

        {/* Content Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-7">
          {/* Glassmorphism Panel */}
          <div className="glass-panel border-white/20 p-5 rounded-[2rem] backdrop-blur-2xl shadow-inner relative overflow-hidden group-hover:border-white/40 transition-colors">
            {/* Spotlight effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <h3 className="text-lg font-black text-white leading-tight mb-2 line-clamp-2 tracking-tight">
                {playlist.title}
              </h3>
              
              <div className="flex items-center gap-3">
                <div className="h-0.5 w-6 bg-primary rounded-full" />
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-[0.2em]">
                  {playlist.itemCount || 0} ЭЛЕМЕНТОВ
                </p>
              </div>

              {playlist.author && (
                <div className="mt-4 flex items-center gap-2">
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
          </div>
        </div>

        {/* Floating Icon */}
        <div className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            arrow_forward
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
