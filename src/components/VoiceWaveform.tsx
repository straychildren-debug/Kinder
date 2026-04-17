'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  url: string;
  duration: number;
  isMine: boolean;
  bars?: number;
}

// Кэш пиков по url, чтобы не декодировать аудио повторно при ре-рендере.
const peakCache = new Map<string, number[]>();

function formatDuration(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/**
 * Строит массив из `bars` пиков амплитуды для переданного AudioBuffer.
 * Каждый пик — максимум абсолютного значения сэмпла внутри своего чанка.
 */
function computePeaks(buffer: AudioBuffer, bars: number): number[] {
  const channel = buffer.getChannelData(0);
  const chunkSize = Math.max(1, Math.floor(channel.length / bars));
  const peaks: number[] = new Array(bars).fill(0);
  for (let i = 0; i < bars; i++) {
    let max = 0;
    const start = i * chunkSize;
    const end = Math.min(channel.length, start + chunkSize);
    for (let j = start; j < end; j++) {
      const v = Math.abs(channel[j]);
      if (v > max) max = v;
    }
    peaks[i] = max;
  }
  // Нормализуем: делим на локальный максимум.
  const peakMax = Math.max(...peaks) || 1;
  return peaks.map((p) => p / peakMax);
}

export default function VoiceWaveform({ url, duration, isMine, bars = 32 }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const animRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [peaks, setPeaks] = useState<number[] | null>(
    peakCache.get(url) ?? null
  );

  // Декодируем один раз на url.
  useEffect(() => {
    if (peakCache.has(url)) {
      setPeaks(peakCache.get(url)!);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const Ctx: typeof AudioContext =
          (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
            .AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const audioBuffer = await ctx.decodeAudioData(buf);
        const computed = computePeaks(audioBuffer, bars);
        peakCache.set(url, computed);
        ctx.close();
        if (!cancelled) setPeaks(computed);
      } catch (e) {
        console.warn('VoiceWaveform decode failed, using fallback', e);
        // Фолбэк на псевдо-волну.
        const fb = Array.from({ length: bars }, (_, i) => {
          const h = 0.5 + Math.sin(i * 0.7) * 0.25 + Math.cos(i * 1.3) * 0.15;
          return Math.max(0.15, Math.min(1, h));
        });
        peakCache.set(url, fb);
        if (!cancelled) setPeaks(fb);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, bars]);

  const tick = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const d = el.duration || duration;
    const t = el.currentTime;
    setCurrentTime(t);
    setProgress(d ? Math.min(t / d, 1) : 0);
    if (!el.paused && !el.ended) {
      animRef.current = requestAnimationFrame(tick);
    }
  }, [duration]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play();
      setPlaying(true);
      animRef.current = requestAnimationFrame(tick);
    }
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const d = el.duration || duration;
    el.currentTime = ratio * d;
    setProgress(ratio);
    setCurrentTime(ratio * d);
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const handleEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };
    el.addEventListener('ended', handleEnded);
    return () => {
      el.removeEventListener('ended', handleEnded);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const shown = peaks || Array.from({ length: bars }, () => 0.3);

  return (
    <div className="flex items-center gap-3 min-w-[220px]">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        onClick={togglePlay}
        aria-label={playing ? 'Пауза' : 'Воспроизвести'}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 ${
          isMine ? 'bg-surface/20 hover:bg-surface/30' : 'bg-primary/10 hover:bg-primary/20'
        }`}
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {playing ? 'pause' : 'play_arrow'}
        </span>
      </button>
      <div className="flex-1">
        <div
          onClick={seekTo}
          role="slider"
          aria-valuenow={Math.round(progress * 100)}
          className="flex items-end gap-[2px] h-7 cursor-pointer select-none"
        >
          {shown.map((p, i) => {
            const h = Math.max(3, Math.round(4 + p * 24));
            const filled = i / shown.length <= progress;
            return (
              <div
                key={i}
                className={`w-[3px] rounded-full transition-colors duration-100 ${
                  filled
                    ? isMine ? 'bg-surface' : 'bg-primary'
                    : isMine ? 'bg-surface/30' : 'bg-primary/20'
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>
        <span
          className={`text-[9px] font-bold mt-1 block ${
            isMine ? 'text-surface/50' : 'text-on-surface-variant/40'
          }`}
        >
          {playing ? formatDuration(currentTime) : formatDuration(duration)}
        </span>
      </div>
    </div>
  );
}
