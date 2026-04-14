'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import Link from 'next/link';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <>
      {/* Затемнение фона */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Боковая панель */}
      <aside
        className="fixed top-0 right-0 h-full w-[340px] max-w-[85vw] bg-surface-container-lowest z-[70] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col"
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
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface-container-high shadow-lg">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
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
                  <p className="text-sm text-on-surface-variant mt-2 italic">{user.bio}</p>
                )}
              </div>
              {user.role !== 'user' && (
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-full">
                  {user.role === 'admin' ? 'Администратор' : 'Модератор'}
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
                <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-semibold">Рецензии</span>
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
              {(user.role === 'moderator' || user.role === 'admin') && (
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
              <Link
                href="/users"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">leaderboard</span>
                <span className="text-sm font-medium">Рейтинг пользователей</span>
              </Link>
            </nav>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-6">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">account_circle</span>
            <p className="text-center text-on-surface-variant">
              Войдите, чтобы создавать контент и оставлять рецензии
            </p>
            <Link
              href="/login"
              onClick={onClose}
              className="w-full py-3 glass-btn text-white rounded-xl font-semibold text-center block transition-transform active:scale-95"
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
