'use client';

import React, { useEffect, useState } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  getPlaylist,
  updatePlaylist,
  deletePlaylist,
  removeFromPlaylist,
  type Playlist,
} from '@/lib/playlists';
import { defaultBlurDataURL } from '@/lib/image-blur';
import ContentDetailsModal from '@/components/ContentDetailsModal';
import type { ContentItem } from '@/lib/types';

export default function PlaylistDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState<ContentItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!params?.id) return;
    const pl = await getPlaylist(params.id);
    setPlaylist(pl);
    if (pl) {
      setTitle(pl.title);
      setDescription(pl.description || '');
      setIsPublic(pl.isPublic);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  const isOwner = !!user && !!playlist && playlist.userId === user.id;

  const handleSave = async () => {
    if (!playlist || busy) return;
    setBusy(true);
    const ok = await updatePlaylist(playlist.id, {
      title,
      description,
      isPublic,
    });
    setBusy(false);
    if (ok) {
      setEditing(false);
      load();
    }
  };

  const handleDelete = async () => {
    if (!playlist) return;
    if (!confirm('Удалить подборку? Это действие необратимо.')) return;
    const ok = await deletePlaylist(playlist.id);
    if (ok) router.push('/playlists');
  };

  const handleRemoveItem = async (contentId: string) => {
    if (!playlist) return;
    const ok = await removeFromPlaylist(playlist.id, contentId);
    if (ok) {
      setPlaylist({
        ...playlist,
        items: (playlist.items || []).filter((c) => c.id !== contentId),
        itemCount: Math.max(0, (playlist.itemCount || 1) - 1),
      });
    }
  };

  if (loading) {
    return (
      <>
        <TopNavBar title="Подборка" showBack={true} backPath="/playlists" />
        <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
          <div className="h-40 rounded-2xl bg-surface-container-low animate-pulse mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-xl bg-surface-container-low animate-pulse"
              />
            ))}
          </div>
        </main>
        <BottomNavBar activeTab="home" />
      </>
    );
  }

  if (!playlist) {
    return (
      <>
        <TopNavBar title="Подборка" showBack={true} backPath="/playlists" />
        <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
          <div className="text-center py-20 px-6 bg-surface rounded-3xl border border-on-surface/5">
            <p className="text-on-surface font-semibold text-base mb-1">Подборка не найдена</p>
            <p className="text-on-surface-muted text-sm font-medium">
              Возможно, она была удалена или скрыта автором.
            </p>
          </div>
        </main>
        <BottomNavBar activeTab="home" />
      </>
    );
  }

  return (
    <>
      <TopNavBar title="Подборка" showBack={true} backPath="/playlists" />
      <main className="pt-24 pb-32 px-6 max-w-lg mx-auto">
        {!editing ? (
          <section className="pb-6">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">
                  {playlist.isPublic ? 'Публичная подборка' : 'Приватная подборка'}
                </span>
                <h1 className="text-2xl font-bold tracking-tight leading-tight text-on-surface">
                  {playlist.title}
                </h1>
                {playlist.description && (
                  <p className="mt-2 text-sm font-medium text-on-surface-muted leading-relaxed">
                    {playlist.description}
                  </p>
                )}
                {playlist.author && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden bg-surface-container border border-on-surface/5">
                      {playlist.author.avatarUrl ? (
                        <Image
                          src={playlist.author.avatarUrl}
                          alt={playlist.author.name}
                          fill
                          sizes="24px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-on-surface-muted">
                          {playlist.author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-on-surface">
                      {playlist.author.name}
                    </span>
                    <span className="text-xs font-medium text-on-surface-muted">
                      · {playlist.itemCount || 0}{' '}
                      {(playlist.itemCount || 0) === 1 ? 'элемент' : 'элементов'}
                    </span>
                  </div>
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => setEditing(true)}
                  className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-muted transition-all shrink-0"
                  title="Редактировать"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              )}
            </div>
          </section>
        ) : (
          <section className="pb-6 bg-surface rounded-2xl p-4 border border-on-surface/5 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              className="w-full bg-surface-container border border-on-surface/5 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-accent-lilac"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание"
              rows={3}
              maxLength={240}
              className="w-full bg-surface-container border border-on-surface/5 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-accent-lilac resize-none"
            />
            <label className="flex items-center gap-2 text-xs font-medium text-on-surface-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded accent-accent-lilac"
              />
              Публичная подборка
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!title.trim() || busy}
                className="flex-1 py-2.5 bg-on-surface text-surface rounded-xl font-semibold text-xs transition-transform active:scale-95 disabled:opacity-40"
              >
                {busy ? 'Сохраняем…' : 'Сохранить'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setTitle(playlist.title);
                  setDescription(playlist.description || '');
                  setIsPublic(playlist.isPublic);
                }}
                className="px-4 py-2.5 bg-surface-container text-on-surface-muted rounded-xl font-semibold text-xs"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"
                title="Удалить подборку"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </section>
        )}

        {!playlist.items || playlist.items.length === 0 ? (
          <div className="text-center py-16 px-6 bg-surface rounded-3xl border border-on-surface/5">
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-[24px] text-on-surface-muted">
                collections_bookmark
              </span>
            </div>
            <p className="text-on-surface font-semibold text-base mb-1">Подборка пуста</p>
            <p className="text-on-surface-muted text-sm font-medium leading-relaxed max-w-xs mx-auto">
              {isOwner
                ? 'Откройте любую публикацию и добавьте её в эту подборку'
                : 'Автор пока ничего не добавил'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {playlist.items.map((c) => (
              <div key={c.id} className="relative group">
                <button
                  onClick={() => setOpened(c)}
                  className="w-full h-full flex flex-col text-left outline-none"
                >
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-surface-container border border-on-surface/5 shadow-sm">
                    {c.imageUrl ? (
                      <Image
                        src={c.imageUrl}
                        alt={c.title}
                        fill
                        sizes="33vw"
                        placeholder="blur"
                        blurDataURL={defaultBlurDataURL}
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20">
                        <span className="material-symbols-outlined text-on-surface-muted">
                          {c.type === 'movie' ? 'movie' : 'menu_book'}
                        </span>
                      </div>
                    )}

                    {/* Content Overlay */}
                    <div className="absolute inset-x-0 bottom-0 pt-10 pb-2 px-2 bg-gradient-to-t from-black via-black/40 to-transparent z-10">
                      <h3 className="text-[10px] font-bold text-white leading-tight line-clamp-2 tracking-tight">
                        {c.title}
                      </h3>
                    </div>
                  </div>
                </button>
                {isOwner && (
                  <button
                    onClick={() => handleRemoveItem(c.id)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500 transition-colors"
                    title="Убрать из подборки"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      {opened && <ContentDetailsModal content={opened} onClose={() => setOpened(null)} />}
      <BottomNavBar activeTab="home" />
    </>
  );
}
