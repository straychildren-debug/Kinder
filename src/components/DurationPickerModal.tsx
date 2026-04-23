'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WheelPickerProps {
  items: string[];
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

function WheelPicker({ items, value, onChange, label }: WheelPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemHeight = 44; // Высота одного элемента (должна совпадать с CSS)

  useEffect(() => {
    // Прокручиваем к начальному значению при монтировании
    const idx = items.indexOf(value);
    if (idx !== -1 && scrollRef.current) {
      scrollRef.current.scrollTop = idx * itemHeight;
    }
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollY = scrollRef.current.scrollTop;
    // Определяем, какой элемент сейчас по центру
    const index = Math.round(scrollY / itemHeight);
    if (index >= 0 && index < items.length) {
      const selectedItem = items[index];
      if (selectedItem !== value) {
        onChange(selectedItem);
      }
    }
  };

  return (
    <div className="relative flex-1 h-[220px] flex items-center justify-center overflow-hidden">
      {/* Подсветка центрального элемента */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[44px] bg-on-surface/[0.03] border-y border-on-surface/10 rounded-xl pointer-events-none z-10" />
      {label && (
        <div className="absolute top-1/2 right-4 sm:right-8 -translate-y-1/2 text-xs font-bold text-on-surface-variant z-10 pointer-events-none">
          {label}
        </div>
      )}
      
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{__html: `div::-webkit-scrollbar { display: none; }`}} />
        
        {/* Отступ сверху, чтобы первый элемент мог встать по центру */}
        <div style={{ height: `calc(110px - 22px)` }} className="snap-align-none" />
        
        {items.map(item => (
          <div 
            key={item} 
            className="h-[44px] flex items-center justify-center snap-center select-none"
          >
            <span className={`text-xl transition-all duration-200 ${value === item ? 'font-black text-on-surface scale-110' : 'font-medium text-on-surface-variant/40'}`}>
              {item}
            </span>
          </div>
        ))}
        
        {/* Отступ снизу, чтобы последний элемент мог встать по центру */}
        <div style={{ height: `calc(110px - 22px)` }} className="snap-align-none" />
      </div>
    </div>
  );
}

interface DurationPickerModalProps {
  value: string;
  onChange: (val: string) => void;
}

export default function DurationPickerModal({ value, onChange }: DurationPickerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Парсинг строки "2ч 15мин" -> hours: "2", minutes: "15"
  const parseValue = (val: string) => {
    let h = '0';
    let m = '0';
    const hMatch = val.match(/(\d+)\s*ч/);
    const mMatch = val.match(/(\d+)\s*мин/);
    if (hMatch) h = hMatch[1];
    if (mMatch) m = mMatch[1];
    return { h, m };
  };

  const initial = parseValue(value);
  const [hours, setHours] = useState(initial.h || '0');
  const [minutes, setMinutes] = useState(initial.m || '0');

  const handleOpen = () => {
    const p = parseValue(value);
    setHours(p.h || '0');
    setMinutes(p.m || '0');
    setIsOpen(true);
  };

  const handleSave = () => {
    let result = '';
    if (hours !== '0') result += `${hours}ч `;
    if (minutes !== '0') result += `${minutes}мин`;
    
    // Если ничего не выбрано, ставим пустую строку
    if (hours === '0' && minutes === '0') {
      onChange('');
    } else {
      onChange(result.trim());
    }
    
    setIsOpen(false);
  };

  const hourItems = Array.from({ length: 11 }, (_, i) => i.toString()); // 0-10 часов
  const minuteItems = Array.from({ length: 60 }, (_, i) => i.toString()); // 0-59 минут

  return (
    <>
      <div 
        onClick={handleOpen}
        className="w-full px-5 py-3 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-4 focus:ring-on-surface/[0.03] transition-all text-sm font-medium border border-on-surface/5 shadow-inner cursor-pointer"
      >
        {value || <span className="text-on-surface-variant/30">1ч 30мин</span>}
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-surface border border-on-surface/5 rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl flex flex-col z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-on-surface">Хронометраж</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full bg-on-surface/5 flex items-center justify-center text-on-surface-variant hover:bg-on-surface/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex bg-surface-container-low rounded-3xl p-2 mb-6 border border-on-surface/5 relative shadow-inner">
                {/* Эффект градиента сверху и снизу для создания ощущения цилиндра */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-surface-container-low to-transparent z-10 pointer-events-none rounded-t-3xl" />
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface-container-low to-transparent z-10 pointer-events-none rounded-b-3xl" />
                
                <WheelPicker items={hourItems} value={hours} onChange={setHours} label="ч" />
                <WheelPicker items={minuteItems} value={minutes} onChange={setMinutes} label="мин" />
              </div>

              <button
                onClick={handleSave}
                className="w-full py-4 bg-on-surface text-surface rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-xl shadow-on-surface/10"
              >
                Сохранить
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
