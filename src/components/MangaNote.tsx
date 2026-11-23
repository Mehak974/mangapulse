"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMangaNote, saveMangaNote, deleteMangaNote } from "@/lib/chapterStore";
import { StickyNote, Edit3, Trash2, Check, Lock, Save, Bold, Italic, List } from "lucide-react";

interface MangaNoteProps {
  mangaId: number;
  mangaTitle: string;
}

export default function MangaNote({ mangaId, mangaTitle }: MangaNoteProps) {
  const { isLoggedIn, setAuthModalOpen, setAuthModalMode } = useAuth();
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [savedTime, setSavedTime] = useState<string | null>(null);

  useEffect(() => {
    const note = getMangaNote(mangaId);
    setContent(note);
    if (!note) {
      // Keep closed by default if empty, or open if user clicks
      setIsEditing(false);
    }
  }, [mangaId]);

  const handleSave = () => {
    saveMangaNote(mangaId, content);
    setIsEditing(false);
    setSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };

  const handleDelete = () => {
    if (confirm("Delete this personal note?")) {
      deleteMangaNote(mangaId);
      setContent("");
      setIsEditing(false);
    }
  };

  const insertFormat = (prefix: string, suffix = "") => {
    setContent((prev) => `${prev}${prefix}Text${suffix}`);
  };

  return (
    <div className="surface-card rounded-xl p-5 border border-[#2a3344] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">
            Private Reading Note
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0c0e12] text-[#94a1b5] border border-[#1e2430] flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 text-[#5e6b82]" />
            Only visible to you
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-2.5 py-1 rounded bg-[#1a1f2a] hover:bg-[#222938] text-[#94a1b5] hover:text-white border border-[#2a3344] text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              <span>{content ? "Edit Note" : "+ Add Note"}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              {content && (
                <button
                  onClick={handleDelete}
                  className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleSave}
                className="px-3 py-1 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                <Save className="w-3 h-3" />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Body */}
      {isEditing ? (
        <div className="space-y-2">
          {/* Format Toolbar */}
          <div className="flex items-center gap-1 p-1 bg-[#0c0e12] rounded border border-[#1e2430] text-xs">
            <button
              type="button"
              onClick={() => insertFormat("**", "**")}
              className="p-1 px-1.5 rounded text-[#94a1b5] hover:text-white hover:bg-[#1a1f2a]"
              title="Bold"
            >
              <Bold className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => insertFormat("*", "*")}
              className="p-1 px-1.5 rounded text-[#94a1b5] hover:text-white hover:bg-[#1a1f2a]"
              title="Italic"
            >
              <Italic className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => insertFormat("\n- ")}
              className="p-1 px-1.5 rounded text-[#94a1b5] hover:text-white hover:bg-[#1a1f2a]"
              title="List item"
            >
              <List className="w-3 h-3" />
            </button>
            <span className="ml-auto text-[10px] font-mono text-[#5e6b82]">
              {content.length} characters
            </span>
          </div>

          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your private notes: thoughts on current arc, favorite chapter, reading pace, physical volume owned..."
            className="w-full bg-[#0c0e12] border border-[#2a3344] rounded-lg p-3 text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 font-sans leading-relaxed resize-y"
          />

          {!isLoggedIn && (
            <div className="text-[11px] text-[#5e6b82] flex items-center justify-between">
              <span>Saved locally in browser storage.</span>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("login");
                  setAuthModalOpen(true);
                }}
                className="text-blue-400 hover:underline font-medium"
              >
                Sign in to sync across devices →
              </button>
            </div>
          )}
        </div>
      ) : content ? (
        <div className="p-3 bg-[#0c0e12] rounded-lg border border-[#1e2430] text-xs text-[#f0f3f8] leading-relaxed whitespace-pre-wrap font-sans">
          {content}
          {savedTime && (
            <div className="mt-2 text-[10px] font-mono text-[#5e6b82]">
              Saved at {savedTime}
            </div>
          )}
        </div>
      ) : (
        <div className="py-3 text-center text-xs text-[#5e6b82]">
          No private notes written for this title yet. Click &quot;+ Add Note&quot; to write thoughts, volume tracking, or arc reactions.
        </div>
      )}
    </div>
  );
}

