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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="w-full max-w-2xl bg-[#1c1c1e]/80 backdrop-blur-2xl rounded-[40px] overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row relative animate-in zoom-in-95 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all z-10"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Left: Image */}
        <div className="md:w-2/5 aspect-[3/4] md:aspect-auto relative overflow-hidden bg-black/20">
          {content.imageUrl ? (
            <img 
              src={content.imageUrl} 
              alt={content.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/10 text-4xl font-black">
              {content.type === 'movie' ? 'FILM' : 'BOOK'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent md:hidden"></div>
        </div>

        {/* Right: Info & Actions */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-between gap-8 min-w-0">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-white/5 rounded-full text-white/50 border border-white/5">
                {content.type === 'movie' ? 'Movie' : 'Book'}
              </span>
              {content.year && <span className="text-[10px] font-black tracking-widest text-white/20 uppercase">{content.year}</span>}
            </div>
            
            <div className="space-y-1">
              <h2 className="text-4xl font-black tracking-tighter text-white leading-tight uppercase line-clamp-2">
                {content.title}
              </h2>
              <p className="text-lg font-medium text-white/40 tracking-tight leading-snug">
                {content.author || content.director || 'Unknown Author'}
              </p>
            </div>

            <p className="text-sm font-medium text-white/30 leading-relaxed line-clamp-4 italic border-l-2 border-white/5 pl-4 ml-1">
              {content.description}
            </p>
          </div>

          <div className="space-y-6">
            {showRejectionInput && (
              <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2 ml-1">Reason for rejection</p>
                <input 
                  type="text"
                  autoFocus
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Tell the author what to fix..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-white/10"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Approve Button */}
              <button
                onClick={handleApprove}
                disabled={isProcessing || showRejectionInput}
                className="flex-1 h-16 rounded-[24px] bg-[#3a506b] hover:bg-[#4a6280] disabled:opacity-30 text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 group"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                Approve
              </button>

              {/* Reject Button */}
              <button
                onClick={handleReject}
                disabled={isProcessing || (showRejectionInput && !rejectionReason.trim())}
                className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all active:scale-95 shadow-xl ${showRejectionInput ? 'bg-red-500 text-white flex-1 animate-in slide-in-from-right-4' : 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}`}
              >
                {showRejectionInput ? (
                  <span className="font-black text-[11px] uppercase tracking-[0.2em]">Confirm Rejection</span>
                ) : (
                  <span className="material-symbols-outlined text-[24px]">close</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
