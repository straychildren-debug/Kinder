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
        <header className="mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-muted mb-2 block">Сообщество</span>
            <h1 className="text-6xl font-black tracking-tighter text-on-surface leading-[0.9]">Клубы по<br/>интересам</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl">search</span>
              <input
                type="text"
                placeholder="Поиск клубов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-on-surface/5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-on-surface/[0.03] transition-all shadow-sm placeholder:text-on-surface-muted"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <button
                id="create-club-btn"
                onClick={handleCreateClick}
                className="bg-on-surface text-surface px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-on-surface/10 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <span className="font-black text-[10px] uppercase tracking-widest leading-none">Создать клуб</span>
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-on-surface text-surface p-4 rounded-xl shadow-2xl whitespace-nowrap">
                   <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-base">info</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Нужно ≥ 20 публикаций ({approvedCount})</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Tabs */}
        <div className="flex gap-10 mb-4 border-b border-on-surface/5 overflow-x-auto whitespace-nowrap scrollbar-hide px-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveMainTab(tab.id as FilterTab)}
              className={`pb-4 border-b-[3px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                tab.disabled ? 'opacity-20 cursor-not-allowed' : ''
              } ${
                activeMainTab === tab.id
                  ? 'border-on-surface text-on-surface'
                  : 'border-transparent text-on-surface-muted hover:text-on-surface hover:opacity-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-Filters Chips */}
        <div className="flex gap-2 mb-10 overlow-x-auto scrollbar-hide py-2">
           {SUB_FILTERS.map(filter => (
             <button
               key={filter.id}
               onClick={() => setSubFilter(filter.id as SubFilter)}
               className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                 subFilter === filter.id 
                  ? 'bg-on-surface text-surface shadow-md' 
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
          <div className="min-h-[400px]">
            {filteredClubs.length === 0 ? (
              <div className="text-center py-24 bg-surface rounded-3xl border border-on-surface/5 opacity-50">
                <span className="material-symbols-outlined text-8xl text-on-surface/5 mb-6 block">groups</span>
                <h3 className="text-2xl font-black mb-2 text-on-surface tracking-tight">Пока нет клубов</h3>
                <p className="text-on-surface-muted text-[10px] font-black uppercase tracking-widest">
                  {activeMainTab === 'my' ? 'Вы еще не вступили ни в один клуб' : 'По вашему запросу ничего не найдено'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredClubs.map((club, index) => (
                  <MotionListItem key={club.id} index={index}>
                    <div
                      onClick={() => handleJoin(club.id)}
                      className="bg-surface rounded-2xl p-3 flex gap-4 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] shadow-sm border border-on-surface/5 cursor-pointer group h-[124px]"
                    >
                      {/* Thumbnail */}
                      <div className="w-24 h-full bg-surface-container relative rounded-xl overflow-hidden flex-shrink-0">
                        {club.imageUrl ? (
                          <Image
                            src={club.imageUrl}
                            alt={club.name}
                            fill
                            sizes="120px"
                            placeholder="blur"
                            blurDataURL={defaultBlurDataURL}
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-surface-container flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-on-surface/5">
                              {CATEGORY_ICONS[club.category] || 'groups'}
                            </span>
                          </div>
                        )}
                        {/* Status Tags Overlay on Image */}
                        {typeof club.unreadCount === 'number' && club.unreadCount > 0 && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-surface animate-pulse" />
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-1.5 py-0.5 bg-on-surface/[0.03] text-[8px] font-black text-on-surface-muted rounded uppercase tracking-widest">
                              {CATEGORY_LABELS[club.category] || club.category}
                            </span>
                            <h4 className="font-black text-on-surface text-sm tracking-tight truncate leading-none">
                              {club.name}
                            </h4>
                          </div>
                          <p className="text-[10px] text-on-surface-muted font-medium line-clamp-2 leading-relaxed">
                            {club.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <span className="text-[8px] font-bold uppercase tracking-widest text-on-surface-muted opacity-40">
                              {club.memberCount} участников
                            </span>
                            {club.userRole === 'owner' && (
                              <span className="text-[7px] font-black uppercase tracking-widest bg-accent-lilac/10 text-accent-lilac px-1.5 py-0.5 rounded">
                                Владелец
                              </span>
                            )}
                            {typeof club.unreadCount === 'number' && club.unreadCount > 0 && (
                               <span className="text-[7px] font-black uppercase tracking-widest bg-red-500 text-white px-1.5 py-0.5 rounded">
                                +{club.unreadCount} сообщ.
                               </span>
                            )}
                          </div>
                          <button className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center group-hover:bg-on-surface transition-colors">
                            <span className="material-symbols-outlined text-on-surface-muted text-base group-hover:text-surface">
                              login
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </MotionListItem>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popular Bento Grid (Moved here and conditional) */}
        {!loading && activeMainTab === 'all' && heroClubs.length > 0 && (
          <section className="mt-24">
            <div className="flex items-center justify-between mb-8 px-2">
               <div>
                 <h2 className="text-3xl font-black tracking-tight text-on-surface leading-none mb-1">Популярные сообщества</h2>
                 <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted opacity-40">Клубы с самым большим количеством участников</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
              {/* Large Featured Card */}
              {heroClubs[0] && (
                <div
                  onClick={() => handleJoin(heroClubs[0].id)}
                  className="md:col-span-8 bg-surface rounded-3xl overflow-hidden relative group shadow-xl border border-on-surface/5 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-80"></div>
                  <div className="relative w-full h-[450px]">
                    {heroClubs[0].imageUrl ? (
                      <Image
                        src={heroClubs[0].imageUrl}
                        alt={heroClubs[0].name}
                        fill
                        sizes="(min-width: 768px) 66vw, 100vw"
                        placeholder="blur"
                        blurDataURL={defaultBlurDataURL}
                        className="object-cover group-hover:scale-110 transition-transform duration-[1500ms] ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant/10">
                        <span className="material-symbols-outlined text-huge">{CATEGORY_ICONS[heroClubs[0].category] || 'groups'}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 p-10 z-20 w-full">
                    <div className="flex justify-between items-end gap-6 flex-wrap">
                      <div className="flex-1 min-w-[300px]">
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] text-white font-black uppercase tracking-[0.2em] mb-4 border border-white/10 shadow-sm">Популярное</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter leading-none">{heroClubs[0].name}</h2>
                        <p className="text-white/70 text-sm max-w-md font-medium leading-relaxed">{heroClubs[0].description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-white/40 text-[9px] font-black uppercase tracking-widest block mb-4">{heroClubs[0].memberCount} участников</span>
                        <button className="bg-white text-on-surface px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
                          Вступить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Side Card */}
              {heroClubs[1] && (
                <div
                  onClick={() => handleJoin(heroClubs[1].id)}
                  className="md:col-span-4 bg-surface p-8 rounded-3xl flex flex-col justify-between shadow-sm border border-on-surface/5 cursor-pointer hover:shadow-xl transition-all duration-500 hover:scale-[1.02]"
                >
                  <div>
                    <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center mb-10 shadow-inner border border-on-surface/[0.02]">
                      <span className="material-symbols-outlined text-on-surface text-4xl">
                        {CATEGORY_ICONS[heroClubs[1].category] || 'groups'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black mb-2 tracking-tight text-on-surface leading-none">{heroClubs[1].name}</h3>
                    <p className="text-on-surface-muted text-sm font-medium leading-relaxed">{heroClubs[1].description}</p>
                  </div>
                  <div className="pt-10 flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-muted opacity-40">{heroClubs[1].memberCount} участников</span>
                    <button className="text-on-surface font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform leading-none">Вступить →</button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Suggestion Section */}
        <section className="mt-24 p-12 bg-surface rounded-3xl border border-on-surface/5 text-center shadow-sm">
          <h3 className="text-3xl font-black mb-4 text-on-surface tracking-tight">Не нашли то, что искали?</h3>
          <p className="text-on-surface-variant max-w-xl mx-auto mb-10 text-sm font-medium opacity-70  leading-relaxed">Создайте собственное сообщество и пригласите единомышленников для обсуждения любимых произведений в свободном формате.</p>
          <button
            onClick={handleCreateClick}
            className="bg-on-surface text-surface px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-on-surface/10"
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
