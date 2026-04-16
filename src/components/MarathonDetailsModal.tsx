'use client';

import React, { useState, useEffect } from 'react';
import { ClubMarathon, MarathonItem, MarathonParticipantProgress } from '@/lib/types';
import { getMarathonItems, getMarathonProgress, updateMarathonProgressItem } from '@/lib/db';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  marathon: ClubMarathon | null;
  userId: string;
}

export default function MarathonDetailsModal({ isOpen, onClose, marathon, userId }: Props) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'participants'>('tasks');
  const [items, setItems] = useState<MarathonItem[]>([]);
  const [progress, setProgress] = useState<MarathonParticipantProgress[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local state for user's own edits
  const [myProgress, setMyProgress] = useState<Record<string, { isCompleted: boolean; review: string }>>({});

  useEffect(() => {
    if (isOpen && marathon) {
      loadData();
    }
  }, [isOpen, marathon]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [_items, _prog] = await Promise.all([
        getMarathonItems(marathon!.id),
        getMarathonProgress(marathon!.id)
      ]);
      setItems(_items);
      setProgress(_prog);
      
      const myProg: Record<string, { isCompleted: boolean; review: string }> = {};
      _items.forEach(item => {
        const p = _prog.find(x => x.itemId === item.id && x.userId === userId);
        myProg[item.id] = {
          isCompleted: p?.isCompleted || false,
          review: p?.reviewText || ''
        };
      });
      setMyProgress(myProg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (itemId: string, val: boolean) => {
    // Optimistically update local UI
    setMyProgress(prev => ({ ...prev, [itemId]: { ...prev[itemId], isCompleted: val } }));
    try {
      await updateMarathonProgressItem(marathon!.id, userId, itemId, val, myProgress[itemId]?.review || '');
      loadData();
    } catch(e) {
      console.error(e);
    }
  };

  const handleReviewSave = async (itemId: string) => {
    try {
      await updateMarathonProgressItem(marathon!.id, userId, itemId, myProgress[itemId]?.isCompleted || false, myProgress[itemId]?.review || '');
      loadData(); // reload to get saved status
    } catch(e) {
      console.error(e);
    }
  };

  if (!isOpen || !marathon) return null;

  // Group progress by user for participants tab
  const participantsProgress = progress.reduce((acc, p) => {
    if (!acc[p.userId]) {
      acc[p.userId] = {
        userName: p.userName,
        userAvatar: p.userAvatar,
        progress: []
      };
    }
    acc[p.userId].progress.push(p);
    return acc;
  }, {} as Record<string, { userName?: string; userAvatar?: string; progress: MarathonParticipantProgress[] }>);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-white/20 backdrop-blur-3xl" onClick={onClose}>
      <div
        className="bg-white rounded-[40px] p-10 w-full max-w-2xl shadow-[0_64px_128px_-16px_rgba(0,0,0,0.2)] max-h-[85vh] overflow-hidden flex flex-col border border-black/5 animate-in zoom-in-95 fade-in duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8 flex-shrink-0">
          <div>
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.4em] block mb-2 opacity-40 italic">Детали марафона</span>
            <h2 className="text-4xl font-black tracking-tighter leading-none">{marathon.title}</h2>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center hover:bg-on-surface hover:text-surface transition-all active:scale-90">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex gap-10 mb-10 flex-shrink-0">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-4 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative ${
              activeTab === 'tasks' ? 'text-on-surface' : 'text-on-surface-variant opacity-30 hover:opacity-100'
            }`}
          >
            Мои задания
            {activeTab === 'tasks' && <div className="absolute bottom-0 left-0 w-full h-1 bg-on-surface rounded-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`pb-4 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative ${
              activeTab === 'participants' ? 'text-on-surface' : 'text-on-surface-variant opacity-30 hover:opacity-100'
            }`}
          >
            Участники
            {activeTab === 'participants' && <div className="absolute bottom-0 left-0 w-full h-1 bg-on-surface rounded-full"></div>}
          </button>
        </div>

        <div className="overflow-y-auto pr-2 flex-grow flex flex-col gap-6 custom-scrollbar">
          {loading ? (
             <div className="flex justify-center py-20">
               <div className="w-12 h-12 border-[6px] border-on-surface/5 border-t-on-surface rounded-full animate-spin"></div>
             </div>
          ) : activeTab === 'tasks' ? (
             items.length === 0 ? (
               <div className="text-center py-20 px-10 bg-surface-container/30 rounded-[32px] border border-dashed border-black/5">
                 <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-30">В этом марафоне нет заданий</p>
               </div>
             ) : (
               items.map(item => (
                 <div key={item.id} className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm group hover:shadow-2xl transition-all duration-500">
                   <div className="flex items-start gap-6 mb-8">
                     <div className="relative mt-1">
                        <input
                          type="checkbox"
                          checked={myProgress[item.id]?.isCompleted || false}
                          onChange={(e) => handleToggle(item.id, e.target.checked)}
                          className="peer w-6 h-6 rounded-lg border-2 border-black/10 bg-white checked:bg-on-surface checked:border-on-surface cursor-pointer appearance-none transition-all"
                        />
                        <span className="material-symbols-outlined absolute inset-0 text-white text-[16px] pointer-events-none opacity-0 peer-checked:opacity-100 flex items-center justify-center">check</span>
                     </div>
                     <h4 className={`text-xl font-black tracking-tighter transition-all italic ${myProgress[item.id]?.isCompleted ? 'text-on-surface-variant/20 line-through' : 'text-on-surface'}`}>
                       {item.title}
                     </h4>
                   </div>
                   
                   <div className="pl-12 space-y-4">
                     <textarea
                       value={myProgress[item.id]?.review || ''}
                       onChange={(e) => setMyProgress(prev => ({...prev, [item.id]: {...prev[item.id], review: e.target.value}}))}
                       placeholder="Ваши мысли после ознакомления..."
                       className="w-full text-xs font-black p-6 rounded-2xl bg-surface-container/30 border border-transparent focus:outline-none focus:bg-white focus:border-black/5 focus:shadow-sm min-h-[120px] transition-all placeholder:text-on-surface-variant/20 italic"
                     />
                     <div className="flex justify-end">
                       <button
                         onClick={() => handleReviewSave(item.id)}
                         className="px-6 py-3 bg-on-surface text-surface text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                       >
                         Сохранить мысли
                       </button>
                     </div>
                   </div>
                 </div>
               ))
             )
          ) : (
             Object.keys(participantsProgress).length === 0 ? (
               <div className="text-center py-20 px-10 bg-surface-container/30 rounded-[32px] border border-dashed border-black/5">
                 <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-30">Никто еще не начал путь</p>
               </div>
             ) : (
               Object.values(participantsProgress).map((userProg, idx) => {
                 const completedCount = userProg.progress.filter(p => p.isCompleted).length;
                 const total = items.length;
                 const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
                 
                 return (
                   <div key={idx} className="bg-white rounded-[32px] p-8 border border-black/5 shadow-sm hover:shadow-xl transition-all duration-500">
                     <div className="flex items-center gap-5 mb-8 border-b border-black/5 pb-8">
                       <div className="relative">
                         {userProg.userAvatar ? (
                           <img src={userProg.userAvatar} alt="Avatar" className="w-14 h-14 rounded-[20px] object-cover grayscale brightness-90 border border-black/5 shadow-sm" />
                         ) : (
                           <div className="w-14 h-14 rounded-[20px] bg-surface-container flex items-center justify-center text-[14px] font-black italic text-on-surface/20 border border-black/5">
                             {(userProg.userName || '?').charAt(0).toUpperCase()}
                           </div>
                         )}
                         <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center text-white border-2 border-white shadow-lg">
                           <span className="material-symbols-outlined text-[12px] font-black">bolt</span>
                         </div>
                       </div>
                       <div className="flex-grow">
                         <h4 className="font-black text-lg tracking-tighter italic">{userProg.userName || 'Strand Person'}</h4>
                         <div className="flex items-center gap-4 mt-1">
                           <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                             <div className="bg-on-surface h-full" style={{ width: `${percent}%` }}></div>
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                             {percent}% ({completedCount} / {total})
                           </span>
                         </div>
                       </div>
                     </div>
                     <div className="space-y-6">
                       {userProg.progress.filter(p => p.isCompleted || p.reviewText).map(p => {
                         const matchingItem = items.find(i => i.id === p.itemId);
                         return (
                           <div key={p.id} className="relative pl-8">
                             <div className="absolute left-0 top-1">
                               {p.isCompleted ? (
                                 <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
                               ) : (
                                 <span className="material-symbols-outlined text-on-surface-variant/10 text-[20px]">circle</span>
                               )}
                             </div>
                             <span className="text-sm font-black tracking-tighter opacity-80 italic">{matchingItem?.title || 'Archive Item'}</span>
                             {p.reviewText && (
                               <div className="mt-3 p-5 rounded-2xl bg-surface-container/30 border-l-4 border-on-surface">
                                 <p className="text-xs text-on-surface-variant font-medium italic leading-relaxed opacity-70">&laquo;{p.reviewText}&raquo;</p>
                               </div>
                             )}
                           </div>
                         );
                       })}
                       {userProg.progress.filter(p => p.isCompleted || p.reviewText).length === 0 && (
                         <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/20 italic">Только начал путь в этом марафоне...</p>
                       )}
                     </div>
                   </div>
                 );
               })
             )
          )}
        </div>
      </div>
    </div>
  );
}
