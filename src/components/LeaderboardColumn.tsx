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
  variant?: 'purple' | 'blue' | 'orange';
}

export default function LeaderboardColumn({
  title,
  subtitle,
  icon,
  users,
  metricLabel,
  onUserClick,
  variant = 'purple',
}: LeaderboardColumnProps) {
  const variants = {
    purple: {
      bg: 'bg-gradient-to-br from-purple-500/10 via-transparent to-transparent',
      border: 'border-purple-500/10',
      iconBg: 'bg-purple-500/10',
      iconText: 'text-purple-400',
      shadow: 'shadow-[0_0_40px_-15px_rgba(168,85,247,0.1)]'
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-500/10 via-transparent to-transparent',
      border: 'border-blue-500/10',
      iconBg: 'bg-blue-500/10',
      iconText: 'text-blue-400',
      shadow: 'shadow-[0_0_40px_-15px_rgba(59,130,246,0.1)]'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-500/10 via-transparent to-transparent',
      border: 'border-orange-500/10',
      iconBg: 'bg-orange-500/10',
      iconText: 'text-orange-400',
      shadow: 'shadow-[0_0_40px_-15px_rgba(249,115,22,0.1)]'
    }
  };

  const style = variants[variant];

  return (
    <div className={`relative ${style.bg} ${style.shadow} backdrop-blur-md rounded-[32px] p-6 border ${style.border} flex flex-col h-full overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-xl group`}>
      {/* Decorative Background Icon */}
      <div className={`absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none`}>
        <span className="material-symbols-rounded text-[140px] leading-none">{icon}</span>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center ${style.iconText}`}>
            <span className="material-symbols-rounded text-[22px]">{icon}</span>
          </div>
          <h3 className="font-black text-sm text-on-surface uppercase leading-none tracking-wider">{title}</h3>
        </div>
        <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-8 ml-[52px]">
          {subtitle}
        </p>

        <div className="space-y-4 flex-1">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 opacity-20 italic text-xs">Нет данных</div>
          ) : users.map((u, i) => (
            <button
              type="button"
              key={u.id}
              onClick={() => onUserClick?.(u.id)}
              disabled={!onUserClick}
              className="flex items-center gap-3 group/item w-full text-left rounded-2xl p-2 -m-2 hover:bg-white/5 transition-all duration-300 disabled:hover:bg-transparent disabled:cursor-default"
            >
              <div className="relative w-11 h-11 flex-shrink-0">
                <div className="relative w-full h-full rounded-full bg-surface-container overflow-hidden border border-white/10 group-hover/item:border-white/20 transition-colors">
                  {u.avatarUrl ? (
                    <Image src={u.avatarUrl} alt={u.name} fill className="object-cover transition-transform duration-500 group-hover/item:scale-110" />
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
                <p className="text-sm font-bold text-white/90 truncate group-hover/item:text-white transition-colors">{u.name}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest ${style.iconText} opacity-70 group-hover/item:opacity-100 transition-opacity`}>
                  {u.metricValue} {metricLabel}
                </p>
              </div>
              {i === 0 && (
                <span className="material-symbols-rounded text-amber-500 text-[18px] drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
