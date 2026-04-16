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
};

const CATEGORY_ICONS: Record<string, string> = {
  'кино': 'movie',
  'книги': 'menu_book',
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
    // Администраторы и суперадминистраторы могут создавать клубы без ограничений
    const isPowerUser = user.role === 'admin' || user.role === 'superadmin';
    
    if (!isPowerUser && approvedCount !== null && approvedCount < 20) {
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
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-2 block opacity-60">Сообщество</span>
            <h1 className="text-6xl font-black tracking-tighter text-on-surface leading-[0.9]">Клубы по<br/>интересам</h1>
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
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-surface border border-on-surface/5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-on-surface/5 transition-all shadow-sm"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <button
                id="create-club-btn"
                onClick={handleCreateClick}
                className="bg-on-surface text-surface px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-on-surface/10 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
              >
                <span className="material-symbols-outlined">add_circle</span>
                <span className="font-black text-[11px] uppercase tracking-widest">Создать клуб</span>
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-on-surface text-surface p-4 rounded-2xl shadow-2xl whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-base">info</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Нужно ≥ 20 публикаций ({approvedCount})</span>
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
                className="md:col-span-8 bg-surface rounded-[40px] overflow-hidden relative group shadow-2xl border border-on-surface/5 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-80"></div>
                {heroMain.imageUrl ? (
                  <img
                    alt={heroMain.name}
                    className="w-full h-[450px] object-cover group-hover:scale-110 transition-transform duration-[1500ms] ease-out"
                    src={heroMain.imageUrl}
                  />
                ) : (
                  <div className="w-full h-[450px] bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-huge text-on-surface-variant/10">{CATEGORY_ICONS[heroMain.category] || 'groups'}</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 p-10 z-20 w-full">
                  <div className="flex justify-between items-end gap-6 flex-wrap">
                    <div className="flex-1 min-w-[300px]">
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] text-white font-black uppercase tracking-[0.2em] mb-4 border border-white/10">Популярное</span>
                      <h2 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter leading-none">{heroMain.name}</h2>
                      <p className="text-white/70 text-sm max-w-md font-medium">{heroMain.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-white/40 text-[10px] font-black uppercase tracking-widest block mb-4">{heroMain.memberCount} участников</span>
                      <button className="bg-white text-on-surface px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
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
                className="md:col-span-4 bg-surface p-10 rounded-[40px] flex flex-col justify-between shadow-sm border border-on-surface/5 cursor-pointer hover:shadow-xl transition-all duration-500 hover:scale-[1.02]"
              >
                <div>
                  <div className="w-16 h-16 rounded-[24px] bg-surface-container flex items-center justify-center mb-10 shadow-inner">
                    <span className="material-symbols-outlined text-on-surface text-4xl">
                      {CATEGORY_ICONS[heroSide.category] || 'groups'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black mb-3 tracking-tight text-on-surface">{heroSide.name}</h3>
                  <p className="text-on-surface-variant text-sm font-medium leading-relaxed opacity-70">{heroSide.description}</p>
                </div>
                <div className="pt-10 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">{heroSide.memberCount} участников</span>
                  <button className="text-on-surface font-black text-[11px] uppercase tracking-widest hover:translate-x-1 transition-transform">Вступить →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-10 mb-10 border-b border-on-surface/5 overflow-x-auto whitespace-nowrap scrollbar-hide px-2">
          {([['all', 'Все сообщества'], ['кино', 'Кино'], ['книги', 'Книги']] as [FilterTab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`pb-4 border-b-[3px] text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                activeFilter === key
                  ? 'border-on-surface text-on-surface'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface opacity-40 hover:opacity-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-on-surface border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredClubs.length === 0 && (
          <div className="text-center py-24 bg-surface rounded-[40px] border border-on-surface/5">
            <span className="material-symbols-outlined text-8xl text-on-surface/5 mb-6 block">groups</span>
            <h3 className="text-2xl font-black mb-2 text-on-surface tracking-tight">Пока нет клубов</h3>
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest opacity-40">Станьте первым — создайте клуб!</p>
          </div>
        )}

        {/* Grid of Clubs */}
        {!loading && filteredClubs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredClubs.map((club) => (
              <div
                key={club.id}
                onClick={() => handleJoin(club.id)}
                className="bg-surface rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] shadow-sm border border-on-surface/5 cursor-pointer group"
              >
                <div className="h-44 bg-surface-container relative overflow-hidden">
                  {club.imageUrl ? (
                    <img
                      alt={club.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      src={club.imageUrl}
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-on-surface/5">
                        {CATEGORY_ICONS[club.category] || 'groups'}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className="px-2.5 py-1 bg-on-surface/90 backdrop-blur-md rounded-lg text-[9px] text-surface font-black uppercase tracking-widest">
                      {CATEGORY_LABELS[club.category] || club.category}
                    </div>
                    {typeof club.unreadCount === 'number' && club.unreadCount > 0 && (
                      <div className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse shadow-lg">
                        +{club.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="font-black text-on-surface text-lg mb-2 tracking-tight line-clamp-1">{club.name}</h4>
                  <p className="text-xs text-on-surface-variant font-medium line-clamp-2 mb-8 opacity-70 leading-relaxed ">{club.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">{club.memberCount} участников</span>
                    <button className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center group-hover:bg-on-surface transition-colors">
                      <span className="material-symbols-outlined text-on-surface-variant text-xl group-hover:text-surface">login</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggestion Section */}
        <section className="mt-24 p-16 bg-surface rounded-[40px] border border-on-surface/5 text-center shadow-sm">
          <h3 className="text-3xl font-black mb-4 text-on-surface tracking-tight">Не нашли то, что искали?</h3>
          <p className="text-on-surface-variant max-w-xl mx-auto mb-10 text-sm font-medium opacity-70  leading-relaxed">Создайте собственное сообщество и пригласите единомышленников для обсуждения любимых произведений в свободном формате.</p>
          <button
            onClick={handleCreateClick}
            className="bg-on-surface text-surface px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-2xl shadow-on-surface/20"
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
              {(['кино', 'книги'] as ClubCategory[]).map((cat) => (
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
                  className="absolute top-2 right-2 p-1.5 bg-on-surface/50 rounded-full text-white hover:bg-black/70 transition-colors"
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
