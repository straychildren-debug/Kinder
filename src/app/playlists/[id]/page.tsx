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
  addToPlaylist,
  type Playlist,
} from '@/lib/playlists';
import { searchContent } from '@/lib/search';
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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContentItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Пакет градиентов (Mesh Gradients) - такой же как в PlaylistCard
  const GRADIENTS = [
    'from-[#450A0A] via-[#7F1D1D] to-[#991B1B]', // Crimson Heritage (Exact mockup color)
    'from-[#0F172A] via-[#1E293B] to-[#34495E]', // Deep Space
    'from-[#1E1B4B] via-[#312E81] to-[#4338CA]', // Indigo Night
    'from-[#022C22] via-[#064E3B] to-[#065F46]', // Emerald Deep
    'from-[#3B0764] via-[#581C87] to-[#701A75]', // Purple Haze
    'from-[#164E63] via-[#0891B2] to-[#0E7490]', // Oceanic Teal
  ];

  const gradient = React.useMemo(() => {
    if (!params?.id) return GRADIENTS[0];
    const charCodeSum = (params.id as string).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return GRADIENTS[charCodeSum % GRADIENTS.length];
  }, [params?.id]);

  const load = async () => {
    if (!params?.id) return;
    setLoading(true);
    try {
      const pl = await getPlaylist(params.id);
      console.log('Loaded playlist details:', pl?.id, 'Items:', pl?.items?.length);
      setPlaylist(pl);
      if (pl) {
        setTitle(pl.title);
        setDescription(pl.description || '');
        setIsPublic(pl.isPublic);
      }
    } catch (err) {
      console.error('Failed to load playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  const isOwner = !!user && !!playlist && playlist.userId === user.id;

  // Дебаунс поиска контента для добавления.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const r = await searchContent(q, 10);
      setResults(r);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const existingIds = new Set((playlist?.items || []).map((c) => c.id));

  const handleAdd = async (contentId: string) => {
    if (!playlist || addingId) return;
    setAddingId(contentId);
    const ok = await addToPlaylist(playlist.id, contentId);
    setAddingId(null);
    if (ok) {
      const added = results.find((r) => r.id === contentId);
      if (added) {
        const updatedItems = [...(playlist.items || []), added];
        const updatedPreviews = updatedItems.slice(0, 3).map(c => c.imageUrl).filter((img): img is string => !!img);
        setPlaylist({
          ...playlist,
          items: updatedItems,
          itemCount: updatedItems.length,
          previewImages: updatedPreviews,
          firstItemImage: updatedPreviews[0] || undefined,
        });
      }
    }
  };

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
      const updatedItems = (playlist.items || []).filter((c) => c.id !== contentId);
      const updatedPreviews = updatedItems.slice(0, 3).map(c => c.imageUrl).filter((img): img is string => !!img);
      setPlaylist({
        ...playlist,
        items: updatedItems,
        itemCount: updatedItems.length,
        previewImages: updatedPreviews,
        firstItemImage: updatedPreviews[0] || undefined,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <TopNavBar title="Подборка" showBack={true} backPath="/playlists" transparent={true} />
        <main className="max-w-lg mx-auto">
          {/* Skeleton Header */}
          <div className="h-80 bg-surface-container animate-pulse rounded-b-3xl" />
          <div className="px-6 pt-10">
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="aspect-[2/3] rounded-xl bg-surface-container animate-pulse"
                />
              ))}
            </div>
          </div>
        </main>
        <BottomNavBar activeTab="home" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-surface">
        <TopNavBar title="Подборка" showBack={true} backPath="/playlists" />
        <main className="pt-24 pb-32 px-6 max-w-lg mx-auto text-center">
          <div className="py-20 px-6 bg-surface-container-low rounded-[2rem] border border-white/5">
            <p className="text-on-surface font-black text-xl mb-2">Подборка не найдена</p>
            <p className="text-on-surface-muted text-sm font-medium">
              Возможно, она была удалена или скрыта автором.
            </p>
          </div>
        </main>
        <BottomNavBar activeTab="home" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-x-hidden">
      {/* Dynamic Background elements */}
      <div className={`fixed inset-x-0 top-0 h-[50vh] bg-gradient-to-br ${gradient} opacity-20 blur-[120px] -z-10`} />

      <TopNavBar title={playlist.title} showBack={true} backPath="/playlists" transparent={true} />
      
      <main className="flex-1 pb-32 max-w-lg mx-auto w-full">
        {!editing ? (
          <section className="relative pt-24 px-6 pb-12">
            {/* Visual Hero Header */}
            <div className="absolute top-0 inset-x-0 h-80 -z-20 overflow-hidden rounded-b-3xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white/10 blur-[80px] animate-pulse" />
              <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[60px]" />
              
              {playlist.coverUrl && (
                <div 
                  className="absolute inset-0 opacity-30 mix-blend-overlay grayscale bg-cover bg-center"
                  style={{ backgroundImage: `url(${playlist.coverUrl})` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
            </div>

            {/* Glassmorphism Summary Card */}
            <div className="glass-panel border-white/10 p-6 rounded-3xl backdrop-blur-2xl shadow-2xl relative mt-32">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${playlist.isPublic ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      {playlist.isPublic ? 'Публичная' : 'Приватная'}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
                    {playlist.title}
                  </h1>
                </div>

                {isOwner && (
                  <button
                    onClick={() => setEditing(true)}
                    className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                )}
              </div>

              {playlist.description && (
                <p className="text-sm font-semibold text-white/60 mb-6 leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/5">
                  {playlist.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                {playlist.author && (
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20">
                      {playlist.author.avatarUrl ? (
                        <Image
                          src={playlist.author.avatarUrl}
                          alt={playlist.author.name}
                          fill
                          sizes="24px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/50 bg-white/10">
                          {playlist.author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white/80">
                      @{playlist.author.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="h-0.5 w-6 bg-primary rounded-full" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                    {playlist.itemCount || 0} элементов
                  </span>
                </div>
              </div>
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

        {isOwner && (
          <section className="mb-5 bg-surface rounded-2xl border border-on-surface/5 overflow-hidden">
            <div className="relative">
              <span className="material-symbols-outlined text-[18px] text-on-surface-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Найти книгу или фильм…"
                className="w-full bg-surface pl-10 pr-10 py-3 text-sm font-medium focus:outline-none placeholder:text-on-surface-muted/70"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-container text-on-surface-muted flex items-center justify-center hover:bg-surface-container-high"
                  title="Очистить"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
            {query.trim() && (
              <div className="border-t border-on-surface/5 max-h-80 overflow-y-auto">
                {searching ? (
                  <div className="py-6 text-center text-xs font-medium text-on-surface-muted">
                    Ищем…
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-6 text-center text-xs font-medium text-on-surface-muted">
                    Ничего не нашли
                  </div>
                ) : (
                  <ul className="divide-y divide-on-surface/5">
                    {results.map((c) => {
                      const already = existingIds.has(c.id);
                      const isAdding = addingId === c.id;
                      return (
                        <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                          <div className="relative w-10 h-14 rounded-md overflow-hidden bg-surface-container border border-on-surface/5 shrink-0">
                            {c.imageUrl ? (
                              <Image
                                src={c.imageUrl}
                                alt={c.title}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px] text-on-surface-muted">
                                  {c.type === 'movie' ? 'movie' : 'menu_book'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-on-surface leading-snug line-clamp-1">
                              {c.title}
                            </p>
                            <p className="text-[11px] font-medium text-on-surface-muted mt-0.5 line-clamp-1">
                              {c.type === 'movie' ? 'Фильм' : 'Книга'}
                              {c.author ? ` · ${c.author}` : ''}
                              {c.director ? ` · ${c.director}` : ''}
                            </p>
                          </div>
                          {already ? (
                            <span className="text-[11px] font-semibold text-on-surface-muted px-2.5 py-1.5 bg-surface-container rounded-lg flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              В подборке
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAdd(c.id)}
                              disabled={isAdding}
                              className="text-[11px] font-semibold text-surface bg-on-surface px-3 py-1.5 rounded-lg transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {isAdding ? 'hourglass_empty' : 'add'}
                              </span>
                              {isAdding ? '…' : 'Добавить'}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </section>
        )}

        {!playlist.items || playlist.items.length === 0 ? (
          <div className="mx-6 text-center py-16 px-6 glass-panel rounded-[2rem] border-white/5">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-5 border border-white/10">
              <span className="material-symbols-outlined text-[24px] text-white/30">
                collections_bookmark
              </span>
            </div>
            <p className="text-white font-black text-lg mb-1">Подборка пуста</p>
            <p className="text-white/40 text-sm font-semibold leading-relaxed max-w-xs mx-auto">
              {isOwner
                ? 'Откройте любую публикацию и нажмите «Добавить в подборку»'
                : 'Автор пока ничего не добавил'}
            </p>
            {isOwner && (
              <button
                onClick={() => router.push('/')}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-black text-xs transition-transform active:scale-95 shadow-xl shadow-white/10"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
                Найти публикацию
              </button>
            )}
          </div>
        ) : (
          <div className="px-6">
            <div className="grid grid-cols-3 gap-4">
              {playlist.items.map((c) => (
                <div key={c.id} className="relative group">
                  <button
                    onClick={() => setOpened(c)}
                    className="w-full h-full flex flex-col text-left outline-none"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-[1.5rem] overflow-hidden bg-white/5 border border-white/10 shadow-lg group-hover:shadow-primary/20 transition-all duration-500">
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
                          <span className="material-symbols-outlined text-white">
                            {c.type === 'movie' ? 'movie' : 'menu_book'}
                          </span>
                        </div>
                      )}
  
                      {/* Content Overlay */}
                      <div className="absolute inset-x-0 bottom-0 pt-10 pb-3 px-3 bg-gradient-to-t from-black via-black/40 to-transparent z-10">
                        <h3 className="text-[10px] font-black text-white leading-tight line-clamp-2 tracking-tight group-hover:text-primary transition-colors">
                          {c.title}
                        </h3>
                      </div>
                    </div>
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveItem(c.id)}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 hover:bg-red-500 hover:scale-110"
                      title="Убрать из подборки"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      {opened && <ContentDetailsModal content={opened} onClose={() => setOpened(null)} />}
      <BottomNavBar activeTab="home" />
    </div>
  );
}
