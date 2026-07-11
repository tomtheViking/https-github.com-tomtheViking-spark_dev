import React from "react";
import { User, LogOut, Printer } from "lucide-react";
import { TeamMember } from "../types";

interface RepAccountTabProps {
  effectiveMember?: TeamMember;
  onLogout: () => void;
}

export default function RepAccountTab({ effectiveMember, onLogout }: RepAccountTabProps) {
  return (
    <div className="space-y-6 animate-fade-in" id="rep-account-tab-content">
      <div>
        <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">
          My Account Profile
        </h1>
        <p className="text-xs text-slate-500">
          Manage your active representative identity, credentials, and printable summary exports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 md:col-span-2">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="w-14 h-14 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-xl font-mono uppercase">
              {effectiveMember?.name ? effectiveMember.name.substring(0, 2) : "RP"}
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-base">{effectiveMember?.name}</h3>
              <p className="text-xs text-slate-400">{effectiveMember?.email || "rep@sparkanalytic.com"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</span>
              <span className="font-bold text-slate-800 block text-sm">{effectiveMember?.name || "N/A"}</span>
            </div>

            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
              <span className="font-bold text-slate-800 block text-sm">{effectiveMember?.email || "N/A"}</span>
            </div>

            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Spark ID</span>
              <span className="font-mono font-bold text-teal-600 block text-sm">{effectiveMember?.sparkId || "N/A"}</span>
            </div>

            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tenant ID</span>
              <span className="font-mono font-bold text-indigo-600 block text-sm">{effectiveMember?.tenantId || "N/A"}</span>
            </div>

            <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/50 sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date of Account Activation</span>
              <span className="font-bold text-slate-800 block text-sm">
                {effectiveMember?.activationDate ? new Date(effectiveMember.activationDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC"
                }) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 h-fit">
          <h4 className="font-semibold text-slate-900 text-sm pb-2 border-b border-slate-100">Actions & Utilities</h4>
          
          <button
            onClick={() => window.print()}
            className="w-full px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            id="account-print-metrics-report-btn"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Print Aggregated Report</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            id="account-metrics-portal-logout-btn"
          >
            <LogOut className="w-4 h-4 shrink-0 text-teal-400" />
            <span>Log Out Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
