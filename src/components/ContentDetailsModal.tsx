'use client';

import React, { useEffect, useState } from 'react';
import { ContentItem, Review, User, ReviewComment } from '@/lib/types';
import { getReviewsForContent, submitReview, rateReview, addReviewComment, getReviewComments, getContentById } from '@/lib/db';
import { useAuth } from './AuthProvider';

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

  useEffect(() => {
    if (!initialContent) return;
    
    async function load() {
      setLoading(true);
      // Fetch fresh content in case rating/reviews count updated
      const freshContent = await getContentById(initialContent!.id);
      if (freshContent) setContent(freshContent);
      
      const revs = await getReviewsForContent(initialContent!.id);
      setReviews(revs);
      setLoading(false);
    }
    load();
  }, [initialContent?.id]);

  const handleSubmitReview = async () => {
    if (!user || !content || newReviewRating === 0 || !newReviewText.trim()) return;
    
    setSubmittingReview(true);
    try {
      await submitReview(content.id, user.id, newReviewText, newReviewRating);
      // reload reviews
      const revs = await getReviewsForContent(content.id);
      setReviews(revs);
      setShowReviewForm(false);
      setNewReviewText('');
      setNewReviewRating(0);
      
      // refresh content to update main rating
      const freshContent = await getContentById(content.id);
      if (freshContent) setContent(freshContent);
    } catch (e) {
      console.error(e);
      alert('Ошибка при отправке рецензии. Возможно, вы уже оставляли рецензию.');
    }
    setSubmittingReview(false);
  };

  const handleRateReview = async (reviewId: string, rating: number) => {
    if (!user) return alert('Войдите, чтобы оценивать рецензии');
    try {
      await rateReview(reviewId, user.id, rating);
      // update local state optimistically or reload
      const revs = await getReviewsForContent(content!.id);
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

  const handleSubmitComment = async (reviewId: string) => {
    if (!user || !newCommentText.trim()) return;
    try {
      await addReviewComment(reviewId, user.id, newCommentText);
      setNewCommentText('');
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
        <h2 className="text-xl font-black text-on-surface tracking-tight truncate flex-1 leading-none pt-1">
          {content.title}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-safe">
        {/* Hero Cover */}
        <div className="relative aspect-video md:aspect-[21/9] w-full bg-surface-container">
          {content.imageUrl ? (
             <img src={content.imageUrl} alt={content.title} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-on-surface-variant">Нет обложки</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        </div>

        {/* Content Info */}
        <div className="px-6 -mt-12 relative z-10">
          <div className="bg-surface rounded-3xl p-6 shadow-xl shadow-on-surface/5 border border-on-surface/5">
            <div className="flex justify-between items-start mb-4">
               <div>
                 <span className="inline-block px-3 py-1 bg-accent-lilac/30 text-on-accent-lilac text-[10px] font-black uppercase tracking-widest rounded-full mb-2">
                   {content.type === 'movie' ? 'Кино' : 'Книга'}
                 </span>
                 <h1 className="text-3xl font-black text-on-surface leading-tight tracking-tighter">
                   {content.title}
                 </h1>
                 <p className="text-on-surface-variant font-bold mt-1">
                   {content.author || content.director || 'Неизвестен'}
                 </p>
               </div>
               
               {/* Global Rating Badge */}
               <div className="flex flex-col items-center justify-center bg-on-surface text-surface rounded-2xl p-3 shadow-lg">
                 <div className="flex items-center gap-1">
                   <span className="material-symbols-outlined text-[18px] text-accent-lilac" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                   <span className="text-xl font-black">{content.rating?.toFixed(1) || '—'}</span>
                 </div>
                 <span className="text-[9px] uppercase tracking-widest font-black opacity-80">{content.reviewCount || 0} оценок</span>
               </div>
            </div>

            <p className="text-on-surface-variant text-sm leading-relaxed mb-6 whitespace-pre-wrap">
              {content.description}
            </p>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm bg-surface-container-lowest p-4 rounded-2xl border border-on-surface/5">
              {content.year && <div><span className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest block">Год</span> <span className="font-bold text-on-surface">{content.year}</span></div>}
              {content.genre && <div><span className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest block">Жанр</span> <span className="font-bold text-on-surface">{Array.isArray(content.genre) ? content.genre.join(', ') : content.genre}</span></div>}
              {content.duration && <div><span className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest block">Продолжительность</span> <span className="font-bold text-on-surface">{content.duration}</span></div>}
              {content.pages && <div><span className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest block">Страниц</span> <span className="font-bold text-on-surface">{content.pages}</span></div>}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="px-6 py-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-on-surface tracking-tighter">Рецензии</h3>
            {!showReviewForm && user && !reviews.find(r => r.userId === user.id) && (
              <button 
                onClick={() => setShowReviewForm(true)}
                className="bg-accent-lilac text-on-accent-lilac px-5 py-2.5 rounded-full font-black text-[12px] uppercase tracking-widest shadow-sm hover:scale-105 transition-transform"
              >
                Написать
              </button>
            )}
          </div>

          {/* Write Review Form */}
          {showReviewForm && (
            <div className="bg-surface-container-low p-6 rounded-3xl mb-8 border border-on-surface/5 shadow-inner">
               <h4 className="font-black text-on-surface mb-4">Ваша рецензия и оценка</h4>
               
               {/* Star Rating Input */}
               <div className="flex gap-2 mb-6">
                 {[1, 2, 3, 4, 5].map(star => (
                   <button 
                     key={star} 
                     onClick={() => setNewReviewRating(star)}
                     className="transition-transform hover:scale-110"
                   >
                     <span 
                       className={`material-symbols-outlined text-3xl ${newReviewRating >= star ? 'text-accent-lilac' : 'text-on-surface-variant/30'}`}
                       style={{ fontVariationSettings: newReviewRating >= star ? "'FILL' 1" : "'FILL' 0" }}
                     >
                       star
                     </span>
                   </button>
                 ))}
               </div>

               <textarea
                 value={newReviewText}
                 onChange={e => setNewReviewText(e.target.value)}
                 className="w-full bg-surface border border-on-surface/10 rounded-2xl p-4 text-sm font-medium text-on-surface focus:outline-none focus:border-accent-lilac min-h-[120px] resize-none mb-4"
                 placeholder="Напишите развернутый отзыв..."
               />

               <div className="flex justify-end gap-3">
                 <button 
                   onClick={() => setShowReviewForm(false)}
                   className="px-5 py-2.5 rounded-full font-black text-on-surface-variant text-[11px] uppercase tracking-widest hover:bg-surface-container transition-colors"
                 >
                   Отмена
                 </button>
                 <button 
                   onClick={handleSubmitReview}
                   disabled={submittingReview || newReviewRating === 0 || !newReviewText.trim()}
                   className="bg-on-surface text-surface px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest disabled:opacity-50 hover:bg-on-surface/90 transition-colors shadow-lg shadow-on-surface/10"
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
             <div className="text-center py-12 bg-surface-container-lowest rounded-3xl border border-on-surface/5">
                <p className="text-on-surface-variant font-black text-sm">Пока нет рецензий.</p>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60 mt-2">Станьте первым!</p>
             </div>
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="bg-surface rounded-3xl p-6 border border-on-surface/5 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent-lilac flex items-center justify-center text-on-accent-lilac font-black overflow-hidden border border-on-surface/5">
                        {review.user?.avatarUrl ? <img src={review.user.avatarUrl} className="w-full h-full object-cover" /> : review.user?.name.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-black text-sm text-on-surface">{review.user?.name || 'Пользователь'}</p>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                          {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    {/* User's rating for the content */}
                    <div className="bg-accent-lilac/20 px-2 py-1 rounded-lg flex items-center gap-1 border border-accent-lilac/30">
                      <span className="material-symbols-outlined text-[14px] text-on-surface" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-sm font-black text-on-surface">{review.rating}</span>
                    </div>
                  </div>

                  <p className="text-sm text-on-surface leading-relaxed mb-6 whitespace-pre-wrap">
                    {review.text}
                  </p>

                  <div className="flex items-center justify-between border-t border-on-surface/5 pt-4">
                     {/* Rate the Review */}
                     <div className="flex items-center gap-4">
                       <div className="flex items-center bg-surface-container-lowest rounded-full p-1 border border-on-surface/5">
                         <span className="pl-3 pr-2 text-[10px] font-black uppercase text-on-surface-variant tracking-widest">
                           Оценка рецензии: {review.avgRating && review.avgRating > 0 ? review.avgRating : '—'}
                         </span>
                         <div className="flex gap-0.5 border-l border-on-surface/10 pl-2">
                           {[1,2,3,4,5].map(star => (
                             <button key={star} onClick={() => handleRateReview(review.id, star)} className="hover:scale-110 transition-transform p-0.5">
                               <span className="material-symbols-outlined text-[16px] text-accent-lilac hover:text-on-surface transition-colors" style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
                             </button>
                           ))}
                         </div>
                       </div>
                     </div>

                     {/* Comments Toggle */}
                     <button 
                       onClick={() => toggleComments(review.id)}
                       className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors bg-surface-container px-4 py-2 rounded-full"
                     >
                       <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                       <span className="text-[11px] font-black uppercase tracking-widest">{review.commentCount || 0} комментариев</span>
                     </button>
                  </div>

                  {/* Comments Section */}
                  {expandedReviewId === review.id && (
                    <div className="mt-6 pt-6 border-t border-on-surface/5 animate-in slide-in-from-top-4 duration-300">
                      {loadingComments ? (
                         <div className="text-center py-4 text-on-surface-variant text-sm">Загрузка...</div>
                      ) : (
                        <div className="space-y-4 mb-6">
                          {reviewComments.length === 0 ? (
                            <p className="text-center text-xs text-on-surface-variant">Нет комментариев. Оставьте свое мнение!</p>
                          ) : (
                            reviewComments.map(comment => (
                              <div key={comment.id} className="flex gap-3 bg-surface-container-lowest p-4 rounded-2xl">
                                <div className="w-8 h-8 rounded-full bg-surface overflow-hidden flex-shrink-0 border border-on-surface/5 flex items-center justify-center font-bold text-on-surface text-xs">
                                  {comment.user?.avatarUrl ? <img src={comment.user.avatarUrl} className="w-full h-full object-cover" /> : comment.user?.name.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-black text-xs text-on-surface">{comment.user?.name}</span>
                                    <span className="text-[9px] text-on-surface-variant uppercase font-bold opacity-60">
                                      {new Date(comment.createdAt).toLocaleDateString('ru-RU')}
                                    </span>
                                  </div>
                                  <p className="text-xs text-on-surface-variant leading-relaxed">{comment.text}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      
                      {/* Add Comment Input */}
                      {user && (
                        <div className="flex gap-3">
                          <input 
                            type="text"
                            value={newCommentText}
                            onChange={e => setNewCommentText(e.target.value)}
                            placeholder="Написать комментарий (можно использовать эмодзи)..."
                            className="flex-1 bg-surface border border-on-surface/10 rounded-full px-5 text-sm focus:outline-none focus:border-accent-lilac"
                            onKeyDown={e => e.key === 'Enter' && handleSubmitComment(review.id)}
                          />
                          <button 
                            onClick={() => handleSubmitComment(review.id)}
                            disabled={!newCommentText.trim()}
                            className="w-10 h-10 bg-on-surface text-surface rounded-full flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95 shadow-md shadow-on-surface/10"
                          >
                            <span className="material-symbols-outlined text-[18px]">send</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
