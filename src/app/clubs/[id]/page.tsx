'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ClubSettingsModal from '@/components/ClubSettingsModal';
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
      <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl shadow-sm shadow-black/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/clubs')}
              className="p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-base font-bold tracking-tight">{club.name}</h1>
              <span className="text-[10px] text-on-surface-variant font-medium">
                {club.memberCount} участников
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {membership && membership.role !== 'owner' && (
              <button
                onClick={handleLeave}
                className="p-2 rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                title="Покинуть клуб"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
              </button>
            )}
            {isOwnerOrAdmin && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Marathon Status Bar */}
        {marathon && countdown && (
          <div className="border-t border-outline-variant/10">
            <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">timer</span>
                <span className="text-xs font-semibold text-on-surface truncate max-w-[200px]">{marathon.title}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary font-[tabular-nums]">
                <span>{countdown.d}д</span>
                <span className="text-on-surface-variant/40">:</span>
                <span>{countdown.h}ч</span>
                <span className="text-on-surface-variant/40">:</span>
                <span>{countdown.m}м</span>
                <span className="text-on-surface-variant/40">:</span>
                <span>{String(countdown.s).padStart(2, '0')}с</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className={`${marathon && countdown ? 'pt-[7.5rem]' : 'pt-[4.5rem]'} pb-32 px-4 max-w-2xl mx-auto min-h-screen`}>
        {/* Not a member — join prompt */}
        {!membership && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">lock</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">Вступите в клуб</h2>
            <p className="text-sm text-on-surface-variant max-w-sm mb-8">
              Чтобы видеть сообщения и участвовать в обсуждениях, нужно стать участником клуба.
            </p>
            <button
              onClick={handleJoin}
              className="glass-action text-white px-8 py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/10 hover:scale-105 active:scale-95 transition-all"
            >
              Вступить в «{club.name}»
            </button>
          </div>
        )}

        {/* Member — Chat */}
        {membership && (
          <>
            {/* Marathon Widget (Expanded) */}
            {marathon && countdown && (
              <section className="mb-8 glass-marathon-widget rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] mb-1 block">Марафон активен</span>
                    <h2 className="text-lg font-bold tracking-tight">{marathon.title}</h2>
                  </div>
                  <span className="material-symbols-outlined text-primary text-2xl">timer</span>
                </div>
                <div className="flex gap-3 justify-center">
                  {[
                    { val: countdown.d, label: 'Дней' },
                    { val: countdown.h, label: 'Часов' },
                    { val: countdown.m, label: 'Минут' },
                    { val: countdown.s, label: 'Секунд' },
                  ].map(({ val, label }) => (
                    <div key={label} className="flex flex-col items-center">
                      <div className="countdown-digit">{String(val).padStart(2, '0')}</div>
                      <span className="countdown-label">{label}</span>
                    </div>
                  ))}
                </div>
                {/* Progress bar */}
                <div className="mt-5 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.max(
                        5,
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
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] flex-grow bg-outline-variant opacity-20"></div>
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Сегодня</span>
              <div className="h-[1px] flex-grow bg-outline-variant opacity-20"></div>
            </div>

            {/* Chat messages */}
            {messages.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 block mb-3">chat_bubble_outline</span>
                <p className="text-sm text-on-surface-variant">Пока нет сообщений. Начните обсуждение!</p>
              </div>
            )}

            <div className="space-y-6 mb-12">
              {messages.map((msg) => {
                const isMine = msg.userId === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-3 max-w-[85%] chat-bubble-enter ${
                      isMine ? 'flex-row-reverse ml-auto' : ''
                    }`}
                  >
                    {/* Avatar (only for others) */}
                    {!isMine && (
                      msg.senderAvatar ? (
                        <img
                          alt={msg.senderName || ''}
                          className="w-8 h-8 rounded-full mb-1 object-cover"
                          src={msg.senderAvatar}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-primary mb-1">
                          {(msg.senderName || '?').charAt(0).toUpperCase()}
                        </div>
                      )
                    )}

                    <div className={`flex flex-col ${isMine ? 'items-end' : ''}`}>
                      {!isMine && (
                        <span className="text-[10px] font-semibold text-on-surface-variant mb-1 ml-2">
                          {msg.senderName || 'Пользователь'}
                        </span>
                      )}
                      <div
                        className={
                          isMine
                            ? 'glass-bubble-user p-4 rounded-t-xl rounded-bl-xl border border-white/40 shadow-sm'
                            : 'bg-surface-container-lowest p-4 rounded-t-xl rounded-br-xl shadow-sm'
                        }
                      >
                        {/* Image message */}
                        {msg.fileType === 'image' && msg.fileUrl && (
                          <div className="rounded-lg overflow-hidden mb-2">
                            <img
                              src={msg.fileUrl}
                              alt="Изображение"
                              className="max-w-full max-h-64 object-cover rounded-lg"
                            />
                          </div>
                        )}

                        {/* File message */}
                        {msg.fileType === 'file' && msg.fileUrl && (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-lg hover:bg-surface-container-high transition-colors mb-2"
                          >
                            <span className="material-symbols-outlined text-primary text-lg">attach_file</span>
                            <span className="text-sm font-medium text-primary truncate">Скачать файл</span>
                          </a>
                        )}

                        {/* Text */}
                        {msg.text && (
                          <p className="text-sm text-on-surface leading-relaxed">{msg.text}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 mt-1 mx-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] font-medium text-outline-variant">
                          {formatTime(msg.createdAt)}
                        </span>
                        {(isMine || isOwnerOrAdmin) && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="text-[10px] font-bold text-error/40 hover:text-error transition-colors"
                          >
                            Удалить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          </>
        )}
      </main>

      {/* Chat Input Bar */}
      {membership && (
        <div className="fixed bottom-0 left-0 w-full z-50">
          <div className="max-w-2xl mx-auto px-4 pb-8 pt-4">
            <div className="glass-input p-2 rounded-2xl flex items-center gap-2 border border-white/40 shadow-xl shadow-black/5">
              {/* File upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-10 h-10 flex items-center justify-center text-primary hover:bg-white/40 rounded-xl transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined">
                  {uploading ? 'hourglass_empty' : 'add_circle'}
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
                className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 text-sm placeholder:text-on-surface-variant/60"
                placeholder="Напишите сообщение..."
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
                className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-md hover:bg-primary-dim transition-all active:scale-90 disabled:opacity-40"
              >
                <span className="material-symbols-outlined">send</span>
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
    </>
  );
}
