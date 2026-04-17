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
        <div className="flex-1 px-8 pb-8 flex flex-col min-w-0 overflow-y-auto -mt-12 relative z-10">
          <div className="flex-1 space-y-7">
            {/* Header */}
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-3xl font-black tracking-tighter text-on-surface leading-[0.9] uppercase">
                {content.title}
              </h2>
              <p className="text-sm font-medium text-on-surface-variant/60 tracking-wide uppercase mt-2">
                {content.author || content.director || 'Неизвестный автор'}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              {(content.year || content.pages || content.duration) && (
                <>
                  {content.year && (
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-surface-container/40 rounded-xl border border-on-surface/5">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant/40">calendar_today</span>
                      <span className="text-[11px] font-black tracking-widest text-on-surface-variant">{content.year}</span>
                    </div>
                  )}
                  {(content.pages || content.duration) && (
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-surface-container/40 rounded-xl border border-on-surface/5">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant/40">
                        {content.type === 'movie' ? 'schedule' : 'auto_stories'}
                      </span>
                      <span className="text-[11px] font-black tracking-widest text-on-surface-variant">
                        {content.type === 'movie' ? content.duration : `${content.pages} стр.`}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Description Block */}
            <div className="p-6 bg-surface-container/30 rounded-[28px] border border-on-surface/5">
              <p className="text-[13px] font-medium text-on-surface-variant leading-relaxed opacity-80">
                {content.description}
              </p>
            </div>

            {showRejectionInput && (
              <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 pt-2">
                <div className="flex items-center gap-2 mb-3 ml-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Причина нарушения</p>
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

          {/* Action Buttons */}
          <div className="mt-10 flex items-center gap-3 shrink-0">
            <button
              onClick={handleApprove}
              disabled={isProcessing || showRejectionInput}
              className="flex-[3] h-16 rounded-[24px] bg-[#1a2b3c] hover:bg-[#0c1621] disabled:opacity-20 text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-indigo-950/20 transition-all active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="material-symbols-outlined text-[20px] text-green-400">done_all</span>
              Одобрить
            </button>

            <button
              onClick={handleReject}
              disabled={isProcessing || (showRejectionInput && !rejectionReason.trim())}
              className={`h-16 rounded-[24px] flex items-center justify-center transition-all active:scale-95 shadow-2xl ${
                showRejectionInput 
                  ? 'bg-red-600 text-white flex-[2] animate-in slide-in-from-right-4 shadow-red-500/20' 
                  : 'w-16 bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white shadow-black/5'
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
