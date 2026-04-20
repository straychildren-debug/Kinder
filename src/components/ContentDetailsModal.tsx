'use client';

import React, { useEffect, useState } from 'react';
import { ContentItem, Review, User, ReviewComment } from '@/lib/types';
import { getReviewsForContent, submitReview, rateReview, addReviewComment, getReviewComments, getContentById, getUserById, updateReview, deleteReview, updateReviewComment, deleteReviewComment } from '@/lib/db';
import { nominateDuel, getDuelsForContent } from '@/lib/duels';
import type { Duel } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { addToWishlist, isInWishlist, removeFromWishlist } from '@/lib/wishlist';
import AddToPlaylistButton from '@/components/AddToPlaylistButton';
import { getSimilarContent } from '@/lib/recommendations';
import { defaultBlurDataURL } from '@/lib/image-blur';
import { useAuth } from './AuthProvider';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface ContentDetailsModalProps {
  content: ContentItem | null;
  onClose: () => void;
}

export default function ContentDetailsModal({ content: initialContent, onClose }: ContentDetailsModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState<ContentItem | null>(initialContent);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Expanded comments state
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ReviewComment | null>(null);

  // Review edit/menu state
  const [openMenuReviewId, setOpenMenuReviewId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [editReviewRating, setEditReviewRating] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);

  // Comment edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Wishlist state
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  // Similar content
  const [similar, setSimilar] = useState<ContentItem[]>([]);

  // Duels active on this content
  const [contentDuels, setContentDuels] = useState<Duel[]>([]);
  const [challengingId, setChallengingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!initialContent) return;

    async function load() {
      setLoading(true);
      // Fetch fresh content in case rating/reviews count updated
      const freshContent = await getContentById(initialContent!.id);
      if (freshContent) setContent(freshContent);

      const revs = await getReviewsForContent(initialContent!.id, user?.id);
      setReviews(revs);
      setLoading(false);

      if (user) {
        const inList = await isInWishlist(user.id, initialContent!.id);
        setWishlisted(inList);
      } else {
        setWishlisted(false);
      }

      // Подгружаем похожее
      const rec = await getSimilarContent(initialContent!.id, 6);
      setSimilar(rec);

      // Дуэли по этой публикации
      const ds = await getDuelsForContent(initialContent!.id, user?.id);
      setContentDuels(ds);
    }
    load();
  }, [initialContent?.id, user]);

  // Reviews that are already locked in active duels — cannot be challenged again
  const lockedReviewIds = React.useMemo(() => {
    const ids = new Set<string>();
    contentDuels.filter(d => d.status === 'active').forEach(d => {
      ids.add(d.challengerReviewId);
      ids.add(d.defenderReviewId);
    });
    return ids;
  }, [contentDuels]);

  const myReview = user ? reviews.find(r => r.userId === user.id) : undefined;

  const canChallenge = (target: Review): boolean => {
    if (!user || !myReview) return false;
    if (target.userId === user.id) return false;
    if (!target.text || target.text.length < 200) return false;
    if (!myReview.text || myReview.text.length < 200) return false;
    if (target.rating !== 1 && target.rating !== 5) return false;
    if (myReview.rating !== 1 && myReview.rating !== 5) return false;
    if (target.rating === myReview.rating) return false;
    if (lockedReviewIds.has(target.id) || lockedReviewIds.has(myReview.id)) return false;
    return true;
  };

  const handleChallenge = async (target: Review) => {
    if (!user || !content || !myReview) return;
    setChallengingId(target.id);
    try {
      const duel = await nominateDuel({
        contentId: content.id,
        challengerReviewId: myReview.id,
        defenderReviewId: target.id,
        createdBy: user.id,
        source: 'nomination',
      });
      if (duel) {
        router.push(`/duels/${duel.id}`);
      }
    } catch (e) {
      console.error(e);
      alert('Не удалось создать дуэль. Возможно, она уже существует.');
    }
    setChallengingId(null);
  };


  const handleToggleWishlist = async () => {
    if (!user || !content || wishlistBusy) return;
    setWishlistBusy(true);
    const next = !wishlisted;
    // Оптимистично переключаем UI
    setWishlisted(next);
    try {
      if (next) await addToWishlist(user.id, content.id);
      else await removeFromWishlist(user.id, content.id);
    } catch (e) {
      console.error(e);
      setWishlisted(!next); // откат
    }
    setWishlistBusy(false);
  };

  const handleSubmitReview = async () => {
    if (!user || !content || !newReviewText.trim()) return;
    
    setSubmittingReview(true);
    try {
      await submitReview(content.id, user.id, newReviewText, newReviewRating);
      // reload reviews
      const revs = await getReviewsForContent(content.id, user.id);
      setReviews(revs);
      setShowReviewForm(false);
      setNewReviewText('');
      
      // refresh content to update main rating
      const freshContent = await getContentById(content.id);
      if (freshContent) setContent(freshContent);
    } catch (e) {
      console.error(e);
      alert('Ошибка при отправке отзыва. Возможно, вы уже оставляли отзыв.');
    }
    setSubmittingReview(false);
  };

  const handleRateReview = async (reviewId: string, rating: number) => {
    if (!user) return alert('Войдите, чтобы оценивать отзывы');
    try {
      await rateReview(reviewId, user.id, rating);
      const revs = await getReviewsForContent(content!.id, user.id);
      setReviews(revs);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleComments = async (reviewId: string) => {
    if (expandedReviewId === reviewId) {
      setExpandedReviewId(null);
      return;
    }
    setExpandedReviewId(reviewId);
    setLoadingComments(true);
    const comments = await getReviewComments(reviewId);
    setReviewComments(comments);
    setLoadingComments(false);
  };

  const startEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditReviewText(review.text);
    setEditReviewRating(review.rating || 0);
    setOpenMenuReviewId(null);
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditReviewText('');
    setEditReviewRating(0);
  };

  const handleSaveEditReview = async (reviewId: string) => {
    if (!user || !content || !editReviewText.trim()) return;
    setSavingEdit(true);
    try {
      await updateReview(reviewId, user.id, editReviewText, editReviewRating);
      const revs = await getReviewsForContent(content.id, user.id);
      setReviews(revs);
      const fresh = await getContentById(content.id);
      if (fresh) setContent(fresh);
      cancelEditReview();
    } catch (e) {
      console.error(e);
      alert('Не удалось сохранить отзыв');
    }
    setSavingEdit(false);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user || !content) return;
    if (!confirm('Удалить отзыв? Это действие нельзя отменить.')) return;
    try {
      await deleteReview(reviewId, user.id);
      const revs = await getReviewsForContent(content.id, user.id);
      setReviews(revs);
      const fresh = await getContentById(content.id);
      if (fresh) setContent(fresh);
      setOpenMenuReviewId(null);
    } catch (e) {
      console.error(e);
      alert('Не удалось удалить отзыв');
    }
  };

  const handleSaveEditComment = async (reviewId: string, commentId: string) => {
    if (!user || !editCommentText.trim()) return;
    try {
      await updateReviewComment(commentId, user.id, editCommentText);
      const comments = await getReviewComments(reviewId);
      setReviewComments(comments);
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (reviewId: string, commentId: string) => {
    if (!user) return;
    if (!confirm('Удалить комментарий?')) return;
    try {
      await deleteReviewComment(commentId, user.id);
      const comments = await getReviewComments(reviewId);
      setReviewComments(comments);
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, commentCount: Math.max(0, (r.commentCount || 1) - 1) } : r));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitComment = async (reviewId: string) => {
    if (!user || !newCommentText.trim()) return;
    try {
      await addReviewComment(reviewId, user.id, replyTarget ? `@${replyTarget.user?.name}, ${newCommentText}` : newCommentText);
      setNewCommentText('');
      setReplyTarget(null);
      const comments = await getReviewComments(reviewId);
      setReviewComments(comments);
      // update comment count on the review item
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, commentCount: (r.commentCount || 0) + 1 } : r));
    } catch (e) {
      console.error(e);
    }
  };

  if (!content) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background animate-in slide-in-from-bottom-8 duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-surface/80 backdrop-blur-xl border-b border-on-surface/5 z-10 px-4 py-4 flex items-center gap-4">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface flex-shrink-0 flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-base font-semibold text-on-surface tracking-tight truncate flex-1 leading-none pt-1">
          {content.title}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-safe">
        {/* Cinematic Backdrop with Blurry Cover */}
        <div className="relative aspect-[4/3] md:aspect-[21/7] w-full bg-surface-container overflow-hidden">
          {content.imageUrl ? (
             <Image
               src={content.imageUrl}
               alt={content.title}
               fill
               sizes="(min-width: 768px) 1024px, 100vw"
               placeholder="blur"
               blurDataURL={defaultBlurDataURL}
               className="object-cover object-top scale-105 opacity-60 brightness-75"
               priority
             />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20">Backdrop</div>
          )}
          {/* Double Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-100"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
        </div>

        {/* Overlapping Poster — sits between backdrop and card */}
        <div className="relative z-30 flex justify-center -mt-48 mb-[-60px] pointer-events-none">
          <div className="w-32 md:w-40 aspect-[2/3] pointer-events-auto">
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border-4 border-white">
               {content.imageUrl ? (
                 <Image
                   src={content.imageUrl}
                   alt={content.title}
                   fill
                   sizes="(min-width: 768px) 160px, 128px"
                   placeholder="blur"
                   blurDataURL={defaultBlurDataURL}
                   className="object-cover"
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-surface-container text-on-surface-variant font-bold text-xs">—</div>
               )}
            </div>
          </div>
        </div>

        {/* Content Info */}
        <div className="px-6 relative z-10 -mt-16">
          <div className="bg-surface rounded-3xl p-8 pt-20 border border-on-surface/5 shadow-2xl">

            <div className="text-center mb-6">
               {content.status === 'rejected' && content.rejectionReason && (
                 <div className="mb-6 w-full p-4 bg-red-50/50 border border-red-100/50 rounded-2xl flex gap-3 items-start backdrop-blur-sm text-left">
                   <span className="material-symbols-outlined text-red-500 shrink-0">report_problem</span>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">Причина отклонения</p>
                     <p className="text-sm font-medium text-red-900 leading-relaxed">{content.rejectionReason}</p>
                   </div>
                 </div>
               )}
               <span className="inline-block px-3 py-1 bg-surface-container-high/50 text-on-surface-muted text-[10px] font-bold uppercase tracking-widest rounded-lg mb-3">
                 {content.type === 'movie' ? 'Кино' : 'Книга'}
               </span>
               <h1 className="text-3xl font-black text-on-surface leading-tight tracking-tighter mb-1">
                 {content.title}
               </h1>
               <p className="text-on-surface-variant font-medium text-base mb-4">
                 {content.author || content.director || 'Неизвестный автор'}
               </p>

               {/* Overall Publication Rating (Interactive Stars) */}
               <div className="flex flex-col items-center gap-3 bg-surface-container-high/40 backdrop-blur-sm rounded-2xl py-6 px-8 border border-on-surface/5 mb-6">
                 <div className="flex items-center gap-2">
                   <span className="material-symbols-outlined text-[18px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                   <span className="text-2xl font-black tracking-tighter text-on-surface">{content.rating?.toFixed(1) || '0.0'}</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">{content.reviewCount || 0} оценок</span>
                 </div>
                 
                 {user && (
                   <div className="flex flex-col items-center gap-2">
                     <p className="text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-muted">Оцените {content.type === 'movie' ? 'фильм' : 'книгу'}</p>
                     <div className="flex gap-1.5">
                       {[1, 2, 3, 4, 5].map(star => {
                         const isRated = (reviews.find(r => r.userId === user.id)?.rating || 0) >= star;
                         return (
                           <button 
                             key={star} 
                             onClick={async () => {
                               const existing = reviews.find(r => r.userId === user.id);
                               if (existing) {
                                 await submitReview(content.id, user.id, existing.text, star);
                               } else {
                                 await submitReview(content.id, user.id, '', star);
                               }
                               const fresh = await getContentById(content.id);
                               if (fresh) setContent(fresh);
                               const revs = await getReviewsForContent(content.id, user.id);
                               setReviews(revs);
                             }}
                             className="transition-all hover:scale-110 active:scale-90"
                           >
                             <span
                               className={`material-symbols-outlined text-2xl ${isRated ? 'text-amber-500' : 'text-on-surface-variant/20'}`}
                               style={{ fontVariationSettings: isRated ? "'FILL' 1" : "'FILL' 0" }}
                             >
                               star
                             </span>
                           </button>
                         );
                       })}
                     </div>
                   </div>
                 )}
               </div>
            </div>

            <p className="text-on-surface-variant text-sm leading-relaxed mb-6 whitespace-pre-wrap">
              {content.description}
            </p>

            {user && (
              <div className="mb-6">
                <motion.button
                  onClick={handleToggleWishlist}
                  disabled={wishlistBusy}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border transition-all ${
                    wishlisted
                      ? 'bg-on-surface/5 text-on-surface border-on-surface/10'
                      : 'bg-on-surface text-surface border-on-surface active:scale-95 shadow-lg shadow-black/10'
                  }`}
                >
                  <motion.span
                    key={wishlisted ? 'wl-filled' : 'wl-empty'}
                    initial={{ scale: 0.5, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    bookmark
                  </motion.span>
                  {wishlisted ? 'В закладках' : 'Добавить в закладки'}
                </motion.button>
                <div className="mt-2.5">
                  <AddToPlaylistButton contentId={content.id} />
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm bg-surface-container-lowest p-4 rounded-xl border border-on-surface/5">
              {content.year && <div><span className="text-on-surface-muted text-xs font-medium block mb-0.5">Год</span> <span className="font-semibold text-on-surface">{content.year}</span></div>}
              {content.genre && <div><span className="text-on-surface-muted text-xs font-medium block mb-0.5">Жанр</span> <span className="font-semibold text-on-surface">{Array.isArray(content.genre) ? content.genre.join(', ') : content.genre}</span></div>}
              {content.duration && <div><span className="text-on-surface-muted text-xs font-medium block mb-0.5">Продолжительность</span> <span className="font-semibold text-on-surface">{content.duration}</span></div>}
              {content.pages && <div><span className="text-on-surface-muted text-xs font-medium block mb-0.5">Страниц</span> <span className="font-semibold text-on-surface">{content.pages}</span></div>}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="px-6 py-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-on-surface tracking-tight">Отзывы</h3>
            {!showReviewForm && user && !reviews.find(r => r.userId === user.id) && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-on-surface text-surface px-4 py-2 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
              >
                Написать
              </button>
            )}
          </div>

           {/* Write Review Form */}
           {showReviewForm && (
             <div className="bg-surface-container-low p-6 rounded-2xl mb-6 border border-on-surface/5">
                <h4 className="font-semibold text-on-surface mb-1 text-base">
                  Написать отзыв
                </h4>
                <p className="text-xs text-on-surface-muted font-medium mb-6">
                  Расскажите, что вы думаете о произведении. Отзывы оцениваются лайками сообщества.
                </p>

                <textarea
                  value={newReviewText}
                  onChange={e => setNewReviewText(e.target.value)}
                  className="w-full bg-surface border border-on-surface/10 rounded-xl p-4 text-sm font-medium text-on-surface focus:outline-none focus:border-on-surface/40 min-h-[120px] resize-none mb-4"
                  placeholder={`Напишите развернутый отзыв на ${content.type === 'movie' ? 'фильм' : 'книгу'}...`}
                />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="px-4 py-2 rounded-xl font-semibold text-on-surface-variant text-sm hover:bg-surface-container transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || !newReviewText.trim()}
                    className="bg-on-surface text-surface px-5 py-2 rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-on-surface/90 transition-colors"
                  >
                    {submittingReview ? 'Отправка...' : 'Опубликовать'}
                  </button>
                </div>
             </div>
           )}

           {/* Reviews List */}
           {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-on-surface border-t-transparent rounded-full animate-spin"></div>
              </div>
           ) : reviews.length === 0 ? (
              <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-on-surface/5">
                 <p className="text-on-surface-variant font-semibold text-sm">Пока нет отзывов</p>
                 <p className="text-xs font-medium text-on-surface-muted mt-1">Станьте первым</p>
              </div>
           ) : (
             <div className="space-y-6">
               {reviews.map(review => {
                 const isOwn = user?.id === review.userId;
                 const isEditing = editingReviewId === review.id;
                 return (
                 <div key={review.id} className="bg-surface rounded-2xl p-5 border border-on-surface/5">
                   <div className="flex items-start justify-between mb-4 gap-3">
                     <div className="flex items-center gap-3 min-w-0">
                       <div className="relative w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-muted font-semibold overflow-hidden border border-on-surface/5 shrink-0">
                         {review.user?.avatarUrl ? (
                           <Image src={review.user.avatarUrl} alt={review.user.name || ''} fill sizes="36px" className="object-cover" />
                         ) : review.user?.name.charAt(0) || 'U'}
                       </div>
                       <div className="min-w-0">
                         <p className="font-semibold text-sm text-on-surface truncate">{review.user?.name || 'Пользователь'}</p>
                         <div className="flex items-center gap-2 mt-0.5">
                           {review.rating ? (
                             <div className="flex items-center gap-0.5" aria-label={`Оценка ${review.rating} из 5`}>
                               {[1, 2, 3, 4, 5].map(star => (
                                 <span
                                   key={star}
                                   className={`material-symbols-outlined text-[13px] ${star <= (review.rating || 0) ? 'text-amber-500' : 'text-on-surface-variant/20'}`}
                                   style={{ fontVariationSettings: star <= (review.rating || 0) ? "'FILL' 1" : "'FILL' 0" }}
                                 >
                                   star
                                 </span>
                               ))}
                             </div>
                           ) : null}
                           <span className="text-xs font-medium text-on-surface-muted">
                             {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                           </span>
                         </div>
                       </div>
                     </div>

                     {isOwn && !isEditing && (
                       <div className="relative shrink-0">
                         <button
                           type="button"
                           onClick={() => setOpenMenuReviewId(openMenuReviewId === review.id ? null : review.id)}
                           className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-muted hover:bg-surface-container transition-colors"
                           aria-label="Действия с отзывом"
                         >
                           <span className="material-symbols-outlined text-[20px]">more_vert</span>
                         </button>
                         {openMenuReviewId === review.id && (
                           <>
                             <div className="fixed inset-0 z-10" onClick={() => setOpenMenuReviewId(null)} />
                             <div className="absolute right-0 top-9 z-20 min-w-[160px] bg-surface border border-on-surface/10 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                               <button
                                 onClick={() => startEditReview(review)}
                                 className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                               >
                                 <span className="material-symbols-outlined text-[18px]">edit</span>
                                 Редактировать
                               </button>
                               <button
                                 onClick={() => handleDeleteReview(review.id)}
                                 className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                               >
                                 <span className="material-symbols-outlined text-[18px]">delete</span>
                                 Удалить
                               </button>
                             </div>
                           </>
                         )}
                       </div>
                     )}
                   </div>

                   {isEditing ? (
                     <div className="mb-4">
                       <div className="flex items-center gap-1.5 mb-3">
                         <span className="text-xs font-medium text-on-surface-muted mr-1">Оценка:</span>
                         {[1, 2, 3, 4, 5].map(star => (
                           <button
                             key={star}
                             type="button"
                             onClick={() => setEditReviewRating(star)}
                             className="transition-transform hover:scale-110"
                           >
                             <span
                               className={`material-symbols-outlined text-xl ${star <= editReviewRating ? 'text-amber-500' : 'text-on-surface-variant/20'}`}
                               style={{ fontVariationSettings: star <= editReviewRating ? "'FILL' 1" : "'FILL' 0" }}
                             >
                               star
                             </span>
                           </button>
                         ))}
                       </div>
                       <textarea
                         value={editReviewText}
                         onChange={e => setEditReviewText(e.target.value)}
                         className="w-full bg-surface-container-lowest border border-on-surface/10 rounded-xl p-3 text-sm font-medium text-on-surface focus:outline-none focus:border-on-surface/40 min-h-[100px] resize-none"
                       />
                       <div className="flex justify-end gap-2 mt-3">
                         <button
                           onClick={cancelEditReview}
                           className="px-4 py-1.5 rounded-lg font-semibold text-on-surface-variant text-sm hover:bg-surface-container transition-colors"
                         >
                           Отмена
                         </button>
                         <button
                           onClick={() => handleSaveEditReview(review.id)}
                           disabled={savingEdit || !editReviewText.trim()}
                           className="bg-on-surface text-surface px-4 py-1.5 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors"
                         >
                           {savingEdit ? 'Сохранение...' : 'Сохранить'}
                         </button>
                       </div>
                     </div>
                   ) : (
                     <p className="text-sm text-on-surface leading-relaxed mb-6 whitespace-pre-wrap">
                       {review.text}
                     </p>
                   )}

                   {!isEditing && (
                   <div className="flex items-center justify-between border-t border-on-surface/5 pt-4 gap-2">
                       <div className="flex items-center gap-2">
                          {!isOwn && (
                            <>
                              <button
                                onClick={() => handleRateReview(review.id, 5)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                                  review.myVote === 5
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                    : 'bg-surface-container-lowest border-on-surface/5 text-on-surface-muted hover:text-emerald-500 hover:border-emerald-500/20'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: review.myVote === 5 ? "'FILL' 1" : "'FILL' 0" }}>thumb_up</span>
                                <span className="text-xs font-semibold">{review.likesCount || 0}</span>
                              </button>

                              <button
                                onClick={() => handleRateReview(review.id, 1)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                                  review.myVote === 1
                                    ? 'bg-red-500/10 border-red-500/20 text-red-600'
                                    : 'bg-surface-container-lowest border-on-surface/5 text-on-surface-muted hover:text-red-500 hover:border-red-500/20'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: review.myVote === 1 ? "'FILL' 1" : "'FILL' 0" }}>thumb_down</span>
                                <span className="text-xs font-semibold">{review.dislikesCount || 0}</span>
                              </button>
                            </>
                          )}
                          {isOwn && (
                            <div className="flex items-center gap-3 text-xs font-medium text-on-surface-muted">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                                {review.likesCount || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                                {review.dislikesCount || 0}
                              </span>
                            </div>
                          )}
                       </div>

                     <div className="flex items-center gap-1.5 shrink-0">
                       {/* Challenge to duel */}
                       {canChallenge(review) && (
                         <button
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleChallenge(review);
                           }}
                           disabled={challengingId === review.id}
                           className="flex items-center gap-1 text-on-surface hover:bg-on-surface hover:text-surface transition-colors bg-surface-container-low border border-on-surface/10 px-2.5 py-1.5 rounded-lg cursor-pointer disabled:opacity-60"
                           title="Вызвать на дуэль"
                         >
                           <span className="material-symbols-outlined text-[16px]">swords</span>
                           <span className="text-xs font-semibold hidden sm:inline">
                             {challengingId === review.id ? '...' : 'Дуэль'}
                           </span>
                         </button>
                       )}

                       {/* Locked in active duel */}
                       {lockedReviewIds.has(review.id) && (() => {
                         const d = contentDuels.find(x =>
                           x.status === 'active' &&
                           (x.challengerReviewId === review.id || x.defenderReviewId === review.id)
                         );
                         return d ? (
                           <Link
                             href={`/duels/${d.id}`}
                             className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg"
                             title="В дуэли"
                           >
                             <span className="material-symbols-outlined text-[16px]">swords</span>
                             <span className="text-xs font-semibold">На арене</span>
                           </Link>
                         ) : null;
                       })()}

                       {/* Comments Toggle */}
                       <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation();
                           toggleComments(review.id);
                         }}
                         className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors bg-surface-container px-3 py-1.5 rounded-lg cursor-pointer relative z-10"
                       >
                         <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                         <span className="text-xs font-semibold">{review.commentCount || 0}</span>
                       </button>
                     </div>
                  </div>
                  )}

                  {/* Comments Section */}
                  {expandedReviewId === review.id && (
                    <div className="mt-6 pt-6 border-t border-on-surface/5 animate-in slide-in-from-top-4 duration-300">
                      {/* Add Comment Input - Moved to top for visibility */}
                      <div className="mb-6">
                        {user ? (
                          <div className="flex flex-col gap-2">
                            {replyTarget && (
                              <div className="flex items-center justify-between bg-on-surface/5 px-3 py-1.5 rounded-lg border border-on-surface/5 animate-in fade-in slide-in-from-top-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                                  Ответ для @{replyTarget.user?.name}
                                </span>
                                <button onClick={() => setReplyTarget(null)} className="material-symbols-outlined text-[14px] text-on-surface-variant hover:text-red-500">close</button>
                              </div>
                            )}
                            <div className="flex gap-2 bg-surface-container-low p-3 rounded-xl border border-on-surface/5">
                              <input
                                type="text"
                                value={newCommentText}
                                onChange={e => setNewCommentText(e.target.value)}
                                placeholder={replyTarget ? `Ответить @${replyTarget.user?.name}...` : "Написать комментарий..."}
                                className="flex-1 bg-surface border border-on-surface/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-on-surface/40"
                                onKeyDown={e => e.key === 'Enter' && handleSubmitComment(review.id)}
                              />
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubmitComment(review.id);
                                }}
                                disabled={!newCommentText.trim()}
                                className="w-10 h-10 bg-on-surface text-surface rounded-xl flex items-center justify-center disabled:opacity-50 transition-all active:scale-95 shrink-0 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-surface-container-lowest rounded-xl border border-dashed border-on-surface/10">
                             <p className="text-sm font-medium text-on-surface-muted mb-2">Обсуждение доступно участникам</p>
                             <Link href="/login" className="text-on-surface font-semibold text-sm hover:underline">Войти в аккаунт</Link>
                          </div>
                        )}
                      </div>

                      {loadingComments ? (
                         <div className="text-center py-4 text-on-surface-variant text-sm">Загрузка...</div>
                      ) : (
                        <div className="space-y-4">
                          {reviewComments.length === 0 ? (
                            <p className="text-center text-xs text-on-surface-variant opacity-60">Пока нет комментариев. Будьте первым!</p>
                          ) : (
                            reviewComments.map(comment => {
                              const isOwnComment = user?.id === comment.userId;
                              const isEditingThis = editingCommentId === comment.id;
                              const mentionMatch = comment.text.match(/^(@[^,]+),\s*([\s\S]*)$/);
                              return (
                              <div key={comment.id} className="flex gap-3 group">
                                <div className="relative w-8 h-8 rounded-full bg-surface-container overflow-hidden flex-shrink-0 border border-on-surface/5 flex items-center justify-center font-semibold text-on-surface text-xs">
                                  {comment.user?.avatarUrl ? (
                                    <Image src={comment.user.avatarUrl} alt={comment.user.name || ''} fill sizes="32px" className="object-cover" />
                                  ) : comment.user?.name.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {isEditingThis ? (
                                    <div>
                                      <textarea
                                        value={editCommentText}
                                        onChange={e => setEditCommentText(e.target.value)}
                                        className="w-full bg-surface-container-lowest border border-on-surface/10 rounded-lg p-2 text-sm font-medium text-on-surface focus:outline-none focus:border-on-surface/40 min-h-[60px] resize-none"
                                      />
                                      <div className="flex justify-end gap-2 mt-2">
                                        <button
                                          onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}
                                          className="text-xs font-semibold text-on-surface-muted hover:text-on-surface px-2 py-1"
                                        >
                                          Отмена
                                        </button>
                                        <button
                                          onClick={() => handleSaveEditComment(review.id, comment.id)}
                                          disabled={!editCommentText.trim()}
                                          className="bg-on-surface text-surface px-3 py-1 rounded-lg text-xs font-semibold disabled:opacity-50"
                                        >
                                          Сохранить
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm text-on-surface leading-relaxed">
                                        <span className="font-semibold mr-1.5">{comment.user?.name}</span>
                                        {mentionMatch ? (
                                          <>
                                            <span className="text-primary font-medium">{mentionMatch[1]}</span>
                                            <span>{mentionMatch[2] ? ` ${mentionMatch[2]}` : ''}</span>
                                          </>
                                        ) : (
                                          comment.text
                                        )}
                                      </p>
                                      <div className="flex items-center gap-3 mt-1 text-[11px] font-medium text-on-surface-muted">
                                        <span>{new Date(comment.createdAt).toLocaleDateString('ru-RU')}</span>
                                        {user && !isOwnComment && (
                                          <button
                                            onClick={() => setReplyTarget(comment)}
                                            className="hover:text-on-surface transition-colors"
                                          >
                                            Ответить
                                          </button>
                                        )}
                                        {isOwnComment && (
                                          <>
                                            <button
                                              onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.text); }}
                                              className="hover:text-on-surface transition-colors"
                                            >
                                              Изменить
                                            </button>
                                            <button
                                              onClick={() => handleDeleteComment(review.id, comment.id)}
                                              className="hover:text-red-600 transition-colors"
                                            >
                                              Удалить
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
                 );
               })}
             </div>
           )}
        </div>

        {/* Похожее */}
        {similar.length > 0 && (
          <div className="px-6 pb-16 max-w-6xl mx-auto">
            <h3 className="text-xl font-bold text-on-surface tracking-tight mb-6">
              Похожее
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {similar.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setContent(s)}
                  className="group text-left"
                >
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-surface-container border border-on-surface/5 transition-all">
                    {s.imageUrl && (
                      <Image
                        src={s.imageUrl}
                        alt={s.title}
                        fill
                        sizes="(min-width: 1024px) 180px, 45vw"
                        placeholder="blur"
                        blurDataURL={defaultBlurDataURL}
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    )}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-on-surface line-clamp-2 leading-snug">
                    {s.title}
                  </p>
                  <p className="mt-1 text-xs font-medium text-on-surface-muted">
                    {s.type === 'movie' ? 'Кино' : 'Книга'}
                    {s.year ? ` · ${s.year}` : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
