'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const { login, loginWithGoogle, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          setError(authError.message === 'Invalid login credentials'
            ? 'Неверный email или пароль'
            : authError.message);
        } else {
          router.push('/');
        }
      } else {
        if (!name.trim()) {
          setError('Введите имя');
          setLoading(false);
          return;
        }
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (authError) {
          setError(authError.message);
        } else {
          setInfo('Проверьте вашу почту — мы отправили ссылку для подтверждения.');
        }
      }
    } catch {
      setError('Произошла ошибка. Попробуйте снова.');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    const success = await loginWithGoogle();
    if (!success) {
      setError('Не удалось начать вход через Google.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-surface overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-on-surface opacity-5"></div>
      <div className="w-full max-w-sm space-y-8 py-10 md:py-20">
        {/* Logo Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-on-surface text-surface rounded-2xl shadow-xl mb-1">
            <span className="text-2xl font-black italic">K</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface leading-tight uppercase">Киндер</h1>
          <p className="text-on-surface-variant text-[9px] font-black uppercase tracking-[0.4em] opacity-40">
            Сообщество ценителей кино и литературы
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-surface rounded-[40px] p-10 shadow-2xl border border-on-surface/5 space-y-8">
          <h2 className="text-2xl font-black text-center text-on-surface tracking-tight">
            {mode === 'login' ? 'С возвращением' : 'Новый аккаунт'}
          </h2>

          {/* Google Login */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-4 px-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-all flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest disabled:opacity-50 border border-on-surface/5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Войти через Google
          </button>

          <div className="flex items-center gap-6">
            <div className="flex-1 h-px bg-on-surface/5"></div>
            <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-[0.3em] opacity-40">или</span>
            <div className="flex-1 h-px bg-on-surface/5"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-60 px-1">
                  Имя
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full px-5 py-4 rounded-2xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-on-surface/5 transition-all text-sm font-medium border border-on-surface/5 shadow-inner"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-60 px-1">
                Электронная почта
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="w-full px-5 py-4 rounded-2xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-on-surface/5 transition-all text-sm font-medium border border-on-surface/5 shadow-inner"
              />
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-60 px-1">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-5 py-4 rounded-2xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-on-surface/5 transition-all text-sm font-medium border border-on-surface/5 shadow-inner"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 font-black uppercase tracking-widest bg-red-50 px-4 py-3 rounded-2xl border border-red-100">
                {error}
              </p>
            )}

            {info && (
              <p className="text-xs text-green-600 font-black uppercase tracking-widest bg-green-50 px-4 py-3 rounded-2xl border border-green-100">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-on-surface text-surface rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 shadow-2xl shadow-on-surface/20"
            >
              {loading ? 'Загрузка...' : mode === 'login' ? 'Войти в систему' : 'Создать аккаунт'}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm font-medium text-on-surface-variant">
              {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setInfo(''); }}
                className="ml-2 text-on-surface font-black hover:underline decoration-2 underline-offset-4"
              >
                {mode === 'login' ? 'Зарегистрироваться' : 'Войти в систему'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
