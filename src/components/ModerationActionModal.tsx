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
        className="w-full max-w-[480px] bg-white rounded-[40px] overflow-hidden border border-on-surface/5 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.25)] flex flex-col relative animate-in zoom-in-95 duration-500 max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Section: Blurred Background + Miniature Cover */}
        <div className="w-full aspect-[4/3] relative overflow-hidden shrink-0 bg-surface-container-low group">
          {/* Layer 1: Blurred Background */}
          {content.imageUrl && (
            <div className="absolute inset-0 z-0">
              <Image
                src={content.imageUrl}
                alt=""
                fill
                className="object-cover blur-2xl scale-125 opacity-40 brightness-75"
              />
            </div>
          )}
          
          {/* Layer 2: Sharp Centered Miniature with Shadow */}
          <div className="absolute inset-0 z-10 flex items-center justify-center p-8">
            <div className="relative w-2/3 max-w-[160px] aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/20 transition-transform duration-700 group-hover:scale-105">
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
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface/10 text-4xl font-black italic">
                  NO COVER
                </div>
              )}
            </div>
          </div>

          {/* Glass Tag */}
          <div className="absolute top-6 right-6 px-5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl z-20 animate-in fade-in slide-in-from-right-4 duration-700 delay-300 select-none">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white drop-shadow-sm">
              {content.type === 'movie' ? 'Фильм' : 'Книга'}
            </span>
          </div>

          {/* Fade to white bottom overlay */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/40 to-transparent z-10"></div>
        </div>

        {/* Content Section */}
        <div className="flex-1 px-8 pb-8 flex flex-col min-w-0 overflow-y-auto -mt-6 relative z-10">
          <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="space-y-1.5 text-center">
              <h2 className="text-[28px] font-black tracking-tight text-on-surface leading-[1.1] uppercase px-4">
                {content.title}
              </h2>
              <p className="text-[13px] font-bold text-on-surface-variant/50 tracking-[0.05em] uppercase">
                {content.author || content.director || 'Неизвестный автор'}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {(content.year || content.pages || content.duration) && (
                <>
                  {content.year && (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-surface-container/30 rounded-2xl border border-on-surface/5">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant/40">calendar_today</span>
                      <span className="text-[12px] font-black tracking-widest text-on-surface-variant/80">{content.year}</span>
                    </div>
                  )}
                  {(content.pages || content.duration) && (
                    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-surface-container/30 rounded-2xl border border-on-surface/5">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant/40">
                        {content.type === 'movie' ? 'schedule' : 'auto_stories'}
                      </span>
                      <span className="text-[12px] font-black tracking-widest text-on-surface-variant/80">
                        {content.type === 'movie' ? content.duration : `${content.pages} стр.`}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Description Block */}
            <div className="p-6 bg-surface-container/20 rounded-[32px] border border-on-surface-[0.03] shadow-inner-sm">
              <p className="text-[13.5px] font-medium text-on-surface-variant leading-relaxed opacity-90 text-center sm:text-left italic">
                «{content.description}»
              </p>
            </div>

            {showRejectionInput && (
              <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 pt-2 pb-2">
                <div className="flex items-center gap-2 mb-3 ml-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Что нужно исправить?</p>
                </div>
                <textarea 
                  autoFocus
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Опишите проблему автору..."
                  className="w-full bg-surface-container-low border border-on-surface/10 rounded-2xl px-5 py-4 text-on-surface text-sm focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 transition-all placeholder:text-on-surface/20 min-h-[100px] resize-none shadow-inner"
                />
              </div>
            )}
          </div>

          {/* Action Buttons: Pill + Circular */}
          <div className="mt-8 flex items-center gap-4 shrink-0">
            <button
              onClick={handleApprove}
              disabled={isProcessing || showRejectionInput}
              className="flex-1 h-16 rounded-full bg-[#1b2b3c] hover:bg-[#0c1a29] disabled:opacity-20 text-white font-black text-[12px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-2xl shadow-indigo-950/20 transition-all active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="material-symbols-outlined text-[22px] text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]">done_all</span>
              Одобрить
            </button>

            <button
              onClick={handleReject}
              disabled={isProcessing || (showRejectionInput && !rejectionReason.trim())}
              className={`h-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl relative overflow-hidden ${
                showRejectionInput 
                  ? 'bg-red-600 text-white flex-1 animate-in slide-in-from-right-4 shadow-red-500/20' 
                  : 'w-16 aspect-square bg-red-50 text-red-600 hover:bg-red-600 hover:text-white shadow-black/5'
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
