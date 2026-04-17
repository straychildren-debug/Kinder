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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-white/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div 
        className="w-full max-w-lg bg-white rounded-[40px] overflow-hidden border border-on-surface/5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] flex flex-col relative animate-in zoom-in-95 duration-500 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-all z-20 shadow-xl"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
        {/* Top Section with Image and Glass Tag */}
        <div className="w-full aspect-[4/3] relative overflow-hidden shrink-0 group">
          {content.imageUrl ? (
            <Image
              src={content.imageUrl}
              alt={content.title}
              fill
              sizes="(min-width: 500px) 500px, 100vw"
              placeholder="blur"
              blurDataURL={defaultBlurDataURL}
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-surface-container flex items-center justify-center text-on-surface/5 text-5xl font-black uppercase">
              {content.type === 'movie' ? 'Кино' : 'Книга'}
            </div>
          )}
          
          {/* Glass Tag */}
          <div className="absolute top-6 right-6 px-5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl z-10 animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white drop-shadow-sm">
              {content.type === 'movie' ? 'Фильм' : 'Книга'}
            </span>
          </div>
          
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/40 to-transparent"></div>
        </div>

        {/* Content Section */}
        <div className="flex-1 px-7 pb-8 flex flex-col min-w-0 overflow-y-auto -mt-9 relative z-10">
          <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="space-y-1 text-center">
              <h2 className="text-3xl font-extrabold tracking-tighter text-on-surface leading-[0.95] uppercase">
                {content.title}
              </h2>
              <p className="text-[11px] font-semibold text-on-surface-variant/40 tracking-[0.1em] uppercase mt-2">
                {content.author || content.director || 'Неизвестный автор'}
              </p>
            </div>

            {/* Metadata Grid (Lighter version) */}
            <div className="flex flex-wrap items-center justify-center gap-6 py-2">
              {(content.year || content.pages || content.duration) && (
                <>
                  {content.year && (
                    <div className="flex items-center gap-2 text-on-surface-variant/70">
                      <span className="material-symbols-outlined text-[16px] opacity-40">calendar_today</span>
                      <span className="text-[12px] font-bold tracking-wider">{content.year}</span>
                    </div>
                  )}
                  {(content.pages || content.duration) && (
                    <div className="flex items-center gap-2 text-on-surface-variant/70">
                      <span className="material-symbols-outlined text-[18px] opacity-40">
                        {content.type === 'movie' ? 'schedule' : 'auto_stories'}
                      </span>
                      <span className="text-[12px] font-bold tracking-wider">
                        {content.type === 'movie' ? content.duration : `${content.pages} стр.`}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Description Block */}
            <div className="p-6 bg-surface-container/20 rounded-[32px] border border-on-surface/5">
              <p className="text-[13px] font-medium text-on-surface-variant/80 leading-relaxed text-center">
                {content.description}
              </p>
            </div>

            {showRejectionInput && (
              <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 pt-1">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-1 h-1 rounded-full bg-red-400"></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-600 opacity-60">Замечания</p>
                </div>
                <textarea 
                  autoFocus
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Что нужно исправить?"
                  className="w-full bg-surface-container-low border border-on-surface/5 rounded-2xl px-5 py-3.5 text-on-surface text-sm focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500/20 transition-all placeholder:text-on-surface/10 min-h-[90px] resize-none shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Action Buttons (Refined & Smaller) */}
          <div className="mt-8 flex items-center gap-3 shrink-0 px-4 sm:px-0">
            <button
              onClick={handleApprove}
              disabled={isProcessing || showRejectionInput}
              className="flex-[3] h-13 rounded-2xl bg-[#0f172a] hover:bg-black disabled:opacity-20 text-white font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="material-symbols-outlined text-[18px] text-emerald-400 opacity-80 group-hover:opacity-100">task_alt</span>
              Одобрить
            </button>

            <button
              onClick={handleReject}
              disabled={isProcessing || (showRejectionInput && !rejectionReason.trim())}
              className={`h-13 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg ${
                showRejectionInput 
                  ? 'bg-red-500 text-white flex-[2] animate-in slide-in-from-right-4' 
                  : 'w-13 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white'
              }`}
            >
              {showRejectionInput ? (
                <span className="font-bold text-[10px] uppercase tracking-[0.2em]">Готово</span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">close</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
