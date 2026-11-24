"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  MessageSquare,
  Clock,
  Radio,
  FileText,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Ban,
  UserCheck,
  Ghost,
  Trash2,
  RefreshCw,
  ExternalLink,
  Pin,
  Lock,
  Unlock,
  Play,
  EyeOff,
  Flame,
  Globe,
  Loader2,
  ChevronRight,
  Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  AdminTelemetryUser,
  AuditLogItem,
  MangaOverrideItem,
  SitewideBroadcastItem,
  UserRole,
} from "@/types/manga";

type AdminTab = "users" | "forum" | "countdowns" | "dmca" | "broadcast" | "audit";

interface MetricsState {
  totalUsers: number;
  todayActive: number;
  activeCountdowns: number;
  pendingReports: number;
  delistedCount: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Metrics
  const [metrics, setMetrics] = useState<MetricsState>({
    totalUsers: 0,
    todayActive: 0,
    activeCountdowns: 0,
    pendingReports: 0,
    delistedCount: 0,
  });

  // Users Tab State
  const [users, setUsers] = useState<AdminTelemetryUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminTelemetryUser | null>(null);

  // Forum Tab State
  const [forumThreads, setForumThreads] = useState<any[]>([]);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [forumSubTab, setForumSubTab] = useState<"threads" | "posts">("threads");

  // Countdowns Tab State
  const [overrides, setOverrides] = useState<MangaOverrideItem[]>([]);
  const [overrideSlug, setOverrideSlug] = useState("");
  const [overrideStatus, setOverrideStatus] = useState<string>("ONGOING");
  const [overrideChapter, setOverrideChapter] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");
  const [botRunning, setBotRunning] = useState(false);
  const [botResult, setBotResult] = useState<any | null>(null);

  // DMCA Tab State
  const [dmcaSlug, setDmcaSlug] = useState("");
  const [dmcaReason, setDmcaReason] = useState("DMCA Takedown Notice / Rights Holder Formal Request");
  const [delistedList, setDelistedList] = useState<any[]>([]);

