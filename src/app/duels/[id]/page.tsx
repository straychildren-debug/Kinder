'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useAuth } from '@/components/AuthProvider';
import { defaultBlurDataURL } from '@/lib/image-blur';
import {
  getDuelById,
  voteInDuel,
  removeVote,
  getDuelComments,
  addDuelComment,
  finalizeDuelIfExpired,
} from '@/lib/duels';
import ContentDetailsModal from '@/components/ContentDetailsModal';
import PublicProfileModal from '@/components/PublicProfileModal';
import type { ContentItem, Duel, DuelComment, DuelSide, Review, User } from '@/lib/types';
import { AnimatePresence } from 'framer-motion';

export default function DuelDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [duel, setDuel] = useState<Duel | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [comments, setComments] = useState<DuelComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openedContent, setOpenedContent] = useState<ContentItem | null>(null);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);

  const load = async () => {
    if (!params?.id) return;
    let fetched = await getDuelById(params.id, user?.id);
    if (fetched) {
      fetched = await finalizeDuelIfExpired(fetched);
    }
    setDuel(fetched);
    if (fetched) {
      const c = await getDuelComments(fetched.id);
      setComments(c);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [params?.id, user?.id]);

  const timeLeft = useMemo(() => {
    if (!duel) return null;
    if (duel.status !== 'active') return null;
    const ms = new Date(duel.endsAt).getTime() - Date.now();
    if (ms <= 0) return 'Скоро подведём итоги';
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    if (days > 0) return `Осталось ${days} д.`;
    if (hours > 0) return `Осталось ${hours} ч.`;
    const minutes = Math.max(1, Math.floor(ms / 60000));
    return `Осталось ${minutes} мин.`;
  }, [duel]);

  const handleVote = async (side: DuelSide) => {
    if (!user || !duel || voting || duel.status !== 'active') return;
    setVoting(true);
    try {
      if (duel.mySide === side) {
        await removeVote(duel.id, user.id);
      } else {
        await voteInDuel(duel.id, user.id, side);
      }
      await load();
    } catch (e) {
      console.error(e);
    }
    setVoting(false);
  };

  const handleSubmitComment = async () => {
    if (!user || !duel || !commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const c = await addDuelComment(duel.id, user.id, commentText.trim());
      setComments((xs) => [...xs, c]);
      setCommentText('');
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-on-surface/5 border-t-accent-lilac rounded-full animate-spin" />
      </div>
    );
  }

  if (!duel) {
    return (
      <>
        <TopNavBar title="Дуэль" showBack backPath="/duels" />
        <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
          <div className="text-center py-20 px-6 bg-surface rounded-3xl border border-on-surface/5">
            <p className="text-on-surface font-semibold text-base mb-1">Дуэль не найдена</p>
            <button
              onClick={() => router.push('/duels')}
              className="mt-4 px-4 py-2 rounded-xl bg-on-surface text-surface text-sm font-semibold"
            >
              К списку дуэлей
            </button>
          </div>
        </main>
        <BottomNavBar activeTab="home" />
      </>
    );
  }

  const c = duel.challengerVotes || 0;
  const d = duel.defenderVotes || 0;
  const total = c + d;
  const cPct = total ? Math.round((c / total) * 100) : 50;

  return (
    <>
      <TopNavBar title="Дуэль" showBack backPath="/duels" />
      <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
        {/* Content header */}
        <button
          onClick={() => duel.content && setOpenedContent(duel.content)}
          className="w-full flex items-center gap-3 bg-surface rounded-2xl p-3 border border-on-surface/5 mb-5 active:scale-[0.99] transition-transform text-left"
        >
          <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-surface-container border border-on-surface/5 shrink-0">
            {duel.content?.imageUrl ? (
              <Image
                src={duel.content.imageUrl}
                alt={duel.content.title}
                fill
                sizes="48px"
                placeholder="blur"
                blurDataURL={defaultBlurDataURL}
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-on-surface-muted uppercase tracking-wider mb-0.5">
              Публикация
            </p>
            <p className="text-sm font-semibold text-on-surface line-clamp-2">
              {duel.content?.title || '—'}
            </p>
          </div>
          <span className="material-symbols-outlined text-on-surface-muted shrink-0">chevron_right</span>
        </button>

        {/* Status bar */}
        <div className="flex items-center justify-between mb-6 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-on-surface-muted">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {duel.status === 'active' ? timeLeft : duel.status === 'finished' ? 'Дуэль завершена' : 'Отменена'}
          </span>
          <span className="text-on-surface-muted">
            {total} голос{total % 10 === 1 && total % 100 !== 11 ? '' : total % 10 >= 2 && total % 10 <= 4 && (total % 100 < 10 || total % 100 >= 20) ? 'а' : 'ов'}
          </span>
        </div>

        {/* Arena */}
        <section className="flex flex-col gap-6 mb-8 relative">
          <SidePanel
            side="challenger"
            review={duel.challengerReview}
            accent="rose"
            mySide={duel.mySide}
            winnerReviewId={duel.winnerReviewId}
            votes={c}
            totalVotes={total}
            canVote={!!user && duel.status === 'active'}
            voting={voting}
            onVote={() => handleVote('challenger')}
            onOpenProfile={setSelectedUserForProfile}
          />

          {/* VS Separator */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
             <div className="w-12 h-12 rounded-full bg-surface border-4 border-background shadow-xl flex items-center justify-center">
                <span className="text-xs font-black italic tracking-tighter text-on-surface">VS</span>
             </div>
          </div>

          <SidePanel
            side="defender"
            review={duel.defenderReview}
            accent="emerald"
            mySide={duel.mySide}
            winnerReviewId={duel.winnerReviewId}
            votes={d}
            totalVotes={total}
            canVote={!!user && duel.status === 'active'}
            voting={voting}
            onVote={() => handleVote('defender')}
            onOpenProfile={setSelectedUserForProfile}
          />
        </section>

        {/* Progress pulse */}
        <div className="mb-8">
          <div className="relative h-2.5 rounded-full bg-surface-container-low overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${cPct}%` }}
            />
            <div
              className="absolute top-0 right-0 h-full bg-rose-400 transition-all duration-500"
              style={{ width: `${100 - cPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] font-semibold">
            <span className="text-emerald-600">{cPct}%</span>
            <span className="text-rose-600">{100 - cPct}%</span>
          </div>
        </div>

        {/* Comments */}
        <section>
          <h2 className="text-base font-semibold text-on-surface mb-4">
            Обсуждение{' '}
            <span className="text-on-surface-muted font-medium">{comments.length}</span>
          </h2>

          {user ? (
            <div className="flex gap-2 bg-surface-container-low p-3 rounded-2xl border border-on-surface/5 mb-5">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Вставить 5 копеек…"
                className="flex-1 bg-surface border border-on-surface/10 rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface focus:outline-none focus:border-on-surface/40"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                maxLength={2000}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || submitting}
                className="w-10 h-10 bg-on-surface text-surface rounded-xl flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform shrink-0"
                aria-label="Отправить"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-5 bg-surface-container-lowest rounded-2xl border border-dashed border-on-surface/10 mb-5">
              <p className="text-sm font-medium text-on-surface-muted">Войдите, чтобы участвовать в обсуждении</p>
            </div>
          )}

          {comments.length === 0 ? (
            <p className="text-center text-xs font-medium text-on-surface-muted py-6">
              Будьте первым, кто разберёт аргументы сторон
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="relative w-8 h-8 rounded-full bg-surface-container overflow-hidden flex-shrink-0 border border-on-surface/5 flex items-center justify-center font-semibold text-on-surface text-xs">
                    {c.user?.avatarUrl ? (
                      <Image src={c.user.avatarUrl} alt={c.user.name || ''} fill sizes="32px" className="object-cover" />
                    ) : (
                      c.user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface leading-relaxed">
                      <span className="font-semibold mr-1.5">{c.user?.name}</span>
                      {c.text}
                    </p>
                    <p className="text-[11px] font-medium text-on-surface-muted mt-1">
                      {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {openedContent && (
        <ContentDetailsModal content={openedContent} onClose={() => setOpenedContent(null)} />
      )}

      {selectedUserForProfile && (
        <PublicProfileModal 
          user={selectedUserForProfile} 
          onClose={() => setSelectedUserForProfile(null)}
          onOpenContent={(c) => {
            setSelectedUserForProfile(null);
            setOpenedContent(c);
          }}
        />
      )}
      <BottomNavBar activeTab="home" />
    </>
  );
}

function SidePanel({
  side,
  review,
  accent,
  mySide,
  winnerReviewId,
  votes,
  totalVotes,
  canVote,
  voting,
  onVote,
  onOpenProfile,
}: {
  side: DuelSide;
  review?: Review;
  accent: 'emerald' | 'rose';
  mySide?: DuelSide | null;
  winnerReviewId?: string | null;
  votes: number;
  totalVotes: number;
  canVote: boolean;
  voting: boolean;
  onVote: () => void;
  onOpenProfile: (u: User) => void;
}) {
  const isMine = mySide === side;
  const isWinner = winnerReviewId && review?.id === winnerReviewId;
  const isLoser = !!winnerReviewId && review?.id !== winnerReviewId;
  const accentRing = accent === 'emerald' ? 'border-emerald-400/40 shadow-emerald-500/5' : 'border-rose-400/40 shadow-rose-500/5';
  const accentText = accent === 'emerald' ? 'text-emerald-600' : 'text-rose-600';
  const sideLabel = side === 'challenger' ? 'ПРОТИВ' : 'ЗА';
  const accentGradient = accent === 'emerald' 
    ? 'bg-gradient-to-br from-surface via-surface to-emerald-500/[0.15]' 
    : 'bg-gradient-to-br from-surface via-surface to-rose-500/[0.15]';

  return (
    <div
      className={`relative rounded-[28px] p-6 border transition-all duration-500 ${accentGradient} ${
        isMine ? `${accentRing} border-2` : 'border-on-surface/5'
      } ${isLoser ? 'opacity-40 grayscale-[0.5]' : 'shadow-xl shadow-black/5'} overflow-hidden`}
    >
      {/* Side Indicator Badge */}
      <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[9px] font-black tracking-[0.2em] text-white ${accent === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
        {sideLabel}
      </div>

      <div className="flex items-center gap-4 mb-5">
        <button 
          onClick={() => review?.user && onOpenProfile(review.user)}
          className="relative w-12 h-12 rounded-[18px] bg-surface-container overflow-hidden flex-shrink-0 border-2 border-background shadow-md flex items-center justify-center font-bold text-on-surface text-sm transition-transform active:scale-90"
        >
          {review?.user?.avatarUrl ? (
            <Image src={review.user.avatarUrl} alt={review.user.name || ''} fill sizes="48px" className="object-cover" />
          ) : (
            review?.user?.name?.charAt(0) || '?'
          )}
        </button>
        <div className="min-w-0 flex-1">
          <button 
            onClick={() => review?.user && onOpenProfile(review.user)}
            className="font-black text-sm text-on-surface truncate block hover:text-accent-lilac transition-colors"
          >
            {review?.user?.name || 'Критик'}
          </button>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`material-symbols-outlined text-[14px] ${
                  s <= (review?.rating || 0) ? 'text-amber-500' : 'text-on-surface-variant/10'
                }`}
                style={{ fontVariationSettings: s <= (review?.rating || 0) ? "'FILL' 1" : "'FILL' 0" }}
              >
                star
              </span>
            ))}
          </div>
        </div>
        {isWinner && (
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-amber-600 text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              workspace_premium
            </span>
          </div>
        )}
      </div>

      <div className="relative mb-6">
        <span className="absolute -top-4 -left-2 text-4xl text-on-surface/[0.03] font-serif select-none">“</span>
        <p className="text-[13px] font-medium text-on-surface/80 leading-relaxed italic line-clamp-none whitespace-pre-wrap">
          {review?.text || '—'}
        </p>
      </div>

      <div className="flex items-center gap-4 mt-auto">
        <button
          onClick={onVote}
          disabled={!canVote || voting}
          className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${
            isMine
              ? 'bg-on-surface text-surface shadow-lg shadow-black/10'
              : `bg-surface border border-on-surface/10 text-on-surface hover:bg-surface-container-low`
          } ${!canVote || voting ? 'opacity-60 active:scale-100' : ''}`}
        >
          {isMine ? 'Ваш выбор' : 'Поддержать'}
        </button>
        
        <div className="shrink-0 text-right">
           <p className={`text-lg font-black tracking-tighter leading-none ${accentText}`}>
             {votes}
           </p>
           <p className="text-[9px] font-bold text-on-surface-muted uppercase tracking-widest mt-1">
             {totalVotes ? `${Math.round((votes / totalVotes) * 100)}%` : '0%'}
           </p>
        </div>
      </div>
    </div>
  );
}
