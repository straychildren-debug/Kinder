'use client';

import React, { useState } from 'react';
import { ClubMarathon, ContentItem } from '@/lib/types';
import { createMarathon, endMarathon, getApprovedContent } from '@/lib/db';
import Link from 'next/link';

interface MarathonModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  userId: string;
  activeMarathon: ClubMarathon | null;
  onMarathonChange: (marathon: ClubMarathon | null) => void;
}

export default function MarathonModal({
  isOpen,
  onClose,
  clubId,
  userId,
  activeMarathon,
  onMarathonChange,
}: MarathonModalProps) {
  const [title, setTitle] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [items, setItems] = useState<{contentId: string, title: string}[]>([]);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableContent, setAvailableContent] = useState<ContentItem[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      getApprovedContent().then(setAvailableContent).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !endsAt) {
      setError('Заполните все поля');
      return;
    }

    const endDate = new Date(endsAt);
    if (endDate <= new Date()) {
      setError('Дата окончания должна быть в будущем');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const marathon = await createMarathon(clubId, title.trim(), endDate.toISOString(), userId, items);
      onMarathonChange(marathon);
      setTitle('');
      setEndsAt('');
      setItems([]);
      onClose();
    } catch {
      setError('Не удалось создать марафон');
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!activeMarathon) return;
    setLoading(true);
    try {
      await endMarathon(activeMarathon.id);
      onMarathonChange(null);
      onClose();
    } catch {
      setError('Не удалось завершить марафон');
    } finally {
      setLoading(false);
    }
  };

  // Compute preview countdown from endsAt input
  const getPreviewTime = () => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    return { d, h, m };
  };

  const preview = getPreviewTime();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 glass-modal-overlay" onClick={onClose}>
      <div
        className="glass-modal rounded-[40px] p-10 w-full max-w-xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-12">
          <div>
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.4em] block mb-2 opacity-40 ">Событие клуба</span>
            <h2 className="text-4xl font-black tracking-tighter leading-none">Марафон</h2>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl glass-btn flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Active marathon info */}
        {activeMarathon && (
          <div className="mb-12 p-8 rounded-[32px] glass-panel space-y-6 group transition-all duration-500 hover:scale-[1.01]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Активный поток</span>
            </div>
            <h3 className="text-xl font-black tracking-tighter ">{activeMarathon.title}</h3>
            <p className="text-xs text-on-surface-variant/40 font-black uppercase tracking-widest ">
              До {new Date(activeMarathon.endsAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <button
              onClick={handleEnd}
              disabled={loading}
              className="w-full px-6 py-4 bg-red-50/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 active:scale-95 border border-red-500/20"
            >
              {loading ? 'Завершаем...' : 'Завершить марафон'}
            </button>
          </div>
        )}

        {/* Create new marathon form */}
        <form onSubmit={handleCreate} className="space-y-10">
          <div>
            <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-8 opacity-40 ">
              {activeMarathon ? 'Настройка нового' : 'Новое соревнование'}
            </h3>

            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-30">Заголовок марафона</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Осень с Оруэллом"
                  className="w-full px-6 py-4 rounded-2xl bg-white/10 border border-white/10 text-sm font-black focus:outline-none focus:bg-white/20 transition-all placeholder:text-on-surface-variant/20 "
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-30">Выбор контента</label>
                <div className="flex gap-3 mb-3">
                  <select
                    value={selectedContentId}
                    onChange={(e) => setSelectedContentId(e.target.value)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/10 border border-white/10 text-sm font-black focus:outline-none focus:bg-white/20 transition-all text-on-surface appearance-none cursor-pointer "
                  >
                    <option value="" className="font-sans">Выбрать из библиотеки...</option>
                    {availableContent.map(c => (
                      <option key={c.id} value={c.id} className="font-sans">
                        {c.type === 'movie' ? '🎬' : '📚'} {c.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedContentId) {
                        const selected = availableContent.find(c => c.id === selectedContentId);
                        if (selected && !items.find(i => i.contentId === selected.id)) {
                          setItems([...items, { contentId: selected.id, title: selected.title }]);
                        }
                        setSelectedContentId('');
                      }
                    }}
                    disabled={!selectedContentId}
                    className="w-14 h-14 glass-btn rounded-2xl flex items-center justify-center hover:scale-105 active:scale-90 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <div className="flex justify-between items-center mt-3 px-1">
                  <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest opacity-20 ">Нет нужной книги?</span>
                  <Link
                    href="/create"
                    onClick={onClose}
                    className="text-[9px] font-black text-on-surface uppercase tracking-widest flex items-center gap-1 hover:underline"
                  >
                    Создать публикацию
                  </Link>
                </div>
                
                {items.length > 0 && (
                  <div className="flex flex-col gap-3 mt-6">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 rounded-2xl glass-panel group/item">
                        <span className="text-sm font-black tracking-tighter truncate ">{item.title}</span>
                        <button
                          type="button"
                          onClick={() => setItems(items.filter((_, i) => i !== idx))}
                          className="w-8 h-8 rounded-lg text-on-surface-variant/20 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-30">Финишная черта</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-white/10 border border-white/10 text-sm font-black focus:outline-none focus:bg-white/20 transition-all cursor-pointer appearance-none"
                />
              </div>

              {/* Preview countdown */}
              {preview && (
                <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-6">
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.3em] block mb-2 opacity-40 text-center">Виджет времени</span>
                  <div className="flex gap-6 justify-center">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-black tracking-tighter">{preview.d}</div>
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Дней</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-black tracking-tighter">{preview.h}</div>
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Часов</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-black tracking-tighter">{preview.m}</div>
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Минут</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest text-center border border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-btn py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Синхронизация...' : 'Запустить марафон'}
          </button>
        </form>
      </div>
    </div>
  );
}
