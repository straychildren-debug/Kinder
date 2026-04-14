'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { createContent, updateContent } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { ContentType } from '@/lib/types';

export default function CreatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [type, setType] = useState<ContentType>('movie');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  // Фильм
  const [director, setDirector] = useState('');
  const [actors, setActors] = useState('');
  const [year, setYear] = useState('');
  const [duration, setDuration] = useState('');
  // Книга
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState('');
  const [publisher, setPublisher] = useState('');
  const [isbn, setIsbn] = useState('');
  // Общие
  const [genres, setGenres] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);

  if (!user) {
    return (
      <>
        <TopNavBar />
        <main className="pt-24 pb-32 px-6 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">lock</span>
          <h2 className="text-2xl font-bold">Требуется авторизация</h2>
          <p className="text-on-surface-variant text-center">
            Для создания контента необходимо войти в аккаунт
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 glass-btn text-white rounded-xl font-semibold transition-transform active:scale-95"
          >
            Войти
          </button>
        </main>
        <BottomNavBar />
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <TopNavBar />
        <main className="pt-24 pb-32 px-6 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-center">Отправлено на модерацию!</h2>
          <p className="text-on-surface-variant text-center max-w-md">
            Ваша публикация «{title}» успешно создана и отправлена на проверку модератору.
            После одобрения она появится в общей ленте.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setSubmitted(false); setTitle(''); setDescription(''); }}
              className="px-6 py-3 bg-surface-container-low rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors"
            >
              Добавить ещё
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 glass-btn text-white rounded-xl font-semibold text-sm transition-transform active:scale-95"
            >
              На главную
            </button>
          </div>
        </main>
        <BottomNavBar />
      </>
    );
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setErrorText('');
    
    try {
      const parsedGenres = genres ? genres.split(',').map(s => s.trim()) : [];
      
      const metadata = type === 'movie' 
        ? { 
            director, 
            actors: actors ? actors.split(',').map(s => s.trim()) : [], 
            year: year ? parseInt(year) : undefined, 
            duration, 
            genre: parsedGenres 
          }
        : { 
            author, 
            pages: pages ? parseInt(pages) : undefined, 
            publisher, 
            isbn, 
            genre: parsedGenres 
          };

      const contentData = {
        type,
        title: title || (type === 'movie' ? 'Без названия (фильм)' : 'Без названия (книга)'),
        description,
        imageUrl,
        createdBy: user.id,
        ...metadata,
        status: 'pending' as const
      };

      if (draftId) {
        await updateContent(draftId, contentData);
      } else {
        await createContent(contentData);
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setErrorText('Произошла ошибка при создании публикации.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Валидация размера (500КБ)
    if (file.size > 500 * 1024) {
      setUploadError('Файл слишком большой. Максимальный размер — 500КБ.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (err) {
      console.error(err);
      setUploadError('Ошибка при загрузке изображения.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    setIsSavingDraft(true);
    setErrorText('');
    setDraftSavedAt(null);

    try {
      const parsedGenres = genres ? genres.split(',').map(s => s.trim()) : [];
      
      const metadata = type === 'movie' 
        ? { 
            director, 
            actors: actors ? actors.split(',').map(s => s.trim()) : [], 
            year: year ? parseInt(year) : undefined, 
            duration, 
            genre: parsedGenres 
          }
        : { 
            author, 
            pages: pages ? parseInt(pages) : undefined, 
            publisher, 
            isbn, 
            genre: parsedGenres 
          };

      const contentData = {
        type,
        title: title || (type === 'movie' ? 'Черновик фильма' : 'Черновик книги'),
        description,
        imageUrl,
        createdBy: user.id,
        ...metadata,
        status: 'draft' as const
      };

      if (draftId) {
        await updateContent(draftId, contentData);
      } else {
        const newDraft = await createContent(contentData);
        setDraftId(newDraft.id);
      }
      setDraftSavedAt(new Date());
      
      // Скрываем уведомление через 3 секунды
      setTimeout(() => setDraftSavedAt(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorText('Ошибка при сохранении черновика.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm';
  const labelClass = 'block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2';

  return (
    <>
      <TopNavBar />
      <main className="pt-24 pb-32 px-6 max-w-3xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-6 group"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-0.5">arrow_back</span>
          <span className="text-sm font-semibold">Назад</span>
        </button>

        <section className="mb-8">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Создание</span>
          <h2 className="text-3xl font-bold leading-tight tracking-tight mt-1">Добавить публикацию</h2>
          <p className="text-on-surface-variant text-sm mt-2">
            Заполните информацию. После отправки публикация будет проверена модератором.
          </p>
        </section>

        {/* Выбор типа */}
        <div className="flex gap-3 mb-8">
          <button
            type="button"
            onClick={() => setType('movie')}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              type === 'movie'
                ? 'glass-btn text-white shadow-lg'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">movie</span>
            Фильм
          </button>
          <button
            type="button"
            onClick={() => setType('book')}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              type === 'book'
                ? 'glass-btn text-white shadow-lg'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
            Книга
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">info</span>
              Основная информация
            </h3>

            <div>
              <label className={labelClass}>Название *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={type === 'movie' ? 'Например: Начало' : 'Например: Мастер и Маргарита'}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Описание *</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Краткое описание сюжета и ваши впечатления..."
                required
                rows={4}
                className={inputClass + ' resize-none'}
              />
            </div>

            <div>
              <label className={labelClass}>Обложка</label>
              <div className="space-y-3">
                {/* Выбор файла */}
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="cover-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="cover-upload"
                    className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      uploading 
                        ? 'opacity-50 cursor-not-allowed border-primary/30' 
                        : 'border-on-surface-variant/20 hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {uploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Загрузка...</span>
                      </div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-primary">upload_file</span>
                        <span className="text-sm font-medium">Загрузить фото (макс. 500КБ)</span>
                      </>
                    )}
                  </label>
                </div>

                {uploadError && (
                  <p className="text-xs text-error font-medium px-1">{uploadError}</p>
                )}

                <div className="flex items-center gap-3">
                  <div className="h-px bg-on-surface-variant/10 flex-1"></div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">или укажите URL</span>
                  <div className="h-px bg-on-surface-variant/10 flex-1"></div>
                </div>

                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={inputClass}
                />

                {imageUrl && (
                  <div className="relative mt-2 rounded-xl overflow-hidden aspect-[2/3] max-w-[120px] bg-surface-container border border-on-surface-variant/10 group">
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass}>Жанры (через запятую)</label>
              <input
                type="text"
                value={genres}
                onChange={e => setGenres(e.target.value)}
                placeholder="Драма, Фантастика, Триллер"
                className={inputClass}
              />
            </div>
          </div>

          {/* Детали фильма */}
          {type === 'movie' && (
            <div className="bg-surface-container-lowest rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">movie</span>
                Детали фильма
              </h3>

              <div>
                <label className={labelClass}>Режиссёр *</label>
                <input
                  type="text"
                  value={director}
                  onChange={e => setDirector(e.target.value)}
                  placeholder="Кристофер Нолан"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Актёры (через запятую)</label>
                <input
                  type="text"
                  value={actors}
                  onChange={e => setActors(e.target.value)}
                  placeholder="Леонардо ДиКаприо, Том Харди"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Год выпуска</label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    placeholder="2024"
                    min="1900"
                    max="2030"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Длительность</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="2ч 30мин"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Детали книги */}
          {type === 'book' && (
            <div className="bg-surface-container-lowest rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                Детали книги
              </h3>

              <div>
                <label className={labelClass}>Автор *</label>
                <input
                  type="text"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  placeholder="Михаил Булгаков"
                  required
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Количество страниц</label>
                  <input
                    type="number"
                    value={pages}
                    onChange={e => setPages(e.target.value)}
                    placeholder="480"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>ISBN</label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={e => setIsbn(e.target.value)}
                    placeholder="978-5-17-..."
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Издательство</label>
                <input
                  type="text"
                  value={publisher}
                  onChange={e => setPublisher(e.target.value)}
                  placeholder="АСТ"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Информация о модерации */}
          <div className="bg-primary/5 rounded-2xl p-5 flex items-start gap-4">
            <span className="material-symbols-outlined text-primary text-[24px] mt-0.5">verified_user</span>
            <div>
              <p className="text-sm font-semibold">Модерация контента</p>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                После отправки публикация будет проверена модератором. Обычно проверка занимает до 24 часов.
                Вы получите уведомление о результате.
              </p>
            </div>
          </div>

          {errorText && (
            <div className="bg-error/10 text-error rounded-2xl p-4 text-sm font-medium">
              {errorText}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting || isSavingDraft}
              className="flex-1 py-4 bg-surface-container-high text-on-surface rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              {isSavingDraft ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Сохранить черновик
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isSavingDraft}
              className="flex-[2] py-4 glass-btn text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  Отправить на модерацию
                </>
              )}
            </button>
          </div>

          {/* Плавающее уведомление о сохранении черновика */}
          {draftSavedAt && (
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-surface-container-high text-on-surface px-4 py-2 rounded-full shadow-lg border border-primary/20 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
              <span className="text-xs font-medium">Черновик сохранён в {draftSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </form>
      </main>
      <BottomNavBar />
    </>
  );
}
