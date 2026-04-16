'use client';

import React, { useState, useEffect } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useAuth } from '@/components/AuthProvider';
import { searchProfiles, updateUserRole } from '@/lib/db';
import { User } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) {
      handleSearch('');
    } else if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const results = await searchProfiles(query);
      setUsers(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) {
        handleSearch(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    if (!currentUser) return;
    
    // Проверка прав: админ не может назначать суперадмина
    if (currentUser.role === 'admin' && newRole === 'superadmin') {
      setMessage({ text: 'Только суперадминистратор может назначать других суперадминистраторов', type: 'error' });
      return;
    }

    setUpdatingId(userId);
    setMessage(null);
    try {
      await updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setMessage({ text: 'Роль успешно обновлена', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Ошибка при обновлении роли', type: 'error' });
    } finally {
      setUpdatingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
    return <div className="h-screen flex items-center justify-center font-bold">Доступ запрещен</div>;
  }

  return (
    <>
      <TopNavBar />
      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
        <section className="mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-2 block opacity-40 ">Система доступа</span>
          <h1 className="text-5xl font-black tracking-tighter text-on-surface leading-[0.9]">Права и<br/>пользователи</h1>
          <p className="text-on-surface-variant text-sm mt-6 font-medium opacity-70  leading-relaxed max-w-lg">
            Управляйте экосистемой Kinder. Назначайте роли, контролируйте доступы и поддерживайте порядок в сообществе.
          </p>
        </section>

        {/* Поиск */}
        <div className="relative mb-12 group">
          <div className="absolute inset-0 bg-on-surface/5 rounded-[24px] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
          <div className="relative bg-white rounded-[24px] border border-on-surface/5 shadow-sm p-2 flex items-center gap-4 focus-within:shadow-2xl transition-all duration-500">
            <div className="w-12 h-12 flex items-center justify-center text-on-surface-variant/30">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени или email в базе данных..."
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-medium placeholder:text-on-surface-variant/20 tracking-tight"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="w-10 h-10 rounded-xl hover:bg-surface-container flex items-center justify-center text-on-surface-variant/30 transition-all"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className={`mb-10 p-6 rounded-[24px] text-[11px] font-black uppercase tracking-widest border animate-in fade-in slide-in-from-top-4 duration-700 ${
            message.type === 'success' ? 'bg-white border-green-100 text-green-600 shadow-2xl shadow-green-100' : 'bg-white border-red-100 text-red-600 shadow-2xl shadow-red-100'
          }`}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">{message.type === 'success' ? 'check_circle' : 'error'}</span>
              {message.text}
            </div>
          </div>
        )}

        {/* Таблица пользователей */}
        <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-on-surface/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container/30">
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40 ">Пользователь</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40 ">Email-адрес</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40 ">Уровень доступа</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40  text-right">Настройка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-32 text-center">
                      <div className="w-12 h-12 border-[6px] border-on-surface/5 border-t-on-surface rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-32 text-center text-on-surface-variant/40  font-black text-[11px] uppercase tracking-widest">
                      База данных пуста
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="hover:bg-surface-container/20 transition-all duration-300">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img 
                            src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} 
                            alt="" 
                            className="w-10 h-10 rounded-[14px] bg-surface-container border border-on-surface/5 grayscale brightness-90" 
                          />
                          <span className="font-black text-sm tracking-tighter">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-[11px] font-black lowercase tracking-widest opacity-40 truncate">{u.email}</td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          u.role === 'superadmin' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                          u.role === 'admin' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          u.role === 'moderator' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-surface-container text-on-surface-variant/60 border-on-surface/5'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end">
                          <div className="relative group/select inline-block text-left">
                            <select
                              value={u.role}
                              disabled={updatingId === u.id || (u.id === currentUser.id && u.role === 'superadmin')}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as User['role'])}
                              className="appearance-none bg-surface-container hover:bg-on-surface hover:text-surface text-[10px] font-black px-6 py-3 rounded-2xl border-none ring-0 focus:ring-0 cursor-pointer disabled:opacity-30 transition-all duration-300 pr-10 uppercase tracking-widest"
                            >
                              <option value="user">USER</option>
                              <option value="moderator">MODERATOR</option>
                              <option value="admin">ADMIN</option>
                              {currentUser.role === 'superadmin' && <option value="superadmin">SUPERADMIN</option>}
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[16px] ">expand_more</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <BottomNavBar />
    </>
  );
}
