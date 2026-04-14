// ===== Типы данных для приложения Kinder =====

export type ContentType = 'book' | 'movie';
export type ContentStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  role: 'user' | 'moderator' | 'admin';
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
