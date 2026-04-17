'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createContent, uploadCover } from '@/lib/db';
import { ContentType } from '@/lib/types';
import Image from 'next/image';

interface QuickCreateFormProps {
  userId: string;
  onSuccess: () => void;
}

export default function QuickCreateForm({ userId, onSuccess }: QuickCreateFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [type, setType] = useState<ContentType>('movie');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) return; // 1MB limit
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageUrl = '';
      if (coverFile) {
        imageUrl = await uploadCover(coverFile);
      }

      await createContent({
        type,
        title: title.trim(),
        description: description.trim() || (type === 'movie' ? 'Интересное кино' : 'Интересная книга'),
        imageUrl,
        createdBy: userId,
        status: 'pending' // Always sent to moderation
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setIsExpanded(false);
        setTitle('');
        setDescription('');
        setCoverFile(null);
        setCoverPreview(null);
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Quick create failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full relative">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            layoutId="form-container"
            onClick={() => setIsExpanded(true)}
            className="w-full p-4 rounded-3xl bg-white/70 backdrop-blur-xl border border-white shadow-lg shadow-black/5 flex items-center gap-4 text-left group transition-all hover:bg-white active:scale-[0.98]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="w-10 h-10 rounded-2xl bg-accent-lilac/10 flex items-center justify-center text-accent-lilac shrink-0 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">add</span>
            </div>
            <span className="text-sm font-black text-on-surface-muted opacity-60 flex-1 uppercase tracking-widest">Добавить книгу или фильм?</span>
            <div className="flex gap-1.5 opacity-20 mr-2">
              <span className="material-symbols-outlined text-[18px]">movie</span>
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
            </div>
          </motion.button>
        ) : (
          <motion.div
            layoutId="form-container"
            className="w-full bg-white/80 backdrop-blur-2xl border border-white rounded-[32px] shadow-2xl p-6 overflow-hidden relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {showSuccess ? (
              <motion.div 
                className="py-12 flex flex-col items-center justify-center text-center space-y-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight leading-none mb-1 text-on-surface">Отправлено!</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted">На проверку модератору</p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-on-surface/[0.03] p-1 rounded-2xl border border-on-surface/5">
                    {(['movie', 'book'] as ContentType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                          type === t ? 'bg-on-surface text-surface shadow-md' : 'text-on-surface-muted hover:bg-on-surface/5'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {t === 'movie' ? 'movie' : 'menu_book'}
                        </span>
                        {t === 'movie' ? 'Кино' : 'Книга'}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="w-8 h-8 rounded-full bg-on-surface/5 flex items-center justify-center text-on-surface-muted hover:bg-on-surface/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <input
                      autoFocus
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={type === 'movie' ? 'Название фильма' : 'Название книги'}
                      className="w-full bg-surface-container/50 border border-on-surface/5 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-accent-lilac/5 transition-all"
                      required
                    />
                  </div>

                  <AnimatePresence>
                    {title.length > 2 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                         <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Краткое описание (по желанию)"
                          rows={2}
                          className="w-full bg-surface-container/50 border border-on-surface/5 rounded-2xl px-5 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent-lilac/10 transition-all resize-none"
                        />

                        <div className="flex gap-4 items-center">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 h-24 rounded-2xl bg-surface-container/30 border-2 border-dashed border-on-surface/5 flex flex-col items-center justify-center gap-2 hover:bg-accent-lilac/5 transition-all text-on-surface-muted relative overflow-hidden group"
                          >
                            {coverPreview ? (
                              <Image src={coverPreview} alt="Preview" fill className="object-cover" />
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-2xl opacity-20">add_photo_alternate</span>
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Обложка</span>
                              </>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                          </button>
                          
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-24 px-8 bg-on-surface text-surface rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-on-surface/10 disabled:opacity-50 flex flex-col items-center justify-center gap-2"
                          >
                            {isSubmitting ? (
                              <span className="material-symbols-outlined animate-spin">sync</span>
                            ) : (
                              <>
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                                <span>Готово</span>
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
