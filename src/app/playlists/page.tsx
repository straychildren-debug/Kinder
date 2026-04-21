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
          <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">
            Коллекции читателей
          </span>
          <h1 className="text-2xl font-bold tracking-tight leading-tight text-on-surface">
            Подборки
          </h1>
          <p className="mt-2 text-sm font-medium text-on-surface-muted leading-relaxed">
            Ручные коллекции книг и фильмов — от участников сообщества.
          </p>
        </section>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl mb-6">
          <button
            onClick={() => setTab('discover')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'discover'
                ? 'bg-white text-on-surface shadow-sm'
                : 'text-on-surface-muted'
            }`}
          >
            Обзор
          </button>
          <button
            onClick={() => setTab('mine')}
            disabled={!user}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${
              tab === 'mine'
                ? 'bg-white text-on-surface shadow-sm'
                : 'text-on-surface-muted'
            }`}
          >
            Мои подборки
          </button>
        </div>

        {tab === 'mine' && user && (
          <div className="mb-6">
            {creating ? (
              <div className="bg-surface rounded-2xl p-4 border border-on-surface/5 space-y-3">
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
                    className="flex-1 py-2.5 bg-on-surface text-surface rounded-xl font-semibold text-xs transition-transform active:scale-95 disabled:opacity-40"
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
          <div className="space-y-3">
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

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const cover = playlist.coverUrl || playlist.firstItemImage;
  return (
    <Link
      href={`/playlists/${playlist.id}`}
      className="block bg-surface rounded-2xl p-4 border border-on-surface/5 hover:border-on-surface/10 transition-all active:scale-[0.995]"
    >
      <div className="flex items-start gap-4">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-container border border-on-surface/5 shrink-0 flex items-center justify-center">
          {cover ? (
            <Image
              src={cover}
              alt={playlist.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-[28px] text-on-surface-muted">
              playlist_play
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-on-surface leading-snug line-clamp-2">
              {playlist.title}
            </h3>
            {!playlist.isPublic && (
              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-on-surface-muted bg-surface-container px-1.5 py-0.5 rounded-md">
                Приват
              </span>
            )}
          </div>
          {playlist.description && (
            <p className="text-xs text-on-surface-muted font-medium leading-snug mt-1 line-clamp-2">
              {playlist.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] font-medium text-on-surface-muted">
            {playlist.author && (
              <span className="truncate max-w-[50%]">@{playlist.author.name}</span>
            )}
            <span>
              {playlist.itemCount || 0}{' '}
              {(playlist.itemCount || 0) === 1 ? 'элемент' : 'элементов'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
