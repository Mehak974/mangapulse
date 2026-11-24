export interface MangaTitle {
  english?: string | null;
  romaji?: string | null;
  native?: string | null;
  userPreferred?: string | null;
}

export interface MangaCover {
  extraLarge?: string | null;
  large?: string | null;
  medium?: string | null;
  color?: string | null;
}

export interface ReleaseSchedule {
  episodeOrChapter: number;
  airingAt: number; // Unix timestamp
  timeUntilAiring: number; // Seconds
}

export interface OfficialLink {
  name: string;
  url: string;
  badge: string;
  type: "free" | "subscription" | "purchase" | "official";
  icon?: string;
  isAffiliate?: boolean;
}

export interface MangaItem {
  id: number;
  slug: string;
  title: MangaTitle;
  displayTitle: string;
  coverImage: MangaCover;
  bannerImage?: string | null;
  description?: string | null;
  genres: string[];
  status: "RELEASING" | "FINISHED" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
  averageScore?: number | null; // 0-100
  popularity?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  countryOfOrigin?: string | null;
  startDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  };
  nextAiringChapter?: ReleaseSchedule | null;
  officialLinks?: OfficialLink[];
  synonyms?: string[];
}

export type LibraryStatus = "reading" | "plan_to_read" | "completed" | "dropped";

export interface UserPreferences {
  defaultView: "grid" | "list" | "compact";
  preferredPublisher: "all" | "mangaplus" | "viz" | "amazon";
  spoilerFilter: boolean;
  pushNotifications: boolean;
  weeklyGoalChapters: number;
  cadenceAlerts: boolean;
  is_private?: boolean;
}

export type UserRole = "USER" | "SUPPORTER" | "MODERATOR" | "ADMIN";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  location?: string | null;
  created_at: string;
  preferences?: UserPreferences;
  reading_goal?: number;
  is_verified?: boolean;
  is_supporter?: boolean;
  is_private?: boolean;
  supporter_tier?: string | null;
  kofi_email?: string | null;
  role?: UserRole;
  is_banned?: boolean;
  is_shadow_banned?: boolean;
  ban_reason?: string | null;
  banned_at?: string | null;
  last_login_at?: string | null;
  last_login_ip?: string | null;
  signup_ip?: string | null;
  auth_provider?: string | null;
}

export interface AuditLogItem {
  id: string;
  admin_id: string;
  admin_username?: string;
  admin_email?: string;
  action: string;
  target_id?: string | null;
  details?: Record<string, any> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface MangaOverrideItem {
  manga_slug: string;
  is_delisted: boolean;
  status_override?: "DELAYED" | "HIATUS" | "ONGOING" | "COMPLETED" | null;
  next_chapter_override?: number | null;
  target_timestamp_override?: number | null;
  reason?: string | null;
  updated_at: string;
}

export interface SitewideBroadcastItem {
  id: string;
  message: string;
  is_active: boolean;
  level: "info" | "warning" | "critical";
  created_at: string;
  updated_at: string;
}

export interface AdminTelemetryUser {
  id: string;
  email: string;
  username: string;
  display_name?: string | null;
  role: UserRole;
  created_at: string;
  last_login_at?: string | null;
  last_login_ip?: string | null;
  last_user_agent?: string | null;
  signup_ip?: string | null;
  auth_provider?: string | null;
  is_banned: boolean;
  is_shadow_banned: boolean;
  ban_reason?: string | null;
  banned_at?: string | null;
  country?: string | null;
}

export interface ActivityItem {
  id: string;
  manga_id: number;
  manga_title: string;
  manga_slug: string;
  manga_cover: string;
  action_type: "read_chapter" | "status_change" | "rated" | "note_added";
  chapter_number?: number;
  new_status?: LibraryStatus;
  rating?: number;
  timestamp: string;
}

export interface UserLibraryEntry {
  id: string;
  user_id: string;
  manga_id: number;
  manga_slug: string;
  manga_title: string;
  manga_cover: string;
  status: LibraryStatus;
  progress_chapter: number;
  total_chapters: number | null;
  rating: number | null; // 1-10
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  is_private: boolean;
  created_at: string;
  items?: CollectionManga[];
}

export interface CollectionManga {
  id: string;
  collection_id: string;
  manga_id: number;
  manga_slug: string;
  manga_title: string;
  manga_cover: string;
  added_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  manga_id?: number | null;
  title: string;
  message: string;
  url?: string | null;
  is_read: boolean;
  type: "release" | "countdown" | "system";
  created_at: string;
}

export interface MangaDisplaySettings {
  showCover: boolean;
  showTitle: boolean;
  showRating: boolean;
  showLatestChapter: boolean;
  showUnreadCount: boolean;
}

export interface MangaNoteEntry {
  manga_id: number;
  content: string;
  updated_at: string;
}
