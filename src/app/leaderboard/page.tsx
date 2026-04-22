'use client';

import React, { useEffect, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { getUsersRanked, getTopAuthorsByLikes, getTopCommenters, getTopPublicists, getUserById } from "@/lib/db";
import { User, ContentItem, LeaderboardUser } from "@/lib/types";
import Image from "next/image";
import PublicProfileModal from "@/components/PublicProfileModal";
import ContentDetailsModal from "@/components/ContentDetailsModal";
import LeaderboardColumn from "@/components/LeaderboardColumn";

export default function Leaderboard() {
  const [period, setPeriod] = useState<'all' | 'month'>('all');
  const [rankedUsers, setRankedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openedContent, setOpenedContent] = useState<ContentItem | null>(null);

  const [topAuthors, setTopAuthors] = useState<LeaderboardUser[]>([]);
  const [topCommenters, setTopCommenters] = useState<LeaderboardUser[]>([]);
  const [topPublicists, setTopPublicists] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [topUsers, authors, commenters, publicists] = await Promise.all([
          getUsersRanked(period),
          getTopAuthorsByLikes(5),
          getTopCommenters(5),
          getTopPublicists(5)
        ]);
        setRankedUsers(topUsers);
        setTopAuthors(authors);
        setTopCommenters(commenters);
        setTopPublicists(publicists);
      } catch (err) {
        console.error('Leaderboard load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

  async function openLeaderboardUser(userId: string) {
    const u = await getUserById(userId);
    if (u) setSelectedUser(u);
  }

  const top3 = rankedUsers.slice(0, 3);
  const restUsers = rankedUsers.slice(3);

  return (
    <>
      <TopNavBar />
      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Сообщество знатоков</span>
              <h2 className="text-2xl font-bold text-on-surface leading-tight">Рейтинг пользователей</h2>
            </div>
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setPeriod('month')}
                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  period === 'month' 
                    ? 'bg-on-surface text-surface shadow-md' 
                    : 'bg-surface-container-low text-on-surface-muted hover:bg-surface-container'
                }`}
              >
                За месяц
              </button>
              <button 
                onClick={() => setPeriod('all')}
                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  period === 'all' 
                    ? 'bg-on-surface text-surface shadow-md' 
                    : 'bg-surface-container-low text-on-surface-muted hover:bg-surface-container'
                }`}
              >
                За всё время
              </button>
            </div>
          </div>
        </section>

        {/* Top 3 Leaders */}
        {loading ? (
             <div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-on-surface border-t-transparent rounded-full animate-spin"></div></div>
        ) : top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
            {/* Rank 1 */}
            {top3[0] && (
              <div 
                onClick={() => setSelectedUser(top3[0])}
                className="md:col-span-6 bg-surface rounded-3xl p-5 relative overflow-hidden group shadow-xl border border-accent-amber/10 golden-glow cursor-pointer hover:scale-[1.01] transition-all"
              >
                <div className="absolute -top-4 -right-4 text-[120px] font-black text-accent-amber/10 select-none leading-none">1</div>
                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-xl bg-surface-container flex items-center justify-center font-black text-xl text-on-surface shrink-0">
                      {top3[0].avatarUrl ? (
                        <Image alt={top3[0].name} fill sizes="80px" className="object-cover" src={top3[0].avatarUrl} />
                      ) : (
                        top3[0].name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="material-symbols-outlined text-accent-amber text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                         <h3 className="text-2xl font-black text-on-surface">{top3[0].name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                          {top3[0].role === 'superadmin' ? 'Суперадмин' : top3[0].role === 'admin' ? 'Администратор' : 'Ведущий критик'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-surface-container-low p-2.5 rounded-xl border border-on-surface/5 shadow-sm">
                      <p className="text-[8px] uppercase font-black tracking-widest text-on-surface-muted mb-0.5 opacity-50">Публикации</p>
                      <p className="text-xl font-black text-on-surface">{top3[0].stats?.publications || 0}</p>
                    </div>
                    <div className="bg-surface-container-low p-2.5 rounded-xl border border-on-surface/5 shadow-sm">
                      <p className="text-[8px] uppercase font-black tracking-widest text-on-surface-muted mb-0.5 opacity-50">Отзывы</p>
                      <p className="text-xl font-black text-on-surface">{top3[0].stats?.reviews || 0}</p>
                    </div>
                    <div className="bg-accent-amber p-2.5 rounded-xl shadow-md shadow-accent-amber/20">
                      <p className="text-[8px] uppercase font-black tracking-widest text-white/60 mb-0.5">Очки</p>
                      <p className="text-xl font-black text-white">{(top3[0].stats?.publications || 0) * 10 + (top3[0].stats?.reviews || 0) * 2}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 2 & 3 */}
            <div className="md:col-span-6 flex flex-col gap-6">
              {/* Rank 2 */}
              {top3[1] && (
                <div 
                  onClick={() => setSelectedUser(top3[1])}
                  className="bg-surface rounded-3xl p-4 flex items-center justify-between group shadow-sm border border-on-surface/5 hover:shadow-md transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-black text-slate-300 mr-2">02</div>
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-surface-container flex items-center justify-center font-black text-lg text-on-surface border border-on-surface/5 shadow-inner shrink-0">
                      {top3[1].avatarUrl ? (
                        <Image alt={top3[1].name} fill sizes="56px" className="object-cover" src={top3[1].avatarUrl} />
                      ) : (
                        top3[1].name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-black text-lg leading-tight text-on-surface">{top3[1].name}</p>
                      <p className="text-[9px] text-on-surface-variant font-black uppercase tracking-[0.2em] opacity-40">{top3[1].role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-on-surface">{top3[1].stats?.reviews || 0}</p>
                    <p className="text-[8px] uppercase font-black tracking-widest text-on-surface-variant opacity-60">Отзывов</p>
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {top3[2] && (
                <div 
                  onClick={() => setSelectedUser(top3[2])}
                  className="bg-surface rounded-3xl p-4 flex items-center justify-between group shadow-sm border border-on-surface/5 hover:shadow-md transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-black text-orange-200 mr-2">03</div>
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-surface-container flex items-center justify-center font-black text-lg text-on-surface border border-on-surface/5 shadow-inner shrink-0">
                      {top3[2].avatarUrl ? (
                        <Image alt={top3[2].name} fill sizes="56px" className="object-cover" src={top3[2].avatarUrl} />
                      ) : (
                        top3[2].name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-black text-lg leading-tight text-on-surface">{top3[2].name}</p>
                      <p className="text-[9px] text-on-surface-variant font-black uppercase tracking-[0.2em] opacity-40">{top3[2].role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-on-surface">{top3[2].stats?.reviews || 0}</p>
                    <p className="text-[8px] uppercase font-black tracking-widest text-on-surface-variant opacity-60">Отзывов</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Heroes of the Community Section */}
        {!loading && (
          <section className="mb-20">
            <div className="flex flex-col gap-2 mb-10">
              <h2 className="text-2xl font-black text-on-surface uppercase leading-none">Герои сообщества</h2>
              <div className="h-1 w-12 bg-amber-500 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LeaderboardColumn
                title="Лучшие авторы"
                subtitle="Больше всего лайков за отзывы"
                icon="stars"
                users={topAuthors}
                metricLabel="лайков"
                onUserClick={openLeaderboardUser}
              />
              <LeaderboardColumn
                title="Комментаторы"
                subtitle="Самые активные в обсуждениях"
                icon="forum"
                users={topCommenters}
                metricLabel="ответов"
                onUserClick={openLeaderboardUser}
              />
              <LeaderboardColumn
                title="Публицисты"
                subtitle="Главные поставщики контента"
                icon="library_add"
                users={topPublicists}
                metricLabel="публ."
                onUserClick={openLeaderboardUser}
              />
            </div>
          </section>
        )}

        {/* Leaderboard Table */}
        {!loading && restUsers.length > 0 && (
          <div className="mb-12">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-6 flex items-center gap-2 opacity-60">
              <span className="material-symbols-outlined text-[16px]">leaderboard</span>
              Полный список
            </h4>
            <div className="space-y-3">
              {restUsers.map((user, idx) => (
                <div 
                  key={user.id} 
                  onClick={() => setSelectedUser(user)}
                  className="bg-surface rounded-2xl p-2.5 flex items-center transition-all hover:bg-surface-container hover:scale-[1.01] shadow-sm border border-on-surface/5 cursor-pointer group"
                >
                  <div className="w-8 text-center text-on-surface-variant font-black text-xs opacity-30 group-hover:opacity-60">{4 + idx}</div>
                  <div className="flex items-center gap-4 flex-1 px-4">
                    <div className="relative w-11 h-11 rounded-full bg-surface-container overflow-hidden flex items-center justify-center text-on-surface font-black text-sm border border-on-surface/5 shrink-0">
                      {user.avatarUrl ? (
                        <Image alt={user.name} fill sizes="44px" className="object-cover" src={user.avatarUrl} />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-black text-sm text-on-surface group-hover:text-primary transition-colors">{user.name}</p>
                      <div className="flex gap-1 mt-1">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest ${
                          user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 
                          user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-surface-container-highest text-on-surface-variant'
                        }`}>
                          {user.role === 'superadmin' ? 'Суперадмин' : user.role === 'admin' ? 'Админ' : user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-10 pr-2">
                    {/* Points */}
                    <div className="flex flex-col items-center min-w-[36px]">
                      <span className="material-symbols-rounded text-amber-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                      <span className="text-[11px] font-black text-on-surface mt-0.5">
                        {(user.stats?.publications || 0) * 10 + (user.stats?.reviews || 0) * 2}
                      </span>
                    </div>

                    {/* Publications */}
                    <div className="flex flex-col items-center min-w-[36px]">
                      <span className="material-symbols-rounded text-on-surface-variant text-[18px]">library_add</span>
                      <span className="text-[11px] font-black text-on-surface mt-0.5">{user.stats?.publications || 0}</span>
                    </div>

                    {/* Reviews */}
                    <div className="flex flex-col items-center min-w-[36px]">
                      <span className="material-symbols-rounded text-primary text-[18px]">history_edu</span>
                      <span className="text-[11px] font-black text-on-surface mt-0.5">{user.stats?.reviews || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      {selectedUser && (
        <PublicProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onOpenContent={(c) => {
            setOpenedContent(c);
          }}
        />
      )}

      {openedContent && (
        <ContentDetailsModal
          content={openedContent}
          onClose={() => setOpenedContent(null)}
        />
      )}

      <BottomNavBar activeTab="users" />
    </>
  );
}
