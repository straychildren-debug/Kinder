'use client';

import React from "react";
import TopNavBar from "@/components/TopNavBar";
import BottomNavBar from "@/components/BottomNavBar";
import { useAuth } from "@/components/AuthProvider";
import { getContentByUser, getContentById } from "@/lib/db";
import { ContentItem } from "@/lib/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { defaultBlurDataURL } from "@/lib/image-blur";
import AwardsShelf from "@/components/AwardsShelf";
import WishlistShelf from "@/components/WishlistShelf";
import ContentDetailsModal from "@/components/ContentDetailsModal";

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  const [userContent, setUserContent] = React.useState<ContentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openedContent, setOpenedContent] = React.useState<ContentItem | null>(null);
  const [pinnedContent, setPinnedContent] = React.useState<ContentItem | null>(null);

  React.useEffect(() => {
    async function load() {
      if (user) {
        const content = await getContentByUser(user.id);
        setUserContent(content);
        if (user.pinnedContentId) {
          const pinned = await getContentById(user.pinnedContentId);
          setPinnedContent(pinned);
        } else {
          setPinnedContent(null);
        }
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
          <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center border border-on-surface/5 shadow-2xl">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">person</span>
          </div>
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tighter text-on-surface">Войдите в аккаунт</h2>
            <p className="text-on-surface-muted text-sm font-medium max-w-xs mx-auto leading-relaxed">
              Чтобы просматривать профиль, делиться контентом и участвовать в жизни сообщества, необходимо авторизоваться
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-on-surface text-surface rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-lg shadow-on-surface/10"
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
              <div className="relative w-56 h-56 rounded-3xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] transition-all duration-700 group-hover:scale-[1.05] group-hover:-rotate-2 border-4 border-white">
                {user.avatarUrl ? (
                  <Image alt={user.name} fill sizes="224px" className="object-cover" src={user.avatarUrl} />
                ) : (
                  <div className="w-full h-full bg-surface-container flex items-center justify-center text-6xl font-black text-on-surface/10 ">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              {user.role !== 'user' && (
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-[24px] flex items-center justify-center shadow-2xl border border-on-surface/5 ring-4 ring-surface">
                  <span className="material-symbols-outlined text-on-surface text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left space-y-2">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-muted">Пользователь</span>
                <h1 className="text-5xl font-black tracking-tighter text-on-surface leading-none">{user.name}</h1>
              </div>
              
              <p className="text-on-surface-muted font-medium text-sm max-w-xs">{user.bio || user.email}</p>
              
              {user.role !== 'user' && (
                <span className={`inline-block px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                  user.role === 'superadmin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-black text-white border-on-surface'
                }`}>
                  {user.role === 'superadmin' ? 'Суперадмин' : user.role === 'admin' ? 'Администратор' : 'Модератор'}
                </span>
              )}
              
              <div className="flex items-center justify-center md:justify-start gap-8 pt-6 border-t border-on-surface/5 mt-4">
                <div className="text-center md:text-left">
                  <span className="block text-2xl font-black tracking-tighter text-on-surface leading-none mb-1">{user.stats?.reviews || 0}</span>
                   <span className="text-[9px] uppercase tracking-widest text-on-surface-muted font-black">Отзывы</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="block text-2xl font-black tracking-tighter text-on-surface leading-none mb-1">{user.stats?.followers || 0}</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-muted font-black">Подписчики</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="block text-2xl font-black tracking-tighter text-on-surface leading-none mb-1">{user.stats?.awards || 0}</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-muted font-black">Награды</span>
                </div>
              </div>
            </div>
            
            <button className="w-full py-3.5 bg-on-surface text-surface rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-on-surface/10">
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              Настройки аккаунта
            </button>
          </div>

          <div className="md:col-span-8 space-y-16">
            {/* Статистика активности */}
            <div className="bg-surface p-7 rounded-3xl border border-on-surface/5 shadow-sm">
              <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-on-surface-muted mb-8">Активность сообщества</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-1">
                  <span className="block text-4xl font-black tracking-tighter text-on-surface leading-none mb-1">{userContent.length}</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-muted font-black">Публикаций</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-4xl font-black tracking-tighter text-green-600 leading-none mb-1">{approvedCount}</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-muted font-black">Одобрено</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-4xl font-black tracking-tighter text-amber-500 leading-none mb-1">{pendingCount}</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-muted font-black">На проверке</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-4xl font-black tracking-tighter text-on-surface leading-none mb-1">{(user.stats?.avgRating || 0).toFixed(1)}</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-muted font-black">Ср. рейтинг</span>
                </div>
              </div>
            </div>

            {/* Закреплённое любимое */}
            {pinnedContent && (
              <div className="space-y-6">
                <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-on-surface-muted">
                  Любимое {pinnedContent.type === 'movie' ? 'кино' : 'книга'}
                </h2>
                <button
                  onClick={() => setOpenedContent(pinnedContent)}
                  className="w-full text-left group relative overflow-hidden rounded-[32px] border border-on-surface/5 shadow-xl hover:shadow-2xl transition-all duration-500 bg-surface"
                >
                  <div className="relative aspect-[16/7] w-full overflow-hidden">
                    {pinnedContent.imageUrl ? (
                      <Image
                        alt={pinnedContent.title}
                        src={pinnedContent.imageUrl}
                        fill
                        sizes="(min-width: 768px) 800px, 100vw"
                        placeholder="blur"
                        blurDataURL={defaultBlurDataURL}
                        className="object-cover group-hover:scale-105 transition-transform duration-[1500ms] ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-5 left-5">
                      <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-on-surface uppercase tracking-[0.2em] shadow-sm border border-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        Закреплено
                      </span>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">
                        {pinnedContent.type === 'movie' ? 'Кино' : 'Книга'}
                        {pinnedContent.author ? ` · ${pinnedContent.author}` : ''}
                        {pinnedContent.director ? ` · ${pinnedContent.director}` : ''}
                      </p>
                      <h3 className="text-3xl md:text-4xl font-black tracking-tighter leading-[0.9]">
                        {pinnedContent.title}
                      </h3>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Достижения */}
            <div className="space-y-6">
              <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-on-surface-variant opacity-40">Достижения</h2>
              <AwardsShelf userId={user.id} />
            </div>

            {/* Хочу посмотреть/прочитать */}
            <div className="space-y-6">
              <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-on-surface-muted">Хочу посмотреть и прочитать</h2>
              <WishlistShelf userId={user.id} onOpenContent={(c) => setOpenedContent(c)} />
            </div>

            {/* Мои публикации */}
            <div className="space-y-10">
              <div className="flex justify-between items-end">
                <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-on-surface-variant opacity-40 ">Моя история</h2>
              </div>

              {userContent.length === 0 ? (
                <div className="bg-surface rounded-3xl p-10 text-center space-y-6 border border-on-surface/5 shadow-sm border-dashed">
                  <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 ">auto_stories</span>
                  </div>
                  <p className="text-on-surface-variant font-medium text-sm  opacity-60">Ваша полка пока пуста. Пора добавить что-то интересное!</p>
                  <button
                    onClick={() => router.push('/create')}
                    className="px-6 py-3 bg-on-surface text-surface rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-lg shadow-on-surface/10"
                  >
                    Создать
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {userContent.map(item => (
                    <div key={item.id} className="bg-white rounded-3xl overflow-hidden flex shadow-sm border border-on-surface/5 hover:shadow-2xl hover:scale-[1.01] transition-all group">
                      <div className="relative w-32 h-32 md:w-44 md:h-44 shrink-0 bg-surface-container flex items-center justify-center overflow-hidden border-r border-on-surface/5">
                        {item.imageUrl ? (
                          <Image alt={item.title} fill sizes="(min-width: 768px) 176px, 128px" placeholder="blur" blurDataURL={defaultBlurDataURL} className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" src={item.imageUrl} />
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
                              item.status === 'draft' ? 'bg-surface-container text-on-surface-variant border-on-surface/5' :
                              'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {item.status === 'approved' ? 'Опубликовано' :
                               item.status === 'pending' ? 'На модерации' : 
                               item.status === 'draft' ? 'Черновик' : 'Отклонено'}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface-muted font-medium line-clamp-2 leading-relaxed">{item.description}</p>
                          {item.status === 'rejected' && item.rejectionReason && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <span className="block text-[9px] font-black uppercase tracking-widest text-red-600 mb-1 opacity-60">Причина отклонения:</span>
                                <p className="text-xs font-bold text-red-700 leading-relaxed italic">"{item.rejectionReason}"</p>
                              </div>
                              <button
                                onClick={() => router.push(`/create?editContentId=${item.id}`)}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2 shrink-0"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                Исправить
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-on-surface/5">
                          <div className="flex items-center gap-2 leading-none">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-muted opacity-40">calendar_today</span>
                            <span className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          {item.type && (
                            <div className="flex items-center gap-2 leading-none">
                              <span className="material-symbols-outlined text-[16px] text-on-surface-muted opacity-40">
                                {item.type === 'movie' ? 'movie' : 'menu_book'}
                              </span>
                              <span className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
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
      {openedContent && (
        <ContentDetailsModal
          content={openedContent}
          onClose={() => setOpenedContent(null)}
        />
      )}
      <BottomNavBar />
    </>
  );
}
