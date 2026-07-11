import React, { useState } from "react";
import { MessageSquare, CheckCircle2, ShieldAlert, Loader2, Info } from "lucide-react";
import { TeamMember, SupportTicket } from "../types";
import { getTenantNameById } from "../lib/tenant";

interface RepContactTabProps {
  effectiveMember?: TeamMember;
  onAddTicket?: (ticket: SupportTicket) => Promise<void> | void;
}

export default function RepContactTab({ effectiveMember, onAddTicket }: RepContactTabProps) {
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketPriority, setTicketPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

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
      const assignedTenantId = effectiveMember?.tenantId || "CLIENT-A";
      const resolvedTenantName = getTenantNameById(assignedTenantId);

      const newTicket: SupportTicket = {
        id: "ticket-" + Math.floor(1000 + Math.random() * 9000), // Random 4-digit ID
        title: ticketSubject.trim() || "Inbound Rep Portal Inquiry",
        tenantId: assignedTenantId,
        tenantName: resolvedTenantName,
        priority: ticketPriority,
        status: "Open",
        customerMessage: ticketMessage.trim(),
        createdAt: new Date().toISOString(),
        matchingTelemetryIds: []
      };

      if (onAddTicket) {
        await onAddTicket(newTicket);
      }
      setTicketSuccess(`Support ticket ${newTicket.id} successfully created and submitted to support queue!`);
      setTicketSubject("");
      setTicketMessage("");
      setTicketPriority("MEDIUM");
    } catch (err: any) {
      console.error("Error creating ticket:", err);
      setTicketError(err.message || "Could not submit support ticket. Please try again.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const currentTenantId = effectiveMember?.tenantId || "CLIENT-A";
  const currentTenantName = getTenantNameById(currentTenantId);

  return (
    <div className="space-y-6 animate-fade-in" id="rep-contact-tab-content">
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
          <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-xs">Generate Technical Ticket</h3>
            <p className="text-[10px] text-slate-400">Describe your pipeline issue or metrics calculation latency</p>
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
            <div className="space-y-1 md:col-span-1 font-sans">
              <label className="font-semibold text-slate-700 block">Inquiry Subject / Title</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Dialogue analysis syncing latency"
                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-800"
              />
            </div>

            {/* Priority */}
            <div className="space-y-1 md:col-span-1 font-sans">
              <label className="font-semibold text-slate-700 block">Severity Level</label>
              <select
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value as any)}
                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-800"
              >
                <option value="LOW">LOW Severity</option>
                <option value="MEDIUM">MEDIUM Severity</option>
                <option value="HIGH">HIGH Severity</option>
              </select>
            </div>

            {/* Detailed Message */}
            <div className="space-y-1 md:col-span-2 font-sans">
              <label className="font-semibold text-slate-700 block">Detailed Description / Complaint</label>
              <textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                rows={6}
                placeholder="Please detail your question, objection or complaint regarding behavioral metrics alignment or persuasion reframing feedback..."
                className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-800 leading-relaxed"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 flex-wrap gap-3">
            <div className="text-[10px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-1.5 flex-1 min-w-[250px]">
              <Info className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <span>
                Security Notice: Central ticket operations will immediately isolate and diagnostic-wrap logs associated with Tenant ID: <strong>{currentTenantId} ({currentTenantName})</strong> and Representative Spark ID: <strong>{effectiveMember?.sparkId || "N/A"}</strong>.
              </span>
            </div>
            <button
              type="submit"
              disabled={isSubmittingTicket}
              className="w-full sm:w-auto sm:px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-md shadow-slate-950/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isSubmittingTicket ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5" />
              )}
              <span>Submit Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
