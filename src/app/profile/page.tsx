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
        <main className="pt-24 pb-32 px-6 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center border border-black/5 shadow-2xl">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">person</span>
          </div>
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tighter">Войдите в аккаунт</h2>
            <p className="text-on-surface-variant text-sm font-medium opacity-60 max-w-xs mx-auto  leading-relaxed">
              Чтобы просматривать профиль, делиться контентом и участвовать в жизни сообщества, необходимо авторизоваться
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="px-10 py-4 bg-on-surface text-surface rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-2xl shadow-black/20"
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
          <div className="w-12 h-12 border-[6px] border-on-surface/5 border-t-on-surface rounded-full animate-spin"></div>
        </main>
        <BottomNavBar />
      </>
    );
  }

  return (
    <>
      <TopNavBar />
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <section className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 items-start">
          <div className="md:col-span-4 flex flex-col items-center md:items-start space-y-8">
            <div className="relative group">
              <div className="w-56 h-56 rounded-[48px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] transition-all duration-700 group-hover:scale-[1.05] group-hover:-rotate-2 border-4 border-white">
                {user.avatarUrl ? (
                  <img alt={user.name} className="w-full h-full object-cover" src={user.avatarUrl} />
                ) : (
                  <div className="w-full h-full bg-surface-container flex items-center justify-center text-6xl font-black text-on-surface/10 ">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              {user.role !== 'user' && (
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-[24px] flex items-center justify-center shadow-2xl border border-black/5 ring-4 ring-surface">
                  <span className="material-symbols-outlined text-on-surface text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40 ">Пользователь</span>
                <h1 className="text-5xl font-black tracking-tighter text-on-surface leading-none">{user.name}</h1>
              </div>
              
              <p className="text-on-surface-variant font-medium text-sm  opacity-70 max-w-xs">{user.bio || user.email}</p>
              
              {user.role !== 'user' && (
                <span className={`inline-block px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                  user.role === 'superadmin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-black text-white border-black'
                }`}>
                  {user.role === 'superadmin' ? 'Суперадмин' : user.role === 'admin' ? 'Администратор' : 'Модератор'}
                </span>
              )}
              
              <div className="flex items-center justify-center md:justify-start gap-8 pt-4 border-t border-black/5 mt-4">
                <div className="text-center md:text-left">
                  <span className="block text-2xl font-black tracking-tighter">{user.stats?.reviews || 0}</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black opacity-40">Рецензии</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="block text-2xl font-black tracking-tighter">{user.stats?.followers || 0}</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black opacity-40">Подписчики</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="block text-2xl font-black tracking-tighter">{user.stats?.awards || 0}</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black opacity-40">Награды</span>
                </div>
              </div>
            </div>
            
            <button className="w-full py-5 bg-on-surface text-surface rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl shadow-black/20">
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              Настройки аккаунта
            </button>
          </div>

          <div className="md:col-span-8 space-y-16">
            {/* Статистика активности */}
            <div className="bg-surface p-10 rounded-[40px] border border-black/5 shadow-sm">
              <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-on-surface-variant mb-8 opacity-40 ">Активность сообщества</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-1">
                  <span className="block text-4xl font-black tracking-tighter">{userContent.length}</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black opacity-50">Публикаций</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-4xl font-black tracking-tighter text-green-600">{approvedCount}</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black opacity-50">Одобрено</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-4xl font-black tracking-tighter text-amber-500">{pendingCount}</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black opacity-50">На проверке</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-4xl font-black tracking-tighter">{(user.stats?.avgRating || 0).toFixed(1)}</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-black opacity-50">Ср. рейтинг</span>
                </div>
              </div>
            </div>

            {/* Мои публикации */}
            <div className="space-y-10">
              <div className="flex justify-between items-end">
                <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-on-surface-variant opacity-40 ">Моя история</h2>
              </div>

              {userContent.length === 0 ? (
                <div className="bg-surface rounded-[40px] p-16 text-center space-y-6 border border-black/5 shadow-sm border-dashed">
                  <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 ">auto_stories</span>
                  </div>
                  <p className="text-on-surface-variant font-medium text-sm  opacity-60">Ваша полка пока пуста. Пора добавить что-то интересное!</p>
                  <button
                    onClick={() => router.push('/create')}
                    className="px-10 py-4 bg-on-surface text-surface rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-2xl shadow-black/20"
                  >
                    Создать
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {userContent.map(item => (
                    <div key={item.id} className="bg-white rounded-[32px] overflow-hidden flex shadow-sm border border-black/5 hover:shadow-2xl hover:scale-[1.01] transition-all group">
                      <div className="w-32 h-32 md:w-44 md:h-44 shrink-0 bg-surface-container flex items-center justify-center overflow-hidden border-r border-black/5">
                        {item.imageUrl ? (
                          <img alt={item.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" src={item.imageUrl} />
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant/20 text-4xl ">image</span>
                        )}
                      </div>
                      <div className="flex-1 p-6 md:p-10 flex flex-col justify-between min-w-0">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <h3 className="font-black text-xl md:text-2xl text-on-surface tracking-tighter truncate pr-2 flex-1 leading-none">{item.title}</h3>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shrink-0 border ${
                              item.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                              item.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              item.status === 'draft' ? 'bg-surface-container text-on-surface-variant border-black/5' :
                              'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {item.status === 'approved' ? 'Опубликовано' :
                               item.status === 'pending' ? 'На модерации' : 
                               item.status === 'draft' ? 'Черновик' : 'Отклонено'}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface-variant font-medium line-clamp-2 leading-relaxed opacity-60 ">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-black/5">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant opacity-40">calendar_today</span>
                            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          {item.type && (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-on-surface-variant opacity-40">
                                {item.type === 'movie' ? 'movie' : 'menu_book'}
                              </span>
                              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">
                                {item.type === 'movie' ? 'Кино' : 'Книга'}
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
