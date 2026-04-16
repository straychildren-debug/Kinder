'use client';

import React, { useState } from 'react';
import { ContentItem } from '@/lib/types';

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
        className="w-full max-w-2xl bg-white rounded-[40px] overflow-hidden border border-on-surface/5 shadow-2xl flex flex-col md:flex-row relative animate-in zoom-in-95 duration-500 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface/40 hover:text-on-surface hover:bg-surface-container-high transition-all z-20"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Left: Image */}
        <div className="md:w-2/5 aspect-[3/4] md:aspect-auto relative overflow-hidden bg-surface-container shrink-0">
          {content.imageUrl ? (
            <img 
              src={content.imageUrl} 
              alt={content.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface/10 text-4xl font-black uppercase">
              {content.type === 'movie' ? 'Кино' : 'Книга'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent md:hidden"></div>
        </div>

        {/* Right: Info & Actions */}
        <div className="flex-1 p-8 md:p-10 flex flex-col min-w-0 overflow-y-auto">
          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-surface-container rounded-full text-on-surface-variant border border-on-surface/5">
                  {content.type === 'movie' ? 'Фильм' : 'Книга'}
                </span>
                {content.year && <span className="text-[10px] font-black tracking-widest text-on-surface-variant uppercase">{content.year}</span>}
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-on-surface leading-tight uppercase line-clamp-2">
                  {content.title}
                </h2>
                <p className="text-lg font-bold text-on-surface-variant tracking-tight leading-snug">
                  {content.author || content.director || 'Неизвестный автор'}
                </p>
              </div>

              <div className="text-sm font-medium text-on-surface-variant leading-relaxed line-clamp-6 italic border-l-2 border-on-surface/10 pl-4 ml-1">
                {content.description}
              </div>
            </div>

            {showRejectionInput && (
              <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2 ml-1">Причина отклонения</p>
                <textarea 
                  autoFocus
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Укажите, что именно нужно исправить автору..."
                  className="w-full bg-surface-container-low border border-on-surface/10 rounded-2xl px-5 py-4 text-on-surface text-sm focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 transition-all placeholder:text-on-surface/20 min-h-[100px] resize-none"
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center gap-3">
            {/* Approve Button */}
            <button
              onClick={handleApprove}
              disabled={isProcessing || showRejectionInput}
              className="flex-1 h-14 md:h-16 rounded-[24px] bg-[#3a506b] hover:bg-[#2c3e50] disabled:opacity-30 text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-indigo-900/10 transition-all active:scale-95 group"
            >
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <span className="material-symbols-outlined text-[18px]">check</span>
              </div>
              Одобрить
            </button>

            {/* Reject Button */}
            <button
              onClick={handleReject}
              disabled={isProcessing || (showRejectionInput && !rejectionReason.trim())}
              className={`h-14 md:h-16 rounded-[24px] flex items-center justify-center transition-all active:scale-95 shadow-lg ${showRejectionInput ? 'bg-red-600 text-white flex-1 animate-in slide-in-from-right-4 shadow-red-500/20' : 'w-14 md:w-16 bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white shadow-black/5'}`}
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
