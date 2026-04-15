'use client';

import React, { useState, useEffect } from 'react';
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
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Создатель',
  admin: 'Админ',
  member: 'Участник',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-primary text-on-primary',
  admin: 'bg-secondary-container text-on-secondary-container',
  member: 'bg-surface-container-high text-on-surface-variant',
};

export default function ClubSettingsModal({
  isOpen,
  onClose,
  clubId,
  userId,
  userRole,
  activeMarathon,
  onMarathonChange,
}: ClubSettingsModalProps) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMarathonModal, setShowMarathonModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center glass-modal-overlay" onClick={onClose}>
        <div
          className="glass-modal rounded-3xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] block mb-1">Управление</span>
              <h2 className="text-2xl font-bold tracking-tight">Настройки клуба</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Marathon Section */}
          <section className="mb-8">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Марафон</h3>
            {activeMarathon ? (
              <div className="p-4 rounded-xl glass-marathon-widget flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-primary">Активен</span>
                  <p className="font-semibold text-sm mt-1">{activeMarathon.title}</p>
                </div>
                <button
                  onClick={() => setShowMarathonModal(true)}
                  className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                >
                  Управлять
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowMarathonModal(true)}
                className="w-full p-4 rounded-xl border-2 border-dashed border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span className="text-sm font-semibold">Запустить марафон</span>
              </button>
            )}
          </section>

          {/* Members Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Участники ({members.length})
              </h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors group"
                  >
                    {/* Avatar */}
                    {member.userAvatar ? (
                      <img
                        src={member.userAvatar}
                        alt={member.userName || ''}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                        {(member.userName || '?').charAt(0)}
                      </div>
                    )}

                    {/* Name + role */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{member.userName || 'Пользователь'}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mt-0.5 ${ROLE_COLORS[member.role]}`}>
                        {ROLE_LABELS[member.role]}
                      </span>
                    </div>

                    {/* Actions (only for owner, and not on themselves) */}
                    {userRole === 'owner' && member.userId !== userId && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {member.role === 'member' && (
                          <button
                            onClick={() => handleRoleChange(member.id, member.userId, 'admin')}
                            disabled={actionLoading === member.id}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                            title="Назначить админом"
                          >
                            <span className="material-symbols-outlined text-[18px]">shield_person</span>
                          </button>
                        )}
                        {member.role === 'admin' && (
                          <button
                            onClick={() => handleRoleChange(member.id, member.userId, 'member')}
                            disabled={actionLoading === member.id}
                            className="p-1.5 rounded-lg hover:bg-secondary-container text-on-surface-variant transition-colors"
                            title="Снять админа"
                          >
                            <span className="material-symbols-outlined text-[18px]">remove_moderator</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(member.id, member.userId)}
                          disabled={actionLoading === member.id}
                          className="p-1.5 rounded-lg hover:bg-error/10 text-error transition-colors"
                          title="Удалить из клуба"
                        >
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
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

      {/* Marathon sub-modal */}
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
