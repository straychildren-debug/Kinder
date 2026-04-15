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
    <div className="fixed inset-0 z-[110] flex items-center justify-center glass-modal-overlay" onClick={onClose}>
      <div
        className="glass-modal rounded-3xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] block mb-1">Детали марафона</span>
            <h2 className="text-2xl font-bold tracking-tight">{marathon.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex gap-4 mb-6 border-b border-outline-variant/20 flex-shrink-0">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Мои задания
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`pb-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'participants' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Прогресс участников
          </button>
        </div>

        <div className="overflow-y-auto flex-grow flex flex-col gap-4">
          {loading ? (
             <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : activeTab === 'tasks' ? (
             items.length === 0 ? (
               <div className="text-center py-10 text-on-surface-variant text-sm">В этом марафоне нет заданий.</div>
             ) : (
               items.map(item => (
                 <div key={item.id} className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 shadow-sm flex flex-col gap-4">
                   <div className="flex items-start gap-4">
                     <label className="flex items-center gap-3 cursor-pointer mt-1">
                       <input
                         type="checkbox"
                         checked={myProgress[item.id]?.isCompleted || false}
                         onChange={(e) => handleToggle(item.id, e.target.checked)}
                         className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer accent-primary"
                       />
                     </label>
                     <div className="flex-grow">
                       <h4 className={`text-base font-bold transition-all ${myProgress[item.id]?.isCompleted ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                         {item.title}
                       </h4>
                     </div>
                   </div>
                   
                   <div className="pl-9 mt-2">
                     <textarea
                       value={myProgress[item.id]?.review || ''}
                       onChange={(e) => setMyProgress(prev => ({...prev, [item.id]: {...prev[item.id], review: e.target.value}}))}
                       placeholder="Оставьте рецензию или комментарий..."
                       className="w-full text-sm p-3 rounded-lg bg-surface-container-highest border border-outline-variant/10 focus:outline-none focus:ring-1 focus:ring-primary/40 min-h-[80px]"
                     />
                     <div className="flex justify-end mt-2">
                       <button
                         onClick={() => handleReviewSave(item.id)}
                         className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors"
                       >
                         Сохранить отзыв
                       </button>
                     </div>
                   </div>
                 </div>
               ))
             )
          ) : (
             Object.keys(participantsProgress).length === 0 ? (
               <div className="text-center py-10 text-on-surface-variant text-sm">Никто еще не начал марафон.</div>
             ) : (
               Object.values(participantsProgress).map((userProg, idx) => {
                 const completedCount = userProg.progress.filter(p => p.isCompleted).length;
                 const total = items.length;
                 const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
                 
                 return (
                   <div key={idx} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/10 shadow-sm mb-4">
                     <div className="flex items-center gap-3 mb-4 border-b border-outline-variant/10 pb-4">
                       {userProg.userAvatar ? (
                         <img src={userProg.userAvatar} alt="Аватар" className="w-10 h-10 rounded-full object-cover" />
                       ) : (
                         <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                           {(userProg.userName || '?').charAt(0)}
                         </div>
                       )}
                       <div className="flex-grow">
                         <h4 className="font-bold text-sm tracking-tight">{userProg.userName || 'Пользователь'}</h4>
                         <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mt-0.5">
                           Прогресс: {percent}% ({completedCount} из {total})
                         </p>
                       </div>
                     </div>
                     <div className="space-y-4">
                       {userProg.progress.filter(p => p.isCompleted || p.reviewText).map(p => {
                         const matchingItem = items.find(i => i.id === p.itemId);
                         return (
                           <div key={p.id} className="bg-surface-container-low rounded-lg p-3 text-sm">
                             <div className="flex items-center gap-2 mb-1.5">
                               {p.isCompleted ? (
                                 <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                               ) : (
                                 <span className="material-symbols-outlined text-outline text-[16px]">radio_button_unchecked</span>
                               )}
                               <span className="font-semibold text-on-surface">{matchingItem?.title || 'Задание удалено'}</span>
                             </div>
                             {p.reviewText && (
                               <p className="text-on-surface-variant pl-6 text-xs italic">&laquo;{p.reviewText}&raquo;</p>
                             )}
                           </div>
                         );
                       })}
                       {userProg.progress.filter(p => p.isCompleted || p.reviewText).length === 0 && (
                         <p className="text-xs text-on-surface-variant/50 italic pl-1">Только начал(а) участвовать</p>
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
