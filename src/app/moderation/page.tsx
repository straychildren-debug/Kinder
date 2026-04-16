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
            onClick={() => setShowPending(true)}
            className="text-left bg-white rounded-[32px] p-8 border border-on-surface/5 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 active:scale-[0.98]"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Ожидают проверки
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-on-surface group-hover:text-amber-500 transition-colors">{pendingItems.length}</span>
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

        <div className="text-center py-20 bg-surface-container/30 rounded-[40px] border border-dashed border-on-surface/10">
           <p className="text-on-surface-variant font-black uppercase text-[10px] tracking-widest opacity-30">Нажмите "Ожидают проверки", чтобы открыть список</p>
        </div>

        {/* --- MODAL WINDOW FOR LIST --- */}
        {showPending && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-[#f8f9fc] animate-in slide-in-from-bottom-8 duration-500">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            {/* Header (Glassmorphism) */}
            <header className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-on-surface/5 z-20 px-8 py-7 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setShowPending(false)}
                  className="w-14 h-14 rounded-[20px] bg-white shadow-sm border border-on-surface/5 flex items-center justify-center hover:bg-surface-container-high hover:scale-105 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-on-surface">arrow_back</span>
                </button>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter text-[#1a1c1e] leading-none mb-1">Очередь проверки</h2>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{pendingItems.length} новых объектов</span>
                  </div>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-12 pb-32 relative z-10">
              <div className="max-w-4xl mx-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className="w-14 h-14 border-[6px] border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Синхронизация данных...</span>
                  </div>
                ) : pendingItems.length === 0 ? (
                  <div className="bg-white rounded-[48px] p-24 text-center space-y-8 border border-on-surface/5 shadow-2xl shadow-indigo-900/5">
                    <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
                      <span className="material-symbols-outlined text-5xl text-amber-500">verified</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black tracking-tight">Всё проверено!</h3>
                      <p className="text-on-surface-variant font-medium text-sm  opacity-50 max-w-xs mx-auto">Вы настоящий страж качества. Сейчас в очереди нет новых публикаций.</p>
                    </div>
                    <button 
                       onClick={() => setShowPending(false)}
                       className="px-12 py-5 bg-[#1a1c1e] text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105 active:scale-95"
                    >
                      К статистике
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingItems.map((item, index) => {
                      const isProcessing = processingId === item.id;
                      const isRejecting = activeRejectionId === item.id;
                      
                      return (
                        <div 
                          key={item.id} 
                          className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <article 
                            className={`bg-white rounded-[40px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-on-surface/5 transition-all duration-500 ${isProcessing ? 'opacity-40 pointer-events-none blur-sm' : ''} group`}
                          >
                            <div className="flex flex-col md:flex-row">
                              {/* Изображение (Широкое и эффектное) */}
                              <div 
                                onClick={() => setSelectedContent(item)}
                                className="md:w-56 h-auto aspect-square md:aspect-auto shrink-0 relative overflow-hidden bg-[#f0f2f5] cursor-pointer group/img"
                              >
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover grayscale brightness-95 group-hover/img:scale-110 group-hover/img:grayscale-0 transition-all duration-1000"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-on-surface/10 text-3xl font-black">
                                    {item.type === 'movie' ? 'FILM' : 'BOOK'}
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-r from-black/0 to-black/20 md:to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                                <span className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover/img:opacity-100 transition-all translate-y-2 group-hover/img:translate-y-0 shadow-2xl">
                                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                                </span>
                              </div>

                              {/* Контент */}
                              <div className="flex-1 px-8 py-8 flex flex-col justify-between gap-8">
                                <div 
                                  onClick={() => setSelectedContent(item)}
                                  className="flex-1 cursor-pointer space-y-2"
                                >
                                  <div className="flex items-center gap-3">
                                     <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-surface-container rounded-full text-on-surface-variant opacity-70">
                                       {item.type === 'movie' ? 'Кино' : 'Книга'}
                                     </span>
                                     <span className="text-[9px] font-black uppercase tracking-widest opacity-20">{new Date(item.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <h3 className="text-3xl font-black tracking-tighter text-[#1a1c1e] group-hover:text-indigo-600 transition-colors uppercase leading-[0.9] pt-2 mb-2">
                                    {item.title}
                                  </h3>
                                  <p className="text-[13px] text-on-surface-variant font-medium opacity-60 line-clamp-2 max-w-xl italic">
                                    {item.author || item.director || 'Автор не указан'} — {item.description}
                                  </p>
                                </div>

                                {/* Кнопки действий (Премиум-стиль) */}
                                <div className="flex items-center justify-between pt-6 border-t border-on-surface/5">
                                   <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-[14px] bg-surface-container overflow-hidden border border-on-surface/5 flex items-center justify-center text-[10px] font-black text-on-surface/20">
                                        ID
                                      </div>
                                      <span className="text-[10px] font-black uppercase tracking-widest opacity-30 ">{item.createdBy.slice(0, 8)}...</span>
                                   </div>

                                   <div className="flex items-center gap-3">
                                      <button
                                        onClick={() => setActiveRejectionId(isRejecting ? null : item.id)}
                                        className={`w-14 h-14 rounded-full transition-all flex items-center justify-center shadow-lg ${isRejecting ? 'bg-[#ff3b30] text-white rotate-90 scale-110 shadow-[#ff3b30]/30' : 'bg-[#fff5f5] text-[#ff3b30] hover:bg-[#ffe5e5] shadow-black/5 hover:scale-110'}`}
                                        title="Отклонить"
                                      >
                                        <span className="material-symbols-outlined text-[24px]">{isRejecting ? 'close_fullscreen' : 'close'}</span>
                                      </button>
                                      
                                      <button
                                        onClick={() => handleDecision(item.id, 'approved')}
                                        className="h-14 px-10 rounded-full bg-[#1a1c1e] text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_20px_40px_-12px_rgba(26,28,30,0.3)] hover:translate-y-[-4px] hover:shadow-[0_25px_50px_-12px_rgba(26,28,30,0.4)] active:scale-95 transition-all flex items-center gap-3 group/btn"
                                      >
                                        <span className="material-symbols-outlined text-[20px] group-hover/btn:rotate-[360deg] transition-all duration-700">check_circle</span>
                                        Опубликовать
                                      </button>
                                   </div>
                                </div>
                              </div>
                            </div>

                            {/* Поле ввода причины (Премиум) */}
                            {isRejecting && (
                              <div className="px-8 pb-8 pt-2 border-t border-[#ff3b30]/5 bg-[#fff5f5]/50 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex flex-col gap-4">
                                  <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#ff3b30] ">Укажите причину отказа</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-20 italic">Будет отправлено автору</span>
                                  </div>
                                  <div className="flex flex-col md:flex-row gap-4">
                                    <input
                                      type="text"
                                      value={rejectionReasons[item.id] || ''}
                                      onChange={(e) => setRejectionReasons(prev => ({ ...prev, [item.id]: e.target.value }))}
                                      placeholder="Например: Некорректное описание или низкое качество..."
                                      className="flex-1 bg-white border border-[#ff3b30]/10 rounded-[20px] px-6 py-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#ff3b30]/5 focus:border-[#ff3b30]/30 transition-all placeholder:opacity-30"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleDecision(item.id, 'rejected')}
                                      disabled={!(rejectionReasons[item.id]?.trim())}
                                      className="px-8 bg-[#ff3b30] text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#ff3b30]/20 transition-all disabled:opacity-30 disabled:grayscale hover:bg-[#d70015] active:scale-95"
                                    >
                                      Отклонить пост
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
              </div>
            </div>
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
