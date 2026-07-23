import React, { useState } from "react";
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  ExternalLink, 
  FileText, 
  HelpCircle, 
  Info, 
  Key, 
  Layers, 
  Lock, 
  Shield, 
  Terminal, 
  Video, 
  Users,
  Settings,
  RefreshCw,
  Globe,
  Sliders,
  Check
} from "lucide-react";

interface IntegrationGuideProps {
  onBack?: () => void;
}

type PlatformTab = "zoom" | "gong" | "teams" | "google";

export default function IntegrationGuide({ onBack }: IntegrationGuideProps) {
  const [activeTab, setActiveTab] = useState<PlatformTab>("zoom");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const redirectUrls = {
    zoom: typeof window !== "undefined" ? `${window.location.origin}/api/v1/oauth/zoom/callback` : "",
    gong: typeof window !== "undefined" ? `${window.location.origin}/api/v1/gong/credentials` : "",
    teams: typeof window !== "undefined" ? `${window.location.origin}/api/v1/oauth/teams/callback` : "",
    google: typeof window !== "undefined" ? `${window.location.origin}/api/v1/oauth/google/callback` : ""
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-500/10 selection:text-teal-900">
      {/* Top Header/Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="group flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Workspace</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-teal-500/10 text-teal-600">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono">
              Spark Documentation
            </span>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="bg-slate-900 text-white py-12 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-950/20 via-slate-900 to-slate-900 -z-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-25 -z-10" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20 text-[10px] font-semibold tracking-wider uppercase font-mono mb-2">
            <span>Setup & Onboarding Guide</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-extrabold tracking-tight text-white">
            Meeting Platform Integration Center
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Detailed integration blueprints directing platform administrators and sales representatives on how to link their enterprise meeting pipelines for automated dialogue diagnostic analysis.
          </p>
        </div>
      </section>

      {/* Main Interactive Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1 bg-slate-200/60 rounded-2xl mb-8 max-w-2xl mx-auto border border-slate-200">
          <button
            onClick={() => setActiveTab("zoom")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "zoom"
                ? "bg-white text-blue-600 shadow-xs border border-slate-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Zoom</span>
          </button>
          
          <button
            onClick={() => setActiveTab("gong")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "gong"
                ? "bg-white text-emerald-700 shadow-xs border border-slate-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Gong.io</span>
          </button>

          <button
            onClick={() => setActiveTab("teams")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "teams"
                ? "bg-white text-indigo-600 shadow-xs border border-slate-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>MS Teams</span>
          </button>

          <button
            onClick={() => setActiveTab("google")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "google"
                ? "bg-white text-rose-600 shadow-xs border border-slate-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Google Meet</span>
          </button>
        </div>

        {/* Dynamic Tab Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main content column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ZOOM TAB PANEL */}
            {activeTab === "zoom" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
                <div className="border-b border-slate-100 pb-5">
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider font-mono">Integration Type: OAuth 2.0 Client App</span>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 tracking-tight mt-1">
                    Zoom Video Recording Pipeline Setup
                  </h2>
                  <p className="text-xs text-slate-500 mt-2">
                    Connect Zoom Cloud meetings directly. This lets Spark automatically check for newly finished cloud recordings, extract the audio transcript, and run the Dialogue & Persuasion diagnostic models.
                  </p>
                </div>

                {/* Section A: Admin Registration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full">Phase 1</span>
                    <h3 className="font-bold text-slate-950 text-sm">Platform Admin Setup (Zoom App Marketplace)</h3>
                  </div>
                  
                  <p className="text-xs text-slate-600 leading-relaxed">
                    To enable Zoom integration, an administrator must create an application in the <strong>Zoom App Marketplace</strong>. This establishes the trust bridge between Spark and your Zoom workspace.
                  </p>

                  <div className="space-y-3.5 pl-4 border-l-2 border-slate-100 mt-3">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-mono text-[10px] font-bold flex items-center justify-center">1</span>
                        Navigate to Zoom Marketplace
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Go to <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">Zoom App Marketplace <ExternalLink className="w-3 h-3" /></a>, sign in as administrator, and click <strong>Develop &gt; Build App</strong>.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-mono text-[10px] font-bold flex items-center justify-center">2</span>
                        Select App Type: User-Managed OAuth App
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Choose the <strong>OAuth app type</strong>. Ensure "User-managed app" is chosen so each sales representative can link their specific recordings securely.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-mono text-[10px] font-bold flex items-center justify-center">3</span>
                        Configure OAuth Credentials
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Add details including your App Name (e.g., <em>Spark Dialog Analytics</em>). Copy your generated <strong>Client ID</strong> and <strong>Client Secret</strong>.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-mono text-[10px] font-bold flex items-center justify-center">4</span>
                        Set OAuth Redirect URI
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Paste the active redirect URI inside the "OAuth Redirect" list in Zoom. This ensures secure code-exchange handshakes:
                      </p>
                      
                      <div className="mt-2 ml-6.5 flex items-center gap-2 bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-slate-800">
                        <Terminal className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="font-mono text-[10px] select-all truncate flex-1">{redirectUrls.zoom}</span>
                        <button
                          onClick={() => copyToClipboard(redirectUrls.zoom, "zoom-redirect")}
                          className="px-2 py-1 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono rounded cursor-pointer transition-colors"
                        >
                          {copiedCode === "zoom-redirect" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-mono text-[10px] font-bold flex items-center justify-center">5</span>
                        Add Scopes
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Enable the following scopes inside the Zoom App Dashboard. These are required to detect new meetings and read transcripts:
                      </p>
                      <ul className="list-disc pl-11 text-[11px] text-slate-500 space-y-1 mt-1">
                        <li><code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">recording:read</code>: Essential to retrieve Cloud Recording transcripts.</li>
                        <li><code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">meeting:read</code>: Fetch meeting timestamps, durations, and participant list.</li>
                        <li><code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">user:read</code>: Bind the Zoom account ID directly to Spark User profile.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Section B: User Connection */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full">Phase 2</span>
                    <h3 className="font-bold text-slate-950 text-sm">Directing Platform Users (Connection Workflow)</h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Once the global Zoom app is configured by the admin, platform users (representatives) can link their accounts with one click:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center font-mono mb-2">1</div>
                      <h4 className="text-xs font-bold text-slate-900">Access Portal</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Navigate to the <strong>Management Interface</strong> (Customer Portal) and choose the <strong>Integrations</strong> tab.</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center font-mono mb-2">2</div>
                      <h4 className="text-xs font-bold text-slate-900">Click Connect</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Locate the <strong>Zoom Video Integration</strong> card and click the <strong>"Connect Zoom Account"</strong> button.</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center font-mono mb-2">3</div>
                      <h4 className="text-xs font-bold text-slate-900">Authorize Popup</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Sign in with Zoom in the secure popup window, click <strong>"Authorize"</strong>, and the status changes to <strong>Linked</strong>.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GONG.IO TAB PANEL */}
            {activeTab === "gong" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
                <div className="border-b border-slate-100 pb-5">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider font-mono">Integration Type: Gong CRM Credentials API</span>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 tracking-tight mt-1">
                    Gong.io CRM Sync Pipeline Setup
                  </h2>
                  <p className="text-xs text-slate-500 mt-2">
                    Import conversation streams recorded in Gong.io directly into Spark for deep persuasion analysis and automatic support ticket creation.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full">How it works</span>
                    <h3 className="font-bold text-slate-950 text-sm">Gong API Key Configuration</h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Gong.io uses high-security custom credentials. To enable synchronization, a workspace administrator can retrieve access keys inside Gong and enter them in the Spark console:
                  </p>

                  <div className="space-y-4 pl-4 border-l-2 border-slate-100 mt-3">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-mono text-[10px] font-bold flex items-center justify-center">1</span>
                        Generate API Access Keys in Gong
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Log in to <strong className="text-slate-800">Gong.io</strong> as a company administrator. Navigate to <strong>Company Settings &gt; Integrations &gt; API</strong> and click <strong>Generate Access Key</strong>.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-mono text-[10px] font-bold flex items-center justify-center">2</span>
                        Copy Credentials
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Safely store the <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Access Key ID</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Access Key Secret</code>. Gong will only show the secret once.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-mono text-[10px] font-bold flex items-center justify-center">3</span>
                        Insert into Spark Settings
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Navigate to Spark's <strong>Integrations</strong> tab, click the <strong>"Configure & Sync"</strong> button on the Gong card, enter your Key ID and Secret, and set your polling interval (e.g., every 60 minutes).
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-mono text-[10px] font-bold flex items-center justify-center">4</span>
                        Comply with Gong Security Reviews
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        To activate connection in production, Gong requires a public-facing Privacy Policy URL. Spark has provisioned a fully-compliant policy for your workspace at:
                      </p>
                      
                      <div className="mt-2 ml-6.5 flex items-center gap-2 bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-slate-800">
                        <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-mono text-[10px] select-all truncate flex-1">
                          {typeof window !== "undefined" ? `${window.location.origin}/gong-privacy` : ""}
                        </span>
                        <button
                          onClick={() => copyToClipboard(typeof window !== "undefined" ? `${window.location.origin}/gong-privacy` : "", "gong-privacy")}
                          className="px-2 py-1 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono rounded cursor-pointer transition-colors"
                        >
                          {copiedCode === "gong-privacy" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MICROSOFT TEAMS TAB PANEL */}
            {activeTab === "teams" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
                <div className="border-b border-slate-100 pb-5">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider font-mono">Integration Type: Azure AD Entra ID App</span>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 tracking-tight mt-1">
                    Microsoft Teams Dialogue Sync Setup
                  </h2>
                  <p className="text-xs text-slate-500 mt-2">
                    Import text chats and transcript logs directly from Microsoft Teams enterprise channels or calendar meeting calls.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full">Configuration</span>
                    <h3 className="font-bold text-slate-950 text-sm">Azure App Registration</h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    To pull transcripts from Microsoft Teams, an enterprise administrator must register Spark in the <strong>Microsoft Entra ID (Azure Active Directory)</strong> portal:
                  </p>

                  <div className="space-y-4 pl-4 border-l-2 border-slate-100 mt-3">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 font-mono text-[10px] font-bold flex items-center justify-center">1</span>
                        Register Application
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Go to the <strong>Azure Portal &gt; Entra ID &gt; App Registrations</strong>, click <strong>New Registration</strong>, name it <em>Spark Dialog Tool</em>, and select <strong>Web App</strong>.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 font-mono text-[10px] font-bold flex items-center justify-center">2</span>
                        Configure Redirect URIs
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Add the official secure redirect endpoint to your Authentication settings in Microsoft:
                      </p>
                      
                      <div className="mt-2 ml-6.5 flex items-center gap-2 bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-slate-800">
                        <Terminal className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="font-mono text-[10px] select-all truncate flex-1">{redirectUrls.teams}</span>
                        <button
                          onClick={() => copyToClipboard(redirectUrls.teams, "teams-redirect")}
                          className="px-2 py-1 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono rounded cursor-pointer transition-colors"
                        >
                          {copiedCode === "teams-redirect" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 font-mono text-[10px] font-bold flex items-center justify-center">3</span>
                        Assign Graph API Scopes
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Under <strong>API Permissions &gt; Microsoft Graph</strong>, select <strong>Delegated Permissions</strong> and check:
                      </p>
                      <ul className="list-disc pl-11 text-[11px] text-slate-500 space-y-1 mt-1 font-mono">
                        <li>OnlineMeetings.Read</li>
                        <li>OnlineMeetingTranscript.Read</li>
                        <li>User.Read</li>
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 font-mono text-[10px] font-bold flex items-center justify-center">4</span>
                        Grant Admin Consent
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Click <strong>"Grant admin consent for [Your Organization]"</strong> to authorize the permissions globally, ensuring representatives don't see security warnings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GOOGLE MEET TAB PANEL */}
            {activeTab === "google" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
                <div className="border-b border-slate-100 pb-5">
                  <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider font-mono">Integration Type: Google Workspace Console</span>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 tracking-tight mt-1">
                    Google Meet & Calendar Integration
                  </h2>
                  <p className="text-xs text-slate-500 mt-2">
                    Automatically synchronize Meet discussions directly from calendar events.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-50 text-rose-700 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full">Setup Step-by-Step</span>
                    <h3 className="font-bold text-slate-950 text-sm">Google Cloud Console App Registration</h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    To allow users to pull Google Meet transcripts, register the application inside your Google Cloud Console:
                  </p>

                  <div className="space-y-4 pl-4 border-l-2 border-slate-100 mt-3">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-mono text-[10px] font-bold flex items-center justify-center">1</span>
                        Open Google Cloud Console
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Navigate to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="w-3 h-3" /></a>, create or select a project, and navigate to the <strong>APIs & Services &gt; Credentials</strong> menu.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-mono text-[10px] font-bold flex items-center justify-center">2</span>
                        Configure OAuth Client ID
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Click <strong>Create Credentials &gt; OAuth client ID</strong>. Set the application type to <strong>Web application</strong>. Paste this Authorized Redirect URI inside your Google configuration:
                      </p>
                      
                      <div className="mt-2 ml-6.5 flex items-center gap-2 bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-slate-800">
                        <Terminal className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="font-mono text-[10px] select-all truncate flex-1">{redirectUrls.google}</span>
                        <button
                          onClick={() => copyToClipboard(redirectUrls.google, "google-redirect")}
                          className="px-2 py-1 text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono rounded cursor-pointer transition-colors"
                        >
                          {copiedCode === "google-redirect" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-mono text-[10px] font-bold flex items-center justify-center">3</span>
                        Enable Required API Services
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Navigate to <strong>API Library</strong> and ensure the following APIs are fully enabled:
                      </p>
                      <ul className="list-disc pl-11 text-[11px] text-slate-500 space-y-1 mt-1">
                        <li><strong>Google Calendar API</strong> (To sync meeting links and transcripts)</li>
                        <li><strong>Google Meet API</strong> (To directly query recorded transcription segments)</li>
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-950 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-mono text-[10px] font-bold flex items-center justify-center">4</span>
                        OAuth Scopes Configuration
                      </span>
                      <p className="text-[11px] text-slate-500 pl-6.5">
                        Under the OAuth Consent Screen, add the following scopes:
                      </p>
                      <ul className="list-disc pl-11 text-[11px] text-slate-500 space-y-1 mt-1 font-mono">
                        <li>https://www.googleapis.com/auth/calendar.events.readonly</li>
                        <li>https://www.googleapis.com/auth/meetings.space.readonly</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* General Best Practices FAQ */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-950 text-sm flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-600" />
                Frequently Asked Questions
              </h3>

              <div className="space-y-4 divide-y divide-slate-100 text-xs">
                <div className="space-y-1 pt-3 first:pt-0">
                  <h4 className="font-bold text-slate-900">Do users need their own separate API keys?</h4>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    No. The Workspace Administrator sets up the master credentials application in the developer consoles (Zoom, Google, Teams). Individual sales representatives only need to log in via secure OAuth flow by clicking <strong>"Connect Account"</strong> on the integration screen.
                  </p>
                </div>

                <div className="space-y-1 pt-3">
                  <h4 className="font-bold text-slate-900">Are original voice recordings downloaded?</h4>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    No. To enforce strict data hygiene and minimal security footprint, Spark only requests and imports text-based dialogue transcripts and participant metadata. Audio files are not processed or stored.
                  </p>
                </div>

                <div className="space-y-1 pt-3">
                  <h4 className="font-bold text-slate-900">How often are conversations synchronized?</h4>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    For Gong.io, we run a cron job synced at your preferred interval (e.g., every 60 minutes). For Zoom, Teams, and Google Meet, we register webhooks that trigger immediate analysis as soon as a recorded meeting finishes and transcripts are compiled.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar status and details */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono border-b border-slate-100 pb-2">
                Integration Blueprint
              </h3>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-teal-50 text-teal-600 shrink-0 mt-0.5">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Least Privilege</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">All platform connectors enforce read-only access to transcripts and calendar headers.</p>
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Enterprise Tenant Isolation</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Credential tokens are isolated using client-specific partition nodes with Firestore rules.</p>
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Automated Sync Hooks</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Active triggers fetch new transcripts instantaneously as meetings close.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 shadow-sm space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Info className="w-4 h-4 text-teal-400" />
                Diagnostic Dashboard
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Check active platform endpoints, verify sandbox connections, and monitor live OAuth code exchange tests.
              </p>
              
              <div className="space-y-2 pt-2 border-t border-slate-850 font-mono text-[9px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ZOOM AUTH ENDPOINT</span>
                  <span className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/30 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">GONG SYNC POLLER</span>
                  <span className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/30 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">MICROSOFT GRAPH CLUSTER</span>
                  <span className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/30 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">GOOGLE APIS ACCESS</span>
                  <span className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/30 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-850 flex justify-center">
                <button
                  onClick={handleBack}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Return to Workspace</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-400 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <p>© 2026 Spark Dialog Sales Interaction & Persuasion Diagnostic Platform.</p>
          <p className="mt-1">For customized integrations or API license questions, reach out to Spark Enterprise Support.</p>
        </div>
      </footer>
    </div>
  );
}
