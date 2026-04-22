'use client';

import React from "react";
import Image from "next/image";
import { LeaderboardUser } from "@/lib/types";

interface LeaderboardColumnProps {
  title: string;
  subtitle: string;
  icon: string;
  users: LeaderboardUser[];
  metricLabel: string;
  onUserClick?: (userId: string) => void;
}

export default function LeaderboardColumn({
  title,
  subtitle,
  icon,
  users,
  metricLabel,
  onUserClick,
}: LeaderboardColumnProps) {
  return (
    <div className="bg-surface rounded-3xl p-6 border border-on-surface/5 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-on-surface/5 flex items-center justify-center text-on-surface">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <h3 className="font-black text-sm text-on-surface uppercase tracking-tight leading-none">{title}</h3>
      </div>
      <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-6 ml-[52px]">
        {subtitle}
      </p>

      <div className="space-y-3 flex-1">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 opacity-20 italic text-xs">Нет данных</div>
        ) : users.map((u, i) => (
          <button
            type="button"
            key={u.id}
            onClick={() => onUserClick?.(u.id)}
            disabled={!onUserClick}
            className="flex items-center gap-3 group w-full text-left rounded-xl p-1 -m-1 hover:bg-on-surface/[0.03] transition-colors disabled:hover:bg-transparent disabled:cursor-default"
          >
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="relative w-full h-full rounded-full bg-surface-container overflow-hidden border border-on-surface/5">
                {u.avatarUrl ? (
                  <Image src={u.avatarUrl} alt={u.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-black">{u.name.charAt(0)}</div>
                )}
              </div>
              {/* Rank Badge */}
              <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-surface z-10 shadow-sm ${
                i === 0 ? 'bg-amber-400 text-amber-950' : 
                i === 1 ? 'bg-slate-300 text-slate-900' : 
                i === 2 ? 'bg-orange-400 text-orange-950' : 
                'bg-surface-container-high text-on-surface-variant'
              }`}>
                {i + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-on-surface truncate tracking-tight">{u.name}</p>
              <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">
                {u.metricValue} {metricLabel}
              </p>
            </div>
            {i === 0 && (
              <span className="material-symbols-outlined text-amber-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
