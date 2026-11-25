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
        content: "Wait, does this mean the next chapter is on break or confirmed weekly?",
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        upvotes: 7,
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
    upvotes: 29,
    comments: [
      {
        id: "c-3",
        author_name: "DenjiToast",
        content: "Every single week Fujimoto keeps subverting expectations. 10/10 chapter.",
        created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
        upvotes: 12,
      },
    ],
  },
  {
    id: "thread-3",
    category: "where_to_read",
    title: "Best Places to Buy Digital Volumes Legally with English Translation",
    author_name: "OfficialReader",
    author_avatar: null,
    content: "Here is a comparison between MANGA Plus, Kindle Amazon, and Kobo for digital manga collections.",
    manga_tag: "Guides",
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    upvotes: 35,
    comments: [],
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
    upvotes: 21,
    comments: [],
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
