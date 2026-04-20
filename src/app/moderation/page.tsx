'use client';

import React, { useState, useEffect } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useAuth } from '@/components/AuthProvider';
import { getPendingContent, updateContentStatus, getUserById, getModerationStats, getApprovedContent, getRejectedContent, getModeratorStats } from '@/lib/db';
import { ContentItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import ModerationActionModal from '@/components/ModerationActionModal';
import Image from 'next/image';
import { defaultBlurDataURL } from '@/lib/image-blur';

export default function ModerationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [itemsList, setItemsList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingList, setViewingList] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [selectedForModeration, setSelectedForModeration] = useState<ContentItem | null>(null);
  const [globalStats, setGlobalStats] = useState({ approved: 0, rejected: 0, pending: 0 });
  const [personalStats, setPersonalStats] = useState({ approved: 0, rejected: 0 });

  const loadStats = async () => {
    if (!user) return;
    const gStats = await getModerationStats();
    setGlobalStats(gStats);
    const pStats = await getModeratorStats(user.id);
    setPersonalStats(pStats);
  };

  const fetchListView = async (view: 'pending' | 'approved' | 'rejected') => {
    setLoading(true);
    let items: ContentItem[] = [];
    if (view === 'pending') {
      items = await getPendingContent();
    } else if (view === 'approved') {
      items = await getApprovedContent(user?.id);
    } else if (view === 'rejected') {
      items = await getRejectedContent(user?.id);
    }
    setItemsList(items);
    setLoading(false);
  };

  useEffect(() => {
    async function init() {
      if (user && (user.role === 'moderator' || user.role === 'admin' || user.role === 'superadmin')) {
        await loadStats();
      }
      setLoading(false);
    }
    init();
  }, [user]);

  useEffect(() => {
    if (viewingList && user) {
      fetchListView(viewingList);
    }
  }, [viewingList, user]);

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
      await updateContentStatus(id, decision, reason, user.id);
      setItemsList(prev => prev.filter(item => item.id !== id));
      setSelectedForModeration(null);
      await loadStats();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const getHeaderConfig = () => {
    switch(viewingList) {
      case 'approved': return { title: 'Одобрено вами', color: 'emerald', icon: 'verified' };
      case 'rejected': return { title: 'Отклонено вами', color: 'red', icon: 'report' };
      default: return { title: 'Очередь проверки', color: 'amber', icon: 'pending_actions' };
    }
  };

  const header = getHeaderConfig();

  return (
    <>
      <TopNavBar />
      <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
        <section className="mb-10">
          <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Панель управления</span>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface leading-tight">Секция модерации</h1>
          <p className="text-on-surface-muted text-sm mt-4 font-medium leading-relaxed max-w-lg">
            Ваша роль — защитник качества сообщества. Проверьте последние публикации и вынесите вердикт.
          </p>
        </section>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <button 
            onClick={() => setViewingList('pending')}
            className={`text-left bg-white rounded-[32px] p-8 border border-on-surface/5 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 active:scale-[0.98] ${viewingList === 'pending' ? 'ring-2 ring-amber-500/20 shadow-xl' : ''}`}
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Ожидают проверки
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-on-surface group-hover:text-amber-500 transition-colors">
                {formatNumber(globalStats.pending)}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-20">постов</span>
            </div>
          </button>
          
          <button 
            onClick={() => setViewingList('approved')}
            className={`text-left bg-white rounded-[32px] p-8 border border-on-surface/5 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 active:scale-[0.98] ${viewingList === 'approved' ? 'ring-2 ring-emerald-500/20 shadow-xl' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
               <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Всего одобрено</span>
               <span className="text-[8px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Вами: {personalStats.approved}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-on-surface group-hover:text-emerald-600 transition-colors">
                {formatNumber(globalStats.approved)}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-20">актив</span>
            </div>
          </button>

          <button 
            onClick={() => setViewingList('rejected')}
            className={`text-left bg-white rounded-[32px] p-8 border border-on-surface/5 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 active:scale-[0.98] ${viewingList === 'rejected' ? 'ring-2 ring-red-500/20 shadow-xl' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
               <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Отклонено</span>
               <span className="text-[8px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">Вами: {personalStats.rejected}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-on-surface group-hover:text-red-600 transition-colors">
                {formatNumber(globalStats.rejected)}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-20">спам</span>
            </div>
          </button>
        </div>


        {/* --- MODAL WINDOW FOR LIST --- */}
        {viewingList && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-[#f8f9fc] animate-in slide-in-from-bottom-8 duration-500">
            {/* Background Decoration */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-700 ${
              viewingList === 'approved' ? 'bg-emerald-500/5' : viewingList === 'rejected' ? 'bg-red-500/5' : 'bg-amber-500/5'
            }`}></div>
            
            {/* Header (Glassmorphism) */}
            <header className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-on-surface/5 z-20 px-8 py-7">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setViewingList(null)}
                    className="w-14 h-14 rounded-[20px] bg-white shadow-sm border border-on-surface/5 flex items-center justify-center hover:bg-surface-container-high hover:scale-105 active:scale-95 transition-all focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-on-surface">arrow_back</span>
                  </button>
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter text-[#1a1c1e] leading-none mb-1">{header.title}</h2>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse bg-${header.color}-500`}></span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                        {loading ? 'Загрузка...' : `${itemsList.length} объектов`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-12 pb-32 relative z-10">
              <div className="max-w-4xl mx-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className={`w-14 h-14 border-[6px] border-${header.color}-500/10 border-t-${header.color}-500 rounded-full animate-spin`}></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Синхронизация данных...</span>
                  </div>
                ) : itemsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 border border-on-surface/5 shadow-[0_20px_40px_rgba(0,0,0,0.05)] relative">
                      <div className={`absolute inset-0 bg-${header.color}-500/10 rounded-full animate-ping opacity-20`}></div>
                      <span className={`material-symbols-outlined text-5xl text-${header.color}-500 relative z-10`}>{header.icon}</span>
                    </div>
                    <div className="space-y-3 text-center mb-12">
                      <h3 className="text-3xl font-extrabold tracking-tighter text-on-surface uppercase">
                        {viewingList === 'pending' ? 'Всё проверено!' : 'Список пуст'}
                      </h3>
                      <p className="text-on-surface-variant font-medium text-sm opacity-50 max-w-xs mx-auto leading-relaxed">
                        {viewingList === 'pending' 
                          ? 'Вы настоящий страж качества. Сейчас в очереди нет новых публикаций.' 
                          : viewingList === 'approved' 
                          ? 'Вы еще не одобрили ни одной публикации. Ваше мнение важно!'
                          : 'Вы не отклонили ни одной публикации. Идеальный контент?'}
                      </p>
                    </div>
                    <button 
                       onClick={() => setViewingList(null)}
                       className="px-10 h-14 bg-[#0f172a] text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black active:scale-95 transition-all flex items-center gap-3 focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[18px]">analytics</span>
                      К статистике
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    {itemsList.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="h-full animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <button 
                          onClick={() => setSelectedForModeration(item)}
                          className="w-full h-full flex flex-col group text-left outline-none bg-white p-3 rounded-2xl border border-on-surface/5 shadow-sm hover:shadow-xl transition-all duration-500"
                        >
                          {/* Poster Column */}
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface-container border border-on-surface/5 shadow-sm group-hover:scale-[1.02] transition-transform duration-500 mb-4 ring-1 ring-on-surface/5">
                            {/* Year Badge */}
                            {item.year && (
                              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md flex items-center gap-1 z-10 border border-white/10 animate-in fade-in zoom-in duration-500">
                                <span className="material-symbols-rounded text-white" style={{ fontSize: '11px', fontVariationSettings: "'FILL' 1" }}>event</span>
                                <span className="text-[10px] font-bold text-white leading-none">{item.year}</span>
                              </div>
                            )}

                            {item.rating && (
                              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 z-10 animate-in fade-in zoom-in duration-500 shadow-xl">
                                <span className="material-symbols-rounded text-amber-400" style={{ fontVariationSettings: "'FILL' 1", fontSize: '11px' }}>star</span>
                                <span className="text-[11px] font-black text-white leading-none">{item.rating.toFixed(1)}</span>
                              </div>
                            )}
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.title}
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                placeholder="blur"
                                blurDataURL={defaultBlurDataURL}
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-black opacity-20 uppercase">No Poster</div>
                            )}

                            {/* Status Indicator Overlays */}
                            {item.status === 'rejected' && (
                              <div className="absolute inset-x-0 bottom-0 bg-red-500/90 backdrop-blur-md py-3 px-4 flex items-center justify-between">
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">Rejected</span>
                                <span className="material-symbols-outlined text-white text-[14px]">error</span>
                              </div>
                            )}
                            {item.status === 'approved' && (
                              <div className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-md w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-white text-[16px]">verified</span>
                              </div>
                            )}
                          </div>

                          {/* Metadata Block */}
                          <div className="px-1 flex flex-col flex-1">
                            <h3 className="text-[11px] font-black text-[#1a1c1e] leading-tight line-clamp-2 uppercase tracking-tight group-hover:text-amber-600 transition-colors mb-1 h-8">
                              {item.title}
                            </h3>
                            <span className="text-[10px] font-bold text-on-surface-variant/40 truncate leading-none mb-3 block">
                              {item.author || item.director || 'Unknown'}
                            </span>

                            {item.description && (
                              <p className="text-[10px] font-medium text-on-surface-variant/60 leading-normal line-clamp-3 mt-auto">
                                {item.description}
                              </p>
                            )}
                          </div>
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
