'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { createContent, updateContent, uploadCover } from '@/lib/db';
import type { ContentType } from '@/lib/types';

export default function CreatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [type, setType] = useState<ContentType>('movie');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  // Состояние фильма
  const [director, setDirector] = useState('');
  const [actors, setActors] = useState('');
  const [year, setYear] = useState('');
  const [duration, setDuration] = useState('');
  
  // Состояние книги
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState('');
  const [publisher, setPublisher] = useState('');
  const [isbn, setIsbn] = useState('');
  
  // Общие
  const [genres, setGenres] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Черновики (из удаленной ветки)
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
              onClick={() => { setSubmitted(false); setTitle(''); setDescription(''); setDraftId(null); }}
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setErrorText('Размер файла не должен превышать 1МБ');
      return;
    }

    setCoverFile(file);
    setErrorText('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setImageUrl('');
  };

  const getContentPayload = async (status: 'pending' | 'draft') => {
    let finalImageUrl = imageUrl;
    if (coverFile) {
      finalImageUrl = await uploadCover(coverFile);
    }

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

    return {
      type,
      title: title || (status === 'draft' ? (type === 'movie' ? 'Черновик фильма' : 'Черновик книги') : (type === 'movie' ? 'Без названия (фильм)' : 'Без названия (книга)')),
      description,
      imageUrl: finalImageUrl,
      createdBy: user.id,
      ...metadata,
      status
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setErrorText('');
    
    try {
      const contentData = await getContentPayload('pending');

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

  const handleSaveDraft = async () => {
    if (!user) return;
    setIsSavingDraft(true);
    setErrorText('');
    setDraftSavedAt(null);

    try {
      const contentData = await getContentPayload('draft');

      if (draftId) {
        await updateContent(draftId, contentData);
      } else {
        const newDraft = await createContent(contentData);
        setDraftId(newDraft.id);
      }
      setDraftSavedAt(new Date());
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
              
              {!coverPreview && !imageUrl ? (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label
                    htmlFor="cover-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-on-surface-variant/20 rounded-xl bg-surface-container-low hover:bg-surface-container-high cursor-pointer transition-colors group"
                  >
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/50 group-hover:text-primary transition-colors">add_photo_alternate</span>
                    <span className="text-xs text-on-surface-variant/70 mt-2 font-medium">Кликните для выбора фото (до 1МБ)</span>
                  </label>
                  
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-on-surface-variant/10"></div>
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 font-bold">ИЛИ ССЫЛКА</span>
                    <div className="h-px flex-1 bg-on-surface-variant/10"></div>
                  </div>
                  
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className={inputClass + " mt-3"}
                  />
                </div>
              ) : (
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-surface-container-high group">
                  <img 
                    src={coverPreview || imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={removeFile}
                      className="w-12 h-12 rounded-full bg-error text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                      title="Удалить"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                    <label
                      htmlFor="cover-upload"
                      className="w-12 h-12 rounded-full bg-white text-on-surface flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                      title="Заменить"
                    >
                      <span className="material-symbols-outlined">sync</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="cover-upload"
                    />
                  </div>
                  
                  {coverFile && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                      Выбрано: {(coverFile.size / 1024).toFixed(0)} КБ
                    </div>
                  )}
                </div>
              )}
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
              className="flex-1 py-4 bg-surface-container-high text-on-surface rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 hover:bg-surface-container-highest"
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
