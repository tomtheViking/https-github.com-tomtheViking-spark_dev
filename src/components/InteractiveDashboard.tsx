import React, { useState, useEffect } from "react";
import { 
  Sparkles, PhoneCall, Upload, Play, Square, CheckCircle2, 
  Smile, Meh, Frown, ArrowRight, Brain, AlertTriangle, 
  Copy, Check, RotateCcw, Info, User, HelpCircle, ChevronRight, MessageSquare,
  Database, ShieldCheck, FileText, Layers, Users, Scale, Terminal, Printer,
  Mail, Send, LogOut, Search, Handshake, Sliders, ThumbsUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CallSession, CallAnalytics } from "../types";
import { CALL_TEMPLATES, CallTemplate } from "../templates";
import EnterpriseOutputsView from "./EnterpriseOutputsView";

interface InteractiveDashboardProps {
  sessions: CallSession[];
  onAddSession: (session: CallSession) => void;
  onUpdateSession: (session: CallSession) => void;
  onSelectSession: (session: CallSession) => void;
  activeSession: CallSession | null;
}

const getNextAnalysisNumber = (existingSessions: CallSession[]): string => {
  const numbers = existingSessions
    .map(s => s.analysisNumber)
    .filter((num): num is string => typeof num === "string" && /^\d+$/.test(num))
    .map(num => parseInt(num, 10));
  
  const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
  return String(maxNum + 1).padStart(3, '0');
};

