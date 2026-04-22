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
  'from-[#2d0006] via-[#590013] to-[#8a0021]', // Deep Ruby (Mockup Exact)
  'from-[#1a0005] via-[#4d0010] to-[#7d001b]', // Midnight Garnet
  'from-[#3d000a] via-[#6d0018] to-[#9d0022]', // Royal Burgundy
  'from-[#220004] via-[#550012] to-[#85001e]', // Velvet Crimson
];

export default function PlaylistCard({ playlist, className = '' }: PlaylistCardProps) {
  // Выбираем градиент на основе ID плейлиста для консистентности
  const gradientIndex = React.useMemo(() => {
    if (!playlist.id) return 0;
    const charCodeSum = playlist.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return charCodeSum % GRADIENTS.length;
  }, [playlist.id]);

  const gradient = GRADIENTS[gradientIndex];
  
  // Яркий неоновый цвет для рамок (всегда рубиновый для этой темы)
  const neonBorderColor = 'border-[#ff004d]';
  const neonShadow = 'shadow-[0_0_15px_rgba(255,0,77,0.7)]';

  return (
    <Link href={`/playlists/${playlist.id}`} className={`block w-full group ${className}`}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="relative w-full rounded-3xl overflow-hidden shadow-[0_0_25px_rgba(255,255,255,0.07)] border border-white/20 group-hover:shadow-[0_0_35px_rgba(255,255,255,0.12)] transition-all duration-500 bg-[#160004]"
      >
        {/* Фоновый градиент (Premium Mesh) */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${gradient} z-0 opacity-80 group-hover:opacity-100 transition-opacity`} />
        
        {/* Абстрактные световые эффекты */}
        <div className="absolute top-[-30%] left-[-10%] w-[120%] h-[120%] rounded-full bg-white/5 blur-[120px] pointer-events-none" />
        <div className={`absolute bottom-[-10%] right-[-20%] w-[60%] h-[80%] rounded-full bg-[#ff004d]/20 blur-[80px] pointer-events-none`} />

        {/* Content Container */}
        <div className="relative z-20 flex flex-col p-6 sm:p-7 gap-6">
          {/* TITLE - Top Level, Full Width */}
          <div className="w-full">
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight group-hover:text-white transition-colors">
              {playlist.title}
            </h3>
          </div>

          {/* LOWER SECTION - Metadata & Posters */}
          <div className="flex flex-row items-end justify-between gap-4">
            {/* Info Section (Left) */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-row items-center gap-2">
                <p className="text-[11px] font-black text-white uppercase tracking-wider">
                  {playlist.itemCount || 0} ЭЛЕМЕНТА
                </p>
              </div>

              {playlist.author && (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full overflow-hidden border-[1.5px] ${neonBorderColor} shadow-md`}>
                    {playlist.author.avatarUrl ? (
                      <img src={playlist.author.avatarUrl} alt={playlist.author.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-black/40">
                        {playlist.author.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-white leading-tight">
                      {playlist.author.name.split(' ')[0]}
                    </p>
                    <p className="text-[11px] font-medium text-white/60 leading-tight">
                      @{playlist.author.name.replace(/\s+/g, '').toLowerCase()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Posters Gallery (Right) */}
            <div className="flex items-center justify-end shrink-0 pl-2">
              {playlist.previewImages && playlist.previewImages.length > 0 ? (
                <div className="flex gap-2 sm:gap-3">
                  {playlist.previewImages.slice(0, 5).map((img, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`w-12 h-[72px] sm:w-[60px] sm:h-[90px] rounded-lg border-[1.5px] ${neonBorderColor} ${neonShadow} overflow-hidden shrink-0 transform transition-all group-hover:scale-105 group-hover:brightness-110`}
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
