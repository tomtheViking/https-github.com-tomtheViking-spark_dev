import React, { useState } from "react";
import { 
  Database, ShieldCheck, FileText, Layers, Users, Scale, 
  Terminal, Copy, Check, ArrowRight, Shield, AlertTriangle, 
  CheckCircle2, Clock, Calendar, Code, ExternalLink, RefreshCw,
  Settings, Sliders, Info, HelpCircle, ShieldAlert
} from "lucide-react";
import { motion } from "motion/react";
import { CallSession } from "../types";

interface EnterpriseOutputsViewProps {
  activeSession: CallSession;
}

export default function EnterpriseOutputsView({ activeSession }: EnterpriseOutputsViewProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [syncedStatus, setSyncedStatus] = useState<Record<string, boolean>>({});

  // Guardrail 10: Live Compliance & Guide Rails Evaluation States
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [auditScore, setAuditScore] = useState<number | null>(null);
  const [showConfigRules, setShowConfigRules] = useState<boolean>(false);

  const [complianceRules, setComplianceRules] = useState<any[]>([
    {
      id: "comp-1",
      rule: "Contract Deviation Authorizations",
      description: "Check if the representative verbally proposed or agreed to any custom contract provisions, quarterly review-out rights, custom SLAs, or SLA/onboarding commitments that deviate from standard company policies without legal validation."
    },
    {
      id: "comp-2",
      rule: "Pricing Transparency Policy",
      description: "Check if there are any unauthorized discount percentages, standard price list reductions, or non-standard pricing schedules initiated or offered by the representative."
    },
    {
      id: "comp-3",
      rule: "SLA / Onboarding Commitments",
      description: "Check if the representative proposed any non-standard SLAs or onboarding estimates that fall outside of standard general guidelines (e.g., standard trial deployment in 30 days)."
    }
  ]);

  const runComplianceAudit = async () => {
    if (!activeSession || !activeSession.transcriptText) {
      setAuditError("No transcript text available for compliance analysis in the active session.");
      return;
    }
    setIsAuditing(true);
    setAuditError(null);
    try {
      const res = await fetch("/api/verify-compliance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transcriptText: activeSession.transcriptText,
          complianceRules
        })
      });
      if (!res.ok) {
        throw new Error("Compliance verification API returned an error status.");
      }
      const data = await res.json();
      setActiveAlerts(data.alerts || []);
      setAuditScore(data.overallScore);
    } catch (err: any) {
      console.error(err);
      setAuditError(err.message || "An unexpected error occurred while executing the compliance check.");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleSync = (sectionId: string) => {
    setIsSyncing(sectionId);
    setTimeout(() => {
      setIsSyncing(null);
      setSyncedStatus(prev => ({ ...prev, [sectionId]: true }));
    }, 1200);
  };

  // Determine company name based on title or customer
  const getCompany = () => {
    const titleLower = activeSession.title.toLowerCase();
    if (titleLower.includes("widget")) return "Widget Plus Inc.";
    if (titleLower.includes("ufc") || titleLower.includes("ignite")) return "UFC Ignite";
    if (titleLower.includes("harmony")) return "Harmony Craft";
    if (titleLower.includes("cotton")) return "Cotton Inc.";
    return "Enterprise Prospect";
  };

  const companyName = getCompany();
  const repName = activeSession.repName || "Representative";
  const customerName = activeSession.customerName || "Customer contact";

  // 1. Salesforce CRM Sync Payload JSON
  const sfPayload = {
    attributes: { type: "Sales_Call_Evaluation__c" },
    Representative_Name__c: repName,
    Client_Contact__c: customerName,
    Target_Company__c: companyName,
    Sales_Methodology_Adherence__c: `${activeSession.analytics?.successPercentage}%`,
    Confidence_Score__c: activeSession.analytics?.confidenceIndex || 8,
    Empathy_Score__c: activeSession.analytics?.repEmpathyScore || 8,
    Key_Pain_Points__c: activeSession.analytics?.keyInsights?.join("; ") || "Integration speed; Commercial flex constraints",
    Coaching_Action_Plan__c: "Deploy pre-demo validation sequence; implement Anxiety Question timing-gate on lock-in concerns.",
    Sync_Timestamp__c: new Date().toISOString()
  };

  // 2. Jira Ticket Payload
  const jiraPayload = {
    fields: {
      project: { key: "PROD" },
      summary: `[Call Feedback - ${companyName}] Urgent Deployment & Onboarding Cycle constraints`,
      description: `### Source Call: ${activeSession.title}\n` +
                   `**Client Name**: ${companyName} (${customerName})\n` +
                   `**Representative**: ${repName}\n\n` +
                   `#### Uncovered Product Feedback / Feature Gaps:\n` +
                   `- Buyer expressed critical aversion to standard 9-month onboarding frameworks.\n` +
                   `- High sensitivity to contract lock-ins; requested customizable Quarterly SLA review-out provisions.\n` +
                   `- Staging trial environment requested for development validation.\n\n` +
                   `#### Transcribed Reference Fragment:\n` +
                   `*"Well, yes. We're growing quite fast... We can't afford to be stuck in a nine-month onboarding cycle. We need speed."*`,
      issuetype: { name: "Feature Request" },
      priority: { name: "High" },
      labels: ["sales-feedback", "onboarding-speed", companyName.toLowerCase().replace(/\s+/g, "-")]
    }
  };

  // 3. Compliance Log
  const complianceAlerts = [
    {
      id: "comp-1",
      rule: "Contract Deviation Authorizations",
      status: "warning",
      details: "Rep verbally proposed quarterly review-out provisions before securing legal validation."
    },
    {
      id: "comp-2",
      rule: "Pricing Transparency Policy",
      status: "compliant",
      details: "No unauthorized discount percentages or standard schedule reductions were initiated."
    },
    {
      id: "comp-3",
      rule: "SLA / Onboarding Commitments",
      status: "compliant",
      details: "Onboarding estimates kept within general guidelines (standard trial deployment in 30 days)."
    }
  ];

  // 4. Historical Remediation Log (HR Audit Trail)
  const hrTimeline = [
    {
      date: "June 15, 2026",
      event: "Initial Evaluation & Discovery Baseline",
      details: "SaaS discovery scored at 5/10 on Cotton Inc. call. Identified skipped problem-discovery gates."
    },
    {
      date: "June 22, 2026",
      event: "Remediation Touchpoint 1 (Revenue Coach)",
      details: "Conducted 1:1 roleplay on the 'Anxiety Question'. Shared structural discovery procedures."
    },
    {
      date: "June 29, 2026",
      event: "Call Calibration (Widget Plus Inc.)",
      details: `Active coaching applied. Rep confidence remains high (9/10). Empathy score stable. Urgency/Anxiety dimension remains at 3/10; requires continuous active drilling.`
    }
  ];

  return (
    <div className="space-y-8" id="enterprise-outputs-tab-panel">
      {/* Overview Card */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <h2 className="font-display font-bold text-lg text-white">Enterprise Downstream Action Engine</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              This terminal translates raw call metrics into formatted structures for CRM, engineering boards, compliance audits, and legal record preservation.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
            <span>PIPELINE: ACTIVE</span>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Core Architectural Mandates Compliance Card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4" id="architectural-mandates-compliance">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 rounded-lg text-teal-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-900 text-sm">Core Architectural Mandates Enforcement</h3>
              <p className="text-[10px] text-slate-400">Logically and physically isolating enterprise data pipelines while maintaining low scaling footprints</p>
            </div>
          </div>
          <span className="inline-flex self-start sm:self-center text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
            Compliant & Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* Mandate 1: Zero Shared Air */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mandate: Zero Shared Air</h4>
              </div>
              <span className="text-[9px] font-bold font-mono text-teal-600 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded">
                DATA ISOLATED
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Tenant data is physically and logically isolated. Client A's data never exists in the same storage prefix, database schema, or Bedrock Knowledge Base as Client B's.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/80 space-y-1.5 font-mono text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span>Active Isolation Tenant ID:</span>
                <span className="text-slate-800 font-semibold">{companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-tenant</span>
              </div>
              <div className="flex justify-between">
                <span>Validated Storage Prefix:</span>
                <span className="text-teal-600 font-semibold truncate max-w-[200px]" title={`s3://spark-tenant-data/${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/`}>
                  s3://.../{companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/
                </span>
              </div>
              <div className="flex justify-between">
                <span>Database Catalog Namespace:</span>
                <span className="text-teal-600 font-semibold truncate max-w-[200px]" title={`schema_${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`}>
                  schema_{companyName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Bedrock Knowledge Base:</span>
                <span className="text-teal-600 font-semibold truncate max-w-[200px]" title={`isolated_kb_${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`}>
                  isolated_kb_{companyName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}
                </span>
              </div>
            </div>
          </div>

          {/* Mandate 2: Serverless First */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mandate: Serverless First</h4>
              </div>
              <span className="text-[9px] font-bold font-mono text-teal-600 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded">
                SCALE-TO-ZERO ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Operational overhead is minimized. Auto-scaling, managed components maintain a low financial footprint during early-stage scaling and auto-scale to zero when idle.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/80 space-y-1.5 font-mono text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span>Analysis Engine Deployment:</span>
                <span className="text-slate-800 font-semibold">Serverless Auto-scale Container</span>
              </div>
              <div className="flex justify-between">
                <span>Current Replication Min/Max:</span>
                <span className="text-teal-600 font-semibold">0 / 10 Active Replicas</span>
              </div>
              <div className="flex justify-between">
                <span>On-Demand Resource Billing:</span>
                <span className="text-teal-600 font-semibold">Per-Second Execution Micro-billing</span>
              </div>
              <div className="flex justify-between">
                <span>Idle Resource Power draw:</span>
                <span className="text-teal-600 font-semibold">0.00 Watts (Suspended State)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pillar 1: Sales Strategy Optimization (CRM Sync) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between" id="pillar-sales-strategy">
          <div>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">01</span>
                <div>
                  <h3 className="font-display font-semibold text-slate-900 text-sm">CRM Sales Strategy Mapping</h3>
                  <p className="text-[10px] text-slate-400">Pushed to Salesforce custom objects for executive funnel insights</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(JSON.stringify(sfPayload, null, 2), "salesforce")}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200"
              >
                {copiedSection === "salesforce" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CRM Object Schema Map</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-mono">Opportunity Account</span>
                    <span className="font-semibold text-slate-800">{companyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-mono">Assigned Representative</span>
                    <span className="font-semibold text-slate-800">{repName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-mono">Methodology Score</span>
                    <span className="font-bold text-teal-600 font-mono">{activeSession.analytics?.successPercentage}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-mono">Pipeline Status</span>
                    <span className="font-semibold text-slate-800">Coaching Checklist Synced</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-slate-400" />
                  REST API Update Payload (JSON)
                </div>
                <pre className="bg-slate-950 text-slate-200 text-[11px] p-3 rounded-xl font-mono overflow-x-auto max-h-40 leading-relaxed border border-slate-800">
                  {JSON.stringify(sfPayload, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50/20 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">Auto-created coaching playbooks appended to records.</span>
            <button
              onClick={() => handleSync("salesforce")}
              disabled={isSyncing === "salesforce" || syncedStatus["salesforce"]}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                syncedStatus["salesforce"]
                  ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                  : "bg-teal-600 text-white hover:bg-teal-700 shadow-sm cursor-pointer"
              }`}
            >
              {isSyncing === "salesforce" ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : syncedStatus["salesforce"] ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Synced with Salesforce</span>
                </>
              ) : (
                <>
                  <Database className="w-3 h-3" />
                  <span>Push to CRM Objects</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pillar 2: Product Requirements Pipeline (Jira Ticket) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between" id="pillar-product-pipeline">
          <div>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">02</span>
                <div>
                  <h3 className="font-display font-semibold text-slate-900 text-sm">Product Requirements Pipeline</h3>
                  <p className="text-[10px] text-slate-400">Automated feature gaps & competitor trackers pushed to engineering boards</p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(JSON.stringify(jiraPayload, null, 2), "jira")}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200"
              >
                {copiedSection === "jira" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs bg-white">
                <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-mono font-bold uppercase rounded">
                      HIGH PRIORITY
                    </span>
                    <h4 className="font-semibold text-slate-900 text-xs mt-1.5">{jiraPayload.fields.summary}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold font-mono">JIRA-PROD-2026</span>
                </div>
                
                <div className="text-xs space-y-1.5 text-slate-600 leading-relaxed">
                  <p><strong>Impacted Customer:</strong> {companyName} ({customerName})</p>
                  <p><strong>Isolated Feature Constraint:</strong> SLA customizable Quarterly Review-out clauses to bypass procurement lock-in concerns. Requires standard staging sandbox container provisioning.</p>
                  <blockquote className="bg-slate-50 border-l-2 border-teal-500 pl-3.5 py-1.5 text-[11px] italic text-slate-500 rounded-r-lg font-medium">
                    "We can't afford to be stuck in a nine-month onboarding cycle. We need speed."
                  </blockquote>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-slate-400" />
                  Jira REST API Creation Payload
                </div>
                <pre className="bg-slate-950 text-slate-200 text-[11px] p-3 rounded-xl font-mono overflow-x-auto max-h-32 leading-relaxed border border-slate-800">
                  {JSON.stringify(jiraPayload, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50/20 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">Converts call bottlenecks directly to Jira backlog items.</span>
            <button
              onClick={() => handleSync("jira")}
              disabled={isSyncing === "jira" || syncedStatus["jira"]}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                syncedStatus["jira"]
                  ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                  : "bg-teal-600 text-white hover:bg-teal-700 shadow-sm cursor-pointer"
              }`}
            >
              {isSyncing === "jira" ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : syncedStatus["jira"] ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Jira Issue Created</span>
                </>
              ) : (
                <>
                  <Code className="w-3 h-3" />
                  <span>Push to Engineering Ticket</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pillar 3: Compliance Verification */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between" id="pillar-compliance">
          <div>
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/40 gap-3">
              <div className="flex items-start sm:items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0">03</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-slate-900 text-sm">Regulatory Compliance & Contract Audit</h3>
                    <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded uppercase">
                      Guardrail 10 Engine
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Scans call transcript against strict parameters, discounting limits, and contract specs</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={() => setShowConfigRules(!showConfigRules)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                  title="Configure Compliance & Guide Rails Context"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
                {auditScore !== null ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    auditScore === 100 
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                      : "text-amber-700 bg-amber-50 border-amber-200"
                  }`}>
                    Score: {auditScore}% Compliant
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase">
                    Static Preview
                  </span>
                )}
              </div>
            </div>

            {/* Compliance Rules Guidelines Context Panel */}
            {showConfigRules && (
              <div className="bg-slate-50 border-b border-slate-200 p-5 space-y-3.5 animate-in slide-in-from-top-3 duration-250">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-teal-600" />
                    [Compliance & Guide Rails] Rules Context
                  </span>
                  <span className="text-[10px] text-slate-500 italic">Rules evaluated live using Gemini NLP</span>
                </div>

                <div className="space-y-3">
                  {complianceRules.map((rule, index) => (
                    <div key={rule.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">Rule 0{index + 1}:</span>
                        <h4 className="text-xs font-bold text-slate-900">{rule.rule}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{rule.description}</p>
                    </div>
                  ))}
                </div>

                {/* Guardrail 10 banner */}
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h5 className="text-[11px] font-bold text-blue-900">Mandate: Objective Evaluation (Guardrail 10)</h5>
                    <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                      Violations are flagged ONLY if there is an explicit, clear contradiction in the transcript text. Intent is never inferred, assumed, or extrapolated. If evidence is lacking, rules must be marked as 'Compliant' or 'Insufficient Data'.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-5 space-y-4">
              {auditError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="font-medium">
                    <strong className="block font-bold">Evaluation Suspended</strong>
                    {auditError}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {activeAlerts.length > 0 ? (
                  activeAlerts.map((alert) => {
                    const isViolation = alert.status === "warning" || alert.status === "violation";
                    const isInsufficient = alert.status === "insufficient_data";
                    
                    let bgClass = "bg-emerald-50/60 border-emerald-200 text-emerald-900";
                    let textClass = "text-emerald-800";
                    let label = "Compliant";
                    let icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;

                    if (isViolation) {
                      bgClass = "bg-rose-50/60 border-rose-200 text-rose-900";
                      textClass = "text-rose-800";
                      label = "Violation Flagged";
                      icon = <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
                    } else if (isInsufficient) {
                      bgClass = "bg-slate-50 border-slate-200 text-slate-700";
                      textClass = "text-slate-600";
                      label = "Insufficient Data";
                      icon = <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />;
                    }

                    return (
                      <div key={alert.id} className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${bgClass}`}>
                        {icon}
                        <div className="space-y-1 w-full">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-900">{alert.rule}</h4>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                              isViolation 
                                ? "text-rose-700 bg-rose-100 border-rose-200" 
                                : isInsufficient 
                                  ? "text-slate-600 bg-slate-100 border-slate-300" 
                                  : "text-emerald-700 bg-emerald-100 border-emerald-200"
                            }`}>
                              {label}
                            </span>
                          </div>
                          <p className={`text-[11px] font-medium leading-relaxed ${textClass}`}>{alert.details}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="bg-amber-50/20 border border-amber-200/50 rounded-xl p-3.5 flex items-start gap-2.5 text-[11px] text-amber-800 font-medium">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Currently showing baseline mock logs. Click <strong>Run Guardrail 10 Evaluation</strong> below to dynamically score the transcript of the active session <strong>({activeSession.title})</strong> against compliance criteria.
                      </span>
                    </div>
                    {complianceAlerts.map((alert) => (
                      <div 
                        key={alert.id}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                          alert.status === "warning"
                            ? "bg-amber-50/60 border-amber-200 text-amber-900"
                            : "bg-green-50/60 border-green-200 text-green-900"
                        }`}
                      >
                        {alert.status === "warning" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-900">{alert.rule}</h4>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-medium">{alert.details}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Legal Ops alert box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200/60 rounded-lg text-slate-700">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Legal & Operations Risk Alert Pipeline</h5>
                    <p className="text-[10px] text-slate-400">Instant notification pipeline to general counsel dashboard</p>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-teal-600 flex items-center gap-1 font-mono">
                  <span>DISPATCHED</span>
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[10px] text-slate-400 font-medium max-w-sm">
              Guardrail 10: Ensures objective compliance. We only flag violations on explicit, clear textual contradictions.
            </span>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={runComplianceAudit}
                disabled={isAuditing || !activeSession.transcriptText}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-teal-600 text-white hover:bg-teal-700 shadow-sm disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all cursor-pointer"
              >
                {isAuditing ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Auditing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    <span>Run Guardrail 10 Evaluation</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleSync("compliance")}
                disabled={isSyncing === "compliance" || syncedStatus["compliance"]}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  syncedStatus["compliance"]
                    ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                    : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm cursor-pointer"
                }`}
              >
                {isSyncing === "compliance" ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : syncedStatus["compliance"] ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Dispatched Alert</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3" />
                    <span>Acknowledge & Sign-off</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Pillar 4: Human Resource Alerts (Remediation Timeline) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between" id="pillar-hr-alerts">
          <div>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">04</span>
                <div>
                  <h3 className="font-display font-semibold text-slate-900 text-sm">HR Audit Trail & Performance Calibration</h3>
                  <p className="text-[10px] text-slate-400">Chronological, unalterable timeline of coaching efforts and remediation</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded uppercase">
                Audit Safe
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs text-slate-500 leading-relaxed mb-1">
                Remediation metrics protect the organization from wrongful termination liability by compiling a clean, gap-free history of specific manager coaching milestones.
              </div>

              {/* Timeline nodes */}
              <div className="relative border-l border-slate-200 ml-3.5 pl-5 space-y-5 py-1">
                {hrTimeline.map((item, index) => (
                  <div key={index} className="relative">
                    {/* Circle bullet */}
                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 bg-white border-2 border-teal-500 rounded-full flex items-center justify-center z-10">
                      <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-teal-600 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.date}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">| {item.event}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50/20 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">Provides objective, chronological data for corporate counsel.</span>
            <button
              onClick={() => handleSync("hr")}
              disabled={isSyncing === "hr" || syncedStatus["hr"]}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                syncedStatus["hr"]
                  ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                  : "bg-teal-600 text-white hover:bg-teal-700 shadow-sm cursor-pointer"
              }`}
            >
              {isSyncing === "hr" ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Locking Log...</span>
                </>
              ) : syncedStatus["hr"] ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Locked and Archived</span>
                </>
              ) : (
                <>
                  <Users className="w-3 h-3" />
                  <span>Archive & Freeze HR Log</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
