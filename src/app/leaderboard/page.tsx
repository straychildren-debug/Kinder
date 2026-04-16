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
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant block mb-2">Сообщество знатоков</span>
              <h2 className="text-6xl font-black tracking-tighter text-on-surface leading-[0.9]">Рейтинг<br/>кураторов</h2>
            </div>
            <div className="flex gap-2">
              <button className="bg-surface-container-low px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-highest transition-colors">За месяц</button>
              <button className="bg-on-surface text-surface px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-on-surface/5 transition-all hover:scale-95">За всё время</button>
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
              <div className="md:col-span-6 bg-surface rounded-3xl p-5 relative overflow-hidden group shadow-xl border border-on-surface/5">
                <div className="absolute -top-4 -right-4 text-[120px] font-black text-on-surface/5 select-none leading-none">1</div>
                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shadow-xl bg-surface-container flex items-center justify-center font-black text-xl text-on-surface">
                      {top3[0].avatarUrl ? (
                        <img alt={top3[0].name} className="w-full h-full object-cover" src={top3[0].avatarUrl} />
                      ) : (
                        top3[0].name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight mb-1 text-on-surface">{top3[0].name}</h3>
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
                      <p className="text-[8px] uppercase font-black tracking-widest text-on-surface-variant mb-0.5 opacity-50">Лайки</p>
                      <p className="text-xl font-black">{top3[0].stats?.avgRating || 0}</p>
                    </div>
                    <div className="bg-surface-container-low p-2.5 rounded-xl border border-on-surface/5 shadow-sm">
                      <p className="text-[8px] uppercase font-black tracking-widest text-on-surface-variant mb-0.5 opacity-50">Рецензии</p>
                      <p className="text-xl font-black">{top3[0].stats?.reviews || 0}</p>
                    </div>
                    <div className="bg-on-surface p-2.5 rounded-xl shadow-md shadow-on-surface/10">
                      <p className="text-[8px] uppercase font-black tracking-widest text-surface/50 mb-0.5">Очки</p>
                      <p className="text-xl font-black text-surface">{(top3[0].stats?.publications || 0) * 10}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 2 & 3 */}
            <div className="md:col-span-6 flex flex-col gap-6">
              {/* Rank 2 */}
              {top3[1] && (
                <div className="bg-surface rounded-3xl p-4 flex items-center justify-between group shadow-sm border border-on-surface/5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-black text-on-surface-variant/20 mr-2 tracking-tighter">02</div>
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center font-black text-lg text-on-surface border border-on-surface/5 shadow-inner">
                      {top3[1].avatarUrl ? (
                        <img alt={top3[1].name} className="w-full h-full object-cover" src={top3[1].avatarUrl} />
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
                    <p className="text-[8px] uppercase font-black tracking-widest text-on-surface-variant opacity-60">Рецензий</p>
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {top3[2] && (
                <div className="bg-surface rounded-3xl p-4 flex items-center justify-between group shadow-sm border border-on-surface/5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-black text-on-surface-variant/20 mr-2 tracking-tighter">03</div>
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center font-black text-lg text-on-surface border border-on-surface/5 shadow-inner">
                      {top3[2].avatarUrl ? (
                        <img alt={top3[2].name} className="w-full h-full object-cover" src={top3[2].avatarUrl} />
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
                    <p className="text-[8px] uppercase font-black tracking-widest text-on-surface-variant opacity-60">Рецензий</p>
                  </div>
                </div>
              )}
            </div>
          </div>
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
                <div key={user.id} className="bg-surface rounded-2xl p-2.5 flex items-center transition-all hover:bg-surface-container hover:scale-[1.01] shadow-sm border border-on-surface/5">
                  <div className="w-8 text-center text-on-surface-variant font-black text-xs opacity-30">{4 + idx}</div>
                  <div className="flex items-center gap-4 flex-1 px-4">
                    <div className="w-11 h-11 rounded-xl bg-surface-container overflow-hidden flex items-center justify-center text-on-surface font-black text-sm border border-on-surface/5">
                      {user.avatarUrl ? (
                        <img alt={user.name} className="w-full h-full object-cover" src={user.avatarUrl} />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-black text-sm text-on-surface tracking-tight">{user.name}</p>
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
                  <div className="flex items-center gap-8 pr-4">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-black text-on-surface">{user.stats?.reviews || 0}</p>
                      <p className="text-[8px] text-on-surface-variant uppercase font-black tracking-widest opacity-40">Рецензий</p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-black text-on-surface">{user.stats?.publications || 0}</p>
                      <p className="text-[8px] text-on-surface-variant uppercase font-black tracking-widest opacity-40">Публикаций</p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant opacity-20">chevron_right</span>
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
