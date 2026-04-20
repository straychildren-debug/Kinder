'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { followUser, unfollowUser, isFollowing } from '@/lib/follows';

interface Props {
  targetUserId: string;
  size?: 'sm' | 'md';
  onChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ targetUserId, size = 'sm', onChange }: Props) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.id || !targetUserId || user.id === targetUserId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    isFollowing(user.id, targetUserId).then((v) => {
      if (!cancelled) {
        setFollowing(v);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, targetUserId]);

  if (!user || user.id === targetUserId) return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const nextVal = !following;
    setFollowing(nextVal);
    const ok = nextVal
      ? await followUser(user.id, targetUserId)
      : await unfollowUser(user.id, targetUserId);
    if (!ok) setFollowing(!nextVal);
    else onChange?.(nextVal);
    setBusy(false);
  };

  const padding = size === 'md' ? 'px-4 py-2 text-xs' : 'px-3 py-1.5 text-[11px]';

  if (loading) {
    return (
      <div
        className={`${padding} rounded-full bg-surface-container-low animate-pulse min-w-[80px] h-7`}
      />
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`${padding} rounded-full font-semibold transition-all active:scale-95 disabled:opacity-60 ${
        following
          ? 'bg-surface-container text-on-surface-muted hover:bg-surface-container-high border border-on-surface/5'
          : 'bg-on-surface text-surface'
      }`}
    >
      {following ? 'Вы подписаны' : 'Подписаться'}
    </button>
  );
}
