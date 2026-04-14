'use client';

import React, { useEffect, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { getApprovedContent } from "@/lib/db";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { ContentItem } from "@/lib/types";

export default function Home() {
  const { user } = useAuth();
  const [approvedContent, setApprovedContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getApprovedContent();
      setApprovedContent(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <TopNavBar />
      <main className="pt-20 px-6 max-w-7xl mx-auto pb-24">
        {/* Приветствие */}
        <section className="mt-8 mb-12">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
            {user ? `Привет, ${user.name.split(' ')[0]}` : 'Обзор'}
          </span>
          <h2 className="text-[3.5rem] font-bold leading-none tracking-tight text-on-surface mt-2">Лента сообщества</h2>
        </section>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Основной контент */}
          <div className="md:col-span-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-semibold tracking-tight">Новое сегодня</h3>
              <div className="flex gap-2">
                <Link href="/library" className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Все книги</Link>
                <Link href="/movies" className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">Все фильмы</Link>
              </div>
            </div>

            {/* Карточки контента */}
            {loading ? (
              <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : approvedContent.length === 0 ? (
              <p className="text-on-surface-variant">Пока нет публикаций. Будьте первыми!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {approvedContent.map(item => {
                  return (
                    <article key={item.id} className="group bg-surface-container-lowest rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md">
                    <div className="relative aspect-[2/3] w-full overflow-hidden">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        alt={item.title}
                        src={item.imageUrl}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <span className="bg-secondary-container/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                          {item.type === 'movie' ? 'Фильм' : 'Книга'}
                        </span>
                        <h4 className="text-2xl font-bold text-white mt-2">{item.title}</h4>
                        {item.type === 'movie' && item.director && (
                          <p className="text-white/70 text-xs mt-1">{item.director}, {item.year}</p>
                        )}
                        {item.type === 'book' && item.author && (
                          <p className="text-white/70 text-xs mt-1">{item.author}</p>
                        )}
                      </div>
                      {/* Рейтинг */}
                      {item.rating && (
                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-white text-sm font-bold">{item.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-8">
                      {item.createdBy && (
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden">
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                                U
                              </div>
                          </div>
                          <span className="text-sm font-medium text-on-surface-variant">Пользователь</span>
                        </div>
                      )}
                      <p className="text-on-surface-variant leading-relaxed mb-6 text-sm line-clamp-3">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {item.likeCount !== undefined && (
                            <span className="flex items-center gap-1 text-on-surface-variant text-xs">
                              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                              {item.likeCount}
                            </span>
                          )}
                          {item.reviewCount !== undefined && (
                            <span className="flex items-center gap-1 text-on-surface-variant text-xs">
                              <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                              {item.reviewCount} рецензий
                            </span>
                          )}
                        </div>
                        {item.genre && (
                          <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-widest">
                            {item.genre[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Боковая панель */}
          <aside className="md:col-span-4 space-y-12">
            {/* Если не авторизован */}
            {!user && (
              <div className="bg-surface-container-low rounded-2xl p-6 space-y-4 shadow-sm border border-outline-variant/5">
                <h3 className="text-lg font-bold">Присоединяйтесь!</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Войдите, чтобы создавать контент, оставлять рецензии и участвовать в рейтинге
                </p>
                <Link
                  href="/login"
                  className="block w-full py-3.5 glass-btn text-white rounded-xl font-bold text-center text-sm transition-transform active:scale-95 shadow-lg shadow-primary/10"
                >
                  Войти
                </Link>
              </div>
            )}

            {/* Топ участники */}
            <div className="bg-surface-container-low p-8 rounded-2xl">
              <h3 className="text-lg font-semibold mb-6">Лучшие авторы</h3>
              <div className="space-y-6">
                {[
                  { icon: 'auto_stories', name: 'Елена Радуга', detail: '203 рецензии • ★ 9.5' },
                  { icon: 'movie_filter', name: 'Анастасия Волкова', detail: '142 рецензии • ★ 9.1' },
                  { icon: 'history_edu', name: 'Мария Книга', detail: '128 рецензий • ★ 9.3' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/users"
                className="block w-full mt-8 py-3 text-sm font-bold text-primary bg-surface-container-highest rounded-lg hover:opacity-80 transition-opacity text-center"
              >
                Полный рейтинг
              </Link>
            </div>

            {/* Жанры */}
            <div className="px-4">
              <h3 className="text-lg font-semibold mb-6">Популярные жанры</h3>
              <div className="flex flex-wrap gap-2">
                {['Фантастика', 'Драма', 'Классика', 'Триллер', 'Роман', 'Боевик', 'Психология', 'Приключения'].map(genre => (
                  <span key={genre} className="px-3 py-1.5 bg-surface-container-low rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* FAB: Добавить контент */}
      {user && (
        <Link
          href="/create"
          className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-14 h-14 glass-btn rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform z-50"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>add</span>
        </Link>
      )}

      <BottomNavBar activeTab="home" />
    </>
  );
}
