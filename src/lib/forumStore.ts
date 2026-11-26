import { supabase } from "./supabase";
import { containsLink, NO_LINKS_POLICY_MSG } from "./linkFilter";

export interface ForumComment {
  id: string;
  author_name: string;
  author_avatar?: string | null;
  author_role?: string | null;
  content: string;
  created_at: string;
  upvotes: number;
  is_deleted?: boolean;
}

export interface ForumThread {
  id: string;
  category: "chapter_drops" | "general" | "where_to_read" | "site_feedback";
  title: string;
  author_name: string;
  author_avatar?: string | null;
  author_role?: string | null;
  content: string;
  manga_tag?: string | null;
  created_at: string;
  upvotes: number;
  comments: ForumComment[];
  is_pinned?: boolean;
  is_locked?: boolean;
  is_deleted?: boolean;
}

const STORAGE_KEY = "mangapulse_forum_threads";

const SEED_THREADS: ForumThread[] = [
  {
    id: "thread-1",
    category: "chapter_drops",
    title: "One Piece Chapter 1135 Official Discussion & Reaction",
    author_name: "EiichiroFan",
    author_avatar: null,
    content: "The Elbaf arc lore drops are getting out of hand! What did you think of the giants' ancient prophecy revealed this chapter? Let's discuss official translations from MANGA Plus.",
    manga_tag: "One Piece",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    upvotes: 42,
    comments: [
      {
        id: "c-1",
        author_name: "LuffyG5",
        content: "The double spread on page 14 was absolute peak. Oda hasn't drawn backgrounds this detailed in years.",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        upvotes: 18,
      },
      {
        id: "c-2",
        author_name: "ZoroLost",
        content: "Confirmed weekly release cadence for next Sunday. No magazine break announced!",
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        upvotes: 7,
      },
      {
        id: "c-3",
        author_name: "NamiNavigator",
        content: "The official MANGA Plus translation clarified the wording on the giant warrior pledge. Much cleaner than initial summaries.",
        created_at: new Date(Date.now() - 3600000 * 0.5).toISOString(),
        upvotes: 11,
      },
    ],
  },
  {
    id: "thread-2",
    category: "chapter_drops",
    title: "Chainsaw Man Chapter 192 — Tatsuki Fujimoto Does It Again",
    author_name: "PochitaBite",
    author_avatar: null,
    content: "Tuesday drop on Jump+ and MANGA Plus. The cliffhanger ending left so many questions. Who was that silhouette in the final panel?",
    manga_tag: "Chainsaw Man",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    upvotes: 36,
    comments: [
      {
        id: "c-4",
        author_name: "DenjiToast",
        content: "Every single week Fujimoto keeps subverting expectations. 10/10 pacing right now.",
        created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
        upvotes: 14,
      },
      {
        id: "c-5",
        author_name: "MakimaGaze",
        content: "The visual storytelling with minimal dialogue in the subway corridor was incredible.",
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        upvotes: 9,
      },
      {
        id: "c-6",
        author_name: "AsaYoru",
        content: "Looking forward to next Tuesday's countdown. Hope we get answers on the Public Safety bureau moves.",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        upvotes: 5,
      },
    ],
  },
  {
    id: "thread-3",
    category: "where_to_read",
    title: "Best Places to Buy Digital Volumes Legally with English Translation",
    author_name: "OfficialReader",
    author_avatar: null,
    content: "Here is a comparison between MANGA Plus Max, Kindle Amazon, Viz Media, and K Manga for digital manga collections and simulpub readers.",
    manga_tag: "Guides",
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    upvotes: 45,
    comments: [
      {
        id: "c-7",
        author_name: "KindleCollector",
        content: "For physical copies and Kindle digital backups, Amazon is still the easiest. But for weekly simulpubs, MANGA Plus Max is unmatched value at $4.99/mo.",
        created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
        upvotes: 19,
      },
      {
        id: "c-8",
        author_name: "KodanshaFan",
        content: "K Manga has great exclusives like Blue Lock and Wind Breaker, though the ticket system took some getting used to.",
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        upvotes: 12,
      },
      {
        id: "c-9",
        author_name: "VizReader",
        content: "Viz vault subscription covers almost all classic Shonen Jump series back to the 90s. Highly recommended for binge reading.",
        created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        upvotes: 15,
      },
    ],
  },
  {
    id: "thread-4",
    category: "general",
    title: "Top 5 Ongoing Seinen Manga that Everyone Needs to Read in 2025",
    author_name: "GutsScholar",
    author_avatar: null,
    content: "Aside from Vinland Saga and Kingdom, what lesser-known seinen gems are you following on official platforms right now?",
    manga_tag: "Recommendations",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    upvotes: 38,
    comments: [
      {
        id: "c-10",
        author_name: "SeinenLover",
        content: "The Fable by Katsuhisa Minami is pure gold. Perfect blend of dry assassin comedy and grounded tension.",
        created_at: new Date(Date.now() - 3600000 * 40).toISOString(),
        upvotes: 16,
      },
      {
        id: "c-11",
        author_name: "HistorianManga",
        content: "Kingdom's current campaign arc has some of the best military strategy chapters since the Western Zhao invasion.",
        created_at: new Date(Date.now() - 3600000 * 26).toISOString(),
        upvotes: 11,
      },
      {
        id: "c-12",
        author_name: "InoueApprentice",
        content: "Real by Takehiko Inoue returning to serialization has been a highlight this year. The character depth is unmatched.",
        created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
        upvotes: 22,
      },
    ],
  },
  {
    id: "thread-5",
    category: "chapter_drops",
    title: "Dandadan Chapter 178 — The Fight Choreography is Unreal",
    author_name: "TurboGranny",
    author_avatar: null,
    content: "Yukinobu Tatsu's double spreads this week proved once again why Dandadan is one of the most dynamic weekly battle series running right now.",
    manga_tag: "Dandadan",
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    upvotes: 31,
    comments: [
      {
        id: "c-13",
        author_name: "OkarunAlien",
        content: "The transition between the alien tech and spiritual curses was handled seamlessly. The anime adaptation did justice to the early arcs too.",
        created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
        upvotes: 13,
      },
      {
        id: "c-14",
        author_name: "MomoSpiritual",
        content: "Tatsu worked as an assistant on Chainsaw Man and Hell's Paradise, and you can see that top-tier panel composition in every chapter.",
        created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
        upvotes: 17,
      },
    ],
  },
  {
    id: "thread-6",
    category: "general",
    title: "Solo Leveling: Ragnarok — How does the sequel manhwa hold up?",
    author_name: "ShadowMonarch",
    author_avatar: null,
    content: "Following Sung Suho's journey as Jinwoo's successor. The art style by Redice Studio maintains the high polish of the original series.",
    manga_tag: "Solo Leveling",
    created_at: new Date(Date.now() - 3600000 * 55).toISOString(),
    upvotes: 49,
    comments: [
      {
        id: "c-15",
        author_name: "SungHunter",
        content: "I was skeptical at first about a sequel, but exploring the outer gods and monarch lore has actually expanded the world meaningfully.",
        created_at: new Date(Date.now() - 3600000 * 46).toISOString(),
        upvotes: 21,
      },
      {
        id: "c-16",
        author_name: "BeruLoyal",
        content: "Beru accompanying Suho provides the exact right comedic relief while keeping the stakes high.",
        created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
        upvotes: 27,
      },
    ],
  },
  {
    id: "thread-7",
    category: "chapter_drops",
    title: "Blue Lock Chapter 286 — Neo Egoist League Climax & Strategy",
    author_name: "EgoJinpachi",
    author_avatar: null,
    content: "Munchen vs Ubers and the final matches are setting up the U-20 World Cup arc. Who is your personal pick for the starting striker spot?",
    manga_tag: "Blue Lock",
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
    upvotes: 28,
    comments: [
      {
        id: "c-17",
        author_name: "IsagiMetavision",
        content: "Isagi adapting his puzzle pieces mid-play is always entertaining. Wednesday simulpub on K Manga has been consistent.",
        created_at: new Date(Date.now() - 3600000 * 11).toISOString(),
        upvotes: 14,
      },
      {
        id: "c-18",
        author_name: "RinDestroyer",
        content: "The rivalry between Rin and Isagi is at an all-time high. Can't wait for next week's drop.",
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        upvotes: 10,
      },
    ],
  },
  {
    id: "thread-8",
    category: "site_feedback",
    title: "Feature Suggestions: Push Notifications & Library Export for MangaPulse",
    author_name: "PulseExplorer",
    author_avatar: null,
    content: "Loving the clean countdown timers and official read buttons. Would love to see web push notifications when chapters drop and AniList/MAL library sync!",
    manga_tag: "Feedback",
    created_at: new Date(Date.now() - 3600000 * 60).toISOString(),
    upvotes: 52,
    comments: [
      {
        id: "c-19",
        author_name: "WebDevFan",
        content: "The dark/light theme switch and mobile responsiveness work great on iOS. Push notifications would make the countdown timers even more convenient.",
        created_at: new Date(Date.now() - 3600000 * 42).toISOString(),
        upvotes: 23,
      },
      {
        id: "c-20",
        author_name: "TrackMaster",
        content: "Big fan of how all links lead to verified publishers (MANGA Plus, Viz). Makes tracking multiple weekly series effortless.",
        created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
        upvotes: 18,
      },
    ],
  },
];

