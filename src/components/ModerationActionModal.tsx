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
        className="w-full max-w-[480px] bg-white rounded-[40px] overflow-hidden border border-on-surface/5 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.25)] flex flex-col relative animate-in zoom-in-95 duration-500 max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP SECTION: Visual Accent - Blurred Background + Sharp Miniature */}
        <div className="w-full aspect-[4/3] relative overflow-hidden bg-surface-container-low shrink-0 group">
          {/* Layer 1: Blurred Background Image */}
          {content.imageUrl && (
            <div className="absolute inset-0 z-0">
              <Image
                src={content.imageUrl}
                alt=""
                fill
                className="object-cover blur-3xl scale-150 opacity-50 brightness-90 grayscale-[0.2]"
              />
            </div>
          )}
          
          {/* Layer 2: Gradient Overlay to soften the transition to White Substrate */}
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/5 via-transparent to-black/10"></div>

          {/* Layer 3: Sharp Miniature in Center */}
          <div className="absolute inset-0 z-20 flex items-center justify-center p-8">
            <div className="relative w-2/3 max-w-[150px] aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] border border-white/30 transform transition-transform duration-700 group-hover:scale-105">
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
                  NO COVER
                </div>
              )}
            </div>
          </div>

          {/* Glass Tag (Floating on visual layer) */}
          <div className="absolute top-6 right-6 px-5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl z-30 animate-in fade-in slide-in-from-right-4 duration-700 delay-300 select-none">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white drop-shadow-sm">
              {content.type === 'movie' ? 'Фильм' : 'Книга'}
            </span>
          </div>
        </div>

        {/* BOTTOM SECTION: White Substrate - All Information & Actions */}
        <div className="bg-white flex-1 flex flex-col min-w-0 overflow-y-auto px-10 pb-10 pt-8 relative z-40">
          <div className="flex-1 space-y-8">
            {/* 1. Header Information */}
            <div className="space-y-2 text-center">
              <h2 className="text-[32px] font-black tracking-tight text-[#1a2b3c] leading-[1.0] uppercase">
                {content.title}
              </h2>
              <p className="text-[14px] font-bold text-on-surface-variant/40 tracking-[0.08em] uppercase">
                {content.author || content.director || 'Неизвестный автор'}
              </p>
            </div>

            {/* 2. Metadata Grid (Characteristics) */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {content.year && (
                <div className="flex items-center gap-3 px-5 py-3 bg-surface-container-lowest rounded-2xl border border-on-surface/5 shadow-sm">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant/30">calendar_today</span>
                  <span className="text-[13px] font-black tracking-widest text-[#1a2b3c]/80">{content.year}</span>
                </div>
              )}
              {(content.pages || content.duration) && (
                <div className="flex items-center gap-3 px-5 py-3 bg-surface-container-lowest rounded-2xl border border-on-surface/5 shadow-sm">
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant/30">
                    {content.type === 'movie' ? 'schedule' : 'auto_stories'}
                  </span>
                  <span className="text-[13px] font-black tracking-widest text-[#1a2b3c]/80">
                    {content.type === 'movie' ? content.duration : `${content.pages} стр.`}
                  </span>
                </div>
              )}
            </div>

            {/* 3. Description (On an even lighter clean section) */}
            <div className="px-6 py-8 bg-surface-container-lowest rounded-[40px] border border-on-surface-[0.02] relative group">
              <span className="absolute -top-3 left-4 px-2 bg-white text-[10px] font-bold text-indigo-500/40 uppercase tracking-widest">Аннотация</span>
              <p className="text-[14px] font-medium text-on-surface leading-loose text-center italic opacity-75">
                «{content.description}»
              </p>
            </div>

            {/* 4. Rejection Input (If triggered) */}
            {showRejectionInput && (
              <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 pt-2 pb-2">
                <div className="flex items-center gap-2 mb-4 ml-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Замечания модератора</p>
                </div>
                <textarea 
                  autoFocus
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Опишите, что именно нужно исправить..."
                  className="w-full bg-surface-container-low border border-on-surface/10 rounded-[32px] px-7 py-5 text-on-surface text-sm focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 transition-all placeholder:text-on-surface/20 min-h-[120px] resize-none shadow-inner"
                />
              </div>
            )}
          </div>

          {/* 5. Action Buttons */}
          <div className="mt-12 flex items-center gap-5 shrink-0">
            <button
              onClick={handleApprove}
              disabled={isProcessing || showRejectionInput}
              className="flex-1 h-16 rounded-full bg-[#1b2b3c] hover:bg-[#0c1a29] disabled:opacity-20 text-white font-black text-[12px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(27,43,60,0.4)] transition-all active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="material-symbols-outlined text-[22px] text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]">done_all</span>
              ОДОБРИТЬ
            </button>

            <button
              onClick={handleReject}
              disabled={isProcessing || (showRejectionInput && !rejectionReason.trim())}
              className={`h-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl relative overflow-hidden ${
                showRejectionInput 
                  ? 'bg-red-600 text-white flex-1 animate-in slide-in-from-right-4 shadow-red-500/20' 
                  : 'w-16 aspect-square bg-red-50 text-red-600 hover:bg-red-600 hover:text-white shadow-red-500/10'
              }`}
            >
              {showRejectionInput ? (
                <span className="font-black text-[11px] uppercase tracking-[0.2em]">Подтвердить</span>
              ) : (
                <span className="material-symbols-outlined text-[26px]">close</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
