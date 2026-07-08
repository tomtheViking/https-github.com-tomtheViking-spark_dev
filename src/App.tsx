import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, BookOpen, Brain, Shield, Info, HelpCircle, Handshake, Trash2, RotateCcw, Lock, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CallSession, TeamMember, SupportTicket } from "./types";
import { CALL_TEMPLATES } from "./templates";
import InteractiveDashboard from "./components/InteractiveDashboard";
import RepresentativeAnalytics from "./components/RepresentativeAnalytics";
import CustomerPortal from "./components/CustomerPortal";
import SupportDashboard, { MOCK_TICKETS } from "./components/SupportDashboard";

// Firebase Integration
import { db, handleFirestoreError, OperationType } from "./lib/firebase";
import { collection, doc, setDoc, getDocs, deleteDoc } from "firebase/firestore";
import { getTenantIdForCustomer, getTenantNameForCustomer } from "./lib/tenant";

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
  }, []);

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

  // Multi-tenant simulated team members state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem("spark_team_members");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: "1", name: "Phil Muffins", email: "phil.muffins@arachnid.com", role: "Chief Category Officer", authorizedAccess: "Administrator", status: "Active" },
      { id: "2", name: "Phineas Beans", email: "phineas.beans@arachnid.com", role: "Chief Information Officer", authorizedAccess: "Global Digital Suite", status: "Active" },
      { id: "3", name: "Tia Norma", email: "tia.norma@arachnid.com", role: "GM - Livestock Division", authorizedAccess: "Livestock Accounts", status: "Active" },
      { id: "4", name: "Elizabeth Handy", email: "elizabeth.handy@arachnid.com", role: "Internal Agency VP", authorizedAccess: "Brand Marketing Suite", status: "Offline" },
      { id: "5", name: "Liz Smith", email: "liz.smith@arachnid.com", role: "GM - Equine and Pet", authorizedAccess: "Equine Brands", status: "Active" },
    ];
  });

  const [activeMemberId, setActiveMemberId] = useState<string>(() => {
    return localStorage.getItem("spark_active_member_id") || "1";
  });

  useEffect(() => {
    localStorage.setItem("spark_team_members", JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem("spark_active_member_id", activeMemberId);
  }, [activeMemberId]);

  const activeMember = teamMembers.find(m => m.id === activeMemberId) || teamMembers[0];
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
          querySnapshot = await getDocs(collection(db, "sessions"));
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, "sessions");
          return; // Unreachable since handleFirestoreError throws
        }

        const fbSessions: CallSession[] = [];
        querySnapshot.forEach((doc) => {
          fbSessions.push(doc.data() as CallSession);
        });

        // Sort by date chronologically
        fbSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Ensure every session has a unique analysisNumber (starting at 001) chronologically and assigned tenantId/tenantName
        fbSessions.forEach((session, index) => {
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

        if (fbSessions.length > 0) {
          setSessions(fbSessions);
          // Set active session to seedArachnid or the last session
          const active = fbSessions.find(s => s.id === "seed-arachnid-systems") || fbSessions[fbSessions.length - 1];
          setActiveSession(active || null);
          console.log("[Firestore Sync] Loaded sessions from Firestore successfully:", fbSessions.length);
        } else {
          // Firestore is empty. Check if user explicitly cleared it recently
          const cleared = localStorage.getItem("spark_sessions_cleared");
          if (cleared === "true") {
            console.log("[Firestore Sync] Firestore is empty and user cleared it. Keeping empty state.");
            setSessions([]);
            setActiveSession(null);
          } else {
            console.log("[Firestore Sync] Firestore is empty. Seeding database with templates...");
            await initializeFirestoreSeed();
          }
        }
      } catch (error) {
        console.error("[Firestore Sync] Error loading from Firestore, falling back to LocalStorage:", error);
        loadFromLocalStorageFallback();
      }
    }

    loadSessions();
  }, []);

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
      tenantId: newSession.tenantId || getTenantIdForCustomer(newSession.customerName),
      tenantName: newSession.tenantName || getTenantNameForCustomer(newSession.customerName)
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
      tenantId: updatedSession.tenantId || getTenantIdForCustomer(updatedSession.customerName),
      tenantName: updatedSession.tenantName || getTenantNameForCustomer(updatedSession.customerName)
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="spark_app_root">
      
      {/* Top Header bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs" id="main_header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-0">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-0 lg:h-16">
            
            {/* Logo area */}
            <div className="flex items-center space-x-3">
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
              
              {/* Persona Selector inside Header */}
              <div className="flex items-center space-x-2 bg-slate-900 text-white py-1 px-3 rounded-xl border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
                <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider leading-none">Active Persona</span>
                  <select
                    value={activeMemberId}
                    onChange={(e) => setActiveMemberId(e.target.value)}
                    className="bg-transparent text-white text-[10px] font-semibold focus:outline-none cursor-pointer pr-1"
                  >
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id} className="bg-slate-900 text-white text-xs">
                        {member.name} ({member.authorizedAccess === "Administrator" ? "Admin" : member.authorizedAccess === "User" ? "User" : "Read-Only"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <nav className="flex space-x-1 bg-slate-100 p-1 rounded-xl" id="navigation_tabs">
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === "analytics"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  id="tab-analytics"
                >
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>Rep Performance metrics</span>
                </button>



                <button
                  onClick={() => !isUserRole && setActiveTab("customer")}
                  disabled={isUserRole}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                    isUserRole
                      ? "opacity-40 cursor-not-allowed text-slate-400"
                      : activeTab === "customer"
                      ? "bg-white text-slate-900 shadow-xs cursor-pointer"
                      : "text-slate-500 hover:text-slate-900 cursor-pointer"
                  }`}
                  id="tab-customer"
                  title={isUserRole ? "Access Restricted: User simulation is limited to Rep Performance Metrics only." : "Customer Facing Portal"}
                >
                  {isUserRole ? <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <Handshake className="w-3.5 h-3.5 text-teal-600 shrink-0 animate-pulse" />}
                  <span>Customer Facing Portal</span>
                </button>

                <button
                  onClick={() => !isUserRole && setActiveTab("support")}
                  disabled={isUserRole}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                    isUserRole
                      ? "opacity-40 cursor-not-allowed text-slate-400"
                      : activeTab === "support"
                      ? "bg-white text-slate-900 shadow-xs cursor-pointer"
                      : "text-slate-500 hover:text-slate-900 cursor-pointer"
                  }`}
                  id="tab-support"
                  title={isUserRole ? "Access Restricted: User simulation is limited to Rep Performance Metrics only." : "Support Center"}
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
        {activeTab === "dashboard" && (
          <InteractiveDashboard
            sessions={sessions}
            onAddSession={handleAddSession}
            onUpdateSession={handleUpdateSession}
            onSelectSession={setActiveSession}
            activeSession={activeSession}
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
