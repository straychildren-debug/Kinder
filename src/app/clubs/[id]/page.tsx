'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ClubSettingsModal from '@/components/ClubSettingsModal';
import MarathonDetailsModal from '@/components/MarathonDetailsModal';
import MarathonModal from '@/components/MarathonModal';
import ClubEventsModal from '@/components/ClubEventsModal';
import VoiceWaveform from '@/components/VoiceWaveform';
import { Club, ClubMessage, ClubMarathon, ClubMember, PinnedMessage, ClubPoll, ClubPollOption } from '@/lib/types';
import {
  getClubById,
  getClubMessages,
  sendMessage,
  updateMessage,
  toggleReaction,
  getActiveMarathon,
  getUserMembership,
  joinClub,
  leaveClub,
  uploadClubFile,
  deleteMessage,
  updateLastReadAt,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  getPinnedMessageIds,
  createPoll,
  getClubPolls,
  votePoll,
  unvotePoll,
  closePoll,
  searchMessages,
  uploadVoiceMessage,
  sendVoiceMessage,
  searchClubMembers,
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

// ===== Poll Card Component =====
function PollCard({ 
  poll, 
  userId, 
  onVote, 
  onClose, 
  canManage 
}: { 
  poll: ClubPoll; 
  userId: string; 
  onVote: (pollId: string, optionId: string, voted: boolean) => void;
  onClose: (pollId: string) => void;
  canManage: boolean;
}) {
  const hasVoted = poll.options?.some(o => o.votedByMe) || false;
  const showResults = hasVoted || !poll.isActive;

  return (
    <div className="glass-panel rounded-[28px] p-6 my-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>ballot</span>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60">Опрос</span>
        </div>
        {!poll.isActive && (
          <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 bg-surface-container px-3 py-1 rounded-full">Завершён</span>
        )}
        {canManage && poll.isActive && (
          <button onClick={() => onClose(poll.id)} className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors">
            Закрыть
          </button>
        )}
      </div>

      <h3 className="text-lg font-black tracking-tight mb-5 leading-snug">{poll.question}</h3>

      <div className="space-y-2.5">
        {poll.options?.map((opt) => {
          const pct = poll.totalVotes ? Math.round((opt.voteCount! / poll.totalVotes) * 100) : 0;
          return (
            <button
              key={opt.id}
              onClick={() => poll.isActive && onVote(poll.id, opt.id, !!opt.votedByMe)}
              disabled={!poll.isActive}
              className={`w-full text-left rounded-2xl p-4 transition-all relative overflow-hidden group ${
                opt.votedByMe 
                  ? 'bg-primary/20 border-2 border-primary/30' 
                  : 'bg-white/10 border-2 border-transparent hover:border-white/20'
              } ${!poll.isActive ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
            >
              {showResults && (
                <div
                  className="absolute inset-y-0 left-0 bg-primary/[0.06] transition-all duration-700 ease-out rounded-2xl"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    opt.votedByMe ? 'border-primary bg-primary' : 'border-on-surface/20'
                  }`}>
                    {opt.votedByMe && (
                      <span className="material-symbols-outlined text-white text-[12px]">check</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold">{opt.text}</span>
                </div>
                {showResults && (
                  <span className="text-xs font-black text-on-surface-variant/50">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-on-surface/5">
        <span className="text-[10px] font-bold text-on-surface-variant/40">
          {poll.totalVotes} {poll.totalVotes === 1 ? 'голос' : 'голосов'}
        </span>
        <span className="text-[10px] font-bold text-on-surface-variant/30">
          {poll.creatorName}
        </span>
      </div>
    </div>
  );
}

// ===== Create Poll Modal =====
function CreatePollModal({ isOpen, onClose, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string, options: string[], isAnonymous: boolean, isMultiple: boolean) => void;
}) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isMultiple, setIsMultiple] = useState(false);

  if (!isOpen) return null;

  const addOption = () => setOptions(prev => [...prev, '']);
  const removeOption = (i: number) => setOptions(prev => prev.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) => setOptions(prev => prev.map((v, idx) => idx === i ? val : v));

  const canSubmit = question.trim() && options.filter(o => o.trim()).length >= 2;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(question.trim(), options.filter(o => o.trim()), isAnonymous, isMultiple);
    setQuestion('');
    setOptions(['', '']);
    setIsAnonymous(false);
    setIsMultiple(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] glass-modal-overlay flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="glass-modal rounded-[32px] w-full max-w-md p-8 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black tracking-tight">Новый опрос</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-2 block">Вопрос</label>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Какую книгу читаем следующей?"
              className="w-full px-5 py-4 rounded-2xl bg-surface-container border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-2 block">Варианты ответов</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Вариант ${i + 1}`}
                    className="flex-1 px-4 py-3 rounded-xl bg-surface-container border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(i)} className="p-2 text-on-surface-variant/30 hover:text-red-400 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 8 && (
              <button onClick={addOption} className="mt-2 text-[11px] font-bold text-primary/60 hover:text-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">add</span>Добавить вариант
              </button>
            )}
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isMultiple} onChange={e => setIsMultiple(e.target.checked)} className="rounded" />
              <span className="text-xs font-medium text-on-surface-variant">Несколько ответов</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full mt-6 py-4 bg-on-surface text-surface rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] disabled:opacity-30 transition-all active:scale-[0.98]"
        >
          Создать опрос
        </button>
      </div>
    </div>
  );
}

// ===== Pinned Messages Panel =====
function PinnedMessagesPanel({ pins, onClose, onUnpin, canManage }: {
  pins: PinnedMessage[];
  onClose: () => void;
  onUnpin: (messageId: string) => void;
  canManage: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] glass-modal-overlay flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="glass-modal rounded-[32px] w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-4 border-b border-on-surface/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
            <h2 className="text-lg font-black tracking-tight">Закреплённые</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="overflow-y-auto p-6 pt-4 space-y-3">
          {pins.length === 0 && (
            <p className="text-center text-on-surface-variant/40 text-sm font-medium py-8">Нет закреплённых сообщений</p>
          )}
          {pins.map(pin => (
            <div key={pin.id} className="bg-surface-container rounded-2xl p-4 group">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 block mb-1">
                    {pin.message?.senderName || 'User'}
                  </span>
                  <p className="text-sm font-medium text-on-surface truncate">{pin.message?.text || '📎 Файл'}</p>
                  <span className="text-[9px] font-bold text-on-surface-variant/30 mt-1 block">
                    {pin.message?.createdAt ? new Date(pin.message.createdAt).toLocaleDateString('ru-RU') : ''}
                  </span>
                </div>
                {canManage && (
                  <button onClick={() => onUnpin(pin.messageId)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 transition-all">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== Search Panel =====
function SearchPanel({ clubId, onClose, onScrollTo }: {
  clubId: string;
  onClose: () => void;
  onScrollTo: (msgId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClubMessage[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const r = await searchMessages(clubId, q);
      setResults(r);
    } catch { setResults([]); }
    setSearching(false);
  }, [clubId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  return (
    <div className="fixed inset-0 z-[100] glass-modal-overlay flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="glass-modal rounded-[28px] w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 border border-white/10">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-[20px]">search</span>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск по сообщениям..."
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 py-4 text-sm font-medium placeholder:text-on-surface-variant/30"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-on-surface-variant/30 hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>

        {(results.length > 0 || searching) && (
          <div className="max-h-[50vh] overflow-y-auto px-5 pb-5 space-y-1">
            {searching && (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
            {!searching && results.map(msg => (
              <button
                key={msg.id}
                onClick={() => { onScrollTo(msg.id); onClose(); }}
                className="w-full text-left p-3 rounded-xl hover:bg-surface-container transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/50">{msg.senderName}</span>
                  <span className="text-[9px] text-on-surface-variant/30 font-bold">{formatDate(msg.createdAt)}</span>
                </div>
                <p className="text-sm text-on-surface truncate font-medium">{msg.text}</p>
              </button>
            ))}
            {!searching && query && results.length === 0 && (
              <p className="text-center text-on-surface-variant/40 text-sm font-medium py-6">Ничего не найдено</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Mentions Popup =====
function MentionsPopup({ members, onSelect, position }: {
  members: ClubMember[];
  onSelect: (name: string) => void;
  position: { top: number; left: number };
}) {
  if (members.length === 0) return null;

  return (
    <div
      className="absolute z-50 glass-panel rounded-2xl py-2 min-w-[200px] max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ bottom: '100%', left: 0, marginBottom: '8px' }}
    >
      {members.map(m => (
        <button
          key={m.userId}
          onClick={() => onSelect(m.userName || '')}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container transition-all text-left"
        >
          {m.userAvatar ? (
            <Image src={m.userAvatar} width={28} height={28} unoptimized className="w-7 h-7 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-[10px] font-black">
              {(m.userName || '?')[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm font-semibold">{m.userName || 'User'}</span>
          <span className="text-[9px] font-bold text-on-surface-variant/30 uppercase ml-auto">{m.role}</span>
        </button>
      ))}
    </div>
  );
}

// ===== Helper: render text with @mentions highlighted =====
function renderTextWithMentions(text: string, isMine: boolean) {
  const parts = text.split(/(@\S+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className={`font-black ${isMine ? 'text-blue-200' : 'text-primary'} cursor-pointer hover:underline`}>
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ===== Club Detail Component =====

export default function ClubDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const clubId = params?.id as string;

  // Core state
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
  const [replyingTo, setReplyingTo] = useState<ClubMessage | null>(null);

  // New feature state
  const [pinnedMessageIds, setPinnedMessageIds] = useState<Set<string>>(new Set());
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [polls, setPolls] = useState<ClubPoll[]>([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<ClubMember[]>([]);
  const [contextMenuMsg, setContextMenuMsg] = useState<string | null>(null);
  const [showEventsModal, setShowEventsModal] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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
          const [msgs, pinIds, pollsData] = await Promise.all([
            getClubMessages(clubId),
            getPinnedMessageIds(clubId),
            getClubPolls(clubId, user.id),
          ]);
          setMessages(msgs);
          setPinnedMessageIds(pinIds);
          setPolls(pollsData);
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
          const { data } = await supabase
            .from('club_messages')
            .select('*, profiles:user_id(name, avatar_url), parent:reply_to_id(text, parent_profiles:user_id(name))')
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
              voiceDurationSeconds: data.voice_duration_seconds,
              createdAt: data.created_at,
              senderName: (data as any).profiles?.name,
              senderAvatar: (data as any).profiles?.avatar_url,
              replyToId: data.reply_to_id,
              repliedMessage: (data as any).parent ? {
                text: (data as any).parent.text,
                senderName: (data as any).parent.parent_profiles?.name || 'User'
              } : null,
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

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

  // Typing indicator - Realtime Presence
  useEffect(() => {
    if (!clubId || !membership || !user) return;

    const presenceChannel = supabase.channel(`typing-${clubId}`, {
      config: { presence: { key: user.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typingNames: string[] = [];
        Object.entries(state).forEach(([uid, presences]) => {
          if (uid !== user.id) {
            const p = presences as any[];
            if (p?.[0]?.typing) {
              typingNames.push(p[0].name || 'Кто-то');
            }
          }
        });
        setTypingUsers(typingNames);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ typing: false, name: user.name || 'User' });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [clubId, membership, user]);

  // Broadcast typing state
  const broadcastTyping = useCallback(() => {
    if (!clubId || !user) return;
    const channel = supabase.channel(`typing-${clubId}`);
    channel.track({ typing: true, name: user.name || 'User' });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channel.track({ typing: false, name: user.name || 'User' });
    }, 2000);
  }, [clubId, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!user || !membership || (!messageText.trim())) return;
    setSending(true);
    try {
      const newMsg = await sendMessage(clubId, user.id, messageText.trim(), null, null, replyingTo?.id);
      setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      setMessageText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  }, [messageText, user, membership, clubId, replyingTo]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageText(val);
    broadcastTyping();

    // @mentions detection
    const lastAtIndex = val.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = val.substring(lastAtIndex + 1);
      if (!afterAt.includes(' ')) {
        setMentionQuery(afterAt);
        searchClubMembers(clubId, afterAt).then(setMentionResults);
        return;
      }
    }
    setMentionQuery(null);
    setMentionResults([]);
  };

  const handleMentionSelect = (name: string) => {
    if (mentionQuery === null) return;
    const lastAtIndex = messageText.lastIndexOf('@');
    const newText = messageText.substring(0, lastAtIndex) + `@${name} `;
    setMessageText(newText);
    setMentionQuery(null);
    setMentionResults([]);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !membership) return;

    setUploading(true);
    try {
      const url = await uploadClubFile(file);
      const isImage = file.type.startsWith('image/');
      const newMsg = await sendMessage(clubId, user.id, null, url, isImage ? 'image' : 'file', replyingTo?.id);
      setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Mic access denied:', err);
      alert('Нет доступа к микрофону');
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !user) return;

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const duration = recordingTime;

        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        setIsRecording(false);
        setRecordingTime(0);

        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());

        if (duration < 1) { resolve(); return; } // Too short

        try {
          const { url } = await uploadVoiceMessage(blob, duration);
          const newMsg = await sendVoiceMessage(clubId, user!.id, url, duration, replyingTo?.id);
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
          setReplyingTo(null);
        } catch (err) {
          console.error('Failed to send voice:', err);
        }
        resolve();
      };

      mediaRecorderRef.current!.stop();
    });
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    recordedChunksRef.current = [];
  };

  const handleJoin = async () => {
    if (!user) { router.push('/login'); return; }
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
    if (membership.role === 'owner') return;
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
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Pin/Unpin
  const handlePinMessage = async (messageId: string) => {
    if (!user) return;
    try {
      if (pinnedMessageIds.has(messageId)) {
        await unpinMessage(clubId, messageId);
        setPinnedMessageIds(prev => { const s = new Set(prev); s.delete(messageId); return s; });
      } else {
        await pinMessage(clubId, messageId, user.id);
        setPinnedMessageIds(prev => new Set(prev).add(messageId));
      }
    } catch (err) {
      console.error('Failed to pin/unpin:', err);
    }
    setContextMenuMsg(null);
  };

  const openPinnedPanel = async () => {
    const pins = await getPinnedMessages(clubId);
    setPinnedMessages(pins);
    setShowPinnedPanel(true);
  };

  const handleUnpinFromPanel = async (messageId: string) => {
    try {
      await unpinMessage(clubId, messageId);
      setPinnedMessages(prev => prev.filter(p => p.messageId !== messageId));
      setPinnedMessageIds(prev => { const s = new Set(prev); s.delete(messageId); return s; });
    } catch (err) {
      console.error('Failed to unpin:', err);
    }
  };

  // Polls
  const handleCreatePoll = async (question: string, options: string[], isAnonymous: boolean, isMultiple: boolean) => {
    if (!user) return;
    try {
      const poll = await createPoll(clubId, user.id, question, options, isAnonymous, isMultiple);
      setPolls(prev => [poll, ...prev]);
    } catch (err) {
      console.error('Failed to create poll:', err);
    }
  };

  const handleVote = async (pollId: string, optionId: string, alreadyVoted: boolean) => {
    if (!user) return;
    try {
      if (alreadyVoted) {
        await unvotePoll(pollId, optionId, user.id);
      } else {
        await votePoll(pollId, optionId, user.id);
      }
      // Refresh polls
      const updated = await getClubPolls(clubId, user.id);
      setPolls(updated);
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    if (!confirm('Закрыть опрос?')) return;
    try {
      await closePoll(pollId);
      setPolls(prev => prev.map(p => p.id === pollId ? { ...p, isActive: false } : p));
    } catch (err) {
      console.error('Failed to close poll:', err);
    }
  };

  // Scroll to message (for search)
  const scrollToMessage = (msgId: string) => {
    const el = messageRefs.current.get(msgId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary/30', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary/30', 'ring-offset-2'), 2000);
    }
  };

  const isGlobalManager = user?.role === 'admin' || user?.role === 'superadmin';
  const isOwnerOrAdmin = (membership?.role === 'owner' || membership?.role === 'admin') || isGlobalManager;
  const canDeleteMessages = isOwnerOrAdmin;


  const formatRecordingTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

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
    <div className="min-h-screen mesh-bg">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-panel border-b-none">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/clubs')}
              className="p-2 rounded-xl hover:bg-surface-container transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="space-y-0.5">
              <h1 className="text-base font-semibold tracking-tight leading-none">{club.name}</h1>
              <div className="flex items-center gap-1.5">
                {typingUsers.length > 0 ? (
                  <span className="text-[11px] font-medium text-primary animate-pulse">
                    {typingUsers.join(', ')} печатает…
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-on-surface-muted">
                    {club.memberCount} участников
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Search */}
            {membership && (
              <button
                onClick={() => setShowSearch(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-surface-container text-on-surface-variant/50 hover:text-on-surface transition-all active:scale-95"
                title="Поиск"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
            )}
            {/* Pinned */}
            {membership && pinnedMessageIds.size > 0 && (
              <button
                onClick={openPinnedPanel}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-surface-container text-on-surface-variant/50 hover:text-on-surface transition-all active:scale-95 relative"
                title="Закреплённые"
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  {pinnedMessageIds.size}
                </span>
              </button>
            )}
            {/* Settings / Menu */}
            {membership && (
              <button
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-surface-container transition-all active:scale-95"
                title="Меню"
              >
                <span className="material-symbols-outlined text-[20px]">settings_heart</span>
              </button>
            )}
          </div>
        </div>
        {/* Pinned message preview bar */}
        {membership && pinnedMessageIds.size > 0 && (
          <div
            onClick={openPinnedPanel}
            className="border-t border-on-surface/5 bg-amber-50/60 cursor-pointer hover:bg-amber-50 transition-colors"
          >
            <div className="max-w-2xl mx-auto px-6 py-1.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
              <span className="text-xs font-medium text-amber-800/70">
                {pinnedMessageIds.size} {pinnedMessageIds.size === 1 ? 'закреплённое сообщение' : 'закреплённых сообщений'}
              </span>
              <span className="material-symbols-outlined text-amber-600/40 text-[14px] ml-auto">chevron_right</span>
            </div>
          </div>
        )}
      </header>

      <main className={`${pinnedMessageIds.size > 0 ? 'pt-[6.5rem]' : 'pt-[5rem]'} pb-40 px-6 max-w-2xl mx-auto min-h-screen`}>
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
            {/* Marathon Widget (Compact) */}
            {marathon && countdown && (
              <section
                onClick={() => setShowMarathonDetails(true)}
                className="mb-6 bg-white/60 backdrop-blur-xl rounded-2xl p-4 cursor-pointer hover:bg-white/80 transition-all border border-on-surface/5 group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-muted" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  <h3 className="text-sm font-semibold tracking-tight truncate flex-1">{marathon.title}</h3>
                  <span className="text-xs font-medium font-[tabular-nums] text-on-surface-muted">
                    {countdown.d > 0 && `${countdown.d}д `}
                    {countdown.h}ч {countdown.m}м
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-muted/60 group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                </div>
                <div className="h-1 bg-surface-container rounded-full overflow-hidden">
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

            {/* Active Polls */}
            {polls.filter(p => p.isActive).map(poll => (
              <PollCard
                key={poll.id}
                poll={poll}
                userId={user?.id || ''}
                onVote={handleVote}
                onClose={handleClosePoll}
                canManage={isOwnerOrAdmin || poll.createdBy === user?.id}
              />
            ))}

            {/* Chat messages */}
            {messages.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm text-on-surface-muted">Чат пуст. Напишите первым.</p>
              </div>
            )}

            <div className="space-y-1 mb-20">
              {messages.map((msg, index) => {
                const isMine = msg.userId === user?.id;
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const isContinuous = prevMsg?.userId === msg.userId;
                const isPinned = pinnedMessageIds.has(msg.id);

                return (
                  <div
                    key={msg.id}
                    ref={(el) => { if (el) messageRefs.current.set(msg.id, el); }}
                    className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] chat-bubble-enter transition-all duration-300 ${
                      isMine ? 'flex-row-reverse ml-auto' : ''
                    } ${isContinuous ? 'mt-0.5' : 'mt-4'}`}
                  >
                    {/* Avatar */}
                    {!isMine && (
                      <div className="w-7 shrink-0">
                        {!isContinuous && (
                          msg.senderAvatar ? (
                            <Image
                              alt={msg.senderName || ''}
                              width={28}
                              height={28}
                              unoptimized
                              className="w-7 h-7 rounded-full object-cover"
                              src={msg.senderAvatar}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-[10px] font-semibold text-on-surface-muted">
                              {(msg.senderName || '?').charAt(0).toUpperCase()}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {!isMine && !isContinuous && (
                        <span className="text-[11px] font-medium text-on-surface-muted mb-1 ml-3">
                          {msg.senderName || 'Anonymous'}
                        </span>
                      )}

                      <div
                        className={`group relative ${
                          !msg.text && !msg.replyToId && msg.fileType === 'image'
                            ? ''
                            : isMine
                              ? 'bg-on-surface text-surface rounded-2xl rounded-br-sm px-3.5 py-2'
                              : 'bg-surface-container text-on-surface rounded-2xl rounded-bl-sm px-3.5 py-2'
                        } ${isPinned ? 'ring-1 ring-amber-400/40' : ''}`}
                      >
                        {/* Pin indicator */}
                        {isPinned && (
                          <div className={`absolute -top-1.5 ${isMine ? '-left-1' : '-right-1'}`}>
                            <span className="material-symbols-outlined text-amber-500 text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
                          </div>
                        )}

                        {/* Reply preview */}
                        {msg.repliedMessage && (
                          <div className={`mb-1.5 pl-2 border-l-2 ${isMine ? 'border-surface/40' : 'border-on-surface/20'}`}>
                            <span className={`text-[11px] font-medium ${isMine ? 'text-surface/60' : 'text-on-surface-muted'} block`}>
                              {msg.repliedMessage.senderName}
                            </span>
                            <p className={`text-xs ${isMine ? 'text-surface/60' : 'text-on-surface/50'} truncate max-w-[200px]`}>
                              {msg.repliedMessage.text || '📎 Файл'}
                            </p>
                          </div>
                        )}

                        {/* Voice message */}
                        {msg.fileType === 'voice' && msg.fileUrl && (
                          <VoiceWaveform
                            url={msg.fileUrl}
                            duration={msg.voiceDurationSeconds || 0}
                            isMine={isMine}
                          />
                        )}

                        {/* Image message */}
                        {msg.fileType === 'image' && msg.fileUrl && (
                          <div 
                            className={`relative overflow-hidden cursor-zoom-in group/img ${!msg.text ? 'rounded-[16px] shadow-sm border border-on-surface/10' : 'rounded-[16px] mb-3 border border-on-surface/10'}`}
                            onClick={() => setExpandedImage(msg.fileUrl!)}
                          >
                            <Image
                              src={msg.fileUrl}
                              alt="Attached image"
                              width={100}
                              height={100}
                              unoptimized
                              className="w-[100px] h-[100px] object-cover transition-transform duration-500 hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                               <span className="material-symbols-outlined text-white">zoom_in</span>
                            </div>
                          </div>
                        )}

                        {/* File message */}
                        {msg.fileType === 'file' && msg.fileUrl && (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mb-2 transition-all ${
                              isMine
                                ? 'bg-surface/10 hover:bg-surface/20 text-white'
                                : 'bg-on-surface/5 hover:bg-on-surface/10'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">cloud_download</span>
                            <span className="text-xs font-medium">Документ</span>
                          </a>
                        )}

                        {/* Text with @mention highlighting */}
                        {msg.text && (
                          <p className="text-sm leading-snug">
                            {renderTextWithMentions(msg.text, isMine)}
                            {msg.isEdited && (
                              <span className={`text-[10px] ml-1 ${isMine ? 'text-surface/40' : 'text-on-surface/30'}`}>(ред.)</span>
                            )}
                          </p>
                        )}
                        
                        {/* Context actions (hover) */}
                        <div className={`absolute top-0 ${isMine ? '-left-24' : '-right-24'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5`}>
                          {/* Reply */}
                          <button
                            onClick={() => setReplyingTo(msg)}
                            className="p-1.5 text-on-surface-variant/40 hover:text-primary transition-colors"
                            title="Ответить"
                          >
                            <span className="material-symbols-outlined text-[16px]">reply</span>
                          </button>
                          {/* Pin (admin only) */}
                          {isOwnerOrAdmin && (
                            <button
                              onClick={() => handlePinMessage(msg.id)}
                              className={`p-1.5 transition-colors ${isPinned ? 'text-amber-500' : 'text-on-surface-variant/40 hover:text-amber-500'}`}
                              title={isPinned ? 'Открепить' : 'Закрепить'}
                            >
                              <span className="material-symbols-outlined text-[16px]" style={isPinned ? { fontVariationSettings: "'FILL' 1" } : {}}>push_pin</span>
                            </button>
                          )}
                          {/* Delete */}
                          {(isMine || canDeleteMessages) && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1.5 text-on-surface-variant/40 hover:text-red-500 transition-colors"
                              title="Удалить"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                            </button>
                          )}
                          {/* Edit own text messages */}
                          {isMine && msg.text && (
                            <button
                              onClick={() => { setEditingMessageId(msg.id); setEditValue(msg.text || ''); }}
                              className="p-1.5 text-on-surface-variant/40 hover:text-on-surface transition-colors"
                              title="Редактировать"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {!isContinuous && (
                        <div className={`flex items-center gap-2 mt-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[10px] font-medium text-on-surface-muted/60">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Closed polls at the bottom */}
              {polls.filter(p => !p.isActive).length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-px flex-grow bg-on-surface/10"></div>
                    <span className="text-xs font-medium text-on-surface-muted">Завершённые опросы</span>
                    <div className="h-px flex-grow bg-on-surface/10"></div>
                  </div>
                  {polls.filter(p => !p.isActive).map(poll => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      userId={user?.id || ''}
                      onVote={handleVote}
                      onClose={handleClosePoll}
                      canManage={false}
                    />
                  ))}
                </div>
              )}

              <div ref={chatEndRef} className="h-4" />
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="fixed bottom-28 left-0 right-0 z-40">
                <div className="max-w-2xl mx-auto px-6">
                  <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-on-surface/5">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant/50">
                      {typingUsers.join(', ')} печатает...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Chat Input Bar */}
      {membership && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
          <div className="max-w-2xl mx-auto flex flex-col gap-1.5">
            {/* Reply preview */}
            {replyingTo && (
              <div className="bg-white rounded-t-xl border border-b-0 border-on-surface/10 px-4 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="w-0.5 h-7 bg-primary rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium text-primary block">
                    Ответ для {replyingTo.senderName || 'User'}
                  </span>
                  <p className="text-xs text-on-surface/50 truncate">{replyingTo.text || '📎 Файл'}</p>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1 text-on-surface-variant/40 hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Edit mode */}
            {editingMessageId && (
              <div className="bg-white rounded-t-xl border border-b-0 border-on-surface/10 px-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-primary text-[14px]">edit</span>
                  <span className="text-[11px] font-medium text-primary">Редактирование</span>
                  <button onClick={() => setEditingMessageId(null)} className="ml-auto p-1 text-on-surface-variant/40 hover:text-on-surface">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingMessageId(null); }}
                    className="flex-1 bg-surface-container rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button onClick={handleSaveEdit} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold">
                    Сохранить
                  </button>
                </div>
              </div>
            )}

            {/* Recording state */}
            {isRecording ? (
              <div className={`bg-white p-2 ${replyingTo || editingMessageId ? 'rounded-b-2xl rounded-t-none border-t-0' : 'rounded-2xl'} flex items-center gap-2 border border-red-200 shadow-md`}>
                <button
                  onClick={cancelRecording}
                  className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
                <div className="flex-grow flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-semibold text-red-500 tabular-nums">{formatRecordingTime(recordingTime)}</span>
                  <div className="flex-1 flex items-center gap-[2px]">
                    {Array.from({ length: 30 }, (_, i) => (
                      <div
                        key={i}
                        className="w-[2px] bg-red-300 rounded-full animate-pulse"
                        style={{
                          height: `${4 + Math.random() * 14}px`,
                          animationDelay: `${i * 50}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={stopRecording}
                  className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-full hover:scale-105 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            ) : !editingMessageId && (
              <div className={`bg-white p-1.5 ${replyingTo ? 'rounded-b-2xl rounded-t-none border-t-0' : 'rounded-2xl'} flex items-center gap-1 border border-on-surface/10 transition-all relative shadow-sm`}>
                {/* Mentions popup */}
                {mentionQuery !== null && mentionResults.length > 0 && (
                  <MentionsPopup
                    members={mentionResults}
                    onSelect={handleMentionSelect}
                    position={{ top: 0, left: 0 }}
                  />
                )}

                {/* File upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-10 h-10 flex items-center justify-center text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container rounded-full transition-all disabled:opacity-50 shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {uploading ? 'sync' : 'attach_file'}
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
                  ref={inputRef}
                  className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 text-sm placeholder:text-on-surface-variant/30 px-2"
                  placeholder="Сообщение"
                  type="text"
                  value={messageText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />

                {/* Voice record button (shown when no text) */}
                {!messageText.trim() && (
                  <button
                    onClick={startRecording}
                    className="w-10 h-10 flex items-center justify-center text-on-surface-variant/50 hover:text-red-500 hover:bg-red-50 rounded-full transition-all shrink-0"
                    title="Голосовое сообщение"
                  >
                    <span className="material-symbols-outlined text-[20px]">mic</span>
                  </button>
                )}

                {/* Send button (shown when has text) */}
                {messageText.trim() && (
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="w-10 h-10 flex items-center justify-center bg-on-surface text-surface rounded-full hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-20 disabled:scale-100 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Image Overlay */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-6 animate-in fade-in duration-300"
          onClick={() => setExpandedImage(null)}
        >
          <div 
            className="relative bg-white p-2 rounded-[32px] max-w-[95vw] max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setExpandedImage(null)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-10 shadow-lg border border-on-surface/5"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface">close</span>
            </button>
            <Image
              src={expandedImage}
              width={1600}
              height={1200}
              unoptimized
              className="max-w-full max-h-[85vh] object-contain rounded-[24px] block w-auto h-auto"
              alt="Expanded"
            />
          </div>
        </div>
      )}

      {/* Search Panel */}
      {showSearch && (
        <SearchPanel
          clubId={clubId}
          onClose={() => setShowSearch(false)}
          onScrollTo={scrollToMessage}
        />
      )}

      {/* Pinned Messages Panel */}
      {showPinnedPanel && (
        <PinnedMessagesPanel
          pins={pinnedMessages}
          onClose={() => setShowPinnedPanel(false)}
          onUnpin={handleUnpinFromPanel}
          canManage={isOwnerOrAdmin}
        />
      )}

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={showCreatePoll}
        onClose={() => setShowCreatePoll(false)}
        onSubmit={handleCreatePoll}
      />

      {/* Settings Modal (accessible to all members) */}
      {membership && (
        <ClubSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          clubId={clubId}
          userId={user!.id}
          userRole={membership!.role}
          activeMarathon={marathon}
          onMarathonChange={setMarathon}
          onLeave={handleLeave}
          onCreatePoll={() => setShowCreatePoll(true)}
          onOpenEvents={() => setShowEventsModal(true)}
        />
      )}

      {/* Events Modal */}
      <ClubEventsModal
        isOpen={showEventsModal}
        onClose={() => setShowEventsModal(false)}
        clubId={clubId}
        canManage={isOwnerOrAdmin}
      />

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
    </div>
  );
}
