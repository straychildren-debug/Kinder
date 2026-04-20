'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Club, ClubMember, ClubMarathon } from '@/lib/types';
import { getClubMembers, getActiveMarathon, getUserById } from '@/lib/db';

interface ClubLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
  onJoin: (clubId: string) => void;
  isMember: boolean;
}

export default function ClubLobbyModal({
  isOpen,
  onClose,
  club,
  onJoin,
  isMember
}: ClubLobbyModalProps) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [marathon, setMarathon] = useState<ClubMarathon | null>(null);
  const [ownerName, setOwnerName] = useState<string>('...');
  const [loading, setLoading] = useState(true);
  const [showMembersList, setShowMembersList] = useState(false);

  useEffect(() => {
    if (isOpen && club) {
      loadData();
    }
  }, [isOpen, club]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, marathonData, ownerData] = await Promise.all([
        getClubMembers(club.id),
        getActiveMarathon(club.id),
        getUserById(club.ownerId)
      ]);
      setMembers(membersData);
      setMarathon(marathonData);
      if (ownerData) setOwnerName(ownerData.name);
    } catch (err) {
      console.error('Failed to load lobby data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 glass-modal-overlay animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="glass-modal rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Close Button for accessibility */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/40 transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-on-surface text-[20px]">close</span>
        </button>

        {/* Scrollable Container (Everything inside) */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Header with Cinematic Background */}
          <div className="relative h-64 sm:h-80 overflow-hidden">
            {/* Cinematic Background Image */}
            <div className="absolute inset-0">
              <Image 
                src="/images/cinematic_bg.png" 
                alt="Background" 
                fill 
                className="object-cover opacity-60 grayscale-[0.2]" 
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/30 to-surface" />
            </div>
            
            {/* Club Info in Header */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-8 text-center z-20 pt-16">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 aspect-square rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl mb-4 bg-white/10 backdrop-blur-sm shrink-0">
                {club.imageUrl ? (
                  <Image src={club.imageUrl} alt={club.name} fill sizes="120px" className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                     <span className="material-symbols-rounded text-on-surface/20 text-4xl">groups</span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter leading-tight mb-2 text-on-surface">{club.name}</h2>
              <div className="flex items-center gap-5">
                <span className="px-3 py-1 bg-amber-400 text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shrink-0">Популярное</span>
                <button 
                  onClick={() => setShowMembersList(true)}
                  className="text-xs font-bold text-on-surface/60 flex items-center gap-1.5 hover:text-on-surface transition-colors whitespace-nowrap shrink-0"
                >
                  <span className="material-symbols-rounded text-[14px]">groups</span>
                  {club.memberCount} участников
                </button>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-8 sm:p-10 space-y-8">
            {/* Main Action */}
            <div className="flex flex-col items-center justify-center -mt-12 relative z-30 gap-4">
              {isMember ? (
                <>
                  <div className="px-6 py-2 bg-on-surface/5 text-on-surface/40 rounded-full font-black text-[9px] uppercase tracking-[0.2em] border border-on-surface/5 backdrop-blur-sm">
                    Вы уже участник клуба
                  </div>
                  <button 
                    onClick={() => onJoin(club.id)}
                    className="px-12 py-4 bg-on-surface text-surface rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Войти в чат
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => onJoin(club.id)}
                  className="px-12 py-4 bg-on-surface text-surface rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Вступить в клуб
                </button>
              )}
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              {/* Description */}
              <div className="p-6 rounded-[32px] bg-surface-container-low/50 border border-on-surface/5">
                 <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] block mb-3">О клубе</span>
                 <p className="text-sm font-medium leading-relaxed opacity-80">
                   {club.description || 'В этом клубе еще нет описания, но здесь точно происходит что-то интересное.'}
                 </p>
              </div>

              {/* Compact Meta Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-[24px] bg-surface-container-low/50 border border-on-surface/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-rounded text-[18px]">person_edit</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[8px] font-black text-on-surface/30 uppercase tracking-widest block">Создатель</span>
                    <span className="text-xs font-bold truncate block">{ownerName}</span>
                  </div>
                </div>
                <div className="p-4 rounded-[24px] bg-surface-container-low/50 border border-on-surface/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-600">
                    <span className="material-symbols-rounded text-[18px]">calendar_today</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[8px] font-black text-on-surface/30 uppercase tracking-widest block">Основан</span>
                    <span className="text-xs font-bold truncate block">{new Date(club.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Marathon / Event (if exists) */}
            {marathon && (
              <div className="p-6 rounded-[32px] bg-on-surface text-surface shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-20 rotate-12">
                   <span className="material-symbols-rounded text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                </div>
                <div className="relative z-10">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 block mb-2">Текущий марафон</span>
                  <h4 className="text-xl font-black tracking-tight mb-1">{marathon.title}</h4>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface/20 rounded-full text-[10px] font-bold mt-2">
                    <span className="material-symbols-rounded text-[14px]">timer</span>
                    Осталось {Math.max(0, Math.ceil((new Date(marathon.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} дней
                  </div>
                </div>
              </div>
            )}

            {/* Rules footer */}
            <div className="pt-6 border-t border-on-surface/5">
               <span className="text-[10px] font-black text-on-surface/20 uppercase tracking-[0.2em] block mb-4">Правила сообщества</span>
               <ul className="space-y-2 text-[11px] font-bold text-on-surface/40 leading-relaxed list-disc pl-4">
                 <li>Будьте вежливы к другим участникам</li>
                 <li>Спойлеры только под соответствующим тегом</li>
                 <li>Никакого спама и рекламы</li>
                 <li>Уважайте мнение каждого критика</li>
               </ul>
            </div>
          </div>
        </div>

        {/* Members Overlay */}
        {showMembersList && (
          <div className="absolute inset-0 z-[100] bg-surface/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-10 duration-300 p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-xl font-black tracking-tighter uppercase tracking-[0.2em]">Участники</h3>
              <button 
                onClick={() => setShowMembersList(false)}
                className="w-10 h-10 rounded-full bg-on-surface/5 flex items-center justify-center hover:bg-on-surface/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 px-2 pb-8 scrollbar-hide">
               {members.map((m) => (
                 <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-on-surface/5 shadow-sm">
                   <div className="flex items-center gap-4">
                     <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-container">
                       {m.userAvatar ? (
                         <Image src={m.userAvatar} alt={m.userName || ''} fill sizes="48px" className="object-cover" unoptimized />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-sm font-bold opacity-30">
                           {(m.userName || '?')[0]}
                         </div>
                       )}
                     </div>
                     <div className="min-w-0">
                       <span className="text-sm font-bold truncate block">{m.userName}</span>
                       <span className="text-[9px] font-black text-on-surface/30 uppercase tracking-widest leading-none block mt-0.5">
                         {m.role === 'owner' ? 'Основатель' : 'Участник'}
                       </span>
                     </div>
                   </div>
                   {m.role === 'owner' && (
                     <span className="material-symbols-rounded text-amber-500 text-[20px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                   )}
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
