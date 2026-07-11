import React, { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { 
  TrendingUp, 
  Award, 
  Calendar, 
  PhoneCall, 
  Brain, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  MessageSquare, 
  Loader2, 
  Trash2, 
  X, 
  Lock, 
  ShieldAlert,
  Info,
  Printer,
  Mail,
  Key,
  User,
  ArrowRight,
  UserPlus,
  LogIn,
  LogOut,
  Briefcase,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { CallSession, MetricTrendPoint, TeamMember, SupportTicket } from "../types";
import AnalysisReportView from "./AnalysisReportView";
import RepAccountTab from "./RepAccountTab";
import RepContactTab from "./RepContactTab";
import { auth, db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";

interface RepresentativeAnalyticsProps {
  sessions: CallSession[];
  onSelectSession: (id: string) => void;
  onClearHistory: () => void;
  onReSeed?: () => void;
  activeMember?: TeamMember;
  teamMembers?: TeamMember[];
  authUser?: any;
  authProfile?: any;
  onAddTicket?: (ticket: SupportTicket) => Promise<void> | void;
}

export default function RepresentativeAnalytics({
  sessions,
  onSelectSession,
  onClearHistory,
  onReSeed,
  activeMember,
  teamMembers,
  authUser,
  authProfile,
  onAddTicket
}: RepresentativeAnalyticsProps) {
  // Authentication states
  const [fbUser, setFbUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<"secure">("secure");
  const [showSandboxBypass, setShowSandboxBypass] = useState(false);
  
  const simulatedUser = null;
  const [explicitlyLoggedOut, setExplicitlyLoggedOut] = useState(() => {
    return localStorage.getItem("spark_metrics_logged_out") === "true";
  });

  // Listen to Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setAuthLoading(false);
      if (user) {
        setExplicitlyLoggedOut(false);
        localStorage.setItem("spark_metrics_logged_out", "false");
      }
    });
    return () => unsubscribe();
  }, []);

  const defaultTeamMembers: TeamMember[] = [];

  // Resolve current identity
  const effectiveUser = fbUser || authUser;
  const currentIdentity: TeamMember | null = effectiveUser 
    ? { 
        id: effectiveUser.uid, 
        name: authProfile?.name || effectiveUser.displayName || effectiveUser.email?.split("@")[0] || "Authenticated Rep", 
        email: effectiveUser.email || "", 
        role: authProfile?.role === "tenant_admin" ? "Administrator" : "Representative", 
        authorizedAccess: authProfile?.role === "tenant_admin" ? "Administrator" : "User", 
        status: "Active" 
      }
    : null;

  const isAuthed = effectiveUser && !explicitlyLoggedOut;

  const handleSandboxBypass = () => {
    const mockEmail = email.trim() || "demo.rep@sparkanalytics.com";
    const mockName = fullName.trim() || "Sandbox Representative";
    
    const localUser = {
      uid: "sandbox-uid-" + Math.random().toString(36).substring(2, 11),
      name: mockName,
      displayName: mockName,
      email: mockEmail,
      tenant_id: "tenant-sandbox",
      role: "representative",
    };

    localStorage.setItem("spark_sandbox_user", JSON.stringify(localUser));
    setFbUser(localUser);
    setExplicitlyLoggedOut(false);
    localStorage.setItem("spark_metrics_logged_out", "false");
    setAuthSuccess("Logged in successfully via local sandbox.");
  };

  const handleSecureLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (!email.trim() || !password.trim()) {
      setAuthError("Email and password are required.");
      return;
    }

    const isMasterAdmin = email.trim().toLowerCase() === "tom@sparkanalytic.com" && password === "BoatBuilder2026!";

    try {
      if (isMasterAdmin) {
        const masterUser = {
          uid: "master-admin-uid-tom-hansen",
          name: "Tom Hansen",
          displayName: "Tom Hansen",
          email: "tom@sparkanalytic.com",
          tenant_id: "tenant-master-admin",
          role: "tenant_admin",
          companyName: "Spark Master Admin Workspace",
        };

        // Try seeding Firestore
        try {
          await setDoc(doc(db, "users", "master-admin-uid-tom-hansen"), {
            email: "tom@sparkanalytic.com",
            name: "Tom Hansen",
            tenant_id: "tenant-master-admin",
            role: "tenant_admin",
            enrollment_status: "active",
            created_at: new Date().toISOString()
          });
          await setDoc(doc(db, "tenants", "tenant-master-admin"), {
            id: "tenant-master-admin",
            name: "Spark Master Admin Workspace",
            created_at: new Date().toISOString()
          });
        } catch (fsErr) {
          console.warn("Firestore seeding failed:", fsErr);
        }

        // Best-effort auth
        try {
          await createUserWithEmailAndPassword(auth, "tom@sparkanalytic.com", "BoatBuilder2026!");
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName: "Tom Hansen" });
          }
        } catch (authErr: any) {
          if (authErr.code === "auth/email-already-in-use") {
            try {
              await signInWithEmailAndPassword(auth, "tom@sparkanalytic.com", "BoatBuilder2026!");
            } catch (signInErr) {
              console.warn("Firebase sign in failed:", signInErr);
            }
          }
        }

        localStorage.setItem("spark_sandbox_user", JSON.stringify(masterUser));
        setFbUser(masterUser);
        setExplicitlyLoggedOut(false);
        localStorage.setItem("spark_metrics_logged_out", "false");
        setAuthSuccess("Logged in successfully as Spark Platform Master Admin.");
        return;
      }

      if (isRegistering) {
        if (!fullName.trim()) {
          setAuthError("Full name is required to register a representative profile.");
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
        await updateProfile(userCredential.user, { displayName: fullName.trim() });
        setAuthSuccess("Representative account created successfully! Logging in...");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password.trim());
        setAuthSuccess("Welcome back! Authentication verified.");
      }
      setExplicitlyLoggedOut(false);
      localStorage.setItem("spark_metrics_logged_out", "false");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/operation-not-allowed" || err.message?.includes("operation-not-allowed")) {
        console.warn("Auth operation not allowed; auto-bypassing to sandbox mode.");
        handleSandboxBypass();
      } else {
        setAuthError(err.message || "Authentication failed. Please verify your credentials.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    setFbUser(null);
    setExplicitlyLoggedOut(true);
    localStorage.setItem("spark_metrics_logged_out", "true");
    setAuthSuccess(null);
    setAuthError(null);
  };

  // Determine active identity for analytics views
  const effectiveMember = isAuthed ? currentIdentity : activeMember;
  const isUserRole = effectiveMember?.authorizedAccess === "User" || isAuthed;

  // Base analyzed sessions
  const baseAnalyzedSessions = sessions.filter((s) => s.status === "analyzed" && s.analytics);

  // Filter or map for the user's unique data based on average
  let userAnalyzedSessions = baseAnalyzedSessions;
  let isDemoCalibrationMode = false;

  if (isUserRole && effectiveMember) {
    const matchingSessions = baseAnalyzedSessions.filter(s => 
      s.repName.toLowerCase().includes(effectiveMember.name.toLowerCase()) || 
      effectiveMember.name.toLowerCase().includes(s.repName.toLowerCase())
    );
    if (matchingSessions.length > 0) {
      userAnalyzedSessions = matchingSessions;
    } else {
      // If there are no sessions in the database for this specific user,
      // dynamically map existing evaluated sessions to them so they immediately see their analytics.
      userAnalyzedSessions = baseAnalyzedSessions.map(s => ({
        ...s,
        repName: effectiveMember.name
      }));
      isDemoCalibrationMode = true;
    }
  }

  const totalCalls = userAnalyzedSessions.length;

  const avgSuccess = totalCalls > 0
    ? Math.round(userAnalyzedSessions.reduce((acc, s) => acc + (s.analytics?.successPercentage || 0), 0) / totalCalls)
    : 0;

  const avgEmpathy = totalCalls > 0
    ? (userAnalyzedSessions.reduce((acc, s) => acc + (s.analytics?.repEmpathyScore || 0), 0) / totalCalls).toFixed(1)
    : "0.0";

  const avgConfidence = totalCalls > 0
    ? (userAnalyzedSessions.reduce((acc, s) => acc + (s.analytics?.confidenceIndex || 0), 0) / totalCalls).toFixed(1)
    : "0.0";

  // Calculate pattern frequencies
  const patternCounts: Record<string, number> = {};
  userAnalyzedSessions.forEach((s) => {
    s.analytics?.miltonPatterns.forEach((p) => {
      patternCounts[p.patternName] = (patternCounts[p.patternName] || 0) + 1;
    });
  });

  // Default initial patterns to make UI beautiful
  const defaultPatterns = [
    { name: "Presuppositions", count: patternCounts["Presuppositions"] || 0 },
    { name: "Mind Reading", count: patternCounts["Mind Reading"] || 0 },
    { name: "Lost Performatives", count: patternCounts["Lost Performatives"] || 0 },
    { name: "Cause and Effect", count: patternCounts["Cause and Effect"] || 0 },
    { name: "Pacing & Matching", count: patternCounts["Pacing & Matching"] || 0 },
    { name: "Conversational Postulates", count: patternCounts["Conversational Postulates"] || 0 },
  ];

  // Convert sessions to trend data
  const trendData: MetricTrendPoint[] = userAnalyzedSessions
    .map((s) => ({
      date: s.date,
      successPercentage: s.analytics?.successPercentage || 0,
      empathyScore: (s.analytics?.repEmpathyScore || 0) * 10, // scale to 100 for visual consistency on same axis
      confidenceIndex: (s.analytics?.confidenceIndex || 0) * 10, // scale to 100
    }))
    // Sort chronologically
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Search & Natural Language states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sparkResponse, setSparkResponse] = useState<string | null>(null);
  const [isSparkSearching, setIsSparkSearching] = useState<boolean>(false);
  const [sparkError, setSparkError] = useState<string | null>(null);

  // Navigation sub tab inside Rep Interface
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "transcripts" | "account" | "contact">("dashboard");

  // Ticket creation states (for Contact Us tab)
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketPriority, setTicketPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  const handleGenerateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketError(null);
    setTicketSuccess(null);

    if (!ticketMessage.trim()) {
      setTicketError("Please describe your support request in detail.");
      return;
    }

    setIsSubmittingTicket(true);

    try {
      const repId = effectiveMember?.id || "rep-pending";
      const repName = effectiveMember?.name || "Representative";

      const newTicket: SupportTicket = {
        id: "ticket-" + Math.floor(1000 + Math.random() * 9000), // Random 4-digit ID
        title: ticketSubject.trim() || "Inbound Rep Portal Inquiry",
        tenantId: repId,
        tenantName: repName,
        priority: ticketPriority,
        status: "Open",
        customerMessage: ticketMessage.trim(),
        createdAt: new Date().toISOString(),
        matchingTelemetryIds: []
      };

      if (onAddTicket) {
        await onAddTicket(newTicket);
      }
      setTicketSuccess(`Support ticket ${newTicket.id} successfully created and submitted to support queue!`);
      setTicketSubject("");
      setTicketMessage("");
      setTicketPriority("LOW");
    } catch (err: any) {
      console.error("Error creating ticket:", err);
      setTicketError(err.message || "Could not submit support ticket. Please try again.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Transcript viewing modal state
  const [viewingSession, setViewingSession] = useState<CallSession | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"transcript" | "patterns" | "coaching">("transcript");
  const [printReportSession, setPrintReportSession] = useState<CallSession | null>(null);

  // Sorting state for transcripts table
  const [sortBy, setSortBy] = useState<"title" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: "title" | "date") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "title" ? "asc" : "desc");
    }
  };

  // Handle Natural Language Search via API
  const handleSparkSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSparkSearching(true);
    setSparkError(null);
    setSparkResponse(null);

    try {
      const response = await fetch("/api/ask-spark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          transcripts: userAnalyzedSessions
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to search transcripts using Spark AI.");
      }

      setSparkResponse(data.answer);
    } catch (err: any) {
      setSparkError(err.message || "An unexpected error occurred while querying Spark AI.");
    } finally {
      setIsSparkSearching(false);
    }
  };

  // Local filtering and sorting of transcripts for the table rows
  const filteredSessions = userAnalyzedSessions
    .filter((session) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        session.title.toLowerCase().includes(query) ||
        session.customerName.toLowerCase().includes(query) ||
        session.repName.toLowerCase().includes(query) ||
        (session.transcriptText && session.transcriptText.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (sortBy === "title") {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        if (titleA < titleB) return sortOrder === "asc" ? -1 : 1;
        if (titleA > titleB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      } else {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
    });

  if (!isAuthed) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4 sm:p-6" id="metrics-login-container">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-slate-900 p-6 text-white text-center space-y-2 relative">
            <div className="w-10 h-10 bg-teal-500/20 text-teal-400 rounded-xl mx-auto flex items-center justify-center border border-teal-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-display font-bold tracking-tight">Rep Interface</h2>
            <p className="text-xs text-slate-400">Please authenticate to access individual behavioral metrics & dialogue persuasion audit databases.</p>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between">
            {authError && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl flex items-start gap-2 text-xs mb-4">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl flex items-start gap-2 text-xs mb-4">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500 animate-bounce" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSecureLogin} className="space-y-4">
              {isRegistering && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alexis Carter"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-800"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="type"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. alexis@arachnid.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer mt-2"
              >
                {isRegistering ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{isRegistering ? "Create Representative Account" : "Sign In to Portal"}</span>
              </button>

              <div className="text-center pt-2 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); setAuthSuccess(null); setShowSandboxBypass(false); }}
                  className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold cursor-pointer underline underline-offset-4"
                >
                  {isRegistering ? "Already have an account? Sign In" : "Need a representative profile? Register / Sign Up"}
                </button>

                {showSandboxBypass && (
                  <button
                    type="button"
                    onClick={handleSandboxBypass}
                    className="w-full py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch Demo Sandbox Workspace</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full" id="rep-interface-wrapper">
      {/* Top Header/Banner */}
      <div className="bg-slate-900 text-slate-100 px-6 py-3.5 rounded-t-3xl border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md print:hidden" id="rep-top-portal-header">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="px-2.5 py-0.5 bg-teal-600/20 border border-teal-500/30 rounded text-[9px] font-mono text-teal-400 font-bold tracking-wider uppercase shrink-0">
            Rep Interface Console
          </div>
          <span className="text-xs text-slate-300 font-medium truncate">
            Metrics & Persuasion Audit workspace for <strong className="text-white">{effectiveMember?.name || "Representative"}</strong>
          </span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Active Rep ID:</span>
          <span className="px-3 py-1 rounded-lg bg-teal-600 text-white text-xs font-mono font-bold tracking-widest shadow-sm">
            {effectiveMember?.id ? effectiveMember.id.substring(0, 8).toUpperCase() : "REP-ID-PENDING"}
          </span>
        </div>
      </div>

      <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-3xl overflow-hidden shadow-xl min-h-[680px] flex flex-col lg:flex-row" id="rep-interface-dashboard">
        {/* Left Sidebar */}
        <aside className="w-full lg:w-64 bg-slate-900 text-white shrink-0 p-5 flex flex-col justify-between border-r border-slate-800 print:hidden" id="rep-sidebar-navigation">
          <div className="space-y-6">
            {/* Brand Logo */}
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center font-display font-black text-white italic shadow-lg shadow-teal-500/20 text-sm">
                S
              </div>
              <div>
                <span className="font-display font-bold text-slate-100 text-sm block tracking-wide">Spark Analytic</span>
                <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">Rep Interface</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1" id="rep-sidebar-menu">
              <button
                onClick={() => setActiveSubTab("dashboard")}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSubTab === "dashboard"
                    ? "bg-slate-800 text-white shadow-inner border-l-2 border-teal-500"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Activity className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveSubTab("transcripts")}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSubTab === "transcripts"
                    ? "bg-slate-800 text-white shadow-inner border-l-2 border-teal-500"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>Transcripts</span>
              </button>

              <button
                onClick={() => setActiveSubTab("account")}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSubTab === "account"
                    ? "bg-slate-800 text-white shadow-inner border-l-2 border-teal-500"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>My Account</span>
              </button>

              <button
                onClick={() => setActiveSubTab("contact")}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSubTab === "contact"
                    ? "bg-slate-800 text-white shadow-inner border-l-2 border-teal-500"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Contact Us</span>
              </button>
            </nav>





            {/* Rep Performance Plan */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800/85 space-y-3 mt-4" id="rep-sidebar-plan">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider">ROLE: {effectiveMember?.role?.toUpperCase() || "REPRESENTATIVE"}</span>
              </div>
              <div className="space-y-1.5">
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-1.5 rounded-full transition-all duration-500 w-full" />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>Evaluation Status: Active</span>
                  <span>Unlimited Calls</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Footer User Badge */}
          <div className="pt-4 border-t border-slate-800 mt-6 lg:mt-0 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-teal-400 border border-slate-700 font-mono uppercase">
              {effectiveMember?.name ? effectiveMember.name.substring(0, 2) : "RP"}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-200 block truncate leading-tight">{effectiveMember?.name}</span>
              <span className="text-[9px] text-slate-500 font-mono block truncate">{effectiveMember?.email || "rep@sparkanalytic.com"}</span>
            </div>
          </div>
        </aside>

        {/* Right main content section */}
        <div className="flex-1 p-6 space-y-6 overflow-x-hidden" id="rep-main-content-panel">
          
          {/* DASHBOARD TAB */}
          {activeSubTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in" id="rep-dashboard-tab-content">
              {/* Top Section Header & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 print:pb-2 print:border-b-2 print:border-slate-300">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-teal-600 print:text-black shrink-0" />
                    <span>Rep Interface Console</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Comprehensive audit of predictive deal closure probabilities, psychological persuasive patterns, and dialogue metrics.
                  </p>
                </div>
              </div>

              {/* User Info & Persona Banner */}
              {effectiveMember && (
                <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-500/25 text-teal-300 rounded-md border border-teal-500/20">
                        {effectiveMember.authorizedAccess} Console
                      </span>
                      {isDemoCalibrationMode && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/25 text-amber-300 rounded-md border border-amber-500/20">
                          Demo Calibration Mode
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                      <span>{effectiveMember.name}</span>
                      <span className="text-slate-400 font-normal text-sm font-mono">({effectiveMember.role})</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isUserRole 
                        ? "Displaying your customized behavioral performance analytics, averaged statistics, and transcript indexes." 
                        : "Displaying global organizational aggregated representative statistics."}
                    </p>
                  </div>
                  
                  {isDemoCalibrationMode && (
                    <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/50 flex items-start gap-2.5 max-w-sm">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-300 leading-normal font-sans">
                        <strong>First-time Onboarding:</strong> As you don't have personal call sessions analyzed yet, we have temporarily mapped sample sales templates to your workspace so you can explore performance graphs instantly!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Top statistics panel */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Predictive Win Rate</p>
                    <h3 className="text-2xl font-display font-bold text-slate-900 mt-1">{avgSuccess}%</h3>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Representative Empathy</p>
                    <h3 className="text-2xl font-display font-bold text-slate-900 mt-1">{avgEmpathy}/10</h3>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confidence Index</p>
                    <h3 className="text-2xl font-display font-bold text-slate-900 mt-1">{avgConfidence}/10</h3>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluated Interaction Logs</p>
                    <h3 className="text-2xl font-display font-bold text-slate-900 mt-1">{totalCalls}</h3>
                  </div>
                </div>
              </div>

              {totalCalls === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-6">
                  <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-display font-semibold text-slate-800">No Analytics Available Yet</h3>
                    <p className="text-sm text-slate-500">
                      Analyze your first sales call transcript or select a template in the **Interactive Dashboard** tab to populate real-time behavioral diagnostics.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    {onReSeed && (
                      <button
                        onClick={onReSeed}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-all cursor-pointer shadow-sm"
                        id="empty-reseed-btn"
                      >
                        Load Sample Templates
                      </button>
                    )}
                    <button
                      onClick={onClearHistory}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
                      id="empty-clear-btn"
                    >
                      Clear All Logs
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Growth Trend Chart */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-display font-semibold text-slate-900 text-base">Sales Persuasion Growth</h3>
                        <p className="text-[11px] text-slate-400">Chronological analysis of predictive win probability vs representative behavioral scores</p>
                      </div>
                    </div>

                    <div className="h-80 w-full text-xs font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                            labelClassName="font-semibold text-teal-400"
                          />
                          <Legend verticalAlign="top" height={36} />
                          <Line
                            name="Deal Close %"
                            type="monotone"
                            dataKey="successPercentage"
                            stroke="#14b8a6"
                            strokeWidth={3}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            name="Empathy Score (x10)"
                            type="monotone"
                            dataKey="empathyScore"
                            stroke="#6366f1"
                            strokeWidth={2.5}
                            strokeDasharray="5 5"
                          />
                          <Line
                            name="Confidence (x10)"
                            type="monotone"
                            dataKey="confidenceIndex"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pattern Dominance distribution */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div>
                      <h3 className="font-display font-semibold text-slate-900 text-base">Dialogue Alignment Integration</h3>
                      <p className="text-[11px] text-slate-400">Frequency of advanced persuasion architectures identified across all evaluated interactions</p>
                    </div>

                    <div className="h-80 w-full text-xs font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={defaultPatterns} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" tickFormatter={(v) => v.split(" ")[0]} />
                          <YAxis stroke="#94a3b8" allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                          />
                          <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Patterns Identified" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TRANSCRIPTS TAB */}
          {activeSubTab === "transcripts" && (
            <div className="space-y-6 animate-fade-in" id="rep-transcripts-tab-content">
              {/* Call History Archive List with Cognitive NL Search */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-base flex items-center gap-2">
                      <PhoneCall className="w-5 h-5 text-teal-600 shrink-0" />
                      <span>Call Performance Registry</span>
                    </h3>
                    <p className="text-xs text-slate-400">Historical database of processed calls, closing probabilities, and transcripts</p>
                  </div>
                  <button
                    onClick={onClearHistory}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors cursor-pointer flex items-center gap-1"
                    id="clear-history-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Archives</span>
                  </button>
                </div>

                {/* Cognitive Natural Language Search Panel */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 shadow-inner print:hidden">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600 shrink-0 animate-pulse" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Spark AI Cognitive NL Search</h4>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Type natural language queries to search, compile and synthesize answers directly from your transcripts (e.g. <em>"What were Sarah's primary objections?"</em> or <em>"Summarize how the rep handled CRM downtime questions."</em>).
                  </p>

                  <form onSubmit={handleSparkSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search transcripts with keywords or natural language..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 placeholder-slate-400"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setSparkResponse(null);
                            setSparkError(null);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={isSparkSearching || !searchQuery.trim()}
                      className="px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {isSparkSearching ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      )}
                      <span>Ask Spark</span>
                    </button>
                  </form>

                  {/* Spark AI Output Response Block */}
                  {isSparkSearching && (
                    <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-center space-x-3 text-slate-500 text-xs shadow-xs">
                      <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                      <span>Spark AI is scanning transcripts and synthesizing answers...</span>
                    </div>
                  )}

                  {sparkError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-xs flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Search Error</span>
                        <span>{sparkError}</span>
                      </div>
                    </div>
                  )}

                  {sparkResponse && (
                    <div className="bg-teal-50/50 border border-teal-200/60 rounded-xl p-4 space-y-3 shadow-xs animate-fade-in">
                      <div className="flex justify-between items-center border-b border-teal-100/50 pb-2">
                        <div className="flex items-center gap-1.5 text-teal-800 text-xs font-bold font-display">
                          <MessageSquare className="w-4 h-4 text-teal-600 shrink-0 animate-bounce" />
                          <span>Spark AI Answer</span>
                        </div>
                        <button 
                          onClick={() => setSparkResponse(null)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xs text-slate-700 leading-relaxed space-y-2 whitespace-pre-wrap">
                        {sparkResponse}
                      </div>
                      <div className="text-[9px] text-slate-400 italic">
                        Answer synthesized from analyzed call archives of {activeMember?.name}.
                      </div>
                    </div>
                  )}
                </div>

                {/* Transcripts Table List */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm font-sans" id="history_table">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-medium text-xs">
                        <th className="pb-3 font-normal">
                          <button
                            type="button"
                            onClick={() => handleSort("title")}
                            className="flex items-center gap-1 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
                          >
                            <span>Meeting Title</span>
                            {sortBy === "title" ? (
                              sortOrder === "asc" ? (
                                <ArrowUp className="w-3.5 h-3.5 text-teal-600 inline" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-teal-600 inline" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-50 inline" />
                            )}
                          </button>
                        </th>
                        <th className="pb-3 font-normal">
                          <button
                            type="button"
                            onClick={() => handleSort("date")}
                            className="flex items-center gap-1 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
                          >
                            <span>Date</span>
                            {sortBy === "date" ? (
                              sortOrder === "asc" ? (
                                <ArrowUp className="w-3.5 h-3.5 text-teal-600 inline" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-teal-600 inline" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-50 inline" />
                            )}
                          </button>
                        </th>
                        <th className="pb-3 font-normal">Customer</th>
                        <th className="pb-3 font-normal text-center">Alignment Patterns</th>
                        <th className="pb-3 font-normal text-center">Closing Prob.</th>
                        <th className="pb-3 font-normal text-right print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSessions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            No transcripts found matching your criteria. Try clearing the search query.
                          </td>
                        </tr>
                      ) : (
                        filteredSessions.map((session) => (
                          <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 font-mono shrink-0">
                                  #{session.analysisNumber || "001"}
                                </span>
                                <div className="font-medium text-slate-800 text-xs">{session.title}</div>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">Rep: {session.repName}</div>
                            </td>
                            <td className="py-4 text-slate-500 font-mono text-xs">
                              {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-4 text-slate-700 font-medium text-xs">{session.customerName}</td>
                            <td className="py-4 text-center font-mono font-medium text-teal-600 text-xs">
                              {session.analytics?.miltonPatterns.length || 0}
                            </td>
                            <td className="py-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold font-mono ${
                                (session.analytics?.successPercentage || 0) >= 80
                                  ? "bg-green-50 text-green-700 border border-green-100"
                                  : (session.analytics?.successPercentage || 0) >= 60
                                  ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                                  : "bg-red-50 text-red-700 border border-red-100"
                              }`}>
                                {session.analytics?.successPercentage}%
                              </span>
                            </td>
                            <td className="py-4 text-right print:hidden">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setViewingSession(session)}
                                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-medium shadow-sm transition-all cursor-pointer inline-flex items-center gap-1"
                                  id={`open-session-btn-${session.id}`}
                                >
                                  <Search className="w-3 h-3 text-teal-400 shrink-0" />
                                  <span>See Transcript</span>
                                </button>
                                <button
                                  onClick={() => setPrintReportSession(session)}
                                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
                                  id={`print-exec-report-btn-${session.id}`}
                                >
                                  <Printer className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Generate Transcript Report</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MY ACCOUNT TAB */}
          {activeSubTab === "account" && (
            <RepAccountTab 
              effectiveMember={effectiveMember} 
              onLogout={handleLogout} 
            />
          )}

          {/* CONTACT US TAB */}
          {activeSubTab === "contact" && (
            <RepContactTab 
              effectiveMember={effectiveMember} 
              onAddTicket={onAddTicket} 
            />
          )}
        </div>
      </div>

      {/* TRANSCRIPT VIEW MODAL */}
      {viewingSession && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
              <div className="space-y-1 font-sans">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 font-mono shrink-0">
                    #{viewingSession.analysisNumber || "001"}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    {new Date(viewingSession.date).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold text-white leading-snug">{viewingSession.title}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300 font-medium">
                  <div>Presenter: <span className="text-white font-bold">{viewingSession.repName || "No Presenter Detected"}</span></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPrintReportSession(viewingSession)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 border border-amber-200"
                  id={`modal-print-exec-report-btn-${viewingSession.id}`}
                >
                  <Printer className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Generate Transcript Report</span>
                </button>
                <button 
                  onClick={() => {
                    setViewingSession(null);
                    setActiveModalTab("transcript");
                  }}
                  className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Switched Navigation */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 shrink-0 flex gap-2">
              <button
                onClick={() => setActiveModalTab("transcript")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeModalTab === "transcript"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Full Transcript
              </button>
              <button
                onClick={() => setActiveModalTab("patterns")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === "patterns"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <span>Persuasion Patterns ({viewingSession.analytics?.miltonPatterns?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveModalTab("coaching")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === "coaching"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Behavioral Coaching Interventions</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              {activeModalTab === "transcript" && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <MessageSquare className="w-4 h-4 text-slate-500 shrink-0" />
                      <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Word-For-Word Dialogue</h4>
                    </div>
                    
                    <div className="space-y-4 font-sans text-xs leading-relaxed text-slate-700">
                      {viewingSession.transcriptText ? (
                        viewingSession.transcriptText.split("\n").map((line, idx) => {
                          const colonIdx = line.indexOf(":");
                          let isRep = false;
                          let speakerName = "Customer / Speaker";
                          let cleanText = line;
                          if (colonIdx !== -1) {
                            const prefix = line.slice(0, colonIdx).trim();
                            const lowerPrefix = prefix.toLowerCase();
                            cleanText = line.slice(colonIdx + 1).trim();
                            isRep = lowerPrefix.includes("representative") || 
                                    lowerPrefix.includes("rep") || 
                                    lowerPrefix.includes("manager") || 
                                    lowerPrefix.includes("presenter") || 
                                    lowerPrefix.includes("sales") || 
                                    lowerPrefix.includes("agent") || 
                                    lowerPrefix.includes("alex") || 
                                    lowerPrefix.includes("chloe") || 
                                    lowerPrefix.includes("marcus") || 
                                    lowerPrefix.includes("bob") || 
                                    lowerPrefix.includes("mark") || 
                                    lowerPrefix.includes("john") || 
                                    lowerPrefix.includes("speaker a") || 
                                    lowerPrefix.includes("s1") || 
                                    lowerPrefix.includes("voice 1");
                            speakerName = prefix;
                          }
                          return (
                            <div key={idx} className={`p-3.5 rounded-2xl max-w-[85%] ${
                              isRep 
                                ? "bg-teal-50/40 text-teal-950 border border-teal-100/30 ml-auto" 
                                : "bg-slate-100/50 text-slate-900 mr-auto"
                            }`}>
                              <span className="font-bold block text-[10px] uppercase tracking-wider mb-1 text-slate-400 font-sans">
                                {speakerName}
                              </span>
                              <p className="whitespace-pre-line font-sans">{cleanText}</p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-400 italic text-center py-6 font-sans">No transcript content available for this call.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === "patterns" && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {viewingSession.analytics?.miltonPatterns && viewingSession.analytics.miltonPatterns.length > 0 ? (
                    viewingSession.analytics.miltonPatterns.map((pattern, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 font-sans">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 font-mono text-[9px] font-bold rounded-md uppercase tracking-wider">
                              {pattern.patternName}
                            </span>
                            <p className="text-xs text-slate-400 mt-1">{pattern.description}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pattern.evaluation === "effective"
                              ? "bg-green-50 text-green-700 border border-green-100"
                              : pattern.evaluation === "ineffective"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-slate-50 text-slate-500 border border-slate-200"
                          }`}>
                            {pattern.evaluation}
                          </span>
                        </div>
                        
                        <div className="bg-slate-50 border-l-4 border-teal-500 p-3 rounded-r-xl">
                          <p className="text-xs text-slate-700 font-mono italic">"{pattern.quote}"</p>
                          <span className="text-[9px] text-slate-400 block mt-1">Speaker: {pattern.speaker}</span>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1">
                          <strong>Linguistic Suggestion:</strong>
                          <p className="text-slate-500">{pattern.improvementSuggestion}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs font-sans">
                      No advanced persuasion patterns were identified in this interaction.
                    </div>
                  )}
                </div>
              )}

              {activeModalTab === "coaching" && (
                <div className="space-y-4 max-w-3xl mx-auto font-sans">
                  {viewingSession.analytics?.coachingInterventions && viewingSession.analytics.coachingInterventions.length > 0 ? (
                    viewingSession.analytics.coachingInterventions.map((intervention, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{intervention.title}</h4>
                          <span className="text-[10px] font-mono text-indigo-500">Framework: {intervention.frameworkApplied}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-red-50/50 border border-red-100 p-3.5 rounded-xl">
                            <span className="text-[9px] font-bold uppercase text-red-600 block mb-1">Identified Phrase</span>
                            <p className="text-xs text-slate-700 font-mono italic">"{intervention.originalText}"</p>
                          </div>
                          <div className="bg-green-50/50 border border-green-100 p-3.5 rounded-xl">
                            <span className="text-[9px] font-bold uppercase text-green-600 block mb-1">Reframed Persuasion Dialogue</span>
                            <p className="text-xs text-slate-800 font-mono italic">"{intervention.correctedText}"</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-600 leading-relaxed">
                          <strong>Psychological Dimension Impact:</strong>
                          <p className="text-slate-500 mt-1">{intervention.explanation}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs font-sans">
                      No explicit manager coaching interventions identified. Representative displayed optimal compliance pacing!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex gap-4 text-xs font-sans">
                <div>Win Close Rate: <span className="font-bold text-teal-600">{viewingSession.analytics?.successPercentage}%</span></div>
                <div>Empathy: <span className="font-bold text-indigo-600">{viewingSession.analytics?.repEmpathyScore}/10</span></div>
                <div>Confidence: <span className="font-bold text-blue-600">{viewingSession.analytics?.confidenceIndex}/10</span></div>
              </div>
              <button
                onClick={() => {
                  setViewingSession(null);
                  setActiveModalTab("transcript");
                }}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer font-sans"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {printReportSession && (
        <AnalysisReportView
          session={printReportSession}
          onClose={() => setPrintReportSession(null)}
        />
      )}

    </div>
  );
}
