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
              return (
                <div key={review.id} className="bg-surface rounded-2xl p-4 border border-on-surface/5">
                  {/* Content row */}
                  <button
                    onClick={() => openContent(review)}
                    className="w-full flex items-start gap-3 text-left group"
                  >
                    <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-surface-container border border-on-surface/5 shrink-0">
                      {content?.imageUrl ? (
                        <Image
                          src={content.imageUrl}
                          alt={content.title}
                          fill
                          sizes="56px"
                          placeholder="blur"
                          blurDataURL={defaultBlurDataURL}
                          className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-muted">
                          <span className="material-symbols-outlined text-xl">
                            {content?.type === 'movie' ? 'movie' : 'menu_book'}
                          </span>
                        </div>
                      )}

                      {/* Year Badge Overlay */}
                      {content?.year && (
                        <div className="absolute top-1 right-1 px-1 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-0.5 z-10 animate-in fade-in zoom-in duration-500">
                          <span className="material-symbols-rounded text-white" style={{ fontSize: '9px', fontVariationSettings: "'FILL' 1" }}>event</span>
                          <span className="text-[9px] font-bold text-white leading-none">{content.year}</span>
                        </div>
                      )}

                      {/* Rating Badge Overlay */}
                      {review.rating && (
                        <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-0.5 z-10">
                          <span className="material-symbols-rounded text-amber-400" style={{ fontVariationSettings: "'FILL' 1", fontSize: '10px' }}>star</span>
                          <span className="text-[10px] font-bold text-white">{review.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-on-surface-muted uppercase tracking-wider mb-0.5">
                        {content?.type === 'movie' ? 'Кино' : 'Книга'}
                      </p>
                      <h3 className="text-sm font-semibold text-on-surface leading-snug line-clamp-2 group-hover:text-primary transition-colors h-10">
                        {content?.title || 'Публикация'}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-medium text-on-surface-muted">
                          {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Review text / edit */}
                  {isEditing ? (
                    <div className="mt-4">
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="text-xs font-medium text-on-surface-muted mr-1">Оценка:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditRating(star)}
                            className="transition-transform hover:scale-110"
                          >
                            <span
                              className={`material-symbols-outlined text-xl ${star <= editRating ? 'text-amber-500' : 'text-on-surface-variant/20'}`}
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
                        className="w-full bg-surface-container-lowest border border-on-surface/10 rounded-xl p-3 text-sm font-medium text-on-surface focus:outline-none focus:border-on-surface/40 min-h-[100px] resize-none"
                      />
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-1.5 rounded-lg font-semibold text-on-surface-variant text-sm hover:bg-surface-container transition-colors"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={() => saveEdit(review)}
                          disabled={saving || !editText.trim()}
                          className="bg-on-surface text-surface px-4 py-1.5 rounded-lg font-semibold text-sm disabled:opacity-50"
                        >
                          {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    review.text && (
                      <p className="mt-3 text-sm text-on-surface leading-relaxed whitespace-pre-wrap line-clamp-4">
                        {review.text}
                      </p>
                    )
                  )}

                  {/* Footer actions */}
                  {!isEditing && (
                    <div className="mt-4 pt-3 border-t border-on-surface/5 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs font-medium text-on-surface-muted">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                          {review.likesCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                          {review.dislikesCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                          {review.commentCount || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(review)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          Изменить
                        </button>
                        <button
                          onClick={() => removeReview(review)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Удалить
                        </button>
                      </div>
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
