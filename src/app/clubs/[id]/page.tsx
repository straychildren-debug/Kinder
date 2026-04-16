'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ClubSettingsModal from '@/components/ClubSettingsModal';
import MarathonDetailsModal from '@/components/MarathonDetailsModal';
import { Club, ClubMessage, ClubMarathon, ClubMember } from '@/lib/types';
import {
  getClubById,
  getClubMessages,
  sendMessage,
  getActiveMarathon,
  getUserMembership,
  joinClub,
  leaveClub,
  uploadClubFile,
  deleteMessage,
  updateLastReadAt,
} from '@/lib/db';
import { supabase } from '@/lib/supabase';

// ===== Countdown Hook =====
function useCountdown(endsAt: string | null) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!endsAt) {
      setTimeLeft(null);
      return;
    }

    const calc = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) return null;
      return {
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / (1000 * 60)) % 60),
        s: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calc());
    const interval = setInterval(() => {
      const result = calc();
      setTimeLeft(result);
      if (!result) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  return timeLeft;
}

export default function MarathonModal({
  isOpen,
  onClose,
  clubId,
  userId,
  activeMarathon,
  onMarathonChange,
}: any) {
  const [title, setTitle] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [items, setItems] = useState<{contentId: string, title: string}[]>([]);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableContent, setAvailableContent] = useState<any[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      // Mocking getApprovedContent for structure
      setAvailableContent([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !endsAt) {
      setError('Заполните все поля');
      return;
    }

    const endDate = new Date(endsAt);
    if (endDate <= new Date()) {
      setError('Дата окончания должна быть в будущем');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Mocking createMarathon
      onMarathonChange({ id: 'new', title, endsAt: endDate.toISOString() });
      setTitle('');
      setEndsAt('');
      setItems([]);
      onClose();
    } catch {
      setError('Не удалось создать марафон');
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!activeMarathon) return;
    setLoading(true);
    try {
      onMarathonChange(null);
      onClose();
    } catch {
      setError('Не удалось завершить марафон');
    } finally {
      setLoading(false);
    }
  };

  const getPreviewTime = () => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    return { d, h, m };
  };

  const preview = getPreviewTime();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-white/20 backdrop-blur-3xl" onClick={onClose}>
      <div
        className="bg-white rounded-[40px] p-10 w-full max-w-xl shadow-[0_64px_128px_-16px_rgba(0,0,0,0.2)] max-h-[85vh] overflow-y-auto border border-black/5 animate-in zoom-in-95 fade-in duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-12">
          <div>
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.4em] block mb-2 opacity-40 italic">Событие клуба</span>
            <h2 className="text-4xl font-black tracking-tighter leading-none">Марафон</h2>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center hover:bg-on-surface hover:text-surface transition-all active:scale-90">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {activeMarathon && (
          <div className="mb-12 p-8 rounded-[32px] bg-white border border-black/5 shadow-sm space-y-6 group hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-500 text-[20px]">timer</span>
              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Активный поток</span>
            </div>
            <h3 className="text-xl font-black mb-1">{activeMarathon.title}</h3>
            <p className="text-xs text-on-surface-variant/40 font-black uppercase tracking-widest italic">
              До {new Date(activeMarathon.endsAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <button
              onClick={handleEnd}
              disabled={loading}
              className="mt-2 w-full px-6 py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Завершаем...' : 'Завершить марафон'}
            </button>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-10">
          <div>
            <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-8 opacity-40 italic">
              {activeMarathon ? 'Настройка нового' : 'Новое соревнование'}
            </h3>

            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-30">Заголовок марафона</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Осень с Оруэллом"
                  className="w-full px-6 py-4 rounded-2xl bg-surface-container/30 border border-transparent text-sm font-black focus:outline-none focus:bg-white focus:border-black/5 focus:shadow-sm transition-all placeholder:text-on-surface-variant/20 italic"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-30">Выбор контента</label>
                <div className="flex gap-3 mb-3">
                  <select
                    value={selectedContentId}
                    onChange={(e) => setSelectedContentId(e.target.value)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-surface-container/30 border border-transparent text-sm font-black focus:outline-none focus:bg-white focus:border-black/5 focus:shadow-sm transition-all text-on-surface appearance-none cursor-pointer italic"
                  >
                    <option value="" className="font-sans not-italic">Выбрать из библиотеки...</option>
                    {availableContent.map((c: any) => (
                      <option key={c.id} value={c.id} className="font-sans not-italic">
                        {c.type === 'movie' ? '🎬' : '📚'} {c.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedContentId) {
                        const selected = availableContent.find(c => c.id === selectedContentId);
                        if (selected && !items.find(i => i.contentId === selected.id)) {
                          setItems([...items, { contentId: selected.id, title: selected.title }]);
                        }
                        setSelectedContentId('');
                      }
                    }}
                    disabled={!selectedContentId}
                    className="w-14 h-14 bg-on-surface text-surface rounded-2xl flex items-center justify-center hover:scale-105 active:scale-90 transition-all disabled:opacity-50 shadow-xl shadow-black/10"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                
                {items.length > 0 && (
                  <div className="flex flex-col gap-3 mt-6">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-black/5 shadow-sm group/item">
                        <span className="text-sm font-black tracking-tighter truncate italic">{item.title}</span>
                        <button
                          type="button"
                          onClick={() => setItems(items.filter((_, i) => i !== idx))}
                          className="w-8 h-8 rounded-lg text-on-surface-variant/20 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center group-hover/item:opacity-100"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-30">Финишная черта</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-surface-container/30 border border-transparent text-sm font-black focus:outline-none focus:bg-white focus:border-black/5 focus:shadow-sm transition-all cursor-pointer italic appearance-none"
                />
              </div>

              {preview && (
                <div className="p-8 rounded-[32px] bg-surface-container/20 border border-black/5 space-y-6">
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.3em] block mb-2 opacity-40 italic text-center">Виджет времени</span>
                  <div className="flex gap-6 justify-center">
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-black tracking-tighter">{preview.d}</div>
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Дней</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-black tracking-tighter">{preview.h}</div>
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Часов</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-3xl font-black tracking-tighter">{preview.m}</div>
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Минут</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-on-surface text-surface py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Синхронизация...' : 'Запустить марафон'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ClubDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const clubId = params?.id as string;

  const [club, setClub] = useState<Club | null>(null);
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [marathon, setMarathon] = useState<ClubMarathon | null>(null);
  const [membership, setMembership] = useState<ClubMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMarathonDetails, setShowMarathonDetails] = useState(false);
  const [showMarathonModal, setShowMarathonModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const countdown = useCountdown(marathon?.endsAt ?? null);

  // Load club data
  useEffect(() => {
    if (!clubId) return;

    const load = async () => {
      setLoading(true);
      const [clubData, marathonData] = await Promise.all([
        getClubById(clubId),
        getActiveMarathon(clubId),
      ]);

      if (!clubData) {
        router.push('/clubs');
        return;
      }

      setClub(clubData);
      setMarathon(marathonData);

      if (user) {
        const mem = await getUserMembership(clubId, user.id);
        setMembership(mem);

        if (mem) {
          const msgs = await getClubMessages(clubId);
          setMessages(msgs);
          // Mark as read when entering
          updateLastReadAt(clubId, user.id);
        }
      }

      setLoading(false);
    };

    load();
  }, [clubId, user]);

  // Realtime subscription
  useEffect(() => {
    if (!clubId || !membership) return;

    const channel = supabase
      .channel(`club-${clubId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'club_messages',
          filter: `club_id=eq.${clubId}`,
        },
        async (payload) => {
          // Fetch the full message with profile info
          const { data } = await supabase
            .from('club_messages')
            .select('*, profiles:user_id(name, avatar_url)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const newMsg: ClubMessage = {
              id: data.id,
              clubId: data.club_id,
              userId: data.user_id,
              text: data.text,
              fileUrl: data.file_url,
              fileType: data.file_type,
              createdAt: data.created_at,
              senderName: (data as any).profiles?.name,
              senderAvatar: (data as any).profiles?.avatar_url,
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            // Mark as read if user is active in chat
            if (user?.id) {
              updateLastReadAt(clubId, user.id);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'club_messages',
          filter: `club_id=eq.${clubId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId, membership]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!user || !membership || (!messageText.trim())) return;
    setSending(true);
    try {
      await sendMessage(clubId, user.id, messageText.trim());
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  }, [messageText, user, membership, clubId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !membership) return;

    setUploading(true);
    try {
      const url = await uploadClubFile(file);
      const isImage = file.type.startsWith('image/');
      await sendMessage(clubId, user.id, null, url, isImage ? 'image' : 'file');
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleJoin = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await joinClub(clubId, user.id);
      const mem = await getUserMembership(clubId, user.id);
      setMembership(mem);
      const msgs = await getClubMessages(clubId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to join club:', err);
    }
  };

  const handleLeave = async () => {
    if (!user || !membership) return;
    if (membership.role === 'owner') return; // Owner can't leave
    if (!confirm('Покинуть клуб?')) return;
    try {
      await leaveClub(clubId, user.id);
      setMembership(null);
      setMessages([]);
    } catch (err) {
      console.error('Failed to leave club:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Удалить это сообщение?')) return;
    try {
      await deleteMessage(messageId);
      // Local update will be handled by Realtime DELETE event
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const isOwnerOrAdmin = membership?.role === 'owner' || membership?.role === 'admin';
  const isGlobalManager = user?.role === 'admin' || user?.role === 'superadmin';
  const canDeleteMessages = isOwnerOrAdmin || isGlobalManager;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!club) return null;

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/clubs')}
              className="p-2 rounded-xl hover:bg-surface-container transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="space-y-0.5">
              <h1 className="text-xl font-black tracking-tighter leading-none">{club.name}</h1>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 italic">
                  {club.memberCount} участников
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {membership && membership.role !== 'owner' && (
              <button
                onClick={handleLeave}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-50 text-on-surface-variant hover:text-red-500 transition-all active:scale-95"
                title="Покинуть клуб"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            )}
            {isOwnerOrAdmin && (
              <button
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-surface-container transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">settings_heart</span>
              </button>
            )}
          </div>
        </div>

        {/* Marathon Status Bar */}
        {marathon && countdown && (
          <div className="border-t border-black/5 bg-on-surface text-surface py-2.5">
            <div className="max-w-2xl mx-auto px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] truncate max-w-[150px]">{marathon.title}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black font-[tabular-nums] tracking-widest">
                <span>{countdown.d}D</span>
                <span className="opacity-30">:</span>
                <span>{countdown.h}H</span>
                <span className="opacity-30">:</span>
                <span>{countdown.m}M</span>
                <span className="opacity-30">:</span>
                <span>{String(countdown.s).padStart(2, '0')}S</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className={`${marathon && countdown ? 'pt-[8rem]' : 'pt-[5rem]'} pb-32 px-6 max-w-2xl mx-auto min-h-screen bg-surface`}>
        {/* Not a member — join prompt */}
        {!membership && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-[48px] bg-surface-container flex items-center justify-center border border-black/5 shadow-2xl rotate-3">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 italic">key_visualizer</span>
              </div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-[20px] flex items-center justify-center shadow-2xl border border-black/5">
                <span className="material-symbols-outlined text-on-surface text-2xl">lock</span>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tighter">Закрытый клуб</h2>
              <p className="text-on-surface-variant text-sm font-medium opacity-60 max-w-xs mx-auto italic leading-relaxed">
                Этот чат доступен только проверенным участникам «{club.name}». Присоединяйтесь к нам!
              </p>
            </div>
            <button
              onClick={handleJoin}
              className="px-10 py-5 bg-on-surface text-surface rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-2xl shadow-black/20"
            >
              Вступить в клуб
            </button>
          </div>
        )}

        {/* Member — Chat */}
        {membership && (
          <>
            {/* Marathon Widget (Expanded) */}
            {marathon && countdown && (
              <section 
                onClick={() => setShowMarathonDetails(true)}
                className="mb-12 bg-white rounded-[40px] p-10 border border-black/5 shadow-sm cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-100 transition-opacity translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 duration-700">
                  <span className="material-symbols-outlined text-5xl italic">arrow_outward</span>
                </div>
                
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-on-surface uppercase tracking-[0.4em] mb-2 block opacity-40 italic">Текущий марафон</span>
                    <h2 className="text-3xl font-black tracking-tighter leading-none">{marathon.title}</h2>
                  </div>
                </div>

                <div className="flex gap-4 justify-between relative z-10">
                  {[
                    { val: countdown.d, label: 'D' },
                    { val: countdown.h, label: 'H' },
                    { val: countdown.m, label: 'M' },
                    { val: countdown.s, label: 'S' },
                  ].map(({ val, label }) => (
                    <div key={label} className="flex-1 text-center py-4 bg-surface-container rounded-[24px] border border-black/5">
                      <div className="text-2xl font-black tracking-tighter leading-none">{String(val).padStart(2, '0')}</div>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1 block">{label}</span>
                    </div>
                  ))}
                </div>
                
                {/* Progress bar */}
                <div className="mt-8 h-1 bg-surface-container rounded-full overflow-hidden relative z-10">
                  <div
                    className="h-full bg-on-surface transition-all duration-1000"
                    style={{
                      width: `${Math.max(
                        2,
                        Math.min(
                          100,
                          100 - ((new Date(marathon.endsAt).getTime() - Date.now()) / (new Date(marathon.endsAt).getTime() - new Date(marathon.createdAt).getTime())) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </section>
            )}

            {/* Date Divider */}
            <div className="flex items-center gap-6 mb-12 opacity-20">
              <div className="h-[1px] flex-grow bg-on-surface"></div>
              <span className="text-[9px] font-black uppercase tracking-[0.5em] italic">Архив сообщений</span>
              <div className="h-[1px] flex-grow bg-on-surface"></div>
            </div>

            {/* Chat messages */}
            {messages.length === 0 && (
              <div className="text-center py-20 bg-surface">
                <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-6 opacity-30 italic font-black text-2xl">?</div>
                <p className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">Чат пуст. Напишите первым.</p>
              </div>
            )}

            <div className="space-y-8 mb-20">
              {messages.map((msg, index) => {
                const isMine = msg.userId === user?.id;
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const isContinuous = prevMsg?.userId === msg.userId;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-3 max-w-[90%] md:max-w-[75%] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[${index * 50}ms] ${
                      isMine ? 'flex-row-reverse ml-auto' : ''
                    } ${isContinuous ? 'mt-1' : 'mt-8'}`}
                  >
                    {/* Avatar (only for others and only for the first message in a chain) */}
                    {!isMine && (
                      <div className="w-10 overflow-hidden shrink-0">
                        {!isContinuous && (
                          msg.senderAvatar ? (
                            <img
                              alt={msg.senderName || ''}
                              className="w-10 h-10 rounded-[14px] object-cover shadow-sm border border-black/5"
                              src={msg.senderAvatar}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-[14px] bg-surface-container flex items-center justify-center text-[11px] font-black italic text-on-surface/20 border border-black/5">
                              {(msg.senderName || '?').charAt(0).toUpperCase()}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && !isContinuous && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 opacity-40 italic ml-1">
                          {msg.senderName || 'Anonymous'}
                        </span>
                      )}
                      
                      <div
                        className={`group relative ${
                          isMine
                            ? 'bg-on-surface text-surface rounded-[24px] rounded-br-[4px] p-5 shadow-2xl shadow-black/10'
                            : 'bg-white text-on-surface rounded-[24px] rounded-bl-[4px] p-5 shadow-sm border border-black/5'
                        }`}
                      >
                        {/* Image message */}
                        {msg.fileType === 'image' && msg.fileUrl && (
                          <div className="rounded-[16px] overflow-hidden mb-3 border border-black/10">
                            <img
                              src={msg.fileUrl}
                              alt="Attached image"
                              className="max-w-full max-h-[400px] object-cover grayscale brightness-90 hover:grayscale-0 transition-all duration-700 cursor-zoom-in"
                            />
                          </div>
                        )}

                        {/* File message */}
                        {msg.fileType === 'file' && msg.fileUrl && (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-3 transition-all border ${
                              isMine 
                                ? 'bg-surface/10 border-surface/10 hover:bg-surface/20 text-white' 
                                : 'bg-surface-container border-black/5 hover:bg-surface-container-high'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">cloud_download</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Документ загружен</span>
                          </a>
                        )}

                        {/* Text */}
                        {msg.text && (
                          <p className="text-sm font-medium leading-relaxed italic">{msg.text}</p>
                        )}
                        
                        {/* Delete button (only for mine or managers, and only on hover) */}
                        {(isMine || canDeleteMessages) && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className={`absolute top-0 ${isMine ? '-left-10' : '-right-10'} opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-2 text-on-surface-variant`}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                          </button>
                        )}
                      </div>
                      
                      {!isContinuous && (
                        <div className={`flex items-center gap-2 mt-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-20 italic">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} className="h-4" />
            </div>
          </>
        )}
      </main>

      {/* Chat Input Bar */}
      {membership && (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-t from-surface via-surface/80 to-transparent pt-10 pb-10">
          <div className="max-w-2xl mx-auto px-6">
            <div className="bg-white p-3 rounded-[32px] flex items-center gap-4 border border-black/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] focus-within:shadow-[0_48px_80px_-20px_rgba(0,0,0,0.15)] transition-all">
              {/* File upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-12 h-12 flex items-center justify-center text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container rounded-2xl transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[24px]">
                  {uploading ? 'sync' : 'attach_file_add'}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Text input */}
              <input
                className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-medium placeholder:text-on-surface-variant/20 tracking-tight"
                placeholder="Ваше сообщение в бесконечность..."
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
              />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={sending || !messageText.trim()}
                className="w-12 h-12 flex items-center justify-center bg-on-surface text-surface rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-5 disabled:scale-100"
              >
                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isOwnerOrAdmin && (
        <ClubSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          clubId={clubId}
          userId={user!.id}
          userRole={membership!.role}
          activeMarathon={marathon}
          onMarathonChange={setMarathon}
        />
      )}

      {/* Marathon Details Modal */}
      {marathon && user && (
        <MarathonDetailsModal
          isOpen={showMarathonDetails}
          onClose={() => setShowMarathonDetails(false)}
          marathon={marathon}
          userId={user.id}
        />
      )}

      {/* Marathon sub-modal */}
      <MarathonModal
        isOpen={showMarathonModal}
        onClose={() => setShowMarathonModal(false)}
        clubId={clubId}
        userId={user?.id}
        activeMarathon={marathon}
        onMarathonChange={setMarathon}
      />
    </>
  );
}
