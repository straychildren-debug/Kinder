'use client';

import React, { useState, useEffect } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useAuth } from '@/components/AuthProvider';
import { getPendingContent, updateContentStatus, getUserById } from '@/lib/db';
import { ContentItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import ModerationActionModal from '@/components/ModerationActionModal';

export default function ModerationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pendingItems, setPendingItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showPending, setShowPending] = useState(false);
  const [selectedForModeration, setSelectedForModeration] = useState<ContentItem | null>(null);

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
    // ... (Unauthorized view remains the same)
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

  const handleDecision = async (id: string, decision: 'approved' | 'rejected', reason?: string) => {
    setProcessingId(id);
    try {
      await updateContentStatus(id, decision, reason);
      setPendingItems(prev => prev.filter(item => item.id !== id));
      setSelectedForModeration(null);
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
                  <div className="space-y-3">
                    {pendingItems.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <button 
                          onClick={() => setSelectedForModeration(item)}
                          className="w-full bg-white rounded-2xl p-4 border border-on-surface/5 shadow-sm hover:shadow-md hover:border-indigo-500/20 transition-all flex items-center gap-4 group text-left"
                        >
                          <div className="w-12 h-16 rounded-lg overflow-hidden bg-surface-container shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-black opacity-20">NA</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-0.5">
                               <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">{item.type === 'movie' ? 'Movie' : 'Book'}</span>
                               <span className="text-[8px] font-bold opacity-20">{new Date(item.createdAt).toLocaleDateString()}</span>
                             </div>
                             <h3 className="font-black text-on-surface truncate uppercase tracking-tight">{item.title}</h3>
                             <p className="text-[10px] text-on-surface-variant font-medium opacity-50 truncate">{item.author || item.director || 'Unknown'}</p>
                          </div>
                          <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500">chevron_right</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Modal */}
        {selectedForModeration && (
          <ModerationActionModal 
            content={selectedForModeration}
            onClose={() => setSelectedForModeration(null)}
            onDecision={handleDecision}
            isProcessing={processingId === selectedForModeration.id}
          />
        )}
      </main>
      <BottomNavBar activeTab="home" />
    </>
  );
}