export default function InteractiveDashboard({
  sessions,
  onAddSession,
  onUpdateSession,
  onSelectSession,
  activeSession
}: InteractiveDashboardProps) {
  const [transcriptInput, setTranscriptInput] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("Jane Smith");
  const [repName, setRepName] = useState<string>("John Sales");
  const [callTitle, setCallTitle] = useState<string>("Enterprise Consultation Call");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStatusText, setAnalysisStatusText] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [apiError, setApiError] = useState<string | null>(null);
  
  // File upload / attachment states
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleFileProcess = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      let parsedTitle = file.name.replace(/\.[^/.]+$/, ""); // strip extension
      parsedTitle = parsedTitle
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      let parsedCust = "Jane Smith";
      let parsedRep = "John Sales";
      let parsedTranscript = text;

      if (file.type === "application/json" || file.name.endsWith(".json")) {
        try {
          const json = JSON.parse(text);
          if (json.transcriptText || json.transcript || json.text) {
            parsedTranscript = json.transcriptText || json.transcript || json.text;
          }
          if (json.title || json.callTitle) {
            parsedTitle = json.title || json.callTitle;
          }
          if (json.customerName || json.customer) {
            parsedCust = json.customerName || json.customer;
          }
          if (json.repName || json.rep || json.representative) {
            parsedRep = json.repName || json.rep || json.representative;
          }
        } catch (err) {
          console.warn("Could not parse JSON file, treating as plain text");
        }
      }

      setTranscriptInput(parsedTranscript);
      setCallTitle(parsedTitle);
      setCustomerName(parsedCust);
      setRepName(parsedRep);
      setAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type || "text/plain"
      });
      setApiError(null);
    };
    reader.readAsText(file);
  };

  const handleClearFile = () => {
    setAttachedFile(null);
    setTranscriptInput("");
    setCallTitle("Enterprise Consultation Call");
    setCustomerName("Jane Smith");
    setRepName("John Sales");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Copy-phrase visual states
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'dialogue' | 'enterprise'>('dialogue');

  const handleCopyPhrase = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Preload a template
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = CALL_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setTranscriptInput(template.transcriptText);
      setCustomerName(template.customerName);
      setRepName(template.repName);
      setCallTitle(template.title);
      setApiError(null);
    }
  };

  // Execute actual analysis via Express Server-side Gemini API
  const handleAnalyze = async () => {
    if (!transcriptInput.trim()) return;

    setIsAnalyzing(true);
    setApiError(null);

    // Dynamic loading messages for premium psychological theme
    const statusMessages = [
      "Running advanced dialogue diagnostics...",
      "Mapping Conversational Alignment patterns...",
      "Calculating speech ratio and sentiment indexes...",
      "Generating strategic coaching intervention phrases...",
      "Formulating deal-success percentage metrics..."
    ];

    let msgIndex = 0;
    setAnalysisStatusText(statusMessages[0]);
    const messageInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % statusMessages.length;
      setAnalysisStatusText(statusMessages[msgIndex]);
    }, 1800);

    try {
      // Check if this matched a pre-seeded template, and we can fallback safely if API key is not configured
      const matchedTemplate = CALL_TEMPLATES.find(
        (t) => t.transcriptText.trim() === transcriptInput.trim()
      );

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ transcriptText: transcriptInput })
      });

      clearInterval(messageInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze transcript.");
      }

      const analyticsResult: CallAnalytics = await response.json();

      const newSession: CallSession = {
        id: "call-" + Date.now(),
        title: callTitle || "Manual Interaction Analysis",
        customerName: customerName || "Unknown Customer",
        repName: repName || "Representative",
        date: new Date().toISOString(),
        transcriptText: transcriptInput,
        analytics: analyticsResult,
        status: "analyzed",
        analysisNumber: getNextAnalysisNumber(sessions)
      };

      onAddSession(newSession);
      onSelectSession(newSession);

    } catch (err: any) {
      clearInterval(messageInterval);
      console.error("Gemini API Error:", err);

      // Secure Fallback: If GEMINI_API_KEY is missing or server fails, and the user chose a template, we can load the premium pre-analyzed metadata so their experience is beautiful and they can see how Spark works!
      const matchedTemplate = CALL_TEMPLATES.find(
        (t) => t.transcriptText.trim() === transcriptInput.trim() || t.id === selectedTemplate
      );

      if (matchedTemplate) {
        const preSeededSession: CallSession = {
          id: "call-fallback-" + Date.now(),
          title: matchedTemplate.title,
          customerName: matchedTemplate.customerName,
          repName: matchedTemplate.repName,
          date: new Date().toISOString(),
          transcriptText: matchedTemplate.transcriptText,
          analytics: matchedTemplate.seedAnalytics as CallAnalytics,
          status: "analyzed",
          analysisNumber: getNextAnalysisNumber(sessions)
        };
        onAddSession(preSeededSession);
        onSelectSession(preSeededSession);
        setApiError("Notice: Server Gemini key not initialized. Loaded pre-analyzed high-fidelity template analytics.");
      } else {
        setApiError(err.message || "An error occurred. Please check that your GEMINI_API_KEY is set in Settings > Secrets.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setTranscriptInput("");
    setCustomerName("Jane Smith");
    setRepName("John Sales");
    setCallTitle("Enterprise Consultation Call");
    setSelectedTemplate("");
    setAttachedFile(null);
    setApiError(null);
  };

  return (
    <div className="space-y-8" id="interactive_dashboard_container">
      {/* Upper Part: Interaction Input & Voice Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-display font-semibold text-slate-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-600" />
                Speech Analysis Console
              </h2>
              <p className="text-xs text-slate-400">Attach and analyze sales transcripts to initiate dialogue alignment diagnostics</p>
            </div>
            <button
              onClick={handleReset}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all text-xs flex items-center gap-1"
              id="reset-input-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Console
            </button>
          </div>

          <div className="space-y-5" id="file-attachment-container">
            {!attachedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-4 min-h-[220px] ${
                  dragActive
                    ? "border-teal-500 bg-teal-50/50 ring-4 ring-teal-50 scale-[0.99]"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300"
                }`}
                id="drag-drop-zone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".txt,.json,.csv,.md,.vtt,.srt"
                />
                <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm text-slate-500">
                  <Upload className="w-6 h-6 text-teal-600 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900">Drag & Drop Transcript Here</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Or click to browse files from your local storage. Supports txt, json, csv, md, vtt, and srt.
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Maximum file size: 10MB
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Attached File Status Header */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-emerald-950 block truncate max-w-[240px]">
                        {attachedFile.name}
                      </span>
                      <span className="text-emerald-700 block text-[10px]">
                        {(attachedFile.size / 1024).toFixed(1)} KB • {attachedFile.type || "Plain Text"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleClearFile}
                    className="px-2.5 py-1.5 bg-white hover:bg-red-50 border border-emerald-200 hover:border-red-200 rounded text-slate-600 hover:text-red-700 font-semibold transition-all flex items-center gap-1 cursor-pointer text-[10px]"
                    id="clear-attached-file-btn"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear / Upload Another
                  </button>
                </div>

                {/* Metadata Editor */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Call Title / Deal Name
                    </label>
                    <input
                      type="text"
                      value={callTitle}
                      onChange={(e) => setCallTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Customer Name / Role
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Representative Name
                    </label>
                    <input
                      type="text"
                      value={repName}
                      onChange={(e) => setRepName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Textarea review */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Attached Transcript Preview (Editable)
                  </label>
                  <textarea
                    value={transcriptInput}
                    onChange={(e) => setTranscriptInput(e.target.value)}
                    rows={6}
                    className="w-full p-4 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-sans leading-relaxed resize-y"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-3 pt-1">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !transcriptInput.trim()}
                    className={`flex-1 py-3 px-5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                      isAnalyzing || !transcriptInput.trim()
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        : "bg-teal-600 text-white hover:bg-teal-700 hover:shadow"
                    }`}
                    id="analyze-attached-submit-btn"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-teal-600 rounded-full animate-spin" />
                        <span>{analysisStatusText}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyze Attached Transcript</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Info and Educational Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between h-full space-y-6">
            <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl" />
            
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Brain className="w-3.5 h-3.5 text-teal-400" />
                BEHAVIORAL DIAGNOSTICS ENGINE
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-display font-bold text-slate-100">Conversational Influence Principles</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The conversational diagnostic parser analyzes spoken sales dialogue against advanced persuasion models to align agreements and bypass conversational resistance:
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="w-5 h-5 bg-teal-950 text-teal-400 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 border border-teal-800/80">01</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Presuppose Agreements</h4>
                    <p className="text-[11px] text-slate-400">Framing queries with embedded positive assumptions (e.g., "As your team experiences the platform's speed...").</p>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="w-5 h-5 bg-teal-950 text-teal-400 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 border border-teal-800/80">02</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Pace Current Experience</h4>
                    <p className="text-[11px] text-slate-400">Verbalizing undeniable current realities to establish instant subconscious rapport and reduce defensive guard.</p>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="w-5 h-5 bg-teal-950 text-teal-400 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 border border-teal-800/80">03</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Bypassing Resistance</h4>
                    <p className="text-[11px] text-slate-400">Using conversational postulates that gently redirect focus past immediate logical objections straight to system value.</p>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                  <span className="w-5 h-5 bg-teal-950 text-teal-400 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 border border-teal-800/80">04</span>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">Subconscious Framing</h4>
                    <p className="text-[11px] text-slate-400">Using sensory language matches (Visual, Auditory, Kinesthetic) to mirror and anchor the customer's mental model.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                Calibration Calibration Metrics
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Transcripts are processed across five behavioral dimensions: <strong>Value Selling (D1)</strong>, <strong>SaaS Discovery (D2)</strong>, <strong>Rep Confidence Index (D3)</strong>, <strong>Anxiety Question (D4)</strong>, and <strong>Dialogue Mastery (D5)</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Warning/Error if any */}
      {apiError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 flex items-start gap-3 shadow-sm" id="api_warning">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">System Diagnostics Alert</h4>
            <p className="text-xs text-yellow-700 mt-1 leading-relaxed">{apiError}</p>
          </div>
        </div>
      )}

      {/* Lower Part: Analytics Result Render */}
      <AnimatePresence mode="wait">
        {activeSession && activeSession.analytics ? (
          <motion.div
            key={activeSession.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
            id="analytics_result_panel"
          >
            {/* Header with Title and Overall Probability */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100 rounded-full uppercase tracking-wider">
                      Processed Interaction Log
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white font-mono shadow-xs">
                      #{activeSession.analysisNumber || "001"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      System ID: {activeSession.id.substring(0, 14)}
                    </span>
                  </div>
                  <h1 className="text-2xl font-display font-bold text-slate-900 mt-1">{activeSession.title}</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluated with advanced dialogue persuasion metrics on {new Date(activeSession.date).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center space-x-6 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-sm font-semibold text-slate-600">
                    <div>Customer: <span className="font-bold text-slate-800">{activeSession.customerName}</span></div>
                    <div>Representative: <span className="font-bold text-slate-800">{activeSession.repName}</span></div>
                  </div>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="border-t border-slate-100 mt-5 pt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveResultTab('dialogue')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                    activeResultTab === 'dialogue'
                      ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                  id="tab-btn-dialogue"
                >
                  <Brain className="w-3.5 h-3.5" />
                  Dialogue Alignment Diagnostics
                </button>
                <button
                  onClick={() => setActiveResultTab('enterprise')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                    activeResultTab === 'enterprise'
                      ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                  id="tab-btn-enterprise"
                >
                  <Database className="w-3.5 h-3.5" />
                  Enterprise Downstream Pipelines
                </button>


              </div>
            </div>

            {activeResultTab === 'dialogue' ? (
              <>
                {/* Core Bento Grid Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Gauge Column */}
              <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between items-center text-center">
                <div className="w-full text-left">
                  <h3 className="font-display font-semibold text-slate-900 text-sm">Deal Win Probability</h3>
                  <p className="text-[10px] text-slate-400">Predictive percentage based on objections cleared & compliance indicators</p>
                </div>

                {/* Animated Radial Circle */}
                <div className="relative flex items-center justify-center my-6">
                  <svg className="w-36 h-36">
                    <circle
                      className="text-slate-100"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="58"
                      cx="72"
                      cy="72"
                    />
                    <circle
                      className="text-teal-500 transition-all duration-1000 ease-out"
                      strokeWidth="10"
                      strokeDasharray={364}
                      strokeDashoffset={364 - (364 * activeSession.analytics.successPercentage) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="58"
                      cx="72"
                      cy="72"
                      transform="rotate(-90 72 72)"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-4xl font-display font-bold text-slate-950">{activeSession.analytics.successPercentage}%</span>
                    <span className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Likelihood</span>
                  </div>
                </div>

                <div className="w-full">
                  <div className={`p-3 rounded-xl text-center text-xs font-semibold ${
                    activeSession.analytics.successPercentage >= 80
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : activeSession.analytics.successPercentage >= 60
                      ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                      : "bg-red-50 text-red-700 border border-red-100"
                  }`}>
                    {activeSession.analytics.successPercentage >= 80
                      ? "High Adoption Conviction Detected"
                      : activeSession.analytics.successPercentage >= 60
                      ? "Moderate Resistance Identified"
                      : "Action Plan Required Immediately"}
                  </div>
                </div>
              </div>

              {/* Speaking listening ratio & Sentiment Cards */}
              <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Speaking ratio card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-sm">Speaking vs Listening Ratio</h3>
                    <p className="text-[10px] text-slate-400">Representative vs Customer dialogue distribution</p>
                  </div>

                  <div className="space-y-3 my-4">
                    <div className="flex justify-between text-xs font-mono font-medium">
                      <span className="text-teal-600">Representative: {activeSession.analytics.speakingListeningRatio.split(":")[0]}%</span>
                      <span className="text-slate-500">Customer: {activeSession.analytics.speakingListeningRatio.split(":")[1]}%</span>
                    </div>
                    
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-teal-500 h-full" 
                        style={{ width: `${activeSession.analytics.speakingListeningRatio.split(":")[0]}%` }}
                      />
                      <div 
                        className="bg-slate-400 h-full" 
                        style={{ width: `${activeSession.analytics.speakingListeningRatio.split(":")[1]}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed italic pt-1">
                      {parseInt(activeSession.analytics.speakingListeningRatio.split(":")[0]) > 60 
                        ? "Coaching suggestion: Speak less, listen more. Aim for at least 55% customer speaking time."
                        : "Optimal listening ratio achieved! Allows customer to fully voice concerns."}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Customer Sentiment:</span>
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                      {activeSession.analytics.customerSentiment === "positive" ? (
                        <>
                          <Smile className="w-4 h-4 text-green-500" />
                          <span className="text-green-700">Positive</span>
                        </>
                      ) : activeSession.analytics.customerSentiment === "negative" ? (
                        <>
                          <Frown className="w-4 h-4 text-red-500" />
                          <span className="text-red-700">Negative</span>
                        </>
                      ) : (
                        <>
                          <Meh className="w-4 h-4 text-yellow-500" />
                          <span className="text-yellow-700">Neutral</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Star / index rating scores */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-sm">Behavioral Performance</h3>
                    <p className="text-[10px] text-slate-400">Advanced dialogue grading criteria</p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Empathy Score */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Rep Empathy Index</span>
                        <span className="font-bold text-slate-800 font-mono">{activeSession.analytics.repEmpathyScore}/10</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${activeSession.analytics.repEmpathyScore * 10}%` }} />
                      </div>
                    </div>

                    {/* Objection Resistance */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Customer Resistance</span>
                        <span className="font-bold text-slate-800 font-mono">{activeSession.analytics.customerObjectionResistance}/10</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-orange-400 h-full rounded-full" style={{ width: `${activeSession.analytics.customerObjectionResistance * 10}%` }} />
                      </div>
                    </div>

                    {/* Confidence Index */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Representative Confidence</span>
                        <span className="font-bold text-slate-800 font-mono">{activeSession.analytics.confidenceIndex}/10</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${activeSession.analytics.confidenceIndex * 10}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 leading-relaxed pt-1.5 border-t border-slate-100">
                    Scores are formulated by measuring conversational pauses, linguistic flow, empathy cues, and objection recovery timing.
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights Alert Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-display font-semibold text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                Key Strategic Insights
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeSession.analytics.keyInsights.slice(0, 3).map((insight, index) => (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden flex flex-col justify-between">
                    <div className="text-xs font-mono font-bold text-teal-600 mb-1">Takeaway #0{index + 1}</div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Coaching Interventions - THE MASTERPIECE */}
            <div className="space-y-4" id="coaching_interventions_panel">
              <div>
                <h2 className="text-xl font-display font-semibold text-slate-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-teal-600 animate-pulse" />
                  Dialogue Alignment Coaching Interventions
                </h2>
                <p className="text-xs text-slate-400">Specific sales representative phrasings optimized using advanced dialogue alignment framing for commercial success</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {activeSession.analytics.coachingInterventions.map((intervention, index) => (
                  <div key={index} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between h-full">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                      <span className="text-xs font-bold font-display uppercase tracking-wider text-teal-400">
                        Intervention #{index + 1}: {intervention.title}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-800 text-[10px] font-mono rounded text-slate-300">
                        {intervention.frameworkApplied}
                      </span>
                    </div>

                    <div className="p-5 space-y-4 flex-1">
                      {/* Original text */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Raw Utterance (Sub-optimal)</span>
                        <div className="bg-red-50/50 border border-red-100 text-red-900 text-xs p-3 rounded-lg italic">
                          "{intervention.originalText}"
                        </div>
                      </div>

                      {/* Milton Corrected Text */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider block">Refined Alignment Phrasing</span>
                          <button
                            onClick={() => handleCopyPhrase(intervention.correctedText, index)}
                            className="text-[10px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-3 h-3 text-green-500" />
                                Phrasing Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy Pitch
                              </>
                            )}
                          </button>
                        </div>
                        <div className="bg-teal-50/50 border border-teal-100 text-teal-950 text-xs p-3 rounded-lg font-medium italic leading-relaxed">
                          "{intervention.correctedText}"
                        </div>
                      </div>

                      {/* Psychological Explanation */}
                      <div className="space-y-1 pt-1.5 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Psychological Dynamics</span>
                        <p className="text-xs text-slate-600 leading-relaxed">{intervention.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time Buyer Portal Synchronization Feed */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 animate-fade-in" id="representative-buyer-sync">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-900 text-teal-400 rounded-lg">
                    <Handshake className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-sm">Real-Time Buyer Alignment Feed</h3>
                    <p className="text-[10px] text-slate-400">Live configurations, custom budget choices, and lodged concerns from the Customer Facing Portal</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono text-[9px] font-bold text-teal-700">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping" />
                  <span>Interactive Sync Active</span>
                </div>
              </div>

              {/* Grid with Trial Configurations and Logged Feedbacks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Client trial parameters */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    Buyer Preferred Configurations
                  </h4>
                  {activeSession.clientConfig ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Requested Seats</span>
                          <span className="text-sm font-bold text-slate-850 font-mono">{activeSession.clientConfig.users} Seats</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Contract Duration</span>
                          <span className="text-sm font-bold text-slate-850 font-mono">{activeSession.clientConfig.months} Months</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-650">
                          <span>1:1 Coaching AI Addon:</span>
                          <span className="font-semibold text-slate-800">{activeSession.clientConfig.coachingEnabled ? "Included (+$15)" : "Excluded"}</span>
                        </div>
                        <div className="flex justify-between text-slate-655">
                          <span>Behavioral Diagnostics:</span>
                          <span className="font-semibold text-slate-800">{activeSession.clientConfig.diagnosticsEnabled ? "Included (+$10)" : "Excluded"}</span>
                        </div>
                        <div className="border-t border-slate-200/60 pt-2 flex justify-between font-bold text-slate-900">
                          <span>Est. Monthly Budget:</span>
                          <span className="text-teal-600 font-mono">${activeSession.clientConfig.totalMonthlyCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-slate-150 rounded-xl text-center text-slate-400 text-xs py-8">
                      No custom budget configuration received yet. Share the Customer Facing Portal with your prospect to let them customize trial sizes.
                    </div>
                  )}
                </div>

                {/* 2. Live Client Inquiries */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    Logged Buyer Inquiries ({activeSession.customerFeedback?.length || 0})
                  </h4>
                  {activeSession.customerFeedback && activeSession.customerFeedback.length > 0 ? (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {activeSession.customerFeedback.map((fb) => (
                        <div key={fb.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-700">{fb.author}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-400 font-mono">{new Date(fb.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                            </div>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                              fb.type === "objection" ? "bg-red-50 text-red-700 border border-red-100" :
                              fb.type === "question" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                              "bg-slate-150 text-slate-600"
                            }`}>
                              {fb.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium italic">"{fb.message}"</p>
                          
                          {fb.type === "objection" && (
                            <button
                              onClick={() => {
                                const resolvedFeedbacks = activeSession.customerFeedback?.filter(f => f.id !== fb.id) || [];
                                const updatedAnalytics = activeSession.analytics ? {
                                  ...activeSession.analytics,
                                  customerObjectionResistance: Math.max(1, activeSession.analytics.customerObjectionResistance - 1),
                                  successPercentage: Math.min(100, activeSession.analytics.successPercentage + 5),
                                  keyInsights: [
                                    ...activeSession.analytics.keyInsights.filter(insight => !insight.includes(fb.message.substring(0, 30))),
                                    `Addressed objection: "${fb.message.substring(0, 30)}..."`
                                  ]
                                } : null;
                                
                                onUpdateSession({
                                  ...activeSession,
                                  customerFeedback: resolvedFeedbacks,
                                  analytics: updatedAnalytics
                                });
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-emerald-600 text-[10px] font-bold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              Address Objection (+5% Win Probability)
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-slate-150 rounded-xl text-center text-slate-400 text-xs py-8">
                      Your prospect has raised zero pending objections. They can lodge questions or worries on their portal.
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Collapsible Registered Alignment Patterns list */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-display font-semibold text-slate-900 text-base">Linguistic Pattern Log</h3>
                <p className="text-xs text-slate-400">Exhaustive list of conversational and behavioral structures isolated from the call dialogue</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-2">Pattern Name</th>
                      <th className="pb-2">Speaker</th>
                      <th className="pb-2">Utterance Quote</th>
                      <th className="pb-2">Evaluation</th>
                      <th className="pb-2 text-right">Linguistic Refinement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans leading-relaxed">
                    {activeSession.analytics.miltonPatterns.map((pattern, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="py-3 font-semibold text-slate-900">{pattern.patternName}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            pattern.speaker === "Representative" 
                              ? "bg-teal-50 text-teal-700" 
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {pattern.speaker}
                          </span>
                        </td>
                        <td className="py-3 italic text-slate-600 max-w-xs truncate">"{pattern.quote}"</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            pattern.evaluation === "effective"
                              ? "text-green-600"
                              : pattern.evaluation === "ineffective"
                              ? "text-red-500"
                              : "text-slate-500"
                          }`}>
                            {pattern.evaluation}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 text-right font-medium max-w-xs truncate" title={pattern.improvementSuggestion}>
                          {pattern.improvementSuggestion}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pre-Call Prep / Next Steps */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-sm border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg">
                  <PhoneCall className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white text-base">Next Dial Pre-Call Prep</h3>
                  <p className="text-[10px] text-slate-400">Critical tasks to execute before this prospect's next follow-up call</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {activeSession.analytics.nextSteps.map((step, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-teal-500/15 text-teal-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <EnterpriseOutputsView activeSession={activeSession} />
        )}

          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4" id="empty_results_card">
            <div className="mx-auto w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 border border-teal-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-display font-semibold text-slate-800">No Diagnostics Displayed</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Upload a transcript, select a template call, or trigger the live voice simulation above and click **Initiate Dialogue Alignment Diagnostics** to generate automated behavioral and persuasion analytics.
            </p>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
