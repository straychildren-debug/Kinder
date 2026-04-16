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
        <main className="pt-24 pb-32 px-6 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center border border-on-surface/5 shadow-2xl">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">shield</span>
          </div>
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tighter">Доступ ограничен</h2>
            <p className="text-on-surface-variant text-sm font-medium opacity-60 max-w-xs mx-auto  leading-relaxed">
              Страница модерации доступна только участникам совета сообщества. Свяжитесь с администрацией для получения прав.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-10 py-4 bg-on-surface text-surface rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-2xl shadow-on-surface/20"
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
        <section className="mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-2 block opacity-40 ">Панель управления</span>
          <h1 className="text-5xl font-black tracking-tighter text-on-surface leading-[0.9]">Секция<br/>модерации</h1>
          <p className="text-on-surface-variant text-sm mt-6 font-medium opacity-70  leading-relaxed max-w-lg">
            Ваша роль — защитник качества сообщества. Проверьте последние публикации и вынесите вердикт.
          </p>
        </section>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-[32px] p-8 border border-on-surface/5 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all duration-500">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-4 ">Ожидают проверки</span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-on-surface">{pendingItems.length}</span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-20">постов</span>
            </div>
          </div>
          <div className="bg-white rounded-[32px] p-8 border border-on-surface/5 shadow-sm flex flex-col justify-between opacity-40">
            <span className="text-[9px] font-black uppercase tracking-widest text-green-600 mb-4 ">Всего одобрено</span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-on-surface">1.2k</span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-20">актив</span>
            </div>
          </div>
          <div className="bg-white rounded-[32px] p-8 border border-on-surface/5 shadow-sm flex flex-col justify-between opacity-40">
            <span className="text-[9px] font-black uppercase tracking-widest text-red-600 mb-4 ">Отклонено</span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-on-surface">84</span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-20">спам</span>
            </div>
          </div>
        </div>

        {/* Список на модерацию */}
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-12 h-12 border-[6px] border-on-surface/5 border-t-on-surface rounded-full animate-spin"></div>
          </div>
        ) : pendingItems.length === 0 ? (
          <div className="bg-surface rounded-[40px] p-20 text-center space-y-6 border border-on-surface/5 shadow-sm border-dashed">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 ">task_alt</span>
            </div>
            <p className="text-on-surface-variant font-medium text-sm  opacity-60">Очередь пуста. Вы отлично справляетесь!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {pendingItems.map(item => {
              const isProcessing = processingId === item.id;
              
              return (
                <article key={item.id} className={`bg-white rounded-[40px] overflow-hidden shadow-sm border border-on-surface/5 transition-all duration-700 hover:shadow-2xl ${isProcessing ? 'opacity-40 pointer-events-none scale-95' : ''}`}>
                  <div className="flex flex-col md:row">
                    <div className="flex flex-col md:flex-row">
                      {/* Изображение */}
                      <div className="md:w-[350px] aspect-[4/5] md:aspect-auto relative overflow-hidden bg-surface-container border-r border-on-surface/5">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover grayscale brightness-90"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center  text-on-surface-variant/10 text-6xl font-black">
                            {item.type === 'movie' ? 'FILM' : 'BOOK'}
                          </div>
                        )}
                        <span className="absolute top-6 left-6 bg-white text-on-surface px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl">
                          {item.type === 'movie' ? 'Кино' : 'Книга'}
                        </span>
                      </div>

                      {/* Контент */}
                      <div className="flex-1 p-8 md:p-12 flex flex-col justify-between min-w-0">
                        <div className="space-y-8">
                          <div className="space-y-2">
                             <div className="flex items-center gap-2 opacity-30">
                               <span className="material-symbols-outlined text-[14px]">history</span>
                               <span className="text-[9px] font-black uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()}</span>
                             </div>
                             <h3 className="text-4xl font-black tracking-tighter text-on-surface leading-tight">{item.title}</h3>
                          </div>

                          <div className="space-y-6">
                            <p className="text-on-surface-variant font-medium text-sm leading-relaxed  opacity-70">"{item.description}"</p>

                            <div className="flex flex-wrap gap-3">
                              {item.type === 'movie' && item.director && (
                                <div className="bg-surface-container px-4 py-2 rounded-2xl flex items-center gap-2 border border-on-surface/5">
                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-30 ">Реж.</span>
                                  <span className="text-[10px] font-black uppercase tracking-tighter">{item.director}</span>
                                </div>
                              )}
                              {item.type === 'book' && item.author && (
                                <div className="bg-surface-container px-4 py-2 rounded-2xl flex items-center gap-2 border border-on-surface/5">
                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-30 ">Автор</span>
                                  <span className="text-[10px] font-black uppercase tracking-tighter">{item.author}</span>
                                </div>
                              )}
                              {item.year && (
                                <div className="bg-surface-container px-4 py-2 rounded-2xl flex items-center gap-2 border border-on-surface/5">
                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-30 ">Год</span>
                                  <span className="text-[10px] font-black uppercase tracking-tighter">{item.year}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="pt-8 border-t border-on-surface/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-xs font-black  text-on-surface/20">
                              ID
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[9px] font-black uppercase tracking-widest opacity-30 ">Автор публикации</span>
                              <span className="block text-xs font-black truncate">{item.createdBy}</span>
                            </div>
                          </div>
                        </div>

                        {/* Кнопки модерации */}
                        <div className="flex gap-4 pt-12">
                          <button
                            onClick={() => handleDecision(item.id, 'rejected')}
                            className="flex-1 py-5 rounded-[20px] font-black text-[11px] uppercase tracking-widest bg-white text-red-600 border border-red-50 hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                            Отклонить
                          </button>
                          <button
                            onClick={() => handleDecision(item.id, 'approved')}
                            className="flex-[2] py-5 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] bg-on-surface text-surface shadow-2xl shadow-on-surface/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            Опубликовать
                          </button>
                        </div>
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
