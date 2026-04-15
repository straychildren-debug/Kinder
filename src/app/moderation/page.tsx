'use client';

import React, { useState, useEffect } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useAuth } from '@/components/AuthProvider';
import { getPendingContent, updateContentStatus, getUserById } from '@/lib/db';
import { ContentItem } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function ModerationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pendingItems, setPendingItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (user && (user.role === 'moderator' || user.role === 'admin' || user.role === 'superadmin')) {
        const items = await getPendingContent();
        setPendingItems(items);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  if (!user || (user.role !== 'moderator' && user.role !== 'admin' && user.role !== 'superadmin')) {
    return (
      <>
        <TopNavBar />
        <main className="pt-24 pb-32 px-6 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">shield</span>
          <h2 className="text-2xl font-bold">Доступ ограничен</h2>
          <p className="text-on-surface-variant text-center">
            Страница модерации доступна только модераторам и администраторам
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 glass-btn text-white rounded-xl font-semibold transition-transform active:scale-95"
          >
            На главную
          </button>
        </main>
        <BottomNavBar />
      </>
    );
  }

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      await updateContentStatus(id, decision);
      setPendingItems(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <TopNavBar />
      <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
        <section className="mb-8">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Модерация</span>
          <h2 className="text-3xl font-bold leading-tight tracking-tight mt-1">Проверка контента</h2>
          <p className="text-on-surface-variant text-sm mt-2">
            Публикации ожидающие одобрения перед появлением в ленте
          </p>
        </section>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-amber-50 rounded-2xl p-5 text-center">
            <span className="block text-2xl font-bold text-amber-700">{pendingItems.length}</span>
            <span className="text-[10px] uppercase tracking-widest text-amber-600 font-semibold">Ожидают</span>
          </div>
          <div className="bg-green-50 rounded-2xl p-5 text-center">
            <span className="block text-2xl font-bold text-green-700">-</span>
            <span className="text-[10px] uppercase tracking-widest text-green-600 font-semibold">Опубликовано</span>
          </div>
          <div className="bg-red-50 rounded-2xl p-5 text-center">
            <span className="block text-2xl font-bold text-red-700">-</span>
            <span className="text-[10px] uppercase tracking-widest text-red-600 font-semibold">Отклонено</span>
          </div>
        </div>

        {/* Список на модерацию */}
        {loading ? (
             <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : pendingItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20">task_alt</span>
            <p className="text-on-surface-variant font-medium">Всё проверено. Ожидающих публикаций нет.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingItems.map(item => {
              const isProcessing = processingId === item.id;
              
              return (
                <article key={item.id} className={`bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm transition-all ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}>
                  <div className="flex flex-col md:flex-row">
                    {/* Изображение */}
                    <div className="md:w-1/3 h-48 md:h-auto relative">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {item.type === 'movie' ? 'Фильм' : 'Книга'}
                      </span>
                    </div>

                    {/* Контент */}
                    <div className="md:w-2/3 p-6 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-xl font-bold">{item.title}</h3>
                        </div>

                        <p className="text-sm text-on-surface-variant leading-relaxed">{item.description}</p>

                        {/* Детали */}
                        <div className="flex flex-wrap gap-2">
                          {item.type === 'movie' && item.director && (
                            <span className="bg-surface-container-low px-3 py-1 rounded-lg text-xs font-medium">
                              🎬 {item.director}
                            </span>
                          )}
                          {item.type === 'book' && item.author && (
                            <span className="bg-surface-container-low px-3 py-1 rounded-lg text-xs font-medium">
                              ✍️ {item.author}
                            </span>
                          )}
                          {item.year && (
                            <span className="bg-surface-container-low px-3 py-1 rounded-lg text-xs font-medium">
                              📅 {item.year}
                            </span>
                          )}
                          {item.genre?.map(g => (
                            <span key={g} className="bg-surface-container-low px-3 py-1 rounded-lg text-xs font-medium">
                              {g}
                            </span>
                          ))}
                        </div>

                        {/* Актёры */}
                        {item.actors && item.actors.length > 0 && (
                          <p className="text-xs text-on-surface-variant">
                            <span className="font-semibold">Актёры:</span> {item.actors.join(', ')}
                          </p>
                        )}

                        {/* Автор публикации можно загружать отдельно, пока просто ID */}
                        <div className="flex items-center gap-3 pt-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary">
                            U
                          </div>
                          <div>
                            <span className="text-xs font-semibold">Пользователь</span>
                            <span className="text-[10px] text-on-surface-variant ml-2">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Кнопки модерации */}
                      <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => handleDecision(item.id, 'approved')}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-green-100 text-green-800 hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">check</span>
                            Одобрить
                          </button>
                          <button
                            onClick={() => handleDecision(item.id, 'rejected')}
                            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-red-100 text-red-800 hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                            Отклонить
                          </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <BottomNavBar />
    </>
  );
}
