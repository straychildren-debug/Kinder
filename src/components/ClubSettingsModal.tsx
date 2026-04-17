'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ClubMember, ClubMarathon } from '@/lib/types';
import { getClubMembers, updateMemberRole, removeMember } from '@/lib/db';
import MarathonModal from './MarathonModal';

interface ClubSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  userId: string;
  userRole: 'owner' | 'admin' | 'member';
  activeMarathon: ClubMarathon | null;
  onMarathonChange: (marathon: ClubMarathon | null) => void;
  onLeave: () => void;
  onCreatePoll: () => void;
  onOpenEvents: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Создатель',
  admin: 'Админ',
  member: 'Участник',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-on-surface text-surface',
  admin: 'bg-surface-container text-on-surface-variant font-black',
  member: 'bg-surface-container text-on-surface-variant/40',
};

export default function ClubSettingsModal({
  isOpen,
  onClose,
  clubId,
  userId,
  userRole,
  activeMarathon,
  onMarathonChange,
  onLeave,
  onCreatePoll,
  onOpenEvents,
}: ClubSettingsModalProps) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMarathonModal, setShowMarathonModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, clubId]);

  const loadMembers = async () => {
    setLoading(true);
    const data = await getClubMembers(clubId);
    setMembers(data);
    setLoading(false);
  };

  const handleRoleChange = async (memberId: string, memberUserId: string, newRole: string) => {
    if (memberUserId === userId) return; // Can't change own role
    setActionLoading(memberId);
    try {
      await updateMemberRole(clubId, memberUserId, newRole);
      await loadMembers();
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (memberId: string, memberUserId: string) => {
    if (memberUserId === userId) return;
    if (!confirm('Удалить участника из клуба?')) return;
    setActionLoading(memberId);
    try {
      await removeMember(clubId, memberUserId);
      await loadMembers();
    } catch (err) {
      console.error('Failed to remove member:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 glass-modal-overlay" onClick={onClose}>
        <div
          className="glass-modal rounded-[40px] p-10 w-full max-w-xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-500"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.4em] block mb-2 opacity-40 ">Панель управления</span>
              <h2 className="text-4xl font-black tracking-tighter leading-none">Настройки</h2>
            </div>
            <button onClick={onClose} className="w-12 h-12 rounded-2xl glass-btn flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Quick Actions Group */}
          <section className="mb-12">
            <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-6 opacity-40 ">Действия</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => { onClose(); onOpenEvents(); }}
                className="p-6 rounded-[24px] glass-panel hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Календарь</span>
              </button>

              <button
                onClick={() => { onClose(); onCreatePoll(); }}
                className="p-6 rounded-[24px] glass-panel hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-[20px]">ballot</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Новый опрос</span>
              </button>

              {isOwnerOrAdmin && (
                <button
                  onClick={() => setShowMarathonModal(true)}
                  className="p-6 rounded-[24px] glass-panel hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-3 group text-primary"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">Марафон</span>
                </button>
              )}

              {userRole !== 'owner' && (
                <button
                  onClick={() => { if (confirm('Выйти из клуба?')) { onClose(); onLeave(); } }}
                  className="p-6 rounded-[24px] bg-red-50/50 hover:bg-red-50 hover:shadow-xl transition-all border border-transparent hover:border-red-100 flex flex-col items-center justify-center gap-3 group sm:col-span-3 mt-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-red-100 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Покинуть клуб</span>
                </button>
              )}
            </div>
          </section>

          {/* Members Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-40 ">
                Список участников ({members.length})
              </h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-[6px] border-on-surface/5 border-t-on-surface rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 rounded-[24px] glass-panel hover:bg-white/20 transition-all duration-300 group"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      {member.userAvatar ? (
                        <Image
                          src={member.userAvatar}
                          alt={member.userName || ''}
                          width={44}
                          height={44}
                          unoptimized
                          className="w-11 h-11 rounded-[16px] object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all border border-on-surface/5 shadow-sm"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-[16px] bg-surface-container flex items-center justify-center text-[11px] font-black  text-on-surface/20 border border-on-surface/5">
                          {(member.userName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name + role */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black tracking-tighter truncate">{member.userName || 'Anonymous'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${ROLE_COLORS[member.role]}`}>
                          {ROLE_LABELS[member.role]}
                        </span>
                      </div>
                    </div>

                    {/* Actions (only for owner, and not on themselves) */}
                    {userRole === 'owner' && member.userId !== userId && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
                        {member.role === 'member' && (
                          <button
                            onClick={() => handleRoleChange(member.id, member.userId, 'admin')}
                            disabled={actionLoading === member.id}
                            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all active:scale-90 flex items-center justify-center"
                            title="Назначить админом"
                          >
                            <span className="material-symbols-outlined text-[18px]">verified_user</span>
                          </button>
                        )}
                        {member.role === 'admin' && (
                          <button
                            onClick={() => handleRoleChange(member.id, member.userId, 'member')}
                            disabled={actionLoading === member.id}
                            className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all active:scale-90 flex items-center justify-center"
                            title="Снять админа"
                          >
                            <span className="material-symbols-outlined text-[18px]">no_accounts</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(member.id, member.userId)}
                          disabled={actionLoading === member.id}
                          className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all active:scale-90 flex items-center justify-center"
                          title="Удалить из клуба"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <MarathonModal
        isOpen={showMarathonModal}
        onClose={() => setShowMarathonModal(false)}
        clubId={clubId}
        userId={userId}
        activeMarathon={activeMarathon}
        onMarathonChange={onMarathonChange}
      />
    </>
  );
}


