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
          className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors mb-8 group"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Назад</span>
        </button>

        <section className="mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-2 block opacity-40">Публикация</span>
          <h1 className="text-5xl font-black tracking-tighter text-on-surface leading-[0.9]">Добавить<br/>контент</h1>
          <p className="text-on-surface-variant text-sm mt-6 font-medium opacity-70 italic leading-relaxed">
            Поделитесь своими открытиями. После отправки публикация будет проверена сообществом модераторов.
          </p>
        </section>

        {/* Выбор типа */}
        <div className="flex gap-4 mb-10">
          {(['movie', 'book'] as ContentType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all border ${
                type === t
                  ? 'bg-on-surface text-surface border-on-surface shadow-2xl shadow-black/20'
                  : 'bg-surface text-on-surface-variant border-black/5 hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{t === 'movie' ? 'movie' : 'menu_book'}</span>
              {t === 'movie' ? 'Фильм' : 'Книга'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-surface rounded-[32px] p-8 space-y-8 shadow-sm border border-black/5">
            <div className="flex items-center gap-3 border-b border-black/5 pb-6">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-on-surface">info</span>
              </div>
              <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Основная информация</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-60">Название *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={type === 'movie' ? 'Например: Начало' : 'Например: Мастер и Маргарита'}
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium border border-black/5 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-60">Описание *</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Расскажите о своих впечатлениях..."
                  required
                  rows={4}
                  className="w-full px-5 py-4 rounded-2xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium border border-black/5 shadow-inner resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-60">Обложка</label>
                
                {!coverPreview && !imageUrl ? (
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label
                      htmlFor="cover-upload"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-black/5 rounded-[24px] bg-surface-container-low hover:bg-surface-container-high cursor-pointer transition-all group"
                    >
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 group-hover:text-on-surface transition-colors">add_photo_alternate</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 mt-4">Выбрать файл</span>
                    </label>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-black/5 text-transparent">.</div>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-20">или</span>
                      <div className="flex-1 h-px bg-black/5 text-transparent">.</div>
                    </div>
                    
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="Вставьте ссылку на изображение"
                      className="w-full px-5 py-4 rounded-2xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium border border-black/5 shadow-inner"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-[16/9] w-full rounded-[24px] overflow-hidden bg-surface-container border border-black/5 group">
                    <img 
                      src={coverPreview || imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={removeFile}
                        className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                      <label
                        htmlFor="cover-upload"
                        className="w-14 h-14 rounded-full bg-white text-on-surface flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-outlined">sync</span>
                      </label>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="cover-upload" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-60">Жанры</label>
                <input
                  type="text"
                  value={genres}
                  onChange={e => setGenres(e.target.value)}
                  placeholder="Драма, Фантастика (через запятую)"
                  className="w-full px-5 py-4 rounded-2xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium border border-black/5 shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Детали специфичные для контента */}
          <div className="bg-surface rounded-[32px] p-8 space-y-8 shadow-sm border border-black/5">
            <div className="flex items-center gap-3 border-b border-black/5 pb-6">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-on-surface">
                  {type === 'movie' ? 'movie' : 'menu_book'}
                </span>
              </div>
              <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">
                Детали {type === 'movie' ? 'фильма' : 'книги'}
              </h3>
            </div>

            <div className="space-y-6">
              {type === 'movie' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-60">Режиссёр *</label>
                    <input
                      type="text"
                      value={director}
                      onChange={e => setDirector(e.target.value)}
                      placeholder="Имя режиссёра"
                      required
                      className="w-full px-5 py-4 rounded-2xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium border border-black/5 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-60">Актёры</label>
                    <input
                      type="text"
                      value={actors}
                      onChange={e => setActors(e.target.value)}
                      placeholder="Главные роли (через запятую)"
                      className="w-full px-5 py-4 rounded-2xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium border border-black/5 shadow-inner"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-60">Автор *</label>
                    <input
                      type="text"
                      value={author}
                      onChange={e => setAuthor(e.target.value)}
                      placeholder="Имя автора"
                      required
                      className="w-full px-5 py-4 rounded-2xl bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium border border-black/5 shadow-inner"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-60">Год</label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    placeholder="2024"
                    className="w-full px-5 py-4 rounded-2xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium border border-black/5 shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-60">
                    {type === 'movie' ? 'Хронометраж' : 'Страниц'}
                  </label>
                  <input
                    type={type === 'movie' ? 'text' : 'number'}
                    value={type === 'movie' ? duration : pages}
                    onChange={e => type === 'movie' ? setDuration(e.target.value) : setPages(e.target.value)}
                    placeholder={type === 'movie' ? '2ч 15мин' : '450'}
                    className="w-full px-5 py-4 rounded-2xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium border border-black/5 shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-surface border border-black/5 rounded-[32px] flex items-start gap-4">
            <span className="material-symbols-outlined text-on-surface opacity-20 text-4xl">verified_user</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">Проверка модератором</p>
              <p className="text-xs text-on-surface-variant font-medium opacity-60 leading-relaxed italic">
                Все новые материалы проходят ручную проверку. Обычно это занимает от пары часов до суток. Спасибо за терпение!
              </p>
            </div>
          </div>

          {errorText && (
            <div className="bg-red-50 text-red-500 rounded-[24px] p-6 text-xs font-black uppercase tracking-widest border border-red-100 flex items-center gap-3">
              <span className="material-symbols-outlined">error</span>
              {errorText}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting || isSavingDraft}
              className="flex-1 py-5 bg-surface text-on-surface-variant border border-black/5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-surface-container disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {isSavingDraft ? 'Сохранение...' : 'В черновики'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isSavingDraft}
              className="flex-[2] py-5 bg-on-surface text-surface rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl shadow-black/20 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">{isSubmitting ? 'sync' : 'publish'}</span>
              {isSubmitting ? 'Отправка...' : 'Опубликовать'}
            </button>
          </div>
        </form>
      </main>

      {/* Draft Notification */}
      {draftSavedAt && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Черновик сохранён в {draftSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}

      <BottomNavBar />
    </>
  );
}
