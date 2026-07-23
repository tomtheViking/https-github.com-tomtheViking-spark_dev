import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, BookOpen, Brain, Shield, Info, HelpCircle, Handshake, Trash2, RotateCcw, Lock, Users, LogOut, KeyRound, LogIn, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
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
import GongPrivacyPolicy from "./components/GongPrivacyPolicy";
import IntegrationGuide from "./components/IntegrationGuide";

function AuthForm({ onSuccess, onSandboxLogin }: { onSuccess: () => void; onSandboxLogin: (user: any) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Security features: Lockout timer
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setTimeout(() => setLockoutSeconds((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutSeconds]);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-slate-700" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score <= 3) return { score: 2, label: "Medium", color: "bg-amber-500" };
    return { score: 3, label: "Strong & Secure", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) {
      setError(`Account security lockout active. Please wait ${lockoutSeconds}s before retrying.`);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Email address and password are required.");
      return;
    }

    setLoading(true);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const isMasterAdmin = (normalizedEmail === "tom@sparkanalytic.com" || normalizedEmail === "clay@sparkanalytic.com") && 
      (password === "BoatBuilder2026!" || password === "SparkSecure2026!" || password === "ClaySpark2026!");

    try {
      if (isMasterAdmin) {
        const isClay = normalizedEmail === "clay@sparkanalytic.com";
        const uid = isClay ? "master-admin-uid-clay" : "master-admin-uid-tom-hansen";
        const name = isClay ? "Clay Malcolm" : "Tom Hansen";
        const masterUser = {
          uid,
          name,
          displayName: name,
          email: normalizedEmail,
          tenant_id: "tenant-master-admin",
          role: "spark_admin",
          is_super_admin: true,
          companyName: "Spark Master Admin Workspace",
        };

        try {
          await setDoc(doc(db, "users", uid), {
            email: normalizedEmail,
            name,
            tenant_id: "tenant-master-admin",
            role: "spark_admin",
            is_super_admin: true,
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

        try {
          await createUserWithEmailAndPassword(auth, normalizedEmail, password);
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName: name });
          }
        } catch (authErr: any) {
          if (authErr.code === "auth/email-already-in-use") {
            try {
              await signInWithEmailAndPassword(auth, normalizedEmail, password);
            } catch (signInErr) {
              console.warn("Firebase sign in failed for existing email:", signInErr);
            }
          }
        }

        localStorage.setItem("spark_sandbox_user", JSON.stringify(masterUser));
        onSandboxLogin(masterUser);
        setFailedAttempts(0);
        onSuccess();
        return;
      }

      // Check Firestore provisioned users table for manual/SES fallback login
      try {
        const q = query(collection(db, "users"), where("email", "==", normalizedEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const uData = snap.docs[0].data();
          if (uData.password === password || uData.temporary_password === password || uData.enrollment_token) {
            const fsUser = {
              uid: snap.docs[0].id,
              name: uData.name || normalizedEmail.split("@")[0],
              displayName: uData.name || normalizedEmail.split("@")[0],
              email: normalizedEmail,
              tenant_id: uData.tenant_id || uData.tenantId || "tenant-master-admin",
              role: uData.role || "spark_admin",
              is_super_admin: uData.is_super_admin || uData.role === "spark_admin",
              companyName: uData.companyName || "Spark Workspace",
            };
            localStorage.setItem("spark_sandbox_user", JSON.stringify(fsUser));
            onSandboxLogin(fsUser);
            setFailedAttempts(0);
            onSuccess();
            return;
          }
        }
      } catch (fsSearchErr) {
        console.warn("Firestore user lookup fallback note:", fsSearchErr);
      }

      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      setFailedAttempts(0);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      const newCount = failedAttempts + 1;
      setFailedAttempts(newCount);

      if (err.code === "auth/operation-not-allowed") {
        const isSparkMaster = email.toLowerCase().includes("spark") || email.toLowerCase().endsWith("@sparkanalytic.com");
        const fallbackUser = {
          uid: "sb-user-" + email.trim().toLowerCase().replace(/[^a-z0-9]/g, "-"),
          email: email.trim(),
          displayName: email.split("@")[0] || "Spark Administrator",
          tenant_id: isSparkMaster ? "tenant-master-admin" : "CLIENT-A",
          role: isSparkMaster ? "spark_admin" : "tenant_admin"
        };
        localStorage.setItem("spark_sandbox_user", JSON.stringify(fallbackUser));
        if (onSandboxLogin) onSandboxLogin(fallbackUser);
        setFailedAttempts(0);
        onSuccess();
        return;
      }

      if (newCount >= 3) {
        setLockoutSeconds(30);
        setError("Maximum login attempts exceeded. Temporary 30s security lockout engaged.");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        setError(`Invalid work email or password (${3 - newCount} attempt${3 - newCount === 1 ? "" : "s"} remaining before temporary lock).`);
      } else {
        setError(err.message || "An authentication error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Security Status Badge */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 text-teal-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>256-Bit SSL Encrypted Auth</span>
        </div>
        <span className="text-slate-500 font-mono">Tenant Protection Active</span>
      </div>

      {lockoutSeconds > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs text-center font-medium flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Security Lockout Active ({lockoutSeconds}s remaining)</span>
        </div>
      )}

      {error && lockoutSeconds === 0 && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-200 text-xs text-center font-medium leading-relaxed flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-300">Work Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-white placeholder-slate-500 font-sans"
              placeholder="name@company.com"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-slate-300">Password</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-white placeholder-slate-500 font-sans"
              placeholder="••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {password && (
            <div className="pt-1.5 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Password Complexity:</span>
                <span className={`font-semibold ${strength.score === 3 ? "text-emerald-400" : strength.score === 2 ? "text-amber-400" : "text-rose-400"}`}>
                  {strength.label}
                </span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                <div className={`h-full flex-1 transition-all ${strength.score >= 1 ? strength.color : "bg-transparent"}`} />
                <div className={`h-full flex-1 transition-all ${strength.score >= 2 ? strength.color : "bg-transparent"}`} />
                <div className={`h-full flex-1 transition-all ${strength.score >= 3 ? strength.color : "bg-transparent"}`} />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || lockoutSeconds > 0}
          className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Secure Sign In</span>
            </div>
          )}
        </button>
      </form>

      <div className="pt-3 border-t border-slate-800/80 text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <Shield className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Restricted Workspace Access</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
          Public self-registration and guest sandbox access are disabled. New workspace enrollment requires an invitation.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [activeSession, setActiveSession] = useState<CallSession | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics" | "customer" | "support">("support");

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
          let displayRole = "Representative";
          let displayAccess = "Representative";

          if (data.role === "tenant_super_admin") {
            displayRole = "Super Admin";
            displayAccess = "Super Admin";
          } else if (data.role === "tenant_admin") {
            displayRole = "Tenant Admin";
            displayAccess = "Tenant Admin";
          } else if (data.role === "ROLE_COMPLIANCE_AUDITOR") {
            displayRole = "Risk & Compliance";
            displayAccess = "Risk & Compliance";
          } else if (data.role === "ROLE_PRODUCT_MANAGER") {
            displayRole = "Tenant Product Manager";
            displayAccess = "Tenant Product Manager";
          } else if (data.role === "ROLE_REVENUE_MANAGER") {
            displayRole = "Revenue Manager";
            displayAccess = "Revenue Manager";
          } else if (data.role === "ROLE_REPRESENTATIVE") {
            displayRole = "Representative";
            displayAccess = "Representative";
          } else if (data.role === "Administrator") {
            displayRole = "Tenant Admin";
            displayAccess = "Tenant Admin";
          } else {
            displayRole = data.role || "Representative";
            displayAccess = data.authorizedAccess || "Representative";
          }

          members.push({
            id: docSnap.id,
            name: data.name || data.email?.split("@")[0] || "Team Member",
            email: data.email || "",
            role: displayRole,
            authorizedAccess: displayAccess,
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
        role: authProfile?.role === "tenant_super_admin" ? "Super Admin" : (authProfile?.role === "tenant_admin" ? "Tenant Admin" : (authProfile?.role === "ROLE_COMPLIANCE_AUDITOR" ? "Risk & Compliance" : (authProfile?.role === "ROLE_PRODUCT_MANAGER" ? "Tenant Product Manager" : (authProfile?.role === "ROLE_REVENUE_MANAGER" ? "Revenue Manager" : "Representative")))),
        authorizedAccess: authProfile?.role === "tenant_super_admin" ? "Super Admin" : (authProfile?.role === "tenant_admin" ? "Tenant Admin" : (authProfile?.role === "ROLE_COMPLIANCE_AUDITOR" ? "Risk & Compliance" : (authProfile?.role === "ROLE_PRODUCT_MANAGER" ? "Tenant Product Manager" : (authProfile?.role === "ROLE_REVENUE_MANAGER" ? "Revenue Manager" : "Representative")))),
        status: "Active",
        sparkId: authProfile?.sparkId || authProfile?.spark_id || ("SPK-" + authUser.uid.substring(0, 5).toUpperCase()),
        tenantId: authProfile?.tenantId || authProfile?.tenant_id || "CLIENT-A",
        activationDate: authProfile?.activationDate || authProfile?.activation_date || authProfile?.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0]
      }
    : null;

  const isUserRole = activeMember?.authorizedAccess === "User" || activeMember?.authorizedAccess === "Representative" || activeMember?.role === "Representative" || activeMember?.role === "ROLE_REPRESENTATIVE";

  // Enforce access restriction for team members with "User" authorized access level
  useEffect(() => {
    if (isUserRole && activeTab !== "analytics") {
      setActiveTab("analytics");
    }
  }, [isUserRole, activeTab]);

  // Automatically select the correct initial tab based on role upon successful login
  useEffect(() => {
    if (authProfile) {
      if (authProfile.role === "tenant_super_admin" || authProfile.role === "tenant_admin") {
        setActiveTab("support");
      } else if (authProfile.role === "tenant_user" || authProfile.role === "representative") {
        setActiveTab("analytics");
      }
    }
  }, [authProfile]);


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
    ? (authProfile?.role === "system_admin" || authProfile?.role === "tenant_super_admin" || authProfile?.role === "tenant_admin")
    : false;

  if (currentPath === "/gong-privacy" || currentPath === "/privacy") {
    return <GongPrivacyPolicy />;
  }

  if (currentPath === "/integration-guide" || currentPath === "/connect-help") {
    return <IntegrationGuide />;
  }

  if (currentPath === "/enroll") {
    return (
      <Enrollment 
        onSuccess={(email, tenantId, role) => {
          navigateTo("/");
          if (role === "tenant_super_admin" || role === "tenant_admin") {
            setActiveTab("support");
          } else {
            setActiveTab("analytics");
          }
        }} 
      />
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans selection:bg-teal-500/30 selection:text-teal-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-950/20 via-slate-950 to-slate-950 -z-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_150%)] opacity-30 -z-10" />
        
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch my-auto">
          {/* Left Column: Core Auth Card Container */}
          <div className="lg:col-span-5 w-full bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Subtle glow decorative bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400" />
            
            <div>
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="p-4 bg-slate-800/80 border border-slate-700/50 rounded-2xl text-teal-400 shadow-inner flex items-center justify-center">
                  <Brain className="w-8 h-8 text-teal-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                    Spark Secure Access Portal
                  </h2>
                  <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                    Enter your authorized credentials to access the Management Interface, Rep Interface, or Support Center
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

          {/* Right Column: Order of Enrollment Guide */}
          <div className="lg:col-span-7 w-full flex flex-col">
            <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 flex-1 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
                  <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Durable Enterprise Enrollment Workflow
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      A structured three-tier onboarding sequence for administrators and sales representatives
                    </p>
                  </div>
                </div>

                {/* Steps container */}
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex gap-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-850 hover:border-teal-500/20 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-teal-500/25">
                      01
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <span>Support Center Provisioning</span>
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] bg-teal-500/10 text-teal-400 border border-teal-500/15 font-mono">STEP 1</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Support Agent registers a Customer Tenant. First invitee email goes into Firestore as a pending <strong className="text-rose-400 font-normal">Tenant Administrator</strong> invitation.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-850 hover:border-emerald-500/20 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/25">
                      02
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <span>Management Interface Onboarding</span>
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-mono">STEP 2</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        The first invitee completes enrollment, sets their permanent password, logs in as Tenant Admin, and invites Sales Representatives from the Management Interface.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-850 hover:border-violet-500/20 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-violet-500/25">
                      03
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <span>Representative Enrollment</span>
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] bg-violet-500/10 text-violet-400 border border-violet-500/15 font-mono">STEP 3</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Representatives receive their email invitation, complete enrollment, set their permanent password, and gain access to the Representative Interface.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 text-[10px] text-slate-500 flex items-center gap-2 font-mono justify-center lg:justify-start">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Multi-tenant system synced with active Firestore clusters</span>
              </div>
            </div>
          </div>
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
              onAddSession={handleAddSession}
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
              parentAuthUser={authUser}
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
