'use client';

import React, { useState, useEffect } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useAuth } from '@/components/AuthProvider';
import { getPendingContent, updateContentStatus, getUserById } from '@/lib/db';
import { ContentItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import ContentDetailsModal from '@/components/ContentDetailsModal';

export default function ModerationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pendingItems, setPendingItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showPending, setShowPending] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [activeRejectionId, setActiveRejectionId] = useState<string | null>(null);

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
      const reason = decision === 'rejected' ? rejectionReasons[id] : undefined;
      await updateContentStatus(id, decision, reason);
      setPendingItems(prev => prev.filter(item => item.id !== id));
      setActiveRejectionId(null);
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
          <button 
            onClick={() => setShowPending(!showPending)}
            className={`text-left rounded-[32px] p-8 border shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 active:scale-[0.98] ${showPending ? 'bg-amber-50 border-amber-200' : 'bg-white border-on-surface/5'}`}
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-4 ">Ожидают проверки</span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-on-surface">{pendingItems.length}</span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-20">постов</span>
            </div>
          </button>
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
        {!showPending ? (
          <div className="text-center py-20 bg-surface-container/30 rounded-[40px] border border-dashed border-on-surface/10">
             <p className="text-on-surface-variant font-black uppercase text-[10px] tracking-widest opacity-30">Нажмите "Ожидают проверки", чтобы увидеть список</p>
          </div>
        ) : loading ? (
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
          <div className="space-y-4">
            {pendingItems.map(item => {
              const isProcessing = processingId === item.id;
              const isRejecting = activeRejectionId === item.id;
              
              return (
                <div key={item.id} className="group">
                  <article 
                    className={`bg-white rounded-[32px] overflow-hidden shadow-sm border border-on-surface/5 transition-all duration-300 hover:shadow-xl ${isProcessing ? 'opacity-40 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center">
                      {/* Мини-превью (Клик сюда или на контент открывает детали) */}
                      <div 
                        onClick={() => setSelectedContent(item)}
                        className="w-24 h-24 md:w-32 md:h-32 shrink-0 relative overflow-hidden bg-surface-container border-r border-on-surface/5 cursor-pointer group/img"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover grayscale brightness-90 group-hover/img:scale-110 group-hover/img:grayscale-0 transition-all duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/10 text-xl font-black">
                            {item.type === 'movie' ? 'F' : 'B'}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-2xl">visibility</span>
                        </div>
                      </div>

                      {/* Основная инфа */}
                      <div className="flex-1 px-6 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-6 min-w-0">
                        <div 
                          onClick={() => setSelectedContent(item)}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-surface-container rounded-md opacity-60">
                               {item.type === 'movie' ? 'Кино' : 'Книга'}
                             </span>
                             <span className="text-[8px] font-black uppercase tracking-widest opacity-20">{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          <h3 className="text-xl font-black tracking-tighter text-on-surface truncate group-hover:text-amber-600 transition-colors uppercase">{item.title}</h3>
                          <p className="text-[11px] text-on-surface-variant font-medium opacity-50 truncate max-w-md">
                            {item.author || item.director || 'Автор не указан'} • {item.description}
                          </p>
                        </div>

                        {/* Кнопки действий */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setActiveRejectionId(isRejecting ? null : item.id)}
                            className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center ${isRejecting ? 'bg-red-600 text-white shadow-lg' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                            title="Отклонить"
                          >
                            <span className="material-symbols-outlined text-[20px]">{isRejecting ? 'close_fullscreen' : 'close'}</span>
                          </button>
                          <button
                            onClick={() => handleDecision(item.id, 'approved')}
                            className="h-12 px-6 rounded-2xl bg-on-surface text-surface font-black text-[10px] uppercase tracking-widest shadow-lg shadow-on-surface/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            Опубликовать
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Поле ввода причины (инлайн) */}
                    {isRejecting && (
                      <div className="px-6 pb-6 pt-2 border-t border-on-surface/5 bg-red-50/30 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-600 opacity-60">Причина отказа (увидит автор)</span>
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-20">Пожалуйста, будьте вежливы</span>
                          </div>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={rejectionReasons[item.id] || ''}
                              onChange={(e) => setRejectionReasons(prev => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="Например: Некорректное описание или низкое качество обложки..."
                              className="flex-1 bg-white border border-red-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-200 transition-all"
                              autoFocus
                            />
                            <button
                              onClick={() => handleDecision(item.id, 'rejected')}
                              disabled={!(rejectionReasons[item.id]?.trim())}
                              className="px-6 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-200 transition-all disabled:opacity-30 disabled:shadow-none hover:bg-red-700 active:scale-95"
                            >
                              Подтвердить
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Modal */}
        {selectedContent && (
          <ContentDetailsModal 
            content={selectedContent} 
            onClose={() => setSelectedContent(null)} 
          />
        )}
      </main>
      <BottomNavBar activeTab="home" />
    </>
  );
}
