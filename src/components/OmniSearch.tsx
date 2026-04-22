'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { omnisearch, type OmnisearchResult } from '@/lib/search';
import { defaultBlurDataURL } from '@/lib/image-blur';

interface OmniSearchProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY: OmnisearchResult = { content: [], clubs: [], users: [] };

export default function OmniSearch({ open, onClose }: OmniSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OmnisearchResult>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults(EMPTY);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const data = await omnisearch(q);
      setResults(data);
      setLoading(false);
    }, 220);
    return () => clearTimeout(handle);
  }, [query]);

  const total =
    results.content.length + results.clubs.length + results.users.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-on-surface/30 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl border border-on-surface/5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-on-surface/5">
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">
                search
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск: контент, клубы, пользователи…"
                className="flex-1 bg-transparent outline-none text-base font-medium text-on-surface placeholder:text-on-surface-variant/50"
              />
              <button
                onClick={onClose}
                className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 hover:text-on-surface transition-colors"
              >
                Esc
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {!query.trim() ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">
                    Начните вводить запрос
                  </p>
                </div>
              ) : loading ? (
                <div className="px-6 py-12 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-14 rounded-2xl bg-on-surface/5 animate-pulse"
                    />
                  ))}
                </div>
              ) : total === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">
                    Ничего не найдено
                  </p>
                </div>
              ) : (
                <div className="py-3">
                  {results.content.length > 0 && (
                    <Section title="Контент">
                      {results.content.map((c) => (
                        <Link
                          key={c.id}
                          href={`/?content=${c.id}`}
                          onClick={onClose}
                          className="flex items-center gap-4 px-6 py-3 hover:bg-on-surface/[0.03] transition-colors"
                        >
                          <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-surface-container flex-shrink-0">
                            {c.imageUrl && (
                              <Image
                                src={c.imageUrl}
                                alt={c.title}
                                fill
                                sizes="48px"
                                placeholder="blur"
                                blurDataURL={defaultBlurDataURL}
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-on-surface truncate">
                              {c.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
                              <span className="material-symbols-rounded" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
                                {c.type === 'movie' ? 'movie' : 'menu_book'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </Section>
                  )}

                  {results.clubs.length > 0 && (
                    <Section title="Клубы">
                      {results.clubs.map((club) => (
                        <Link
                          key={club.id}
                          href={`/clubs/${club.id}`}
                          onClick={onClose}
                          className="flex items-center gap-4 px-6 py-3 hover:bg-on-surface/[0.03] transition-colors"
                        >
                          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-surface-container flex-shrink-0">
                            {club.imageUrl && (
                              <Image
                                src={club.imageUrl}
                                alt={club.name}
                                fill
                                sizes="48px"
                                placeholder="blur"
                                blurDataURL={defaultBlurDataURL}
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-on-surface truncate">
                              {club.name}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 mt-0.5">
                              {club.category} · {club.memberCount ?? 0} уч.
                            </p>
                          </div>
                        </Link>
                      ))}
                    </Section>
                  )}

                  {results.users.length > 0 && (
                    <Section title="Люди">
                      {results.users.map((u) => (
                        <Link
                          key={u.id}
                          href={`/profile/${u.id}`}
                          onClick={onClose}
                          className="flex items-center gap-4 px-6 py-3 hover:bg-on-surface/[0.03] transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-accent-lilac/30 text-on-surface flex items-center justify-center font-black text-sm overflow-hidden">
                            {u.avatarUrl ? (
                              <Image
                                src={u.avatarUrl}
                                alt={u.name}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            ) : (
                              u.name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-on-surface truncate">
                              {u.name}
                            </p>
                            {u.bio && (
                              <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                                {u.bio}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </Section>
                  )}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between px-6 py-3 bg-surface-container-low border-t border-on-surface/5">
              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">
                Контент · клубы · люди
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">
                ⌘K / Ctrl+K
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-2">
      <p className="px-6 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">
        {title}
      </p>
      {children}
    </div>
  );
}
