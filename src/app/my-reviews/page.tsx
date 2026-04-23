'use client';

import React, { useEffect, useState } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useAuth } from '@/components/AuthProvider';
import { getReviewsByUser, updateReview, deleteReview, getContentById } from '@/lib/db';
import { Review, ContentItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { defaultBlurDataURL } from '@/lib/image-blur';
import ContentDetailsModal from '@/components/ContentDetailsModal';

export default function MyReviewsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [openedContent, setOpenedContent] = useState<ContentItem | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.review-menu-container')) {
        setMenuOpenId(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const revs = await getReviewsByUser(user.id);
    setReviews(revs);
    setLoading(false);
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) load();
  }, [user, isLoading]);

  const openContent = async (review: Review) => {
    if (review.content) {
      setOpenedContent(review.content);
    } else {
      const fresh = await getContentById(review.contentId);
      if (fresh) setOpenedContent(fresh);
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditText(review.text);
    setEditRating(review.rating || 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditRating(0);
  };

  const saveEdit = async (review: Review) => {
    if (!user || !editText.trim()) return;
    setSaving(true);
    try {
      await updateReview(review.id, user.id, editText, editRating);
      await load();
      cancelEdit();
    } catch (e) {
      console.error(e);
      alert('Не удалось сохранить отзыв');
    }
    setSaving(false);
  };

  const removeReview = async (review: Review) => {
    if (!user) return;
    if (!confirm('Удалить отзыв? Это действие нельзя отменить.')) return;
    try {
      await deleteReview(review.id, user.id);
      await load();
    } catch (e) {
      console.error(e);
      alert('Не удалось удалить отзыв');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-on-surface/5 border-t-accent-lilac rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

  return (
    <>
      <TopNavBar title="Мои отзывы" showBack={true} backPath="/profile" />
      <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
        {/* Header */}
        <section className="pb-8">
          <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Ваши оценки</span>
          <h1 className="text-2xl font-bold tracking-tight leading-tight text-on-surface">Мои отзывы</h1>
        </section>

        {/* Summary */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-surface rounded-2xl p-4 border border-on-surface/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-muted mb-1">Всего отзывов</p>
              <p className="text-2xl font-bold text-on-surface">{reviews.length}</p>
            </div>
            <div className="bg-surface rounded-2xl p-4 border border-on-surface/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-muted mb-1">Средняя оценка</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-on-surface">{avgRating.toFixed(1)}</span>
                <span className="material-symbols-outlined text-amber-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty */}
        {reviews.length === 0 ? (
          <div className="text-center py-20 px-6 bg-surface rounded-3xl border border-on-surface/5">
            <div className="text-6xl mb-4 grayscale opacity-40">✍️</div>
            <p className="text-on-surface font-semibold text-base mb-1">Вы ещё не оставили отзывов</p>
            <p className="text-on-surface-muted text-sm font-medium">Откройте любую книгу или фильм и поделитесь мнением</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const content = review.content;
              const isEditing = editingId === review.id;
              const isMenuOpen = menuOpenId === review.id;

              return (
                <div 
                  key={review.id} 
                  className={`relative rounded-[32px] p-6 border transition-all duration-500 overflow-hidden ${
                    isEditing 
                      ? 'bg-[#16191E] border-primary ring-1 ring-primary/20' 
                      : 'bg-white/[0.03] backdrop-blur-[30px] border-white/[0.08] border-t-white/[0.12] shadow-2xl shadow-black/20'
                  }`}
                >
                  {/* Glass Background Accents */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-lilac/5 blur-[60px] rounded-full pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />

                  {/* Header Row: Content Info + Menu */}
                  <div className="relative flex items-start gap-4 mb-5">
                    <button
                      onClick={() => openContent(review)}
                      className="relative w-16 h-16 rounded-2xl overflow-hidden bg-surface-container border border-on-surface/5 shrink-0 shadow-lg group"
                    >
                      {content?.imageUrl ? (
                        <Image
                          src={content.imageUrl}
                          alt={content.title}
                          fill
                          sizes="64px"
                          placeholder="blur"
                          blurDataURL={defaultBlurDataURL}
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-muted">
                          <span className="material-symbols-outlined text-2xl">
                            {content?.type === 'movie' ? 'movie' : 'menu_book'}
                          </span>
                        </div>
                      )}
                    </button>

                    <div className="flex-1 min-w-0 pr-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 mb-1">
                        {content?.type === 'movie' ? 'Кинорецензия' : 'О книге'}
                      </p>
                      <h3 className="text-sm font-black text-on-surface leading-tight truncate">
                        {content?.title || 'Публикация'}
                      </h3>
                      <p className="text-[10px] font-bold text-on-surface-variant/40 mt-1">
                        {new Date(review.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Three Dots Menu Button */}
                    {!isEditing && (
                      <div className="absolute top-0 right-0 z-10 review-menu-container">
                        <button
                          onClick={(e) => {
                            e.nativeEvent.stopImmediatePropagation();
                            setMenuOpenId(isMenuOpen ? null : review.id);
                          }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isMenuOpen ? 'bg-white text-black shadow-lg' : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.1] hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div 
                            className="absolute top-11 right-0 w-48 bg-[#1A1D23]/95 backdrop-blur-3xl rounded-[20px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden py-2 z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right scale-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(review);
                                setMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-white/80 hover:bg-white/[0.08] hover:text-white transition-all active:bg-white/[0.12]"
                            >
                              <span className="material-symbols-outlined text-[20px] opacity-70">edit</span>
                              Редактировать
                            </button>
                            <div className="mx-3 my-1 border-t border-white/[0.05]" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeReview(review);
                                setMenuOpenId(null);
                              }}
                              className="w-full flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-rose-400 hover:bg-rose-400/10 transition-all active:bg-rose-400/20"
                            >
                              <span className="material-symbols-outlined text-[20px] opacity-70">delete</span>
                              Удалить
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rating Stars Row */}
                  {!isEditing && review.rating && (
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className={`material-symbols-outlined text-[16px] ${
                            s <= (review.rating || 0) ? 'text-amber-500' : 'text-on-surface-variant/10'
                          }`}
                          style={{ fontVariationSettings: s <= (review.rating || 0) ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Review text / edit */}
                  {isEditing ? (
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4 bg-on-surface/[0.03] p-3 rounded-2xl border border-on-surface/[0.05]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-1">Ваша оценка:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditRating(star)}
                            className="transition-all hover:scale-125"
                          >
                            <span
                              className={`material-symbols-outlined text-2xl ${star <= editRating ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'text-on-surface-variant/20'}`}
                              style={{ fontVariationSettings: star <= editRating ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              star
                            </span>
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="Опишите свои впечатления..."
                        className="w-full bg-surface-container-lowest/50 border border-on-surface/10 rounded-[24px] p-5 text-sm font-medium text-on-surface focus:outline-none focus:border-accent-lilac/40 focus:ring-4 focus:ring-accent-lilac/5 min-h-[140px] shadow-inner transition-all"
                      />
                      <div className="flex justify-end gap-3 mt-5">
                        <button
                          onClick={cancelEdit}
                          className="px-6 py-2.5 rounded-xl font-bold text-on-surface-variant text-xs hover:bg-on-surface/[0.05] transition-all"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={() => saveEdit(review)}
                          disabled={saving || !editText.trim()}
                          className="bg-on-surface text-surface px-8 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                          {saving ? 'Сохранение...' : 'Обновить отзыв'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                       {review.text && (
                        <p className="text-[13px] font-medium text-on-surface/80 leading-relaxed italic whitespace-pre-wrap">
                          {review.text}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stats Footer (Premium Chips Style) */}
                  {!isEditing && (
                    <div className="mt-6 pt-5 border-t border-on-surface/[0.03] flex items-center gap-3">
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] group/stat hover:bg-emerald-500/10 active:scale-95 transition-all duration-300">
                        <span 
                          className="material-symbols-outlined text-[16px] text-emerald-500/80 group-hover/stat:text-emerald-500 transition-colors"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          thumb_up
                        </span>
                        <span className="text-[11px] font-black text-on-surface-variant/70 group-hover/stat:text-on-surface transition-colors">
                          {review.likesCount || 0}
                        </span>
                      </button>
                      
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] group/stat hover:bg-rose-500/10 active:scale-95 transition-all duration-300">
                        <span 
                          className="material-symbols-outlined text-[16px] text-rose-500/80 group-hover/stat:text-rose-500 transition-colors"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          thumb_down
                        </span>
                        <span className="text-[11px] font-black text-on-surface-variant/70 group-hover/stat:text-on-surface transition-colors">
                          {review.dislikesCount || 0}
                        </span>
                      </button>

                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] group/stat hover:bg-primary/10 active:scale-95 transition-all duration-300">
                        <span 
                          className="material-symbols-outlined text-[16px] text-accent-lilac group-hover/stat:text-primary transition-colors"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          chat_bubble
                        </span>
                        <span className="text-[11px] font-black text-on-surface-variant/70 group-hover/stat:text-on-surface transition-colors">
                          {review.commentCount || 0}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {openedContent && (
        <ContentDetailsModal
          content={openedContent}
          onClose={() => setOpenedContent(null)}
        />
      )}
      <BottomNavBar activeTab="profile" />
    </>
  );
}
