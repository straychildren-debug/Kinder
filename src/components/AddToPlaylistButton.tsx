'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  getUserPlaylists,
  getPlaylistsContainingContent,
  addToPlaylist,
  removeFromPlaylist,
  createPlaylist,
  type Playlist,
} from '@/lib/playlists';

interface Props {
  contentId: string;
}

export default function AddToPlaylistButton({ contentId }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [inSet, setInSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (!open || !user?.id) return;
    setLoading(true);
    (async () => {
      const [lists, contained] = await Promise.all([
        getUserPlaylists(user.id),
        getPlaylistsContainingContent(user.id, contentId),
      ]);
      setPlaylists(lists);
      setInSet(contained);
      setLoading(false);
    })();
  }, [open, user?.id, contentId]);

  if (!user) return null;

  const toggleInPlaylist = async (pl: Playlist) => {
    const has = inSet.has(pl.id);
    const next = new Set(inSet);
    if (has) next.delete(pl.id);
    else next.add(pl.id);
    setInSet(next);
    const ok = has
      ? await removeFromPlaylist(pl.id, contentId)
      : await addToPlaylist(pl.id, contentId);
    if (!ok) {
      // откат
      const rollback = new Set(inSet);
      setInSet(rollback);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!user?.id || !newTitle.trim()) return;
    const pl = await createPlaylist(user.id, newTitle, { isPublic: true });
    setNewTitle('');
    setCreating(false);
    if (pl) {
      await addToPlaylist(pl.id, contentId);
      setPlaylists([pl, ...playlists]);
      setInSet(new Set([...inSet, pl.id]));
    }
  };

  const addedCount = inSet.size;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm bg-surface-container text-on-surface border border-on-surface/5 active:scale-[0.98] transition-transform"
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: addedCount > 0 ? "'FILL' 1" : "'FILL' 0" }}
        >
          playlist_add
        </span>
        {addedCount > 0
          ? `В ${addedCount} ${addedCount === 1 ? 'подборке' : 'подборках'}`
          : 'Добавить в подборку'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[75vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-base font-bold text-on-surface">Добавить в подборку</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-muted"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {loading ? (
                <div className="space-y-2 py-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-xl bg-surface-container-low animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <>
                  {playlists.length === 0 && !creating && (
                    <p className="text-sm text-on-surface-muted font-medium py-6 text-center">
                      У вас пока нет подборок. Создайте первую.
                    </p>
                  )}

                  <div className="space-y-1.5">
                    {playlists.map((pl) => {
                      const has = inSet.has(pl.id);
                      return (
                        <button
                          key={pl.id}
                          onClick={() => toggleInPlaylist(pl)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                            has
                              ? 'bg-accent-lilac/10 border border-accent-lilac/20'
                              : 'bg-surface-container-low border border-transparent hover:bg-surface-container'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0F172A] to-[#34495E] flex items-center justify-center shrink-0 border border-white/10">
                            <span className="material-symbols-outlined text-[16px] text-white">
                              playlist_play
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">
                              {pl.title}
                            </p>
                            <p className="text-[11px] font-medium text-on-surface-muted">
                              {pl.itemCount || 0}{' '}
                              {(pl.itemCount || 0) === 1 ? 'элемент' : 'элементов'}
                            </p>
                          </div>
                          <span
                            className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                              has ? 'text-accent-lilac' : 'text-on-surface-muted/40'
                            }`}
                            style={{ fontVariationSettings: has ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            {has ? 'check_circle' : 'add_circle'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-on-surface/5">
                    {creating ? (
                      <div className="space-y-2">
                        <input
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="Название подборки"
                          autoFocus
                          maxLength={80}
                          className="w-full bg-surface-container border border-on-surface/5 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-accent-lilac"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleCreateAndAdd}
                            disabled={!newTitle.trim()}
                            className="flex-1 py-2.5 bg-on-surface text-surface rounded-xl font-semibold text-xs disabled:opacity-40"
                          >
                            Создать и добавить
                          </button>
                          <button
                            onClick={() => {
                              setCreating(false);
                              setNewTitle('');
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
                        className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl bg-surface-container-low text-sm font-semibold text-on-surface border border-dashed border-on-surface/10 hover:border-on-surface/20"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Новая подборка
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
