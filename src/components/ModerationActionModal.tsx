'use client';

import React, { useState } from 'react';
import { ContentItem } from '@/lib/types';
import Image from 'next/image';
import { defaultBlurDataURL } from '@/lib/image-blur';

interface ModerationActionModalProps {
  content: ContentItem;
  onClose: () => void;
  onDecision: (id: string, decision: 'approved' | 'rejected', reason?: string) => Promise<void>;
  isProcessing: boolean;
}

export default function ModerationActionModal({ content, onClose, onDecision, isProcessing }: ModerationActionModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  const handleApprove = async () => {
    await onDecision(content.id, 'approved');
    onClose();
  };

  const handleReject = async () => {
    if (!showRejectionInput) {
      setShowRejectionInput(true);
      return;
    }
    if (!rejectionReason.trim()) return;
    await onDecision(content.id, 'rejected', rejectionReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-on-surface/40 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="w-full max-w-[480px] bg-white rounded-[40px] overflow-hidden border border-on-surface/5 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.25)] flex flex-col relative animate-in zoom-in-95 duration-500 h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* FIXED HEADER: Solid Background + Sharp Miniature */}
        <div className="w-full bg-[#d8d3cf] relative p-12 flex items-center justify-center shrink-0 z-0 h-[300px]">
          <div className="relative w-[160px] aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] border border-white/20 select-none">
            {content.imageUrl ? (
              <Image
                src={content.imageUrl}
                alt={content.title}
                fill
                sizes="200px"
                placeholder="blur"
                blurDataURL={defaultBlurDataURL}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface/10 text-3xl font-black italic">
                {content.type === 'movie' ? 'ФИЛЬМ' : 'КНИГА'}
              </div>
            )}
          </div>

          {/* Glass Tag (Floating on visual layer) */}
          <div className="absolute top-6 right-6 px-5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl z-30 select-none">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a2b3c] drop-shadow-sm opacity-60">
              {content.type === 'movie' ? 'Фильм' : 'Книга'}
            </span>
          </div>
        </div>

        {/* SCROLLING SUBSTRATE: White Base for Content */}
        <div className="bg-white flex-1 flex flex-col min-w-0 overflow-y-auto px-10 pb-8 pt-10 rounded-t-[40px] -mt-10 relative z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
          <div className="flex-1 space-y-10">
            {/* 1. Header Information */}
            <div className="space-y-2 text-center">
              <h2 className="text-[32px] font-black tracking-tight text-[#1a2b3c] leading-[1.05] uppercase">
                {content.title}
              </h2>
              <p className="text-[15px] font-bold text-on-surface-variant/30 tracking-[0.1em] uppercase">
                {content.author || content.director || 'Неизвестный автор'}
              </p>
            </div>

            {/* 2. Characteristics (Single centered pill for now as in mockup) */}
            <div className="flex justify-center">
              <div className="flex items-center gap-4 px-6 py-4 bg-white rounded-[24px] border border-on-surface/5 shadow-[0_8px_16px_rgba(0,0,0,0.03)]">
                <span className="material-symbols-outlined text-[24px] text-on-surface-variant/30">
                  {content.type === 'movie' ? 'schedule' : 'auto_stories'}
                </span>
                <span className="text-[14px] font-black tracking-widest text-[#1a2b3c]/80">
                  {content.type === 'movie' ? content.duration : `${content.pages} стр.`}
                </span>
              </div>
            </div>

            {/* 3. Annotation with Outset Label */}
            <div className="relative border border-[#1a2b3c]/10 rounded-[40px] p-8 mt-12 bg-white">
              <span className="absolute -top-3 left-8 px-3 bg-white text-[11px] font-black text-indigo-200 uppercase tracking-[0.2em] select-none">
                АННОТАЦИЯ
              </span>
              <p className="text-[15px] font-medium text-[#1a2b3c]/80 leading-[1.8] text-center italic">
                «{content.description}»
              </p>
            </div>

            {showRejectionInput && (
              <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 pt-2 pb-2 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-4 opacity-70">Замечания модератора</p>
                <textarea 
                  autoFocus
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Опишите, что именно нужно исправить..."
                  className="w-full bg-surface-container-low border border-on-surface/5 rounded-[32px] px-7 py-5 text-on-surface text-sm focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 transition-all placeholder:text-on-surface/10 min-h-[140px] resize-none shadow-inner"
                />
              </div>
            )}
          </div>

          {/* 4. Action Buttons (Refined sizing) */}
          <div className="mt-12 flex items-center gap-5 shrink-0 bg-white pt-2">
            <button
              onClick={handleApprove}
              disabled={isProcessing || showRejectionInput}
              className="flex-1 h-14 rounded-full bg-[#1b2b3c] hover:bg-[#0c1a29] disabled:opacity-20 text-white font-black text-[12px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="material-symbols-outlined text-[20px] text-green-400">done_all</span>
              ОДОБРИТЬ
            </button>

            <button
              onClick={handleReject}
              disabled={isProcessing || (showRejectionInput && !rejectionReason.trim())}
              className={`h-14 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl relative overflow-hidden ${
                showRejectionInput 
                  ? 'bg-red-600 text-white flex-1 animate-in slide-in-from-right-4 shadow-red-500/20' 
                  : 'w-14 aspect-square bg-red-50 text-red-600 hover:bg-red-600 hover:text-white shadow-sm'
              }`}
            >
              {showRejectionInput ? (
                <span className="font-black text-[11px] uppercase tracking-[0.2em]">Подтвердить</span>
              ) : (
                <span className="material-symbols-outlined text-[24px]">close</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
