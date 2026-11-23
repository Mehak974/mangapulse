"use client";

import React, { useState } from "react";
import { X, Upload, Download, Check, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchAniListUserLibrary, parseMALXml } from "@/lib/importer";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const { updateLibrary } = useAuth();
  const [activeTab, setActiveTab] = useState<"anilist" | "mal">("anilist");
  const [aniListUser, setAniListUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [importCount, setImportCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleAniListImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aniListUser.trim()) return;

    setErrorMsg("");
    setLoading(true);
    setImportCount(null);

    try {
      const entries = await fetchAniListUserLibrary(aniListUser);
      for (const entry of entries) {
        await updateLibrary(entry);
      }
      setImportCount(entries.length);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to import from AniList.");
    } finally {
      setLoading(false);
    }
  };

  const handleMALFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setLoading(true);
    setImportCount(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const entries = parseMALXml(text);
        for (const entry of entries) {
          await updateLibrary(entry);
        }
        setImportCount(entries.length);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to parse MyAnimeList XML file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#13171f] border border-[#2a3344] rounded-xl p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              <Download className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-bold text-sm">Import External Library</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#94a1b5] hover:text-white hover:bg-[#1a1f2a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex rounded-lg bg-[#0c0e12] p-1 border border-[#1e2430] my-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("anilist");
              setErrorMsg("");
            }}
            className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "anilist" ? "bg-[#1a1f2a] text-white" : "text-[#94a1b5] hover:text-white"
            }`}
          >
            <span>AniList (1-Click)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("mal");
              setErrorMsg("");
            }}
            className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "mal" ? "bg-[#1a1f2a] text-white" : "text-[#94a1b5] hover:text-white"
            }`}
          >
            <span>MyAnimeList (XML)</span>
          </button>
        </div>

        {/* Success Banner */}
        {importCount !== null && (
          <div className="p-3 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>Successfully imported {importCount} manga into your reading list!</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* AniList Tab */}
        {activeTab === "anilist" && (
          <form onSubmit={handleAniListImport} className="space-y-4">
            <p className="text-xs text-[#94a1b5] leading-relaxed">
              Instantly sync your public AniList manga list into MangaPulse. We will map your Reading, Planning, Completed, chapter progress, and scores.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#94a1b5] mb-1.5">
                AniList Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={aniListUser}
                  onChange={(e) => setAniListUser(e.target.value)}
                  placeholder="e.g. your_anilist_handle"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !aniListUser.trim()}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span>Fetching AniList Lists...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Start 1-Click Import</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* MyAnimeList Tab */}
        {activeTab === "mal" && (
          <div className="space-y-4">
            <p className="text-xs text-[#94a1b5] leading-relaxed">
              Export your list from MyAnimeList as an XML file (Settings &gt; Export List &gt; Manga), then upload it below to populate your MangaPulse library.
            </p>

            <label className="border-2 border-dashed border-[#2a3344] hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#0c0e12]/50">
              <Upload className="w-8 h-8 text-[#5e6b82] mb-2" />
              <div className="font-semibold text-xs text-white">
                {loading ? "Processing XML..." : "Choose MyAnimeList XML File"}
              </div>
              <div className="text-[11px] text-[#5e6b82] mt-1">
                Supports standard MAL export files (.xml, .gz)
              </div>
              <input
                type="file"
                accept=".xml"
                disabled={loading}
                onChange={handleMALFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