  // Broadcast Tab State
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastLevel, setBroadcastLevel] = useState<"info" | "warning" | "critical">("info");
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState<SitewideBroadcastItem | null>(null);

  // Audit Logs Tab State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const getAuthToken = async (): Promise<string> => {
    if (!supabase) return "";
    let { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      await new Promise((r) => setTimeout(r, 300));
      const retry = await supabase.auth.getSession();
      session = retry.data.session;
    }
    return session?.access_token || "";
  };

  // ── Fetch Metrics ──
  const fetchMetrics = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/metrics", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.metrics) {
          setMetrics(data.metrics);
        }
        if (data?.activeBroadcast) {
          setActiveBroadcast(data.activeBroadcast);
          setBroadcastMessage(data.activeBroadcast.message);
          setBroadcastLevel(data.activeBroadcast.level);
          setBroadcastActive(data.activeBroadcast.is_active);
        }
      }
    } catch (err) {
      console.error("Failed to load metrics:", err);
    }
  }, []);

  // ── Fetch Users ──
  const fetchUsers = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams();
      if (userSearch) params.set("q", userSearch);
      if (userFilter !== "all") params.set("filter", userFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }, [userSearch, userFilter]);

  // ── Fetch Forum ──
  const fetchForum = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/forum?mode=${forumSubTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (forumSubTab === "threads") setForumThreads(data.threads || []);
        else setForumPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to load forum items:", err);
    }
  }, [forumSubTab]);

  // ── Fetch Countdowns & DMCA ──
  const fetchOverridesAndDmca = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const [overridesRes, dmcaRes] = await Promise.all([
        fetch("/api/admin/countdowns", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/dmca", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (overridesRes.ok) {
        const oData = await overridesRes.json();
        setOverrides(oData.overrides || []);
      }
      if (dmcaRes.ok) {
        const dData = await dmcaRes.json();
        setDelistedList(dData.delisted || []);
      }
    } catch (err) {
      console.error("Failed to load countdowns/dmca:", err);
    }
  }, []);

  // ── Fetch Audit Logs ──
  const fetchAuditLogs = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/audit", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    }
  }, []);

  // Initial Load & Session Sync
  useEffect(() => {
    let active = true;

    async function init() {
      setLoading(true);
      await Promise.all([fetchMetrics(), fetchUsers()]);
      if (active) setLoading(false);
    }

    init();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.access_token && active) {
          fetchMetrics();
          fetchUsers();
        }
      });
      return () => {
        active = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      active = false;
    };
  }, [fetchMetrics, fetchUsers]);

  // Tab change handler
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab === "users") fetchUsers();
    else if (tab === "forum") fetchForum();
    else if (tab === "countdowns" || tab === "dmca") fetchOverridesAndDmca();
    else if (tab === "audit") fetchAuditLogs();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchMetrics(),
      activeTab === "users" && fetchUsers(),
      activeTab === "forum" && fetchForum(),
      (activeTab === "countdowns" || activeTab === "dmca") && fetchOverridesAndDmca(),
      activeTab === "audit" && fetchAuditLogs(),
    ]);
    setRefreshing(false);
    showToast("Dashboard data refreshed.");
  };

  // ── Actions: User Management ──
  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "change_role",
          targetUserId,
          payload: { newRole },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message || `Role updated to ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Failed to update role", "error");
    }
  };

  const handleBanUser = async (targetUserId: string, isBanned: boolean) => {
    try {
      const token = await getAuthToken();
      const reason = isBanned ? null : prompt("Reason for suspending this account:", "Violation of MangaPulse Community Guidelines");
      if (!isBanned && reason === null) return; // user cancelled prompt

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: isBanned ? "unban" : "ban",
          targetUserId,
          payload: { reason },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message || (isBanned ? "User unbanned" : "User suspended"));
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Action failed", "error");
    }
  };

  const handleShadowbanUser = async (targetUserId: string, isShadowBanned: boolean) => {
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "shadowban",
          targetUserId,
          payload: { isShadowBanned: !isShadowBanned },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Shadowban action failed", "error");
    }
  };

  const handlePurgeUser = async (targetUserId: string, username: string) => {
    const confirmed = confirm(
      `⚠️ GDPR PURGE WARNING:\nAre you sure you want to permanently delete user @${username}? This will irreversibly erase all their reading history, collections, comments, and profile data.`
    );
    if (!confirmed) return;

    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "purge",
          targetUserId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Purge failed", "error");
    }
  };

  // ── Actions: Forum Moderation ──
  const handleForumAction = async (action: string, targetId: string, payload?: any) => {
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/forum", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, targetId, payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
      fetchForum();
    } catch (err: any) {
      showToast(err.message || "Forum moderation failed", "error");
    }
  };

  // ── Actions: Countdown Override & Bot Trigger ──
  const handleSaveCountdownOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideSlug.trim()) {
      showToast("Manga slug is required.", "error");
      return;
    }

    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/countdowns", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "override",
          mangaSlug: overrideSlug.trim(),
          payload: {
            statusOverride: overrideStatus,
            nextChapterOverride: overrideChapter ? parseInt(overrideChapter, 10) : null,
            reason: overrideReason.trim(),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
      setOverrideSlug("");
      setOverrideChapter("");
      setOverrideReason("");
      fetchOverridesAndDmca();
    } catch (err: any) {
      showToast(err.message || "Failed to save countdown override", "error");
    }
  };

  const handleTriggerReleaseBot = async () => {
    setBotRunning(true);
    setBotResult(null);
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/countdowns", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "trigger_bot" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBotResult(data.botResponse);
      showToast("Release Bot executed successfully!");
      fetchMetrics();
    } catch (err: any) {
      showToast(err.message || "Release Bot execution failed", "error");
    } finally {
      setBotRunning(false);
    }
  };

  // ── Actions: DMCA Killswitch ──
  const handleDelistManga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmcaSlug.trim()) {
      showToast("Manga slug is required.", "error");
      return;
    }

    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/dmca", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delist",
          mangaSlug: dmcaSlug.trim(),
          reason: dmcaReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
      setDmcaSlug("");
      fetchOverridesAndDmca();
      fetchMetrics();
    } catch (err: any) {
      showToast(err.message || "DMCA Delist action failed", "error");
    }
  };

  const handleRestoreManga = async (slug: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/dmca", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "restore",
          mangaSlug: slug,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
      fetchOverridesAndDmca();
      fetchMetrics();
    } catch (err: any) {
      showToast(err.message || "Restore action failed", "error");
    }
  };

  // ── Actions: Broadcast ──
  const handleSaveBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          message: broadcastMessage,
          level: broadcastLevel,
          is_active: broadcastActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
      fetchMetrics();
    } catch (err: any) {
      showToast(err.message || "Failed to update broadcast", "error");
    }
  };

  const handleClearBroadcast = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "clear" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
      setBroadcastActive(false);
      setActiveBroadcast(null);
      fetchMetrics();
    } catch (err: any) {
      showToast(err.message || "Failed to clear broadcast", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
            toastType === "success"
              ? "bg-[#13171f] text-emerald-400 border-emerald-500/30"
              : "bg-[#13171f] text-red-400 border-red-500/30"
          }`}
        >
          {toastType === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Quick Metrics Bar ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#13171f] border border-[#2a3344] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-[#94a1b5]">Total Users</p>
            <h3 className="text-xl font-bold text-white mt-0.5">
              {metrics.totalUsers.toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#13171f] border border-[#2a3344] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-[#94a1b5]">Active Today</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-0.5">
              {metrics.todayActive.toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#13171f] border border-[#2a3344] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-[#94a1b5]">Active Countdowns</p>
            <h3 className="text-xl font-bold text-white mt-0.5">
              {metrics.activeCountdowns.toLocaleString()}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#13171f] border border-[#2a3344] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-[#94a1b5]">Delisted / Flagged</p>
            <h3 className="text-xl font-bold text-amber-400 mt-0.5">
              {metrics.delistedCount + metrics.pendingReports}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* ── Main Navigation Tabs & Action Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#2a3344] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "users", label: "Users & Telemetry", icon: Users },
            { id: "forum", label: "Forum Moderation", icon: MessageSquare },
            { id: "countdowns", label: "Countdown Bot", icon: Clock },
            { id: "dmca", label: "DMCA Killswitch", icon: ShieldAlert },
            { id: "broadcast", label: "Broadcast Alert", icon: Radio },
            { id: "audit", label: "Audit Logs", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-[#13171f] text-[#94a1b5] hover:text-white hover:bg-[#1a1f2a] border border-[#2a3344]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#13171f] hover:bg-[#1e2430] text-[#94a1b5] hover:text-white border border-[#2a3344] text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 1: USER MANAGEMENT & TELEMETRY ── */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#13171f] p-3 rounded-xl border border-[#2a3344]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5e6b82]" />
              <input
                type="text"
                placeholder="Search by username, email, or IP address..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#5e6b82]" />
              <select
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value);
                }}
                className="px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="all">Filter: All Users</option>
                <option value="staff">Staff Only (Admin / Mod)</option>
                <option value="supporter">Supporters Only</option>
                <option value="banned">Suspended / Banned</option>
              </select>
              <button
                onClick={fetchUsers}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* User List Table */}
            <div className="lg:col-span-2 overflow-x-auto rounded-xl bg-[#13171f] border border-[#2a3344]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c0e12] text-[#94a1b5] border-b border-[#2a3344] font-mono uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">User & Email</th>
                    <th className="px-4 py-3">Telemetry / IP</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a3344]">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#5e6b82]">
                        No users matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelected = selectedUser?.id === u.id;
                      return (
                        <tr
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className={`hover:bg-[#1a1f2a] transition-colors cursor-pointer ${
                            isSelected ? "bg-blue-500/10 border-l-2 border-blue-500" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#1e2430] border border-[#2a3344] flex items-center justify-center font-bold text-white text-[11px]">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-white flex items-center gap-1.5">
                                  <span>@{u.username}</span>
                                  {u.is_banned && (
                                    <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                                      BANNED
                                    </span>
                                  )}
                                  {u.is_shadow_banned && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                      SHADOW
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-[#5e6b82] font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-[#94a1b5] font-mono text-[11px]">
                            <div>
                              <span>{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Never"}</span>
                              {u.last_login_ip && (
                                <span className="block text-[10px] text-[#5e6b82] truncate max-w-[140px]">
                                  {u.last_login_ip}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              className={`px-2 py-1 rounded text-[11px] font-semibold border focus:outline-none cursor-pointer ${
                                u.role === "ADMIN"
                                  ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                                  : u.role === "MODERATOR"
                                  ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
                                  : u.role === "SUPPORTER"
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  : "bg-[#0c0e12] text-[#94a1b5] border-[#2a3344]"
                              }`}
                            >
                              <option value="USER">USER</option>
                              <option value="SUPPORTER">SUPPORTER</option>
                              <option value="MODERATOR">MODERATOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleBanUser(u.id, u.is_banned)}
                                title={u.is_banned ? "Unban user" : "Hard-ban user"}
                                className={`p-1.5 rounded transition-colors ${
                                  u.is_banned
                                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                    : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                }`}
                              >
                                {u.is_banned ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                onClick={() => handleShadowbanUser(u.id, u.is_shadow_banned)}
                                title={u.is_shadow_banned ? "Remove shadowban" : "Shadowban user"}
                                className={`p-1.5 rounded transition-colors ${
                                  u.is_shadow_banned
                                    ? "bg-amber-500/30 text-amber-300"
                                    : "bg-[#0c0e12] text-[#5e6b82] hover:text-amber-400"
                                }`}
                              >
                                <Ghost className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Selected User Telemetry Card */}
            <div className="rounded-xl bg-[#13171f] border border-[#2a3344] p-5 space-y-4">
              <h4 className="text-xs font-mono uppercase text-[#94a1b5] flex items-center justify-between border-b border-[#2a3344] pb-2">
                <span>User Telemetry Details</span>
                {selectedUser && (
                  <span className="text-[10px] font-bold text-blue-400">ID: {selectedUser.id.substring(0, 8)}...</span>
                )}
              </h4>

              {selectedUser ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>@{selectedUser.username}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0c0e12] text-blue-400 border border-blue-500/30">
                        {selectedUser.role}
                      </span>
                    </h3>
                    <p className="text-xs text-[#94a1b5] font-mono mt-0.5">{selectedUser.email}</p>
                  </div>

                  <div className="space-y-2 p-3 rounded-lg bg-[#0c0e12] border border-[#2a3344] font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#5e6b82]">Registered:</span>
                      <span className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5e6b82]">Signup IP:</span>
                      <span className="text-white">{selectedUser.signup_ip || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5e6b82]">Last Login:</span>
                      <span className="text-white">
                        {selectedUser.last_login_at
                          ? new Date(selectedUser.last_login_at).toLocaleString()
                          : "Never"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5e6b82]">Last IP:</span>
                      <span className="text-white">{selectedUser.last_login_ip || "None recorded"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5e6b82]">Auth Provider:</span>
                      <span className="text-blue-400">{selectedUser.auth_provider || "email"}</span>
                    </div>
                  </div>

                  {selectedUser.is_banned && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Account Suspended</span>
                      </p>
                      <p className="text-[11px] text-red-400">
                        Reason: {selectedUser.ban_reason || "Violation of Community Guidelines"}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#2a3344] space-y-2">
                    <p className="text-[11px] text-[#5e6b82]">Sensitive Actions Tray:</p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleBanUser(selectedUser.id, selectedUser.is_banned)}
                        className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                          selectedUser.is_banned
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-red-600 hover:bg-red-500 text-white"
                        }`}
                      >
                        {selectedUser.is_banned ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                        <span>{selectedUser.is_banned ? "Lift Suspension (Unban)" : "Suspend User (Hard Ban)"}</span>
                      </button>

                      <button
                        onClick={() => handleShadowbanUser(selectedUser.id, selectedUser.is_shadow_banned)}
                        className={`w-full py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                          selectedUser.is_shadow_banned
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                            : "bg-[#0c0e12] border-[#2a3344] text-[#94a1b5] hover:text-white"
                        }`}
                      >
                        <Ghost className="w-3.5 h-3.5" />
                        <span>{selectedUser.is_shadow_banned ? "Disable Shadowban" : "Enable Shadowban"}</span>
                      </button>

                      <button
                        onClick={() => handlePurgeUser(selectedUser.id, selectedUser.username)}
                        className="w-full py-2 rounded-lg text-xs font-semibold bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/60 transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>GDPR Account Purge</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[#5e6b82] space-y-2">
                  <Info className="w-8 h-8 mx-auto opacity-40" />
                  <p>Click on any user row in the table to inspect their telemetry, IP history, and administrative tray.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 2: FORUM & COMMUNITY MODERATION ── */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "forum" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#2a3344] pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setForumSubTab("threads");
                  fetchForum();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  forumSubTab === "threads"
                    ? "bg-blue-600 text-white"
                    : "bg-[#13171f] text-[#94a1b5] border border-[#2a3344]"
                }`}
              >
                Discussions ({forumThreads.length})
              </button>
              <button
                onClick={() => {
                  setForumSubTab("posts");
                  fetchForum();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  forumSubTab === "posts"
                    ? "bg-blue-600 text-white"
                    : "bg-[#13171f] text-[#94a1b5] border border-[#2a3344]"
                }`}
              >
                Replies / Posts ({forumPosts.length})
              </button>
            </div>
          </div>

          {forumSubTab === "threads" ? (
            <div className="overflow-x-auto rounded-xl bg-[#13171f] border border-[#2a3344]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c0e12] text-[#94a1b5] border-b border-[#2a3344] font-mono uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Thread Title & Author</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Stats</th>
                    <th className="px-4 py-3 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a3344]">
                  {forumThreads.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#5e6b82]">
                        No forum threads recorded.
                      </td>
                    </tr>
                  ) : (
                    forumThreads.map((t) => (
                      <tr key={t.id} className="hover:bg-[#1a1f2a] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white truncate max-w-md">{t.title}</p>
                          <p className="text-[11px] text-[#5e6b82] mt-0.5">
                            Author: <span className="text-blue-400">@{t.author_username}</span> • {new Date(t.created_at).toLocaleDateString()}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {t.is_pinned && (
                              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                                PINNED
                              </span>
                            )}
                            {t.is_locked && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                LOCKED
                              </span>
                            )}
                            {t.is_deleted && (
                              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                                DELETED
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-[#94a1b5] font-mono text-[11px]">
                          <span>{t.replies_count || 0} replies</span>
                          <span className="text-[#5e6b82] block">{t.views_count || 0} views</span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                handleForumAction("pin_thread", t.id, { isPinned: !t.is_pinned })
                              }
                              title={t.is_pinned ? "Unpin thread" : "Pin thread to top"}
                              className={`p-1.5 rounded transition-colors ${
                                t.is_pinned ? "bg-blue-600 text-white" : "bg-[#0c0e12] text-[#94a1b5] hover:text-white"
                              }`}
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() =>
                                handleForumAction("lock_thread", t.id, { isLocked: !t.is_locked })
                              }
                              title={t.is_locked ? "Unlock thread" : "Lock thread"}
                              className={`p-1.5 rounded transition-colors ${
                                t.is_locked ? "bg-amber-600 text-white" : "bg-[#0c0e12] text-[#94a1b5] hover:text-white"
                              }`}
                            >
                              {t.is_locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleForumAction("delete_thread", t.id)}
                              title="Soft-delete thread"
                              className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleForumAction("purge_user_posts", t.author_id)}
                              title="Purge ALL posts by this user (Spammer cleanup)"
                              className="px-2 py-1 rounded bg-red-950/40 border border-red-500/30 text-[10px] font-bold text-red-400 hover:bg-red-900/60 transition-colors"
                            >
                              Purge User
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl bg-[#13171f] border border-[#2a3344]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c0e12] text-[#94a1b5] border-b border-[#2a3344] font-mono uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Reply Content & Thread</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a3344]">
                  {forumPosts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#5e6b82]">
                        No individual posts found.
                      </td>
                    </tr>
                  ) : (
                    forumPosts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#1a1f2a] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-mono text-white text-xs truncate max-w-md">{p.content}</p>
                          <p className="text-[11px] text-[#5e6b82] mt-0.5">Thread: {p.thread_title}</p>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-blue-400 font-semibold">@{p.author_username}</span>
                          <span className="block text-[10px] text-[#5e6b82] font-mono">
                            {new Date(p.created_at).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          {p.is_deleted ? (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                              DELETED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                              ACTIVE
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleForumAction("delete_post", p.id)}
                            className="px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            Delete Reply
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 3: COUNTDOWN BOT & OVERRIDES ── */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "countdowns" && (
        <section className="space-y-6">
          {/* Release Bot Heartbeat Controller */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-[#13171f] to-purple-950/40 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span>MangaPulse Release Bot (Platform Heartbeat)</span>
              </h3>
              <p className="text-xs text-[#94a1b5] max-w-xl">
                Automatic bot runs daily at 15:00 UTC (Shonen Jump drop hour) to sync upcoming chapters, prune expired supporter tiers, and dispatch notifications.
              </p>
            </div>

            <button
              onClick={handleTriggerReleaseBot}
              disabled={botRunning}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {botRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{botRunning ? "Running Release Bot..." : "Run Release Bot Now"}</span>
            </button>
          </div>

          {botResult && (
            <div className="p-4 rounded-xl bg-[#13171f] border border-emerald-500/30 text-xs font-mono text-emerald-300 space-y-1">
              <p className="font-bold">Bot Execution Response:</p>
              <pre className="text-[11px] overflow-x-auto text-[#94a1b5]">
                {JSON.stringify(botResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Manual Countdown Overrides Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form
              onSubmit={handleSaveCountdownOverride}
              className="rounded-xl bg-[#13171f] border border-[#2a3344] p-5 space-y-4"
            >
              <h4 className="text-xs font-mono uppercase text-[#94a1b5] border-b border-[#2a3344] pb-2">
                Override Schedule / Chapter
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Manga Slug</label>
                <input
                  type="text"
                  placeholder="e.g. one-piece, solo-leveling"
                  value={overrideSlug}
                  onChange={(e) => setOverrideSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="ONGOING">ONGOING (Standard drop)</option>
                  <option value="DELAYED">DELAYED (Author postponed release)</option>
                  <option value="HIATUS">HIATUS (Indefinite break)</option>
                  <option value="COMPLETED">COMPLETED (Final chapter published)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Next Chapter Number (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 1115"
                  value={overrideChapter}
                  onChange={(e) => setOverrideChapter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Reason / Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Oda health break announced on Twitter"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Save Override
              </button>
            </form>

            {/* Current Active Overrides Table */}
            <div className="lg:col-span-2 rounded-xl bg-[#13171f] border border-[#2a3344] overflow-hidden">
              <div className="p-4 border-b border-[#2a3344]">
                <h4 className="text-xs font-mono uppercase text-[#94a1b5]">
                  Active Countdown Overrides ({overrides.length})
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0c0e12] text-[#94a1b5] border-b border-[#2a3344] font-mono uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Chapter</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3 text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a3344]">
                    {overrides.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[#5e6b82]">
                          No manual overrides active. All countdowns follow automated provider schedule.
                        </td>
                      </tr>
                    ) : (
                      overrides.map((o) => (
                        <tr key={o.manga_slug} className="hover:bg-[#1a1f2a]">
                          <td className="px-4 py-3 font-semibold text-white font-mono">{o.manga_slug}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                              {o.status_override || "DEFAULT"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#94a1b5] font-mono">
                            {o.next_chapter_override ? `Ch. ${o.next_chapter_override}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-[#5e6b82] truncate max-w-xs">{o.reason || "—"}</td>
                          <td className="px-4 py-3 text-right text-[10px] text-[#5e6b82] font-mono">
                            {new Date(o.updated_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 4: DMCA & TAKEDOWN KILLSWITCH ── */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "dmca" && (
        <section className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-white">DMCA & Takedown Killswitch</p>
              <p className="text-[#94a1b5] leading-relaxed">
                When a formal DMCA or publisher notice is received, entering the title slug here delists the manga completely from <strong>/browse</strong>, the live search bar <strong>(/api/search)</strong>, and the search engine index <strong>(/sitemap.xml)</strong>. Direct visits return an immediate HTTP 404/410 response.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form
              onSubmit={handleDelistManga}
              className="rounded-xl bg-[#13171f] border border-[#2a3344] p-5 space-y-4"
            >
              <h4 className="text-xs font-mono uppercase text-[#94a1b5] border-b border-[#2a3344] pb-2">
                Delist Manga from Index
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Manga Slug to Delist</label>
                <input
                  type="text"
                  placeholder="e.g. solo-leveling"
                  value={dmcaSlug}
                  onChange={(e) => setDmcaSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">DMCA Reference / Reason</label>
                <textarea
                  rows={3}
                  value={dmcaReason}
                  onChange={(e) => setDmcaReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Activate Delist Killswitch</span>
              </button>
            </form>

            <div className="lg:col-span-2 rounded-xl bg-[#13171f] border border-[#2a3344] overflow-hidden">
              <div className="p-4 border-b border-[#2a3344]">
                <h4 className="text-xs font-mono uppercase text-[#94a1b5]">
                  Currently Delisted Titles ({delistedList.length})
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0c0e12] text-[#94a1b5] border-b border-[#2a3344] font-mono uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Delisted Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a3344]">
                    {delistedList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[#5e6b82]">
                          Zero titles currently delisted. 100% of the index is live and legal.
                        </td>
                      </tr>
                    ) : (
                      delistedList.map((d) => (
                        <tr key={d.manga_slug} className="hover:bg-[#1a1f2a]">
                          <td className="px-4 py-3 font-semibold text-red-400 font-mono">
                            {d.manga_slug}
                          </td>
                          <td className="px-4 py-3 text-[#94a1b5] truncate max-w-sm">{d.reason}</td>
                          <td className="px-4 py-3 text-[10px] text-[#5e6b82] font-mono">
                            {new Date(d.updated_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRestoreManga(d.manga_slug)}
                              className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-semibold text-xs transition-colors"
                            >
                              Restore
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 5: SITEWIDE BROADCAST ALERTS ── */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "broadcast" && (
        <section className="space-y-6">
          <form
            onSubmit={handleSaveBroadcast}
            className="max-w-2xl rounded-xl bg-[#13171f] border border-[#2a3344] p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#2a3344] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-blue-400" />
                  <span>Sitewide Broadcast Alert</span>
                </h3>
                <p className="text-xs text-[#94a1b5] mt-0.5">
                  Displays an immediate top-of-site announcement bar across all pages for every visitor.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-semibold text-white">Active Banner:</span>
                <input
                  type="checkbox"
                  checked={broadcastActive}
                  onChange={(e) => setBroadcastActive(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white">Announcement Message</label>
              <textarea
                rows={3}
                placeholder="e.g. ⚠️ AniList API experiencing latency — countdowns may take a moment to refresh."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white">Alert Level</label>
              <div className="flex items-center gap-3">
                {[
                  { id: "info", label: "Info (Blue)", color: "text-blue-400" },
                  { id: "warning", label: "Warning (Amber)", color: "text-amber-400" },
                  { id: "critical", label: "Critical (Red)", color: "text-red-400" },
                ].map((lvl) => (
                  <label key={lvl.id} className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="broadcastLevel"
                      checked={broadcastLevel === lvl.id}
                      onChange={() => setBroadcastLevel(lvl.id as any)}
                      className="accent-blue-600"
                    />
                    <span className={lvl.color}>{lvl.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            {broadcastMessage && (
              <div className="space-y-1.5 pt-2 border-t border-[#2a3344]">
                <label className="text-[10px] font-mono uppercase text-[#94a1b5]">Live Preview:</label>
                <div
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center text-center ${
                    broadcastLevel === "critical"
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : broadcastLevel === "warning"
                      ? "bg-amber-500/20 text-amber-200 border border-amber-500/30"
                      : "bg-blue-600/20 text-blue-200 border border-blue-500/30"
                  }`}
                >
                  <span>{broadcastMessage}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Publish Broadcast
              </button>
              <button
                type="button"
                onClick={handleClearBroadcast}
                className="px-4 py-2 rounded-lg bg-[#0c0e12] hover:bg-[#1a1f2a] text-[#94a1b5] hover:text-white border border-[#2a3344] text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear Sitewide Banner
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 6: AUDIT LOGS ── */}
      {/* ──────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "audit" && (
        <section className="space-y-4">
          <div className="overflow-x-auto rounded-xl bg-[#13171f] border border-[#2a3344]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c0e12] text-[#94a1b5] border-b border-[#2a3344] font-mono uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Staff Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a3344]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#5e6b82]">
                      No audit log entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#1a1f2a]">
                      <td className="px-4 py-3 text-[11px] font-mono text-[#5e6b82]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        @{log.admin_username || "Admin"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#94a1b5]">{log.target_id || "—"}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#5e6b82]">{log.ip_address || "127.0.0.1"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
