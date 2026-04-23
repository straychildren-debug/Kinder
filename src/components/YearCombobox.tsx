'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface YearComboboxProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function YearCombobox({ value, onChange, placeholder = '2024' }: YearComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const currentYear = new Date().getFullYear();
  // Годы от текущего+2 до 1890
  const years = Array.from({ length: 150 }, (_, i) => (currentYear + 2 - i).toString());

  // Если значение точно совпадает с годом из списка, показываем весь список.
  // Фильтруем только если пользователь в процессе ввода (например, "199").
  const isExactMatch = years.includes(value);
  const filteredYears = value && !isExactMatch ? years.filter(y => y.includes(value)) : years;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && isExactMatch) {
      // Даем React время отрендерить список
      setTimeout(() => {
        if (listRef.current) {
          const selectedEl = listRef.current.querySelector('[data-selected="true"]');
          if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'center' });
          }
        }
      }, 50);
    }
  }, [isOpen, isExactMatch]);

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-5 py-3 pr-10 rounded-xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-on-surface/10 transition-all text-sm font-medium border border-on-surface/5 shadow-inner"
      />
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
      >
        <span className="material-symbols-outlined text-[20px] transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
          expand_more
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-2 bg-surface border border-on-surface/5 rounded-xl shadow-2xl max-h-[240px] overflow-y-auto custom-scrollbar overflow-hidden"
          >
            {filteredYears.length > 0 ? (
              filteredYears.map(year => (
                <button
                  key={year}
                  type="button"
                  data-selected={value === year}
                  onClick={() => {
                    onChange(year);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3 text-sm hover:bg-on-surface/5 transition-colors ${
                    value === year 
                      ? 'text-primary font-bold bg-primary/5' 
                      : 'text-on-surface font-medium'
                  }`}
                >
                  {year}
                </button>
              ))
            ) : (
              <div className="px-5 py-3 text-sm text-on-surface-variant font-medium">
                Нет совпадений
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
