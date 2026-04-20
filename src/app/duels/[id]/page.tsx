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
import type { ContentItem, Duel, DuelComment, DuelSide, Review } from '@/lib/types';

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
        <section className="grid grid-cols-2 gap-3 mb-3">
          <SidePanel
            side="challenger"
            review={duel.challengerReview}
            accent="emerald"
            mySide={duel.mySide}
            winnerReviewId={duel.winnerReviewId}
            votes={c}
            totalVotes={total}
            canVote={!!user && duel.status === 'active'}
            voting={voting}
            onVote={() => handleVote('challenger')}
          />
          <SidePanel
            side="defender"
            review={duel.defenderReview}
            accent="rose"
            mySide={duel.mySide}
            winnerReviewId={duel.winnerReviewId}
            votes={d}
            totalVotes={total}
            canVote={!!user && duel.status === 'active'}
            voting={voting}
            onVote={() => handleVote('defender')}
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
}) {
  const isMine = mySide === side;
  const isWinner = winnerReviewId && review?.id === winnerReviewId;
  const isLoser = !!winnerReviewId && review?.id !== winnerReviewId;
  const accentRing = accent === 'emerald' ? 'border-emerald-400/40' : 'border-rose-400/40';
  const accentText = accent === 'emerald' ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div
      className={`bg-surface rounded-2xl p-4 border transition-all ${
        isMine ? accentRing : 'border-on-surface/5'
      } ${isLoser ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="relative w-8 h-8 rounded-full bg-surface-container overflow-hidden flex-shrink-0 border border-on-surface/5 flex items-center justify-center font-semibold text-on-surface text-xs">
          {review?.user?.avatarUrl ? (
            <Image src={review.user.avatarUrl} alt={review.user.name || ''} fill sizes="32px" className="object-cover" />
          ) : (
            review?.user?.name?.charAt(0) || '?'
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-xs text-on-surface truncate">{review?.user?.name || 'Критик'}</p>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`material-symbols-outlined text-[11px] ${
                  s <= (review?.rating || 0) ? 'text-amber-500' : 'text-on-surface-variant/20'
                }`}
                style={{ fontVariationSettings: s <= (review?.rating || 0) ? "'FILL' 1" : "'FILL' 0" }}
              >
                star
              </span>
            ))}
          </div>
        </div>
        {isWinner && (
          <span
            className="material-symbols-outlined text-amber-500 text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
            title="Победитель"
          >
            workspace_premium
          </span>
        )}
      </div>

      <p className="text-xs text-on-surface leading-relaxed line-clamp-6 whitespace-pre-wrap min-h-[72px]">
        {review?.text || '—'}
      </p>

      <button
        onClick={onVote}
        disabled={!canVote || voting}
        className={`mt-4 w-full py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
          isMine
            ? 'bg-on-surface text-surface'
            : 'bg-surface-container-low text-on-surface hover:bg-surface-container border border-on-surface/5'
        } ${!canVote || voting ? 'opacity-60 active:scale-100' : ''}`}
      >
        {isMine ? 'Вы с этим критиком' : 'Поддержать'}
      </button>

      <p className={`mt-2 text-center text-[11px] font-semibold ${accentText}`}>
        {votes} {totalVotes ? `(${Math.round((votes / totalVotes) * 100)}%)` : ''}
      </p>
    </div>
  );
}
