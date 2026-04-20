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
        className="glass-modal rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Glass Gradient */}
        <div className="relative h-48 sm:h-64 shrink-0 overflow-hidden">
          {/* Abstract Glass Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-surface to-surface-container" />
          <div className="absolute inset-0 backdrop-blur-[100px]" />
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/40 transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-on-surface text-[20px]">close</span>
          </button>

          {/* Club Info in Header */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-4 border-white/50 shadow-2xl mb-4 bg-white/10 backdrop-blur-sm">
              {club.imageUrl ? (
                <Image src={club.imageUrl} alt={club.name} fill sizes="100px" className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                   <span className="material-symbols-rounded text-on-surface/20 text-4xl">groups</span>
                </div>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tighter leading-tight mb-2">{club.name}</h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-400 text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Популярное</span>
              <span className="text-xs font-bold text-on-surface/40 flex items-center gap-1">
                <span className="material-symbols-rounded text-[14px]">groups</span>
                {club.memberCount} участников
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-10 scrollbar-hide">
          {/* Main Action */}
          <div className="flex justify-center">
            {isMember ? (
              <button 
                onClick={() => onJoin(club.id)}
                className="px-12 py-4 bg-on-surface text-surface rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                Войти в чат
              </button>
            ) : (
              <button 
                onClick={() => onJoin(club.id)}
                className="px-12 py-4 bg-on-surface text-surface rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                Вступить в клуб
              </button>
            )}
          </div>

          {/* Grid of Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Description */}
            <div className="p-6 rounded-[32px] bg-white/40 border border-on-surface/5 backdrop-blur-sm">
               <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.2em] block mb-3">О клубе</span>
               <p className="text-sm font-medium leading-relaxed opacity-70">
                 {club.description || 'В этом клубе еще нет описания, но здесь точно происходит что-то интересное.'}
               </p>
            </div>

            {/* Stats / Meta */}
            <div className="space-y-4">
              <div className="p-5 rounded-[24px] bg-white/40 border border-on-surface/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-rounded text-[20px]">person_edit</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-on-surface/30 uppercase tracking-widest block">Создатель</span>
                  <span className="text-sm font-bold">{ownerName}</span>
                </div>
              </div>
              <div className="p-5 rounded-[24px] bg-white/40 border border-on-surface/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-600">
                  <span className="material-symbols-rounded text-[20px]">calendar_today</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-on-surface/30 uppercase tracking-widest block">Основан</span>
                  <span className="text-sm font-bold">{new Date(club.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-on-surface/30 uppercase tracking-[0.3em]">Участники</h3>
              <span className="text-[10px] font-bold opacity-30">{members.length} в сети</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.slice(0, 12).map((m) => (
                <div key={m.id} className="relative group">
                  {m.userAvatar ? (
                    <Image 
                      src={m.userAvatar} 
                      alt={m.userName || ''} 
                      width={36} 
                      height={36} 
                      unoptimized 
                      className="w-9 h-9 rounded-xl object-cover border border-on-surface/5 grayscale group-hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-[10px] font-bold">
                      {(m.userName || '?')[0]}
                    </div>
                  )}
                </div>
              ))}
              {members.length > 12 && (
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-[10px] font-black opacity-30 border border-dashed border-on-surface/20">
                  +{members.length - 12}
                </div>
              )}
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
                <p className="text-xs opacity-70 mb-4 font-medium">Присоединяйтесь к общему обсуждению!</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface/20 rounded-full text-[10px] font-bold">
                  <span className="material-symbols-rounded text-[14px]">timer</span>
                  Осталось {Math.max(0, Math.ceil((new Date(marathon.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} дней
                </div>
              </div>
            </div>
          )}

          {/* Rules / Description footer */}
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
    </div>
  );
}
