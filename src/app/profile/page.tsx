'use client';

import React from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { useAuth } from "@/components/AuthProvider";
import { getContentByUser } from "@/lib/db";
import { ContentItem } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  const [userContent, setUserContent] = React.useState<ContentItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      if (user) {
        const content = await getContentByUser(user.id);
        setUserContent(content);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  if (!user) {
    return (
      <>
        <TopNavBar />
        <main className="pt-24 pb-32 px-6 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">person</span>
          <h2 className="text-2xl font-bold">Войдите в аккаунт</h2>
          <p className="text-on-surface-variant text-center">
            Чтобы просматривать профиль, необходимо авторизоваться
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 glass-btn text-white rounded-xl font-semibold transition-transform active:scale-95"
          >
            Войти
          </button>
        </main>
        <BottomNavBar />
      </>
    );
  }

  const approvedCount = userContent.filter(c => c.status === 'approved').length;
  const pendingCount = userContent.filter(c => c.status === 'pending').length;

  if (loading) {
    return (
      <>
        <TopNavBar />
        <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </main>
        <BottomNavBar />
      </>
    );
  }

  return (
    <>
      <TopNavBar />
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16 items-start">
          <div className="md:col-span-4 flex flex-col items-center md:items-start space-y-6">
            <div className="relative group">
              <div className="w-48 h-48 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                {user.avatarUrl ? (
                  <img alt={user.name} className="w-full h-full object-cover" src={user.avatarUrl} />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-5xl font-bold text-primary">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              {user.role !== 'user' && (
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              )}
            </div>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-on-surface">{user.name}</h1>
              <p className="text-on-surface-variant font-medium">{user.bio || user.email}</p>
              {user.role !== 'user' && (
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-full">
                  {user.role === 'admin' ? 'Администратор' : 'Модератор'}
                </span>
              )}
              <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                <div className="text-center">
                  <span className="block text-xl font-bold">{user.stats?.reviews || 0}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Рецензии</span>
                </div>
                <div className="text-center px-4 border-x border-outline-variant/20">
                  <span className="block text-xl font-bold">{user.stats?.followers || 0}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Подписчики</span>
                </div>
                <div className="text-center">
                  <span className="block text-xl font-bold">{user.stats?.awards || 0}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Награды</span>
                </div>
              </div>
            </div>
            <button className="w-full md:w-auto px-8 py-4 glass-action text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Редактировать профиль
            </button>
          </div>

          <div className="md:col-span-8 space-y-12">
            {/* Статистика активности */}
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant mb-6">Активность</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-5 rounded-xl text-center">
                  <span className="block text-2xl font-bold">{userContent.length}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Публикаций</span>
                </div>
                <div className="bg-surface-container-lowest p-5 rounded-xl text-center">
                  <span className="block text-2xl font-bold">{approvedCount}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Одобрено</span>
                </div>
                <div className="bg-surface-container-lowest p-5 rounded-xl text-center">
                  <span className="block text-2xl font-bold">{pendingCount}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">На проверке</span>
                </div>
                <div className="bg-surface-container-lowest p-5 rounded-xl text-center">
                  <span className="block text-2xl font-bold">{user.stats?.avgRating || 0}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Ср. рейтинг</span>
                </div>
              </div>
            </div>

            {/* Мои публикации */}
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">Мои публикации</h2>
              </div>

              {userContent.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-2xl p-8 text-center space-y-4">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/20">library_add</span>
                  <p className="text-on-surface-variant">У вас пока нет публикаций</p>
                  <button
                    onClick={() => router.push('/create')}
                    className="px-6 py-2.5 glass-btn text-white rounded-xl font-semibold text-sm transition-transform active:scale-95"
                  >
                    Создать первую
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {userContent.map(item => (
                    <div key={item.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden flex shadow-sm border border-outline-variant/5 hover:shadow-md transition-shadow">
                      <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-surface-container flex items-center justify-center">
                        {item.imageUrl ? (
                          <img alt={item.title} className="w-full h-full object-cover" src={item.imageUrl} />
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant/20 text-3xl">image</span>
                        )}
                      </div>
                      <div className="flex-1 p-4 md:p-6 flex flex-col justify-between min-w-0">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="font-bold text-sm md:text-base text-on-surface truncate pr-2 flex-1">{item.title}</h3>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 ${
                              item.status === 'approved' ? 'bg-green-100 text-green-700' :
                              item.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              item.status === 'draft' ? 'bg-surface-container-high text-on-surface-variant' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {item.status === 'approved' ? 'Опубликовано' :
                               item.status === 'pending' ? 'На модерации' : 
                               item.status === 'draft' ? 'Черновик' : 'Отклонено'}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <div className="flex items-center gap-1.5 py-1 px-2 bg-surface-container rounded-lg">
                            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">calendar_today</span>
                            <span className="text-[10px] font-bold text-on-surface-variant">{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          {item.type && (
                            <div className="flex items-center gap-1.5 py-1 px-2 bg-surface-container rounded-lg">
                              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                                {item.type === 'movie' ? 'movie' : 'menu_book'}
                              </span>
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                                {item.type === 'movie' ? 'Фильм' : 'Книга'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <BottomNavBar />
    </>
  );
}
