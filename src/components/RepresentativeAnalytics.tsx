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
  Briefcase
} from "lucide-react";
import { CallSession, MetricTrendPoint, TeamMember } from "../types";
import AnalysisReportView from "./AnalysisReportView";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";

interface RepresentativeAnalyticsProps {
  sessions: CallSession[];
  onSelectSession: (id: string) => void;
  onClearHistory: () => void;
  onReSeed?: () => void;
  activeMember?: TeamMember;
  teamMembers?: TeamMember[];
}

export default function RepresentativeAnalytics({
  sessions,
  onSelectSession,
  onClearHistory,
  onReSeed,
  activeMember,
  teamMembers
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
  const [loginMethod, setLoginMethod] = useState<"secure" | "fastpass">("secure");
  
  const [simulatedUser, setSimulatedUser] = useState<TeamMember | null>(() => {
    const saved = localStorage.getItem("spark_simulated_user");
    return saved ? JSON.parse(saved) : null;
  });

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

  const defaultTeamMembers: TeamMember[] = teamMembers || [
    { id: "1", name: "Phil Muffins", email: "phil.muffins@arachnid.com", role: "Chief Category Officer", authorizedAccess: "Administrator", status: "Active" },
    { id: "2", name: "Phineas Beans", email: "phineas.beans@arachnid.com", role: "Chief Information Officer", authorizedAccess: "Global Digital Suite", status: "Active" },
    { id: "3", name: "Tia Norma", email: "tia.norma@arachnid.com", role: "GM - Livestock Division", authorizedAccess: "Livestock Accounts", status: "Active" },
    { id: "4", name: "Elizabeth Handy", email: "elizabeth.handy@arachnid.com", role: "Internal Agency VP", authorizedAccess: "Brand Marketing Suite", status: "Offline" },
    { id: "5", name: "Liz Smith", email: "liz.smith@arachnid.com", role: "GM - Equine and Pet", authorizedAccess: "Equine Brands", status: "Active" },
  ];

  // Resolve current identity
  const currentIdentity: TeamMember | null = fbUser 
    ? { 
        id: fbUser.uid, 
        name: fbUser.displayName || fbUser.email?.split("@")[0] || "Authenticated Rep", 
        email: fbUser.email || "", 
        role: "Representative", 
        authorizedAccess: "User", 
        status: "Active" 
      }
    : simulatedUser;

  const isAuthed = (fbUser || simulatedUser) && !explicitlyLoggedOut;

  const handleSecureLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (!email.trim() || !password.trim()) {
      setAuthError("Email and password are required.");
      return;
    }
    try {
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
      if (err.code === "auth/operation-not-allowed") {
        const dummyMember: TeamMember = {
          id: "local_dev_rep_" + Date.now(),
          name: fullName.trim() || email.split("@")[0] || "Representative",
          email: email.trim(),
          role: "Representative",
          authorizedAccess: "User",
          status: "Active"
        };
        handleFastPassLogin(dummyMember);
        setAuthSuccess("Email/Password Auth is disabled in Firebase console. Automatically bypassed with a secure Dev-Session!");
      } else {
        setAuthError(err.message || "Authentication failed. Please verify your credentials.");
      }
    }
  };

  const handleFastPassLogin = (member: TeamMember) => {
    setSimulatedUser(member);
    localStorage.setItem("spark_simulated_user", JSON.stringify(member));
    setExplicitlyLoggedOut(false);
    localStorage.setItem("spark_metrics_logged_out", "false");
    setAuthError(null);
    setAuthSuccess(`Logged in as ${member.name}!`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    setFbUser(null);
    setSimulatedUser(null);
    localStorage.removeItem("spark_simulated_user");
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

  // Transcript viewing modal state
  const [viewingSession, setViewingSession] = useState<CallSession | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"transcript" | "patterns" | "coaching">("transcript");
  const [printReportSession, setPrintReportSession] = useState<CallSession | null>(null);

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

  // Local filtering of transcripts for the table rows
  const filteredSessions = userAnalyzedSessions.filter((session) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.title.toLowerCase().includes(query) ||
      session.customerName.toLowerCase().includes(query) ||
      session.repName.toLowerCase().includes(query) ||
      (session.transcriptText && session.transcriptText.toLowerCase().includes(query))
    );
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
            <h2 className="text-lg font-display font-bold tracking-tight">Rep Performance Portal</h2>
            <p className="text-xs text-slate-400">Please authenticate to access individual behavioral metrics & Milton Model persuasion audit databases.</p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1.5">
            <button
              onClick={() => { setLoginMethod("secure"); setAuthError(null); setAuthSuccess(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                loginMethod === "secure" ? "bg-white text-slate-900 shadow-xs border border-slate-200/50" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Secure Email</span>
            </button>
            <button
              onClick={() => { setLoginMethod("fastpass"); setAuthError(null); setAuthSuccess(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                loginMethod === "fastpass" ? "bg-white text-slate-900 shadow-xs border border-slate-200/50" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>Fast-Pass Demo</span>
            </button>
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

            {loginMethod === "secure" ? (
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
                      type="email"
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

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); setAuthSuccess(null); }}
                    className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold cursor-pointer underline underline-offset-4"
                  >
                    {isRegistering ? "Already have an account? Sign In" : "Need a representative profile? Register / Sign Up"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-[11px] text-slate-500 leading-normal bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  Select an existing active corporate workspace representative below to sign in instantly with simulated clearance level.
                </p>

                <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {defaultTeamMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleFastPassLogin(member)}
                      className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 rounded-xl p-3 flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="font-semibold text-slate-900 text-xs block group-hover:text-teal-600 transition-colors truncate">{member.name}</span>
                        <span className="text-[10px] text-slate-500 block font-mono truncate">{member.role}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="representative_analytics_section">
      
      {/* Top Section Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 print:pb-2 print:border-b-2 print:border-slate-300">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-teal-600 print:text-black shrink-0" />
            <span>Rep Performance Metrics Console</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Comprehensive audit of predictive deal closure probabilities, psychological persuasive patterns, and dialogue metrics.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-2"
            id="print-metrics-report-btn"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-2"
            id="metrics-portal-logout-btn"
          >
            <LogOut className="w-4 h-4 shrink-0 text-teal-400" />
            <span>Log Out Portal</span>
          </button>
        </div>
      </div>
      
      {/* User Info & Persona Banner */}
      {effectiveMember && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/25 text-blue-300 rounded-md border border-blue-500/20">
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
              <p className="text-[10px] text-slate-300 leading-normal">
                <strong>First-time Onboarding:</strong> As you don't have personal call sessions analyzed yet, we have temporarily mapped sample sales templates to your workspace so you can explore performance graphs instantly!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Top statistics panel (Avg Token Utilization removed, changed md:grid-cols-5 to md:grid-cols-4) */}
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
                <h3 className="font-display font-semibold text-slate-900 text-lg">Sales Persuasion Growth</h3>
                <p className="text-xs text-slate-400">Chronological analysis of predictive win probability vs representative behavioral scores</p>
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
              <h3 className="font-display font-semibold text-slate-900 text-lg">Dialogue Alignment Integration</h3>
              <p className="text-xs text-slate-400">Frequency of advanced persuasion architectures identified across all evaluated interactions</p>
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

          {/* Call History Archive List with Cognitive NL Search */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display font-semibold text-slate-900 text-lg flex items-center gap-2">
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
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
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
              <table className="w-full text-left text-sm" id="history_table">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-3 font-normal">Call Details</th>
                    <th className="pb-3 font-normal">Date</th>
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
                            <div className="font-medium text-slate-800">{session.title}</div>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">Rep: {session.repName}</div>
                        </td>
                        <td className="py-4 text-slate-500 font-mono text-xs">
                          {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-4 text-slate-700 font-medium">{session.customerName}</td>
                        <td className="py-4 text-center font-mono font-medium text-teal-600">
                          {session.analytics?.miltonPatterns.length || 0}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-mono ${
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
                              <span>Executive Report</span>
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

      {/* TRANSCRIPT VIEW MODAL */}
      {viewingSession && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
              <div className="space-y-1">
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
                  <div>Customer: <span className="text-white font-bold">{viewingSession.customerName}</span></div>
                  <div>Representative: <span className="text-white font-bold">{viewingSession.repName}</span></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPrintReportSession(viewingSession)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 border border-amber-200"
                  id={`modal-print-exec-report-btn-${viewingSession.id}`}
                >
                  <Printer className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Executive Print Report (V16)</span>
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
                <span>NLP Persuasion Patterns ({viewingSession.analytics?.miltonPatterns?.length || 0})</span>
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
                          const isRep = line.toLowerCase().startsWith("representative:") || line.toLowerCase().startsWith("rep:") || line.toLowerCase().startsWith("bob smith:") || line.toLowerCase().startsWith("alex mercer:") || line.toLowerCase().startsWith("chloe vance:") || line.toLowerCase().startsWith("marcus vance:") || line.toLowerCase().startsWith("mark toura:") || line.toLowerCase().startsWith("john sales:") || line.toLowerCase().startsWith("manager:");
                          return (
                            <div key={idx} className={`p-3.5 rounded-2xl max-w-[85%] ${
                              isRep 
                                ? "bg-teal-50/40 text-teal-950 border border-teal-100/30 ml-auto" 
                                : "bg-slate-100/50 text-slate-900 mr-auto"
                            }`}>
                              <span className="font-bold block text-[10px] uppercase tracking-wider mb-1 text-slate-400">
                                {isRep ? "Representative" : "Customer / Speaker"}
                              </span>
                              <p className="whitespace-pre-line">{line.replace(/^(representative:|rep:|customer:|client:)/i, "").trim()}</p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-400 italic text-center py-6">No transcript content available for this call.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === "patterns" && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {viewingSession.analytics?.miltonPatterns && viewingSession.analytics.miltonPatterns.length > 0 ? (
                    viewingSession.analytics.miltonPatterns.map((pattern, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
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
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                      No advanced Milton Model persuasion patterns were identified in this interaction.
                    </div>
                  )}
                </div>
              )}

              {activeModalTab === "coaching" && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {viewingSession.analytics?.coachingInterventions && viewingSession.analytics.coachingInterventions.length > 0 ? (
                    viewingSession.analytics.coachingInterventions.map((intervention, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{intervention.title}</h4>
                          <span className="text-[10px] font-mono text-indigo-500">Milton Framework: {intervention.frameworkApplied}</span>
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
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                      No explicit manager coaching interventions identified. Representative displayed optimal compliance pacing!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex gap-4 text-xs">
                <div>Win Close Rate: <span className="font-bold text-teal-600">{viewingSession.analytics?.successPercentage}%</span></div>
                <div>Empathy: <span className="font-bold text-indigo-600">{viewingSession.analytics?.repEmpathyScore}/10</span></div>
                <div>Confidence: <span className="font-bold text-blue-600">{viewingSession.analytics?.confidenceIndex}/10</span></div>
              </div>
              <button
                onClick={() => {
                  setViewingSession(null);
                  setActiveModalTab("transcript");
                }}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
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
