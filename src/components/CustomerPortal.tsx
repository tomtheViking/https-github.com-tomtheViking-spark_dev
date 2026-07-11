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
  Loader2
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { CallSession, CustomerFeedback, ClientConfiguration, TeamMember, SupportTicket } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CustomerPortalProps {
  sessions: CallSession[];
  onUpdateSession: (updated: CallSession) => void;
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  activeMemberId: string;
  setActiveMemberId: (id: string) => void;
  onAddTicket: (ticket: SupportTicket) => void;
}

export default function CustomerPortal({ 
  sessions, 
  onUpdateSession,
  teamMembers,
  setTeamMembers,
  activeMemberId,
  setActiveMemberId,
  onAddTicket
}: CustomerPortalProps) {
  // Navigation Sidebar State inside Customer Portal
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "discovery" | "integrations" | "team" | "billing" | "contact">("dashboard");

  // Filter & Search states for Discovery
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<"all" | "7d" | "30d">("all");
  const [platformFilter, setPlatformFilter] = useState<"all" | "zoom" | "gong">("all");
  const [repFilter, setRepFilter] = useState<string>("all");

  // AI Ask Spark states
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Active analyzed session selection
  const analyzedSessions = sessions.filter(s => s.status === "analyzed");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  useEffect(() => {
    if (analyzedSessions.length > 0 && !selectedSessionId) {
      const arachnid = analyzedSessions.find(s => s.id === "seed-arachnid-systems");
      setSelectedSessionId(arachnid ? arachnid.id : analyzedSessions[0].id);
    }
  }, [analyzedSessions, selectedSessionId]);

  const activeSession = sessions.find(s => s.id === selectedSessionId) || null;

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
  const [newMemberName, setNewMemberName] = useState<string>("");
  const [newMemberEmail, setNewMemberEmail] = useState<string>("");
  const [newMemberEmailConfirm, setNewMemberEmailConfirm] = useState<string>("");
  const [newMemberRole, setNewMemberRole] = useState<string>("");
  const [newMemberAccess, setNewMemberAccess] = useState<string>("Administrator");
  const [newMemberStatus, setNewMemberStatus] = useState<"Active" | "Offline">("Active");
  const [newMemberSparkId, setNewMemberSparkId] = useState<string>("");
  const [newMemberTenantId, setNewMemberTenantId] = useState<string>("");
  const [newMemberActivationDate, setNewMemberActivationDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Error/Success messages for team actions
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamSuccess, setTeamSuccess] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState<boolean>(false);

  const currentActiveMember = teamMembers.find(m => m.id === activeMemberId) || teamMembers[0];
  const isCurrentUserAdmin = currentActiveMember?.authorizedAccess === "Administrator";

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

    if (!newMemberEmailConfirm.trim()) {
      setTeamError("Please enter the confirmation email to verify spelling.");
      return;
    }

    if (newMemberEmail.trim().toLowerCase() !== newMemberEmailConfirm.trim().toLowerCase()) {
      setTeamError("Validation Failed: The spelling of the confirmation email does not match the invitation email.");
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
    const assignedTenantId = newMemberTenantId.trim() || activeSession?.tenantId || "CLIENT-A";
    const finalSparkId = newMemberSparkId.trim() || ("SPK-" + Math.floor(10000 + Math.random() * 90000));
    const finalActivationDate = newMemberActivationDate || new Date().toISOString().split("T")[0];

    const generatedTempPassword = `SPARK-temp-${Math.floor(1000 + Math.random() * 9000)}`;
    const generatedToken = `tok-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const response = await fetch("/api/aws-ses/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newMemberEmail.trim().toLowerCase(),
          tenantId: assignedTenantId,
          role: newMemberAccess === "Administrator" ? "tenant_admin" : "tenant_user",
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
      setNewMemberEmailConfirm("");
      setNewMemberRole("");
      setNewMemberAccess("Administrator");
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
      setNewMemberEmailConfirm("");
      setNewMemberRole("");
      setNewMemberAccess("Administrator");
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

  const handleDeleteMember = (idToDelete: string) => {
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

    setTeamMembers(prev => prev.filter(m => m.id !== idToDelete));
    setTeamSuccess(`Successfully removed ${memberToDelete.name} from the team workspace.`);

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
  const getPlatform = (s: CallSession): "zoom" | "gong" | "teams" => {
    if (s.transcriptText?.toLowerCase().includes("zoom")) return "zoom";
    if (s.transcriptText?.toLowerCase().includes("gong")) return "gong";
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
            <button
              onClick={() => setActiveSubTab("dashboard")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "dashboard"
                  ? "bg-slate-800 text-white shadow-inner border-l-2 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveSubTab("discovery")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "discovery"
                  ? "bg-slate-800 text-white shadow-inner border-l-2 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>Transcript Discovery</span>
            </button>

            <button
              onClick={() => setActiveSubTab("integrations")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "integrations"
                  ? "bg-slate-800 text-white shadow-inner border-l-2 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Integrations</span>
            </button>

            <button
              onClick={() => setActiveSubTab("team")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "team"
                  ? "bg-slate-800 text-white shadow-inner border-l-2 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Team Settings</span>
            </button>

            <button
              onClick={() => setActiveSubTab("billing")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "billing"
                  ? "bg-slate-800 text-white shadow-inner border-l-2 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Billing & Plans</span>
            </button>

            <button
              onClick={() => setActiveSubTab("contact")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "contact"
                  ? "bg-slate-800 text-white shadow-inner border-l-2 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Contact Us</span>
            </button>
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
                    <option value="all">All Platforms (Zoom & Gong)</option>
                    <option value="zoom">Zoom Video</option>
                    <option value="gong">Gong.io</option>
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
                                      platform === "zoom" ? "bg-blue-500" : "bg-emerald-500"
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

          {/* ==================== SUB-TAB 3: INTEGRATIONS ==================== */}
          {activeSubTab === "integrations" && (
            <div className="space-y-6" id="integrations-tab-panel">
              <div>
                <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">
                  Communications & API Integrations
                </h1>
                <p className="text-xs text-slate-500">
                  Connect third-party meeting platforms directly to import conversations for automatic dialogue analysis.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Zoom Integration Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                      Z
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs block">Zoom Video Integration</span>
                        {zoomConnected ? (
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
                      <span className="text-[10px] text-slate-500 block mt-0.5">Auto-pull recordings from Zoom Cloud meetings</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleZoom(!zoomConnected)}
                    className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      zoomConnected 
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300" 
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    }`}
                  >
                    {zoomConnected ? "Disconnect" : "Connect Zoom Account"}
                  </button>
                </div>

                {/* Gong Integration Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                      G
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 text-xs block">Gong.io CRM Pipe</span>
                      <span className="text-[10px] text-slate-500">Sync with sales calls repository stream</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setGongConnected(!gongConnected)}
                    className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      gongConnected 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    {gongConnected ? "Connected" : "Disconnect"}
                  </button>
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
                
                {/* Members Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Active Workspace Members ({teamMembers.length})</span>
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
                        {teamMembers.map((member) => (
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
                        {(() => {
                          const isNewMemberEmailMismatch = newMemberEmail.trim() !== "" && newMemberEmailConfirm.trim() !== "" && newMemberEmail.trim().toLowerCase() !== newMemberEmailConfirm.trim().toLowerCase();
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                                <label className={`font-semibold block ${isNewMemberEmailMismatch ? "text-rose-600" : "text-slate-600"}`}>Email Address</label>
                                <input
                                  type="email"
                                  value={newMemberEmail}
                                  onChange={(e) => setNewMemberEmail(e.target.value)}
                                  disabled={!isCurrentUserAdmin}
                                  placeholder="e.g. john.doe@arachnid.com"
                                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 font-medium transition-colors ${
                                    isNewMemberEmailMismatch
                                      ? "bg-rose-50 border-rose-400 text-rose-900 focus:ring-rose-500"
                                      : "bg-slate-50 border-slate-200 focus:ring-blue-500 text-slate-900"
                                  }`}
                                />
                                {isNewMemberEmailMismatch && (
                                  <span className="text-[10px] text-rose-600 block mt-1 font-medium">
                                    ⚠️ spelling mismatch!
                                  </span>
                                )}
                              </div>

                              {/* Confirm Email Address */}
                              <div className="space-y-1">
                                <label className={`font-semibold block ${isNewMemberEmailMismatch ? "text-rose-600" : "text-slate-600"}`}>Confirm Email Address</label>
                                <input
                                  type="email"
                                  value={newMemberEmailConfirm}
                                  onChange={(e) => setNewMemberEmailConfirm(e.target.value)}
                                  disabled={!isCurrentUserAdmin}
                                  placeholder="Verify spelling of email"
                                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 font-medium transition-colors ${
                                    isNewMemberEmailMismatch
                                      ? "bg-rose-50 border-rose-400 text-rose-900 focus:ring-rose-500"
                                      : "bg-slate-50 border-slate-200 focus:ring-blue-500 text-slate-900"
                                  }`}
                                />
                                {isNewMemberEmailMismatch && (
                                  <span className="text-[10px] text-rose-600 block mt-1 font-medium">
                                    ⚠️ spelling mismatch!
                                  </span>
                                )}
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
                                  <option value="Administrator">Administrator (Can Invite & Delete)</option>
                                  <option value="Manager">Manager (Read-Only access)</option>
                                  <option value="User">User (Rep Interface Only)</option>
                                  <option value="Brand Marketing Suite">Brand Marketing Suite</option>
                                  <option value="Livestock Accounts">Livestock Accounts</option>
                                  <option value="Equine Brands">Equine Brands</option>
                                </select>
                              </div>
                            </div>
                          );
                        })()}

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
                              <label className="font-semibold text-slate-600 block">Tenant ID (Optional)</label>
                              <input
                                type="text"
                                value={newMemberTenantId}
                                onChange={(e) => setNewMemberTenantId(e.target.value)}
                                disabled={!isCurrentUserAdmin}
                                placeholder="e.g. CLIENT-A (Auto-detected if empty)"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                              />
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
            </div>
          )}

          {/* ==================== SUB-TAB 5: BILLING & PLANS (INTERACTIVE PROPOSAL SIMULATOR) ==================== */}
          {activeSubTab === "billing" && (
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
