import React from "react";
import { Shield, Lock, FileText, ArrowLeft, ExternalLink, Mail, Eye, Server, RefreshCw } from "lucide-react";

interface GongPrivacyPolicyProps {
  onBack?: () => void;
}

export default function GongPrivacyPolicy({ onBack }: GongPrivacyPolicyProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-500/10 selection:text-teal-900">
      {/* Top Header/Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="group flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Workspace</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-teal-500/10 text-teal-600">
              <Shield className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono">
              Spark Compliance
            </span>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="bg-slate-900 text-white py-12 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-950/20 via-slate-900 to-slate-900 -z-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-25 -z-10" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-[10px] font-semibold tracking-wider uppercase font-mono mb-2">
            <span>Integration Privacy Disclosure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white">
            Gong.io CRM Integration Privacy Policy
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Effective Date: July 20, 2026. This policy details how Spark ("we", "us", or "our") accesses, processes, handles, and protects customer data retrieved via the Gong.io API platform.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Quick Summary Sidebar */}
          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono border-b border-slate-100 pb-2">
                Quick Summary
              </h3>
              
              <ul className="space-y-3.5">
                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-teal-50 text-teal-600 shrink-0 mt-0.5">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">What We Access</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Call metadata, conversations transcript logs, and participant profiles.</p>
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                    <Server className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Where It Is Stored</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Stored securely in multi-tenant Firebase databases with client isolation.</p>
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-rose-50 text-rose-600 shrink-0 mt-0.5">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Data Sharing</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">We do not share your data. It remains strictly confined to your workspace.</p>
                  </div>
                </li>

                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Control & Purging</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Revoke credentials or clear synchronized histories with a single click.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Developer Contact
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Need to submit this Policy to the Gong App Review Board or have questions? Contact our Compliance team directly:
              </p>
              <a
                href="mailto:security@sparkanalytic.com"
                className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-semibold transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>security@sparkanalytic.com</span>
              </a>
            </div>
          </aside>

          {/* Detailed Policy Sections */}
          <article className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8 text-slate-700 leading-relaxed text-xs">
            
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">Section 1</span>
                <span className="h-px bg-slate-200 flex-1" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                1. Scope of Integration & Consent
              </h2>
              <p>
                Spark integrates with the Gong.io CRM Platform to provide automatic synchronizations of sales calls, representative discussions, and meeting transcripts. To activate the connection, a tenant administrator must authenticate via Gong's secure OAuth 2.0 protocol and authorize the Spark platform application client.
              </p>
              <p>
                By granting permission, you explicitly consent to Spark retrieving call events and transcripts as specified within this policy to process them for automated coaching analytics, customer sentiment, and ticket creation.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">Section 2</span>
                <span className="h-px bg-slate-200 flex-1" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                2. Explicit Data Types Accessed & Collected
              </h2>
              <p>
                Through the Gong.io secure REST API, we programmatically request and retrieve only the data subsets required for intelligence processing. Specifically, we ingest:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>
                  <strong className="text-slate-800">Call Metadata:</strong> Unique call identifiers, title of the meeting, start date and time, duration, record status, and participant roles.
                </li>
                <li>
                  <strong className="text-slate-800">Parties & Users:</strong> Representative name, email address, customer organization name, and individual identifiers to map calls to correct tenant records.
                </li>
                <li>
                  <strong className="text-slate-800">Call Transcript Streams:</strong> Structured speaker dialogue turns (Speaker ID, speech sentences, timestamp intervals).
                </li>
                <li>
                  <strong className="text-slate-800">Interaction Metrics:</strong> Calculated statistics such as talk ratio, interactivity score, average monologue duration, and patience stats, accessed through extended call structures.
                </li>
              </ul>
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                💡 <strong>Important Note:</strong> Spark does <u>not</u> download, store, or stream original raw audio or video files directly to our persistent databases unless explicitly requested by the tenant for fallback media rendering.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">Section 3</span>
                <span className="h-px bg-slate-200 flex-1" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                3. Gong.io API Scopes & Purpose
              </h2>
              <p>
                To maintain the principle of least privilege, our OAuth integration requests a tightly-scoped set of permissions. Below is the mapping of scopes used and their technical purpose:
              </p>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-2 font-sans">
                <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 p-2.5">
                  <div>Requested Scope</div>
                  <div className="col-span-2">Technical Purpose</div>
                </div>
                <div className="divide-y divide-slate-100 text-[11px]">
                  <div className="grid grid-cols-3 p-2.5">
                    <div className="font-mono font-bold text-teal-600">api:calls:read:basic</div>
                    <div className="col-span-2 text-slate-600">Retrieve general call parameters (start time, title, organizer, duration) to populate call headers inside the workspace.</div>
                  </div>
                  <div className="grid grid-cols-3 p-2.5">
                    <div className="font-mono font-bold text-teal-600">api:calls:read:extensive</div>
                    <div className="col-span-2 text-slate-600">Retrieve speaker interaction profiles and representative timeline stats to build detailed visual analytics graphs.</div>
                  </div>
                  <div className="grid grid-cols-3 p-2.5">
                    <div className="font-mono font-bold text-teal-600">api:calls:read:transcript</div>
                    <div className="col-span-2 text-slate-600">Fetch text-based conversation logs to perform semantic processing and trigger AI-generated support issues.</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">Section 4</span>
                <span className="h-px bg-slate-200 flex-1" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                4. Data Processing, Usage, & Multi-Tenant Isolation
              </h2>
              <p>
                Spark enforces absolute data quarantine and tenant-level isolation:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>
                  <strong className="text-slate-800">No Cross-Tenant Leaks:</strong> Gong recordings are ingested directly under your specific Workspace ID. Stored documents inside our Firestore database are strictly partitioned by <code>tenantId</code> and protected by Firebase Security Rules.
                </li>
                <li>
                  <strong className="text-slate-800">Processing Purposes:</strong> We parse conversations to generate visual timeline dashboards, highlight high-priority support triggers, detect compliance risks, and streamline rep workflows.
                </li>
                <li>
                  <strong className="text-slate-800">No AI Training:</strong> Customer-owned call transcript datasets ingested from Gong.io are never used to train global underlying large language models.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">Section 5</span>
                <span className="h-px bg-slate-200 flex-1" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                5. Security Protocols & Encryption
              </h2>
              <p>
                All data in-flight and at-rest is secured using state-of-the-art protection policies:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>
                  <strong className="text-slate-800">API Transmissions:</strong> Rest API requests use Transport Layer Security (TLS 1.3) protocols.
                </li>
                <li>
                  <strong className="text-slate-800">Credential Guard:</strong> Your Gong Access Key ID and Secret keys are stored securely using Firestore database fields and are fully masked in client administration panels.
                </li>
                <li>
                  <strong className="text-slate-800">Audits:</strong> Spark monitors access logs to detect unusual API interactions or data transfer events.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold">Section 6</span>
                <span className="h-px bg-slate-200 flex-1" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                6. Revocation, Purging, & Data Retention
              </h2>
              <p>
                You retain complete control of your Gong.io data on Spark:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>
                  <strong className="text-slate-800">Disabling Sync:</strong> You can toggle off the "Automatic Cron Synchronization" at any time from the Gong Integration modal, stopping all background poll requests immediately.
                </li>
                <li>
                  <strong className="text-slate-800">Credential Removal:</strong> Overwriting or saving empty credentials inside the settings console deletes stored API access keys.
                </li>
                <li>
                  <strong className="text-slate-800">Complete Purging:</strong> Using the <strong>"Clear DB"</strong> action button in the primary dashboard menu will instantly and permanently remove all processed transcripts and calls from our database.
                </li>
              </ul>
            </section>

            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 flex items-start gap-3 mt-4">
              <FileText className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-teal-950">Gong Developer Portal URL Compatibility</h4>
                <p className="text-[11px] text-teal-900/80 leading-relaxed">
                  This page has been fully formatted to serve as the live public-facing <strong>Privacy Policy URL</strong> required during the Gong OAuth Application registration and security verification workflow.
                </p>
              </div>
            </div>

          </article>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto px-4">
          <p>© 2026 Spark Dialog Analytics Platform. All rights reserved.</p>
          <p className="mt-1">Gong.io integration complies with all public API guidelines and data safety specifications.</p>
        </div>
      </footer>
    </div>
  );
}
