'use client';

import React, { useEffect, useState } from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { getUsersRanked } from "@/lib/db";
import { User } from "@/lib/types";

export default function Leaderboard() {
  const [rankedUsers, setRankedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const topUsers = await getUsersRanked();
      setRankedUsers(topUsers);
      setLoading(false);
    }
    load();
  }, []);

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
              <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-on-surface-variant block mb-2">Сообщество знатоков</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface leading-tight">Рейтинг кураторов</h2>
            </div>
            <div className="flex gap-2">
              <button className="bg-surface-container-low px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container-highest transition-colors">За месяц</button>
              <button className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-primary/10 transition-all hover:scale-95">За всё время</button>
            </div>
          </div>
        </section>

        {/* Top 3 Leaders (Asymmetric Bento) */}
        {loading ? (
             <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
            {/* Rank 1 */}
            {top3[0] && (
              <div className="md:col-span-6 bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden group shadow-sm">
                <div className="absolute -top-4 -right-4 text-9xl font-bold text-surface-container-high opacity-40 select-none">1</div>
                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl bg-surface-container flex items-center justify-center font-bold text-2xl text-primary">
                      {top3[0].avatarUrl ? (
                        <img alt={top3[0].name} className="w-full h-full object-cover" src={top3[0].avatarUrl} />
                      ) : (
                        top3[0].name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-1">{top3[0].name}</h3>
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        <span className="text-sm font-medium">
                          {top3[0].role === 'superadmin' ? 'Суперадмин' : top3[0].role === 'admin' ? 'Администратор' : 'Ведущий критик'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-surface-container-low p-4 rounded-lg">
                      <p className="text-[11px] uppercase font-semibold text-on-surface-variant mb-1">Лайки</p>
                      <p className="text-xl font-bold">{top3[0].stats?.avgRating || 0}</p>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-lg">
                      <p className="text-[11px] uppercase font-semibold text-on-surface-variant mb-1">Рецензии</p>
                      <p className="text-xl font-bold">{top3[0].stats?.reviews || 0}</p>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-lg">
                      <p className="text-[11px] uppercase font-semibold text-on-surface-variant mb-1">Очки</p>
                      <p className="text-xl font-bold">{(top3[0].stats?.publications || 0) * 10}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 2 & 3 */}
            <div className="md:col-span-6 flex flex-col gap-6">
              {/* Rank 2 */}
              {top3[1] && (
                <div className="bg-surface-container-lowest rounded-xl p-6 flex items-center justify-between group shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-outline-variant mr-2">02</div>
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center font-bold text-xl text-primary">
                      {top3[1].avatarUrl ? (
                        <img alt={top3[1].name} className="w-full h-full object-cover" src={top3[1].avatarUrl} />
                      ) : (
                        top3[1].name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-lg leading-tight">{top3[1].name}</p>
                      <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">{top3[1].role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{top3[1].stats?.reviews || 0}</p>
                    <p className="text-[10px] uppercase font-semibold text-on-surface-variant">Рецензий</p>
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {top3[2] && (
                <div className="bg-surface-container-lowest rounded-xl p-6 flex items-center justify-between group shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-outline-variant mr-2">03</div>
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center font-bold text-xl text-primary">
                      {top3[2].avatarUrl ? (
                        <img alt={top3[2].name} className="w-full h-full object-cover" src={top3[2].avatarUrl} />
                      ) : (
                        top3[2].name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-lg leading-tight">{top3[2].name}</p>
                      <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">{top3[2].role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{top3[2].stats?.reviews || 0}</p>
                    <p className="text-[10px] uppercase font-semibold text-on-surface-variant">Рецензий</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && restUsers.length > 0 && (
          <div className="mb-12">
            <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">leaderboard</span>
              Полный список
            </h4>
            <div className="space-y-3">
              {restUsers.map((user, idx) => (
                <div key={user.id} className="glass-card rounded-xl p-4 flex items-center transition-all hover:bg-white/80 shadow-sm border border-outline-variant/10">
                  <div className="w-8 text-center text-on-surface-variant font-bold">{4 + idx}</div>
                  <div className="flex items-center gap-4 flex-1 px-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden flex items-center justify-center text-primary font-bold text-sm">
                      {user.avatarUrl ? (
                        <img alt={user.name} className="w-full h-full object-cover" src={user.avatarUrl} />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <div className="flex gap-1 mt-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 
                          user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-tertiary-container text-on-tertiary-container'
                        }`}>
                          {user.role === 'superadmin' ? 'Суперадмин' : user.role === 'admin' ? 'Админ' : user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 pr-4">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-bold">{user.stats?.reviews || 0}</p>
                      <p className="text-[9px] text-on-surface-variant uppercase font-semibold">Рецензий</p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-bold">{user.stats?.publications || 0}</p>
                      <p className="text-[9px] text-on-surface-variant uppercase font-semibold">Публикаций</p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <BottomNavBar activeTab="users" />
    </>
  );
}
