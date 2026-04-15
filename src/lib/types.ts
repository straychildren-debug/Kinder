// ===== Типы данных для приложения Kinder =====

export type ContentType = 'book' | 'movie';
export type ContentStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
  stats: {
    publications: number;
    reviews: number;
    avgRating: number;
    followers: number;
    awards: number;
  };
  joinedAt: string;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  imageUrl: string;
  status: ContentStatus;
  createdBy: string; // user id
  createdAt: string;
  // Для фильмов
  director?: string;
  actors?: string[];
  year?: number;
  genre?: string[];
  duration?: string;
  // Для книг
  author?: string;
  pages?: number;
  publisher?: string;
  isbn?: string;
  // Общие
  rating?: number;
  reviewCount?: number;
  likeCount?: number;
}

export interface Review {
  id: string;
  contentId: string;
  userId: string;
  text: string;
  rating: number;
  likes: number;
  createdAt: string;
}

// ===== Клубы =====

export type ClubCategory = 'кино' | 'книги';
export type ClubRole = 'owner' | 'admin' | 'member';

export interface Club {
  id: string;
  name: string;
  description: string;
  category: ClubCategory;
  imageUrl: string;
  ownerId: string;
  createdAt: string;
  memberCount?: number;
  unreadCount?: number;
}

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  role: ClubRole;
  status? : 'pending' | 'approved' | 'rejected'; // Сохраняем для совместимости с логикой модерации, если она есть
  joinedAt: string;
  lastReadAt?: string;
  // Joined profile data
  userName?: string;
  userAvatar?: string;
  user?: User; // Для отображения информации о пользователе (join)
}

export interface ClubMessage {
  id: string;
  clubId: string;
  userId: string;
  text: string | null;
  fileUrl: string | null;
  fileType: 'image' | 'file' | null;
  createdAt: string;
  // Joined sender data
  senderName?: string;
  senderAvatar?: string;
  user?: User; // Для профиля отправителя
}

export interface ClubMarathon {
  id: string;
  clubId: string;
  title: string;
  type?: ContentType;
  description?: string;
  startDate?: string;
  endsAt: string;
  status?: 'active' | 'completed';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  items?: MarathonItem[];
}

export interface MarathonItem {
  id: string;
  marathonId: string;
  title: string;
}

export interface MarathonParticipantProgress {
  id: string;
  marathonId: string;
  userId: string;
  itemId: string;
  isCompleted: boolean;
  reviewText: string | null;
  updatedAt: string;
  userName?: string;
  userAvatar?: string;
}


