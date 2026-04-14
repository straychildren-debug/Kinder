'use client';

import React from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { getUsersRanked } from '@/lib/db';
import { User } from '@/lib/types';

export default function UsersPage() {
  const [rankedUsers, setRankedUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const users = await getUsersRanked();
      setRankedUsers(users);
      setLoading(false);
    }
    load();
  }, []);

  const getMedalIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const getMedalBg = (index: number) => {
    if (index === 0) return 'bg-amber-50 ring-2 ring-amber-200/60';
    if (index === 1) return 'bg-slate-50 ring-2 ring-slate-200/60';
    if (index === 2) return 'bg-orange-50 ring-2 ring-orange-200/60';
    return 'bg-surface-container-lowest';
  };

  return (
    <>
      <TopNavBar />
      <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
        <section className="mb-8">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Сообщество</span>
          <h2 className="text-3xl font-bold leading-tight tracking-tight mt-1">Рейтинг пользователей</h2>
          <p className="text-on-surface-variant text-sm mt-2">
            Самые активные участники сообщества по совокупности публикаций, рецензий и наград
          </p>
        </section>

        {loading ? (
             <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : rankedUsers.length > 0 ? (
          <>
            {/* Топ-3 подиум */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {rankedUsers.slice(0, 3).map((user, i) => {
            const order = i === 0 ? 'order-2' : i === 1 ? 'order-1' : 'order-3';
            const size = i === 0 ? 'scale-105' : '';
            return (
              <div key={user.id} className={`${order} ${size} text-center flex flex-col items-center space-y-3 transition-transform`}>
                <div className="relative">
                  <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shadow-lg ${i === 0 ? 'ring-4 ring-amber-300/50' : ''}`}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 text-2xl">{getMedalIcon(i)}</div>
                </div>
                <div>
                  <p className="text-sm font-bold truncate max-w-[120px]">{user.name}</p>
                  <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-widest">
                    {user.stats.publications} публ. • {user.stats.reviews} рец.
                  </p>
                </div>
                <div className="bg-primary/10 px-3 py-1 rounded-full">
                  <span className="text-xs font-bold text-primary">{user.stats.avgRating} ★</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Полный рейтинг */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Полный рейтинг</h3>
          {rankedUsers.map((user, index) => (
            <div
              key={user.id}
              className={`${getMedalBg(index)} rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-sm`}
            >
              {/* Позиция */}
              <div className="w-10 h-10 flex items-center justify-center text-lg font-bold shrink-0">
                {index < 3 ? getMedalIcon(index) : (
                  <span className="text-on-surface-variant">{index + 1}</span>
                )}
              </div>

              {/* Аватар */}
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-container-high shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-primary">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{user.name}</p>
                <p className="text-xs text-on-surface-variant">
                  {user.bio ? user.bio.slice(0, 50) + (user.bio.length > 50 ? '...' : '') : 'Участник сообщества'}
                </p>
              </div>

              {/* Статистика */}
              <div className="hidden md:flex items-center gap-6 shrink-0">
                <div className="text-center">
                  <span className="block text-sm font-bold">{user.stats.publications}</span>
                  <span className="text-[9px] text-on-surface-variant font-semibold uppercase tracking-widest">Публикаций</span>
                </div>
                <div className="text-center">
                  <span className="block text-sm font-bold">{user.stats.reviews}</span>
                  <span className="text-[9px] text-on-surface-variant font-semibold uppercase tracking-widest">Рецензий</span>
                </div>
                <div className="text-center">
                  <span className="block text-sm font-bold">{user.stats.avgRating}</span>
                  <span className="text-[9px] text-on-surface-variant font-semibold uppercase tracking-widest">Рейтинг</span>
                </div>
                <div className="text-center">
                  <span className="block text-sm font-bold">{user.stats.awards}</span>
                  <span className="text-[9px] text-on-surface-variant font-semibold uppercase tracking-widest">Награды</span>
                </div>
              </div>

              {/* Мобильная статистика */}
              <div className="md:hidden flex flex-col items-end shrink-0">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-sm font-bold">{user.stats.avgRating}</span>
                </div>
                <span className="text-[9px] text-on-surface-variant">{user.stats.followers} подп.</span>
              </div>
            </div>
          ))}
        </div>
          </>
        ) : (
          <div className="text-center text-on-surface-variant p-8">Пользователей пока нет.</div>
        )}
      </main>
      <BottomNavBar activeTab="users" />
    </>
  );
}
