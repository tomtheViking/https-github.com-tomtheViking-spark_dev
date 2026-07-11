import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, BookOpen, Brain, Shield, Info, HelpCircle, Handshake, Trash2, RotateCcw, Lock, Users, LogOut, KeyRound, LogIn, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CallSession, TeamMember, SupportTicket } from "./types";
import { CALL_TEMPLATES } from "./templates";
import InteractiveDashboard from "./components/InteractiveDashboard";
import RepresentativeAnalytics from "./components/RepresentativeAnalytics";
import CustomerPortal from "./components/CustomerPortal";
import SupportDashboard, { MOCK_TICKETS } from "./components/SupportDashboard";

// Firebase Integration
import { db, auth, handleFirestoreError, OperationType } from "./lib/firebase";
import { collection, doc, setDoc, getDocs, deleteDoc, getDoc, query, where } from "firebase/firestore";
import { signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getTenantIdForCustomer, getTenantNameForCustomer } from "./lib/tenant";

import Enrollment from "./components/Enrollment";

function AuthForm({ onSuccess, onSandboxLogin }: { onSuccess: () => void; onSandboxLogin: (user: any) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSandboxBypass, setShowSandboxBypass] = useState(false);

  const handleSandboxBypass = () => {
    const mockEmail = email.trim() || "demo@sparkanalytics.com";
    const mockName = fullName.trim() || "Sandbox Representative";
    const mockCompany = companyName.trim() || "Acme Sandbox Corp";
    const generatedTenantId = "tenant-sandbox";

    const localUser = {
      uid: "sandbox-uid-" + Math.random().toString(36).substring(2, 11),
      name: mockName,
      displayName: mockName,
      email: mockEmail,
      tenant_id: generatedTenantId,
      role: "tenant_admin",
      companyName: mockCompany,
    };

    localStorage.setItem("spark_sandbox_user", JSON.stringify(localUser));
    onSandboxLogin(localUser);
    onSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          console.warn("Firestore seeding failed for master admin:", fsErr);
        }

        // Standard Firebase user creation/sign in attempt (best-effort)
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
              console.warn("Firebase sign in failed for existing email:", signInErr);
            }
          } else {
            console.warn("Firebase auth failed for master admin (using sandbox session fallback):", authErr);
          }
        }

        localStorage.setItem("spark_sandbox_user", JSON.stringify(masterUser));
        onSandboxLogin(masterUser);
        onSuccess();
        return;
      }

      if (isRegister) {
        if (!fullName.trim() || !companyName.trim()) {
          throw new Error("Full Name and Company Name are required to initialize your workspace.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
        const user = userCredential.user;
        await updateProfile(user, { displayName: fullName.trim() });
        const generatedTenantId = "tenant-" + Math.random().toString(36).substring(2, 11);

        await setDoc(doc(db, "users", user.uid), {
          email: email.trim(),
          name: fullName.trim(),
          tenant_id: generatedTenantId,
          role: "tenant_admin",
          enrollment_status: "active",
          created_at: new Date().toISOString()
        });

        await setDoc(doc(db, "tenants", generatedTenantId), {
          id: generatedTenantId,
          name: companyName.trim(),
          created_at: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/operation-not-allowed" || err.message?.includes("operation-not-allowed")) {
        console.warn("Auth operation not allowed; auto-bypassing to sandbox mode.");
        handleSandboxBypass();
      } else {
        setError(err.message || "An authentication error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-200 text-xs text-center font-medium leading-relaxed flex flex-col items-center gap-2">
          <span>{error}</span>
          {showSandboxBypass && (
            <button
              type="button"
              onClick={handleSandboxBypass}
              className="mt-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Demo Sandbox Workspace</span>
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-300">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-white placeholder-slate-500"
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-300">Company / Workspace Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-white placeholder-slate-500"
                placeholder="e.g. Acme Corp"
              />
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-300">Work Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-white placeholder-slate-500"
            placeholder="email@company.com"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-300">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-white placeholder-slate-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer disabled:opacity-50 text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : isRegister ? (
            "Initialize Workspace"
          ) : (
            "Secure Sign In"
          )}
        </button>
      </form>

      <div className="flex flex-col gap-2.5 items-center pt-2">
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError(null);
            setShowSandboxBypass(false);
          }}
          className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer underline underline-offset-4"
        >
          {isRegister ? "Already have a workspace? Sign In" : "Need a new workspace? Create Workspace"}
        </button>

        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">or</span>

        <button
          type="button"
          onClick={handleSandboxBypass}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer flex items-center gap-1.5 group transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          <span>Launch instant Demo Sandbox Workspace</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [activeSession, setActiveSession] = useState<CallSession | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics" | "customer" | "support">("analytics");

  // Support Tickets global synced state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Custom non-blocking global confirmation modal
  const [appConfirm, setAppConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Real Firebase Auth states
  const [authUser, setAuthUser] = useState<any>(() => {
    const saved = localStorage.getItem("spark_sandbox_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [authProfile, setAuthProfile] = useState<any>(() => {
    const saved = localStorage.getItem("spark_sandbox_user");
    if (saved) {
      const u = JSON.parse(saved);
      return {
        name: u.displayName || u.name,
        email: u.email,
        tenant_id: u.tenant_id,
        role: u.role,
        enrollment_status: "active",
      };
    }
    return null;
  });
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Custom location routing logic
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState(null, "", path);
    setCurrentPath(path);
  };

  // Auth observer
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setAuthUser(user);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setAuthProfile(userDoc.data());
          } else {
            setAuthProfile(null);
          }
        } catch (err) {
          console.error("[Auth] Profile fetch failed:", err);
          setAuthProfile(null);
        }
      } else {
        // Fallback to persisted sandbox session if real user is null
        const saved = localStorage.getItem("spark_sandbox_user");
        if (saved) {
          const u = JSON.parse(saved);
          setAuthUser(u);
          setAuthProfile({
            name: u.displayName || u.name,
            email: u.email,
            tenant_id: u.tenant_id,
            role: u.role,
            enrollment_status: "active",
          });
        } else {
          setAuthUser(null);
          setAuthProfile(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Load / Seed support tickets from Firestore
  useEffect(() => {
    async function loadTickets() {
      try {
        console.log("[Firestore Sync] Fetching support tickets from database...");
        let querySnapshot;
        try {
          querySnapshot = await getDocs(collection(db, "tickets"));
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, "tickets");
          return;
        }

        const fbTickets: SupportTicket[] = [];
        const now = new Date();
        const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
        const expiredTicketIds: string[] = [];

        querySnapshot.forEach((docSnap) => {
          const ticket = docSnap.data() as SupportTicket;
          // Multi-Tenant Guard: skip ticket context mismatch on authenticated users
          if (authProfile?.tenant_id) {
            if (ticket.tenantId && ticket.tenantId !== authProfile.tenant_id) {
              return;
            }
          }
          
          if (ticket.status === "Resolved" && ticket.resolvedAt) {
            const resolvedDate = new Date(ticket.resolvedAt);
            if (resolvedDate < tenDaysAgo) {
              expiredTicketIds.push(ticket.id);
            } else {
              fbTickets.push(ticket);
            }
          } else {
            fbTickets.push(ticket);
          }
        });

        if (expiredTicketIds.length > 0) {
          console.log("[Firestore Sync] Automatically deleting expired resolved tickets from Firestore:", expiredTicketIds);
          for (const tid of expiredTicketIds) {
            try {
              await deleteDoc(doc(db, "tickets", tid));
            } catch (err) {
              console.error(`Failed to auto-delete expired ticket ${tid}:`, err);
            }
          }
        }

        if (fbTickets.length > 0) {
          // Sort by date/createdAt chronologically
          fbTickets.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setTickets(fbTickets);
          console.log("[Firestore Sync] Loaded support tickets from Firestore successfully:", fbTickets.length);
        } else {
          // Firestore is empty. Seed with MOCK_TICKETS
          console.log("[Firestore Sync] Firestore is empty. Seeding database with MOCK_TICKETS...");
          setTickets(MOCK_TICKETS);
          for (const ticket of MOCK_TICKETS) {
            try {
              await setDoc(doc(db, "tickets", ticket.id), ticket);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `tickets/${ticket.id}`);
            }
          }
        }
      } catch (error) {
        console.error("[Firestore Sync] Error loading support tickets, falling back to local mock data:", error);
        setTickets(MOCK_TICKETS);
      }
    }

    loadTickets();
  }, [authProfile]);

  const handleAddTicket = async (newTicket: SupportTicket) => {
    setTickets(prev => [...prev, newTicket]);
    try {
      await setDoc(doc(db, "tickets", newTicket.id), newTicket);
      console.log("[Firestore Sync] Successfully saved new support ticket to Firestore:", newTicket.id);
    } catch (error) {
      console.error("[Firestore Sync] Error saving ticket to Firestore:", error);
    }
  };

  const handleSetTicketsAndSync = async (updater: SupportTicket[] | ((prev: SupportTicket[]) => SupportTicket[])) => {
    setTickets((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // Trigger async write to Firestore for each ticket in the next array
      setTimeout(async () => {
        try {
          for (const ticket of next) {
            const prevTicket = prev.find(t => t.id === ticket.id);
            if (!prevTicket || prevTicket.status !== ticket.status || prevTicket.priority !== ticket.priority || prevTicket.customerMessage !== ticket.customerMessage || prevTicket.resolvedAt !== ticket.resolvedAt) {
              await setDoc(doc(db, "tickets", ticket.id), ticket);
              console.log("[Firestore Sync] Synced ticket to database:", ticket.id, ticket.status);
            }
          }
          // Check for deletions
          for (const prevTicket of prev) {
            if (!next.some(t => t.id === prevTicket.id)) {
              await deleteDoc(doc(db, "tickets", prevTicket.id));
              console.log("[Firestore Sync] Deleted ticket from database:", prevTicket.id);
            }
          }
        } catch (error) {
          console.error("[Firestore Sync] Error writing updated tickets to Firestore:", error);
        }
      }, 0);
      return next;
    });
  };

  // Multi-tenant team members state dynamically loaded from Firestore users collection
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>("");

  useEffect(() => {
    async function loadTeamMembers() {
      if (!authProfile?.tenant_id) {
        setTeamMembers([]);
        return;
      }
      try {
        console.log("[Firestore Sync] Loading workspace team members from users collection...");
        const q = query(collection(db, "users"), where("tenant_id", "==", authProfile.tenant_id));
        const querySnapshot = await getDocs(q);
        const members: TeamMember[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          members.push({
            id: docSnap.id,
            name: data.name || data.email?.split("@")[0] || "Team Member",
            email: data.email || "",
            role: data.role === "tenant_admin" ? "Administrator" : "Representative",
            authorizedAccess: data.role === "tenant_admin" ? "Administrator" : "User",
            status: data.enrollment_status === "active" ? "Active" : "Offline",
            sparkId: data.sparkId || data.spark_id || ("SPK-" + docSnap.id.substring(0, 5).toUpperCase()),
            tenantId: data.tenantId || data.tenant_id || authProfile?.tenant_id || "CLIENT-A",
            activationDate: data.activationDate || data.activation_date || data.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0]
          });
        });
        setTeamMembers(members);
      } catch (err) {
        console.error("[Firestore Sync] Error loading team members:", err);
      }
    }
    loadTeamMembers();
  }, [authProfile]);

  const activeMember: TeamMember | null = authUser
    ? {
        id: authUser.uid,
        name: authProfile?.name || authUser.displayName || authUser.email?.split("@")[0] || "Authenticated Rep",
        email: authUser.email || "",
        role: authProfile?.role === "tenant_admin" ? "Administrator" : "Representative",
        authorizedAccess: authProfile?.role === "tenant_admin" ? "Administrator" : "User",
        status: "Active",
        sparkId: authProfile?.sparkId || authProfile?.spark_id || ("SPK-" + authUser.uid.substring(0, 5).toUpperCase()),
        tenantId: authProfile?.tenantId || authProfile?.tenant_id || "CLIENT-A",
        activationDate: authProfile?.activationDate || authProfile?.activation_date || authProfile?.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0]
      }
    : null;

  const isUserRole = activeMember?.authorizedAccess === "User";

  // Enforce access restriction for team members with "User" authorized access level
  useEffect(() => {
    if (isUserRole && activeTab !== "analytics") {
      setActiveTab("analytics");
    }
  }, [isUserRole, activeTab]);


  // Load / Seed sessions from Firestore (with LocalStorage fallback)
  useEffect(() => {
    async function loadSessions() {
      try {
        console.log("[Firestore Sync] Fetching call sessions from database...");
        let querySnapshot;
        try {
          if (authProfile?.tenant_id) {
            querySnapshot = await getDocs(collection(db, "tenants", authProfile.tenant_id, "sessions"));
          } else {
            querySnapshot = await getDocs(collection(db, "sessions"));
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, "sessions");
          return; // Unreachable since handleFirestoreError throws
        }

        const fbSessions: CallSession[] = [];
        querySnapshot.forEach((docSnap) => {
          const session = docSnap.data() as CallSession;
          // Multi-Tenant Guard: Filter by tenant context if authenticated
          if (authProfile?.tenant_id) {
            if (session.tenantId && session.tenantId !== authProfile.tenant_id) {
              return; // Skip other tenants
            }
          }
          fbSessions.push(session);
        });

        // Sort by date chronologically
        fbSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Ensure every session has a unique analysisNumber (starting at 001) chronologically and assigned tenantId/tenantName
        fbSessions.forEach((session, index) => {
          if (!session.analysisNumber) {
            session.analysisNumber = String(index + 1).padStart(3, "0");
          }
          if (!session.tenantId) {
            session.tenantId = authProfile?.tenant_id || getTenantIdForCustomer(session.customerName);
          }
          if (!session.tenantName) {
            session.tenantName = authProfile?.tenant_id ? "Active Authenticated Workspace" : getTenantNameForCustomer(session.customerName);
          }
        });

        if (fbSessions.length > 0) {
          setSessions(fbSessions);
          // Set active session to the last session
          const active = fbSessions[fbSessions.length - 1];
          setActiveSession(active || null);
          console.log("[Firestore Sync] Loaded sessions from Firestore successfully:", fbSessions.length);
        } else {
          console.log("[Firestore Sync] Firestore is empty. Keeping clean slate as requested.");
          setSessions([]);
          setActiveSession(null);
        }
      } catch (error) {
        console.error("[Firestore Sync] Error loading from Firestore, falling back to LocalStorage:", error);
        loadFromLocalStorageFallback();
      }
    }

    loadSessions();
  }, [authProfile]);

  const initializeFirestoreSeed = async () => {
    // Pre-seed with the pre-analyzed high-fidelity templates to populate the metrics dashboard immediately
    const seed1: CallSession = {
      id: "seed-crm-deal",
      title: CALL_TEMPLATES[0].title,
      customerName: CALL_TEMPLATES[0].customerName,
      repName: CALL_TEMPLATES[0].repName,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      transcriptText: CALL_TEMPLATES[0].transcriptText,
      analytics: CALL_TEMPLATES[0].seedAnalytics,
      status: "analyzed",
      analysisNumber: "002",
      tenantId: getTenantIdForCustomer(CALL_TEMPLATES[0].customerName),
      tenantName: getTenantNameForCustomer(CALL_TEMPLATES[0].customerName)
    };

    const seed2: CallSession = {
      id: "seed-fintech-deal",
      title: CALL_TEMPLATES[1].title,
      customerName: CALL_TEMPLATES[1].customerName,
      repName: CALL_TEMPLATES[1].repName,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      transcriptText: CALL_TEMPLATES[1].transcriptText,
      analytics: CALL_TEMPLATES[1].seedAnalytics,
      status: "analyzed",
      analysisNumber: "001",
      tenantId: getTenantIdForCustomer(CALL_TEMPLATES[1].customerName),
      tenantName: getTenantNameForCustomer(CALL_TEMPLATES[1].customerName)
    };

    const arachnidTemplate = CALL_TEMPLATES.find(t => t.id === "template-arachnid-systems");
    const luciaTemplate = CALL_TEMPLATES.find(t => t.id === "template-lucia-formica");
    const initialSessions = [seed2, seed1];

    if (arachnidTemplate) {
      const seedArachnid: CallSession = {
        id: "seed-arachnid-systems",
        title: arachnidTemplate.title,
        customerName: arachnidTemplate.customerName,
        repName: arachnidTemplate.repName,
        date: new Date().toISOString(),
        transcriptText: arachnidTemplate.transcriptText,
        analytics: arachnidTemplate.seedAnalytics,
        status: "analyzed",
        analysisNumber: "003",
        tenantId: getTenantIdForCustomer(arachnidTemplate.customerName),
        tenantName: getTenantNameForCustomer(arachnidTemplate.customerName)
      };
      initialSessions.push(seedArachnid);
    }

    if (luciaTemplate) {
      const seedLucia: CallSession = {
        id: "seed-lucia-formica",
        title: luciaTemplate.title,
        customerName: luciaTemplate.customerName,
        repName: luciaTemplate.repName,
        date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        transcriptText: luciaTemplate.transcriptText,
        analytics: luciaTemplate.seedAnalytics,
        status: "analyzed",
        analysisNumber: "016", // Version 16 matches user request!
        tenantId: getTenantIdForCustomer(luciaTemplate.customerName),
        tenantName: getTenantNameForCustomer(luciaTemplate.customerName)
      };
      initialSessions.push(seedLucia);
    }

    setSessions(initialSessions);
    const active = initialSessions.find(s => s.id === "seed-lucia-formica") || initialSessions.find(s => s.id === "seed-arachnid-systems") || seed1;
    setActiveSession(active);

    // Save to Firestore
    try {
      for (const session of initialSessions) {
        try {
          // Store globally
          await setDoc(doc(db, "sessions", session.id), session);
          // Partition by tenantId
          if (session.tenantId) {
            await setDoc(doc(db, "tenants", session.tenantId, "sessions", session.id), session);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `sessions/${session.id}`);
        }
      }
      console.log("[Firestore Sync] Successfully seeded initial data to database.");
    } catch (saveErr) {
      console.error("[Firestore Sync] Failed to save seed data to Firestore:", saveErr);
    }

    // Also update LocalStorage backup
    localStorage.setItem("spark_sessions_v1", JSON.stringify(initialSessions));
  };

  const loadFromLocalStorageFallback = () => {
    const saved = localStorage.getItem("spark_sessions_v1");
    const cleared = localStorage.getItem("spark_sessions_cleared");
    if (saved && cleared !== "true") {
      try {
        let parsed: CallSession[] = JSON.parse(saved);
        parsed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        parsed.forEach((session, index) => {
          if (!session.analysisNumber) {
            session.analysisNumber = String(index + 1).padStart(3, "0");
          }
          if (!session.tenantId) {
            session.tenantId = getTenantIdForCustomer(session.customerName);
          }
          if (!session.tenantName) {
            session.tenantName = getTenantNameForCustomer(session.customerName);
          }
        });
        setSessions(parsed);
        const active = parsed.find((s: any) => s.id === "seed-arachnid-systems") || parsed[parsed.length - 1];
        setActiveSession(active || null);
      } catch (e) {
        console.error("Failed to parse fallback localStorage sessions:", e);
      }
    } else if (cleared === "true") {
      setSessions([]);
      setActiveSession(null);
    }
  };

  // Add a newly analyzed session
  const handleAddSession = async (newSession: CallSession) => {
    const sessionWithTenant = {
      ...newSession,
      tenantId: authProfile?.tenant_id || newSession.tenantId || getTenantIdForCustomer(newSession.customerName),
      tenantName: authProfile?.tenant_id ? "Active Authenticated Workspace" : (newSession.tenantName || getTenantNameForCustomer(newSession.customerName))
    };

    // 1. Update State
    setSessions((prev) => {
      const updated = [...prev, sessionWithTenant];
      localStorage.setItem("spark_sessions_v1", JSON.stringify(updated));
      localStorage.removeItem("spark_sessions_cleared");
      return updated;
    });

    // 2. Save to Firestore
    try {
      await setDoc(doc(db, "sessions", sessionWithTenant.id), sessionWithTenant);
      if (sessionWithTenant.tenantId) {
        await setDoc(doc(db, "tenants", sessionWithTenant.tenantId, "sessions", sessionWithTenant.id), sessionWithTenant);
      }
      console.log("[Firestore Sync] Successfully saved new session to Firestore.");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `sessions/${sessionWithTenant.id}`);
    }
  };

  const handleUpdateSession = async (updatedSession: CallSession) => {
    const sessionWithTenant = {
      ...updatedSession,
      tenantId: authProfile?.tenant_id || updatedSession.tenantId || getTenantIdForCustomer(updatedSession.customerName),
      tenantName: authProfile?.tenant_id ? "Active Authenticated Workspace" : (updatedSession.tenantName || getTenantNameForCustomer(updatedSession.customerName))
    };

    // 1. Update State
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === sessionWithTenant.id ? sessionWithTenant : s));
      localStorage.setItem("spark_sessions_v1", JSON.stringify(updated));
      return updated;
    });
    if (activeSession && activeSession.id === sessionWithTenant.id) {
      setActiveSession(sessionWithTenant);
    }

    // 2. Update Firestore
    try {
      await setDoc(doc(db, "sessions", sessionWithTenant.id), sessionWithTenant);
      if (sessionWithTenant.tenantId) {
        await setDoc(doc(db, "tenants", sessionWithTenant.tenantId, "sessions", sessionWithTenant.id), sessionWithTenant);
      }
      console.log("[Firestore Sync] Successfully updated session in Firestore.");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `sessions/${sessionWithTenant.id}`);
    }
  };

  // Archive clear
  const handleClearHistory = async () => {
    setAppConfirm({
      title: "Clear Call Logs",
      message: "Are you sure you want to clear all call logs? This action is irreversible.",
      onConfirm: async () => {
        // 1. Clear Local State & Backup
        setSessions([]);
        setActiveSession(null);
        localStorage.setItem("spark_sessions_v1", "[]");
        localStorage.setItem("spark_sessions_cleared", "true");

        // 2. Clear Firestore Documents
        try {
          let querySnapshot;
          try {
            querySnapshot = await getDocs(collection(db, "sessions"));
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, "sessions");
            return; // Unreachable
          }
          for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            try {
              await deleteDoc(doc(db, "sessions", docSnap.id));
              if (data.tenantId) {
                await deleteDoc(doc(db, "tenants", data.tenantId, "sessions", docSnap.id));
              }
            } catch (error) {
              handleFirestoreError(error, OperationType.DELETE, `sessions/${docSnap.id}`);
            }
          }
          console.log("[Firestore Sync] Successfully cleared all sessions from Firestore.");
        } catch (err) {
          console.error("[Firestore Sync] Failed to clear sessions from Firestore:", err);
        }
      }
    });
  };

  const handleReSeed = async () => {
    setAppConfirm({
      title: "Restore Sample Templates",
      message: "Are you sure you want to restore sample call templates to the database for testing?",
      onConfirm: async () => {
        localStorage.removeItem("spark_sessions_cleared");
        await initializeFirestoreSeed();
      }
    });
  };

  const handleSelectSessionFromHistory = (id: string) => {
    const matched = sessions.find((s) => s.id === id);
    if (matched) {
      setActiveSession(matched);
      setActiveTab("dashboard");
    }
  };

  // Check if current user is authorized to invite (system_admin or tenant_admin)
  const isAuthorized = authUser
    ? (authProfile?.role === "system_admin" || authProfile?.role === "tenant_admin")
    : false;

  if (currentPath === "/enroll") {
    return (
      <Enrollment 
        onSuccess={() => {
          navigateTo("/");
          setActiveTab("analytics");
        }} 
      />
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans selection:bg-teal-500/30 selection:text-teal-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-950/20 via-slate-950 to-slate-950 -z-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_150%)] opacity-30 -z-10" />
        
        {/* Core Auth Card Container */}
        <div className="w-full max-w-md bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle glow decorative bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400" />
          
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="p-4 bg-slate-800/80 border border-slate-700/50 rounded-2xl text-teal-400 shadow-inner flex items-center justify-center">
              <Brain className="w-8 h-8 text-teal-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Spark Dialogue Analytics
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                Enter your representative credentials to access your secure sales tenant workspace
              </p>
            </div>
          </div>

          <AuthForm 
            onSuccess={() => navigateTo("/")} 
            onSandboxLogin={(user) => {
              setAuthUser(user);
              setAuthProfile({
                name: user.displayName || user.name,
                email: user.email,
                tenant_id: user.tenant_id,
                role: user.role,
                enrollment_status: "active",
              });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="spark_app_root">
      
      {/* Top Header bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs" id="main_header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-0">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-0 lg:h-16">
            
            {/* Logo area */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigateTo("/")}>
              <div className="p-2 bg-slate-900 rounded-xl text-teal-400 shadow-sm flex items-center justify-center">
                <Brain className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-display font-bold text-lg tracking-tight text-slate-900">Spark Analytic (Spark)</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-100 uppercase tracking-wider font-mono">
                    Spark Model v1.2
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Dialogue Sales Interaction & Persuasion Diagnostic Engine</p>
              </div>
            </div>

            {/* Main Tabs Navigation & Actions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4">
              
              {/* Persona Selector or Firebase Logged In User inside Header */}
              {authUser ? (
                <div className="flex items-center space-x-2 bg-slate-900 text-white py-1 px-3 rounded-xl border border-slate-800 shadow-sm">
                  <KeyRound className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-[8px] text-teal-400 uppercase font-bold tracking-wider leading-none">Active User (Auth)</span>
                    <span className="text-[10px] font-semibold text-slate-200 max-w-[120px] truncate" title={authUser.email}>{authUser.email}</span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await signOut(auth);
                      } catch (err) {
                        console.error(err);
                      }
                      localStorage.removeItem("spark_sandbox_user");
                      setAuthUser(null);
                      setAuthProfile(null);
                      navigateTo("/");
                    }}
                    className="p-1 text-slate-400 hover:text-white transition-all cursor-pointer rounded-lg hover:bg-slate-800"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null}

              <nav className="flex space-x-1 bg-slate-100 p-1 rounded-xl" id="navigation_tabs">
                <button
                  onClick={() => {
                    navigateTo("/");
                    setActiveTab("analytics");
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                    currentPath === "/" && activeTab === "analytics"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  id="tab-analytics"
                >
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>Rep Interface</span>
                </button>

                <button
                  onClick={() => {
                    if (!isUserRole) {
                      navigateTo("/");
                      setActiveTab("customer");
                    }
                  }}
                  disabled={isUserRole}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                    isUserRole
                      ? "opacity-40 cursor-not-allowed text-slate-400"
                      : currentPath === "/" && activeTab === "customer"
                      ? "bg-white text-slate-900 shadow-xs cursor-pointer"
                      : "text-slate-500 hover:text-slate-900 cursor-pointer"
                  }`}
                  id="tab-customer"
                  title={isUserRole ? "Access Restricted: User simulation is limited to Rep Interface only." : "Management Interface"}
                >
                  {isUserRole ? <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <Handshake className="w-3.5 h-3.5 text-teal-600 shrink-0 animate-pulse" />}
                  <span>Management Interface</span>
                </button>

                <button
                  onClick={() => {
                    if (!isUserRole) {
                      navigateTo("/");
                      setActiveTab("support");
                    }
                  }}
                  disabled={isUserRole}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                    isUserRole
                      ? "opacity-40 cursor-not-allowed text-slate-400"
                      : currentPath === "/" && activeTab === "support"
                      ? "bg-white text-slate-900 shadow-xs cursor-pointer"
                      : "text-slate-500 hover:text-slate-900 cursor-pointer"
                  }`}
                  id="tab-support"
                  title={isUserRole ? "Access Restricted: User simulation is limited to Rep Interface only." : "Support Center"}
                >
                  {isUserRole ? <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <Shield className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" />}
                  <span>Support Center</span>
                </button>
              </nav>

              <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
                <button
                  onClick={handleClearHistory}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-all cursor-pointer flex items-center gap-1.5 border border-red-200"
                  id="header-clear-history-btn"
                  title="Clear all processed data from Firestore"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear DB</span>
                </button>
                <button
                  onClick={handleReSeed}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 transition-all cursor-pointer flex items-center gap-1.5 border border-teal-200"
                  id="header-seed-history-btn"
                  title="Re-seed database with default templates"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Seed Samples</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <>
          {activeTab === "dashboard" && (
            <InteractiveDashboard
              sessions={sessions}
              onAddSession={handleAddSession}
              onUpdateSession={handleUpdateSession}
              onSelectSession={setActiveSession}
              activeSession={activeSession}
              authUser={authUser}
              authProfile={authProfile}
            />
          )}

          {activeTab === "analytics" && (
            <RepresentativeAnalytics
              sessions={sessions}
              onSelectSession={handleSelectSessionFromHistory}
              onClearHistory={handleClearHistory}
              onReSeed={handleReSeed}
              activeMember={activeMember}
              teamMembers={teamMembers}
              authUser={authUser}
              authProfile={authProfile}
              onAddTicket={handleAddTicket}
            />
          )}

          {activeTab === "customer" && (
            <CustomerPortal 
              sessions={sessions} 
              onUpdateSession={handleUpdateSession} 
              teamMembers={teamMembers}
              setTeamMembers={setTeamMembers}
              activeMemberId={activeMemberId}
              setActiveMemberId={setActiveMemberId}
              onAddTicket={handleAddTicket}
            />
          )}

          {activeTab === "support" && (
            <SupportDashboard 
              tickets={tickets} 
              setTickets={handleSetTicketsAndSync} 
              sessions={sessions}
              onAddSession={handleAddSession}
              onUpdateSession={handleUpdateSession}
              onSelectSession={setActiveSession}
              activeSession={activeSession}
            />
          )}
        </>
      </main>

      {/* Modern, authoritative footer */}
      <footer className="bg-white border-t border-slate-200 py-6" id="main_footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 font-sans space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <span>Secure Cloud Sandbox — Server-Side Dialogue Analysis Secured</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} Spark Analytic (Spark). All rights reserved. Precision Revenue Science.</span>
          </div>
        </div>
      </footer>

      {/* Global Custom Confirmation Modal */}
      <AnimatePresence>
        {appConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900">{appConfirm.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{appConfirm.message}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setAppConfirm(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 rounded-xl text-xs font-sans transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    appConfirm.onConfirm();
                    setAppConfirm(null);
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-sans transition-all cursor-pointer shadow-md shadow-slate-900/10"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