export function getForumThreads(): ForumThread[] {
  if (typeof window === "undefined") return SEED_THREADS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED_THREADS;
  } catch {
    return SEED_THREADS;
  }
}

export function saveForumThreads(threads: ForumThread[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    window.dispatchEvent(new Event("mangapulse-forum-updated"));
  } catch (err) {
    console.error("Save forum error:", err);
  }
}

/**
 * Fetch threads from Supabase database if available, merging with local state.
 */
export async function fetchLiveForumThreads(): Promise<ForumThread[]> {
  if (supabase) {
    try {
      const { data: dbThreads, error } = await supabase
        .from("forum_threads")
        .select(`
          id,
          category_id,
          title,
          content,
          likes_count,
          created_at,
          author_id,
          profiles:author_id (username, avatar_url),
          forum_posts (
            id,
            content,
            likes_count,
            created_at,
            author_id,
            profiles:author_id (username, avatar_url)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && dbThreads && dbThreads.length > 0) {
        const mapped: ForumThread[] = dbThreads.map((t: any) => ({
          id: t.id,
          category: t.category_id as any,
          title: t.title,
          author_name: t.profiles?.username || "Reader",
          author_avatar: t.profiles?.avatar_url || null,
          content: t.content,
          created_at: t.created_at,
          upvotes: t.likes_count || 0,
          comments: (t.forum_posts || []).map((p: any) => ({
            id: p.id,
            author_name: p.profiles?.username || "Reader",
            author_avatar: p.profiles?.avatar_url || null,
            content: p.content,
            created_at: p.created_at,
            upvotes: p.likes_count || 0,
          })),
        }));

        saveForumThreads(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("Could not fetch remote forum threads:", err);
    }
  }

  return getForumThreads();
}

export async function createForumThread(
  thread: Omit<ForumThread, "id" | "created_at" | "upvotes" | "comments">,
  authorId?: string
): Promise<ForumThread> {
  if (
    containsLink(thread.title) ||
    containsLink(thread.content) ||
    (thread.manga_tag && containsLink(thread.manga_tag))
  ) {
    throw new Error(NO_LINKS_POLICY_MSG);
  }

  const localList = getForumThreads();
  const tempId = `thread-${Date.now()}`;
  const newThread: ForumThread = {
    ...thread,
    id: tempId,
    created_at: new Date().toISOString(),
    upvotes: 1,
    comments: [],
  };

  localList.unshift(newThread);
  saveForumThreads(localList);

  // Persist to Supabase if authenticated
  if (supabase && authorId && authorId !== "guest") {
    try {
      const { data, error } = await supabase
        .from("forum_threads")
        .insert({
          category_id: thread.category,
          author_id: authorId,
          title: thread.title,
          content: thread.content,
        })
        .select()
        .single();

      if (!error && data) {
        newThread.id = data.id;
        saveForumThreads(localList);
      }
    } catch (err) {
      console.warn("Could not insert thread to Supabase:", err);
    }
  }

  return newThread;
}

export async function addCommentToThread(
  threadId: string,
  author_name: string,
  content: string,
  author_avatar?: string | null,
  authorId?: string,
  author_role?: string | null
): Promise<ForumComment | null> {
  if (containsLink(content)) {
    throw new Error(NO_LINKS_POLICY_MSG);
  }

  const list = getForumThreads();
  const thread = list.find((t) => t.id === threadId);
  if (!thread) return null;

  const newComment: ForumComment = {
    id: `c-${Date.now()}`,
    author_name,
    author_avatar,
    author_role: author_role || null,
    content: content.trim(),
    created_at: new Date().toISOString(),
    upvotes: 0,
  };

  thread.comments = thread.comments || [];
  thread.comments.push(newComment);
  saveForumThreads(list);

  // Persist to Supabase if UUID format thread
  if (supabase && authorId && authorId !== "guest" && threadId.length > 20) {
    try {
      await supabase.from("forum_posts").insert({
        thread_id: threadId,
        author_id: authorId,
        content: content.trim(),
      });
    } catch (err) {
      console.warn("Could not insert post to Supabase:", err);
    }
  }

  return newComment;
}

export function upvoteThread(threadId: string): void {
  const list = getForumThreads();
  const thread = list.find((t) => t.id === threadId);
  if (thread) {
    thread.upvotes += 1;
    saveForumThreads(list);
  }
}
