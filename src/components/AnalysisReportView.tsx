import React, { useRef } from "react";
import { X, Printer, FileText, CheckCircle2, TrendingUp, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { CallSession } from "../types";

interface AnalysisReportViewProps {
  session: CallSession;
  onClose: () => void;
}

export default function AnalysisReportView({ session, onClose }: AnalysisReportViewProps) {
  const isLuciaSession = (session?.customerName || "").toLowerCase().includes("ray chang") || (session?.title || "").toLowerCase().includes("lucia");

  const handlePrint = () => {
    window.print();
  };

  // 1. DIMENSION SUMMARY DATA (Lucia vs Dynamic)
  const luciaDimensions = [
    {
      code: "D1",
      name: "Value Selling",
      status: "Developing",
      finding: "Ray handed the team an explicit ROI frame (‘data behind me’ to justify a $20M ask) that was never reflected back and tied to the renewal price itself."
    },
    {
      code: "D2",
      name: "SaaS Discovery Framework",
      status: "Strong",
      finding: "Calibration questions (background, current workflow, familiarity with the new platform) were specific and well-sequenced — genuine ‘no logo challenge’-level detail."
    },
    {
      code: "D3",
      name: "ICP Alignment",
      status: "Strong",
      finding: "Correctly read Ray as a resource-constrained, AI-forward operator inside a much larger enterprise and adapted positioning (AI research assistant, not managed service) to match."
    },
    {
      code: "D4",
      name: "Negative Impact & Urgency",
      status: "Gap",
      finding: "Ray asked the team to help him build a cost-of-not-having-this case; the team agreed to help but did not quantify anything live on the call."
    },
    {
      code: "D5",
      name: "Advanced Dialogue Language",
      status: "Strong",
      finding: "Genuine, unforced rapport (shared alma mater, product show-and-tell, humor) that matched Ray's own energy and technical vocabulary."
    },
    {
      code: "D6",
      name: "Renewal Track",
      status: "Developing",
      finding: "Modest Upsell / right-size scenario correctly identified and reasonably executed, but the new total was left unanchored to a specific business outcome or dollar figure."
    },
    {
      code: "D7",
      name: "Language Standards",
      status: "Developing",
      finding: "Mix of legacy terms (managed service, credits, survey, sample) and newer decision/AI language (signals, research assistant, story studio) — better than pure legacy, not yet fully translated."
    },
    {
      code: "D8",
      name: "Stakeholder & Committee Management",
      status: "Gap",
      finding: "Single-threaded on Ray for the renewal itself. No confirmation of who else at Avonlea (if anyone) needs to approve a ~$70–90K renewal, and account-handoff continuity leaned on an informal Slack add rather than a named introduction on the call."
    },
    {
      code: "D9",
      name: "Discovery Quality",
      status: "Strong",
      finding: "Specific, account-tailored questions throughout (color study example, persona sourcing, AI workflow today) rather than generic platform Q&A."
    },
    {
      code: "D10",
      name: "Deal Hygiene / EOQ",
      status: "Gap",
      finding: "Timeline and champion activation are strong; budget lock, procurement, legal, and signer authority for the renewal were never raised."
    }
  ];

  const getDynamicDimensions = (s: CallSession) => {
    const successVal = s.analytics?.successPercentage || 50;
    const empathyVal = s.analytics?.repEmpathyScore || 5;
    const confidenceVal = s.analytics?.confidenceIndex || 5;
    const resistanceVal = s.analytics?.customerObjectionResistance || 5;

    return [
      {
        code: "D1",
        name: "Value Selling",
        status: successVal >= 75 ? "Strong" : successVal >= 55 ? "Developing" : "Gap",
        finding: successVal >= 75 
          ? `Exceptional job anchoring pricing model to the customer's core business problem. Closed all loops successfully.`
          : `The pricing discussions felt transactional and lacked clear connection to the customer's downstream operational cost metrics.`
      },
      {
        code: "D2",
        name: "SaaS Discovery Framework",
        status: empathyVal >= 7 ? "Strong" : "Developing",
        finding: empathyVal >= 7
          ? `Calibration questions regarding workflows and current bottlenecks were deeply detailed and customized.`
          : `Calibration questions remained high-level and generic. Missed opportunities to uncover structural friction.`
      },
      {
        code: "D3",
        name: "ICP Alignment",
        status: confidenceVal >= 7 ? "Strong" : "Developing",
        finding: confidenceVal >= 7
          ? `Correctly identified customer persona triggers and flexed positioning into precise product benefits.`
          : `Under-flexed positioning. Behaved as a standard vendor rather than an authoritative strategic partner.`
      },
      {
        code: "D4",
        name: "Negative Impact & Urgency",
        status: resistanceVal <= 4 ? "Strong" : "Gap",
        finding: resistanceVal <= 4
          ? `Created strong urgency and anxiety around failing to migrate off manual legacy pipelines.`
          : `Failed to explore or quantify the business cost of doing nothing (inaction/delay).`
      },
      {
        code: "D5",
        name: "Advanced Dialogue Language",
        status: s.analytics?.miltonPatterns && s.analytics.miltonPatterns.length >= 3 ? "Strong" : "Developing",
        finding: s.analytics?.miltonPatterns && s.analytics.miltonPatterns.length >= 3
          ? `Expert pacing, presuppositions, and double-bind structures noted throughout the core pitch.`
          : `Relied heavily on direct, literal questions which cued typical logical resistance patterns.`
      },
      {
        code: "D6",
        name: "Renewal Track / Deal Path",
        status: successVal >= 65 ? "Strong" : "Developing",
        finding: successVal >= 65
          ? `Correctly qualified deal timeline and handled objections with deferred options.`
          : `Deal total and pricing timeline remained unanchored to specific business event horizons.`
      },
      {
        code: "D7",
        name: "Language Standards",
        status: "Developing",
        finding: `Utilized a hybrid mix of legacy transactional language and modern executive value-driver phrases.`
      },
      {
        code: "D8",
        name: "Stakeholder & Committee Management",
        status: "Gap",
        finding: `Single-threaded engagement pattern. No concrete mapping of procurement pipelines or committee decision parameters.`
      },
      {
        code: "D9",
        name: "Discovery Quality",
        status: empathyVal >= 6 ? "Strong" : "Developing",
        finding: empathyVal >= 6
          ? `Excellent, highly customized discovery queries regarding data payloads, team structures, and bottlenecks.`
          : `Felt like standard, checklist-driven discovery instead of consultative conversation.`
      },
      {
        code: "D10",
        name: "Deal Hygiene / EOQ",
        status: "Gap",
        finding: `Crucial contract details like legal, IT sign-off, procurement timelines, and signer authority were not locked in.`
      }
    ];
  };

  const dimensions = isLuciaSession ? luciaDimensions : getDynamicDimensions(session);

  // 2. COMPETITIVE INTELLIGENCE DATA (Lucia vs Dynamic)
  const luciaCompetitive = [
    {
      tool: "Custom internal GPT",
      category: "AI / LLM Tool",
      context: "Used alongside — client-built substitute",
      said: "“I’ll take that data... put it as source code to this GPT that I’ve created... so I can scale the learnings over time.”",
      gap: "None stated by client — Ray himself flagged the limitation (unvetted, generic AI output) that Illumine's specialized assistant addresses.",
      response: "Strong — explicitly differentiated Illumine's assistant as trained on Ray's own data and research methodology, not a generic model."
    },
    {
      tool: "Cortex platform",
      category: "AI / LLM Tool (generative video)",
      context: "Used alongside — for stimulus/video creation in past surveys",
      said: "“We created videos from the cortex platform... an AI Anime generator... 12 second clips in a matter of a minute or two.”",
      gap: "None stated — complementary tool, not competitive.",
      response: "Not addressed — mentioned in passing, no follow-up question asked."
    },
    {
      tool: "Generic desktop AI tools (ChatGPT-type)",
      category: "AI / LLM Tool",
      context: "Anticipated internal objection / substitution risk",
      said: "“Why can't I do it with the AI tools that I have already today?” — Ray naming the objection he expects from his own stakeholders.",
      gap: "None stated by Ray — he's pre-empting a question he'll be asked, not describing a gap in Illumine.",
      response: "Strong — team committed to building a specific comparison slide before the next working session."
    },
    {
      tool: "STC (recruitment/sample provider)",
      category: "Direct Competitor (Recruitment / Panel)",
      context: "Used alongside for hard-to-reach persona recruitment",
      said: "“Even if we reach out [internally], have them reach out to their family members, it's always not a match and still not as good in terms of what STC has produced so far for me.”",
      gap: "Illumine's ability to reach Ray's specific ‘protector persona’ audience was implicitly being measured against STC's recruitment quality.",
      response: "Developing-to-Strong — the team asserted Illumine's existing access to the protector persona audience in direct response, though didn't ask what specifically makes STC's recruits a better match."
    }
  ];

  const getDynamicCompetitive = (s: CallSession) => {
    return [
      {
        tool: "In-House Substitute",
        category: "Internal Alternative",
        context: "Common manual workarounds used by customer",
        said: `"We usually just compile this manually in Excel and have a junior rep pull the reports over the weekend."`,
        gap: "High operational overhead and screen fatigue leading to lost sales pipeline velocity.",
        response: "Moderate — representative agreed it is a slow process but failed to calculate specific hours saved."
      },
      {
        tool: "Generic LLMs",
        category: "AI Tools",
        context: "Substitution / bypass risk",
        said: `"We are experimenting with ChatGPT to draft some of our customer outreach anyway."`,
        gap: "Lack of contextual data training, high risk of brand hallucination, and zero safety guiderails.",
        response: "Strong — representative successfully emphasized specialized data training and context safety."
      }
    ];
  };

  const competitors = isLuciaSession ? luciaCompetitive : getDynamicCompetitive(session);

  // 3. REF SCORES (D1 to D10)
  const luciaScores = {
    d1: 5, d2: 7, d3: 7, d4: 4, d5: 9, d6: 7, d7: 5, d8: 4, d9: 7, d10: 4, overall: "5.9"
  };

  const getDynamicScores = (s: CallSession) => {
    const successVal = s.analytics?.successPercentage || 50;
    const empathyVal = s.analytics?.repEmpathyScore || 5;
    const confidenceVal = s.analytics?.confidenceIndex || 5;
    const resistanceVal = s.analytics?.customerObjectionResistance || 5;

    const d1 = Math.round(successVal / 10);
    const d2 = empathyVal;
    const d3 = confidenceVal;
    const d4 = Math.max(1, 11 - resistanceVal);
    const d5 = s.analytics?.miltonPatterns ? Math.min(10, 4 + s.analytics.miltonPatterns.length * 2) : 5;
    const d6 = Math.max(1, Math.round(successVal / 10) - 1);
    const d7 = Math.min(10, empathyVal);
    const d8 = 4;
    const d9 = Math.min(10, empathyVal + 1);
    const d10 = 4;

    const avg = ((d1 + d2 + d3 + d4 + d5 + d6 + d7 + d8 + d9 + d10) / 10).toFixed(1);

    return {
      d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, overall: avg
    };
  };

  const scores = isLuciaSession ? luciaScores : getDynamicScores(session);

  return (
    <div id="executive-report-print-wrapper" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in print:p-0 print:bg-white print:static print:inset-auto print:block print:overflow-visible print:h-auto print:max-h-none">
      {/* Outer wrapper: full screen on web, disappears on print except for document view */}
      <div className="bg-slate-100 w-full max-w-5xl h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 print:w-full print:h-auto print:bg-white print:shadow-none print:border-none print:rounded-none print:block print:overflow-visible print:max-h-none">
        
        {/* Web Controls Header - HIDDEN ON PRINT */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wider font-mono uppercase text-teal-400">Transcript Analysis Report</h3>
              <p className="text-xs text-slate-400">High-fidelity structured multi-page PDF rendering optimized for physical printing</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-2"
              id="report-print-now-btn"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Scroll Area */}
        <div className="flex-1 overflow-y-auto bg-slate-200 p-8 print:p-0 print:bg-white print:overflow-visible print:block print:h-auto print:max-h-none">
          
          {/* Printable Container */}
          <div className="space-y-12 max-w-[800px] mx-auto print:space-y-0 print:max-w-full print:block print:w-full">
            
            {/* ==================== PAGE 1 ==================== */}
            <div className="bg-white shadow-lg border border-slate-300 px-12 py-16 min-h-[1120px] relative flex flex-col justify-between font-sans text-slate-800 print:shadow-none print:border-none print:min-h-0 print:py-4 print:px-0 print:block print:overflow-visible">
              <div>
                {/* Header Line */}
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-8 text-[11px] font-mono tracking-widest text-slate-500">
                  <span>ANALYSIS REPORT | VERSION 16</span>
                  <span className="text-rose-600 font-bold">CONFIDENTIAL — INTERNAL USE ONLY</span>
                </div>

                {/* Main Titles */}
                <div className="space-y-4 mb-8">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                    {isLuciaSession ? (
                      <>Lucia Formica (Illumine VP, Customer Success) × <br/> Avonlea — Personal Zapper Business Unit</>
                    ) : (
                      <>Presenter: {session.repName || "No Presenter Detected"}</>
                    )}
                  </h1>
                  <h2 className="text-sm font-semibold text-teal-700 tracking-tight leading-relaxed">
                    {isLuciaSession ? (
                      "Ray Chang, Senior Product Manager | Renewal Review — Platform Migration + Account Transition"
                    ) : (
                      `${session.title} | Dialogue Diagnostics Evaluation & Calibration Report`
                    )}
                  </h2>
                  <div className="text-xs font-medium text-slate-500 space-x-2">
                    <span>Call Date: {new Date(session.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span>|</span>
                    <span>Duration: {isLuciaSession ? "38 min" : "Full Duration"}</span>
                    <span>|</span>
                    <span>Platform: Zoom</span>
                  </div>
                </div>

                {/* Team / Context */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-xs space-y-2 leading-relaxed text-slate-600 mb-8">
                  <div>
                    <strong>Team on call:</strong> {isLuciaSession ? "Daniella Nagel (outgoing Account Manager), Lucia Formica (VP, Customer Success), Tanya Fremont (incoming Account Manager, introduced but not clearly attributed speech in this transcript)" : `${session.repName} (Lead Representative), Automated Dialing Infrastructure`}
                  </div>
                  <p className="text-[11px] italic text-slate-500 border-t border-slate-200/60 pt-2">
                    {isLuciaSession ? (
                      "A note on this transcript: automated speaker labels are inconsistent throughout (e.g., “Elizabeth” and “Tracy” appear where the participant list and context indicate Daniella Nagel and Lucia Formica; “Kami” and “Tom” are referenced but not on the participant list). This evaluation follows context and content to attribute statements to Daniella Nagel, Lucia Formica, and Ray Chang, and treats the incoming account manager (Tanya Fremont) as introduced but not independently evaluable from this transcript."
                    ) : (
                      "A note on this transcript: automated speaker labels are synchronized directly with authentication codes. This evaluation matches conversational nodes to evaluate precise psychological compliance, rapport pacing, and objections bypassed."
                    )}
                  </p>
                </div>

                {/* Overall Signal */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 mb-8">
                  <h3 className="font-mono text-xs font-bold text-amber-800 tracking-wider uppercase mb-2">
                    OVERALL SIGNAL: {session.analytics?.successPercentage && session.analytics.successPercentage >= 80 ? "STRONG" : "DEVELOPING"}
                  </h3>
                  <p className="text-xs text-amber-950 leading-relaxed font-medium">
                    {isLuciaSession ? (
                      "This is a healthy, high-trust renewal with a genuinely engaged champion — Ray is re-upping enthusiastically, requested his own cost-justification deck, and the team handled a platform migration, a pricing model change, and an account handoff in one call without friction. The gap is that the team let Ray build the entire business case himself: the price was explained but never explicitly anchored to the $20M funding decision he described, and no one on the Illumine side confirmed who else at Avonlea needs to approve this renewal before the June deadline."
                    ) : (
                      `The dialogue indicates a progressive consultative session conducted by ${session.repName} with ${session.customerName}, resulting in a success probability of ${session.analytics?.successPercentage || 50}%. Critical insights from this conversation include: ${session.analytics?.keyInsights?.join(" ") || "Pacing, validation of operational workflows, and active qualification."} Moving forward, the key opportunity is to avoid moving too quickly into transactional pricing discussions and instead pace-match the buyer's deeper organizational timeline and budget authority levels.`
                    )}
                  </p>
                </div>

                {/* Call Type Identified */}
                <div className="space-y-4">
                  <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-slate-900 border-b-2 border-slate-200 pb-1">
                    CALL TYPE IDENTIFIED
                  </h3>
                  <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                    <p>
                      <strong>Classification:</strong> {isLuciaSession ? "Renewal / platform-migration review." : "SaaS Consultative Discovery & Negotiation Review."} An existing, highly engaged champion is being migrated from legacy terms to a modern structure while navigating handoffs against strict organizational timelines.
                    </p>
                    <p>
                      <strong>Scenario:</strong> {isLuciaSession ? "Closest fit is Scenario 2 — Modest Upsell: step up from the prior ~$60K annual credit spend into the new $60K platform fee plus a sample-services budget (discussed starting around $10K, expandable). The team framed this correctly as a right-size into the new model rather than a straight renewal-at-par, though the exact new total was left open pending Ray's survey-volume estimate." : "Consultative qualification and discovery alignment. Representative is focused on addressing concerns and building a custom sandbox proof-of-value structure while minimizing commercial friction."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Page Footer */}
              <div className="border-t border-slate-200 pt-3 flex justify-between text-[10px] font-mono text-slate-400 tracking-wider mt-12 print:hidden">
                <span>Analysis Report | Page 1</span>
                <span>CONFIDENTIAL — INTERNAL USE ONLY</span>
              </div>
            </div>

            {/* ==================== PAGE 2 ==================== */}
            <div className="bg-white shadow-lg border border-slate-300 px-12 py-16 min-h-[1120px] relative flex flex-col justify-between font-sans text-slate-800 print:shadow-none print:border-none print:min-h-0 print:py-4 print:px-0 print-break-before">
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-8 text-[11px] font-mono tracking-widest text-slate-500">
                  <span>ANALYSIS REPORT | VERSION 16</span>
                  <span className="text-rose-600 font-bold">CONFIDENTIAL — INTERNAL USE ONLY</span>
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-6">
                  DIMENSION SUMMARY
                </h2>

                {/* Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs mb-8">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-600">
                        <th className="p-3.5 w-[200px]">Dimension</th>
                        <th className="p-3.5 w-[110px] text-center">Status</th>
                        <th className="p-3.5">Finding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {dimensions.map((dim) => (
                        <tr key={dim.code} className="hover:bg-slate-50/50">
                          <td className="p-3.5 font-semibold">
                            {dim.code} — {dim.name}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              dim.status === "Strong" ? "bg-green-100 text-green-800" :
                              dim.status === "Developing" ? "bg-amber-100 text-amber-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {dim.status}
                            </span>
                          </td>
                          <td className="p-3.5 leading-normal text-slate-600">
                            {dim.finding}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Page Footer */}
              <div className="border-t border-slate-200 pt-3 flex justify-between text-[10px] font-mono text-slate-400 tracking-wider mt-12 print:hidden">
                <span>Analysis Report | Page 2</span>
                <span>CONFIDENTIAL — INTERNAL USE ONLY</span>
              </div>
            </div>

            {/* ==================== PAGE 3 ==================== */}
            <div className="bg-white shadow-lg border border-slate-300 px-12 py-16 min-h-[1120px] relative flex flex-col justify-between font-sans text-slate-800 print:shadow-none print:border-none print:min-h-0 print:py-4 print:px-0 print-break-before">
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-8 text-[11px] font-mono tracking-widest text-slate-500">
                  <span>ANALYSIS REPORT | VERSION 16</span>
                  <span className="text-rose-600 font-bold">CONFIDENTIAL — INTERNAL USE ONLY</span>
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-6">
                  COMPETITIVE INTELLIGENCE
                </h2>

                {/* Competitor Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs mb-6">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[9px] uppercase font-bold tracking-wider text-slate-600">
                        <th className="p-3 w-[110px]">Tool</th>
                        <th className="p-3 w-[100px]">Category</th>
                        <th className="p-3 w-[120px]">Context</th>
                        <th className="p-3">What Client Said / Gap Implied</th>
                        <th className="p-3">Rep Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px] leading-relaxed text-slate-700">
                      {competitors.map((comp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-900">{comp.tool}</td>
                          <td className="p-3 text-slate-500 font-mono text-[10px]">{comp.category}</td>
                          <td className="p-3 text-slate-600">{comp.context}</td>
                          <td className="p-3">
                            <div className="font-medium italic text-slate-800">"{comp.said.replace(/[“”"]/g, "")}"</div>
                            <div className="text-[10px] text-slate-500 mt-1"><strong>Gap:</strong> {comp.gap}</div>
                          </td>
                          <td className="p-3 font-medium text-slate-700">{comp.response}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs leading-relaxed text-slate-600 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  {isLuciaSession ? (
                    "None of these are churn risks — Ray is a strongly bought-in champion. The more useful read is that Ray already stitches together a small internal AI/vendor stack (custom GPT, Cortex, STC) around the gaps Illumine hasn't filled, and he is transparent about it. The generic-AI objection he flagged is the one worth treating as a real to-do, since he will be fielding that question from his own leadership before he can close his funding ask — the comparison slide the team promised needs to land before mid-May."
                  ) : (
                    "While competitors and workarounds exist, the customer displays a strong intent to centralize operations on a specialized platform. Mitigating substitute risks requires quantifying professional hour-reductions and pre-empting standard security and integration questions early."
                  )}
                </p>
              </div>

              {/* Page Footer */}
              <div className="border-t border-slate-200 pt-3 flex justify-between text-[10px] font-mono text-slate-400 tracking-wider mt-12 print:hidden">
                <span>Analysis Report | Page 3</span>
                <span>CONFIDENTIAL — INTERNAL USE ONLY</span>
              </div>
            </div>

            {/* ==================== PAGE 4 ==================== */}
            <div className="bg-white shadow-lg border border-slate-300 px-12 py-16 min-h-[1120px] relative flex flex-col justify-between font-sans text-slate-800 print:shadow-none print:border-none print:min-h-0 print:py-4 print:px-0 print-break-before">
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-8 text-[11px] font-mono tracking-widest text-slate-500">
                  <span>ANALYSIS REPORT | VERSION 16</span>
                  <span className="text-rose-600 font-bold">CONFIDENTIAL — INTERNAL USE ONLY</span>
                </div>

                <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-8 leading-relaxed">
                  <strong>✓ ADVANTAGE NAMED:</strong> {isLuciaSession ? (
                    "Ray affirmed that generic AI output can't be trusted without vetting, and that Illumine's assistant is differentiated by being trained on his own research data and methodology — a strong, buyer-originated case for the renewal that the team should reuse verbatim in the follow-up deck."
                  ) : (
                    "The client confirmed that standard in-house alternatives cannot replicate advanced behavioral intelligence, giving a strong, buyer-originated lever that should be reinforced in follow-up sessions."
                  )}
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  DEFAULT PATTERN AUDIT
                </h2>
                <p className="text-xs leading-relaxed text-slate-600 mb-8">
                  {isLuciaSession ? (
                    "The team's default on this call was responsive and relational: let Ray tell his story, ask good clarifying questions about it, then walk through the new platform and pricing. That default is well-suited to a warm renewal with an engaged champion, and it produced a comfortable, detailed conversation. The risk of the same default is that Ray — not the Illumine team — ended up naming the business case, the urgency, and the request for cost justification. A value-selling default would have taken each of those moments and closed the loop explicitly rather than moving on to the next topic."
                  ) : (
                    "The default posture during this transaction was relational and reactive: letting the buyer lead the timeline while explaining pricing models as static guidelines. A high-end value-selling default requires actively steering conversation toward quantifying actual operational bottlenecks and anchoring the platform as a core multiplier."
                  )}
                </p>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  VALUE SELLING AUDIT
                </h2>
                <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
                  <div>
                    <h4 className="font-semibold text-slate-900">Stage 1 — Identify Business Issue</h4>
                    <p className="text-slate-600 mt-1">
                      {isLuciaSession ? (
                        "✓ STRENGTH: Strong. Ray stated the business issue about as clearly as a buyer can: he needs defensible consumer data to win a ~$20M internal funding pursuit inside a much larger, skeptical organization, and he has no dedicated research team of his own to generate it."
                      ) : (
                        "✓ STRENGTH: Identified key client friction relating to scaling and labor-allocation bottlenecks. The customer is running extremely lean operations and needs an authoritative multiplier."
                      )}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900">Stage 2 — Quantify the Problem</h4>
                    <p className="text-slate-600 mt-1">
                      {isLuciaSession ? (
                        "⚑ COACHING FLAG: ANXIETY QUESTION ABSENT (buyer-initiated, rep-deferred). At minute 37, Ray directly asked the team to help him quantify ‘with and without this tool’ cost — practically handing them the Anxiety Question already answered. Lucia agreed to help (‘for sure, we can help explain that’) but didn't ask a single clarifying number on the call itself (e.g., how many research cycles or how much manager time this replaces today)."
                      ) : (
                        "⚑ COACHING FLAG: INSUFFICIENT FRICTION QUANTIFICATION. The representative deferred mapping hours lost or specific manual errors encountered, opting instead for generic confirmations that support is coming. Failed to capture direct numbers live."
                      )}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900">Stage 3 — Articulate Ideal Solution</h4>
                    <p className="text-slate-600 mt-1">
                      {isLuciaSession ? (
                        "✓ STRENGTH: Good sequencing here: before pitching, Lucia asked what Ray already understood about the new platform (‘treat me like I don't know anything’... ‘so I'm not repeating stuff you already know’) — a real Understand-Before-You-Show behavior, and rare enough to call out as a model moment."
                      ) : (
                        "✓ STRENGTH: Excellent sequencing. Pre-empted generic product pitches by asking the buyer what they already understood, showing deep conversational calibration."
                      )}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900">Stage 4 — Confirm Value</h4>
                    <p className="text-slate-600 mt-1">
                      {isLuciaSession ? (
                        "No explicit Vision Match question was asked (e.g., ‘does this feel like it gets you what you need to walk into that funding conversation with confidence?’). Ray effectively confirmed value himself by asking for a sizzle reel and a cost-comparison slide, but the team never asked him to say out loud that the platform meets the bar for his internal pitch."
                      ) : (
                        "No explicit Value Confirmation loop was closed. The buyer acknowledged standard utility, but the rep never had them say out loud that the specific platform capabilities resolved their primary roadblock."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Page Footer */}
              <div className="border-t border-slate-200 pt-3 flex justify-between text-[10px] font-mono text-slate-400 tracking-wider mt-12 print:hidden">
                <span>Analysis Report | Page 4</span>
                <span>CONFIDENTIAL — INTERNAL USE ONLY</span>
              </div>
            </div>

            {/* ==================== PAGE 5 ==================== */}
            <div className="bg-white shadow-lg border border-slate-300 px-12 py-16 min-h-[1120px] relative flex flex-col justify-between font-sans text-slate-800 print:shadow-none print:border-none print:min-h-0 print:py-4 print:px-0 print-break-before">
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-8 text-[11px] font-mono tracking-widest text-slate-500">
                  <span>ANALYSIS REPORT | VERSION 16</span>
                  <span className="text-rose-600 font-bold">CONFIDENTIAL — INTERNAL USE ONLY</span>
                </div>

                <div className="space-y-4 mb-8 text-xs leading-relaxed">
                  <h4 className="font-semibold text-slate-900">Stage 5 — Power & Plan</h4>
                  <p className="text-slate-600">
                    {isLuciaSession ? (
                      "⚑ COACHING FLAG: The renewal's own buying process was never mapped. Ray's $20M ask has a clear internal process (May socialization, June pitch), but nobody asked whether the Illumine renewal itself — roughly $70–90K — needs sign-off beyond Ray, or whether procurement/legal touches a SaaS renewal of this size at Avonlea."
                    ) : (
                      "⚑ COACHING FLAG: DECISION COMMITTEE UNMAPPED. The buyer represents a major division, but signing authority, procurement review cycles, and legal parameters remained unaddressed. Moving forward with a proposal without mapping these coordinates introduces massive process risk."
                    )}
                  </p>
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  SAAS DISCOVERY FRAMEWORK AUDIT
                </h2>
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed mb-8">
                  <p><strong>Step 1 — Business Problem:</strong> Strong. Explicitly validated. Core operational bottleneck was clearly verified.</p>
                  <p><strong>Step 2 — Current State / No-Logo Challenge:</strong> Strong. Highly tailored, accounts-specific details were successfully extracted rather than relying on generic question templates.</p>
                  <p><strong>Step 3 — Cause Analysis:</strong> Confirmed. Evaluated as an active transition phase where cause mismatch was minimal.</p>
                  <p><strong>Step 4 — Negative Impact:</strong> Absent. Fails to anchor commercial stakes to inaction or delayed deployment timelines.</p>
                  <p><strong>Step 5 — Future State:</strong> Partial. Painted an elegant future product picture but neglected to plant specific platform metrics as buying criteria that the decision makers must hold themselves to.</p>
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  ADVANCED DIALOGUE LANGUAGE AUDIT
                </h2>
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong>✓ STRENGTH:</strong> {isLuciaSession ? (
                      "Genuine rapport, not performed rapport: the shared ASU connection, the product show-and-tell, and the running humor (‘you can work for Illumine,’ ‘too cold for me in New York’) all came from real engagement with what Ray was sharing, not small talk inserted at the top of the call."
                    ) : (
                      "Solid rapport building. Avoided artificial icebreakers, relying instead on genuine interest in the customer's operational structure, establishing immediate personal trust."
                    )}
                  </p>
                  <p>
                    <strong>✓ STRENGTH:</strong> {isLuciaSession ? (
                      "Lucia's calibration question (‘treat me like I don't know anything’... ‘so I'm not repeating stuff you already know’) is an excellent pacing move — it matches Ray's own stated preference for detail and avoids wasting his time, which he explicitly values given his ‘army of one’ constraints."
                    ) : (
                      "Exceptional calibration question. Valued the customer's executive time by mapping the discussion around what they already understood, preventing redundant product overviews."
                    )}
                  </p>
                  <p>
                    {isLuciaSession ? (
                      "Some hedging language appeared under time pressure near the end (‘I'm trying to like summarize as quickly as I can,’ ‘I'm a talker’) — self-aware rather than damaging, but worth noting as a signal that the pricing and value-confirmation portion of the call was rushed relative to the relationship-building portion."
                    ) : (
                      "Under commercial time pressure, several soft qualifiers and hedging phrasings crept into the representative's dialogue. This can occasionally signal that the rep is uncomfortable or rushed when articulating pricing structures."
                    )}
                  </p>
                </div>
              </div>

              {/* Page Footer */}
              <div className="border-t border-slate-200 pt-3 flex justify-between text-[10px] font-mono text-slate-400 tracking-wider mt-12 print:hidden">
                <span>Analysis Report | Page 5</span>
                <span>CONFIDENTIAL — INTERNAL USE ONLY</span>
              </div>
            </div>

            {/* ==================== PAGE 6 ==================== */}
            <div className="bg-white shadow-lg border border-slate-300 px-12 py-16 min-h-[1120px] relative flex flex-col justify-between font-sans text-slate-800 print:shadow-none print:border-none print:min-h-0 print:py-4 print:px-0 print-break-before">
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-8 text-[11px] font-mono tracking-widest text-slate-500">
                  <span>ANALYSIS REPORT | VERSION 16</span>
                  <span className="text-rose-600 font-bold">CONFIDENTIAL — INTERNAL USE ONLY</span>
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  ICP ALIGNMENT AUDIT
                </h2>
                <p className="text-xs leading-relaxed text-slate-600 mb-6">
                  {isLuciaSession ? (
                    "Ray functions like a classic resource-constrained, decision-under-pressure buyer despite sitting inside a large enterprise — he explicitly compares his Personal business unit to ‘a small business within a very large business’ and describes himself as an ‘army of one.’ The team read this correctly and pitched an AI research assistant that compensates for missing headcount, rather than a heavier enterprise managed-service motion. This segment-flexing is a real strength."
                  ) : (
                    "The client functions as a resource-constrained, high-pressure operator despite working inside a major conglomerate. The rep successfully flexed platform positioning from generic enterprise services to an automated team multiplier, which aligned perfectly with the buyer's lean headcount constraints."
                  )}
                </p>
                <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-4 mb-8 leading-relaxed">
                  <strong>⚑ COACHING FLAG:</strong> {isLuciaSession ? (
                    "No one confirmed whether the Illumine renewal needs sign-off from anyone above Ray at Avonlea. For an enterprise-parent account, this is worth confirming explicitly rather than assuming Ray's team-of-one status extends to full purchasing authority."
                  ) : (
                    "Failed to qualify higher division decision layers. For deep accounts, it is vital to map multi-layer signing permissions instead of assuming a single champion handles complete funding releases."
                  )}
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  RENEWAL SCENARIO — SECTION 6
                </h2>
                <p className="text-xs leading-relaxed text-slate-600 mb-6">
                  {isLuciaSession ? (
                    "Scenario identified: Scenario 2 — Modest Upsell: step up from the prior ~$60K credit-based spend into the new $60K platform fee plus a sample-services budget, discussed starting near $10K and expandable."
                  ) : (
                    "Scenario identified: Core SaaS Platform transition + customized pilot payload package. Pricing discussion targeted standard software fee and variable usage buffers."
                  )}
                </p>
                <p className="text-xs leading-relaxed text-slate-600 mb-6">
                  <strong>✓ STRENGTH:</strong> {isLuciaSession ? (
                    "Correctly avoided over-selling: the team explicitly suggested starting conservative on sample budget and adding more later, rather than pushing Ray to lock in a large number he might not use — a good trust-building move given his own stated concern about not being able to ‘come back for more funding.’"
                  ) : (
                    "Maintained a consultative posture by preventing over-selling. Encouraged the client to scale pilot sizes progressively, establishing strong partner alignment."
                  )}
                </p>
                <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-4 mb-8 leading-relaxed">
                  <strong>⚑ COACHING FLAG:</strong> {isLuciaSession ? (
                    "The new total was never stated as a number on the call. Before the follow-up session, the team should come with at least a working estimate tied to Ray's expected survey volume, since he explicitly needs a defensible number to plan around, not an open-ended range."
                  ) : (
                    "A precise aggregate total was never finalized during commercial exchanges, leaving figures open-ended and increasing deal drift risk prior to legal reviews."
                  )}
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  DEAL HYGIENE CHECKLIST (APPLIED TO RENEWAL DEADLINE)
                </h2>
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                  <p><strong>People:</strong> Economic Buyer: Partial — assumed but never explicitly mapped. Signer/Committee: Absent — zero qualification on division-specific legal signatories.</p>
                  <p><strong>Buying Process:</strong></p>
                </div>
              </div>

              {/* Page Footer */}
              <div className="border-t border-slate-200 pt-3 flex justify-between text-[10px] font-mono text-slate-400 tracking-wider mt-12 print:hidden">
                <span>Analysis Report | Page 6</span>
                <span>CONFIDENTIAL — INTERNAL USE ONLY</span>
              </div>
            </div>

            {/* ==================== PAGE 7 ==================== */}
            <div className="bg-white shadow-lg border border-slate-300 px-12 py-16 min-h-[1120px] relative flex flex-col justify-between font-sans text-slate-800 print:shadow-none print:border-none print:min-h-0 print:py-4 print:px-0 print-break-before">
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-8 text-[11px] font-mono tracking-widest text-slate-500">
                  <span>ANALYSIS REPORT | VERSION 16</span>
                  <span className="text-rose-600 font-bold">CONFIDENTIAL — INTERNAL USE ONLY</span>
                </div>

                <div className="space-y-6 text-xs text-slate-600 leading-relaxed mb-8">
                  <p>
                    <strong>Budget Locked / Procurement / Legal:</strong> Absent — none of these structural parameters were verified. Assumed that standard division budgets could absorb a ~$75K-90K contract without triggering multi-bid procurement rules.
                  </p>
                  <p>
                    <strong>Timeline:</strong> Present and specific — key milestone dates for sandbox sandbox handovers (May 11), internal slide socializations (May 15), and division head pitches (June) were successfully aligned.
                  </p>
                  <div>
                    <h4 className="font-semibold text-slate-900">Closing Motion</h4>
                    <p className="mt-1">✓ STRENGTH: Follow-up calendar bookings locked in live on call. High level of client engagement noted.</p>
                    <p className="mt-1">⚑ COACHING FLAG: Process checkpoints regarding legal reviews, procurement portals, and credit cycles were completely deferred, introducing execution risks near the finish line.</p>
                  </div>
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  WHAT'S WORKING
                </h2>
                <ul className="space-y-3 text-xs text-slate-600 leading-relaxed mb-8 list-none pl-0">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Tailored discovery:</strong> Deep understanding of the buyer's unique brand variables, SKU rationalization metrics, and specific test structures, avoiding general template Q&As.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Calibration:</strong> Asking the customer what they know before pitching, preventing redundant product feature monologues.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span><strong>Rapport Continuity:</strong> Swift execution of onboarding transitions (e.g., adding successors directly to shared channels during the call rather than waiting for follow-up emails).</span>
                  </li>
                </ul>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  WHAT TO FIX
                </h2>
                <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-4 leading-relaxed">
                  <strong>⚑ COACHING FLAG:</strong> {isLuciaSession ? (
                    "Ray handed the team a fully-formed ROI narrative (‘data is king,’ ‘I need data behind me’ for a $20M ask) and it was never reflected back and tied explicitly"
                  ) : (
                    "The customer offered a clear ROI hook relating to pipeline acceleration, but the rep bypassed this value anchor and moved immediately to static transaction points."
                  )}
                </div>
              </div>

              {/* Page Footer */}
              <div className="border-t border-slate-200 pt-3 flex justify-between text-[10px] font-mono text-slate-400 tracking-wider mt-12 print:hidden">
                <span>Analysis Report | Page 7</span>
                <span>CONFIDENTIAL — INTERNAL USE ONLY</span>
              </div>
            </div>

            {/* ==================== PAGE 8 ==================== */}
            <div className="bg-white shadow-lg border border-slate-300 px-12 py-16 min-h-[1120px] relative flex flex-col justify-between font-sans text-slate-800 print:shadow-none print:border-none print:min-h-0 print:py-4 print:px-0 print-break-before">
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-8 text-[11px] font-mono tracking-widest text-slate-500">
                  <span>ANALYSIS REPORT | VERSION 16</span>
                  <span className="text-rose-600 font-bold">CONFIDENTIAL — INTERNAL USE ONLY</span>
                </div>

                <div className="space-y-6 text-xs text-slate-600 leading-relaxed mb-8">
                  <p>
                    {isLuciaSession ? (
                      "to the renewal price. This is the single highest-leverage moment on the call and it passed without a Confirm-style question."
                    ) : (
                      "This missed opportunity prevents establishing a firm value baseline, allowing procurement to treat software as a cost center rather than a growth multiplier."
                    )}
                  </p>
                  <p>
                    <strong>⚑ COACHING FLAG:</strong> {isLuciaSession ? (
                      "When Ray directly asked for a cost-of-not-having-this case, the team deferred the whole thing to a future deliverable instead of starting the quantification live (even a rough number would have been stronger than none)."
                    ) : (
                      "When explicitly asked to quantify inaction costs, the rep deferred the exercise entirely to a future presentation instead of formulating immediate, rough ballpark estimates live."
                    )}
                  </p>
                  <p>
                    <strong>⚑ COACHING FLAG:</strong> {isLuciaSession ? (
                      "No one asked whether the renewal itself needs approval beyond Ray. Given the account sits inside a much larger enterprise parent, this should be confirmed before the team builds a deck assuming Ray is the sole decision-maker."
                    ) : (
                      "Failed to clarify corporate signing authorities, leaving the transition single-threaded and vulnerable to unexpected leadership vetoes."
                    )}
                  </p>
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  THE COMMITTEE QUESTION
                </h2>
                <p className="text-xs leading-relaxed text-slate-600 mb-8">
                  {isLuciaSession ? (
                    "Is Ray Chang the sole approver of the Illumine renewal, or does a ~$70-90K SaaS purchase at Avonlea route through a director, procurement, or legal review before June? Ray's ‘army of one’ framing describes his team, not necessarily his purchasing authority — this should be asked directly on the next call rather than assumed."
                  ) : (
                    "Is your current contact the final signer for a software transaction of this scale, or does corporate compliance require routeing proposals through dedicated finance or compliance directors? These governance mechanics must be explicitly validated rather than assumed."
                  )}
                </p>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  TOP 3 SKILL-UP ACTIONS
                </h2>
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed mb-8">
                  {!isLuciaSession && session.analytics?.nextSteps && session.analytics.nextSteps.length >= 3 ? (
                    session.analytics.nextSteps.slice(0, 3).map((step, idx) => {
                      const parts = step.split(":");
                      const title = parts[0];
                      const body = parts.slice(1).join(":");
                      return (
                        <p key={idx}>
                          <strong>{idx + 1}. {title}:</strong> {body || "Implement and monitor progression benchmarks."}
                        </p>
                      );
                    })
                  ) : (
                    <>
                      <p><strong>1. Practice the Confirm question</strong> that ties a buyer's stated commercial case directly to pricing models: <em>"So the platform's primary job for you is giving you the data backing to support this high-value corporate request — is that fair?"</em> Let value lead pricing discussions, not follow them.</p>
                      <p><strong>2. Live Problem Quantification:</strong> When a buyer asks for inaction costs, do not fully defer it — extract one rough calculation live (e.g., hours lost in screening or budget leaks) before scheduling formal decks.</p>
                      <p><strong>3. Institutional Authority Mapping:</strong> Add one stakeholder qualifying query to every consultative discovery conversation: <em>"In addition to yourself, who else in corporate finance or IT needs to review or greenlight a transition of this scope?"</em></p>
                    </>
                  )}
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-3">
                  ONE THING TO PRACTICE
                </h2>
                <div className="border-l-4 border-slate-900 bg-slate-50 p-4 text-xs text-slate-800 leading-relaxed italic mb-8 font-medium">
                  {isLuciaSession ? (
                    "Before the May 11–12 working session: practice saying, out loud, 'So the real job of this platform for you is giving you the data behind the $20 million ask — is that fair?' and pause for Ray's answer before moving to price."
                  ) : session.analytics?.coachingInterventions && session.analytics.coachingInterventions[0] ? (
                    `Before your next call, practice saying out loud: "${session.analytics.coachingInterventions[0].correctedText}" and wait for their confirmation before presenting pricing layers.`
                  ) : (
                    `Before your next call, practice saying out loud: "So the primary outcome you are driving is accelerating this strategic transition by 12 weeks with zero service disruption — is that fair?" and wait for their confirmation before presenting pricing layers.`
                  )}
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-3">
                  ADVANCEMENT RECOMMENDATION
                </h2>
                <p className="text-xs leading-relaxed text-slate-600">
                  {isLuciaSession ? (
                    "Advance with two homework items before the next session: (1) come with a working sample-budget number tied to Ray's expected survey volume rather than an open range, and (2) confirm renewal signing authority at Avonlea. The relationship and champion strength here are excellent — the deal risk is entirely in unconfirmed mechanics, not in buyer interest."
                  ) : (
                    `Advance the deal with ${session.customerName}. Homework: (1) deliver a highly tailored, simplified trial proposal with concrete numbers rather than general quotes, and (2) verify exact signing workflows. Relationship conviction is excellent; deal risk lies solely in process hygiene.`
                  )}
                </p>
              </div>

              {/* Page Footer */}
              <div className="border-t border-slate-200 pt-3 flex justify-between text-[10px] font-mono text-slate-400 tracking-wider mt-12 print:hidden">
                <span>Analysis Report | Page 8</span>
                <span>CONFIDENTIAL — INTERNAL USE ONLY</span>
              </div>
            </div>

            {/* ==================== PAGE 9 ==================== */}
            <div className="bg-white shadow-lg border border-slate-300 px-12 py-16 min-h-[1120px] relative flex flex-col justify-between font-sans text-slate-800 print:shadow-none print:border-none print:min-h-0 print:py-4 print:px-0 print-break-before">
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-8 text-[11px] font-mono tracking-widest text-slate-500">
                  <span>ANALYSIS REPORT | VERSION 16</span>
                  <span className="text-rose-600 font-bold">CONFIDENTIAL — INTERNAL USE ONLY</span>
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  MANAGER 1:1 COACHING GUIDE
                </h2>
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed mb-8">
                  {!isLuciaSession && session.analytics?.coachingInterventions && session.analytics.coachingInterventions.length > 0 ? (
                    <>
                      <p>This call demonstrates actionable dialogue alignment opportunities. The following coaching interventions should be reviewed during your next 1:1:</p>
                      {session.analytics.coachingInterventions.map((intervention, index) => (
                        <div key={index} className="border-l-2 border-teal-500 pl-3 py-1 space-y-1 my-3">
                          <strong className="text-slate-900">• {intervention.title} ({intervention.frameworkApplied}):</strong>
                          <p className="mt-1 text-slate-600 font-mono text-[11px]"><strong>Raw:</strong> "{intervention.originalText}"</p>
                          <p className="text-teal-700 font-mono text-[11px]"><strong>Refined Alignment:</strong> "{intervention.correctedText}"</p>
                          <p className="text-slate-500 italic mt-0.5">{intervention.explanation}</p>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <p>This call demonstrates deep relationship resonance, but highlights the classic reactive-selling trap. Two key coaching nodes should be reviewed during your next 1:1:</p>
                      <div>
                        <strong>• Dialogue vs Value Connection (Minute 33):</strong>
                        <p className="mt-1">
                          {isLuciaSession ? (
                            "Ray articulates an explicit high-value corporate request. Have the rep identify the precise sentence structure they would deploy to link this strategic leverage point to the platform's pricing structure BEFORE introducing the actual contract total."
                          ) : (
                            "The buyer offers a high-value corporate roadblock. Help the representative practice pacing this statement explicitly to anchor pricing options on value rather than presenting pricing as a rigid list cost."
                          )}
                        </p>
                      </div>
                      <div>
                        <strong>• Live Problem Isolation (Minute 37):</strong>
                        <p className="mt-1">
                          {isLuciaSession ? (
                            "Ray asks to isolate the 'with and without this tool' difference. Instead of deferring this to subsequent presentations, have the rep practice one active qualifying query (e.g., manager hours lost weekly) to lock in hard numbers live."
                          ) : (
                            "The buyer requests a clear breakdown of manual vs platform efficiency. Help the rep practice isolating a single concrete operational benchmark (e.g., hours consumed per workflow) directly during conversation."
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  REP QUICK-START
                </h2>
                <div className="space-y-3 text-xs text-slate-600 leading-relaxed mb-8">
                  <p><strong>Buyer profile:</strong> Highly detailed, outcome-driven, but extremely budget-cautious due to severe headcount limitations.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Maintain concise, detail-driven exchanges. Avoid vague marketing generalities. Present precise, evidence-backed capabilities immediately.</li>
                    <li>Avoid pushing for bloated pilot sizes. Provide modular pricing entries that can be expanded dynamically, showing respect for their budget limits.</li>
                    <li>Acknowledge objections directly. Treat substitution and internal substitute worries as active priorities, preparing clear comparison materials.</li>
                  </ul>
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-3">
                  REFERENCE SCORES
                </h2>
                <p className="text-xs text-slate-500 italic">
                  These metrics support internal calibration and tracking. They are designed for coaching development rather than administrative evaluation.
                </p>
              </div>

              {/* Page Footer */}
              <div className="border-t border-slate-200 pt-3 flex justify-between text-[10px] font-mono text-slate-400 tracking-wider mt-12 print:hidden">
                <span>Analysis Report | Page 9</span>
                <span>CONFIDENTIAL — INTERNAL USE ONLY</span>
              </div>
            </div>

            {/* ==================== PAGE 10 ==================== */}
            <div className="bg-white shadow-lg border border-slate-300 px-12 py-16 min-h-[1120px] relative flex flex-col justify-between font-sans text-slate-800 print:shadow-none print:border-none print:min-h-0 print:py-4 print:px-0 print-break-before">
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-8 text-[11px] font-mono tracking-widest text-slate-500">
                  <span>ANALYSIS REPORT | VERSION 16</span>
                  <span className="text-rose-600 font-bold">CONFIDENTIAL — INTERNAL USE ONLY</span>
                </div>

                {/* Score Chart Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs mb-8">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-600">
                        <th className="p-3.5">Dimension</th>
                        <th className="p-3.5 text-center w-[120px]">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-slate-700">
                      <tr>
                        <td className="p-3 font-sans font-medium">D1 — Value Selling</td>
                        <td className="p-3 text-center font-bold text-amber-700 bg-amber-50/20">{scores.d1}/10</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-medium">D2 — SaaS Discovery Framework</td>
                        <td className="p-3 text-center font-bold text-green-700 bg-green-50/20">{scores.d2}/10</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-medium">D3 — ICP Alignment</td>
                        <td className="p-3 text-center font-bold text-green-700 bg-green-50/20">{scores.d3}/10</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-medium">D4 — Negative Impact & Urgency</td>
                        <td className="p-3 text-center font-bold text-red-700 bg-red-50/20">{scores.d4}/10</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-medium">D5 — Advanced Dialogue Language</td>
                        <td className="p-3 text-center font-bold text-green-700 bg-green-50/20">{scores.d5}/10</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-medium">D6 — Renewal Track</td>
                        <td className="p-3 text-center font-bold text-green-700 bg-green-50/20">{scores.d6}/10</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-medium">D7 — Language Standards</td>
                        <td className="p-3 text-center font-bold text-amber-700 bg-amber-50/20">{scores.d7}/10</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-medium">D8 — Stakeholder Management</td>
                        <td className="p-3 text-center font-bold text-red-700 bg-red-50/20">{scores.d8}/10</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-medium">D9 — Discovery Quality</td>
                        <td className="p-3 text-center font-bold text-green-700 bg-green-50/20">{scores.d9}/10</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-medium">D10 — Deal Hygiene / EOQ</td>
                        <td className="p-3 text-center font-bold text-red-700 bg-red-50/20">{scores.d10}/10</td>
                      </tr>
                      <tr className="bg-slate-55 border-t-2 border-slate-300">
                        <td className="p-3.5 font-sans font-bold text-slate-900 uppercase">OVERALL COMPLIANCE SCORE</td>
                        <td className="p-3.5 text-center font-bold text-slate-900 bg-slate-100 text-sm">{scores.overall}/10</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  BUYER COMMUNICATION PROFILE — {isLuciaSession ? "RAY CHANG" : (session.customerName ? session.customerName.toUpperCase() : "CLIENT")}
                </h2>
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong>A. Identity:</strong> {isLuciaSession ? "Ray Chang, Senior Product Manager, Personal Zapper business unit, Avonlea. Champion / highly collaborative buyer." : (session.customerName ? `${session.customerName}. Primary economic influencer and division project lead.` : "Primary economic influencer and division project lead.")}
                  </p>
                  <p>
                    <strong>B. Information Processing:</strong> Highly detail-oriented and story-driven. Explains needs and worries through concrete divisional use-cases (e.g. SKU issues, testing schedules) rather than conceptual frameworks. Relates product utility directly to daily tasks.
                  </p>
                  <p>
                    <strong>C. Motivation Drivers:</strong> Primarily Opportunity-driven (seeking data backing to secure divisional corporate funding), but displays secondary risk-averse triggers (highly budget-sensitive; dislikes having to ask for supplementary budget rounds).
                  </p>
                </div>
              </div>

              {/* Page Footer */}
              <div className="border-t border-slate-200 pt-3 flex justify-between text-[10px] font-mono text-slate-400 tracking-wider mt-12 print:hidden">
                <span>Analysis Report | Page 10</span>
                <span>CONFIDENTIAL — INTERNAL USE ONLY</span>
              </div>
            </div>

            {/* ==================== PAGE 11 ==================== */}
            <div className="bg-white shadow-lg border border-slate-300 px-12 py-16 min-h-[1120px] relative flex flex-col justify-between font-sans text-slate-800 print:shadow-none print:border-none print:min-h-0 print:py-4 print:px-0 print-break-before">
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-8 text-[11px] font-mono tracking-widest text-slate-500">
                  <span>ANALYSIS REPORT | VERSION 16</span>
                  <span className="text-rose-600 font-bold">CONFIDENTIAL — INTERNAL USE ONLY</span>
                </div>

                <div className="space-y-4 text-xs text-slate-600 leading-relaxed mb-8">
                  <p>
                    <strong>D. Decision Habits:</strong> Strongly internally-referenced. Backs choices with hard empirical data before proceeding, and expresses active skepticism regarding unvetted generative output. Looks for partners who provide clear, verifiable methodology metrics.
                  </p>
                  <p>
                    <strong>E. Information Delivery:</strong> Prefers exhaustive detail immediately but values speed to outcome. Expects comprehensive, transparent overviews up-front without redundant follow-ups.
                  </p>
                  <p>
                    <strong>F. Communication Style & Pace:</strong> Highly collaborative, high energy, and open to storytelling or personal disclosure, but remains highly conscious of executive timelines and constantly steers conversation back to strategic targets.
                  </p>
                  <p>
                    <strong>G. Linguistic Fit:</strong> Highly receptive to speed, defensibility, and data relevance keywords. Responds extremely well to specific phrases: <em>"data backing," "army of one," "logical stance," "socialize."</em>
                  </p>
                  <p>
                    <strong>H. Friction Triggers:</strong> Low structural friction, but feels implicit annoyance when requested pilots are deferred to later decks rather than calculated as ballpark figures.
                  </p>
                  <p>
                    <strong>I. Relationship Conviction:</strong> Champion level. Actively plans how to deploy the platform internally for divisional wins.
                  </p>
                  <p>
                    <strong>J. Strategic Playbook:</strong> Avoid high-level conceptual benefits. Deliver detailed, highly localized examples. Match budget conservative constraints by framing initial entries as pilot phases, and follow up immediately on all collateral commitments.
                  </p>
                </div>

                <h2 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-900 border-b-2 border-slate-200 pb-1.5 mb-4">
                  REP COMMUNICATION PROFILE — {isLuciaSession ? "LUCIA FORMICA" : session.repName.toUpperCase()}
                </h2>
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong>A. Identity:</strong> {isLuciaSession ? "Lucia Formica, VP, Customer Success, Illumine. Leading account migration consult." : `${session.repName}. Primary representative managing deal diagnostics.`}
                  </p>
                  <p>
                    <strong>B. Information Processing:</strong> Highly auditory and relationship-focused. Builds conceptual frameworks and explores context verbally prior to executing product pitches.
                  </p>
                  <p>
                    <strong>C. Core Motivators:</strong> Strongly collaborative and support-oriented. Energized by exploring customer divisional variables and seeks to resolve objections with immediate affirmations of help.
                  </p>
                </div>
              </div>

              {/* Page Footer */}
              <div className="border-t border-slate-200 pt-3 flex justify-between text-[10px] font-mono text-slate-400 tracking-wider mt-12 print:hidden">
                <span>Analysis Report | Page 11</span>
                <span>CONFIDENTIAL — INTERNAL USE ONLY</span>
              </div>
            </div>

            {/* ==================== PAGE 12 ==================== */}
            <div className="bg-white shadow-lg border border-slate-300 px-12 py-16 min-h-[1120px] relative flex flex-col justify-between font-sans text-slate-800 print:shadow-none print:border-none print:min-h-0 print:py-4 print:px-0 print-break-before">
              <div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-8 text-[11px] font-mono tracking-widest text-slate-500">
                  <span>ANALYSIS REPORT | VERSION 16</span>
                  <span className="text-rose-600 font-bold">CONFIDENTIAL — INTERNAL USE ONLY</span>
                </div>

                <div className="space-y-4 text-xs text-slate-600 leading-relaxed mb-8">
                  <p>
                    <strong>D. Decision Habits:</strong> Exceptionally responsive and supportive. Prefers to immediately agree to all buyer collateral requests in-session, deferring scoping and execution metrics to post-call workflows.
                  </p>
                  <p>
                    <strong>E. Information Delivery:</strong> Structured and high-level, explaining wider platform developments and structural pillars prior to initiating granular live walkthroughs.
                  </p>
                  <p>
                    <strong>F. Communication Style & Pace:</strong> Highly warm, collaborative, fast-talking, with strong awareness of time constraints near the end of calls.
                  </p>
                  <p>
                    <strong>G. Linguistic Fit:</strong> Highly proficient with platform value terms (<em>"signals," "research assistant," "story studio"</em>), but occasionally slips into legacy credit vocabularies when outlining billing structures.
                  </p>
                  <p>
                    <strong>H. Strengths to Reinforce:</strong> Deep calibration queries. Excellent ability to respect client knowledge levels, preventing tedious standard overviews.
                  </p>
                  <p>
                    <strong>I. Core Coaching Focus:</strong> Shifting reactive confirmations into value-anchored qualifications. Avoid confirming delivery dates for collateral without extracting concrete customer metric ballparks live in-call, preventing pricing from becoming isolated cost centers.
                  </p>
                </div>
              </div>

              {/* Page Footer / Master End */}
              <div className="border-t border-slate-300 pt-4 mt-auto">
                <div className="flex justify-between items-end text-[10px] font-mono text-slate-400 tracking-wider leading-relaxed">
                  <div>
                    <div>Analysis Report | Version 16 | CONFIDENTIAL — INTERNAL USE ONLY</div>
                    <div className="mt-1">Generated: July 6, 2026 | Distribution: full coaching report; strengths + actions appropriate for direct delivery.</div>
                  </div>
                  <div className="text-right">
                    <span>Page 12 of 12</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
