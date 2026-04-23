'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ContentType } from '@/lib/types';

const MOVIE_GENRES = [
  'Фантастика', 'Фэнтези', 'Боевик', 'Комедия', 'Драма', 
  'Триллер', 'Ужасы', 'Детектив', 'Мелодрама', 'Приключения', 
  'Документальное', 'Анимация', 'Криминал', 'Биография'
];

const BOOK_GENRES = [
  'Фантастика', 'Фэнтези', 'Роман', 'Детектив', 'Триллер', 
  'Ужасы', 'Приключения', 'Классика', 'Научпоп', 'Биография', 
  'Поэзия', 'Психология', 'Философия', 'История'
];

interface GenreSelectProps {
  type: ContentType;
  selectedGenres: string[];
  onChange: (genres: string[]) => void;
  maxGenres?: number;
}

export default function GenreSelect({ type, selectedGenres, onChange, maxGenres = 3 }: GenreSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const genresList = type === 'movie' ? MOVIE_GENRES : BOOK_GENRES;

  // Локальный стейт для модалки (чтобы можно было отменить выбор, закрыв окно)
  const [localSelected, setLocalSelected] = useState<string[]>(selectedGenres);

  const handleOpen = () => {
    // При открытии синхронизируем локальный стейт с реальным
    setLocalSelected(selectedGenres);
    setIsOpen(true);
  };

  const toggleGenre = (genre: string) => {
    if (localSelected.includes(genre)) {
      setLocalSelected(prev => prev.filter(g => g !== genre));
    } else {
      if (localSelected.length >= maxGenres) return;
      setLocalSelected(prev => [...prev, genre]);
    }
  };

  const handleSave = () => {
    onChange(localSelected);
    setIsOpen(false);
  };

  const removeGenre = (e: React.MouseEvent, genre: string) => {
    e.stopPropagation();
    onChange(selectedGenres.filter(g => g !== genre));
  };

  return (
    <>
      <div 
        onClick={handleOpen}
        className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-4 focus:ring-on-surface/[0.03] transition-all text-sm font-medium border border-on-surface/5 shadow-inner cursor-pointer flex flex-wrap gap-2 items-center"
      >
        {selectedGenres.length === 0 ? (
          <span className="text-on-surface-variant/30 text-sm">Выберите до {maxGenres} жанров</span>
        ) : (
          selectedGenres.map(genre => (
            <div key={genre} className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg text-[11px] font-bold text-purple-200">
              {genre}
              <span 
                onClick={(e) => removeGenre(e, genre)}
                className="material-symbols-outlined text-[14px] text-purple-400/70 hover:text-purple-300 cursor-pointer transition-colors"
              >
                close
              </span>
            </div>
          ))
        )}
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
              className="relative w-full max-w-md bg-surface border border-on-surface/5 rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 sm:pb-6 shadow-2xl flex flex-col max-h-[85vh] z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Жанры</h3>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/50 font-black mt-1">
                    Выберите до {maxGenres}
                  </p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full bg-on-surface/5 flex items-center justify-center text-on-surface-variant hover:bg-on-surface/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="overflow-y-auto pr-2 -mr-2 mb-6 flex-1 custom-scrollbar">
                <div className="flex flex-wrap gap-2">
                  {genresList.map(genre => {
                    const isSelected = localSelected.includes(genre);
                    const isDisabled = !isSelected && localSelected.length >= maxGenres;
                    
                    return (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        disabled={isDisabled}
                        className={`px-4 py-3 sm:py-2 rounded-xl text-xs font-bold transition-all border ${
                          isSelected 
                            ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-purple-500/5 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                            : 'border-on-surface/10 bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                        } ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full py-4 bg-on-surface text-surface rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-xl shadow-on-surface/10 mt-auto"
              >
                Готово ({localSelected.length}/{maxGenres})
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
