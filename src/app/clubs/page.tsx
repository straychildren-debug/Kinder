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
import ClubLobbyModal from '@/components/ClubLobbyModal';

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
  const [selectedClubForLobby, setSelectedClubForLobby] = useState<Club | null>(null);
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
    const club = clubs.find(c => c.id === clubId);
    if (club?.userRole) {
      router.push(`/clubs/${clubId}`);
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
        {/* Spotlight Section (Option 1: Cinematic Dark) */}
        {!loading && activeMainTab === 'all' && heroClubs.length > 0 && searchQuery === '' && (
          <section className="mb-12">
            <div
              onClick={() => setSelectedClubForLobby(heroClubs[0])}
              className="relative aspect-[16/10] md:aspect-[21/9] w-full rounded-[32px] overflow-hidden group cursor-pointer border border-white/5 shadow-2xl animate-in fade-in zoom-in-95 duration-1000"
            >
              {/* Dynamic Mesh Gradient Background */}
              <div className="absolute inset-0 bg-[#0F172A] overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[100px] animate-pulse delay-700" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-amber-400/5 rounded-full blur-[80px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F172A]/80" />
              </div>

              {/* Glass Info Panel */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-20">
                <div className="bg-[#0F172A]/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-500 group-hover:bg-[#0F172A]/80">
                  
                  <div className="flex items-start md:items-center gap-5 min-w-0">
                    {/* Club Image/Avatar */}
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border border-white/20 shrink-0 shadow-2xl">
                      {heroClubs[0].imageUrl ? (
                        <Image
                          src={heroClubs[0].imageUrl}
                          alt={heroClubs[0].name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <span className="material-symbols-rounded text-white/20 text-3xl">groups</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2.5 py-0.5 bg-amber-400 text-black rounded-md text-[9px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.3)]">Популярное</span>
                        <div className="flex items-center gap-1.5 text-white/60">
                          <span className="material-symbols-rounded text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                          <span className="text-[12px] font-bold tracking-tight">{heroClubs[0].memberCount} участников</span>
                        </div>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-2 truncate">
                        {heroClubs[0].name}
                      </h2>
                      <p className="text-white/60 text-sm font-medium line-clamp-1 max-w-xl italic">
                        {heroClubs[0].description}
                      </p>
                    </div>
                  </div>

                  <button className="shrink-0 px-8 py-3.5 bg-white text-black rounded-xl font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition-all duration-300 shadow-2xl active:scale-95 whitespace-nowrap">
                    Вступить в клуб
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Header & Search Section */}
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
                placeholder="Поиск сообщества…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-low border border-on-surface/5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-on-surface/10 transition-all placeholder:text-on-surface-muted"
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

        {/* Navigation Tabs */}
        <div className="flex gap-8 mb-6 border-b border-on-surface/5 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveMainTab(tab.id as FilterTab)}
              className={`pb-4 border-b-2 text-[13px] font-black uppercase tracking-widest transition-all ${tab.disabled ? 'opacity-20 cursor-not-allowed' : ''
                } ${activeMainTab === tab.id
                  ? 'border-on-surface text-on-surface'
                  : 'border-transparent text-on-surface-muted hover:text-on-surface'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-Filters Chips with Icons */}
        <div className="flex gap-2.5 mb-10 overflow-x-auto scrollbar-hide py-1">
          {SUB_FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => setSubFilter(filter.id as SubFilter)}
              className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${subFilter === filter.id
                  ? 'bg-on-surface text-surface shadow-lg shadow-on-surface/10'
                  : 'bg-surface-container-low text-on-surface-muted hover:bg-surface-container border border-on-surface/5'
                }`}
            >
              <span className="material-symbols-rounded text-[18px]">
                {filter.id === 'all' ? 'dashboard' : (filter.id === 'movie' ? 'movie' : (filter.id === 'book' ? 'menu_book' : (filter.id === 'owner' ? 'shield_person' : 'person')))}
              </span>
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
              <div className="text-center py-24 bg-surface-container-low rounded-[32px] border border-on-surface/5">
                <span className="material-symbols-outlined text-6xl text-on-surface/10 mb-4 block">groups</span>
                <h3 className="text-xl font-bold mb-2 text-on-surface tracking-tight">Сообщества не найдены</h3>
                <p className="text-on-surface-muted text-sm font-medium">
                  {activeMainTab === 'my' ? 'Вы еще не вступили ни в один клуб' : 'Попробуйте изменить параметры поиска или фильтры'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredClubs.map((club, index) => (
                  <MotionListItem key={club.id} index={index}>
                    <div
                      onClick={() => setSelectedClubForLobby(club)}
                      className="bg-surface-container-low rounded-3xl p-5 flex gap-5 hover:bg-surface-container transition-all duration-500 border border-on-surface/5 cursor-pointer group h-auto relative overflow-hidden"
                    >
                      {/* Avatar/Thumbnail */}
                      <div className="w-16 h-16 bg-surface-container relative rounded-2xl overflow-hidden flex-shrink-0 shadow-xl border border-white/5">
                        {club.imageUrl ? (
                          <Image
                            src={club.imageUrl}
                            alt={club.name}
                            fill
                            sizes="64px"
                            placeholder="blur"
                            blurDataURL={defaultBlurDataURL}
                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full bg-surface-container flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-on-surface/10">
                              {CATEGORY_ICONS[club.category] || 'groups'}
                            </span>
                          </div>
                        )}
                        
                        {/* Status Pulse */}
                        {typeof club.unreadCount === 'number' && club.unreadCount > 0 && (
                          <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-surface-container shadow-sm animate-pulse" />
                        )}
                      </div>

                      {/* Info Section */}
                      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-black text-on-surface-muted uppercase tracking-widest">
                              {CATEGORY_LABELS[club.category] || club.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-on-surface text-[17px] tracking-tight line-clamp-1 leading-tight group-hover:text-primary transition-colors">
                            {club.name}
                          </h4>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-on-surface-muted/60">
                              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                              <span className="text-[12px] font-bold leading-none">
                                {club.memberCount}
                              </span>
                            </div>
                            {club.userRole === 'owner' && (
                              <span className="text-[9px] font-black bg-on-surface/10 text-on-surface px-2 py-1 rounded-md uppercase tracking-wider leading-none">
                                Владелец
                              </span>
                            )}
                            {typeof club.unreadCount === 'number' && club.unreadCount > 0 && (
                              <span className="text-[9px] font-black bg-red-500 text-white px-2 py-1 rounded-md uppercase tracking-wider leading-none">
                                {club.unreadCount} новых
                              </span>
                            )}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-on-surface/5 flex items-center justify-center text-on-surface/20 group-hover:bg-on-surface group-hover:text-surface transition-all duration-300">
                            <span className="material-symbols-outlined text-[20px]">
                              arrow_forward
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

      {/* Club Lobby Modal */}
      {selectedClubForLobby && (
        <ClubLobbyModal
          isOpen={!!selectedClubForLobby}
          onClose={() => setSelectedClubForLobby(null)}
          club={selectedClubForLobby}
          onJoin={handleJoin}
          isMember={!!selectedClubForLobby.userRole}
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
