'use client';

import React, { useEffect, useState } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import {
  getPublicPlaylists,
  getUserPlaylists,
  createPlaylist,
  type Playlist,
} from '@/lib/playlists';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PlaylistCard from '@/components/PlaylistCard';

export default function PlaylistsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [publicLists, setPublicLists] = useState<Playlist[]>([]);
  const [myLists, setMyLists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'discover' | 'mine'>('discover');
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPublic, setNewPublic] = useState(true);
  const [busyCreate, setBusyCreate] = useState(false);

  useEffect(() => {
    (async () => {
      const [pub, mine] = await Promise.all([
        getPublicPlaylists(30),
        user?.id ? getUserPlaylists(user.id) : Promise.resolve([] as Playlist[]),
      ]);
      setPublicLists(pub);
      setMyLists(mine);
      setLoading(false);
    })();
  }, [user?.id]);

  const handleCreate = async () => {
    if (!user?.id || !newTitle.trim() || busyCreate) return;
    setBusyCreate(true);
    const pl = await createPlaylist(user.id, newTitle, {
      description: newDesc,
      isPublic: newPublic,
    });
    setBusyCreate(false);
    if (pl) {
      router.push(`/playlists/${pl.id}`);
    }
  };

  const lists = tab === 'discover' ? publicLists : myLists;

  return (
    <>
      <TopNavBar title="Подборки" showBack={true} backPath="/" />
      <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
        <section className="pb-6">
          <span className="text-xs font-medium text-on-surface-muted mb-1.5 block uppercase tracking-wider">
            Коллекции читателей
          </span>
          <h1 className="text-3xl font-black tracking-tight leading-tight text-on-surface">
            Подборки
          </h1>
          <p className="mt-2 text-sm font-medium text-on-surface-muted leading-relaxed">
            Ручные коллекции книг и фильмов — от участников сообщества.
          </p>
        </section>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl">
            <button
              onClick={() => setTab('discover')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                  tab === 'discover'
                    ? 'bg-primary text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-105'
                    : 'text-on-surface-muted hover:text-on-surface'
                }`}
            >
              {tab === 'discover' && (
                <motion.div 
                  layoutId="tabGlow"
                  className="absolute inset-0 bg-primary/20 blur-xl rounded-lg -z-10"
                />
              )}
              Обзор
            </button>
            <button
              onClick={() => setTab('mine')}
              disabled={!user}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all relative disabled:opacity-40 ${
                  tab === 'mine'
                    ? 'bg-primary text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-105'
                    : 'text-on-surface-muted hover:text-on-surface'
                }`}
            >
              {tab === 'mine' && (
                <motion.div 
                  layoutId="tabGlow"
                  className="absolute inset-0 bg-primary/20 blur-xl rounded-lg -z-10"
                />
              )}
              Мои подборки
            </button>
          </div>
        </div>

        {tab === 'mine' && user && (
          <div className="mb-6">
            {creating ? (
              <div className="bg-surface rounded-2xl p-4 border border-on-surface/5 space-y-3 shadow-xl">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Название подборки"
                  autoFocus
                  maxLength={80}
                  className="w-full bg-surface-container border border-on-surface/5 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-accent-lilac"
                />
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Краткое описание (необязательно)"
                  rows={2}
                  maxLength={240}
                  className="w-full bg-surface-container border border-on-surface/5 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-accent-lilac resize-none"
                />
                <label className="flex items-center gap-2 text-xs font-medium text-on-surface-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newPublic}
                    onChange={(e) => setNewPublic(e.target.checked)}
                    className="w-4 h-4 rounded accent-accent-lilac"
                  />
                  Показывать в общем обзоре
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={!newTitle.trim() || busyCreate}
                    className="flex-1 py-3 btn-premium rounded-xl text-xs"
                  >
                    {busyCreate ? 'Создаём…' : 'Создать'}
                  </button>
                  <button
                    onClick={() => {
                      setCreating(false);
                      setNewTitle('');
                      setNewDesc('');
                    }}
                    className="px-4 py-2.5 bg-surface-container text-on-surface-muted rounded-xl font-semibold text-xs"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-3 bg-surface rounded-2xl p-4 border border-dashed border-on-surface/10 hover:border-on-surface/20 transition-all active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-xl bg-on-surface/5 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-on-surface">add</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-on-surface leading-tight">
                    Новая подборка
                  </p>
                  <p className="text-[11px] font-medium text-on-surface-muted mt-0.5">
                    Соберите свою коллекцию книг или фильмов
                  </p>
                </div>
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-surface-container-low animate-pulse" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-20 px-6 bg-surface rounded-3xl border border-on-surface/5">
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-[24px] text-on-surface-muted">
                playlist_play
              </span>
            </div>
            <p className="text-on-surface font-semibold text-base mb-1">
              {tab === 'mine' ? 'У вас пока нет подборок' : 'Подборок пока нет'}
            </p>
            <p className="text-on-surface-muted text-sm font-medium leading-relaxed max-w-xs mx-auto">
              {tab === 'mine'
                ? 'Создайте первую — например, «Что почитать в отпуске»'
                : 'Будьте первым, кто соберёт тематическую подборку'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {lists.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        )}
      </main>
      <BottomNavBar activeTab="home" />
    </>
  );
}

