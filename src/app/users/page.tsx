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
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-2">
             <span className="material-symbols-outlined text-primary text-3xl">manage_accounts</span>
             <h2 className="text-3xl font-bold leading-tight tracking-tight">Управление ролями</h2>
          </div>
          <p className="text-on-surface-variant text-sm">
            Поиск пользователей и изменение их уровня доступа в системе.
          </p>
        </section>

        {/* Поиск */}
        <div className="relative mb-8">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-semibold animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Таблица пользователей */}
        <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-outline-variant/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/10">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Пользователь</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Email</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Текущая роль</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant text-right">Действие</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-on-surface-variant italic">
                      Пользователи не найдены
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="border-b border-outline-variant/5 hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt="" className="w-8 h-8 rounded-full bg-surface-container-high" />
                          <span className="font-semibold text-sm">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                          u.role === 'moderator' ? 'bg-amber-100 text-amber-700' :
                          'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <select
                            value={u.role}
                            disabled={updatingId === u.id || (u.id === currentUser.id && u.role === 'superadmin')}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as User['role'])}
                            className="bg-surface-container-high text-xs font-bold py-2 px-3 rounded-lg border-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50"
                          >
                            <option value="user">USER</option>
                            <option value="moderator">MODERATOR</option>
                            <option value="admin">ADMIN</option>
                            {currentUser.role === 'superadmin' && <option value="superadmin">SUPERADMIN</option>}
                          </select>
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
