import React from "react";

interface TopNavBarProps {
  title?: string;
  leftIcon?: string;
  rightIcon?: string;
  avatarUrl?: string;
  subtitle?: string;
}

export default function TopNavBar({
  title = "The Cinematic Library",
  leftIcon = "menu",
  rightIcon = "search",
  avatarUrl,
  subtitle,
}: TopNavBarProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-sm shadow-black/5 flex justify-between items-center px-6 py-3">
      <div className="flex items-center gap-4">
        <button className="p-2 text-[#575e70] dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors active:scale-98 rounded-full">
          <span className="material-symbols-outlined">{leftIcon}</span>
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tighter text-[#2b3438] dark:text-slate-100">
            {title}
          </h1>
          {subtitle && (
            <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {avatarUrl ? (
          <img
            alt="Profile Avatar"
            src={avatarUrl}
            className="w-8 h-8 rounded-full border border-surface-container-highest object-cover"
          />
        ) : (
          rightIcon && (
            <button className="p-2 text-[#575e70] dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors active:scale-98 rounded-full">
              <span className="material-symbols-outlined">{rightIcon}</span>
            </button>
          )
        )}
      </div>
    </header>
  );
}
