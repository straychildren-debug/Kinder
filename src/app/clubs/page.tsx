'use client';

import React, { useState, useEffect, useRef } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useAuth } from '@/components/AuthProvider';
import { Club, ClubCategory } from '@/lib/types';
import { getClubs, createClub, joinClub, getUserApprovedCount, uploadCover } from '@/lib/db';
import { useRouter } from 'next/navigation';

const CATEGORY_LABELS: Record<string, string> = {
  'кино': 'КИНО',
  'книги': 'КНИГИ',
  'арт': 'АРТ',
};

const CATEGORY_ICONS: Record<string, string> = {
  'кино': 'movie',
  'книги': 'menu_book',
  'арт': 'palette',
};

type FilterTab = 'all' | ClubCategory;

export default function Clubs() {
  const { user } = useAuth();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [approvedCount, setApprovedCount] = useState<number | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadClubs();
    if (user) {
      getUserApprovedCount(user.id).then(setApprovedCount);
    }
  }, [user]);

  const loadClubs = async () => {
    setLoading(true);
    const data = await getClubs(user?.id);
    setClubs(data);
    setLoading(false);
  };

  const handleCreateClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (approvedCount !== null && approvedCount < 20) {
      setShowTooltip(true);
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
      tooltipTimeout.current = setTimeout(() => setShowTooltip(false), 3000);
      return;
    }
    setShowCreateModal(true);
  };

  const handleJoin = async (clubId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await joinClub(clubId, user.id);
      router.push(`/clubs/${clubId}`);
    } catch {
      // Already a member — just navigate
      router.push(`/clubs/${clubId}`);
    }
  };

  const filteredClubs = clubs.filter((c) => {
    const matchesCategory = activeFilter === 'all' || c.category === activeFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Top 2 clubs by member count for hero section
  const heroClubs = [...clubs].sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0));
  const heroMain = heroClubs[0];
  const heroSide = heroClubs[1];

  return (
    <>
      <TopNavBar />
      <main className="pt-24 px-6 max-w-7xl mx-auto pb-24">
        {/* Header Section */}
        <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-on-surface-variant mb-2 block">Сообщество</span>
            <h1 className="text-5xl font-bold tracking-tight text-on-surface">Клубы</h1>
          </div>
          {/* Action Row: Search and Create */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl">search</span>
              <input
                type="text"
                placeholder="Поиск клубов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <button
                id="create-club-btn"
                onClick={handleCreateClick}
                className="glass-action text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-primary/10 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
              >
                <span className="material-symbols-outlined">add_circle</span>
                <span className="font-semibold text-sm">Создать клуб</span>
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-full mt-2 z-50 glass-tooltip whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-base">info</span>
                    <span>Нужно ≥ 20 одобренных публикаций (сейчас: {approvedCount})</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Bento Grid Layout for Featured Clubs */}
        {!loading && clubs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
            {/* Large Featured Card */}
            {heroMain && (
              <div
                onClick={() => handleJoin(heroMain.id)}
                className="md:col-span-8 bg-surface-container-lowest rounded-2xl overflow-hidden relative group shadow-sm cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                {heroMain.imageUrl ? (
                  <img
                    alt={heroMain.name}
                    className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
                    src={heroMain.imageUrl}
                  />
                ) : (
                  <div className="w-full h-[400px] bg-gradient-to-br from-primary/20 to-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-8xl text-on-surface-variant/30">{CATEGORY_ICONS[heroMain.category] || 'groups'}</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] text-white font-bold uppercase tracking-widest mb-4">Популярное</span>
                      <h2 className="text-3xl font-bold text-white mb-2">{heroMain.name}</h2>
                      <p className="text-white/80 text-sm max-w-md">{heroMain.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white/60 text-xs block mb-2">{heroMain.memberCount} Участники</span>
                      <button className="bg-white text-on-surface px-6 py-2 rounded-lg font-bold text-sm hover:bg-surface-variant transition-colors">
                        Вступить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Side Card */}
            {heroSide && (
              <div
                onClick={() => handleJoin(heroSide.id)}
                className="md:col-span-4 bg-surface-container-lowest p-8 rounded-2xl flex flex-col justify-between shadow-sm cursor-pointer hover:-translate-y-1 transition-transform duration-300"
              >
                <div>
                  <span className="material-symbols-outlined text-primary text-4xl mb-6">
                    {CATEGORY_ICONS[heroSide.category] || 'groups'}
                  </span>
                  <h3 className="text-xl font-bold mb-3">{heroSide.name}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{heroSide.description}</p>
                </div>
                <div className="pt-8 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">{heroSide.memberCount} участники</span>
                  <button className="text-primary font-bold text-sm hover:underline">Вступить</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-8 mb-8 border-b border-outline-variant/20 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {([['all', 'Все сообщества'], ['кино', 'Кино'], ['книги', 'Книги'], ['арт', 'Арт']] as [FilterTab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`pb-4 border-b-2 font-medium text-sm transition-colors ${
                activeFilter === key
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredClubs.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4 block">groups</span>
            <h3 className="text-xl font-bold mb-2">Пока нет клубов</h3>
            <p className="text-on-surface-variant text-sm">Станьте первым — создайте клуб!</p>
          </div>
        )}

        {/* Grid of Clubs */}
        {!loading && filteredClubs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredClubs.map((club) => (
              <div
                key={club.id}
                onClick={() => handleJoin(club.id)}
                className="bg-surface-container-lowest rounded-xl overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-sm cursor-pointer"
              >
                <div className="h-40 bg-surface-container-high relative">
                  {club.imageUrl ? (
                    <img
                      alt={club.name}
                      className="w-full h-full object-cover"
                      src={club.imageUrl}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-on-surface-variant/20">
                        {CATEGORY_ICONS[club.category] || 'groups'}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <div className="px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-[10px] text-white font-bold">
                      {CATEGORY_LABELS[club.category] || club.category}
                    </div>
                    {typeof club.unreadCount === 'number' && club.unreadCount > 0 && (
                      <div className="px-2 py-1 bg-error text-on-error rounded-md text-[10px] font-black animate-pulse shadow-lg shadow-error/20">
                        +{club.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-on-surface mb-2">{club.name}</h4>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-6">{club.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">{club.memberCount} Участники</span>
                    <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
                      <span className="material-symbols-outlined text-primary">login</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggestion Section */}
        <section className="mt-20 p-12 bg-surface-container-low rounded-3xl text-center">
          <h3 className="text-2xl font-bold mb-4">Не нашли то, что искали?</h3>
          <p className="text-on-surface-variant max-w-xl mx-auto mb-8 text-sm">Создайте собственное сообщество и пригласите единомышленников для обсуждения любимых произведений.</p>
          <button
            onClick={handleCreateClick}
            className="bg-primary text-white px-10 py-4 rounded-xl font-bold hover:bg-primary-dim transition-all shadow-lg shadow-primary/20"
          >
            Начать новое обсуждение
          </button>
        </section>
      </main>
      <BottomNavBar activeTab="clubs" />

      {/* Create Club Modal */}
      {showCreateModal && (
        <CreateClubModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(club) => {
            setClubs((prev) => [club, ...prev]);
            setShowCreateModal(false);
            router.push(`/clubs/${club.id}`);
          }}
          userId={user!.id}
        />
      )}
    </>
  );
}

// ===== Create Club Modal =====

function CreateClubModal({
  onClose,
  onCreated,
  userId,
}: {
  onClose: () => void;
  onCreated: (club: Club) => void;
  userId: string;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ClubCategory>('кино');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Введите название клуба');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadCover(imageFile);
      }
      const club = await createClub(name.trim(), description.trim(), category, imageUrl, userId);
      onCreated(club);
    } catch {
      setError('Не удалось создать клуб');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center glass-modal-overlay" onClick={onClose}>
      <div
        className="glass-modal rounded-3xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] block mb-1">Новое сообщество</span>
            <h2 className="text-2xl font-bold tracking-tight">Создать клуб</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Название клуба</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Клуб Любителей Нуара"
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите о чём ваш клуб..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Категория</label>
            <div className="flex gap-3">
              {(['кино', 'книги', 'арт'] as ClubCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                    category === cat
                      ? 'glass-action text-white shadow-lg shadow-primary/10'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-base mr-1 align-text-bottom">{CATEGORY_ICONS[cat]}</span>
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Обложка (необязательно)</label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            ) : (
              <label className="block w-full p-6 rounded-xl border-2 border-dashed border-outline-variant/30 text-center cursor-pointer hover:border-primary/40 transition-colors">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 block mb-2">add_photo_alternate</span>
                <span className="text-xs text-on-surface-variant">Нажмите для загрузки</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          {error && <p className="text-sm text-error font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-action text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Создаём...' : 'Создать клуб'}
          </button>
        </form>
      </div>
    </div>
  );
}
