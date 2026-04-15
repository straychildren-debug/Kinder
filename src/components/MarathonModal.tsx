'use client';

import React, { useState } from 'react';
import { ClubMarathon } from '@/lib/types';
import { createMarathon, endMarathon } from '@/lib/db';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const marathon = await createMarathon(clubId, title.trim(), endDate.toISOString(), userId);
      onMarathonChange(marathon);
      setTitle('');
      setEndsAt('');
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center glass-modal-overlay" onClick={onClose}>
      <div
        className="glass-modal rounded-3xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] block mb-1">Событие клуба</span>
            <h2 className="text-2xl font-bold tracking-tight">Марафон</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Active marathon info */}
        {activeMarathon && (
          <div className="mb-8 p-5 rounded-2xl glass-marathon-widget">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-lg">timer</span>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Активный марафон</span>
            </div>
            <h3 className="text-lg font-bold mb-2">{activeMarathon.title}</h3>
            <p className="text-sm text-on-surface-variant mb-4">
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
              className="px-5 py-2.5 bg-error/10 text-error rounded-xl text-sm font-semibold hover:bg-error/20 transition-colors disabled:opacity-50"
            >
              {loading ? 'Завершаем...' : 'Завершить марафон'}
            </button>
          </div>
        )}

        {/* Create new marathon form */}
        <form onSubmit={handleCreate}>
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4">
            {activeMarathon ? 'Запустить новый' : 'Создать марафон'}
          </h3>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">Название</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Книга «1984» Оруэлл"
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-on-surface-variant/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-2">Дата окончания</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Preview countdown */}
            {preview && (
              <div className="p-4 rounded-xl glass-marathon-widget">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block mb-3">Предпросмотр таймера</span>
                <div className="flex gap-3 justify-center">
                  <div className="flex flex-col items-center">
                    <div className="countdown-digit">{preview.d}</div>
                    <span className="countdown-label">Дней</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="countdown-digit">{preview.h}</div>
                    <span className="countdown-label">Часов</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="countdown-digit">{preview.m}</div>
                    <span className="countdown-label">Минут</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-error font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full glass-action text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Создаём...' : 'Запустить марафон'}
          </button>
        </form>
      </div>
    </div>
  );
}
