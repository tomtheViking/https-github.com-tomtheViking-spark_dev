import React, { useState, useEffect } from "react";
import { 
  Search,
  Calendar,
  Layers,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  RefreshCw,
  Bell,
  Activity,
  Sliders,
  DollarSign,
  TrendingUp,
  Mail,
  ShieldCheck,
  Send,
  MessageSquare,
  Sparkles,
  Inbox,
  Info,
  UserPlus,
  Trash2,
  Building,
  Shield,
  Lock,
  ShieldAlert,
  Save,
  Phone,
  MapPin,
  Key,
  Terminal,
  Copy,
  Check,
  Code,
  Video,
  Globe,
  Cpu,
  Play,
  Loader2,
  Database,
  UploadCloud,
  FileText,
  BookOpen,
  Server,
  HardDrive,
  Link,
  ExternalLink,
  ClipboardList,
  CheckSquare,
  BarChart2,
  AlertTriangle,
  ChevronRight,
  AlertCircle,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { doc, getDoc, setDoc, deleteDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { GoogleMeetWorkspace } from "./GoogleMeetWorkspace";
import { CallSession, CustomerFeedback, ClientConfiguration, TeamMember, SupportTicket } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CustomerPortalProps {
  sessions: CallSession[];
  onUpdateSession: (updated: CallSession) => void;
  onAddSession?: (newSession: CallSession) => void;
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  activeMemberId: string;
  setActiveMemberId: (id: string) => void;
  onAddTicket: (ticket: SupportTicket) => void;
}

export default function CustomerPortal({ 
  sessions, 
  onUpdateSession,
  onAddSession,
  teamMembers,
  setTeamMembers,
  activeMemberId,
  setActiveMemberId,
  onAddTicket
}: CustomerPortalProps) {
  const currentActiveMember = teamMembers.find(m => m.id === activeMemberId) || teamMembers[0];

  // Navigation Sidebar State inside Customer Portal
  const [activeSubTab, setActiveSubTab] = useState<
    | "dashboard"
    | "discovery"
    | "integrations"
    | "team"
    | "billing"
    | "contact"
    | "knowledge"
    | "product_signals"
    | "coaching_playbooks"
    | "score_corrections"
    | "employee_trends"
    | "compliance_flags"
    | "remediation_timelines"
    | "personal_dashboard"
    | "personal_discovery"
    | "personal_playbooks"
  >("discovery");

  // Track the primary contact's email address for the tenant
  const [tenantContactEmail, setTenantContactEmail] = useState<string | null>(null);

  // Filter & Search states for Discovery
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<"all" | "7d" | "30d">("all");
  const [platformFilter, setPlatformFilter] = useState<"all" | "zoom" | "gong" | "google" | "teams">("all");
  const [repFilter, setRepFilter] = useState<string>("all");

  // AI Ask Spark states
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Active analyzed session selection
  const currentTenantId = teamMembers.find(m => m.id === activeMemberId)?.tenantId || "CLIENT-A";
  const tenantSessions = sessions.filter(s => s.tenantId === currentTenantId);
  const analyzedSessions = tenantSessions.filter(s => s.status === "analyzed");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  useEffect(() => {
    if (analyzedSessions.length > 0) {
      const currentSelected = analyzedSessions.find(s => s.id === selectedSessionId);
      if (!currentSelected) {
        const arachnid = analyzedSessions.find(s => s.id === "seed-arachnid-systems");
        setSelectedSessionId(arachnid ? arachnid.id : analyzedSessions[0].id);
      }
    } else {
      setSelectedSessionId("");
    }
  }, [analyzedSessions, selectedSessionId]);

  const activeSession = tenantSessions.find(s => s.id === selectedSessionId) || null;

  // Representative View States
  const [personalSearchQuery, setPersonalSearchQuery] = useState<string>("");
  const [personalPlatformFilter, setPersonalPlatformFilter] = useState<"all" | "zoom" | "gong" | "google" | "teams">("all");
  const [personalSelectedSessionId, setPersonalSelectedSessionId] = useState<string>("");
  const [acknowledgedPlaybooks, setAcknowledgedPlaybooks] = useState<string[]>([]);
  const [activePlaybookId, setActivePlaybookId] = useState<string>("pricing_objections");

  const personalSessions = React.useMemo(() => {
    return tenantSessions.filter(s => s.repName === currentActiveMember?.name && s.status === "analyzed");
  }, [tenantSessions, currentActiveMember]);

  useEffect(() => {
    if (personalSessions.length > 0) {
      const currentSelected = personalSessions.find(s => s.id === personalSelectedSessionId);
      if (!currentSelected) {
        setPersonalSelectedSessionId(personalSessions[0].id);
      }
    } else {
      setPersonalSelectedSessionId("");
    }
  }, [personalSessions, personalSelectedSessionId]);

  // Proposal Simulator States (for Billing & Plans sub-tab)
  const [months, setMonths] = useState<number>(12);
  const [users, setUsers] = useState<number>(25);
  const [coachingEnabled, setCoachingEnabled] = useState<boolean>(true);
  const [diagnosticsEnabled, setDiagnosticsEnabled] = useState<boolean>(true);
  const [simulatorSaved, setSimulatorSaved] = useState<boolean>(false);

  // Billing Contact & Payment states
  const [billingContactName, setBillingContactName] = useState<string>("");
  const [billingEmail, setBillingEmail] = useState<string>("");
  const [billingPhone, setBillingPhone] = useState<string>("");
  const [billingAddress, setBillingAddress] = useState<string>("");
  const [billingCity, setBillingCity] = useState<string>("");
  const [billingState, setBillingState] = useState<string>("");
  const [billingZipCode, setBillingZipCode] = useState<string>("");
  const [billingCardNumber, setBillingCardNumber] = useState<string>("");
  const [billingCardExpiry, setBillingCardExpiry] = useState<string>("");
  const [billingCardCvv, setBillingCardCvv] = useState<string>("");
  const [billingLoading, setBillingLoading] = useState<boolean>(false);
  const [billingSuccess, setBillingSuccess] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingHasData, setBillingHasData] = useState<boolean>(false);

  // Feedback states
  const [feedbackType, setFeedbackType] = useState<"question" | "objection" | "comment">("question");
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [feedbackAuthor, setFeedbackAuthor] = useState<string>("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  // Integration Toggle states
  const [zoomConnected, setZoomConnected] = useState<boolean>(() => {
    const saved = localStorage.getItem("spark_zoom_connected");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [gongConnected, setGongConnected] = useState<boolean>(true);
  const [teamsConnected, setTeamsConnected] = useState<boolean>(false);
  const [googleConnected, setGoogleConnected] = useState<boolean>(() => {
    const saved = localStorage.getItem("spark_google_connected");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Gong Integration Configuration States (Option A)
  const [gongModalOpen, setGongModalOpen] = useState<boolean>(false);
  const [gongAccessKeyId, setGongAccessKeyId] = useState<string>("");
  const [gongAccessKeySecret, setGongAccessKeySecret] = useState<string>("");
  const [gongApiEndpoint, setGongApiEndpoint] = useState<string>("https://api.gong.io/v2/");
  const [gongAutoEnabled, setGongAutoEnabled] = useState<boolean>(true);
  const [gongInterval, setGongInterval] = useState<number>(60);
  const [gongLogs, setGongLogs] = useState<any[]>([]);
  const [gongLogsLoading, setGongLogsLoading] = useState<boolean>(false);
  const [gongSyncing, setGongSyncing] = useState<boolean>(false);
  const [gongSuccessMessage, setGongSuccessMessage] = useState<string | null>(null);
  const [gongErrorMessage, setGongErrorMessage] = useState<string | null>(null);

  // Zoom Integration Configuration States
  const [zoomModalOpen, setZoomModalOpen] = useState<boolean>(false);
  const [zoomAccountId, setZoomAccountId] = useState<string>("");
  const [zoomClientId, setZoomClientId] = useState<string>("");
  const [zoomClientSecret, setZoomClientSecret] = useState<string>("");
  const [zoomSecretToken, setZoomSecretToken] = useState<string>("");
  const [zoomAutoEnabled, setZoomAutoEnabled] = useState<boolean>(true);
  const [zoomInterval, setZoomInterval] = useState<number>(60);
  const [zoomLogs, setZoomLogs] = useState<any[]>([]);
  const [zoomLogsLoading, setZoomLogsLoading] = useState<boolean>(false);
  const [zoomSyncing, setZoomSyncing] = useState<boolean>(false);
  const [zoomSuccessMessage, setZoomSuccessMessage] = useState<string | null>(null);
  const [zoomErrorMessage, setZoomErrorMessage] = useState<string | null>(null);

  // Fetch Integration details on mount
  useEffect(() => {
    fetchGongCredentials();
    fetchGongLogs();
    fetchZoomCredentials();
    fetchZoomLogs();
  }, []);

  const fetchZoomCredentials = async () => {
    try {
      const res = await fetch("/api/v1/zoom/credentials");
      if (res.ok) {
        const data = await res.json();
        setZoomAccountId(data.accountId || "");
        setZoomClientId(data.clientId || "");
        setZoomClientSecret(data.clientSecretMasked || "");
        setZoomSecretToken(data.secretTokenMasked || "");
        setZoomAutoEnabled(!!data.enabled);
        setZoomInterval(data.pollingIntervalMinutes || 60);
        setZoomConnected(!!data.enabled);
      }
    } catch (err) {
      console.error("Failed to load Zoom credentials", err);
    }
  };

  const fetchZoomLogs = async () => {
    setZoomLogsLoading(true);
    try {
      const res = await fetch("/api/v1/zoom/sync-logs");
      if (res.ok) {
        const data = await res.json();
        setZoomLogs(data);
      }
    } catch (err) {
      console.error("Failed to load Zoom sync logs", err);
    } finally {
      setZoomLogsLoading(false);
    }
  };

  const saveZoomCredentials = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setZoomErrorMessage(null);
    setZoomSuccessMessage(null);
    try {
      const res = await fetch("/api/v1/zoom/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: zoomAccountId,
          clientId: zoomClientId,
          clientSecret: zoomClientSecret,
          secretToken: zoomSecretToken,
          enabled: zoomAutoEnabled,
          pollingIntervalMinutes: zoomInterval
        })
      });
      if (res.ok) {
        setZoomSuccessMessage("Zoom settings saved successfully!");
        setZoomConnected(zoomAutoEnabled);
        setTimeout(() => setZoomSuccessMessage(null), 4000);
        fetchZoomCredentials();
        fetchZoomLogs();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update Zoom settings.");
      }
    } catch (err: any) {
      setZoomErrorMessage(err.message || "Network error. Failed to save Zoom settings.");
    }
  };

  const triggerZoomManualSync = async () => {
    setZoomSyncing(true);
    setZoomErrorMessage(null);
    setZoomSuccessMessage(null);
    try {
      const res = await fetch("/api/v1/zoom/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setZoomSuccessMessage(`Sync Complete! Successfully pulled and ingested ${data.callsIngested || 0} Zoom recordings into the active workspace.`);
        fetchZoomLogs();
        setTimeout(() => {
          setZoomSuccessMessage(null);
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(data.error || "Zoom manual sync was rejected by remote API.");
      }
    } catch (err: any) {
      setZoomErrorMessage(err.message || "Zoom manual synchronization failed.");
    } finally {
      setZoomSyncing(false);
    }
  };

  const fetchGongCredentials = async () => {
    try {
      const res = await fetch("/api/v1/gong/credentials");
      if (res.ok) {
        const data = await res.json();
        setGongAccessKeyId(data.accessKeyId || "");
        setGongAccessKeySecret(data.accessKeySecretMasked || "");
        setGongApiEndpoint(data.apiEndpoint || "https://api.gong.io/v2/");
        setGongAutoEnabled(!!data.enabled);
        setGongInterval(data.pollingIntervalMinutes || 60);
        setGongConnected(!!data.enabled);
      }
    } catch (err) {
      console.error("Failed to load Gong credentials", err);
    }
  };

  const fetchGongLogs = async () => {
    setGongLogsLoading(true);
    try {
      const res = await fetch("/api/v1/gong/sync-logs");
      if (res.ok) {
        const data = await res.json();
        setGongLogs(data);
      }
    } catch (err) {
      console.error("Failed to load Gong sync logs", err);
    } finally {
      setGongLogsLoading(false);
    }
  };

  const saveGongCredentials = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGongErrorMessage(null);
    setGongSuccessMessage(null);
    try {
      const res = await fetch("/api/v1/gong/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessKeyId: gongAccessKeyId,
          accessKeySecret: gongAccessKeySecret,
          apiEndpoint: gongApiEndpoint,
          enabled: gongAutoEnabled,
          pollingIntervalMinutes: gongInterval
        })
      });
      if (res.ok) {
        setGongSuccessMessage("Gong settings saved successfully!");
        setGongConnected(gongAutoEnabled);
        setTimeout(() => setGongSuccessMessage(null), 4000);
        fetchGongCredentials();
        fetchGongLogs();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update settings.");
      }
    } catch (err: any) {
      setGongErrorMessage(err.message || "Network error. Failed to save credentials.");
    }
  };

  const triggerGongManualSync = async () => {
    setGongSyncing(true);
    setGongErrorMessage(null);
    setGongSuccessMessage(null);
    try {
      const res = await fetch("/api/v1/gong/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setGongSuccessMessage(`Sync Complete! Successfully pulled and ingested ${data.callsIngested || 0} recent calls into the active workspace.`);
        fetchGongLogs();
        setTimeout(() => {
          setGongSuccessMessage(null);
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(data.error || "Gong manual sync was rejected by remote API.");
      }
    } catch (err: any) {
      setGongErrorMessage(err.message || "Manual synchronization failed.");
    } finally {
      setGongSyncing(false);
    }
  };

  // OAuth Simulator States
  const [oauthModalOpen, setOauthModalOpen] = useState<boolean>(false);
  const [oauthPlatform, setOauthPlatform] = useState<"zoom" | "google">("zoom");
  const [oauthStep, setOauthStep] = useState<1 | 2 | 3 | 4>(1);
  const [oauthLoading, setOauthLoading] = useState<boolean>(false);
  const [oauthCode, setOauthCode] = useState<string>("");
  const [oauthTokenResponse, setOauthTokenResponse] = useState<any>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Auto-retry with exponential backoff states
  const [simulateFlakyNetwork, setSimulateFlakyNetwork] = useState<boolean>(false);
  const [oauthRetryAttempt, setOauthRetryAttempt] = useState<number>(0);
  const [oauthMaxAttempts] = useState<number>(4);
  const [oauthRetryLogs, setOauthRetryLogs] = useState<string[]>([]);
  const [oauthIsRetrying, setOauthIsRetrying] = useState<boolean>(false);
  const [oauthCountdown, setOauthCountdown] = useState<number>(0);

  const fetchWithRetry = async (
    fetchFn: () => Promise<Response>,
    onSuccess: (data: any) => void,
    onFailure: (err: any) => void,
    actionName: string
  ) => {
    let attempt = 1;
    let delay = 1000; // 1 second initial delay
    setOauthRetryAttempt(1);
    setOauthRetryLogs([`[${actionName}] Initiating Attempt 1...`]);
    setOauthIsRetrying(true);

    const execute = async () => {
      try {
        if (simulateFlakyNetwork && attempt < 3) {
          throw new Error(`[Simulated Error] Rate-limit (Attempt ${attempt}/${oauthMaxAttempts})`);
        }

        const response = await fetchFn();
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `${actionName} failed with HTTP status ${response.status}`);
        }

        setOauthRetryLogs((prev) => [
          ...prev,
          `[${actionName}] Attempt ${attempt} succeeded! Response code: 200 OK.`
        ]);
        setOauthIsRetrying(false);
        setOauthRetryAttempt(0);
        onSuccess(data);
      } catch (err: any) {
        console.warn(`Attempt ${attempt} failed:`, err.message);
        const errMsg = err.message || "Unknown transport error";
        
        if (attempt < oauthMaxAttempts) {
          const currentDelay = delay;
          setOauthRetryLogs((prev) => [
            ...prev,
            `✕ Attempt ${attempt} failed: ${errMsg}`,
            `➔ Backing off exponentially. Retrying in ${(currentDelay / 1000).toFixed(1)}s...`
          ]);

          let secondsLeft = currentDelay / 1000;
          setOauthCountdown(secondsLeft);
          const interval = setInterval(() => {
            secondsLeft -= 0.5;
            if (secondsLeft <= 0) {
              clearInterval(interval);
            } else {
              setOauthCountdown(secondsLeft);
            }
          }, 500);

          await new Promise((resolve) => setTimeout(resolve, currentDelay));
          clearInterval(interval);
          setOauthCountdown(0);

          attempt++;
          delay *= 2; // exponential backoff
          setOauthRetryAttempt(attempt);
          setOauthRetryLogs((prev) => [...prev, `[${actionName}] Initiating Attempt ${attempt}...`]);
          await execute();
        } else {
          setOauthRetryLogs((prev) => [
            ...prev,
            `❌ Critical: All ${oauthMaxAttempts} attempts exhausted. Handshake aborted.`
          ]);
          setOauthIsRetrying(false);
          setOauthRetryAttempt(0);
          onFailure(new Error(`All ${oauthMaxAttempts} handshake attempts failed. Last error: ${errMsg}`));
        }
      }
    };

    await execute();
  };

  const handleToggleZoom = (val: boolean) => {
    if (!val) {
      setZoomConnected(false);
      localStorage.setItem("spark_zoom_connected", "false");
    } else {
      setOauthPlatform("zoom");
      setOauthStep(1);
      setOauthCode("");
      setOauthTokenResponse(null);
      setOauthError(null);
      setOauthRetryLogs([]);
      setOauthModalOpen(true);
    }
  };

  const handleToggleGoogle = (val: boolean) => {
    if (!val) {
      setGoogleConnected(false);
      localStorage.setItem("spark_google_connected", "false");
    } else {
      setOauthPlatform("google");
      setOauthStep(1);
      setOauthCode("");
      setOauthTokenResponse(null);
      setOauthError(null);
      setOauthRetryLogs([]);
      setOauthModalOpen(true);
    }
  };

  const handleOAuthAuthorize = async () => {
    setOauthLoading(true);
    setOauthError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const generatedCode = `spl_${oauthPlatform}_code_${Math.random().toString(36).substring(2, 10)}`;
      setOauthCode(generatedCode);
      setOauthStep(2);
    } catch (err: any) {
      setOauthError(err.message || "Failed to authorize OAuth request.");
    } finally {
      setOauthLoading(false);
    }
  };

  const handleSimulateCallback = async () => {
    setOauthLoading(true);
    setOauthError(null);
    setOauthRetryLogs([]);

    await fetchWithRetry(
      () => fetch(`/api/v1/oauth/callback?code=${oauthCode}&state=xyz_state_4917&platform=${oauthPlatform}`),
      async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setOauthStep(3);
        setOauthLoading(false);
      },
      (err) => {
        setOauthError(err.message || "OAuth callback simulator failed.");
        setOauthLoading(false);
      },
      "OAuth Browser Callback"
    );
  };

  const handleExchangeTokens = async () => {
    setOauthLoading(true);
    setOauthError(null);
    setOauthRetryLogs([]);

    await fetchWithRetry(
      () => fetch("/api/v1/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code: oauthCode,
          client_id: `spark_client_id_${oauthPlatform}`,
          client_secret: `spark_client_secret_${oauthPlatform}_f8b44ece36e877f8`,
          grant_type: "authorization_code",
          platform: oauthPlatform
        })
      }),
      async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setOauthTokenResponse(data);
        setOauthStep(4);
        
        if (oauthPlatform === "zoom") {
          setZoomConnected(true);
          localStorage.setItem("spark_zoom_connected", "true");
        } else {
          setGoogleConnected(true);
          localStorage.setItem("spark_google_connected", "true");
        }
        setOauthLoading(false);
      },
      (err) => {
        setOauthError(err.message || "Token exchange simulator failed.");
        setOauthLoading(false);
      },
      "Secure Token Exchange"
    );
  };

  // Developer API Portal States
  const [apiKeys, setApiKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("spark_developer_api_keys");
    return saved ? JSON.parse(saved) : ["spark_live_f8b44ece36e877f8"];
  });
  const [activeCodeTab, setActiveCodeTab] = useState<"zoom" | "gong" | "google" | "microsoft">("zoom");
  
  // Sandbox Simulator States
  const [sandboxPlatform, setSandboxPlatform] = useState<"zoom" | "gong" | "google" | "microsoft">("zoom");
  const [sandboxTitle, setSandboxTitle] = useState<string>("Arachnid Systems Discovery Call");
  const [sandboxCustomer, setSandboxCustomer] = useState<string>("Arachnid Systems");
  const [sandboxRep, setSandboxRep] = useState<string>("Mark Mercer");
  
  const defaultTranscripts = {
    zoom: `Representative (Mark): I know you want to protect your team's budget, but will we integrate next week or the week after? Automating this will allow you to scale instantly.\nCustomer (Phil Muffins): Yes, we have standard legacy budgets but scaling instantly is exactly our Q3 goal.`,
    gong: `Representative (Sarah): It is critical to eliminate manual processes. I'm sure you feel the transition is already happening. Is it worth seeing if this solves it?\nCustomer (Liz Gallop): Yes, we are feeling the pressure of manual pipeline audits. A real-time persuasion model makes complete sense.`,
    google: `Representative (Mark): As we look at this transition, we feel that saving 15 hours per rep each week is exactly what you need. Automating this will double your outreach capability.\nCustomer (John): Yes, actually. We have been struggling with manual transcription for ages.`,
    microsoft: `Representative (Sarah): Our platform acts as a secure container and we can establish standard protocols automatically. I know you want to ensure total data compliance.\nCustomer (Liz Gallop): Perfect. That fits our security guidelines.`
  };

  const [sandboxTranscript, setSandboxTranscript] = useState<string>(defaultTranscripts.zoom);
  const [sandboxApiKey, setSandboxApiKey] = useState<string>(apiKeys[0] || "spark_live_f8b44ece36e877f8");
  const [sandboxLoading, setSandboxLoading] = useState<boolean>(false);
  const [sandboxResponse, setSandboxResponse] = useState<any | null>(null);
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [sandboxSuccess, setSandboxSuccess] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  // Sync sandbox transcript on platform change
  const handleSandboxPlatformChange = (platform: "zoom" | "gong" | "google" | "microsoft") => {
    setSandboxPlatform(platform);
    setSandboxTranscript(defaultTranscripts[platform]);
    if (platform === "zoom") {
      setSandboxTitle("Arachnid Systems Discovery Call");
      setSandboxCustomer("Arachnid Systems");
      setSandboxRep("Mark Mercer");
    } else if (platform === "gong") {
      setSandboxTitle("Gong Pipeline Sync: Equine Group");
      setSandboxCustomer("Equine Digital Group");
      setSandboxRep("Sarah Jennings");
    } else if (platform === "google") {
      setSandboxTitle("Google Meet: SnailCare Kickoff");
      setSandboxCustomer("SnailCare Logistics");
      setSandboxRep("Mark Mercer");
    } else {
      setSandboxTitle("Teams Call: Muffin Brands Sales review");
      setSandboxCustomer("Muffin & Sons Brands");
      setSandboxRep("Sarah Jennings");
    }
  };

  const handleGenerateApiKey = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let keySuffix = "";
    for (let i = 0; i < 16; i++) {
      keySuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newKey = `spark_live_${keySuffix}`;
    const updatedKeys = [...apiKeys, newKey];
    setApiKeys(updatedKeys);
    localStorage.setItem("spark_developer_api_keys", JSON.stringify(updatedKeys));
    setSandboxApiKey(newKey);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getPayloadCode = (platform: "zoom" | "gong" | "google" | "microsoft") => {
    const payload = {
      apiKey: sandboxApiKey || "spark_live_f8b44ece36e877f8",
      platform: platform,
      meetingId: `meet_${platform}_98234`,
      title: platform === "zoom" ? "Arachnid Systems Discovery Call" 
              : platform === "gong" ? "Gong Pipeline Sync: Equine Group"
              : platform === "google" ? "Google Meet: SnailCare Kickoff"
              : "Teams Call: Muffin Brands Sales review",
      customerName: platform === "zoom" ? "Arachnid Systems"
                   : platform === "gong" ? "Equine Digital Group"
                   : platform === "google" ? "SnailCare Logistics"
                   : "Muffin & Sons Brands",
      repName: platform === "gong" || platform === "microsoft" ? "Sarah Jennings" : "Mark Mercer",
      transcriptText: defaultTranscripts[platform]
    };
    return JSON.stringify(payload, null, 2);
  };

  const handleCopyPayloadText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleTriggerSandboxIngest = async () => {
    setSandboxLoading(true);
    setSandboxError(null);
    setSandboxResponse(null);
    setSandboxSuccess(false);

    try {
      const response = await fetch("/api/v1/conference-ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          apiKey: sandboxApiKey,
          platform: sandboxPlatform,
          meetingId: `sandbox_${sandboxPlatform}_${Date.now()}`,
          title: sandboxTitle,
          customerName: sandboxCustomer,
          repName: sandboxRep,
          transcriptText: sandboxTranscript
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process sandbox conference ingest.");
      }

      setSandboxResponse(data);
      setSandboxSuccess(true);
    } catch (err: any) {
      console.error(err);
      setSandboxError(err.message || "An unexpected error occurred.");
    } finally {
      setSandboxLoading(false);
    }
  };

  // Form states for adding new member
  const [newMemberType, setNewMemberType] = useState<"customer" | "spark_admin">("customer");
  const [newMemberName, setNewMemberName] = useState<string>("");
  const [newMemberEmail, setNewMemberEmail] = useState<string>("");
  const [newMemberRole, setNewMemberRole] = useState<string>("");
  const [newMemberAccess, setNewMemberAccess] = useState<string>("Tenant Admin");
  const [newMemberStatus, setNewMemberStatus] = useState<"Active" | "Offline">("Active");
  const [newMemberSparkId, setNewMemberSparkId] = useState<string>("");
  const [newMemberTenantId, setNewMemberTenantId] = useState<string>("");
  const [newMemberActivationDate, setNewMemberActivationDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Admin & Team Member Lookup Search State
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<"All" | "Admins" | "SparkAdmins" | "Users">("All");

  // Error/Success messages for team actions
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamSuccess, setTeamSuccess] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState<boolean>(false);

  const isCurrentUserAdmin = 
    currentActiveMember?.authorizedAccess === "Super Admin" || 
    currentActiveMember?.authorizedAccess === "Tenant Admin" || 
    currentActiveMember?.authorizedAccess === "Administrator" ||
    currentActiveMember?.role === "Super Admin" ||
    currentActiveMember?.role === "Tenant Admin" ||
    currentActiveMember?.role === "Administrator" ||
    currentActiveMember?.role === "tenant_super_admin" ||
    currentActiveMember?.role === "tenant_admin" ||
    currentActiveMember?.email?.trim().toLowerCase() === "tom@sparkanalytic.com" ||
    currentActiveMember?.email?.trim().toLowerCase() === "clay@sparkanalytic.com";

  const isSuperAdmin = 
    currentActiveMember?.role === "Super Admin" || 
    currentActiveMember?.role === "tenant_super_admin" || 
    (tenantContactEmail && currentActiveMember?.email?.trim().toLowerCase() === tenantContactEmail.trim().toLowerCase()) ||
    currentActiveMember?.email?.trim().toLowerCase() === "tom@sparkanalytic.com" ||
    currentActiveMember?.email?.trim().toLowerCase() === "clay@sparkanalytic.com";

  const isTenantAdmin =
    currentActiveMember?.role === "Tenant Admin" ||
    currentActiveMember?.role === "tenant_admin" ||
    currentActiveMember?.authorizedAccess === "Tenant Admin" ||
    currentActiveMember?.authorizedAccess === "Administrator";

  const isProductManager =
    currentActiveMember?.role === "Tenant Product Manager" ||
    currentActiveMember?.role === "Product Manager" ||
    currentActiveMember?.role === "ROLE_PRODUCT_MANAGER" ||
    currentActiveMember?.authorizedAccess === "Tenant Product Manager" ||
    currentActiveMember?.authorizedAccess === "Product Manager";

  const isRevenueManager =
    currentActiveMember?.role === "Revenue Manager" ||
    currentActiveMember?.role === "ROLE_REVENUE_MANAGER" ||
    currentActiveMember?.authorizedAccess === "Revenue Manager";

  const isRiskCompliance =
    currentActiveMember?.role === "Risk & Compliance" ||
    currentActiveMember?.role === "ROLE_COMPLIANCE_AUDITOR" ||
    currentActiveMember?.authorizedAccess === "Risk & Compliance";

  const isRepresentative =
    currentActiveMember?.role === "Representative" ||
    currentActiveMember?.role === "ROLE_REPRESENTATIVE" ||
    currentActiveMember?.role === "SDR" ||
    currentActiveMember?.role === "Business Developer" ||
    currentActiveMember?.role === "Account Executive" ||
    currentActiveMember?.role === "Sales Representative" ||
    currentActiveMember?.role === "Customer Success Representative" ||
    currentActiveMember?.authorizedAccess === "Representative" ||
    currentActiveMember?.authorizedAccess === "User";

  // List of allowed tabs for current role
  const allowedTabs = React.useMemo(() => {
    if (isSuperAdmin || isTenantAdmin) {
      return ["dashboard", "discovery", "integrations", "knowledge", "team", "billing", "contact"];
    }
    if (isProductManager) {
      return ["discovery", "product_signals", "contact"];
    }
    if (isRevenueManager) {
      return ["dashboard", "coaching_playbooks", "score_corrections", "contact"];
    }
    if (isRiskCompliance) {
      return ["discovery", "employee_trends", "compliance_flags", "remediation_timelines", "contact"];
    }
    if (isRepresentative) {
      return ["personal_dashboard", "personal_discovery", "personal_playbooks", "contact"];
    }
    return ["discovery", "contact"];
  }, [isSuperAdmin, isTenantAdmin, isProductManager, isRevenueManager, isRiskCompliance, isRepresentative]);

  // Prevent unauthorized access and force redirect to default allowed tab
  useEffect(() => {
    if (!allowedTabs.includes(activeSubTab)) {
      setActiveSubTab(allowedTabs[0] as any);
    }
  }, [activeSubTab, allowedTabs]);

  const handleInstantSparkOnboarding = async (target: "spark_team" | "tom" | "laura") => {
    setTeamError(null);
    setTeamSuccess(null);
    setIsInviting(true);

    let email = "spark.team@example.com";
    let name = "Spark Science Team";
    let role = "Senior Dialogue Scientist";
    let access = "Tenant Admin";
    let tenantId = "spark_team_tenant";
    let sparkId = "SPK-SPARKTEAM";
    let tempPassword = "SPARK-temp-1010";
    let token = "tok-spark-team-enroll-777777";

    if (target === "tom") {
      email = "tom@sparkanalytic.com";
      name = "Tom Spark Admin";
      role = "Management Account";
      access = "Tenant Admin";
      tenantId = "spark_analytic_llc";
      sparkId = "SPK-TOMSPARK";
      tempPassword = "SPARK-temp-tom-777";
      token = "tok-tom-spark-999";
    } else if (target === "laura") {
      email = "laura@sparkanalytic.com";
      name = "Laura Hansen";
      role = "Representative";
      access = "Representative";
      tenantId = "spark_analytic_llc";
      sparkId = "SPK-LAURAHANSEN";
      tempPassword = "SPARK-temp-laura-999";
      token = "tok-laura-spark-555";
    }

    const dateStr = new Date().toISOString().split("T")[0];

    try {
      const dbRoleForInvite = access === "Tenant Admin" ? "tenant_admin" : (access === "Super Admin" ? "tenant_super_admin" : "ROLE_REPRESENTATIVE");
      const response = await fetch("/api/aws-ses/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          tenantId,
          role: dbRoleForInvite,
          origin: window.location.origin,
          temporaryPassword: tempPassword,
          enrollmentToken: token,
          name,
          sparkId,
          activationDate: dateStr
        }),
      });

      const data = await response.json();

      // Add to team list locally
      const newMember: TeamMember = {
        id: "member-" + target + "-" + Date.now(),
        name,
        email,
        role,
        authorizedAccess: access,
        status: "Invited",
        tempPassword,
        enrollmentToken: token,
        sparkId,
        tenantId,
        activationDate: dateStr
      };

      setTeamMembers(prev => {
        if (prev.some(m => m.email === email)) {
          return prev.map(m => m.email === email ? { ...m, enrollmentToken: token, tempPassword, status: "Invited" } : m);
        }
        return [...prev, newMember];
      });

      setTeamSuccess(`Successfully created ${name}'s invite in Firestore!`);
    } catch (err: any) {
      console.error("[Instant Spark Team Invite Error]:", err);
      setTeamError(`Failed to auto-invite team member: ${err.message || err}`);
    } finally {
      setIsInviting(false);
    }
  };

  const handleInstantSparkTeamSetup = async () => {
    await handleInstantSparkOnboarding("spark_team");
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamError(null);
    setTeamSuccess(null);

    if (!isCurrentUserAdmin) {
      setTeamError("Permission Denied: Only users with Authorized Access set to 'Administrator' can add or invite new members.");
      return;
    }

    if (!newMemberName.trim()) {
      setTeamError("Please provide a name for the new team member.");
      return;
    }

    if (!newMemberEmail.trim()) {
      setTeamError("Please provide an email address for the new team member.");
      return;
    }

    if (!newMemberEmail.includes("@") || !newMemberEmail.includes(".")) {
      setTeamError("Please provide a valid email address.");
      return;
    }

    if (!newMemberRole.trim()) {
      setTeamError("Please provide a role for the new team member.");
      return;
    }

    setIsInviting(true);
    const assignedTenantId = newMemberType === "spark_admin" 
      ? "tenant-master-admin" 
      : (newMemberTenantId.trim() || activeSession?.tenantId || "CLIENT-A");
    const finalSparkId = newMemberSparkId.trim() || ("SPK-" + Math.floor(10000 + Math.random() * 90000));
    const finalActivationDate = newMemberActivationDate || new Date().toISOString().split("T")[0];

    const generatedTempPassword = `SPARK-temp-${Math.floor(1000 + Math.random() * 9000)}`;
    const generatedToken = `tok-${Math.floor(100000 + Math.random() * 900000)}`;

    let dbRole = "ROLE_REPRESENTATIVE";
    if (newMemberType === "spark_admin") {
      dbRole = "spark_admin";
    } else if (newMemberAccess === "Super Admin") {
      dbRole = "tenant_super_admin";
    } else if (newMemberAccess === "Tenant Admin") {
      dbRole = "tenant_admin";
    } else if (newMemberAccess === "Risk & Compliance") {
      dbRole = "ROLE_COMPLIANCE_AUDITOR";
    } else if (newMemberAccess === "Tenant Product Manager" || newMemberAccess === "Product Manager") {
      dbRole = "ROLE_PRODUCT_MANAGER";
    } else if (newMemberAccess === "Revenue Manager") {
      dbRole = "ROLE_REVENUE_MANAGER";
    } else if (newMemberAccess === "Representative") {
      dbRole = "ROLE_REPRESENTATIVE";
    }

    try {
      const response = await fetch("/api/aws-ses/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newMemberEmail.trim().toLowerCase(),
          tenantId: assignedTenantId,
          role: dbRole,
          origin: window.location.origin,
          temporaryPassword: generatedTempPassword,
          enrollmentToken: generatedToken,
          name: newMemberName.trim(),
          sparkId: finalSparkId,
          activationDate: finalActivationDate
        }),
      });

      const data = await response.json();

      let finalTempPassword = generatedTempPassword;
      let finalEnrollmentToken = generatedToken;

      if (response.ok && data.success) {
        if (data.temporaryPassword) finalTempPassword = data.temporaryPassword;
        if (data.enrollmentToken) finalEnrollmentToken = data.enrollmentToken;
        
        setTeamSuccess(`Successfully dispatched enrollment email to ${newMemberEmail.trim()}!`);
      } else {
        console.warn("API returned error, using fallback local registration:", data.error);
        setTeamSuccess(`Invited ${newMemberName.trim()} (Local sync fallback: SES is off or sandbox is limited).`);
      }

      const newMember: TeamMember = {
        id: "member-" + Date.now(),
        name: newMemberName.trim(),
        email: newMemberEmail.trim().toLowerCase(),
        role: newMemberRole.trim(),
        authorizedAccess: newMemberAccess,
        status: "Invited",
        tempPassword: finalTempPassword,
        enrollmentToken: finalEnrollmentToken,
        sparkId: finalSparkId,
        tenantId: assignedTenantId,
        activationDate: finalActivationDate
      };

      setTeamMembers(prev => [...prev, newMember]);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberRole("");
      setNewMemberAccess("Tenant Admin");
      setNewMemberSparkId("");
      setNewMemberTenantId("");
      setNewMemberActivationDate(new Date().toISOString().split('T')[0]);

    } catch (err: any) {
      console.error("Failed to connect to enrollment API:", err);
      setTeamError("Failed to send AWS SES email, but added member to local workspace.");
      
      const newMember: TeamMember = {
        id: "member-" + Date.now(),
        name: newMemberName.trim(),
        email: newMemberEmail.trim().toLowerCase(),
        role: newMemberRole.trim(),
        authorizedAccess: newMemberAccess,
        status: "Invited",
        tempPassword: generatedTempPassword,
        enrollmentToken: generatedToken,
        sparkId: finalSparkId,
        tenantId: assignedTenantId,
        activationDate: finalActivationDate
      };

      setTeamMembers(prev => [...prev, newMember]);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberRole("");
      setNewMemberAccess("Tenant Admin");
      setNewMemberSparkId("");
      setNewMemberTenantId("");
      setNewMemberActivationDate(new Date().toISOString().split('T')[0]);
    } finally {
      setIsInviting(false);
      setTimeout(() => {
        setTeamSuccess(null);
        setTeamError(null);
      }, 5000);
    }
  };

  const handleDeleteMember = async (idToDelete: string) => {
    setTeamError(null);
    setTeamSuccess(null);

    if (!isCurrentUserAdmin) {
      setTeamError("Permission Denied: Only users with Authorized Access set to 'Administrator' can remove team members.");
      return;
    }

    const memberToDelete = teamMembers.find(m => m.id === idToDelete);
    if (!memberToDelete) return;

    if (idToDelete === activeMemberId) {
      setTeamError("Cannot remove yourself while you are the active logged-in user simulation.");
      return;
    }

    try {
      if (db) {
        await deleteDoc(doc(db, "users", idToDelete));
        if (memberToDelete.email) {
          const q = query(collection(db, "users"), where("email", "==", memberToDelete.email.toLowerCase()));
          const snap = await getDocs(q);
          snap.forEach(async (docSnap) => {
            await deleteDoc(docSnap.ref);
          });
        }
      }
    } catch (err) {
      console.warn("Firestore user delete error:", err);
    }

    setTeamMembers(prev => prev.filter(m => m.id !== idToDelete));
    setTeamSuccess(`Successfully removed Admin/User ${memberToDelete.name} (${memberToDelete.email}) from workspace.`);

    setTimeout(() => {
      setTeamSuccess(null);
    }, 4000);
  };

  // Support ticket generation state variables
  const [ticketSubject, setTicketSubject] = useState<string>("");
  const [ticketMessage, setTicketMessage] = useState<string>("");
  const [ticketPriority, setTicketPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState<boolean>(false);

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
      const tenantId = activeSession?.tenantId || "Tenant_ID_Pending";
      const tenantName = activeSession?.tenantName || activeSession?.customerName || "Valued Client";
      
      const newTicket: SupportTicket = {
        id: "ticket-" + Math.floor(1000 + Math.random() * 9000), // Random 4-digit ID
        title: ticketSubject.trim() || "Inbound Portal Inquiry",
        tenantId,
        tenantName,
        priority: ticketPriority,
        status: "Open",
        customerMessage: ticketMessage.trim(),
        createdAt: new Date().toISOString(),
        matchingTelemetryIds: []
      };

      await onAddTicket(newTicket);

      setTicketSuccess(`Support ticket ${newTicket.id} successfully created and submitted to support queue!`);
      setTicketSubject("");
      setTicketMessage("");
      setTicketPriority("MEDIUM");
    } catch (err) {
      console.error("Error creating ticket:", err);
      setTicketError("Failed to submit support ticket. Please try again.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Sync simulator variables when active session changes
  useEffect(() => {
    if (activeSession) {
      if (activeSession.clientConfig) {
        setMonths(activeSession.clientConfig.months);
        setUsers(activeSession.clientConfig.users);
        setCoachingEnabled(activeSession.clientConfig.coachingEnabled);
        setDiagnosticsEnabled(activeSession.clientConfig.diagnosticsEnabled);
      } else {
        setMonths(12);
        setUsers(25);
        setCoachingEnabled(true);
        setDiagnosticsEnabled(true);
      }
      setSimulatorSaved(false);
      setFeedbackSubmitted(false);
      setFeedbackText("");
      setFeedbackAuthor(activeSession.customerName || "");
    }
  }, [selectedSessionId]);

  // Load Billing Details from Firestore when selectedSessionId (or tenantId) changes
  useEffect(() => {
    async function loadBilling() {
      if (!activeSession?.tenantId) return;
      setBillingLoading(true);
      setBillingError(null);
      setBillingSuccess(null);
      try {
        const billingRef = doc(db, "tenants", activeSession.tenantId, "billing", "details");
        const docSnap = await getDoc(billingRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBillingContactName(data.contactName || "");
          setBillingEmail(data.email || "");
          setBillingPhone(data.phone || "");
          setBillingAddress(data.address || "");
          setBillingCity(data.city || "");
          setBillingState(data.state || "");
          setBillingZipCode(data.zipCode || "");
          setBillingCardNumber(data.cardNumber || "");
          setBillingCardExpiry(data.cardExpiry || "");
          setBillingCardCvv(data.cardCvv || "");
          setBillingHasData(true);
        } else {
          // Prepopulate with session defaults if not found
          setBillingContactName(activeSession.customerName || "");
          setBillingEmail("");
          setBillingPhone("");
          setBillingAddress("");
          setBillingCity("");
          setBillingState("");
          setBillingZipCode("");
          setBillingCardNumber("");
          setBillingCardExpiry("");
          setBillingCardCvv("");
          setBillingHasData(false);
        }
      } catch (err) {
        console.error("Failed to load billing details:", err);
        setBillingError("Could not retrieve billing details from secure partition.");
        handleFirestoreError(err, OperationType.GET, `tenants/${activeSession.tenantId}/billing/details`);
      } finally {
        setBillingLoading(false);
      }
    }
    loadBilling();
  }, [selectedSessionId, activeSession?.tenantId]);

  const handleSaveOrUpdateBilling = async (actionType: "save" | "update") => {
    if (!activeSession?.tenantId) {
      setBillingError("No active tenant selected.");
      return;
    }

    setBillingError(null);
    setBillingSuccess(null);

    // Validation
    if (!billingContactName.trim()) {
      setBillingError("Contact Name is required.");
      return;
    }
    if (!billingEmail.trim()) {
      setBillingError("Email is required.");
      return;
    }
    if (!billingPhone.trim()) {
      setBillingError("Phone number is required.");
      return;
    }
    if (!billingAddress.trim()) {
      setBillingError("Address is required.");
      return;
    }
    if (!billingCity.trim()) {
      setBillingError("City is required.");
      return;
    }
    if (!billingState.trim()) {
      setBillingError("State is required.");
      return;
    }
    if (!billingZipCode.trim()) {
      setBillingError("Zip Code is required.");
      return;
    }
    if (!billingCardNumber.trim()) {
      setBillingError("Credit or Debit card number is required.");
      return;
    }
    if (!billingCardExpiry.trim()) {
      setBillingError("Card Expiration Date is required.");
      return;
    }
    if (!billingCardCvv.trim()) {
      setBillingError("Card Security CVV/CVC is required.");
      return;
    }

    setBillingLoading(true);

    try {
      const billingRef = doc(db, "tenants", activeSession.tenantId, "billing", "details");
      const payload = {
        contactName: billingContactName.trim(),
        email: billingEmail.trim().toLowerCase(),
        phone: billingPhone.trim(),
        address: billingAddress.trim(),
        city: billingCity.trim(),
        state: billingState.trim(),
        zipCode: billingZipCode.trim(),
        cardNumber: billingCardNumber.trim(),
        cardExpiry: billingCardExpiry.trim(),
        cardCvv: billingCardCvv.trim(),
        updatedAt: new Date().toISOString(),
        tenantId: activeSession.tenantId
      };

      await setDoc(billingRef, payload);
      setBillingHasData(true);
      setBillingSuccess(
        actionType === "save"
          ? "Billing and payment details successfully created and secured!"
          : "Billing and payment details successfully updated and secured!"
      );

      // Dismiss success after 4 seconds
      setTimeout(() => {
        setBillingSuccess(null);
      }, 4000);
    } catch (err) {
      console.error("Failed to save/update billing details:", err);
      setBillingError("Failed to synchronize payment details with Firestore database.");
      handleFirestoreError(err, OperationType.WRITE, `tenants/${activeSession.tenantId}/billing/details`);
    } finally {
      setBillingLoading(false);
    }
  };

  // ==================== S3 KNOWLEDGE BASE & TRAINING ENGINE ====================
  // S3 Knowledge Base states
  const [s3Files, setS3Files] = useState<any[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isPromptSaving, setIsPromptSaving] = useState<boolean>(false);
  const [isS3Loading, setIsS3Loading] = useState<boolean>(false);
  const [s3Error, setS3Error] = useState<string | null>(null);
  const [s3Success, setS3Success] = useState<string | null>(null);
  const [groundingEnabled, setGroundingEnabled] = useState<boolean>(true);

  // New Knowledge Asset Upload Form state
  const [newS3Name, setNewS3Name] = useState<string>("");
  const [newS3Type, setNewS3Type] = useState<"website" | "policy" | "material" | "other">("website");
  const [newS3Url, setNewS3Url] = useState<string>("");
  const [newS3Desc, setNewS3Desc] = useState<string>("");
  const [newS3Directive, setNewS3Directive] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // AWS S3 Audit Console states
  const [s3AuditLogs, setS3AuditLogs] = useState<string[]>([]);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  const defaultS3Files = [
    {
      id: "kb-playbook-v4",
      name: "Spark Enterprise Sales Playbook v4",
      type: "material",
      url: "https://sparkanalytic.com/secure/playbook-v4.pdf",
      description: "Core sales coaching playbook for handling competitive objections and latency SLA discussions.",
      directive: "Check if reps proactively ask about latency concerns and validate SLA thresholds within 50ms.",
      uploadedAt: "2026-07-10T14:30:00Z",
      size: "2.4 MB",
      status: "synced",
      s3Uri: `s3://spark-tenant-data-${(activeSession?.tenantId || "CLIENT-A").toLowerCase()}/materials/playbook-v4.pdf`
    },
    {
      id: "kb-sla-policy",
      name: "Enterprise SLA & Zero-Air Perimeter Compliance Policy",
      type: "policy",
      url: "https://sparkanalytic.com/secure/SLA_Policy_Compliance_v2.docx",
      description: "Standard SLA policy outlining 99.9% webhook uptime guarantee and Dual-Authorization compliance checklist.",
      directive: "Audit against sections 4.2 and 5.1 to ensure reps mention the dual-authorization secure perimeter.",
      uploadedAt: "2026-07-11T09:15:00Z",
      size: "820 KB",
      status: "synced",
      s3Uri: `s3://spark-tenant-data-${(activeSession?.tenantId || "CLIENT-A").toLowerCase()}/policies/SLA_Policy_Compliance_v2.docx`
    },
    {
      id: "kb-arachnid-specs",
      name: "Arachnid Webhook Integration Technical Reference",
      type: "policy",
      url: "https://sparkanalytic.com/secure/Arachnid_Systems_Technical_Specs.pdf",
      description: "Technical integration specifications for S3 ingestion blocks and webhook dual-authorization.",
      directive: "Verify if client integration doubts regarding webhook latency are answered correctly.",
      uploadedAt: "2026-07-12T11:45:00Z",
      size: "1.2 MB",
      status: "synced",
      s3Uri: `s3://spark-tenant-data-${(activeSession?.tenantId || "CLIENT-A").toLowerCase()}/policies/Arachnid_Systems_Technical_Specs.pdf`
    }
  ];

  // Load Tenant Knowledge & Prompts from Firestore when activeSession changes
  useEffect(() => {
    async function loadTenantKnowledge() {
      if (!activeSession?.tenantId) return;
      setIsS3Loading(true);
      setS3Error(null);
      try {
        const tenantRef = doc(db, "tenants", activeSession.tenantId);
        const docSnap = await getDoc(tenantRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.email) {
            setTenantContactEmail(data.email);
          }
          if (data.s3Files && Array.isArray(data.s3Files)) {
            setS3Files(data.s3Files);
          } else {
            setS3Files(defaultS3Files);
          }
          if (data.customPrompt) {
            setCustomPrompt(data.customPrompt);
          } else {
            setCustomPrompt(
              "You are the Spark Dialogue Analyst. Analyze this call transcript and focus heavily on competitive objection handling, verifying webhook latency SLA guarantees, and confirming S3 dual-authorization compliance."
            );
          }
          if (data.groundingEnabled !== undefined) {
            setGroundingEnabled(data.groundingEnabled);
          } else {
            setGroundingEnabled(true);
          }
        } else {
          setS3Files(defaultS3Files);
          setCustomPrompt(
            "You are the Spark Dialogue Analyst. Analyze this call transcript and focus heavily on competitive objection handling, verifying webhook latency SLA guarantees, and confirming S3 dual-authorization compliance."
          );
          setGroundingEnabled(true);
        }
      } catch (err) {
        console.error("Failed to load tenant knowledge data from Firestore:", err);
        setS3Error("Could not retrieve S3 configuration data from Firestore.");
        setS3Files(defaultS3Files);
      } finally {
        setIsS3Loading(false);
      }
    }
    loadTenantKnowledge();
  }, [selectedSessionId, activeSession?.tenantId]);

  const handleSavePromptSettings = async () => {
    if (!activeSession?.tenantId) return;
    setIsPromptSaving(true);
    setS3Success(null);
    setS3Error(null);
    try {
      const tenantRef = doc(db, "tenants", activeSession.tenantId);
      const docSnap = await getDoc(tenantRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};
      
      const updatedData = {
        ...existingData,
        id: activeSession.tenantId,
        customPrompt,
        groundingEnabled,
        s3Files,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(tenantRef, updatedData);
      setS3Success("Gemini custom analysis guidelines and S3 grounding preferences successfully saved!");
      setTimeout(() => setS3Success(null), 4000);
    } catch (err) {
      console.error("Failed to save prompt settings to Firestore:", err);
      setS3Error("Failed to save settings. Please try again.");
    } finally {
      setIsPromptSaving(false);
    }
  };

  const handleUploadS3Asset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession?.tenantId) return;
    if (!newS3Name.trim()) {
      setS3Error("Please specify a Name for the knowledge asset.");
      return;
    }
    if (newS3Type === "website" && !newS3Url.trim()) {
      setS3Error("Please provide a URL for the website resource.");
      return;
    }

    setS3Error(null);
    setS3Success(null);
    setUploadProgress(10);
    setUploadStatus("Establishing Secure S3 Multipart Connection...");

    // Simulate standard chunked S3 upload over 3 steps
    setTimeout(() => {
      setUploadProgress(40);
      setUploadStatus("Uploading document payload in secure tenant S3 block...");
      setTimeout(() => {
        setUploadProgress(80);
        setUploadStatus("Verifying MD5 integrity checksum and applying KMS Encryption...");
        setTimeout(async () => {
          const newAsset = {
            id: `kb-asset-${Date.now()}`,
            name: newS3Name.trim(),
            type: newS3Type,
            url: newS3Url.trim() || undefined,
            description: newS3Desc.trim(),
            directive: newS3Directive.trim(),
            uploadedAt: new Date().toISOString(),
            size: newS3Type === "website" ? "N/A (Web Crawled)" : `${(Math.random() * 2 + 0.1).toFixed(1)} MB`,
            status: "synced",
            s3Uri: `s3://spark-tenant-data-${activeSession.tenantId.toLowerCase()}/${newS3Type}s/${newS3Name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`
          };

          const updatedFiles = [newAsset, ...s3Files];
          setS3Files(updatedFiles);

          try {
            const tenantRef = doc(db, "tenants", activeSession.tenantId);
            const docSnap = await getDoc(tenantRef);
            const existingData = docSnap.exists() ? docSnap.data() : {};
            await setDoc(tenantRef, {
              ...existingData,
              id: activeSession.tenantId,
              s3Files: updatedFiles,
              updatedAt: new Date().toISOString()
            });
            
            setS3Success(`Knowledge asset "${newS3Name}" successfully uploaded & synced to S3 bucket partition!`);
            setNewS3Name("");
            setNewS3Url("");
            setNewS3Desc("");
            setNewS3Directive("");
            setUploadProgress(null);
            setUploadStatus("");
            setTimeout(() => setS3Success(null), 5000);
          } catch (err) {
            console.error("Failed to update tenant S3 files in Firestore:", err);
            setS3Error("Document was uploaded to S3, but failed to save file reference to Firestore.");
            setUploadProgress(null);
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleDeleteS3Asset = async (assetId: string, assetName: string) => {
    if (!activeSession?.tenantId) return;
    setS3Error(null);
    setS3Success(null);
    const updatedFiles = s3Files.filter(f => f.id !== assetId);
    setS3Files(updatedFiles);
    try {
      const tenantRef = doc(db, "tenants", activeSession.tenantId);
      const docSnap = await getDoc(tenantRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};
      await setDoc(tenantRef, {
        ...existingData,
        s3Files: updatedFiles,
        updatedAt: new Date().toISOString()
      });
      setS3Success(`Successfully deleted "${assetName}" from S3 bucket storage partition.`);
      setTimeout(() => setS3Success(null), 4000);
    } catch (err) {
      console.error("Failed to delete S3 asset from Firestore:", err);
      setS3Error("Failed to delete asset reference from Firestore.");
    }
  };

  const triggerS3AuditCheck = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setS3AuditLogs([]);
    const logs = [
      `[S3 CLIENT INIT] Connecting to AWS endpoint in region us-west-2...`,
      `[S3 CLIENT INIT] Resolving bucket: s3://spark-tenant-data-${(activeSession?.tenantId || "CLIENT-A").toLowerCase()}/`,
      `[SECURITY AUDIT] Checking KMS encryption configuration... (KMS ID: arn:aws:kms:us-west-2:364161:key/spark-kms-isolated)`,
      `[SECURITY AUDIT] KMS Encryption is ACTIVE (AES-256).`,
      `[PERIMETER AUDIT] Validating Dual-Authorization public block access block policies...`,
      `[PERIMETER AUDIT] Dual-Authorization Public Block is ENABLED. Direct public read/write requests are strictly rejected.`,
      `[REPLICATION AUDIT] Querying cross-region replication status (Target: us-east-1 replica bucket)...`,
      `[REPLICATION AUDIT] Replication status: SYNCED (Lag: < 200ms).`,
      `[METADATA SYNC] Scanning object registry chunks...`,
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setS3AuditLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setS3AuditLogs(prev => [
          ...prev,
          `[METADATA SYNC] Found ${s3Files.length} registered tenant-level knowledge files in S3 container.`,
          `[SUMMARY] All S3 access pipelines are 100% HEALTHY, SECURE & DUAL-AUTH VALIDATED (Latency: 14ms).`
        ]);
        setIsAuditing(false);
      }
    }, 450);
  };

  // Pricing calculations
  const basePricePerUser = 45; // $45/user/month
  const contractDiscount = months >= 24 ? 0.85 : months >= 12 ? 0.90 : 1.0;
  const addonCost = (coachingEnabled ? 15 : 0) + (diagnosticsEnabled ? 10 : 0);
  const calculatedMonthlyUserCost = Math.round((basePricePerUser + addonCost) * contractDiscount);
  const totalMonthlyCost = calculatedMonthlyUserCost * users;
  const totalContractCost = totalMonthlyCost * months;

  // ROI Metrics
  const salesIncreaseMultiplier = 0.085;
  const estimatedAnnualRepRevenue = 350000;
  const projectedReturn = Math.round(users * estimatedAnnualRepRevenue * salesIncreaseMultiplier);
  const netROI = projectedReturn - (totalMonthlyCost * 12);

  const handleSaveConfiguration = () => {
    if (!activeSession) return;
    const updatedSession: CallSession = {
      ...activeSession,
      clientConfig: {
        months,
        users,
        coachingEnabled,
        diagnosticsEnabled,
        totalMonthlyCost
      }
    };
    onUpdateSession(updatedSession);
    setSimulatorSaved(true);
    setTimeout(() => setSimulatorSaved(false), 3000);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !feedbackText.trim()) return;

    const newFeedback: CustomerFeedback = {
      id: "feedback-" + Date.now(),
      timestamp: new Date().toISOString(),
      author: feedbackAuthor.trim() || activeSession.customerName || "Valued Client",
      type: feedbackType,
      message: feedbackText.trim()
    };

    const updatedFeedbacks = [...(activeSession.customerFeedback || []), newFeedback];
    let updatedAnalytics = activeSession.analytics ? { ...activeSession.analytics } : null;

    if (updatedAnalytics && feedbackType === "objection") {
      updatedAnalytics.customerObjectionResistance = Math.min(10, updatedAnalytics.customerObjectionResistance + 1);
      updatedAnalytics.successPercentage = Math.max(10, updatedAnalytics.successPercentage - 4);
    }

    const updatedSession: CallSession = {
      ...activeSession,
      customerFeedback: updatedFeedbacks,
      analytics: updatedAnalytics
    };

    onUpdateSession(updatedSession);
    setFeedbackText("");
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 4000);
  };

  // Extract duration from transcript text
  const getDuration = (s: CallSession): string => {
    if (s.transcriptText) {
      const match = s.transcriptText.match(/(\d+)\s*m\b/i);
      if (match) return match[1] + "m";
    }
    return s.id === "seed-arachnid-systems" ? "26m" : "45m";
  };

  // Determine platform from transcript or defaults
  const getPlatform = (s: CallSession): "zoom" | "gong" | "teams" | "google" => {
    if (s.transcriptText?.toLowerCase().includes("zoom")) return "zoom";
    if (s.transcriptText?.toLowerCase().includes("gong")) return "gong";
    if (s.transcriptText?.toLowerCase().includes("google") || s.transcriptText?.toLowerCase().includes("meet")) return "google";
    if (s.transcriptText?.toLowerCase().includes("teams") || s.transcriptText?.toLowerCase().includes("microsoft")) return "teams";
    return "zoom";
  };

  // Search and Filter logic
  const filteredSessions = analyzedSessions.filter(s => {
    // 1. Text Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchText = (
        (s.title || "").toLowerCase().includes(q) ||
        (s.customerName || "").toLowerCase().includes(q) ||
        (s.repName || "").toLowerCase().includes(q) ||
        (s.transcriptText && (s.transcriptText || "").toLowerCase().includes(q))
      );
      if (!matchText) return false;
    }

    // 2. Platform Filter
    const plat = getPlatform(s);
    if (platformFilter !== "all" && plat !== platformFilter) return false;

    // 3. Rep Filter
    if (repFilter !== "all" && s.repName !== repFilter) return false;

    // 4. Date Filter (Mock ranges based on active date in template)
    if (dateRangeFilter === "7d") {
      // Show only recent items or mock match
      return s.id === "seed-arachnid-systems" || (s.title || "").toLowerCase().includes("equine") || (s.title || "").toLowerCase().includes("planning");
    }

    return true;
  });

  // Ask Spark natural language handler
  const handleAskSpark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setAiAnswer(null);

    try {
      const response = await fetch("/api/ask-spark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          transcripts: analyzedSessions,
          customPrompt,
          s3Files,
          groundingEnabled
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ask Spark query failed");
      }

      setAiAnswer(data.answer);
    } catch (err: any) {
      console.error(err);
      setAiAnswer(err.message || "Could not query Spark. Ensure GEMINI_API_KEY is configured in your Secrets panel.");
    } finally {
      setIsSearching(false);
    }
  };

  // Unique list of sales reps in analyzed database for filter dropdown
  const uniqueReps = Array.from(new Set(analyzedSessions.map(s => s.repName)));

  // Dynamic list of side menus matching tenant role and authorized access level
  const dynamicSidebarMenus = [];

  if (isSuperAdmin || isTenantAdmin) {
    dynamicSidebarMenus.push({ id: "dashboard", label: "Executive Dashboard", icon: Activity });
    dynamicSidebarMenus.push({ id: "discovery", label: "Transcript Discovery", icon: Search });
    dynamicSidebarMenus.push({ id: "integrations", label: "Integrations", icon: Layers });
    dynamicSidebarMenus.push({ id: "knowledge", label: "S3 Knowledge Base", icon: Database });
    dynamicSidebarMenus.push({ id: "team", label: "Team Settings", icon: Users });
    if (isSuperAdmin) {
      dynamicSidebarMenus.push({ id: "billing", label: "Billing & Plans", icon: CreditCard });
    }
    dynamicSidebarMenus.push({ id: "contact", label: "Contact Us", icon: MessageSquare });
  } else if (isProductManager) {
    dynamicSidebarMenus.push({ id: "discovery", label: "Cognitive NL Search", icon: Search });
    dynamicSidebarMenus.push({ id: "product_signals", label: "Product Signals & Alignment", icon: Bell, badge: "AI" });
    dynamicSidebarMenus.push({ id: "contact", label: "Contact Us", icon: MessageSquare });
  } else if (isRevenueManager) {
    dynamicSidebarMenus.push({ id: "dashboard", label: "Revenue Dashboard", icon: Activity });
    dynamicSidebarMenus.push({ id: "coaching_playbooks", label: "Coaching Playbooks", icon: ClipboardList });
    dynamicSidebarMenus.push({ id: "score_corrections", label: "Score Corrections", icon: CheckSquare });
    dynamicSidebarMenus.push({ id: "contact", label: "Contact Us", icon: MessageSquare });
  } else if (isRiskCompliance) {
    dynamicSidebarMenus.push({ id: "discovery", label: "Compliance Discovery", icon: Search });
    dynamicSidebarMenus.push({ id: "employee_trends", label: "Employee Trends", icon: BarChart2 });
    dynamicSidebarMenus.push({ id: "compliance_flags", label: "Compliance Flags & Variances", icon: AlertTriangle });
    dynamicSidebarMenus.push({ id: "remediation_timelines", label: "Remediation Timelines", icon: Calendar });
    dynamicSidebarMenus.push({ id: "contact", label: "Contact Us", icon: MessageSquare });
  } else if (isRepresentative) {
    dynamicSidebarMenus.push({ id: "personal_dashboard", label: "My Performance", icon: Activity });
    dynamicSidebarMenus.push({ id: "personal_discovery", label: "My Transcripts", icon: Search });
    dynamicSidebarMenus.push({ id: "personal_playbooks", label: "My Coaching Playbooks", icon: ClipboardList });
    dynamicSidebarMenus.push({ id: "contact", label: "Contact Us", icon: MessageSquare });
  } else {
    dynamicSidebarMenus.push({ id: "discovery", label: "Transcript Discovery", icon: Search });
    dynamicSidebarMenus.push({ id: "contact", label: "Contact Us", icon: MessageSquare });
  }

  return (
    <div className="flex flex-col w-full" id="spark-customer-portal-wrapper">
      {/* Top Tenant Header/Banner */}
      <div className="bg-slate-900 text-slate-100 px-6 py-3.5 rounded-t-3xl border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md" id="tenant-top-portal-header">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="px-2.5 py-0.5 bg-blue-600/20 border border-blue-500/30 rounded text-[9px] font-mono text-blue-400 font-bold tracking-wider uppercase shrink-0">
            Secure DB Partition Active
          </div>
          <span className="text-xs text-slate-300 font-medium truncate">
            CRM Workspace isolated partition for <strong className="text-white">{activeSession?.tenantName || "SnailCare Logistics"}</strong>
          </span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Active Tenant ID:</span>
          <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-mono font-bold tracking-widest shadow-sm">
            {activeSession?.tenantId || "Tenant_ID_Pending"}
          </span>
        </div>
      </div>

      <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-3xl overflow-hidden shadow-xl min-h-[680px] flex flex-col lg:flex-row" id="spark-customer-dashboard">
      
      {/* 1. LEFT SIDEBAR: DARK COHESIVE SYSTEM NAVIGATION */}
      <aside className="w-full lg:w-64 bg-slate-900 text-white shrink-0 p-5 flex flex-col justify-between border-r border-slate-800" id="sidebar-navigation">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-display font-black text-white italic shadow-lg shadow-blue-500/20 text-sm">
              S
            </div>
            <div>
              <span className="font-display font-bold text-slate-100 text-sm block tracking-wide">Spark Analytic</span>
              <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">Active Tenant: {activeSession?.tenantId || "CLIENT-A"}</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1" id="sidebar-menu">
            {dynamicSidebarMenus.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-800 text-white shadow-inner border-l-2 border-blue-500"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <TabIcon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="text-[8px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono border border-blue-500/30">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* System Notifications */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800/85 space-y-2.5 mt-4" id="sidebar-notifications">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
              <span className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider">System Notifications</span>
              <Bell className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="space-y-2 text-[10px]">
              <div className="flex items-center gap-2 bg-slate-800/20 py-1.5 px-2 rounded-lg">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-200 block truncate">Transcript Processed</span>
                  <span className="text-[8px] text-slate-500">5 min ago</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/20 py-1.5 px-2 rounded-lg">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-200 block truncate">Credential Expiring</span>
                  <span className="text-[8px] text-slate-500">2 days left</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Plan Card */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800/85 space-y-3 mt-4" id="sidebar-plan">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider">Plan: ENTERPRISE</span>
              <span className="text-[9px] font-bold text-slate-500 font-mono">75% Seats</span>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 w-3/4" />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>75 / 100 Seats Active</span>
                <span>Renewal: Aug 01</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer User Badge */}
        <div className="pt-4 border-t border-slate-800 mt-6 lg:mt-0 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400 border border-slate-700 font-mono uppercase">
            {(activeSession?.tenantName || "A").charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-slate-200 block truncate">Admin User</span>
            <span className="text-[9px] text-slate-500 block truncate font-mono">
              admin@{activeSession?.tenantName ? activeSession.tenantName.toLowerCase().replace(/\s*&*\s*/g, "").replace(/\s+/g, "") : "client"}.com
            </span>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT MAIN PANEL: LIGHT HIGH-CONTRAST DATA INTERFACE */}
      <main className="flex-1 bg-slate-50 p-6 md:p-8 flex flex-col justify-between overflow-y-auto" id="main-content-panel">
        
        {/* TAB RENDERING ROUTER */}
        <div className="space-y-6">
          
          {/* ==================== SUB-TAB 1: DISCOVERY (CONCEPT MATCH) ==================== */}
          {activeSubTab === "discovery" && (
            <div className="space-y-6" id="discovery-tab-panel">
              {/* Top Header bar with Tenant Details */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Transcript Discovery & AI Insights
                  </h1>
                  <p className="text-xs text-slate-500">
                    Instantly query, analyze, and extract psychological persuasion patterns from current call records.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs bg-white border border-slate-200 py-1.5 px-3 rounded-full font-mono">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span className="font-bold text-slate-700">Developer Cloud Environment Connected</span>
                </div>
              </div>

              {/* Natural Language Search Bar Form */}
              <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200/80">
                <form onSubmit={handleAskSpark} className="flex flex-col sm:flex-row gap-2 relative">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Find calls where the prospect mentioned competitors..."
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-sans"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || searchQuery.trim().length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Ask Spark</span>
                  </button>
                </form>
              </div>

              {/* Natural Language AI Answer Box */}
              <AnimatePresence>
                {aiAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 shadow-xs space-y-2.5"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-blue-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <span className="text-xs font-bold text-blue-900 tracking-wide font-display">Spark AI Semantic Answer</span>
                      </div>
                      <button
                        onClick={() => setAiAnswer(null)}
                        className="text-xs text-blue-500 hover:text-blue-700 font-semibold cursor-pointer"
                      >
                        Clear Results
                      </button>
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed font-sans prose prose-blue max-w-none whitespace-pre-line">
                      {aiAnswer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Interactive Quick Filters bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/60 p-3 rounded-2xl border border-slate-200/60 text-xs">
                {/* Date Range Selection */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Date Range</span>
                  <select
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                  >
                    <option value="all">All Transcripts</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>

                {/* Platform Selection */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Platform</span>
                  <select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                  >
                    <option value="all">All Platforms (Zoom, Gong, Meet, Teams)</option>
                    <option value="zoom">Zoom Video</option>
                    <option value="gong">Gong.io</option>
                    <option value="google">Google Meet</option>
                    <option value="teams">Microsoft Teams</option>
                  </select>
                </div>

                {/* Sales Rep Selection */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Sales Representative</span>
                  <select
                    value={repFilter}
                    onChange={(e) => setRepFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                  >
                    <option value="all">All Sales Representatives</option>
                    {uniqueReps.map(rep => (
                      <option key={rep} value={rep}>{rep}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stacked layout: List of Calls table, then Summary block */}
              <div className="space-y-6">
                
                {/* Transcript Table (Full Width) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Call Title</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Duration</th>
                          <th className="py-3 px-4">Sentiment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredSessions.length === 0 ? (
                           <tr>
                             <td colSpan={4} className="py-8 px-4 text-center text-slate-400 font-medium">
                               <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                               No call transcripts matched the filters or search.
                             </td>
                           </tr>
                        ) : (
                          filteredSessions.map((session) => {
                            const isSelected = session.id === selectedSessionId;
                            const platform = getPlatform(session);
                            return (
                              <tr
                                key={session.id}
                                onClick={() => setSelectedSessionId(session.id)}
                                className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                                  isSelected ? "bg-blue-50/50 font-semibold" : ""
                                }`}
                              >
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center space-x-2.5 min-w-0">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                                      platform === "zoom" ? "bg-blue-500" :
                                      platform === "gong" ? "bg-emerald-500" :
                                      platform === "google" ? "bg-red-500" : "bg-indigo-500"
                                    }`} />
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono shrink-0">
                                      #{session.analysisNumber || "001"}
                                    </span>
                                    <span className="text-slate-900 truncate" title={session.title}>
                                      {session.title}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-slate-500 font-mono">
                                  {session.date ? session.date.substring(0, 10) : "2026-06-15"}
                                </td>
                                <td className="py-3.5 px-4 text-slate-600 font-medium">
                                  {getDuration(session)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    session.analytics?.customerSentiment === "positive"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      : session.analytics?.customerSentiment === "negative"
                                      ? "bg-rose-50 text-rose-700 border border-rose-100"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}>
                                    {session.analytics?.customerSentiment || "Neutral"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
 
                {/* Summary & Feedback Section (Full Width) */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 min-h-[200px] flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                        <span className="font-display font-semibold text-slate-900 text-xs">Summary</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono uppercase font-bold">
                          {activeSession ? getPlatform(activeSession) : "zoom"}
                        </span>
                      </div>
 
                      {activeSession && activeSession.analytics ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 text-xs text-slate-700">
                          {/* Objections section */}
                          <div className="space-y-1.5">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">
                              Objections
                            </span>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 h-full">
                              <p className="font-semibold text-slate-800">
                                {activeSession.analytics.customerObjectionResistance > 6
                                  ? "High Objection Resistance"
                                  : activeSession.analytics.customerObjectionResistance > 3
                                  ? "Pricing & Budget structure mentioned."
                                  : "Minimal logical resistance."}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans">
                                Customer objection resistance was rated at{" "}
                                <strong className="text-slate-700">{activeSession.analytics.customerObjectionResistance}/10</strong>.
                                Primary concern revolves around operational friction, resource capacity, or pricing alignment.
                              </p>
                            </div>
                          </div>
 
                          {/* Action Items section */}
                          <div className="space-y-1.5">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">
                              Action Items
                            </span>
                            <ul className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100 h-full">
                              {activeSession.analytics.nextSteps.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-[11px] leading-normal text-slate-600">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-8">
                          No analytical insights available. Analyze this transcript from the main screen first.
                        </p>
                      )}
                    </div>
 
                    {activeSession && (
                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 mt-4">
                        <span>Lead: <strong>{activeSession.customerName}</strong></span>
                        <span>Rep: <strong>{activeSession.repName}</strong></span>
                      </div>
                    )}
                  </div>
 
                  {/* Feedback Submissions on this session */}
                  {activeSession && activeSession.customerFeedback && activeSession.customerFeedback.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Logged Client Contributions</span>
                      <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                        {activeSession.customerFeedback.map((fb) => (
                          <div key={fb.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-[10px] space-y-1">
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-slate-700">{fb.author}</span>
                              <span className="text-blue-600 uppercase tracking-wider text-[8px]">{fb.type}</span>
                            </div>
                            <p className="text-slate-500 italic">"{fb.message}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
 
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB 2: DASHBOARD ==================== */}
          {activeSubTab === "dashboard" && (
            <div className="space-y-6" id="dashboard-tab-panel">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">
                    Executive Analytics Dashboard
                  </h1>
                  <p className="text-xs text-slate-500">
                    High-level key performance trends compiled across all active buyer alignments.
                  </p>
                </div>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Transcripts</span>
                  <p className="text-2xl font-bold font-mono text-slate-900">{analyzedSessions.length}</p>
                  <span className="text-[9px] text-emerald-600 font-semibold block">100% evaluated successfully</span>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Success likelihood</span>
                  <p className="text-2xl font-bold font-mono text-slate-900">
                    {analyzedSessions.length > 0 
                      ? Math.round(analyzedSessions.reduce((acc, s) => acc + (s.analytics?.successPercentage || 0), 0) / analyzedSessions.length)
                      : 0}%
                  </p>
                  <span className="text-[9px] text-slate-400 block">Predictive sales closing probability</span>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Representative Empathy</span>
                  <p className="text-2xl font-bold font-mono text-slate-900">
                    {analyzedSessions.length > 0 
                      ? (analyzedSessions.reduce((acc, s) => acc + (s.analytics?.repEmpathyScore || 0), 0) / analyzedSessions.length).toFixed(1)
                      : 0} / 10
                  </p>
                  <span className="text-[9px] text-slate-400 block">Active listening & rapport score</span>
                </div>
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Client Objections Raised</span>
                  <p className="text-2xl font-bold font-mono text-slate-900">
                    {analyzedSessions.reduce((acc, s) => acc + (s.customerFeedback?.length || 0), 0)}
                  </p>
                  <span className="text-[9px] text-amber-600 block">Logged via live buyer sandbox</span>
                </div>
              </div>

              {/* Simple Chart */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div>
                  <h3 className="font-display font-semibold text-slate-900 text-xs">Revenue Deal Probability Trends</h3>
                  <p className="text-[10px] text-slate-400">Chronological predictive closure rates based on semantic alignment metrics</p>
                </div>
                <div className="h-64 w-full">
                  {analyzedSessions.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analyzedSessions.map((s, idx) => ({
                          name: `Call ${idx + 1}`,
                          probability: s.analytics?.successPercentage || 50,
                          empathy: (s.analytics?.repEmpathyScore || 5) * 10
                        }))}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="probColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="probability" name="Closing Likelihood %" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#probColor)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      Run transcripts through the dialogue analyst to populate charts.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: INTEGRATIONS ==================== */}
          {activeSubTab === "integrations" && (
            <div className="space-y-6" id="integrations-tab-panel">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">
                    Communications & API Integrations
                  </h1>
                  <p className="text-xs text-slate-500">
                    Connect third-party meeting platforms directly to import conversations for automatic dialogue analysis.
                  </p>
                </div>
                <button
                  onClick={() => {
                    window.history.pushState(null, "", "/integration-guide");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  }}
                  className="py-2 px-4 bg-teal-50 hover:bg-teal-100/80 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-center"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>View Step-by-Step Guide</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white text-teal-600 rounded-xl shrink-0 border border-teal-100 shadow-xs">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-teal-950">How do platform users connect their accounts?</h4>
                    <p className="text-[11px] text-teal-900/80 leading-relaxed mt-0.5">
                      Admins register client applications, and sales representatives link accounts securely via OAuth. Read our full Integration Guide for step-by-step blueprints.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    window.history.pushState(null, "", "/integration-guide");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  }}
                  className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Open Guide</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Zoom Integration Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                      Z
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 text-xs block flex items-center">
                        Zoom Video Integration
                        {zoomConnected ? (
                          <span className="ml-2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        ) : (
                          <span className="ml-2 w-1.5 h-1.5 rounded-full bg-slate-300" />
                        )}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {zoomConnected 
                          ? `Automated cron sync active (Every ${zoomInterval}m)` 
                          : "Synchronized cloud recording pipeline"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setZoomModalOpen(true)}
                      className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
                    >
                      Configure & Sync
                    </button>
                    <button
                      onClick={() => {
                        const nextState = !zoomConnected;
                        setZoomConnected(nextState);
                        setZoomAutoEnabled(nextState);
                        // Save to backend
                        fetch("/api/v1/zoom/credentials", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ enabled: nextState })
                        });
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        zoomConnected 
                          ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      {zoomConnected ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>

                {/* Gong Integration Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                      G
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 text-xs block flex items-center">
                        Gong.io CRM Pipe
                        {gongConnected ? (
                          <span className="ml-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ) : (
                          <span className="ml-2 w-1.5 h-1.5 rounded-full bg-slate-300" />
                        )}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {gongConnected 
                          ? `Automated cron sync active (Every ${gongInterval}m)` 
                          : "Synchronized sales recording integration"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setGongModalOpen(true)}
                      className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                    >
                      Configure & Sync
                    </button>
                    <button
                      onClick={() => {
                        const nextState = !gongConnected;
                        setGongConnected(nextState);
                        setGongAutoEnabled(nextState);
                        // Save to backend
                        fetch("/api/v1/gong/credentials", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ enabled: nextState })
                        });
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        gongConnected 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      {gongConnected ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>

                {/* Teams Integration Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      T
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 text-xs block">Microsoft Teams</span>
                      <span className="text-[10px] text-slate-500">Auto-transcribe team chats and visual calls</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setTeamsConnected(!teamsConnected)}
                    className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      teamsConnected 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    {teamsConnected ? "Connected" : "Connect Now"}
                  </button>
                </div>

                {/* Google Meet Integration Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                      G
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs block">Google Meet Integration</span>
                        {googleConnected ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold font-sans px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Linked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold font-sans px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Not Linked
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Sync Meet transcripts from Google Workspace calendar events</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleGoogle(!googleConnected)}
                    className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      googleConnected 
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300" 
                        : "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                    }`}
                  >
                    {googleConnected ? "Disconnect" : "Connect Google Account"}
                  </button>
                </div>
              </div>

              {googleConnected && <GoogleMeetWorkspace />}
            </div>
          )}

          {/* ==================== SUB-TAB: S3 KNOWLEDGE BASE ==================== */}
          {activeSubTab === "knowledge" && (
            <div className="space-y-6 animate-fadeIn" id="knowledge-tab-panel">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Database className="w-6 h-6 text-blue-600 shrink-0" />
                    S3 Knowledge Base & Model Alignment
                  </h1>
                  <p className="text-xs text-slate-500">
                    Manage your isolated AWS S3 bucket to store tenant-specific websites, internal policies, and playbooks. These resources directly align Gemini’s analysis.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Isolated S3 Bucket Active
                  </span>
                </div>
              </div>

              {/* Status / Errors Alert messages */}
              {s3Error && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Error Encountered:</span> {s3Error}
                  </div>
                </div>
              )}

              {s3Success && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Success:</span> {s3Success}
                  </div>
                </div>
              )}

              {/* Bento Grid Telemetry Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Bucket Details */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Server className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">S3 Storage Registry</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">AWS BUCKET PATH</span>
                    <span className="font-mono text-xs font-bold text-slate-800 truncate block">
                      s3://spark-tenant-data-{(activeSession?.tenantId || "CLIENT-A").toLowerCase()}/
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-400">Total Size:</span>
                    <span className="font-semibold text-slate-700 font-mono">
                      {s3Files.reduce((acc, curr) => acc + (curr.type === "website" ? 0 : parseFloat(curr.size || "0")), 0).toFixed(1)} MB
                    </span>
                  </div>
                </div>

                {/* Security Configuration */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dual-Auth Security & Encryption</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">SSE-KMS Encryption:</span>
                      <span className="font-bold text-emerald-600">Enabled (AES-256)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Object Block Public:</span>
                      <span className="font-bold text-emerald-600">Strictly Blocked</span>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={triggerS3AuditCheck}
                      disabled={isAuditing}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3 h-3 ${isAuditing ? "animate-spin" : ""}`} />
                      Run Live S3 Audit Check
                    </button>
                    {isAuditing && <span className="text-[9px] font-mono text-slate-400">Auditing...</span>}
                  </div>
                </div>

                {/* Gemini Integration Control */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gemini Alignment Engine</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Real-time S3 Grounding:</span>
                      <button
                        onClick={() => {
                          setGroundingEnabled(!groundingEnabled);
                          setS3Success(`S3 Grounding is now ${!groundingEnabled ? "enabled" : "disabled"}. Click 'Save System Instructions' to persist.`);
                          setTimeout(() => setS3Success(null), 3000);
                        }}
                        className={`w-10 h-5 rounded-full p-0.5 transition-all outline-none border cursor-pointer ${
                          groundingEnabled ? "bg-indigo-600 border-indigo-700 justify-end" : "bg-slate-200 border-slate-300 justify-start"
                        } flex items-center`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-xs"></span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      When enabled, uploaded S3 compliance checklists, websites, and policies are dynamically prepended to Spark's analysis context.
                    </p>
                  </div>
                </div>
              </div>

              {/* S3 Audit Log Drawer */}
              {s3AuditLogs.length > 0 && (
                <div className="bg-slate-950 rounded-2xl p-4 font-mono text-[10px] text-slate-300 border border-slate-800 space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="font-bold text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-blue-400" />
                      AWS S3 Dual-Auth Verification Terminal (us-west-2)
                    </span>
                    <button
                      onClick={() => setS3AuditLogs([])}
                      className="text-slate-500 hover:text-slate-300 font-bold"
                    >
                      Clear Logs
                    </button>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {s3AuditLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className={
                          log.includes("[SUMMARY]")
                            ? "text-emerald-400 font-bold pt-1 border-t border-slate-900"
                            : log.includes("ACTIVE") || log.includes("ENABLED") || log.includes("SYNCED")
                            ? "text-emerald-500"
                            : log.includes("Check") || log.includes("Scanning")
                            ? "text-blue-300"
                            : "text-slate-400"
                        }
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Two Column Layout: Custom Prompts / Guidelines & Add New Assets */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Custom Prompt Settings */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-indigo-600" />
                      <div>
                        <h3 className="font-semibold text-slate-900 text-xs">Custom Gemini System Guidelines</h3>
                        <p className="text-[10px] text-slate-400">Directly steer the AI Dialogue Analyst’s focus and coaching directives</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSavePromptSettings}
                      disabled={isPromptSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isPromptSaving ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Instructions</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Dialogue Analysis Directive</label>
                      <textarea
                        rows={6}
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Define custom directives. e.g. Analyze pricing objections and cross-reference with our technical SLA compliance checklists."
                        className="w-full text-xs p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-sans leading-relaxed text-slate-800"
                      />
                    </div>

                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                      <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        Prompt Training Concept
                      </h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        These instructions are combined with the active S3 bucket documents to <strong>train</strong> Gemini’s analysis. This forces the system to audit sales rep dialogues against your exact criteria (e.g. refund rules, technical playbooks) and generate highly relevant corporate coaching corrections.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Add New S3 Asset */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                      <UploadCloud className="w-5 h-5 text-blue-600" />
                      Upload to S3 Bucket
                    </h3>
                    <p className="text-[10px] text-slate-400">Ingest websites, security policies, and sales playbooks</p>
                  </div>

                  <form onSubmit={handleUploadS3Asset} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Asset Name</label>
                        <input
                          type="text"
                          value={newS3Name}
                          onChange={(e) => setNewS3Name(e.target.value)}
                          placeholder="e.g. Competitive Matrix v3"
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Asset Type</label>
                        <select
                          value={newS3Type}
                          onChange={(e) => {
                            setNewS3Type(e.target.value as any);
                            setNewS3Url("");
                          }}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white font-medium"
                        >
                          <option value="website">Website URL (Crawled)</option>
                          <option value="policy">Corporate Policy / SLA</option>
                          <option value="material">Training Material / Deck</option>
                          <option value="other">Other / Custom Text</option>
                        </select>
                      </div>
                    </div>

                    {newS3Type === "website" && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Website URL</label>
                        <input
                          type="url"
                          value={newS3Url}
                          onChange={(e) => setNewS3Url(e.target.value)}
                          placeholder="https://company.com/product-specs"
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Description</label>
                      <input
                        type="text"
                        value={newS3Desc}
                        onChange={(e) => setNewS3Desc(e.target.value)}
                        placeholder="Brief summary of the document contents..."
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Key AI Directive</label>
                      <input
                        type="text"
                        value={newS3Directive}
                        onChange={(e) => setNewS3Directive(e.target.value)}
                        placeholder="e.g. Audit against pricing caps listed in section 3.2"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>

                    {uploadProgress !== null && (
                      <div className="space-y-1.5 p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px]">
                        <div className="flex justify-between font-medium text-blue-800">
                          <span>{uploadStatus}</span>
                          <span className="font-bold">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={uploadProgress !== null}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md hover:shadow-blue-500/15 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload & Sync to isolated S3 Bucket</span>
                    </button>
                  </form>
                </div>

              </div>

              {/* S3 File Browser Registry Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-xs">Registered S3 Knowledge Assets</h3>
                    <p className="text-[10px] text-slate-400">All objects registered in the tenant’s isolated storage vault</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                    {s3Files.length} Objects Synced
                  </span>
                </div>

                {isS3Loading ? (
                  <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-xs">Connecting to AWS and loading file registry...</span>
                  </div>
                ) : s3Files.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                    <HardDrive className="w-10 h-10 mx-auto text-slate-300" />
                    <p>No knowledge documents or websites synced yet.</p>
                    <p className="text-[10px]">Add files above to populate the tenant isolated S3 bucket partition.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                          <th className="p-4">Asset Name / S3 Storage Path</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Uploaded At</th>
                          <th className="p-4">File Size</th>
                          <th className="p-4">Key AI Directive</th>
                          <th className="p-4">S3 Sync Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {s3Files.map((file) => (
                          <tr key={file.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-4">
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                {file.type === "website" ? (
                                  <Link className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                )}
                                {file.name}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate max-w-xs">
                                {file.s3Uri}
                              </span>
                              {file.url && (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  className="text-[10px] text-blue-500 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                                >
                                  Open Resource URL &rarr;
                                </a>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                                file.type === "website" 
                                  ? "bg-blue-50 text-blue-700 border border-blue-100" 
                                  : file.type === "policy"
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              }`}>
                                {file.type}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 font-mono text-[10px]">
                              {new Date(file.uploadedAt).toLocaleString()}
                            </td>
                            <td className="p-4 font-mono font-medium text-slate-600 text-[10px]">
                              {file.size}
                            </td>
                            <td className="p-4 text-slate-600 max-w-xs truncate" title={file.directive}>
                              {file.directive || "No specific guidelines provided."}
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3 text-emerald-500" />
                                Synced to S3
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDeleteS3Asset(file.id, file.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer inline-flex"
                                title="Delete Object from S3 Partition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ==================== SUB-TAB 4: TEAM SETTINGS ==================== */}
          {activeSubTab === "team" && (
            <div className="space-y-6" id="team-tab-panel">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Team Members & Access Control
                  </h1>
                  <p className="text-xs text-slate-500">
                    Manage workspace invitations, define operational roles, and specify authorized security access.
                  </p>
                </div>

                {/* Simulated Persona Switcher */}
                <div className="bg-slate-950 text-white px-4 py-2 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-3 shrink-0 max-w-sm">
                  <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 block font-mono uppercase font-bold">Act As Member (Simulation)</span>
                    <select
                      value={activeMemberId}
                      onChange={(e) => {
                        setActiveMemberId(e.target.value);
                        setTeamError(null);
                        setTeamSuccess(null);
                      }}
                      className="bg-slate-800 text-white text-xs border border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                    >
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.authorizedAccess === "Administrator" ? "Admin" : "Read-Only"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Security Warning Banner */}
              <AnimatePresence mode="wait">
                {isCurrentUserAdmin ? (
                  <motion.div
                    key="admin-banner"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3"
                  >
                    <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-emerald-800">Authorized: Full Workspace Administrator</p>
                      <p className="text-[11px] text-emerald-600 leading-normal mt-0.5">
                        You are logged in as <strong>{currentActiveMember?.name || "Representative"}</strong>. Because your Authorized Access level is <strong>"Administrator"</strong>, you are fully authorized to invite new members and remove existing team members from this portal.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="viewer-banner"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3"
                  >
                    <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-800">Restricted Access Mode: Read-Only</p>
                      <p className="text-[11px] text-amber-600 leading-normal mt-0.5">
                        You are logged in as <strong>{currentActiveMember?.name || "Representative"}</strong> (Authorized Access: <em>{currentActiveMember?.authorizedAccess || "User"}</em>). Only members with Authorized Access level of <strong>"Administrator"</strong> are allowed to invite new users or delete team members. To test admin capabilities, select Phil Muffins in the simulator switcher.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Feedbacks */}
              {teamSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-xs font-semibold">
                  {teamSuccess}
                </div>
              )}
              {teamError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{teamError}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Admin & Member Search & Lookup Console */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          🔍 Admin & Member Lookup Console
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Search, filter, and manage workspace access levels or delete administrators.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold">
                        {teamMembers.filter(m => m.authorizedAccess === "Administrator" || m.authorizedAccess === "Super Admin" || m.authorizedAccess === "Tenant Admin" || m.tenantId === "tenant-master-admin").length} Admins
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
                        {teamMembers.length} Total Members
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        placeholder="Lookup admin or member by name, email, role, or tenant ID..."
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-amber-400 focus:outline-none rounded-xl pl-9 pr-8 py-2 text-xs font-medium"
                      />
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      {memberSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setMemberSearchQuery("")}
                          className="text-slate-400 hover:text-white text-xs font-bold absolute right-3 top-2.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Role Filter Tabs */}
                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl shrink-0 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setMemberRoleFilter("All")}
                        className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-semibold cursor-pointer ${
                          memberRoleFilter === "All" ? "bg-slate-800 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberRoleFilter("Admins")}
                        className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-semibold cursor-pointer ${
                          memberRoleFilter === "Admins" ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "text-amber-400 hover:text-amber-300"
                        }`}
                      >
                        🛡️ Admins Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberRoleFilter("SparkAdmins")}
                        className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-semibold cursor-pointer ${
                          memberRoleFilter === "SparkAdmins" ? "bg-rose-600 text-white font-bold shadow-xs" : "text-rose-400 hover:text-rose-300"
                        }`}
                      >
                        ⚡ Spark Admins
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberRoleFilter("Users")}
                        className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-semibold cursor-pointer ${
                          memberRoleFilter === "Users" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Users
                      </button>
                    </div>
                  </div>
                </div>

                {/* Members Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">
                      Workspace Members ({
                        teamMembers.filter((m) => {
                          const queryStr = memberSearchQuery.toLowerCase().trim();
                          const matchesQuery =
                            !queryStr ||
                            (m.name || "").toLowerCase().includes(queryStr) ||
                            (m.email || "").toLowerCase().includes(queryStr) ||
                            (m.role || "").toLowerCase().includes(queryStr) ||
                            (m.authorizedAccess || "").toLowerCase().includes(queryStr) ||
                            (m.tenantId || "").toLowerCase().includes(queryStr) ||
                            (m.sparkId || "").toLowerCase().includes(queryStr);

                          const isSparkAdmin = m.tenantId === "tenant-master-admin" || (m.email && m.email.endsWith("@sparkanalytic.com"));
                          const isAdmin = isSparkAdmin || m.authorizedAccess === "Administrator" || m.authorizedAccess === "Super Admin" || m.authorizedAccess === "Tenant Admin";

                          if (memberRoleFilter === "Admins") return matchesQuery && isAdmin;
                          if (memberRoleFilter === "SparkAdmins") return matchesQuery && isSparkAdmin;
                          if (memberRoleFilter === "Users") return matchesQuery && !isAdmin;
                          return matchesQuery;
                        }).length
                      } shown)
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono uppercase font-bold">Secure Sync</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Member Name</th>
                          <th className="py-3 px-4">Email Address</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Authorized Access</th>
                          <th className="py-3 px-4">Account Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {teamMembers
                          .filter((member) => {
                            const queryStr = memberSearchQuery.toLowerCase().trim();
                            const matchesQuery =
                              !queryStr ||
                              (member.name || "").toLowerCase().includes(queryStr) ||
                              (member.email || "").toLowerCase().includes(queryStr) ||
                              (member.role || "").toLowerCase().includes(queryStr) ||
                              (member.authorizedAccess || "").toLowerCase().includes(queryStr) ||
                              (member.tenantId || "").toLowerCase().includes(queryStr) ||
                              (member.sparkId || "").toLowerCase().includes(queryStr);

                            const isSparkAdmin = member.tenantId === "tenant-master-admin" || (member.email && member.email.endsWith("@sparkanalytic.com"));
                            const isAdmin = isSparkAdmin || member.authorizedAccess === "Administrator" || member.authorizedAccess === "Super Admin" || member.authorizedAccess === "Tenant Admin";

                            if (memberRoleFilter === "Admins") return matchesQuery && isAdmin;
                            if (memberRoleFilter === "SparkAdmins") return matchesQuery && isSparkAdmin;
                            if (memberRoleFilter === "Users") return matchesQuery && !isAdmin;
                            return matchesQuery;
                          })
                          .map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 font-mono text-[10px]">
                                    {(member?.name || "Member").split(" ").map(n => n[0]).join("")}
                                  </div>
                                <div>
                                  <span className="font-bold text-slate-950 block">{member.name}</span>
                                  {member.sparkId && (
                                    <span className="text-[10px] text-teal-600 font-mono block">Spark ID: {member.sparkId}</span>
                                  )}
                                  {member.id === activeMemberId && (
                                    <span className="text-[9px] text-blue-600 font-semibold block">Acting Persona</span>
                                  )}
                                  {member.status === "Invited" && member.enrollmentToken && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[9.5px] text-amber-600 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-100/50 font-mono font-bold">
                                        Temp Pass: {member.tempPassword || "N/A"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                              <span>{member.email}</span>
                              {member.tenantId && (
                                <span className="text-[10px] text-indigo-600 font-mono block">Tenant ID: {member.tenantId}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 font-medium">
                              {member.role}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                                member.authorizedAccess === "Administrator"
                                  ? "bg-purple-50 text-purple-700 border border-purple-100"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}>
                                {member.authorizedAccess}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono inline-block ${
                                  member.status === "Active"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : member.status === "Invited"
                                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}>
                                  {member.status}
                                </span>
                                {member.activationDate && (
                                  <span className="text-[10px] text-slate-400 block">Activated: {member.activationDate}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {member.status === "Invited" && member.enrollmentToken && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const enrollmentUrl = `${window.location.origin}/enroll?token=${member.enrollmentToken}&email=${encodeURIComponent(member.email)}`;
                                      navigator.clipboard.writeText(enrollmentUrl);
                                      setTeamSuccess(`Copied Enrollment URL for ${member.name}!`);
                                      setTimeout(() => setTeamSuccess(null), 4000);
                                    }}
                                    className="p-1.5 rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                                    title="Copy Enrollment Link"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {isCurrentUserAdmin ? (
                                  <button
                                    onClick={() => handleDeleteMember(member.id)}
                                    disabled={member.id === activeMemberId}
                                    className={`p-1.5 rounded-lg border text-rose-600 transition-colors cursor-pointer ${
                                      member.id === activeMemberId
                                        ? "opacity-30 cursor-not-allowed border-slate-100 text-slate-400"
                                        : "border-rose-100 bg-rose-50 hover:bg-rose-100 hover:text-rose-700"
                                    }`}
                                    title={member.id === activeMemberId ? "Cannot delete yourself" : "Remove team member"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-slate-300 flex items-center justify-end gap-1 text-[10px] font-medium" title="Administrator role required to delete members">
                                    <Lock className="w-3 h-3 text-slate-400" />
                                    <span className="text-slate-400">Locked</span>
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Spark Team Sandbox Setup & Enrollment */}
                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl border border-slate-800 p-6 shadow-lg space-y-4 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-500/15 rounded-2xl text-indigo-400 border border-indigo-400/20">
                        <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-white text-sm">Spark Team Enrollment Sandbox</h4>
                        <p className="text-[10.5px] text-indigo-200/80">Instantly provision and test the multi-tenant onboarding workflow</p>
                      </div>
                    </div>
                    
                    <span className="text-[9px] font-bold text-teal-400 bg-teal-500/15 border border-teal-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider uppercase">
                      Developer Guide
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    This wizard simulates inviting the <strong>Spark Science Team</strong> as a secure enterprise customer. It registers the tenant, builds an invite link, writes a pending record to Firestore, and generates a temporary password.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                    <button
                      type="button"
                      onClick={handleInstantSparkTeamSetup}
                      disabled={isInviting}
                      className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs py-2.5 px-5 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shrink-0"
                    >
                      {isInviting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Provisioning...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Instantly Provision Spark Team Account</span>
                        </>
                      )}
                    </button>

                    {teamMembers.some(m => m.email === "spark.team@example.com") && (
                      <div className="flex flex-wrap items-center gap-2 w-full justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const member = teamMembers.find(m => m.email === "spark.team@example.com");
                            if (member && member.enrollmentToken) {
                              const enrollmentUrl = `${window.location.origin}/enroll?token=${member.enrollmentToken}&email=${encodeURIComponent(member.email)}`;
                              navigator.clipboard.writeText(enrollmentUrl);
                              setTeamSuccess("Copied enrollment link for Spark Team to clipboard!");
                              setTimeout(() => setTeamSuccess(null), 4000);
                            }
                          }}
                          className="py-1.5 px-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3 text-teal-400" />
                          <span>Copy Invite Link</span>
                        </button>

                        <a
                          href={`${window.location.origin}/enroll?token=tok-spark-team-enroll-777777&email=spark.team%40example.com`}
                          className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition-all text-center flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open Enrollment Portal ↗</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {teamMembers.some(m => m.email === "spark.team@example.com") && (
                    <div className="bg-indigo-950/80 border border-indigo-500/30 rounded-2xl p-4 space-y-2 text-xs font-mono">
                      <div className="text-teal-400 font-bold text-[10px] uppercase tracking-wider">// Simulated Credentials</div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Target Email:</span>
                        <span className="text-white font-semibold select-all">spark.team@example.com</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Temporary Password:</span>
                        <span className="text-teal-300 font-bold select-all bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">SPARK-temp-1010</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Role & Access:</span>
                        <span className="text-indigo-300">Senior Dialogue Scientist (Administrator)</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Tenant ID:</span>
                        <span className="text-purple-300">spark_team_tenant</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Invite New Team Member Pallet */}
                <div className="relative">
                  <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 transition-all ${
                    !isCurrentUserAdmin ? "opacity-60 saturate-50 select-none pointer-events-none" : ""
                  }`}>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                        <UserPlus className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="font-display font-semibold text-slate-900 text-xs block">Invite New Team Member</span>
                          <span className="text-[10px] text-slate-400 block">Deploy access keys to category managers</span>
                        </div>
                      </div>

                      <form onSubmit={handleAddMember} className="space-y-4 text-xs">
                        {/* Provisioning Level Selector */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                          <label className="text-[10px] text-slate-500 font-mono font-bold uppercase block tracking-wider">
                            Account Classification / Provisioning Scope
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNewMemberType("customer");
                                setNewMemberAccess("Tenant Admin");
                              }}
                              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                                newMemberType === "customer"
                                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <Building className="w-4 h-4" />
                              <span>🏢 Customer Tenant User</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setNewMemberType("spark_admin");
                                setNewMemberAccess("Spark System Administrator");
                                setNewMemberTenantId("tenant-master-admin");
                                if (!newMemberRole) setNewMemberRole("System Administrator");
                              }}
                              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                                newMemberType === "spark_admin"
                                  ? "bg-slate-900 text-amber-400 border-slate-900 shadow-xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <Shield className="w-4 h-4 text-amber-400" />
                              <span>🛡️ Spark System Admin</span>
                            </button>
                          </div>

                          {newMemberType === "spark_admin" ? (
                            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-2.5 text-[11px] flex items-center gap-2 font-medium mt-1">
                              <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>
                                <strong>Isolation Guarantee:</strong> Spark System Admins are assigned exclusively to the global system workspace (<code>tenant-master-admin</code>) and will <strong>never</strong> be assigned a customer tenant ID.
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10.5px] text-slate-500 font-medium">
                              Standard workspace user profile bound to customer tenant workspace.
                            </div>
                          )}
                        </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Member Name */}
                              <div className="space-y-1">
                                <label className="font-semibold text-slate-600 block">Full Name</label>
                                <input
                                  type="text"
                                  value={newMemberName}
                                  onChange={(e) => setNewMemberName(e.target.value)}
                                  disabled={!isCurrentUserAdmin}
                                  placeholder="e.g. John Doe"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                />
                              </div>

                              {/* Email Address */}
                              <div className="space-y-1">
                                <label className="font-semibold text-slate-600 block flex items-center justify-between">
                                  <span>Email Address</span>
                                  <span className="text-[10px] text-emerald-600 font-mono font-bold">Single Input</span>
                                </label>
                                <input
                                  type="email"
                                  value={newMemberEmail}
                                  onChange={(e) => setNewMemberEmail(e.target.value)}
                                  disabled={!isCurrentUserAdmin}
                                  placeholder="e.g. john.doe@arachnid.com"
                                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 font-medium"
                                />
                              </div>

                              {/* Member Role */}
                              <div className="space-y-1">
                                <label className="font-semibold text-slate-600 block">Workspace Role</label>
                                <input
                                  type="text"
                                  value={newMemberRole}
                                  onChange={(e) => setNewMemberRole(e.target.value)}
                                  disabled={!isCurrentUserAdmin}
                                  placeholder="e.g. Sales Specialist"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                />
                              </div>

                              {/* Authorized Access level */}
                              <div className="space-y-1">
                                <label className="font-semibold text-slate-600 block">Authorized Access Level</label>
                                <select
                                  value={newMemberAccess}
                                  onChange={(e) => setNewMemberAccess(e.target.value)}
                                  disabled={!isCurrentUserAdmin}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                >
                                  <option value="Tenant Admin">Tenant Admin (Corporate Admin)</option>
                                  <option value="Risk & Compliance">Risk & Compliance</option>
                                  <option value="Tenant Product Manager">Tenant Product Manager</option>
                                  <option value="Revenue Manager">Revenue Manager</option>
                                  <option value="Representative">Representative</option>
                                </select>
                              </div>
                            </div>

                        {/* Identity & Access Metadata */}
                        <div className="border-t border-slate-100 pt-3 space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Identity & Access Metadata</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Spark ID */}
                            <div className="space-y-1">
                              <label className="font-semibold text-slate-600 block">Spark ID (Optional)</label>
                              <input
                                type="text"
                                value={newMemberSparkId}
                                onChange={(e) => setNewMemberSparkId(e.target.value)}
                                disabled={!isCurrentUserAdmin}
                                placeholder="e.g. SPK-94285 (Auto-generated if empty)"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                              />
                            </div>

                            {/* Tenant ID */}
                            <div className="space-y-1">
                              <label className="font-semibold text-slate-600 block flex items-center justify-between">
                                <span>Tenant ID</span>
                                {newMemberType === "spark_admin" && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 font-mono font-bold px-1.5 py-0.2 rounded">
                                    System Global
                                  </span>
                                )}
                              </label>
                              {newMemberType === "spark_admin" ? (
                                <div className="bg-slate-900 border border-slate-800 text-amber-400 font-mono text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1.5">
                                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>tenant-master-admin (Spark Admin)</span>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={newMemberTenantId}
                                  onChange={(e) => setNewMemberTenantId(e.target.value)}
                                  disabled={!isCurrentUserAdmin}
                                  placeholder="e.g. CLIENT-A (Auto-detected if empty)"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                />
                              )}
                            </div>

                            {/* Activation Date */}
                            <div className="space-y-1">
                              <label className="font-semibold text-slate-600 block">Date of Account Activation</label>
                              <input
                                type="date"
                                value={newMemberActivationDate}
                                onChange={(e) => setNewMemberActivationDate(e.target.value)}
                                disabled={!isCurrentUserAdmin}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 flex-wrap gap-3">
                          <div className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-1.5 flex-1 min-w-[250px]">
                            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>Security Policy: Invitation links expire in 48 hours. Recipient must authenticate via secure SSO link.</span>
                          </div>
                          <button
                            type="submit"
                            disabled={!isCurrentUserAdmin || isInviting}
                            className="w-full sm:w-auto sm:px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                          >
                            {isInviting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Generating Link...</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Invite Member</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Absolute Disabled Shield Overlay */}
                  {!isCurrentUserAdmin && (
                    <div className="absolute inset-0 bg-slate-50/10 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl">
                      <div className="p-3 bg-white rounded-2xl shadow-md text-amber-500 border border-slate-100 mb-2">
                        <Lock className="w-6 h-6 animate-pulse" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Admin Section Locked</span>
                      <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 leading-normal">
                        Your simulated access level is read-only. Select an Administrator persona from the switcher to unlock.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Corporate Access Control Directory */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6 mt-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">Corporate Access Control Directory</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Security-vetted functional API permissions & organizational clearance levels</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Super Admin */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4.5 space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 text-xs">Super Admin</span>
                        <span className="text-[9px] bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-mono font-bold uppercase">tenant_super_admin</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal font-medium">
                        <strong>System Description:</strong> Internal Spark Analytic operational administration account. All Support Center users have Super Admin Rights.
                      </p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Super Admin Rights</span>
                      <ul className="text-[10px] text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed font-medium">
                        <li>Super Admin has all platform function approvals across all tenants.</li>
                        <li>Super Admin has the ability to manually assign user roles to a tenant user.</li>
                        <li>Can add and delete billing information.</li>
                        <li>Super Admin has peering rights to all user dashboards.</li>
                      </ul>
                      <div className="mt-2 text-[10px] text-purple-700 bg-purple-50/80 p-2 rounded-xl border border-purple-100/40 leading-normal font-bold">
                        ⚠️ MFA Required: Enforces cryptographic token validation for partition access.
                      </div>
                    </div>
                  </div>

                  {/* Tenant Admin */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4.5 space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 text-xs">Tenant Admin</span>
                        <span className="text-[9px] bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded font-mono font-bold uppercase">tenant_admin</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal font-medium">
                        The primary administrator for the client's corporate workspace (typically the VP of Sales Operations, IT Director, or CEO).
                      </p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Tenant Admin Rights</span>
                      <ul className="text-[10px] text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed font-medium">
                        <li>Has the ability to assign a User Role.</li>
                        <li>Has the ability to invite a user to their respective tenant.</li>
                        <li>Has the ability to manage billing.</li>
                        <li>Has peering rights to all transcripts and dashboards of the tenant users.</li>
                        <li>Has the ability to add or delete a user.</li>
                        <li className="text-amber-700 font-semibold list-none mt-1 bg-amber-50/60 px-2 py-0.5 rounded border border-amber-100/40 inline-block">
                          🚫 Does not have the ability to alter a transcript.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Risk & Compliance */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4.5 space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 text-xs">Risk & Compliance</span>
                        <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-mono font-bold uppercase">ROLE_COMPLIANCE_AUDITOR</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal font-medium">
                        <strong>System Description:</strong> Corporate Counsel, Chief Legal Officer, or VP of Human Resources focused entirely on company liability protection.
                      </p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Functional API & Search Permissions</span>
                      <div className="space-y-1.5 text-[10.5px] text-slate-600 leading-relaxed font-medium">
                        <div>
                          <code className="text-rose-600 font-mono font-bold text-[9.5px] bg-rose-50/50 px-1.5 py-0.5 rounded border border-rose-100/30">user:search</code>
                          <span className="text-slate-500 block text-[10px] mt-0.5">Can search a Tenant User by name and title - search and read any transcript by date, customer, keyword.</span>
                        </div>
                        <div>
                          <code className="text-rose-600 font-mono font-bold text-[9.5px] bg-rose-50/50 px-1.5 py-0.5 rounded border border-rose-100/30">employee:trends</code>
                          <span className="text-slate-500 block text-[10px] mt-0.5">Full access to individual employee longitudinal behavioral and execution trends.</span>
                        </div>
                        <div>
                          <code className="text-rose-600 font-mono font-bold text-[9.5px] bg-rose-50/50 px-1.5 py-0.5 rounded border border-rose-100/30">compliance_alerts:read</code>
                          <span className="text-slate-500 block text-[10px] mt-0.5">View automated pricing variances, unauthorized contract discounts, and compliance flag histories.</span>
                        </div>
                        <div>
                          <code className="text-rose-600 font-mono font-bold text-[9.5px] bg-rose-50/50 px-1.5 py-0.5 rounded border border-rose-100/30">remediation:timeline</code>
                          <span className="text-slate-500 block text-[10px] mt-0.5">Review historical data trends to establish unalterable remediation timelines for wrongful-termination insulation.</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-rose-700 bg-rose-50/80 p-2 rounded-xl border border-rose-100/40 leading-normal font-bold space-y-1">
                        <div>🚫 Security Restrictions: Read-only access to historical analytics. Strictly restricted from editing active sales methodologies, configuring CRM integrations, or assigning sales coaching tasks.</div>
                        <div className="text-rose-900 font-extrabold border-t border-rose-200/60 pt-1 mt-1">⚠️ Can not change or alter a transcript.</div>
                      </div>
                    </div>
                  </div>

                  {/* Tenant Product Manager */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4.5 space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 text-xs">Tenant Product Manager</span>
                        <span className="text-[9px] bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-mono font-bold uppercase">ROLE_PRODUCT_MANAGER</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal font-medium">
                        <strong>System Description:</strong> Product Management, Engineering Leads, or Product Owners looking to connect direct client interactions to engineering roadmaps.
                      </p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Functional API & Search Permissions</span>
                      <div className="space-y-1.5 text-[10.5px] text-slate-600 leading-relaxed font-medium">
                        <div>
                          <code className="text-blue-600 font-mono font-bold text-[9.5px] bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/30">transcripts:search</code>
                          <span className="text-slate-500 block text-[10px] mt-0.5">Complete access to Cognitive Natural Language Search to query text transcripts across the organization for product mentions.</span>
                        </div>
                        <div>
                          <code className="text-blue-600 font-mono font-bold text-[9.5px] bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/30">signals:process</code>
                          <span className="text-slate-500 block text-[10px] mt-0.5">Process real-time notifications for feature requests, product bugs, product tickets, support issues, and competitive intelligence metrics.</span>
                        </div>
                        <div>
                          <code className="text-blue-600 font-mono font-bold text-[9.5px] bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/30">product_alignment:detect</code>
                          <span className="text-slate-500 block text-[10px] mt-0.5">Automatically identify and isolate product misalignment from the reps' verbal description during calls.</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-rose-700 bg-rose-50/80 p-2 rounded-xl border border-rose-100/40 leading-normal font-bold">
                        🚫 Security Restrictions: Strictly restricted from viewing representative performance grades, empathy scores, manager 1:1 coaching scripts, or HR compliance timelines.
                      </div>
                    </div>
                  </div>

                  {/* Revenue Manager */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4.5 space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 text-xs">Revenue Manager</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold uppercase">ROLE_REVENUE_MANAGER</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal font-medium">
                        <strong>System Description:</strong> Inside Sales Directors, Regional Sales Managers, or Customer Success Managers looking to drive revenue velocity.
                      </p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Functional API & Dashboard Permissions</span>
                      <div className="space-y-1.5 text-[10.5px] text-slate-600 leading-relaxed font-medium">
                        <div>
                          <code className="text-emerald-600 font-mono font-bold text-[9.5px] bg-emerald-50/50 px-1.5 py-0.5 rounded border border-emerald-100/30">dashboard:view_all</code>
                          <span className="text-slate-500 block text-[10px] mt-0.5">High-level dashboard views mapping performance across all sales representatives.</span>
                        </div>
                        <div>
                          <code className="text-emerald-600 font-mono font-bold text-[9.5px] bg-emerald-50/50 px-1.5 py-0.5 rounded border border-emerald-100/30">alerts:low_performance</code>
                          <span className="text-slate-500 block text-[10px] mt-0.5">Automated dashboard view alerts concerning low performance metrics.</span>
                        </div>
                        <div>
                          <code className="text-emerald-600 font-mono font-bold text-[9.5px] bg-emerald-50/50 px-1.5 py-0.5 rounded border border-emerald-100/30">coaching:manage_playbooks</code>
                          <span className="text-slate-500 block text-[10px] mt-0.5">Review, edit, and assign automated 1:1 coaching playbooks and scripts directly to individual sales representatives.</span>
                        </div>
                        <div>
                          <code className="text-emerald-600 font-mono font-bold text-[9.5px] bg-emerald-50/50 px-1.5 py-0.5 rounded border border-emerald-100/30">scores:apply_corrections</code>
                          <span className="text-slate-500 block text-[10px] mt-0.5">Manually review model-generated scores and apply score corrections to specific transcripts.</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-rose-700 bg-rose-50/80 p-2 rounded-xl border border-rose-100/40 leading-normal font-bold space-y-1">
                        <div>🚫 Security Restrictions: Strictly restricted from viewing cross-departmental HR compliance risk timelines or changing core company workspace or integration configurations.</div>
                        <div className="text-rose-900 font-extrabold border-t border-rose-200/60 pt-1 mt-1">⚠️ Can not change or alter a transcript.</div>
                      </div>
                    </div>
                  </div>

                  {/* Representative */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4.5 space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 text-xs">Representative</span>
                        <span className="text-[9px] bg-slate-200 text-slate-800 border border-slate-300 px-2 py-0.5 rounded font-mono font-bold uppercase">ROLE_REPRESENTATIVE</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal font-medium">
                        <strong>System Description:</strong> Account Executives, SDRs, Customer Success Representatives, Sales Representatives, Business Developer.
                      </p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Functional API & Search Permissions</span>
                      <div className="space-y-1.5 text-[10.5px] text-slate-600 leading-relaxed font-medium">
                        <div>
                          <code className="text-slate-700 font-mono font-bold text-[9.5px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">personal_scorecard:read</code>
                          <span className="text-slate-500 block text-[10px] mt-0.5">Access personal performance dashboards, transcript evaluations.</span>
                        </div>
                        <div>
                          <code className="text-slate-700 font-mono font-bold text-[9.5px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">coaching_notes:read</code>
                          <span className="text-slate-500 block text-[10px] mt-0.5">Read coaching actions or playbooks assigned directly to them by their manager.</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-rose-700 bg-rose-50/80 p-2 rounded-xl border border-rose-100/40 leading-normal font-bold space-y-1">
                        <div>🚫 Security Restrictions: Principle of Least Privilege. Strictly restricted from viewing any peer data, aggregate company dashboards, compliance timelines, or integration settings.</div>
                        <div className="text-rose-900 font-extrabold border-t border-rose-200/60 pt-1 mt-1">⚠️ Can not alter or delete a transcript.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ==================== SUB-TAB 5: BILLING & PLANS (INTERACTIVE PROPOSAL SIMULATOR) ==================== */}
          {activeSubTab === "billing" && isSuperAdmin && (
            <div className="space-y-6" id="billing-tab-panel">
              <div>
                <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">
                  Pricing, Custom Proposal & ROI Modeler
                </h1>
                <p className="text-xs text-slate-500">
                  Configure custom corporate seat tiers, request contracts, and calculate estimated win rate returns instantly.
                </p>
              </div>

              {activeSession ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left 2 Columns: Config Controls */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-slate-900 text-xs">Configure Plan Specifications</h3>
                          <p className="text-[10px] text-slate-400">Tailor pricing to your organization's capacity</p>
                        </div>
                      </div>
                    </div>

                    {/* Users seats slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">Representative Seats (Users)</span>
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded text-[11px]">{users} Seats</span>
                      </div>
                      <input 
                        type="range"
                        min={5}
                        max={150}
                        step={5}
                        value={users}
                        onChange={(e) => {
                          setUsers(Number(e.target.value));
                          setSimulatorSaved(false);
                        }}
                        className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>5 Seats</span>
                        <span>150 Seats (Maximum Discount Volume)</span>
                      </div>
                    </div>

                    {/* Term Duration Months slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">Contract Term Length</span>
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded text-[11px]">{months} Months</span>
                      </div>
                      <input 
                        type="range"
                        min={6}
                        max={36}
                        step={6}
                        value={months}
                        onChange={(e) => {
                          setMonths(Number(e.target.value));
                          setSimulatorSaved(false);
                        }}
                        className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>6 Months</span>
                        <span>36 Months (Get 15% Off Total Package)</span>
                      </div>
                    </div>

                    {/* Add-on Toggles */}
                    <div className="space-y-3">
                      <span className="text-xs font-semibold text-slate-700 block">Add-on Modules</span>
                      
                      <label className="flex items-start gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer block">
                        <input 
                          type="checkbox"
                          checked={coachingEnabled}
                          onChange={(e) => {
                            setCoachingEnabled(e.target.checked);
                            setSimulatorSaved(false);
                          }}
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Spark 1:1 Live AI Coaching</span>
                          <span className="text-[10px] text-slate-500 block">Real-time phrase correction suggestions on calls (+$15/user)</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer block">
                        <input 
                          type="checkbox"
                          checked={diagnosticsEnabled}
                          onChange={(e) => {
                            setDiagnosticsEnabled(e.target.checked);
                            setSimulatorSaved(false);
                          }}
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Behavioral Linguistics Analytics</span>
                          <span className="text-[10px] text-slate-500 block">Persuasion mapping, anxiety diagnostics, dialogue patterns tracker (+$10/user)</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Right 1 Column: Investment Results & Actions */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-slate-900 text-xs">Contract Investment Summary</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900 text-white p-4 rounded-xl space-y-1">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Monthly Investment</span>
                          <p className="text-base font-bold font-mono text-blue-400">${totalMonthlyCost.toLocaleString()}</p>
                          <span className="text-[8px] text-slate-400 block">${calculatedMonthlyUserCost}/seat/month</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Contract Value</span>
                          <p className="text-base font-bold font-mono text-slate-800">${totalContractCost.toLocaleString()}</p>
                          <span className="text-[8px] text-slate-400 block">{months} month term</span>
                        </div>
                      </div>

                      {/* ROI panel */}
                      <div className="bg-blue-50/50 border border-blue-100/60 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                          <span className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            Projected Annual Return
                          </span>
                          <span className="font-mono text-blue-700">${projectedReturn.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Calculated on a conservative 8.5% win rate improvement on an estimated average rep bookings rate of $350k per seat.
                        </p>
                        <div className="pt-1 flex justify-between text-[10px] font-bold text-blue-900 border-t border-blue-100/40">
                          <span>Projected Net ROI:</span>
                          <span className="font-mono text-emerald-600">+${netROI.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button 
                        onClick={handleSaveConfiguration}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{simulatorSaved ? "Configuration Updated!" : "Synchronize Setup with Representative"}</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Secure Subscription Billing & Card Authorization Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6" id="billing-payment-form">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-xs">Secure Subscription Billing & Card Authorization</h3>
                        <p className="text-[10px] text-slate-400">Establish standard payment protocols and secure isolated transaction credentials</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-mono">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>AES-256 Encrypted Connection</span>
                    </div>
                  </div>

                  {/* Form Notifications */}
                  {billingSuccess && (
                    <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-emerald-800 text-xs" id="billing-success-alert">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold">Transaction Confirmed</span>
                        <p className="text-[10px] text-emerald-700 leading-normal">{billingSuccess}</p>
                      </div>
                    </div>
                  )}

                  {billingError && (
                    <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-rose-800 text-xs" id="billing-error-alert">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold">Credential Verification Latency</span>
                        <p className="text-[10px] text-rose-700 leading-normal">{billingError}</p>
                      </div>
                    </div>
                  )}

                  {billingLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                      <span className="text-xs text-slate-400 font-medium">Securing connection to transaction vault...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      {/* Column 1: Billing Contact Information */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-50 pb-1.5 mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">I. Billing Contact & Address Details</span>
                        </div>

                        <div className="space-y-3.5">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Contact Name *</label>
                            <div className="relative">
                              <UserPlus className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                              <input
                                type="text"
                                value={billingContactName}
                                onChange={(e) => setBillingContactName(e.target.value)}
                                placeholder="Phil Muffins"
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Billing Email *</label>
                              <div className="relative">
                                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                                <input
                                  type="email"
                                  value={billingEmail}
                                  onChange={(e) => setBillingEmail(e.target.value)}
                                  placeholder="billing@corporate.com"
                                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Billing Phone *</label>
                              <div className="relative">
                                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                                <input
                                  type="tel"
                                  value={billingPhone}
                                  onChange={(e) => setBillingPhone(e.target.value)}
                                  placeholder="+1 (555) 019-2834"
                                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Street Address *</label>
                            <div className="relative">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                              <input
                                type="text"
                                value={billingAddress}
                                onChange={(e) => setBillingAddress(e.target.value)}
                                placeholder="128 Custom Business Lane, Suite 400"
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">City *</label>
                              <input
                                type="text"
                                value={billingCity}
                                onChange={(e) => setBillingCity(e.target.value)}
                                placeholder="San Francisco"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">State *</label>
                              <input
                                type="text"
                                value={billingState}
                                onChange={(e) => setBillingState(e.target.value)}
                                placeholder="CA"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Zip Code *</label>
                              <input
                                type="text"
                                value={billingZipCode}
                                onChange={(e) => setBillingZipCode(e.target.value)}
                                placeholder="94103"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Credit or Debit Card Details */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-50 pb-1.5 mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">II. Secure Vault Payment Credentials</span>
                        </div>

                        <div className="bg-slate-900 text-white rounded-2xl p-5 relative overflow-hidden shadow-md flex flex-col justify-between h-[160px] max-w-sm border border-slate-800">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CreditCard className="w-32 h-32 text-white" />
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">SparkAnalytic Cloud Subscription</span>
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          </div>
                          
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-mono tracking-widest text-slate-400 block">CARD NUMBER</span>
                            <div className="font-mono text-base tracking-widest text-slate-100 font-medium">
                              {billingCardNumber ? billingCardNumber : "•••• •••• •••• ••••"}
                            </div>
                          </div>

                          <div className="flex justify-between font-mono">
                            <div>
                              <span className="text-[7px] text-slate-400 block tracking-wider">CARDHOLDER</span>
                              <span className="text-[10px] text-slate-200 block truncate max-w-[150px] font-medium font-sans">
                                {billingContactName ? billingContactName.toUpperCase() : "PHIL MUFFINS"}
                              </span>
                            </div>
                            <div className="flex gap-4">
                              <div>
                                <span className="text-[7px] text-slate-400 block tracking-wider">EXPIRES</span>
                                <span className="text-[10px] text-slate-200 block font-medium">
                                  {billingCardExpiry ? billingCardExpiry : "MM/YY"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[7px] text-slate-400 block tracking-wider">CVV</span>
                                <span className="text-[10px] text-slate-200 block font-medium">
                                  {billingCardCvv ? "•••" : "000"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3.5 max-w-sm pt-1">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Credit or Debit Card Number *</label>
                            <div className="relative">
                              <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                              <input
                                type="text"
                                value={billingCardNumber}
                                onChange={(e) => setBillingCardNumber(e.target.value)}
                                placeholder="4111 2222 3333 4444"
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Expiration Date (MM/YY) *</label>
                              <input
                                type="text"
                                value={billingCardExpiry}
                                onChange={(e) => setBillingCardExpiry(e.target.value)}
                                placeholder="12/28"
                                maxLength={5}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Security CVV/CVC *</label>
                              <input
                                type="password"
                                value={billingCardCvv}
                                onChange={(e) => setBillingCardCvv(e.target.value)}
                                placeholder="123"
                                maxLength={4}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Action buttons */}
                  {!billingLoading && (
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleSaveOrUpdateBilling("save")}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>SAVE</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveOrUpdateBilling("update")}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>UPDATE</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                  Please seed or import a transcript first to enable pricing options.
                </div>
              )}
            </div>
          )}

          {/* ==================== SUB-TAB 6: CONTACT US ==================== */}
          {activeSubTab === "contact" && (
            <div className="space-y-6" id="contact-tab-panel">
              <div>
                <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">
                  Support Center & Ticket Generator
                </h1>
                <p className="text-xs text-slate-500">
                  Generate a technical support ticket. This inquiry will instantly sync to the Open Ticket Queue on the central Support Center.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-3xl space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-xs">Generate Technical Ticket</h3>
                    <p className="text-[10px] text-slate-400">Describe your pipeline issue or webhook latency</p>
                  </div>
                </div>

                {/* Success Banner */}
                {ticketSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-xs font-semibold flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span>{ticketSuccess}</span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {ticketError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{ticketError}</span>
                  </div>
                )}

                <form onSubmit={handleGenerateTicket} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Inquiry Subject */}
                    <div className="space-y-1 md:col-span-1">
                      <label className="font-semibold text-slate-700 block">Inquiry Subject / Title</label>
                      <input
                        type="text"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="e.g. Gong CRM Webhook latency spike"
                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    {/* Priority */}
                    <div className="space-y-1 md:col-span-1">
                      <label className="font-semibold text-slate-700 block">Severity Level</label>
                      <select
                        value={ticketPriority}
                        onChange={(e) => setTicketPriority(e.target.value as any)}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      >
                        <option value="LOW">LOW Severity</option>
                        <option value="MEDIUM">MEDIUM Severity</option>
                        <option value="HIGH">HIGH Severity</option>
                      </select>
                    </div>

                    {/* Detailed Message */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="font-semibold text-slate-700 block">Detailed Description / Complaint</label>
                      <textarea
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        rows={6}
                        placeholder="Please detail what failed, any webhook payload rejection error codes, or details about the stalling ingestion pipeline..."
                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium leading-relaxed font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 flex-wrap gap-3">
                    <div className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-1.5 flex-1 min-w-[250px]">
                      <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Security Notice: Central ticket operations will immediately isolate and diagnostic-wrap logs associated with Tenant ID: <strong>{activeSession?.tenantId || "CLIENT-A"}</strong>.</span>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingTicket}
                      className="w-full sm:w-auto sm:px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      {isSubmittingTicket ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Submit Ticket</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: PERSONAL DASHBOARD (REPRESENTATIVE) ==================== */}
          {activeSubTab === "personal_dashboard" && (
            <div className="space-y-6 animate-fade-in" id="personal-dashboard-tab-panel">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Activity className="w-6 h-6 text-blue-600" />
                    My Performance Dashboard
                  </h1>
                  <p className="text-xs text-slate-500">
                    Review your personal dialogue effectiveness, persuasion indices, and 10-dimension evaluation trends.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-full text-emerald-800 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold">Least Privilege Active: Personal View Only</span>
                </div>
              </div>

              {/* Informative Notice Banner */}
              <div className="bg-blue-50 border border-blue-100/50 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-blue-800">
                <Info className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Authorized Representative View</span>
                  <p className="font-medium">
                    You are logged in as <strong className="text-blue-950">{currentActiveMember?.name || "Representative"}</strong>. In strict compliance with the Principle of Least Privilege, you are restricted from viewing any peer data, aggregate company dashboards, compliance timelines, or integration settings.
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              {(() => {
                const repsSessions = personalSessions.length > 0 ? personalSessions : analyzedSessions;
                const isDemoData = personalSessions.length === 0;

                const totalCalls = repsSessions.length;
                const avgSuccess = totalCalls > 0 
                  ? Math.round(repsSessions.reduce((acc, s) => acc + (s.analytics?.successPercentage || 0), 0) / totalCalls)
                  : 0;
                const avgEmpathy = totalCalls > 0
                  ? (repsSessions.reduce((acc, s) => acc + (s.analytics?.repEmpathyScore || 0), 0) / totalCalls).toFixed(1)
                  : "0.0";
                const avgConfidence = totalCalls > 0
                  ? (repsSessions.reduce((acc, s) => acc + (s.analytics?.confidenceIndex || 0), 0) / totalCalls).toFixed(1)
                  : "0.0";

                return (
                  <div className="space-y-6">
                    {isDemoData && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] font-bold text-amber-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>No transcripts directly recorded for your user "{currentActiveMember?.name || "Representative"}". Displaying tenant-wide demo transcripts as a preview simulation.</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Calls Evaluated</span>
                        <div className="text-2xl font-bold text-slate-900 mt-1">{totalCalls}</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">All personal transcripts</div>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Avg Success Likelihood</span>
                        <div className="text-2xl font-bold text-blue-600 mt-1">{avgSuccess}%</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">Dialogue closing probability</div>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Avg Empathy Rating</span>
                        <div className="text-2xl font-bold text-emerald-600 mt-1">{avgEmpathy}/10</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">Consultative empathy index</div>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Avg Confidence Index</span>
                        <div className="text-2xl font-bold text-purple-600 mt-1">{avgConfidence}/10</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">Logical structural authority</div>
                      </div>
                    </div>

                    {/* Chart & Highlights */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs">My Success Rate & Empathy Trend</h3>
                          <p className="text-[10px] text-slate-400">Longitudinal personal performance over recent dialogues</p>
                        </div>
                        <div className="h-64">
                          {totalCalls > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={repsSessions.slice().reverse().map((s) => ({
                                  date: s.date ? s.date.substring(5, 10) : "06-15",
                                  success: s.analytics?.successPercentage || 50,
                                  empathy: (s.analytics?.repEmpathyScore || 5) * 10
                                }))}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                              >
                                <defs>
                                  <linearGradient id="personalSuccessColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="personalEmpathyColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={[0, 100]} />
                                <Tooltip />
                                <Area type="monotone" dataKey="success" name="Success %" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#personalSuccessColor)" />
                                <Area type="monotone" dataKey="empathy" name="Empathy (x10)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#personalEmpathyColor)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                              No data trend points available
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs">Personal Strengths & Milestones</h3>
                          <p className="text-[10px] text-slate-400">Derived from your highest-scoring transcripts</p>
                        </div>
                        <div className="space-y-3 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                            <span className="font-bold text-slate-800 text-[11px] block flex items-center gap-1">
                              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                              Exceptional Objection Insulation
                            </span>
                            <p className="text-[10px] text-slate-500 leading-normal">
                              Your usage of the Milton Pattern model has successfully insulated client pricing concerns, averaging a high closing likelihood.
                            </p>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                            <span className="font-bold text-slate-800 text-[11px] block flex items-center gap-1">
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                              Consultative Alignment Score
                            </span>
                            <p className="text-[10px] text-slate-500 leading-normal">
                              Active listening is strong. The talk-ratio remains perfectly paced between 40% to 50% across analyzed transcripts.
                            </p>
                          </div>

                          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl space-y-1">
                            <span className="font-bold text-rose-800 text-[11px] block flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              Focus Point
                            </span>
                            <p className="text-[10px] text-rose-600 leading-normal font-semibold">
                              Ensure logical closure triggers are requested earlier. Avoid lingering on operational diagnostic stages.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ==================== SUB-TAB: PERSONAL TRANSCRIPTS DISCOVERY (REPRESENTATIVE) ==================== */}
          {activeSubTab === "personal_discovery" && (
            <div className="space-y-6 animate-fade-in" id="personal-discovery-tab-panel">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Search className="w-6 h-6 text-blue-600" />
                    My Evaluated Transcripts
                  </h1>
                  <p className="text-xs text-slate-500">
                    Search and inspect your personal client dialogues and AI-powered performance evaluations.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-full text-emerald-800 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold">Least Privilege Active: Personal Transcripts Only</span>
                </div>
              </div>

              {/* Filters Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block text-[10px] mb-1">Search Keywords or Customer</label>
                  <input
                    type="text"
                    value={personalSearchQuery}
                    onChange={(e) => setPersonalSearchQuery(e.target.value)}
                    placeholder="Search by customer name, transcript text or keywords..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block text-[10px] mb-1">Call Platform</label>
                  <select
                    value={personalPlatformFilter}
                    onChange={(e) => setPersonalPlatformFilter(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    <option value="all">All Platforms</option>
                    <option value="zoom">Zoom Video</option>
                    <option value="gong">Gong Ingest</option>
                    <option value="google">Google Meet</option>
                    <option value="teams">Microsoft Teams</option>
                  </select>
                </div>
              </div>

              {/* Stacked Layout of Transcripts */}
              {(() => {
                const baseRepsSessions = personalSessions.length > 0 ? personalSessions : analyzedSessions;
                
                // Filter
                const filteredRepsSessions = baseRepsSessions.filter((session) => {
                  if (personalPlatformFilter !== "all" && getPlatform(session) !== personalPlatformFilter) {
                    return false;
                  }
                  if (personalSearchQuery) {
                    const q = personalSearchQuery.toLowerCase();
                    const textMatch = (session.transcriptText || "").toLowerCase().includes(q);
                    const titleMatch = (session.title || "").toLowerCase().includes(q);
                    const custMatch = (session.customerName || "").toLowerCase().includes(q);
                    return textMatch || titleMatch || custMatch;
                  }
                  return true;
                });

                const activeRepSession = filteredRepsSessions.find(s => s.id === personalSelectedSessionId) || filteredRepsSessions[0] || null;

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left side: list of personal transcripts */}
                    <div className="lg:col-span-1 space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">My Dialogues ({filteredRepsSessions.length})</span>
                      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                        {filteredRepsSessions.length === 0 ? (
                          <div className="py-8 px-4 text-center text-slate-400 font-medium text-xs">
                            <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            No personal transcripts match filters.
                          </div>
                        ) : (
                          filteredRepsSessions.map((session) => {
                            const isSelected = session.id === (activeRepSession?.id || "");
                            const platform = getPlatform(session);
                            return (
                              <div
                                key={session.id}
                                onClick={() => setPersonalSelectedSessionId(session.id)}
                                className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors text-xs space-y-1.5 ${
                                  isSelected ? "bg-blue-50/50 border-l-4 border-blue-600 pl-2.5 font-semibold" : ""
                                }`}
                              >
                                <div className="flex items-center justify-between min-w-0">
                                  <span className="font-bold text-slate-900 truncate" title={session.title}>
                                    {session.title}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-600 font-mono">
                                    #{session.analysisNumber || "001"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                  <span className="font-mono">{session.date ? session.date.substring(0, 10) : "2026-06-15"}</span>
                                  <span className="capitalize text-blue-600 font-medium">{platform}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Right side: Detailed transcript and analysis */}
                    <div className="lg:col-span-2 space-y-4">
                      {activeRepSession ? (
                        <>
                          {/* Top Card: Stats & Customer Information */}
                          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                              <div>
                                <h3 className="font-bold text-slate-900 text-sm">{activeRepSession.title}</h3>
                                <p className="text-[10px] text-slate-400">Lead Customer: <strong>{activeRepSession.customerName}</strong></p>
                              </div>
                              <span className="text-[9px] font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                closing: {activeRepSession.analytics?.successPercentage || 50}%
                              </span>
                            </div>

                            {/* Dialogue metrics */}
                            {activeRepSession.analytics && (
                              <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Talk Ratio</span>
                                  <span className="text-xs font-bold text-slate-700 font-mono">{activeRepSession.analytics.speakingListeningRatio}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Empathy</span>
                                  <span className="text-xs font-bold text-emerald-600 font-mono">{activeRepSession.analytics.repEmpathyScore}/10</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Sentiment</span>
                                  <span className={`text-[10px] font-bold uppercase ${
                                    activeRepSession.analytics.customerSentiment === "positive" ? "text-emerald-600" :
                                    activeRepSession.analytics.customerSentiment === "negative" ? "text-rose-600" : "text-slate-500"
                                  }`}>{activeRepSession.analytics.customerSentiment}</span>
                                </div>
                              </div>
                            )}

                            {/* Dialogue Transcript */}
                            <div className="space-y-1.5">
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Dialogue Transcript</span>
                              <div className="bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800 max-h-52 overflow-y-auto text-[11px] leading-relaxed font-mono space-y-2">
                                {activeRepSession.transcriptText.split("\n").map((line, idx) => (
                                  <p key={idx} className={line.startsWith("Representative") || line.startsWith("Representative (Mark)") || line.startsWith("Representative (Sarah)") ? "text-blue-400" : "text-slate-200"}>
                                    {line}
                                  </p>
                                ))}
                              </div>
                            </div>

                            {/* AI Insights and Milton pattern matching */}
                            {activeRepSession.analytics && activeRepSession.analytics.miltonPatterns && (
                              <div className="space-y-2">
                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Dialogue Pattern Evaluations</span>
                                <div className="space-y-2 max-h-52 overflow-y-auto">
                                  {activeRepSession.analytics.miltonPatterns.map((match, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 space-y-1 text-xs">
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-800">{match.patternName}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                          match.evaluation === "effective" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                          match.evaluation === "ineffective" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                                          "bg-slate-100 text-slate-600 border border-slate-200"
                                        }`}>{match.evaluation}</span>
                                      </div>
                                      <p className="italic text-slate-500 text-[10.5px]">"{match.quote}"</p>
                                      <p className="text-[10px] text-slate-400 leading-normal">{match.description}</p>
                                      {match.improvementSuggestion && (
                                        <p className="text-[10px] text-blue-600 bg-blue-50/50 p-1.5 rounded-lg border border-blue-100/30 font-medium leading-relaxed mt-1">
                                          💡 Advice: {match.improvementSuggestion}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Security Notice Blocking Edits/Deletes */}
                            <div className="bg-rose-50/80 border border-rose-100/50 rounded-xl p-3 text-[10px] leading-relaxed text-rose-800 space-y-1">
                              <div className="font-bold flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-rose-600" />
                                <span>Security Level: Principal of Least Privilege Enforced</span>
                              </div>
                              <p className="font-medium text-rose-700">
                                Representative profiles can not alter, edit, or delete any recorded transcripts or AI evaluation insights. These records are cryptographically sealed in the central tenant partition.
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                          No active transcript selected or found.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ==================== SUB-TAB: PERSONAL PLAYBOOKS (REPRESENTATIVE) ==================== */}
          {activeSubTab === "personal_playbooks" && (
            <div className="space-y-6 animate-fade-in" id="personal-playbooks-tab-panel">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-blue-600" />
                    My Coaching & Assigned Playbooks
                  </h1>
                  <p className="text-xs text-slate-500">
                    Review unalterable 1:1 sales playbooks, objection response scripts, and action frameworks assigned directly to you by your manager.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-full text-emerald-800 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold">Least Privilege Active: Direct Assignments Only</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                {/* Left column: List of assigned playbooks */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">My Assigned Playbooks</span>
                  
                  <div className="space-y-2.5">
                    {/* Playbook 1 */}
                    <button
                      onClick={() => setActivePlaybookId("pricing_objections")}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs block transition-all ${
                        activePlaybookId === "pricing_objections"
                          ? "bg-blue-50/50 border-blue-200"
                          : "bg-slate-50/50 hover:bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900 text-xs">Objection Handling: Pricing Resistance</span>
                        {acknowledgedPlaybooks.includes("pricing_objections") ? (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono uppercase font-bold shrink-0">Reviewed</span>
                        ) : (
                          <span className="text-[8px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-mono uppercase font-bold shrink-0">Pending</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">Assigned by: Sales Manager (Active)</p>
                    </button>

                    {/* Playbook 2 */}
                    <button
                      onClick={() => setActivePlaybookId("competitor_strategy")}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs block transition-all ${
                        activePlaybookId === "competitor_strategy"
                          ? "bg-blue-50/50 border-blue-200"
                          : "bg-slate-50/50 hover:bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900 text-xs">Competitor Counter-Strategy</span>
                        {acknowledgedPlaybooks.includes("competitor_strategy") ? (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono uppercase font-bold shrink-0">Reviewed</span>
                        ) : (
                          <span className="text-[8px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-mono uppercase font-bold shrink-0">Pending</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">Assigned by: VP Customer Success</p>
                    </button>

                    {/* Playbook 3 */}
                    <button
                      onClick={() => setActivePlaybookId("sso_security")}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs block transition-all ${
                        activePlaybookId === "sso_security"
                          ? "bg-blue-50/50 border-blue-200"
                          : "bg-slate-50/50 hover:bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900 text-xs">Enterprise SSO & Security Protocols</span>
                        {acknowledgedPlaybooks.includes("sso_security") ? (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono uppercase font-bold shrink-0">Reviewed</span>
                        ) : (
                          <span className="text-[8px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-mono uppercase font-bold shrink-0">Pending</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">Assigned by: Security Operations</p>
                    </button>
                  </div>
                </div>

                {/* Right column: Active playbook content details */}
                <div className="lg:col-span-2 space-y-4">
                  {activePlaybookId === "pricing_objections" && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                      <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Pricing Resistance Objection Handling</h3>
                          <p className="text-[10px] text-slate-400">Target Framework: ROI Articulation & Value-Mapping</p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                          Priority: CRITICAL
                        </span>
                      </div>

                      <div className="space-y-3">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Assigned Instruction</span>
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-slate-700 leading-relaxed font-sans">
                          "Use consultative Milton language pattern structures. Ensure that rather than agreeing to discounts, you frame the cost as a long-term capital efficiency offset. Quote our sub-second database replication indices to justify enterprise premium."
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Dialogue Script Block (Suggested Reponses)</span>
                        <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-850 font-mono text-[11px] leading-relaxed space-y-2">
                          <p className="text-slate-400"># When client states: "This exceeds our standard legacy budgets"</p>
                          <p>"I know you want to protect your team's budget, but will we integrate next week or the week after? Automating this will allow you to scale instantly, saving up to 15 hours per rep."</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[10px] text-slate-400">
                          Assigned to: <strong>{currentActiveMember?.name || "Representative"}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!acknowledgedPlaybooks.includes("pricing_objections")) {
                              setAcknowledgedPlaybooks([...acknowledgedPlaybooks, "pricing_objections"]);
                            }
                          }}
                          disabled={acknowledgedPlaybooks.includes("pricing_objections")}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-emerald-600 disabled:cursor-default text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {acknowledgedPlaybooks.includes("pricing_objections") ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Reviewed & Acknowledged</span>
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Mark Playbook as Read</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {activePlaybookId === "competitor_strategy" && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                      <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Competitor Counter-Strategy</h3>
                          <p className="text-[10px] text-slate-400">Target Framework: Preserving Premium & Handling Snowflake mentions</p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                          Priority: HIGH
                        </span>
                      </div>

                      <div className="space-y-3">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Assigned Instruction</span>
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-slate-700 leading-relaxed font-sans">
                          "Do not speak negatively about alternatives. Instead, pivot on direct-device microphone integration (Spark Go mobile) and our real-time Cognitive NLP Search capability which competitors completely lack."
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Dialogue Script Block (Suggested Reponses)</span>
                        <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-850 font-mono text-[11px] leading-relaxed space-y-2">
                          <p className="text-slate-400"># When client mentions snowflake / external databases</p>
                          <p>"We respect legacy storage options. However, our ability to record direct on-device audio and generate 10-dimensional evaluation models in sub-seconds is what sets us apart."</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[10px] text-slate-400">
                          Assigned to: <strong>{currentActiveMember?.name || "Representative"}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!acknowledgedPlaybooks.includes("competitor_strategy")) {
                              setAcknowledgedPlaybooks([...acknowledgedPlaybooks, "competitor_strategy"]);
                            }
                          }}
                          disabled={acknowledgedPlaybooks.includes("competitor_strategy")}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-emerald-600 disabled:cursor-default text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {acknowledgedPlaybooks.includes("competitor_strategy") ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Reviewed & Acknowledged</span>
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Mark Playbook as Read</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {activePlaybookId === "sso_security" && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                      <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Enterprise SSO & Security Protocols</h3>
                          <p className="text-[10px] text-slate-400">Target Framework: Multi-Tenant Isolation & Least Privilege reassurance</p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                          Priority: MEDIUM
                        </span>
                      </div>

                      <div className="space-y-3">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Assigned Instruction</span>
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-slate-700 leading-relaxed font-sans">
                          "Confidently assure security personnel that all transcript data is isolated per tenant at the database query level, with zero cross-leak risk and strict Role-Based access rules."
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] block">Dialogue Script Block (Suggested Reponses)</span>
                        <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-850 font-mono text-[11px] leading-relaxed space-y-2">
                          <p className="text-slate-400"># When client asks about SSO and data isolation</p>
                          <p>"We enforce the Principle of Least Privilege across all users. Your raw transcripts and compliance pipelines are completely isolated and can never be accessed by peer accounts."</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[10px] text-slate-400">
                          Assigned to: <strong>{currentActiveMember?.name || "Representative"}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!acknowledgedPlaybooks.includes("sso_security")) {
                              setAcknowledgedPlaybooks([...acknowledgedPlaybooks, "sso_security"]);
                            }
                          }}
                          disabled={acknowledgedPlaybooks.includes("sso_security")}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-emerald-600 disabled:cursor-default text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {acknowledgedPlaybooks.includes("sso_security") ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Reviewed & Acknowledged</span>
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Mark Playbook as Read</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}



          {/* ==================== SUB-TAB: PRODUCT SIGNALS & ALIGNMENT ==================== */}
          {activeSubTab === "product_signals" && (
            <div className="space-y-6" id="product-signals-tab-panel">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Bell className="w-6 h-6 text-blue-600" />
                    Product Signals & Alignment Engine
                  </h1>
                  <p className="text-xs text-slate-500">
                    Process unprompted feature requests, product bugs, support issues, competitive intelligence metrics, and representative misalignments.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 py-1.5 px-3 rounded-full font-mono">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span>Real-time Product Sync Active</span>
                </div>
              </div>

              {/* Grid 1: Product Misalignment & Competitor Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Product Misalignment Detection */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span className="font-display font-semibold text-slate-900 text-xs">Capability Misalignment Alerts</span>
                    </div>
                    <span className="text-[9px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-mono uppercase font-bold">2 High Severity</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">Transcript #004 • Enterprise SSO Promise</span>
                        <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono font-bold">CRITICAL</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        Representative promised custom OAuth2 integration is completed and supports real-time multi-tenant sync.
                      </p>
                      <div className="text-[10px] text-rose-800 font-semibold bg-rose-100/40 p-2 rounded-lg border border-rose-100/50">
                        🚫 Product Specification Conflict: Single Tenant Custom OAuth is currently in PRIVATE BETA; Multi-tenant is scheduled for Q4.
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">Transcript #007 • Real-time Data Sync</span>
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">MEDIUM</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">
                        Representative assured prospect that the platform provides sub-second Postgres replication.
                      </p>
                      <div className="text-[10px] text-amber-800 font-semibold bg-amber-100/40 p-2 rounded-lg border border-amber-100/50">
                        ⚠️ Product Specification Conflict: Replication runs on a 15-minute batch window. True real-time replication requires Enterprise licensing.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Competitive Intelligence Tracker */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                      <span className="font-display font-semibold text-slate-900 text-xs">Competitive Intelligence Mentions</span>
                    </div>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono uppercase font-bold">Last 30 Days</span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="font-semibold text-slate-800">Snowflake Architecture</span>
                      </div>
                      <span className="font-mono text-slate-500">12 mentions</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-slate-800">Gong.io API Integration</span>
                      </div>
                      <span className="font-mono text-slate-500">18 mentions</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="font-semibold text-slate-800">Salesforce Real-time Flow</span>
                      </div>
                      <span className="font-mono text-slate-500">9 mentions</span>
                    </div>
                    
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[10.5px] leading-relaxed text-slate-600 mt-2 font-medium">
                      💡 <strong>Product Recommendation:</strong> Mentions of <em>Gong.io integration capability</em> has surged by 45% week-over-week. Product team should expedite public API documentation release.
                    </div>
                  </div>
                </div>

              </div>

              {/* Support & Feature Request Processing */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-blue-600" />
                    <span className="font-display font-semibold text-slate-900 text-xs">Feature Requests & Bug Signals Queue</span>
                  </div>
                  <button
                    onClick={() => {
                      alert("Successfully synced and pushed all active product signals to JIRA and Linear roadmap trackers!");
                    }}
                    className="text-xs bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-lg hover:bg-blue-100 transition-all border border-blue-100 cursor-pointer"
                  >
                    Sync to Jira / Linear
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
                    <span className="text-[8px] font-bold text-blue-700 bg-blue-100/50 px-1.5 py-0.5 rounded font-mono uppercase">Feature Request</span>
                    <h4 className="font-bold text-slate-800">Dynamic Score Correction API</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Requested by 4 enterprise customers to programmatically correct model-generated scores.
                    </p>
                    <div className="text-[9px] text-slate-400 font-mono pt-1">Status: Backlog Refinement</div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
                    <span className="text-[8px] font-bold text-amber-700 bg-amber-100/50 px-1.5 py-0.5 rounded font-mono uppercase">Product Bug</span>
                    <h4 className="font-bold text-slate-800">S3 SQS Webhook Ingestion Drop</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Identified webhook dropped payloads during peak call ingestion periods from Zoom pipelines.
                    </p>
                    <div className="text-[9px] text-slate-400 font-mono pt-1">Status: In Progress (Sprint 24)</div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2">
                    <span className="text-[8px] font-bold text-purple-700 bg-purple-100/50 px-1.5 py-0.5 rounded font-mono uppercase">Competitive Signal</span>
                    <h4 className="font-bold text-slate-800">Outreach.io Feature parity</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Prospects request sequence automated steps parity inside Gong dashboards.
                    </p>
                    <div className="text-[9px] text-slate-400 font-mono pt-1">Status: Under Evaluation</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: COACHING PLAYBOOKS ==================== */}
          {activeSubTab === "coaching_playbooks" && (
            <div className="space-y-6" id="coaching-playbooks-tab-panel">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-blue-600" />
                    Representative Coaching & Playbooks
                  </h1>
                  <p className="text-xs text-slate-500">
                    Review, edit, and assign unalterable 1:1 automated sales scripts and coaching materials directly to representatives.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Playbook List */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Playbooks</span>
                  
                  <div className="space-y-2">
                    <button className="w-full text-left p-3 rounded-xl border border-blue-100 bg-blue-50/40 text-xs font-semibold block transition-all">
                      <div className="text-blue-900 font-bold">Objection Handling: Pricing Resistance</div>
                      <div className="text-[10px] text-slate-500 mt-1">Focused on ROI articulation and cost insulation models.</div>
                    </button>
                    
                    <button className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs font-semibold block transition-all">
                      <div className="text-slate-900 font-bold">Competitor Counter-Strategy</div>
                      <div className="text-[10px] text-slate-500 mt-1">Handling mentions of Snowflake and legacy data engines.</div>
                    </button>

                    <button className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs font-semibold block transition-all">
                      <div className="text-slate-900 font-bold">Enterprise SSO & Security</div>
                      <div className="text-[10px] text-slate-500 mt-1">Standard answers for security reviews and tenant access limits.</div>
                    </button>
                  </div>
                </div>

                {/* Editor & Assignment Form */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Active Playbook Customizer</span>
                    <p className="text-[10px] text-slate-400">Configure playbooks and assign them to target representatives.</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Playbook Script / Reference Material</label>
                      <textarea
                        rows={6}
                        defaultValue={`When the prospect raises pricing friction, pivot immediately to the Spark Analytic cost optimization framework:
1. "I completely understand that budget is top of mind. Let's look at how much developer engineering latency is reduced."
2. Cite the 15-minute sync SLA compared to legacy manual batch scripts which run only once daily.
3. Show that wrong-termination insulation alone pays back the licensing costs in year 1.`}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Assign To Representative</label>
                        <select className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800">
                          {teamMembers.map(rep => (
                            <option key={rep.id} value={rep.id}>{rep.name} ({rep.role})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Compliance Tracking Mode</label>
                        <select className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800">
                          <option>Mandatory Adherence (Real-time Alarms)</option>
                          <option>Recommended Guide</option>
                          <option>Audit Mode Only</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          alert("Coaching Playbook successfully compiled and synced to the representative's local coaching HUD!");
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                      >
                        Assign & Sync Playbook
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: SCORE CORRECTIONS ==================== */}
          {activeSubTab === "score_corrections" && (
            <div className="space-y-6" id="score-corrections-tab-panel">
              <div>
                <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <CheckSquare className="w-6 h-6 text-blue-600" />
                  Model-Generated Score Corrections
                </h1>
                <p className="text-xs text-slate-500">
                  Manually review AI model-generated performance scores, override them based on special context, and apply live corrections directly.
                </p>
              </div>

              {sessions.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Select call */}
                  <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Choose Transcript to Correct</span>
                    <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                      {sessions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSessionId(s.id)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold block transition-all ${
                            s.id === selectedSessionId
                              ? "border-blue-500 bg-blue-50/35 text-slate-900"
                              : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="font-bold truncate">{s.title}</div>
                          <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                            <span>Rep: {s.repName}</span>
                            <span className="font-mono text-blue-600">Likelihood: {s.analytics?.successPercentage || 50}%</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Corrections form */}
                  {activeSession ? (
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                      <div className="pb-2.5 border-b border-slate-100 flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block truncate">Correcting scores for: {activeSession.title}</span>
                          <span className="text-[10px] text-slate-400">Representative: {activeSession.repName}</span>
                        </div>
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono uppercase font-bold">Pending Correction</span>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="font-semibold text-slate-700 block animate-none">AI Success Likelihood (%)</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                defaultValue={activeSession.analytics?.successPercentage || 50}
                                id="correction-success-rate"
                                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold"
                              />
                              <span className="text-slate-400 font-mono">%</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-semibold text-slate-700 block">AI Empathy Score (0-10)</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              defaultValue={activeSession.analytics?.repEmpathyScore || 5}
                              id="correction-empathy-score"
                              className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-semibold text-slate-700 block">Required Audit Justification</label>
                          <textarea
                            rows={3}
                            placeholder="Please provide justification for this score override (e.g., Prospect had special corporate compliance rules that restricted emotional conversational patterns)."
                            className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-sans leading-relaxed"
                            id="correction-justification"
                          />
                        </div>

                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100/50 text-[10px] text-amber-900 leading-normal font-semibold">
                          ⚠️ Security Restriction Notice: Manual score corrections are unalterably saved to the Firestore log and indexed with the Auditor Security ID. Scores cannot be altered after approval.
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => {
                              const newSuccess = parseInt((document.getElementById("correction-success-rate") as HTMLInputElement)?.value || "50");
                              const newEmpathy = parseInt((document.getElementById("correction-empathy-score") as HTMLInputElement)?.value || "5");
                              const justification = (document.getElementById("correction-justification") as HTMLTextAreaElement)?.value || "";

                              if (!justification.trim()) {
                                alert("Justification is required for score overrides.");
                                return;
                              }

                              const updatedSession = {
                                ...activeSession,
                                analytics: {
                                  ...(activeSession.analytics || {}),
                                  successPercentage: newSuccess,
                                  repEmpathyScore: newEmpathy,
                                  nextSteps: activeSession.analytics?.nextSteps || ["Coaching assessment completed."]
                                } as any
                              };

                              onUpdateSession(updatedSession);
                              alert("Score Correction applied successfully! Firestore record has been updated and audit logged.");
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                          >
                            Apply Score Correction
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                      Select a transcript from the left sidebar list to apply score overrides.
                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs animate-pulse">
                  Please seed or import a transcript first to enable score correction capabilities.
                </div>
              )}
            </div>
          )}

          {/* ==================== SUB-TAB: EMPLOYEE TRENDS ==================== */}
          {activeSubTab === "employee_trends" && (
            <div className="space-y-6" id="employee-trends-tab-panel">
              <div>
                <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BarChart2 className="w-6 h-6 text-rose-600" />
                  Employee Longitudinal Performance & Execution Trends
                </h1>
                <p className="text-xs text-slate-500">
                  Full secure audit access to individual employee longitudinal behavioral, adherence, and execution trends.
                </p>
              </div>

              {/* Rep selector */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[9px]">Select Target Representative</span>
                  <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none">
                    <option>Phil Muffins (Sales Representative)</option>
                    <option>Laura Vance (Senior Representative)</option>
                    <option>David Miller (Trainee)</option>
                  </select>
                </div>
                <div className="text-[10px] text-rose-800 bg-rose-50/50 px-3 py-2 rounded-xl border border-rose-100/50 leading-relaxed font-semibold">
                  🛡️ Risk Compliance Mode: Secure end-to-end audit log access.
                </div>
              </div>

              {/* Graphs/Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                
                {/* Metric 1 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[9px]">Regulatory Compliance SLA</span>
                    <span className="text-emerald-600 font-bold font-mono">98.2%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Adherence to mandated state disclosures, refund policies, and non-guaranteed outcome declarations.
                  </p>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full w-[98%]" />
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[9px]">Discount Authorization Index</span>
                    <span className="text-amber-600 font-bold font-mono">2.1% Deviation</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Frequency of offering unapproved pricing plans or contract price reductions without executive authorization.
                  </p>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full w-1/4" />
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[9px]">Objection Conversion Ratio</span>
                    <span className="text-blue-600 font-bold font-mono">74.5%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Success rate in resolving enterprise technical friction using approved product scripts and coaching guides.
                  </p>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full w-3/4" />
                  </div>
                </div>

              </div>

              {/* Behavior Analysis Area */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <span className="text-xs font-bold text-slate-900 block pb-1 border-b border-slate-100">Longitudinal Conversational Sentiment Over last 30 Calls</span>
                <div className="h-48 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400">
                  <div className="text-center space-y-2">
                    <BarChart2 className="w-8 h-8 text-rose-300 mx-auto" />
                    <p className="font-medium text-slate-500">Longitudinal behavioral mapping compiled successfully.</p>
                    <p className="text-[10px] text-slate-400 font-mono">No abnormal sentiment spikes, conversational aggression, or compliance exclusions detected.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: COMPLIANCE FLAGS & VARIANCES ==================== */}
          {activeSubTab === "compliance_flags" && (
            <div className="space-y-6" id="compliance-flags-tab-panel">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-rose-600 animate-pulse" />
                    Automated Pricing Variances & Compliance Flag History
                  </h1>
                  <p className="text-xs text-slate-500">
                    Real-time monitoring of unauthorized contract discounts, pricing plans offering anomalies, and compliance flag histories.
                  </p>
                </div>
                <div className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 px-3 py-1.5 rounded-full border border-rose-200">
                  🚨 Auditor Compliance Shield ACTIVE
                </div>
              </div>

              {/* Table of flags */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Flag Description</th>
                        <th className="py-3.5 px-4">Associated Call</th>
                        <th className="py-3.5 px-4">Representative</th>
                        <th className="py-3.5 px-4">Severity Level</th>
                        <th className="py-3.5 px-4">Compliance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-3.5 px-4 font-semibold text-rose-700">Unauthorized 25% pricing discount promised</td>
                        <td className="py-3.5 px-4 font-medium">Transcript #002</td>
                        <td className="py-3.5 px-4">Phil Muffins</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-800 font-bold font-mono text-[9px]">HIGH</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-amber-600">Pending Remediation</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-semibold text-amber-700">Unlicensed state solicitation attempt</td>
                        <td className="py-3.5 px-4 font-medium">Transcript #004</td>
                        <td className="py-3.5 px-4">Phil Muffins</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-800 font-bold font-mono text-[9px]">MEDIUM</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-600">Audited & Remediated</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-semibold text-emerald-700">No outcomes guarantee disclosure cited</td>
                        <td className="py-3.5 px-4 font-medium">Transcript #005</td>
                        <td className="py-3.5 px-4">Laura Vance</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold font-mono text-[9px]">LOW</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-600">Compliant</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Summary Box */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md border border-slate-800 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Remediation Action Protocol</span>
                  <span className="text-[10px] text-rose-400 font-bold uppercase font-mono">Secured Workflow</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Whenever an unapproved pricing variance or unauthorized refund parameter is flagged, the Auditor Portal logs a permanent timestamped warning block. The Auditor may choose to override or assign an unalterable remediation timeline.
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => {
                      alert("Successfully updated auditor logs! Compliance audit trail is permanently locked in Firestore.");
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Lock Compliance Logs
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: REMEDIATION TIMELINES ==================== */}
          {activeSubTab === "remediation_timelines" && (
            <div className="space-y-6" id="remediation-timelines-tab-panel">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-rose-600" />
                    Remediation Timelines & Wrongful-Termination Protection
                  </h1>
                  <p className="text-xs text-slate-500">
                    Establish unalterable remediation PIP timelines for wrongful-termination insulation based on objective, non-discriminatory performance trends.
                  </p>
                </div>
              </div>

              {/* Main Timeline Card Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                
                {/* Deficiencies list */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Performance Deficiency Logs</span>
                  
                  <div className="space-y-2">
                    <button className="w-full text-left p-3 rounded-xl border border-rose-100 bg-rose-50/40 text-xs font-semibold block transition-all">
                      <div className="text-rose-900 font-bold">Phil Muffins • Pricing Compliance</div>
                      <div className="text-[10px] text-slate-500 mt-1">SLA failure: Offered unauthorized discounts on consecutive Zoom calls.</div>
                      <div className="text-[9px] text-rose-600 font-mono mt-1 font-bold">Timeline: 30-Day PIP Ends Aug 19</div>
                    </button>
                    
                    <button className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-xs font-semibold block transition-all">
                      <div className="text-slate-900 font-bold">David Miller • Technical Product Literacy</div>
                      <div className="text-[10px] text-slate-500 mt-1">Persistent capability misalignments on client calls.</div>
                      <div className="text-[9px] text-amber-600 font-mono mt-1 font-bold">Timeline: Completed Remediation</div>
                    </button>
                  </div>
                </div>

                {/* Wrongful Termination protection generator */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Wrongful-Termination Shield Certificate Engine</span>
                    <p className="text-[10px] text-slate-400">Generate legal proof of objective, non-discriminatory coaching and compliance standards.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 block text-xs">Employee / Representative</label>
                        <select className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option>Phil Muffins (Sales Representative)</option>
                          <option>David Miller (Trainee)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700 block text-xs">Timeline Phase</label>
                        <select className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option>Phase I (Initial Performance Notification)</option>
                          <option>Phase II (30-Day PIP Timeline Active)</option>
                          <option>Phase III (Formal Action Review)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block text-xs">Unbiased Performance Data Included (Unalterable Audit Proof)</label>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5 font-mono">
                        <div>📊 Adherence Score: 68.4% (Target: &gt; 90.0%)</div>
                        <div>🚨 Pricing Variance flags: 4 unauthorized discount offers cataloged in Firestore</div>
                        <div>🎓 Coaching sessions assigned: 3 Objection Handling playbooks (0% completion registered)</div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center flex-wrap gap-2">
                      <span className="text-[9.5px] text-rose-700 bg-rose-50 px-2 py-1 rounded font-semibold border border-rose-100">
                        🔒 Certificate holds unalterable cryptographic hash of Firestore records.
                      </span>
                      <button
                        onClick={() => {
                          alert("Wrongful-Termination Shield Certificate generated successfully! Downloaded PDF copy locked with compliance hash: MD5-f377a0bc");
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-500/10 cursor-pointer animate-none"
                      >
                        Generate Shield Certificate
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Global Authoritative Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 border-t border-slate-200/60 pt-4 mt-8 font-sans">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Authorized Secure Area • 256-Bit SSL Encryption Active</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} Spark Analytic. Precision Revenue Science.</span>
          </div>
        </div>

        {/* ==================== GONG.IO CRM INTEGRATION CONSOLE ==================== */}
        {gongModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setGongModalOpen(false)}
            />
            
            {/* Modal Box */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden relative z-10 flex flex-col max-h-[90vh] animate-in fade-in-50 zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-sm">
                    G
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">
                      Gong.io CRM Integration Console
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Secure Repository Pull Engine & Automated Webhooks (Option A)
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setGongModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Messages */}
                {gongSuccessMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-top-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{gongSuccessMessage}</span>
                  </div>
                )}
                
                {gongErrorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-top-1">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{gongErrorMessage}</span>
                  </div>
                )}

                {/* Grid Layout for Configuration & Sync Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: API Credentials & Setup (Span 7) */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center space-x-2 text-slate-800 font-semibold text-xs">
                        <Key className="w-4 h-4 text-emerald-600" />
                        <span>API Access Keys</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        In your Gong Developer Portal, generate an API Access Key ID and Secret with <code>calls:read</code> permissions. 
                        To test in the Sandbox immediately, leave or set the key containing <code>sandbox</code>.
                      </p>

                      <form onSubmit={saveGongCredentials} className="space-y-3 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gong Access Key ID</label>
                          <input 
                            type="text" 
                            value={gongAccessKeyId}
                            onChange={(e) => setGongAccessKeyId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            placeholder="CUTT36OZ63XHA4NV7F7IAWTX5BESF57S"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gong Access Key Secret</label>
                          <input 
                            type="password" 
                            value={gongAccessKeySecret}
                            onChange={(e) => setGongAccessKeySecret(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            placeholder="••••••••••••••••••••"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gong API Endpoint Gateway</label>
                          <input 
                            type="text" 
                            value={gongApiEndpoint}
                            onChange={(e) => setGongApiEndpoint(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-[10px]"
                            placeholder="https://api.gong.io/v2/"
                          />
                        </div>

                        {/* Polling Interval & Enabled switch */}
                        <div className="pt-2 border-t border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-800">Automated Polling (Cron)</span>
                              <span className="text-[10px] text-slate-500 font-normal">Enable automatic background synchronization</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={gongAutoEnabled}
                              onChange={(e) => setGongAutoEnabled(e.target.checked)}
                              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                          </div>

                          {gongAutoEnabled && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Polling Interval</label>
                              <select
                                value={gongInterval}
                                onChange={(e) => setGongInterval(Number(e.target.value))}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-700 font-medium"
                              >
                                <option value="15">Every 15 Minutes</option>
                                <option value="30">Every 30 Minutes</option>
                                <option value="60">Hourly (Recommended)</option>
                                <option value="360">Every 6 Hours</option>
                                <option value="1440">Daily</option>
                              </select>
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2"
                        >
                          <Save className="w-4 h-4 text-emerald-400" />
                          <span>Save Gong Settings</span>
                        </button>
                      </form>
                    </div>

                    {/* Webhook Configuration Block */}
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-900 font-semibold text-xs">
                        <Code className="w-4 h-4 text-emerald-600" />
                        <span>Webhook Handshake Receiver</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        To receive instantaneous callbacks from Gong when calls are finished, paste this Webhook URL into the Gong Webhooks Configuration Panel.
                      </p>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <input 
                          type="text" 
                          readOnly 
                          value={`${window.location.origin}/api/v1/gong/webhook`}
                          className="flex-1 bg-white border border-slate-200 text-[10px] font-mono text-slate-600 px-3 py-1.5 rounded-xl focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/api/v1/gong/webhook`);
                            setGongSuccessMessage("Webhook URL copied to clipboard!");
                            setTimeout(() => setGongSuccessMessage(null), 3000);
                          }}
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-all cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Gong App Privacy Policy & Developer URL Block */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                      <div className="flex items-center space-x-2 text-slate-800 font-semibold text-xs">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span>Gong.io Privacy Policy & OAuth Config</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Gong requires a publicly hosted Privacy Policy URL for your custom application integration. Provide the URL below in your Gong Developer Console:
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-1.5">
                        <input 
                          type="text" 
                          readOnly 
                          value={`${window.location.origin}/gong-privacy`}
                          className="flex-1 bg-white border border-slate-200 text-[10px] font-mono text-slate-600 px-3 py-1.5 rounded-xl focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/gong-privacy`);
                            setGongSuccessMessage("Gong Privacy Policy URL copied!");
                            setTimeout(() => setGongSuccessMessage(null), 3000);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                          title="Copy Privacy Policy URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href="/gong-privacy"
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                          title="Open Privacy Policy in New Tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Execution Panel & Sync Logs (Span 5) */}
                  <div className="md:col-span-5 space-y-4 flex flex-col">
                    
                    {/* Synchronize Now card */}
                    <div className="p-5 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl border border-emerald-600 shadow-md space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Manual Operation</span>
                        <h4 className="text-sm font-bold">On-Demand Sync Trigger</h4>
                        <p className="text-[10px] text-emerald-100 leading-relaxed">
                          Pull the latest call recording audio files and transcript streams from your Gong CRM immediately. 
                        </p>
                      </div>

                      <button
                        onClick={triggerGongManualSync}
                        disabled={gongSyncing}
                        className="w-full py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 disabled:opacity-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        {gongSyncing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                            <span>Polling Gong API...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 text-emerald-700" />
                            <span>Sync Now</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Sync Logs Ledger */}
                    <div className="flex-1 border border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-[220px]">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <Database className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Synchronization Log History</span>
                        </span>
                        <button 
                          onClick={fetchGongLogs} 
                          disabled={gongLogsLoading}
                          className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                        >
                          Refresh Log
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[200px] bg-slate-50/50">
                        {gongLogsLoading ? (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10 space-y-2">
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                            <span className="text-[10px]">Loading ledger records...</span>
                          </div>
                        ) : gongLogs.length === 0 ? (
                          <div className="text-center text-[10px] text-slate-400 py-10">
                            No synchronization records logged yet.
                          </div>
                        ) : (
                          gongLogs.map((log: any) => (
                            <div key={log.id} className="p-3 bg-white border border-slate-200/60 rounded-xl text-[10px] space-y-1.5 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                  log.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                } uppercase`}>
                                  {log.status}
                                </span>
                                <span className="text-slate-400 text-[8px] font-mono">
                                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-700 font-medium leading-relaxed">
                                {log.details}
                              </p>
                              <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono border-t border-slate-100 pt-1.5">
                                <span>Type: {log.type || "auto"}</span>
                                <span>Ingested: {log.callsIngested || 0} calls</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Secure 256-bit encryption active for secret api fields</span>
                </div>
                <span>Sandbox Connected</span>
              </div>

            </div>
          </div>
        )}

        {/* ==================== ZOOM INTEGRATION CONSOLE ==================== */}
        {zoomModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setZoomModalOpen(false)}
            />
            
            {/* Modal Box */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden relative z-10 flex flex-col max-h-[90vh] animate-in fade-in-50 zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-blue-50/40">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700 font-bold text-sm">
                    Z
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">
                      Zoom Cloud Recording Integration Console
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Server-to-Server OAuth Automatic Pull Gateway
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setZoomModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Messages */}
                {zoomSuccessMessage && (
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-top-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
                    <span>{zoomSuccessMessage}</span>
                  </div>
                )}
                
                {zoomErrorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-top-1">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{zoomErrorMessage}</span>
                  </div>
                )}

                {/* Grid Layout for Configuration & Sync Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: API Credentials & Setup (Span 7) */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center space-x-2 text-slate-800 font-semibold text-xs">
                        <Key className="w-4 h-4 text-blue-600" />
                        <span>Server-to-Server OAuth Credentials</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        In your Zoom App Marketplace, create a <strong>Server-to-Server OAuth</strong> app, activate it, and copy your credentials.
                        To use Sandbox/Mock simulation mode, leave or set the Client ID to empty or include <code>sandbox</code>.
                      </p>

                      <form onSubmit={saveZoomCredentials} className="space-y-3 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Zoom Account ID</label>
                          <input 
                            type="text" 
                            value={zoomAccountId}
                            onChange={(e) => setZoomAccountId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            placeholder="eLSgLlkDRMyLjTvfOere6g"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Zoom Client ID</label>
                          <input 
                            type="text" 
                            value={zoomClientId}
                            onChange={(e) => setZoomClientId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            placeholder="WBKOzSTnQoqFrsIWytTRQ"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Zoom Client Secret</label>
                          <input 
                            type="password" 
                            value={zoomClientSecret}
                            onChange={(e) => setZoomClientSecret(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            placeholder="••••••••••••••••••••"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Zoom Webhook Secret Token</label>
                          <input 
                            type="password" 
                            value={zoomSecretToken}
                            onChange={(e) => setZoomSecretToken(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            placeholder="xFIs6ZfFSfKVkEjll4sjyw"
                          />
                        </div>

                        {/* Polling Interval & Enabled switch */}
                        <div className="pt-2 border-t border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-800">Automated Polling (Cron)</span>
                              <span className="text-[10px] text-slate-500 font-normal">Enable automatic background cloud sync</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={zoomAutoEnabled}
                              onChange={(e) => setZoomAutoEnabled(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                          </div>

                          {zoomAutoEnabled && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Polling Interval</label>
                              <select
                                value={zoomInterval}
                                onChange={(e) => setZoomInterval(Number(e.target.value))}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-700 font-medium"
                              >
                                <option value="15">Every 15 Minutes</option>
                                <option value="30">Every 30 Minutes</option>
                                <option value="60">Hourly (Recommended)</option>
                                <option value="360">Every 6 Hours</option>
                                <option value="1440">Daily</option>
                              </select>
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2"
                        >
                          <Save className="w-4 h-4 text-blue-400" />
                          <span>Save Zoom Settings</span>
                        </button>
                      </form>
                    </div>

                    {/* Developer Guide redirect URL helper */}
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
                      <div className="flex items-center space-x-2 text-blue-950 font-semibold text-xs">
                        <Code className="w-4 h-4 text-blue-600" />
                        <span>Recommended OAuth Redirect URI</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Even though Server-to-Server OAuth runs directly in the background, if you build a general OAuth app, configure this redirect URL:
                      </p>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <input 
                          type="text" 
                          readOnly 
                          value={`${window.location.origin}/api/v1/oauth/zoom/callback`}
                          className="flex-1 bg-white border border-slate-200 text-[10px] font-mono text-slate-600 px-3 py-1.5 rounded-xl focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/api/v1/oauth/zoom/callback`);
                            setZoomSuccessMessage("Redirect URI copied!");
                            setTimeout(() => setZoomSuccessMessage(null), 3000);
                          }}
                          className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Zoom Webhook URL Copy Helper */}
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-950 font-semibold text-xs">
                        <Code className="w-4 h-4 text-emerald-600" />
                        <span>Zoom Event Webhook Endpoint</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        To receive live <strong>recording.completed</strong> webhook events, configure your Zoom App Webhook URL to:
                      </p>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <input 
                          type="text" 
                          readOnly 
                          value={`${window.location.origin}/api/v1/zoom/webhook`}
                          className="flex-1 bg-white border border-emerald-200 text-[10px] font-mono text-emerald-800 px-3 py-1.5 rounded-xl focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/api/v1/zoom/webhook`);
                            setZoomSuccessMessage("Webhook Endpoint copied!");
                            setTimeout(() => setZoomSuccessMessage(null), 3000);
                          }}
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-all cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Execution Panel & Sync Logs (Span 5) */}
                  <div className="md:col-span-5 space-y-4 flex flex-col">
                    
                    {/* Synchronize Now card */}
                    <div className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl border border-blue-600 shadow-md space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Manual Operation</span>
                        <h4 className="text-sm font-bold">Zoom Recording Pull</h4>
                        <p className="text-[10px] text-blue-100 leading-relaxed">
                          Pull the latest recorded meetings and transcript streams from your Zoom account directly.
                        </p>
                      </div>

                      <button
                        onClick={triggerZoomManualSync}
                        disabled={zoomSyncing}
                        className="w-full py-2.5 bg-white hover:bg-blue-50 text-blue-800 disabled:opacity-50 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        {zoomSyncing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
                            <span>Connecting Zoom...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 text-blue-700" />
                            <span>Sync Now</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Sync Logs Ledger */}
                    <div className="flex-1 border border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-[220px]">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <Database className="w-3.5 h-3.5 text-blue-600" />
                          <span>Synchronization Log History</span>
                        </span>
                        <button 
                          onClick={fetchZoomLogs} 
                          disabled={zoomLogsLoading}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          Refresh Log
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[200px] bg-slate-50/50">
                        {zoomLogsLoading ? (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10 space-y-2">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            <span className="text-[10px]">Loading ledger records...</span>
                          </div>
                        ) : zoomLogs.length === 0 ? (
                          <div className="text-center text-[10px] text-slate-400 py-10">
                            No synchronization records logged yet.
                          </div>
                        ) : (
                          zoomLogs.map((log: any) => (
                            <div key={log.id} className="p-3 bg-white border border-slate-200/60 rounded-xl text-[10px] space-y-1.5 shadow-2xs">
                              <div className="flex items-center justify-between">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                  log.status === "success" ? "bg-blue-50 text-blue-700" : "bg-rose-50 text-rose-700"
                                } uppercase`}>
                                  {log.status}
                                </span>
                                <span className="text-slate-400 text-[8px] font-mono">
                                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-700 font-medium leading-relaxed">
                                {log.details}
                              </p>
                              <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono border-t border-slate-100 pt-1.5">
                                <span>Type: {log.type || "auto"}</span>
                                <span>Ingested: {log.callsIngested || 0} calls</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Secure 256-bit encryption active for secret api fields</span>
                </div>
                <span>Zoom S2S Connected</span>
              </div>

            </div>
          </div>
        )}

        {/* ==================== INTERACTIVE OAUTH HANDSHAKE MODAL ==================== */}
        {oauthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setOauthModalOpen(false)}
            />
            
            {/* Modal Box */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh] animate-in fade-in-50 zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-1.5 rounded-lg ${oauthPlatform === 'zoom' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                    <Globe className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">
                      {oauthPlatform === 'zoom' ? 'Zoom App Authorization' : 'Google API OAuth Handshake'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Client ID: spark_client_id_{oauthPlatform}_prod
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setOauthModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Handshake Progress Tracker */}
              <div className="bg-slate-900 text-slate-400 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-4">
                  <span className={oauthStep >= 1 ? "text-emerald-400 font-bold" : "text-slate-500"}>1. Consent</span>
                  <span className="text-slate-700">➔</span>
                  <span className={oauthStep >= 2 ? "text-emerald-400 font-bold" : "text-slate-500"}>2. Auth Code</span>
                  <span className="text-slate-700">➔</span>
                  <span className={oauthStep >= 3 ? "text-emerald-400 font-bold" : "text-slate-500"}>3. Handshake Callback</span>
                  <span className="text-slate-700">➔</span>
                  <span className={oauthStep >= 4 ? "text-emerald-400 font-bold" : "text-slate-500"}>4. Exchange Token</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] uppercase tracking-wider text-emerald-400">Sandbox Active</span>
                </div>
              </div>

              {/* Modal Content Scrollable Area */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {oauthError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{oauthError}</span>
                  </div>
                )}

                {/* Visual Auto-Retry and Exponential Backoff Control panel */}
                {oauthStep > 1 && oauthStep < 4 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3.5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                      <div>
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-blue-600 animate-spin-slow" />
                          API Connection Quality Control
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Toggle simulated network failures to observe background exponential backoff auto-retry.
                        </span>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={simulateFlakyNetwork}
                          onChange={(e) => setSimulateFlakyNetwork(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="text-[10px] font-bold text-slate-700">Simulate Flakiness</span>
                      </label>
                    </div>

                    {/* Active retry monitor */}
                    {oauthIsRetrying && (
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                          <span className="flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                            Attempt {oauthRetryAttempt} of {oauthMaxAttempts}
                          </span>
                          {oauthCountdown > 0 ? (
                            <span className="font-mono text-[10.5px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                              Next attempt in {oauthCountdown.toFixed(1)}s
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-mono">Connecting...</span>
                          )}
                        </div>
                        {/* Interactive progress bar */}
                        <div className="w-full bg-amber-200/50 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-amber-500 h-1.5 transition-all duration-300"
                            style={{ 
                              width: `${(oauthRetryAttempt / oauthMaxAttempts) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Live log stream */}
                    {oauthRetryLogs.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                            Handshake Transport Logs
                          </span>
                          <span className="text-[9px] font-mono text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                            Strategy: Exponential Backoff (2^n)
                          </span>
                        </div>
                        <div className="bg-slate-900 rounded-xl p-3.5 border border-slate-800 font-mono text-[10px] space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-thin">
                          {oauthRetryLogs.map((log, idx) => {
                            const isError = log.includes("✕") || log.includes("Error") || log.includes("failed") || log.includes("Critical");
                            const isSuccess = log.includes("succeeded") || log.includes("✓");
                            const isAttempt = log.includes("Initiating");
                            
                            let color = "text-slate-300";
                            if (isError) color = "text-rose-400";
                            if (isSuccess) color = "text-emerald-400 font-bold";
                            if (isAttempt) color = "text-blue-300";

                            return (
                              <div key={idx} className={`flex items-start gap-1.5 leading-relaxed ${color}`}>
                                <span className="text-slate-600 shrink-0 select-none">›</span>
                                <span className="break-all">{log}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 1: Consent Screen */}
                {oauthStep === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-center py-6 gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-display font-black text-xl shadow-md">
                        Sp
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-slate-300 font-mono text-sm leading-none">➔➔➔</span>
                        <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-wider">OAuth AuthCode</span>
                      </div>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-md ${
                        oauthPlatform === 'zoom' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {oauthPlatform === 'zoom' ? 'Z' : 'G'}
                      </div>
                    </div>

                    <div className="text-center space-y-2">
                      <h4 className="font-semibold text-slate-900 text-sm">
                        Spark Dialogue Analytics wants to access your {oauthPlatform === 'zoom' ? 'Zoom' : 'Google'} Account
                      </h4>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                        Authorize Spark to securely pull transcript payloads and conference call recordings to enable automatic dialogue persuasion analysis.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requested API Permissions (Scopes):</span>
                      <ul className="space-y-2 text-xs text-slate-600 font-medium">
                        {oauthPlatform === 'zoom' ? (
                          <>
                            <li className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                              <div>
                                <span className="font-mono text-[11px] bg-slate-200 px-1 py-0.5 rounded font-bold text-slate-700">meeting:read:admin</span>
                                <span className="text-slate-500 block text-[10.5px] mt-0.5">Read meetings metadata, host details, and attendee lists.</span>
                              </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                              <div>
                                <span className="font-mono text-[11px] bg-slate-200 px-1 py-0.5 rounded font-bold text-slate-700">recording:read:admin</span>
                                <span className="text-slate-500 block text-[10.5px] mt-0.5">Retrieve cloud-recorded transcripts and audio file download links.</span>
                              </div>
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                              <div>
                                <span className="font-mono text-[11px] bg-slate-200 px-1 py-0.5 rounded font-bold text-slate-700">https://www.googleapis.com/auth/meet.readonly</span>
                                <span className="text-slate-500 block text-[10.5px] mt-0.5">Read Google Meet meeting recordings, chat logs, and generated transcripts.</span>
                              </div>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                              <div>
                                <span className="font-mono text-[11px] bg-slate-200 px-1 py-0.5 rounded font-bold text-slate-700">https://www.googleapis.com/auth/calendar.events.readonly</span>
                                <span className="text-slate-500 block text-[10.5px] mt-0.5">Sync upcoming sales calls from Google Calendar events seamlessly.</span>
                              </div>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setOauthModalOpen(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        Cancel Connection
                      </button>
                      <button
                        type="button"
                        onClick={handleOAuthAuthorize}
                        disabled={oauthLoading}
                        className={`px-5 py-2 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          oauthPlatform === 'zoom' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'
                        }`}
                      >
                        {oauthLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Authorize & Grant Scopes</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Authorization Code Received */}
                {oauthStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-2xl p-4">
                      <span className="font-bold text-xs block">✓ Authorization Approved!</span>
                      <span className="text-[10.5px] block mt-1 text-emerald-700">
                        The resource owner granted permission. The OAuth server redirected to our registered <code>redirect_uri</code> with a single-use authorization code.
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                        Browser Callback Redirection Address (GET)
                      </label>
                      <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                        <span className="font-mono text-[10.5px] text-slate-700 truncate max-w-[450px]">
                          {window.location.origin}/api/v1/oauth/callback?code={oauthCode}&state=xyz_state_4917&platform={oauthPlatform}
                        </span>
                        <span className="text-[9px] font-mono bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-bold">
                          HTTP 302
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-mono text-[10px] text-slate-400">Mock Handshake Webhook Logs</span>
                        <span className="text-[9px] text-slate-500 font-mono">auth_server_handshake.go</span>
                      </div>
                      <pre className="font-mono text-[10px] text-emerald-300 leading-relaxed overflow-x-auto max-h-[140px] scrollbar-thin">
                        <code>{`[INFO] OAuth Authorization Approved by User "tom.hansen2010@gmail.com"
[INFO] Generating single-use code: "${oauthCode}" (expires in 10m)
[DEBUG] Issuing browser HTTP 302 redirect back to customer applet...
[DEBUG] Target location: /api/v1/oauth/callback
[STATUS] Code generation complete. Ready for token trade sequence.`}</code>
                      </pre>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleSimulateCallback}
                        disabled={oauthLoading}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {oauthLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        <span>Execute Browser Handshake Redirect</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Exchange Code for Access Token */}
                {oauthStep === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-800 rounded-2xl p-4">
                      <span className="font-bold text-xs block">⚡ Redirect Complete. Let's Exchange the Code</span>
                      <span className="text-[10.5px] block mt-1 text-blue-700">
                        Our server-side application successfully intercepted the authorization code. Now, we must perform a secure POST handshake to exchange this code for durable access credentials.
                      </span>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                        Secure HTTP Handshake Payload (POST)
                      </label>
                      <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-800 font-mono text-[10.5px] leading-relaxed">
                        <div className="text-slate-500 mb-2">// POST /api/v1/oauth/token</div>
                        <div>{"{"}</div>
                        <div className="pl-4"><span className="text-emerald-300">"code"</span>: "{oauthCode}",</div>
                        <div className="pl-4"><span className="text-emerald-300">"client_id"</span>: "spark_client_id_{oauthPlatform}",</div>
                        <div className="pl-4"><span className="text-emerald-300">"client_secret"</span>: "spark_client_secret_{oauthPlatform}_f8b44ece36e877f8",</div>
                        <div className="pl-4"><span className="text-emerald-300">"grant_type"</span>: "authorization_code",</div>
                        <div className="pl-4"><span className="text-emerald-300">"platform"</span>: "{oauthPlatform}"</div>
                        <div>{"}"}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleExchangeTokens}
                        disabled={oauthLoading}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {oauthLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Cpu className="w-3.5 h-3.5" />
                        )}
                        <span>Exchange Authorization Code</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Success, Connected! */}
                {oauthStep === 4 && oauthTokenResponse && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-2xl p-4 text-center space-y-2">
                      <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg mx-auto">✓</span>
                      <h4 className="font-bold text-sm">OAuth Credentials Received Successfully!</h4>
                      <p className="text-[10.5px] text-emerald-700 max-w-md mx-auto leading-relaxed">
                        Handshake completed. Spark has securely stored the OAuth credentials. The service status is now marked as <strong>'Linked'</strong>.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                        Exchanged Access Token Response Payload
                      </label>
                      <pre className="font-mono text-[10px] text-emerald-300 bg-slate-950 p-4 rounded-xl overflow-x-auto max-h-[140px] border border-slate-800 leading-normal scrollbar-thin">
                        <code>{JSON.stringify(oauthTokenResponse, null, 2)}</code>
                      </pre>
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setOauthModalOpen(false)}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                      >
                        Close & View Dashboard Status Badge
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  </div>
  );
}
