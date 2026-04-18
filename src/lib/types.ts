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
  pinnedContentId?: string | null;
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
  rejectionReason?: string;
  moderatedBy?: string;
}

export interface Review {
  id: string;
  contentId: string;
  userId: string;
  text: string;
  rating: number;
  likes: number; // Left for backwards compatibility, maybe we replace with avgRating slowly
  avgRating?: number; // Fetched dynamically: the average of review_ratings 
  reviewRatingCount?: number; // Number of people who rated this review
  commentCount?: number;
  createdAt: string;
  user?: User; // Joined user info
}

export interface ReviewRating {
  id: string;
  reviewId: string;
  userId: string;
  rating: number;
  createdAt: string;
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  userId: string;
  text: string;
  createdAt: string;
  user?: User;
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
  userRole?: ClubRole | string | null;
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

export interface ClubMessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface ClubMessage {
  id: string;
  clubId: string;
  userId: string;
  text: string | null;
  fileUrl: string | null;
  fileType: 'image' | 'file' | 'voice' | null;
  voiceDurationSeconds?: number | null;
  createdAt: string;
  isEdited?: boolean;
  reactions?: ClubMessageReaction[];
  isPinned?: boolean;
  // Joined sender data
  senderName?: string;
  senderAvatar?: string;
  replyToId?: string | null;
  repliedMessage?: {
    text: string | null;
    senderName: string;
  } | null;
  user?: User; // Для профиля отправителя
}

// ===== Закреплённые сообщения =====

export interface PinnedMessage {
  id: string;
  clubId: string;
  messageId: string;
  pinnedBy: string;
  pinnedAt: string;
  message?: ClubMessage;
}

// ===== Опросы =====

export interface ClubPoll {
  id: string;
  clubId: string;
  createdBy: string;
  question: string;
  isAnonymous: boolean;
  isMultiple: boolean;
  isActive: boolean;
  createdAt: string;
  options?: ClubPollOption[];
  creatorName?: string;
  creatorAvatar?: string;
  totalVotes?: number;
}

export interface ClubPollOption {
  id: string;
  pollId: string;
  text: string;
  sortOrder: number;
  voteCount?: number;
  votedByMe?: boolean;
}

export interface ClubPollVote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: string;
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

export type AwardType =
  | 'first_review'
  | 'ten_reviews'
  | 'hundred_reviews'
  | 'first_publication'
  | 'ten_publications'
  | 'first_club'
  | 'marathon_winner';

export interface Award {
  id: string;
  userId: string;
  type: AwardType;
  payload: Record<string, unknown>;
  earnedAt: string;
}

export type ActivityType =
  | 'reviewed_content'
  | 'published_content'
  | 'joined_club'
  | 'completed_marathon'
  | 'earned_award';

export interface ActivityEvent {
  id: string;
  userId: string;
  type: ActivityType;
  refId: string | null;
  refType: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  // join
  userName?: string;
  userAvatar?: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  contentId: string;
  createdAt: string;
  content?: ContentItem;
}

export type NotificationType =
  | 'reply'
  | 'reaction'
  | 'mention'
  | 'club_invite'
  | 'marathon';

export interface Notification {
  id: string;
  userId: string;              // recipient
  actorId: string | null;      // who triggered
  type: NotificationType;
  clubId: string | null;
  messageId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
  // joined info for UI
  actorName?: string;
  actorAvatar?: string;
  clubName?: string;
}


