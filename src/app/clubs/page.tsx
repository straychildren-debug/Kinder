'use client';

import React, { useState, useEffect, useRef } from 'react';
import TopNavBar from '@/components/TopNavBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useAuth } from '@/components/AuthProvider';
import { Club, ClubCategory } from '@/lib/types';
import { getClubs, createClub, joinClub, getUserApprovedCount, uploadCover } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ClubSkeletonList } from '@/components/Skeleton';
import { MotionListItem } from '@/components/Motion';
import Image from 'next/image';
import { defaultBlurDataURL } from '@/lib/image-blur';

const CATEGORY_LABELS: Record<string, string> = {
  'кино': 'КИНО',
  'книги': 'КНИГИ',
};

const CATEGORY_ICONS: Record<string, string> = {
  'кино': 'movie',
  'книги': 'menu_book',
};

type FilterTab = 'all' | 'my';
type SubFilter = 'all' | 'movie' | 'book' | 'owner' | 'member';

export default function Clubs() {
  const { user } = useAuth();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState<FilterTab>('all');
  const [subFilter, setSubFilter] = useState<SubFilter>('all');
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

  // Realtime
  useEffect(() => {
    if (!user || clubs.length === 0) return;

    const channel = supabase
      .channel(`clubs-list-unread-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'club_messages' },
        (payload) => {
          const row = payload.new as { club_id: string; user_id: string };
          if (row.user_id === user.id) return;
          setClubs((prev) =>
            prev.map((c) =>
              c.id === row.club_id
                ? { ...c, unreadCount: (c.unreadCount ?? 0) + 1 }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, clubs.length]);

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
      router.push(`/clubs/${clubId}`);
    }
  };

  // Logic for filtering
  const filteredClubs = React.useMemo(() => {
    let result = clubs.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Stage 1: Main Tab Filter
      if (activeMainTab === 'my') {
        if (!c.userRole) return false;

        // Stage 2: Role Sub-filter
        if (subFilter === 'owner') return c.userRole === 'owner';
        if (subFilter === 'member') return c.userRole === 'member';
      } else {
        // All Communities Tab
        // Stage 2: Category Sub-filter
        if (subFilter === 'movie') return c.category === 'кино';
        if (subFilter === 'book') return c.category === 'книги';
      }

      return true;
    });

    // Special sorting
    if (activeMainTab === 'my') {
      return result.sort((a, b) => {
        if (a.userRole === 'owner' && b.userRole !== 'owner') return -1;
        if (a.userRole !== 'owner' && b.userRole === 'owner') return 1;
        if ((b.unreadCount ?? 0) !== (a.unreadCount ?? 0)) return (b.unreadCount ?? 0) - (a.unreadCount ?? 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return result.sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0));
  }, [clubs, activeMainTab, subFilter, searchQuery]);

  // Reset subfilter when switching main tabs
  useEffect(() => {
    setSubFilter('all');
  }, [activeMainTab]);

  const heroClubs = [...clubs].sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0)).slice(0, 2);

  const TABS = [
    { id: 'all', label: 'Все сообщества' },
    { id: 'my', label: 'Мои клубы', disabled: !user }
  ];

  const SUB_FILTERS = activeMainTab === 'all'
    ? [
      { id: 'all', label: 'Все' },
      { id: 'movie', label: 'Кино' },
      { id: 'book', label: 'Книги' }
    ]
    : [
      { id: 'all', label: 'Все мои' },
      { id: 'owner', label: 'Я владелец' },
      { id: 'member', label: 'Я участник' }
    ];

  return (
    <>
      <TopNavBar />
      <main className="pt-24 px-6 max-w-7xl mx-auto pb-24">
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-5">
          <div>
            <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Сообщество</span>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface leading-tight">Клубы по интересам</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl">search</span>
              <input
                type="text"
                placeholder="Поиск клубов…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-on-surface/5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-on-surface/10 transition-all placeholder:text-on-surface-muted"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <button
                id="create-club-btn"
                onClick={handleCreateClick}
                className="bg-on-surface text-surface px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="font-semibold text-sm leading-none">Создать клуб</span>
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-on-surface text-surface px-3 py-2 rounded-lg whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-[16px]">info</span>
                    <span className="text-xs font-medium">Нужно ≥ 20 публикаций ({approvedCount})</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Tabs */}
        <div className="flex gap-8 mb-4 border-b border-on-surface/5 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveMainTab(tab.id as FilterTab)}
              className={`pb-3 border-b-2 text-sm font-semibold transition-all ${tab.disabled ? 'opacity-20 cursor-not-allowed' : ''
                } ${activeMainTab === tab.id
                  ? 'border-on-surface text-on-surface'
                  : 'border-transparent text-on-surface-muted hover:text-on-surface'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-Filters Chips */}
        <div className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide py-2">
          {SUB_FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => setSubFilter(filter.id as SubFilter)}
              className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap ${subFilter === filter.id
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container-low text-on-surface-muted hover:bg-surface-container'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && <ClubSkeletonList count={4} />}

        {/* Grid of Clubs */}
        {!loading && (
          <div className="min-h-[200px]">
            {filteredClubs.length === 0 ? (
              <div className="text-center py-16 bg-surface rounded-2xl border border-on-surface/5">
                <span className="material-symbols-outlined text-5xl text-on-surface/10 mb-3 block">groups</span>
                <h3 className="text-lg font-semibold mb-1 text-on-surface tracking-tight">Пока нет клубов</h3>
                <p className="text-on-surface-muted text-sm font-medium">
                  {activeMainTab === 'my' ? 'Вы еще не вступили ни в один клуб' : 'По вашему запросу ничего не найдено'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredClubs.map((club, index) => (
                  <MotionListItem key={club.id} index={index}>
                    <div
                      onClick={() => handleJoin(club.id)}
                      className="bg-surface rounded-2xl p-4 flex gap-4 hover:bg-surface-container-low transition-all duration-300 border border-on-surface/5 cursor-pointer group h-auto relative"
                    >
                      {/* Thumbnail with deep shadow */}
                      <div className="w-[60px] h-[90px] bg-surface-container relative rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-on-surface/5">
                        {club.imageUrl ? (
                          <Image
                            src={club.imageUrl}
                            alt={club.name}
                            fill
                            sizes="60px"
                            placeholder="blur"
                            blurDataURL={defaultBlurDataURL}
                            className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full bg-surface-container flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-on-surface/10">
                              {CATEGORY_ICONS[club.category] || 'groups'}
                            </span>
                          </div>
                        )}

                        {/* Status Tags Overlay on Image */}
                        {typeof club.unreadCount === 'number' && club.unreadCount > 0 && (
                          <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface shadow-sm animate-pulse" />
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 flex flex-col justify-between h-[90px] min-w-0 z-10">
                        <div className="min-w-0">
                          <span className="inline-block text-[11px] font-medium text-on-surface-muted mb-0.5">
                            {CATEGORY_LABELS[club.category] || club.category}
                          </span>
                          <h4 className="font-semibold text-on-surface text-[15px] tracking-tight line-clamp-2 leading-tight">
                            {club.name}
                          </h4>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-on-surface-muted">
                              <span className="material-symbols-outlined text-[14px]">groups</span>
                              <span className="text-[11px] font-medium leading-none">
                                {club.memberCount}
                              </span>
                            </div>
                            {club.userRole === 'owner' && (
                              <span className="text-[10px] font-semibold bg-on-surface text-surface px-2 py-0.5 rounded-md leading-none">
                                Владелец
                              </span>
                            )}
                            {typeof club.unreadCount === 'number' && club.unreadCount > 0 && (
                              <span className="text-[10px] font-semibold bg-red-500 text-white px-2 py-0.5 rounded-md leading-none">
                                +{club.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="text-on-surface-muted/40 group-hover:text-on-surface transition-colors duration-300">
                            <span className="material-symbols-outlined text-[18px]">
                              chevron_right
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </MotionListItem>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popular Spotlight Section */}
        {!loading && activeMainTab === 'all' && heroClubs.length > 0 && (
          <section className="mt-16 mb-24">
            <div className="flex items-center justify-between mb-8 px-2">
              <div>
                <span className="text-xs font-medium text-on-surface-muted mb-1.5 block">Рекомендации</span>
                <h2 className="text-2xl font-bold tracking-tight text-on-surface leading-tight">Популярные сообщества</h2>
              </div>
            </div>

              <div className="space-y-6">
                {/* Main spotlight - Premium Light Horizontal Concept */}
                {heroClubs[0] && (
                  <div
                    onClick={() => handleJoin(heroClubs[0].id)}
                    className="relative group cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-1000"
                  >
                    <div className="relative flex items-center justify-between gap-4 bg-white border border-on-surface/5 rounded-[24px] p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                      
                      <div className="flex items-center gap-4 md:gap-6 min-w-0 flex-1">
                        {/* Compact Avatar */}
                        <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-xl overflow-hidden border border-on-surface/5 shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-105">
                          {heroClubs[0].imageUrl ? (
                            <Image
                              src={heroClubs[0].imageUrl}
                              alt={heroClubs[0].name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-surface-container flex items-center justify-center">
                              <span className="material-symbols-rounded text-on-surface/20 text-3xl">groups</span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 bg-amber-400/10 text-amber-600 border border-amber-400/20 rounded-md text-[8px] font-black uppercase tracking-widest">Популярное</span>
                            <div className="flex items-center gap-1 text-on-surface/30">
                              <span className="material-symbols-rounded text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                              <span className="text-[10px] font-black tracking-tight">{heroClubs[0].memberCount}</span>
                            </div>
                          </div>
                          <h2 className="text-xl md:text-2xl font-black text-on-surface tracking-tighter leading-tight mb-1 truncate group-hover:text-primary transition-colors">
                            {heroClubs[0].name}
                          </h2>
                          <p className="text-on-surface-muted text-[11px] font-medium tracking-wide line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            {heroClubs[0].description}
                          </p>
                        </div>
                      </div>

                      {/* Premium Join Button */}
                      <div className="shrink-0">
                        <button className="px-6 py-2.5 bg-white text-on-surface border border-on-surface/10 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-on-surface hover:text-white hover:border-on-surface transition-all duration-300 active:scale-95 whitespace-nowrap">
                          Вступить
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
          </section>
        )}

        {/* Suggestion Section */}
        <section className="mt-16 p-10 bg-surface rounded-2xl border border-on-surface/5 text-center">
          <h3 className="text-2xl font-bold mb-3 text-on-surface tracking-tight">Не нашли то, что искали?</h3>
          <p className="text-on-surface-muted max-w-xl mx-auto mb-8 text-sm font-medium leading-relaxed">Создайте собственное сообщество и пригласите единомышленников для обсуждения любимых произведений в свободном формате.</p>
          <button
            onClick={handleCreateClick}
            className="bg-on-surface text-surface px-5 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
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
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${category === cat
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
              <div className="relative rounded-xl overflow-hidden h-40">
                <Image src={imagePreview} alt="Preview" fill sizes="400px" unoptimized className="object-cover" />
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
