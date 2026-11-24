"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Plus,
  ThumbsUp,
  Clock,
  User,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  X,
  Send,
  Flame,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SupporterAvatar from "@/components/SupporterAvatar";
import StaffBadge from "@/components/StaffBadge";
import {
  ForumThread,
  getForumThreads,
  fetchLiveForumThreads,
  createForumThread,
  addCommentToThread,
  upvoteThread,
} from "@/lib/forumStore";

const CATEGORIES = [
  { id: "all", label: "All Discussions", desc: "Everything manga, chapters, and community" },
  { id: "chapter_drops", label: "Chapter Drops", desc: "Live reactions & weekly chapter discussions" },
  { id: "general", label: "General & Theories", desc: "Series discussions, lore theories, and reviews" },
  { id: "where_to_read", label: "Legal Releases", desc: "MANGA Plus, Viz, K Manga & licensing news" },
  { id: "site_feedback", label: "Feedback", desc: "Feature suggestions & bug reports for MangaPulse" },
];

export default function ForumPage() {
  const { user, isLoggedIn, setAuthModalOpen, setAuthModalMode } = useAuth();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);

  // New Thread Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"chapter_drops" | "general" | "where_to_read" | "site_feedback">("chapter_drops");
  const [newTag, setNewTag] = useState("");
  const [newContent, setNewContent] = useState("");

  // Comment input state
  const [commentText, setCommentText] = useState("");

  const refreshThreads = () => {
    const list = getForumThreads();
    setThreads(list);
    if (selectedThread) {
      const updated = list.find((t) => t.id === selectedThread.id);
      if (updated) setSelectedThread(updated);
    }
  };

  useEffect(() => {
    refreshThreads();
    fetchLiveForumThreads().then((list) => {
      setThreads(list);
    });
    const handleUpdate = () => refreshThreads();
    window.addEventListener("mangapulse-forum-updated", handleUpdate);
    return () => window.removeEventListener("mangapulse-forum-updated", handleUpdate);
  }, [selectedThread?.id]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const author = user?.displayName || user?.username || "Reader";
    const author_avatar = user?.avatar_url || null;

    const created = await createForumThread(
      {
        category: newCategory,
        title: newTitle.trim(),
        content: newContent.trim(),
        manga_tag: newTag.trim() || null,
        author_name: author,
        author_avatar,
        author_role: user?.role || "USER",
      },
      user?.id
    );

    setModalOpen(false);
    setNewTitle("");
    setNewTag("");
    setNewContent("");
    setSelectedThread(created);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !commentText.trim()) return;

    const author = user?.displayName || user?.username || "Reader";
    const author_avatar = user?.avatar_url || null;

    await addCommentToThread(selectedThread.id, author, commentText.trim(), author_avatar, user?.id, user?.role || "USER");
    setCommentText("");
  };

  const handleUpvote = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    upvoteThread(threadId);
  };

  // Filter threads
  const filteredThreads = threads.filter((t) => {
    const matchesCat = activeCategory === "all" || t.category === activeCategory;
    const matchesSearch =
      !search.trim() ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.manga_tag && t.manga_tag.toLowerCase().includes(search.toLowerCase())) ||
      t.content.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-w-0 pb-20">
      {/* Header Banner */}
      <section className="bg-[#0c0e12] border-b border-[#1e2430] py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                MangaPulse Community Forum
              </h1>
            </div>
            <p className="text-xs text-[#94a1b5] mt-1">
              Discuss official simulpub drops, theorycraft chapters, and share official reading links with fellow fans.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Start Discussion</span>
          </button>
        </div>

        {/* Category Pills & Search */}
        <div className="max-w-7xl mx-auto mt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                  activeCategory === cat.id
                    ? "bg-[#1a1f2a] text-white border border-[#2a3344] shadow-sm"
                    : "text-[#94a1b5] hover:text-white hover:bg-[#13171f]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#5e6b82]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search discussions & tags..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#13171f] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Main Forum Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Threads List Column */}
          <div className={`${selectedThread ? "lg:col-span-1" : "lg:col-span-3"} space-y-3`}>
            <div className="flex items-center justify-between pb-2 border-b border-[#1e2430] text-xs text-[#94a1b5]">
              <span>Discussions ({filteredThreads.length})</span>
              <span className="font-mono text-[11px]">Latest Activity</span>
            </div>

            {filteredThreads.length > 0 ? (
              filteredThreads.map((thread) => {
                const isSelected = selectedThread?.id === thread.id;
                return (
                  <div
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#1a1f2a] border-blue-500 shadow-md"
                        : "bg-[#13171f] border-[#1e2430] hover:border-[#2a3344]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {thread.manga_tag && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {thread.manga_tag}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-[#5e6b82]">
                            {new Date(thread.created_at).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-white hover:text-blue-400 transition-colors line-clamp-2">
                          {thread.title}
                        </h3>
                        <p className="text-xs text-[#94a1b5] mt-1.5 line-clamp-2 leading-relaxed">
                          {thread.content}
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleUpvote(thread.id, e)}
                        className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#0c0e12] hover:bg-[#252f40] border border-[#2a3344] text-xs font-mono text-white transition-colors flex-shrink-0"
                        title="Upvote"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-blue-400" />
                        <span className="mt-1 font-bold">{thread.upvotes}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1e2430] text-xs text-[#5e6b82]">
                      <span className="flex items-center gap-1.5 text-white/80 font-medium">
                        <SupporterAvatar
                          avatarUrl={thread.author_avatar}
                          username={thread.author_name}
                          size="xs"
                          showBadge={false}
                        />
                        <span>{thread.author_name}</span>
                        <StaffBadge role={thread.author_role} />
                      </span>

                      <span className="flex items-center gap-1 font-mono text-[11px] text-[#94a1b5]">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{thread.comments?.length || 0} replies</span>
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-10 rounded-xl bg-[#13171f] border border-[#1e2430] text-center text-xs text-[#94a1b5]">
                No discussions found in this category. Be the first to start a conversation!
              </div>
            )}
          </div>

          {/* Active Thread Detail Column */}
          {selectedThread && (
            <div className="lg:col-span-2 space-y-4 animate-in fade-in">
              <div className="p-6 rounded-xl bg-[#13171f] border border-[#2a3344] relative">
                <button
                  onClick={() => setSelectedThread(null)}
                  className="absolute right-4 top-4 p-1.5 rounded text-[#94a1b5] hover:text-white hover:bg-[#1a1f2a]"
                  title="Close discussion view"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-2">
                  {selectedThread.manga_tag && (
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {selectedThread.manga_tag}
                    </span>
                  )}
                  <span className="text-xs text-[#5e6b82] flex items-center gap-1.5 flex-wrap">
                    <span>Posted by</span>
                    <strong className="text-white">{selectedThread.author_name}</strong>
                    <StaffBadge role={selectedThread.author_role} />
                    <span>•</span>
                    <span>
                      {new Date(selectedThread.created_at).toLocaleDateString([], {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white leading-snug">
                  {selectedThread.title}
                </h2>

                <div className="text-xs sm:text-sm text-[#c4cfde] mt-4 leading-relaxed whitespace-pre-line p-4 rounded-lg bg-[#0c0e12] border border-[#1e2430]">
                  {selectedThread.content}
                </div>

                {/* Reply section */}
                <div className="mt-6 pt-4 border-t border-[#1e2430]">
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-3">
                    Replies ({selectedThread.comments?.length || 0})
                  </h4>

                  {/* Comment List */}
                  <div className="space-y-3 mb-4">
                    {selectedThread.comments && selectedThread.comments.length > 0 ? (
                      selectedThread.comments.map((c) => (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-lg bg-[#0c0e12] border border-[#1e2430] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[#5e6b82] text-[11px]">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <SupporterAvatar
                                avatarUrl={c.author_avatar}
                                username={c.author_name}
                                size="xs"
                                showBadge={false}
                              />
                              <span>{c.author_name}</span>
                              <StaffBadge role={c.author_role} />
                            </span>
                            <span className="font-mono">
                              {new Date(c.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-[#c4cfde] leading-relaxed pt-1">{c.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-[#5e6b82] py-4 italic text-center">
                        No replies yet. Join the discussion below!
                      </div>
                    )}
                  </div>

                  {/* Reply Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write your reaction or thoughts..."
                      className="flex-1 px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Discussion Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg bg-[#13171f] border border-[#2a3344] rounded-xl p-4 sm:p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto overflow-x-hidden min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Create New Forum Thread</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-[#94a1b5] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-[#94a1b5] font-semibold mb-1">Board Category</label>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="chapter_drops">Weekly Chapter Drops & Live Reactions</option>
                  <option value="general">General Manga & Manhwa Discussions</option>
                  <option value="where_to_read">Official Where to Read & Legal Licensing</option>
                  <option value="site_feedback">MangaPulse Suggestions & Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-[#94a1b5] font-semibold mb-1">Manga Tag (Optional)</label>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g. One Piece, Chainsaw Man, Solo Leveling"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[#94a1b5] font-semibold mb-1">Discussion Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What is this discussion about?"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[#94a1b5] font-semibold mb-1">Content / Thoughts</label>
                <textarea
                  required
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share your perspective, chapter spoilers, or recommendation rationale..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#1a1f2a] text-[#94a1b5] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Post Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

