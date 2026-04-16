'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  updateMessage,
  toggleReaction, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ClubSettingsModal from '@/components/ClubSettingsModal';
import MarathonDetailsModal from '@/components/MarathonDetailsModal';
import MarathonModal from '@/components/MarathonModal';
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

// ===== Club Detail Component =====

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
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<string | null>(null);

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
      const newMsg = await sendMessage(clubId, user.id, messageText.trim());
      setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
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
      const newMsg = await sendMessage(clubId, user.id, null, url, isImage ? 'image' : 'file');
      setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
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

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      await toggleReaction(messageId, user.id, emoji);
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editValue.trim()) return;
    try {
      await updateMessage(editingMessageId, editValue.trim());
      setMessages(prev => prev.map(m => m.id === editingMessageId ? { ...m, text: editValue.trim(), isEdited: true } : m));
      setEditingMessageId(null);
    } catch(err) {
      console.error(err);
    }
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
                <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 ">
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
          <div className="border-t border-on-surface/5 bg-on-surface text-surface py-2.5">
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
              <div className="w-32 h-32 rounded-[48px] bg-surface-container flex items-center justify-center border border-on-surface/5 shadow-2xl rotate-3">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 ">key_visualizer</span>
              </div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-[20px] flex items-center justify-center shadow-2xl border border-on-surface/5">
                <span className="material-symbols-outlined text-on-surface text-2xl">lock</span>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tighter">Закрытый клуб</h2>
              <p className="text-on-surface-variant text-sm font-medium opacity-60 max-w-xs mx-auto  leading-relaxed">
                Этот чат доступен только проверенным участникам «{club.name}». Присоединяйтесь к нам!
              </p>
            </div>
            <button
              onClick={handleJoin}
              className="px-10 py-5 bg-on-surface text-surface rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-2xl shadow-on-surface/20"
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
                className="mb-12 bg-white rounded-[40px] p-10 border border-on-surface/5 shadow-sm cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-100 transition-opacity translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 duration-700">
                  <span className="material-symbols-outlined text-5xl ">arrow_outward</span>
                </div>
                
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-on-surface uppercase tracking-[0.4em] mb-2 block opacity-40 ">Текущий марафон</span>
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
                    <div key={label} className="flex-1 text-center py-4 bg-surface-container rounded-[24px] border border-on-surface/5">
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
              <span className="text-[9px] font-black uppercase tracking-[0.5em] ">Архив сообщений</span>
              <div className="h-[1px] flex-grow bg-on-surface"></div>
            </div>

            {/* Chat messages */}
            {messages.length === 0 && (
              <div className="text-center py-20 bg-surface">
                <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-6 opacity-30  font-black text-2xl">?</div>
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
                              className="w-10 h-10 rounded-[14px] object-cover shadow-sm border border-on-surface/5"
                              src={msg.senderAvatar}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-[14px] bg-surface-container flex items-center justify-center text-[11px] font-black  text-on-surface/20 border border-on-surface/5">
                              {(msg.senderName || '?').charAt(0).toUpperCase()}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && !isContinuous && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 opacity-40  ml-1">
                          {msg.senderName || 'Anonymous'}
                        </span>
                      )}
                      
                      <div
                        className={`group relative ${!msg.text && msg.fileType === 'image' ? '' : isMine ? 'bg-on-surface text-surface rounded-[24px] rounded-br-[4px] p-5 shadow-2xl shadow-on-surface/10' : 'bg-white text-on-surface rounded-[24px] rounded-bl-[4px] p-5 shadow-sm border border-on-surface/5'}`}
                      >
                        {/* Image message */}
                        {msg.fileType === 'image' && msg.fileUrl && (
                          <div 
                            className={`relative overflow-hidden cursor-zoom-in group/img ${!msg.text ? 'rounded-[16px] shadow-sm border border-on-surface/10' : 'rounded-[16px] mb-3 border border-on-surface/10'}`}
                            onClick={() => setExpandedImage(msg.fileUrl!)}
                          >
                            <img
                              src={msg.fileUrl}
                              alt="Attached image"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="material-symbols-outlined text-white">zoom_in</span>
                            </div>

                              className="w-[100px] h-[100px] object-cover transition-transform duration-500 hover:scale-105"
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
                                : 'bg-surface-container border-on-surface/5 hover:bg-surface-container-high'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">cloud_download</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Документ загружен</span>
                          </a>
                        )}

                        {/* Text */}
                        {msg.text && (
                          <p className="text-sm font-medium leading-relaxed ">{msg.text}</p>
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
                          <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-20 ">
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
            <div className="bg-white p-3 rounded-[32px] flex items-center gap-4 border border-on-surface/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] focus-within:shadow-[0_48px_80px_-20px_rgba(0,0,0,0.15)] transition-all">
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
        userId={user?.id || ''}
        activeMarathon={marathon}
        onMarathonChange={setMarathon}
      />
    </>
  );
}
