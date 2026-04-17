'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import Link from 'next/link';
import Image from 'next/image';
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  subscribeToNotifications 
} from '@/lib/notifications';
import { Notification } from '@/lib/types';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user || !isOpen) return;

    let alive = true;
    const load = async () => {
      const data = await getNotifications(user.id, 10);
      if (alive) setNotifications(data);
    };

    load();

    const unsub = subscribeToNotifications(user.id, (n) => {
      setNotifications(prev => [n, ...prev].slice(0, 10));
    });

    return () => {
      alive = false;
      unsub();
    };
  }, [user, isOpen]);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.readAt) {
      await markNotificationRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(x => ({ ...x, readAt: x.readAt || new Date().toISOString() })));
  };

  const getNotificationVerb = (n: Notification) => {
    switch (n.type) {
      case 'reply': return 'ответил(а) на ваш комментарий';
      case 'reaction': return `отреагировал(а) ${n.payload.emoji || '❤️'}`;
      case 'mention': return 'упомянул(а) вас';
      case 'club_invite': return 'пригласил(а) вас в клуб';
      case 'marathon': return 'обновил информацию о марафоне';
      default: return 'взаимодействует с вами';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Затемнение фона */}
      <div
        className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Боковая панель */}
      <aside
        className="fixed top-0 right-0 h-full w-[340px] max-w-[85vw] bg-surface z-[70] shadow-xl transform transition-transform duration-300 ease-out flex flex-col border-l border-on-surface/5"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Шапка */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Профиль</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {user ? (
          <div className="flex-1 overflow-y-auto px-6">
            {/* Аватар и имя */}
            <div className="flex flex-col items-center text-center py-6 space-y-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-surface-container-high shadow-md">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={user.name} fill sizes="96px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold">{user.name}</h3>
                <p className="text-sm text-on-surface-variant">{user.email}</p>
                {user.bio && (
                  <p className="text-sm text-on-surface-variant mt-2">{user.bio}</p>
                )}
              </div>
              {user.role !== 'user' && (
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full ${
                  user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-primary/10 text-primary'
                }`}>
                  {user.role === 'superadmin' ? 'Суперадмин' : user.role === 'admin' ? 'Администратор' : 'Модератор'}
                </span>
              )}
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-3 gap-3 py-6">
              <div className="bg-surface-container-low rounded-xl p-3 text-center">
                <span className="block text-lg font-bold">{user.stats.publications}</span>
                <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-semibold">Публикации</span>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3 text-center">
                <span className="block text-lg font-bold">{user.stats.reviews}</span>
                <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-semibold">Отзывы</span>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3 text-center">
                <span className="block text-lg font-bold">{user.stats.avgRating}</span>
                <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-semibold">Рейтинг</span>
              </div>
            </div>

            {/* Меню */}
            <nav className="space-y-1 py-4">
              <Link
                href="/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">person</span>
                <span className="text-sm font-medium">Мой профиль</span>
              </Link>
              <Link
                href="/create"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <span className="text-sm font-medium">Добавить контент</span>
              </Link>
              {(user.role === 'moderator' || user.role === 'admin' || user.role === 'superadmin') && (
                <Link
                  href="/moderation"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">shield</span>
                  <span className="text-sm font-medium">Модерация</span>
                  <span className="ml-auto bg-error text-on-error text-xs font-bold px-2 py-0.5 rounded-full">2</span>
                </Link>
              )}
              {(user.role === 'admin' || user.role === 'superadmin') && (
                <Link
                  href="/users"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                  <span className="text-sm font-medium">Управление ролями</span>
                </Link>
              )}
              <Link
                href="/leaderboard"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low transition-colors border-b border-on-surface/5 pb-6 mb-6"
              >
                <span className="material-symbols-outlined text-[20px]">leaderboard</span>
                <span className="text-sm font-medium">Рейтинг пользователей</span>
              </Link>
            </nav>

            {/* Уведомления */}
            <div className="pb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Уведомления</h4>
                {notifications.some(n => !n.readAt) && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-[9px] font-black uppercase tracking-widest text-accent-lilac hover:text-on-surface transition-colors"
                  >
                    Прочитать все
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-on-surface/5">
                    <span className="material-symbols-outlined text-on-surface-variant/20">notifications_none</span>
                    <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 mt-2">Пока нет уведомлений</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map(n => {
                    const isUnread = !n.readAt;
                    return (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        className={`group relative p-3 rounded-xl transition-all cursor-pointer border ${isUnread ? 'bg-accent-lilac/[0.03] border-accent-lilac/10' : 'bg-surface border-transparent hover:bg-surface-container-low'}`}
                      >
                        <div className="flex gap-3">
                          <div className="relative w-8 h-8 rounded-full bg-surface-container-high overflow-hidden shrink-0 shadow-sm border border-white">
                            {n.actorAvatar ? (
                              <Image src={n.actorAvatar} alt={n.actorName || ''} fill sizes="32px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-on-surface-variant">
                                {n.actorName?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium leading-[1.3] text-on-surface line-clamp-2">
                              <span className="font-black">{n.actorName || 'Пользователь'}</span> {getNotificationVerb(n)}
                            </p>
                            <span className="text-[8px] font-bold text-on-surface-variant/40 uppercase tracking-widest mt-1 block">
                              {new Date(n.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          {isUnread && (
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-lilac shrink-0 mt-1.5" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {notifications.length > 10 && (
                <Link href="/notifications" className="block text-center mt-4 text-[9px] font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">
                  Показать все уведомления
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-6">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">account_circle</span>
            <p className="text-center text-on-surface-variant">
              Войдите, чтобы создавать контент и оставлять отзывы
            </p>
            <Link
              href="/login"
              onClick={onClose}
              className="w-full py-4 bg-on-surface text-surface rounded-2xl font-black text-center text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-on-surface/10"
            >
              Войти
            </Link>
          </div>
        )}

        {/* Кнопка выхода */}
        {user && (
          <div className="p-6 pt-2">
            <button
              onClick={() => { logout(); onClose(); }}
              className="w-full py-3 rounded-xl text-sm font-semibold text-error bg-error-container/20 hover:bg-error-container/40 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Выйти из аккаунта
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
