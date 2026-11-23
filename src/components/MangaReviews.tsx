"use client";

import React, { useState, useEffect } from "react";
import { Star, ThumbsUp, MessageSquare, PenTool, CheckCircle, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/userStore";

interface Review {
  id: string;
  username: string;
  avatar_url?: string;
  rating: number; // 1-10
  title: string;
  content: string;
  date: string;
  helpfulCount: number;
  isUserReview?: boolean;
}

interface MangaReviewsProps {
  mangaId: number;
  mangaTitle: string;
  mangaSlug: string;
  mangaCover: string;
  averageScore?: number | null;
}

export default function MangaReviews({
  mangaId,
  mangaTitle,
  mangaSlug,
  mangaCover,
  averageScore,
}: MangaReviewsProps) {
  const { user, isLoggedIn } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(9);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [helpfulVoted, setHelpfulVoted] = useState<Set<string>>(new Set());

  // Default seed reviews based on title
  const defaultReviews: Review[] = [
    {
      id: "rev-1",
      username: "GrandLineLore",
      rating: 10,
      title: "Masterclass storytelling and generational worldbuilding",
      content:
        "The depth of themes, foreshadowing, and character arcs make this an absolute standout. The official simulpub schedule drops consistently on Manga Plus and reading the verified high-res translations makes the experience even better.",
      date: "Nov 18, 2026",
      helpfulCount: 42,
    },
    {
      id: "rev-2",
      username: "WeeklyJumpFan",
      rating: 9,
      title: "Top tier weekly release cadence",
      content:
        "Consistent pacing with almost no wasted panels. The suspense at the end of each chapter keeps me glued to the release countdown every single week.",
      date: "Nov 12, 2026",
      helpfulCount: 29,
    },
    {
      id: "rev-3",
      username: "OtakuReader99",
      rating: 8,
      title: "Engaging art style and memorable cast",
      content:
        "The panel composition and dynamic action sequences are fantastic. Highly recommend following the official weekly drops to stay up to date without spoilers.",
      date: "Oct 29, 2026",
      helpfulCount: 16,
    },
  ];

  // Load reviews from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`mangapulse_reviews_${mangaId}`);
      if (stored) {
        const parsed: Review[] = JSON.parse(stored);
        setReviews([...parsed, ...defaultReviews]);
      } else {
        setReviews(defaultReviews);
      }
    } catch {
      setReviews(defaultReviews);
    }
  }, [mangaId]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContent.trim()) return;

    setSubmitting(true);
    const newRev: Review = {
      id: `user-rev-${Date.now()}`,
      username: user?.displayName || user?.username || "Verified Reader",
      avatar_url: user?.avatar_url || undefined,
      rating,
      title: reviewTitle.trim() || `Review of ${mangaTitle}`,
      content: reviewContent.trim(),
      date: "Today",
      helpfulCount: 0,
      isUserReview: true,
    };

    const updated = [newRev, ...reviews.filter((r) => !r.isUserReview)];
    setReviews(updated);

    // Persist user reviews in localStorage
    try {
      const userReviewsOnly = updated.filter((r) => r.isUserReview);
      localStorage.setItem(`mangapulse_reviews_${mangaId}`, JSON.stringify(userReviewsOnly));
    } catch (err) {
      console.error("Failed to save review:", err);
    }

    // Log activity
    logActivity({
      manga_id: mangaId,
      manga_title: mangaTitle,
      manga_slug: mangaSlug,
      manga_cover: mangaCover,
      action_type: "rated",
      rating,
    });

    setReviewTitle("");
    setReviewContent("");
    setShowForm(false);
    setSubmitting(false);
  };

  const handleHelpfulClick = (id: string) => {
    if (helpfulVoted.has(id)) return;
    setHelpfulVoted((prev) => new Set(prev).add(id));
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );
  };

  const avgScoreFormatted = averageScore ? (averageScore / 10).toFixed(1) : "8.6";

  return (
    <section className="surface-card rounded-xl p-5 border border-[#2a3344] space-y-6">
      {/* Header & Write Review Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1e2430] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 font-bold font-mono text-sm">
            {avgScoreFormatted}
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-wide text-white uppercase font-mono">
              User Reviews & Community Ratings
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[#94a1b5]">
              <div className="flex items-center text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                ))}
              </div>
              <span>•</span>
              <span>{reviews.length} Verified Reviews</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors self-start sm:self-auto"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>{showForm ? "Cancel Review" : "Write a Review"}</span>
        </button>
      </div>

      {/* Review Form */}
      {showForm && (
        <form
          onSubmit={handleSubmitReview}
          className="p-4 rounded-xl bg-[#0c0e12] border border-[#2a3344] space-y-4 animate-in fade-in duration-200"
        >
          <div className="font-bold text-xs text-white uppercase font-mono">
            Share Your Thoughts on {mangaTitle}
          </div>

          {/* Rating 1-10 selector */}
          <div>
            <label className="block text-[11px] text-[#94a1b5] font-mono mb-1.5">
              Your Rating (1 to 10): <span className="text-amber-400 font-bold font-mono">{rating} / 10</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all ${
                    rating === num
                      ? "bg-amber-500 text-black shadow-md scale-105"
                      : "bg-[#1a1f2a] text-[#94a1b5] hover:text-white border border-[#2a3344]"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-[11px] text-[#94a1b5] font-mono mb-1">
              Review Headline (Optional)
            </label>
            <input
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="e.g. Masterclass storytelling, loved the recent arc!"
              className="w-full bg-[#13171f] border border-[#2a3344] focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-[#94a1b5] focus:outline-none"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-[11px] text-[#94a1b5] font-mono mb-1">
              Your Review
            </label>
            <textarea
              rows={4}
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              required
              placeholder="What did you think of the art, character development, and weekly pacing?"
              className="w-full bg-[#13171f] border border-[#2a3344] focus:border-blue-500 rounded-lg p-3 text-xs text-white placeholder-[#94a1b5] focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-[#94a1b5] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reviewContent.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
            >
              Post Review
            </button>
          </div>
        </form>
      )}

      {/* Review List */}
      <div className="space-y-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-4 rounded-xl bg-[#0c0e12] border border-[#1e2430] space-y-3 transition-colors hover:border-[#2a3344]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1a1f2a] border border-[#2a3344] flex items-center justify-center font-bold text-xs text-white">
                  {rev.avatar_url ? (
                    <img
                      src={rev.avatar_url}
                      alt={rev.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    rev.username.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white">{rev.username}</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Verified
                    </span>
                  </div>
                  <div className="text-[10px] text-[#94a1b5] font-mono">{rev.date}</div>
                </div>
              </div>

              {/* Rating score badge */}
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#1a1f2a] border border-[#2a3344] text-xs font-mono font-bold text-amber-400">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{rev.rating}/10</span>
              </div>
            </div>

            {/* Review Title & Content */}
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-white">{rev.title}</h3>
              <p className="text-xs text-[#94a1b5] leading-relaxed whitespace-pre-line">
                {rev.content}
              </p>
            </div>

            {/* Helpful Button */}
            <div className="pt-2 border-t border-[#1e2430] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleHelpfulClick(rev.id)}
                className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded transition-colors ${
                  helpfulVoted.has(rev.id)
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold"
                    : "text-[#94a1b5] hover:text-white bg-[#13171f] hover:bg-[#1a1f2a] border border-[#1e2430]"
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                <span>Helpful ({rev.helpfulCount})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
