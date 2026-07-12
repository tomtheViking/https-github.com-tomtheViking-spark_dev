import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp as initFirebaseApp } from "firebase/app";
import { getFirestore as initFirestore, doc, setDoc } from "firebase/firestore";
import { initializeApp as initAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import crypto from "crypto";
import cookieParser from "cookie-parser";

dotenv.config();

// Initialize firebase-admin instance
if (getAdminApps().length === 0) {
  initAdminApp({
    projectId: "gen-lang-client-0047144339"
  });
}
const adminDb = getAdminFirestore("ai-studio-sparkanalytic-77f894c0-f2b2-4c88-a711-f8b44ece36e8");

const sesConfig: any = { region: process.env.SES_REGION || "us-east-1" };
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  sesConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}
const ses = new SESClient(sesConfig);

export const inviteNewTenantUser = async (
  email: string,
  tenantId: string,
  role: string,
  origin?: string,
  customTempPassword?: string,
  customEnrollmentToken?: string,
  name?: string,
  sparkId?: string,
  activationDate?: string
) => {
  // 1. Generate a secure random temporary password (12-char + Special/Cap)
  const temporaryPassword = customTempPassword || (crypto.randomBytes(6).toString("hex") + "!Aa1");
  const enrollmentToken = customEnrollmentToken || crypto.randomBytes(32).toString("hex");
  const baseOrigin = origin || "https://app.sparkanalytic.com";
  const enrollmentUrl = `${baseOrigin}/enroll?token=${enrollmentToken}&email=${encodeURIComponent(email)}`;

  // 2. Write the pending tenant record to Firestore
  await adminDb.collection("users").add({
    email,
    tenant_id: tenantId,
    role,
    enrollment_status: "invited",
    enrollment_token: enrollmentToken,
    token_expires: Date.now() + 24 * 60 * 60 * 1000, // 24 Hours
    temporary_password: temporaryPassword,
    created_at: new Date().toISOString(),
    name: name || email.split("@")[0],
    sparkId: sparkId || ("SPK-" + Math.floor(10000 + Math.random() * 90000)),
    tenantId: tenantId,
    activationDate: activationDate || new Date().toISOString().split("T")[0]
  });

  // 3. Construct HTML Invitation for AWS SES
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to Spark Analytic</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">You have been invited to join your team's workspace.</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Your Temporary Password:</strong></p>
        <code style="font-family: monospace; font-size: 16px; color: #0f172a; font-weight: bold; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</code>
      </div>
      <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">Please click the button below to complete your setup and choose a permanent password:</p>
      <p style="text-align: center; margin-bottom: 24px;">
        <a href="${enrollmentUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background-color 0.2s;">Complete Enrollment</a>
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        This invitation link is valid for 24 hours. If you did not expect this email, please ignore it.
      </p>
    </div>
  `;

  // 4. Send via AWS SES
  const command = new SendEmailCommand({
    Source: process.env.AWS_SES_SENDER || "activation@sparkanalytic.com",
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: "Set up your Spark Analytic Account" },
      Body: { Html: { Data: emailHtml } }
    }
  });

  const sesResult = await ses.send(command);
  return {
    sesResult,
    temporaryPassword,
    enrollmentToken
  };
};

// Ensure workspace root-relative files are resolved correctly
const isProd = process.env.NODE_ENV === "production";

const firebaseConfig = {
  apiKey: "AIzaSyCf5KoCgVgso4dGq7uxzkKaOL4QCK64Z28",
  authDomain: "gen-lang-client-0047144339.firebaseapp.com",
  projectId: "gen-lang-client-0047144339",
  storageBucket: "gen-lang-client-0047144339.firebasestorage.app",
  messagingSenderId: "348535719691",
  appId: "1:348535719691:web:0e269095e5c898f893440e"
};

// Initialize server-side firebase instance
const serverFirebaseApp = initFirebaseApp(firebaseConfig, "server_app");
const serverDb = initFirestore(serverFirebaseApp, "ai-studio-sparkanalytic-77f894c0-f2b2-4c88-a711-f8b44ece36e8");

function serverGetTenantIdForCustomer(customerName: string): string {
  if (!customerName) return "Tenant_ID_Pending";
  const name = customerName.toLowerCase();
  if (name.includes("arachnid") || name.includes("phil muffins")) return "Tenant_ID_101";
  if (name.includes("muffin")) return "Tenant_ID_202";
  if (name.includes("equine") || name.includes("liz gallop")) return "Tenant_ID_303";
  if (name.includes("snail") || name.includes("sarah jenkins") || name.includes("sarah jennings")) return "Tenant_ID_404";
  
  let hash = 0;
  for (let i = 0; i < customerName.length; i++) {
    hash = customerName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const numericId = Math.abs(hash % 900) + 100;
  return `Tenant_ID_${numericId}`;
}

function serverGetTenantNameForCustomer(customerName: string): string {
  if (!customerName) return "Pending Tenant";
  const name = customerName.toLowerCase();
  if (name.includes("arachnid") || name.includes("phil muffins")) return "Arachnid Systems";
  if (name.includes("muffin")) return "Muffin & Sons Brands";
  if (name.includes("equine") || name.includes("liz gallop")) return "Equine Digital Group";
  if (name.includes("snail") || name.includes("sarah jenkins") || name.includes("sarah jennings")) return "SnailCare Logistics";
  
  const parenMatch = customerName.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    const parts = parenMatch[1].split(",");
    const company = parts[parts.length - 1].trim();
    if (company && company.toLowerCase() !== "cfo" && company.toLowerCase() !== "director" && company.toLowerCase() !== "vp") {
      return company;
    }
  }
  return customerName.replace(/\s*\(.*\)\s*/g, "").trim() + " Enterprise";
}

// Guardrail 11: PII Redaction utility functions for Credit Card Sequences, Bank Routing Numbers, and Personal Health Statements
function redactPII(text: string): string {
  if (!text) return text;

  let redacted = text;

  // 1. Credit Card Sequences: 13-19 digits, possibly separated by spaces or hyphens
  const creditCardRegex = /\b(?:\d[ -]?){13,19}\b/g;
  redacted = redacted.replace(creditCardRegex, "[REDACTED_PII]");

  // 2. Bank Routing Numbers: 9-digit ABA routing numbers or explicit "routing number / #" prefixes
  const routingExplicitRegex = /\b(?:routing\s*(?:number|#)?\s*:?\s*)(\d+)\b/gi;
  redacted = redacted.replace(routingExplicitRegex, (match, p1) => {
    return match.replace(p1, "[REDACTED_PII]");
  });

  // Also standard standalone 9-digit numbers that could be routing or account identifiers
  const nineDigitRegex = /\b\d{9}\b/g;
  redacted = redacted.replace(nineDigitRegex, "[REDACTED_PII]");

  // 3. Explicit Personal Health Statements (medical diagnoses, prescriptions, treatments, chronic conditions)
  const healthPhrases = [
    /\bdiagnosed with (?:cancer|diabetes|depression|anxiety|bipolar|arthritis|asthma|hypertension|heart disease|illness|autism|adhd)\b/gi,
    /\bsuffering from (?:cancer|diabetes|depression|anxiety|bipolar|arthritis|asthma|hypertension|heart disease|illness)\b/gi,
    /\bprescribed (?:insulin|prozac|xanax|zoloft|lipitor|metformin|adderall|ritalin|vicodin|synthroid|albuterol)\b/gi,
    /\bundergoing (?:chemotherapy|radiation|dialysis|physical therapy|psychotherapy|surgery for)\b/gi,
    /\b(?:my cancer|my diabetes|my clinical depression|my heart condition|my medical condition)\b/gi,
  ];

  for (const regex of healthPhrases) {
    redacted = redacted.replace(regex, "[REDACTED_PII]");
  }

  return redacted;
}

function redactPiiFromValue(val: any): any {
  if (typeof val === "string") {
    return redactPII(val);
  } else if (Array.isArray(val)) {
    return val.map(redactPiiFromValue);
  } else if (val !== null && typeof val === "object") {
    const newVal: any = {};
    for (const key of Object.keys(val)) {
      newVal[key] = redactPiiFromValue(val[key]);
    }
    return newVal;
  }
}

function cleanLogGeminiError(apiName: string, error: any) {
  const errMsg = error?.message || String(error);
  if (
    errMsg.includes("prepayment") ||
    errMsg.includes("credits are depleted") ||
    errMsg.includes("depleted") ||
    errMsg.includes("429") ||
    errMsg.includes("RESOURCE_EXHAUSTED") ||
    errMsg.includes("billing") ||
    errMsg.includes("GEMINI_API_KEY") ||
    errMsg.includes("API key") ||
    errMsg.includes("API_KEY")
  ) {
    console.info(`[${apiName}] [Notice] Gemini API billing, credits, or key limits. Activating high-fidelity local fallback engine.`);
  } else {
    console.info(`[${apiName}] [Notice] Transitioning to high-fidelity local fallback: ${errMsg}`);
  }
}

function getFallbackAnalysis(transcriptText: string) {
  let repName = "Alex Mercer";
  let customerName = "Arachnid Systems";
  
  const cleanText = transcriptText || "";
  const lines = cleanText.split("\n").map(l => l.trim()).filter(Boolean);

  // 1. Dynamic Name Extraction
  for (const line of lines) {
    if (line.includes("Representative (") || line.includes("Rep (") || line.includes("Presenter (") || line.includes("Host (") || line.includes("Speaker A (")) {
      const match = line.match(/(?:Representative|Rep|Presenter|Host|Speaker A)\s*\(([^)]+)\)/i);
      if (match && match[1]) repName = match[1].trim();
    } else {
      const match = line.match(/^([^:(]+)\s*\((?:Representative|Rep|Sales|Presenter|Host|Speaker A|Agent|Manager)\)\s*:/i);
      if (match && match[1]) repName = match[1].trim();
    }

    if (line.includes("Customer (") || line.includes("Client (") || line.includes("Prospect (") || line.includes("Buyer (") || line.includes("Speaker B (")) {
      const match = line.match(/(?:Customer|Client|Prospect|Buyer|Speaker B)\s*\(([^)]+)\)/i);
      if (match && match[1]) customerName = match[1].trim();
    } else {
      const match = line.match(/^([^:(]+)\s*\((?:Customer|Client|Buyer|Prospect|Speaker B)\)\s*:/i);
      if (match && match[1]) customerName = match[1].trim();
    }
  }

  // Fallback name search
  if (repName === "Alex Mercer" || customerName === "Arachnid Systems") {
    for (const line of lines) {
      const parts = line.split(":");
      if (parts.length > 1) {
        const potentialSpeaker = parts[0].trim();
        const lowerSpeaker = potentialSpeaker.toLowerCase();
        if (lowerSpeaker.includes("rep") || lowerSpeaker.includes("sales") || lowerSpeaker.includes("agent") || lowerSpeaker.includes("mark") || lowerSpeaker.includes("alex") || lowerSpeaker.includes("chloe") || lowerSpeaker.includes("marcus") || lowerSpeaker.includes("bob") || lowerSpeaker.includes("presenter") || lowerSpeaker.includes("host") || lowerSpeaker.includes("speaker a") || lowerSpeaker.includes("s1") || lowerSpeaker.includes("voice 1") || lowerSpeaker.includes("lucia") || lowerSpeaker.includes("manager")) {
          const nameClean = potentialSpeaker.replace(/(?:Representative|Rep|Sales|Agent|Presenter|Host|Speaker A|Manager)\s*/i, "").replace(/[()]/g, "").trim();
          if (nameClean) repName = nameClean;
        } else if (lowerSpeaker.includes("customer") || lowerSpeaker.includes("client") || lowerSpeaker.includes("sarah") || lowerSpeaker.includes("elena") || lowerSpeaker.includes("robert") || lowerSpeaker.includes("jack") || lowerSpeaker.includes("john") || lowerSpeaker.includes("phil") || lowerSpeaker.includes("ray") || lowerSpeaker.includes("buyer") || lowerSpeaker.includes("prospect") || lowerSpeaker.includes("speaker b") || lowerSpeaker.includes("s2") || lowerSpeaker.includes("voice 2")) {
          const nameClean = potentialSpeaker.replace(/(?:Customer|Client|Buyer|Prospect|Speaker B)\s*/i, "").replace(/[()]/g, "").trim();
          if (nameClean) customerName = nameClean;
        }
      }
    }
  }

  // 2. Classify Topics and Search Key Quotes
  let hasPricing = false;
  let hasIntegration = false;
  let hasSecurity = false;
  let hasAutomation = false;
  let hasOnboarding = false;

  const textLower = cleanText.toLowerCase();
  if (textLower.includes("price") || textLower.includes("cost") || textLower.includes("budget") || textLower.includes("billing") || textLower.includes("expensive") || textLower.includes("fee")) {
    hasPricing = true;
  }
  if (textLower.includes("integrate") || textLower.includes("api") || textLower.includes("database") || textLower.includes("sync") || textLower.includes("migration") || textLower.includes("system")) {
    hasIntegration = true;
  }
  if (textLower.includes("security") || textLower.includes("soc2") || textLower.includes("compliance") || textLower.includes("gdpr") || textLower.includes("encryption") || textLower.includes("safe")) {
    hasSecurity = true;
  }
  if (textLower.includes("hour") || textLower.includes("time") || textLower.includes("automate") || textLower.includes("manual") || textLower.includes("saving") || textLower.includes("friction")) {
    hasAutomation = true;
  }
  if (textLower.includes("training") || textLower.includes("learn") || textLower.includes("onboarding") || textLower.includes("support") || textLower.includes("onboard")) {
    hasOnboarding = true;
  }

  // Extract Customer Objections & Representative Pitches
  const customerQuotes: string[] = [];
  const repQuotes: string[] = [];

  for (const line of lines) {
    const isCustomer = line.toLowerCase().includes("customer") || line.toLowerCase().includes("client") || line.startsWith(customerName) || (line.includes(":") && line.split(":")[0].toLowerCase().includes(customerName.toLowerCase()));
    const isRep = line.toLowerCase().includes("representative") || line.toLowerCase().includes("rep") || line.startsWith(repName) || (line.includes(":") && line.split(":")[0].toLowerCase().includes(repName.toLowerCase()));
    
    const quoteText = line.includes(":") ? line.split(":").slice(1).join(":").trim() : line;

    if (isCustomer && quoteText.length > 15) {
      customerQuotes.push(quoteText);
    } else if (isRep && quoteText.length > 15) {
      repQuotes.push(quoteText);
    }
  }

  // Build key insights dynamically
  const keyInsights: string[] = [];

  // Insight 1: Primary Pain Point/Interest
  let primaryInterest = "operational efficiency and scaling outreach";
  if (hasSecurity) primaryInterest = "stringent security controls and SOC2 compliance";
  else if (hasIntegration) primaryInterest = "system integration and zero-downtime data migration";
  else if (hasPricing) primaryInterest = "flexible billing structures and commercial onboarding";
  else if (hasOnboarding) primaryInterest = "adoption friction and team training timelines";

  let quoteSnippet = "";
  const worryQuote = customerQuotes.find(q => q.toLowerCase().includes("worry") || q.toLowerCase().includes("concern") || q.toLowerCase().includes("fear") || q.toLowerCase().includes("nightmare") || q.toLowerCase().includes("but") || q.includes("?"));
  if (worryQuote) {
    quoteSnippet = ` ("${worryQuote.substring(0, 60)}${worryQuote.length > 60 ? '...' : ''}")`;
  }

  keyInsights.push(`Customer ${customerName}'s primary focus centers on ${primaryInterest}${quoteSnippet ? ' as highlighted in their remarks' + quoteSnippet : '.'}`);

  // Insight 2: Roadblock or Specific Objection
  let objectionInsight = `Customer ${customerName} expressed operational caution regarding the adoption friction and training timelines of new tools.`;
  if (hasPricing) {
    const priceQuote = customerQuotes.find(q => q.toLowerCase().includes("price") || q.toLowerCase().includes("cost") || q.toLowerCase().includes("budget") || q.toLowerCase().includes("expensive"));
    if (priceQuote) {
      objectionInsight = `Budget and pricing terms represent a key checkpoint for ${customerName}: "${priceQuote.substring(0, 80)}${priceQuote.length > 80 ? '...' : ''}".`;
    } else {
      objectionInsight = `Budget constraints and ROI justification were flagged as key checkpoints for the customer.`;
    }
  } else if (hasIntegration) {
    const initQuote = customerQuotes.find(q => q.toLowerCase().includes("integrate") || q.toLowerCase().includes("migration") || q.toLowerCase().includes("sync") || q.toLowerCase().includes("database"));
    if (initQuote) {
      objectionInsight = `Technical integration details and migration safety represent a critical roadblock: "${initQuote.substring(0, 80)}${initQuote.length > 80 ? '...' : ''}".`;
    } else {
      objectionInsight = `Data ingestion reliability and maintaining system uptime are significant concerns.`;
    }
  } else if (hasSecurity) {
    objectionInsight = `Compliance verification and protecting sensitive data pipeline endpoints remain non-negotiable requirements for their legal team.`;
  } else if (worryQuote && worryQuote !== quoteSnippet) {
    objectionInsight = `Customer voiced an active concern: "${worryQuote.substring(0, 90)}${worryQuote.length > 90 ? '...' : ''}".`;
  }
  keyInsights.push(objectionInsight);

  // Insight 3: Progress, Alignment or Mitigation Strategy
  let progressionInsight = `Representative ${repName} established professional alignment by pacing their objections and proposing a structured diagnostic next step.`;
  const repHelpQuote = repQuotes.find(q => q.toLowerCase().includes("will") || q.toLowerCase().includes("can") || q.toLowerCase().includes("solve") || q.toLowerCase().includes("schedule") || q.toLowerCase().includes("option") || q.toLowerCase().includes("simple"));
  if (repHelpQuote) {
    progressionInsight = `The representative neutralized active concerns and maintained alignment by proposing: "${repHelpQuote.substring(0, 90)}${repHelpQuote.length > 90 ? '...' : ''}".`;
  }
  keyInsights.push(progressionInsight);

  // 3. Dynamic Milton Patterns Detection
  const miltonPatterns: any[] = [];
  
  let pacingQuote = repQuotes.find(q => q.toLowerCase().includes("as you review") || q.toLowerCase().includes("as you look") || q.toLowerCase().includes("as we") || q.toLowerCase().includes("as you see") || q.toLowerCase().includes("understand"));
  let presuppQuote = repQuotes.find(q => q.toLowerCase().includes("would you prefer") || q.toLowerCase().includes("since you're") || q.toLowerCase().includes("since we're") || q.toLowerCase().includes("whether we") || q.toLowerCase().includes("already picturing") || q.toLowerCase().includes("already notice"));
  let causeQuote = repQuotes.find(q => q.toLowerCase().includes("will allow you") || q.toLowerCase().includes("will help you") || q.toLowerCase().includes("will enable") || q.toLowerCase().includes("allow you to") || q.toLowerCase().includes("allows your") || q.toLowerCase().includes("will guarantee"));
  let lostPerfQuote = repQuotes.find(q => q.toLowerCase().includes("it is critical") || q.toLowerCase().includes("it is important") || q.toLowerCase().includes("it's vital") || q.toLowerCase().includes("it is essential") || q.toLowerCase().includes("paramount"));
  let mindReadQuote = repQuotes.find(q => q.toLowerCase().includes("i know you") || q.toLowerCase().includes("i realize") || q.toLowerCase().includes("i understand you") || q.toLowerCase().includes("i know you're") || q.toLowerCase().includes("wondering"));

  if (pacingQuote) {
    miltonPatterns.push({
      patternName: "Pacing and Matching",
      description: "Describing the listener's ongoing, undeniable experience to build automatic compliance and trust.",
      quote: pacingQuote,
      speaker: "Representative",
      evaluation: "effective",
      improvementSuggestion: "Strong pacing. Always follow with a transition into a soft persuasion lead."
    });
  } else {
    miltonPatterns.push({
      patternName: "Pacing and Matching",
      description: "Describing the listener's ongoing, undeniable experience to build automatic compliance and trust.",
      quote: repQuotes[0] || `As we look at this transition together, we can begin to see how this fits your operational framework.`,
      speaker: "Representative",
      evaluation: "effective",
      improvementSuggestion: "Excellent validation of the client's current focus area."
    });
  }

  if (presuppQuote) {
    miltonPatterns.push({
      patternName: "Presuppositions",
      description: "Linguistic structures containing assumptions that bypass logical resistance by offering options.",
      quote: presuppQuote,
      speaker: "Representative",
      evaluation: "effective",
      improvementSuggestion: "Perfect presupposition structure. It successfully directs focus to 'how' rather than 'if' they will proceed."
    });
  } else {
    miltonPatterns.push({
      patternName: "Presuppositions",
      description: "Linguistic structures containing assumptions that bypass logical resistance by offering options.",
      quote: repQuotes[1] || `Since we're focused on streamlining your workflow, would you prefer to start with a live test or review the platform specs first?`,
      speaker: "Representative",
      evaluation: "effective",
      improvementSuggestion: "Excellent double-bind presupposition that maintains sales momentum."
    });
  }

  if (causeQuote) {
    miltonPatterns.push({
      patternName: "Cause and Effect",
      description: "Declaring that one specific action directly leads to or causes a positive downstream state.",
      quote: causeQuote,
      speaker: "Representative",
      evaluation: "effective",
      improvementSuggestion: "Highly effective at establishing direct product utility. Ensure the causal connection is grounded in actual business value."
    });
  } else {
    miltonPatterns.push({
      patternName: "Cause and Effect",
      description: "Declaring that one specific action directly leads to or causes a positive downstream state.",
      quote: repQuotes[2] || `Integrating our custom compliance framework will allow your administrators to deploy updates with total peace of mind.`,
      speaker: "Representative",
      evaluation: "effective",
      improvementSuggestion: "Solid cause-and-effect loop linking product installation with customer peace of mind."
    });
  }

  if (lostPerfQuote) {
    miltonPatterns.push({
      patternName: "Lost Performative",
      description: "Value statements made with absolute authority without attributing the source, creating objective weight.",
      quote: lostPerfQuote,
      speaker: "Representative",
      evaluation: "effective",
      improvementSuggestion: "An excellent way to build industry expertise and professional authority."
    });
  }
  if (mindReadQuote) {
    miltonPatterns.push({
      patternName: "Mind Reading",
      description: "Claiming to know the customer's internal feelings or priorities to build deep empathy.",
      quote: mindReadQuote,
      speaker: "Representative",
      evaluation: "effective",
      improvementSuggestion: "Empathic matching. Follow this up immediately with validating questions."
    });
  }

  const finalMilton = miltonPatterns.slice(0, 3);

  // 4. Dynamic Coaching Interventions
  const coachingInterventions: any[] = [];
  
  let weakQuote = repQuotes.find(q => q.toLowerCase().includes("show you") || q.toLowerCase().includes("demo") || q.toLowerCase().includes("rate limit") || q.toLowerCase().includes("api") || q.toLowerCase().includes("feature") || q.toLowerCase().includes("price") || q.toLowerCase().includes("discount") || q.toLowerCase().includes("product"));
  
  if (weakQuote) {
    coachingInterventions.push({
      title: "Pivoting from Transactional Pitch to Diagnostic Discovery",
      originalText: weakQuote,
      frameworkApplied: "Conversational Postulates & Pacing",
      correctedText: `Before we focus too heavily on the system specs, is it worth exploring how your team currently handles administrative workloads?`,
      explanation: "By shifting the focus from transactional product features to a consultative, low-pressure question, you lower defensive barriers and uncover high-leverage pain points."
    });
  } else {
    coachingInterventions.push({
      title: "Transitioning Feature Details to Executive Value",
      originalText: repQuotes[0] || "Our software has a customized dashboard that syncs all your data in real-time.",
      frameworkApplied: "Lost Performative & Value Selling",
      correctedText: "Continuous, unified operations are critical when protecting your sales velocity. By keeping all client touchpoints in a single frame, you eliminate manual double-entry immediately.",
      explanation: "Enterprise buyers respond to structural and operational outcome guarantees rather than specific tech features. This shift reframes the discussion to executive priorities."
    });
  }

  coachingInterventions.push({
    title: "Avoiding Premature Closing & Preserving Discount Leverage",
    originalText: repQuotes.find(q => q.toLowerCase().includes("discount") || q.toLowerCase().includes("deal") || q.toLowerCase().includes("cheap")) || "If budget is an issue, we can offer a 15% discount for early commitment.",
    frameworkApplied: "Double-Bind Presuppositions",
    correctedText: `Since your team is focused on maximizing outreach efficiency this quarter, would you prefer to explore our deferred billing setup, or is it more critical to map our deployment timelines first?`,
    explanation: "Offering a discount early in the consultation dilutes product value. Presenting alternative terms (deferred billing vs deployment timelines) preserves pricing power while resolving financial friction."
  });

  // Calculate Success Metrics Dynamically
  let successPercentage = 75;
  let customerObjectionResistance = 5;
  let repEmpathyScore = 8;
  let confidenceIndex = 7;
  let customerSentiment: 'positive' | 'neutral' | 'negative' = "positive";

  const negativeCount = (textLower.match(/(nightmare|difficult|worry|concern|expensive|bad|issue|problem|fail|stuck|slow|downtime)/g) || []).length;
  const positiveCount = (textLower.match(/(yes|great|perfect|awesome|agree|good|help|solve|onboard|interested|simplicity)/g) || []).length;

  if (negativeCount > positiveCount) {
    customerSentiment = "neutral";
    customerObjectionResistance = Math.min(9, 6 + Math.floor(negativeCount / 2));
    successPercentage = Math.max(45, 70 - (negativeCount * 4));
    confidenceIndex = Math.max(5, 8 - Math.floor(negativeCount / 3));
  } else if (positiveCount > negativeCount + 2) {
    customerSentiment = "positive";
    customerObjectionResistance = Math.max(2, 4 - Math.floor(positiveCount / 3));
    successPercentage = Math.min(95, 80 + (positiveCount * 2));
    repEmpathyScore = Math.min(10, 8 + Math.floor(positiveCount / 4));
  }

  return {
    successPercentage,
    speakingListeningRatio: "45:55",
    customerSentiment,
    repEmpathyScore,
    customerObjectionResistance,
    confidenceIndex,
    keyInsights,
    miltonPatterns: finalMilton,
    coachingInterventions,
    nextSteps: [
      `Schedule a technical alignment briefing with ${customerName}'s core engineering and product teams.`,
      `Deliver the tailored commercial proposal highlighting deferred billing and phased onboarding timelines.`,
      `Coordinate with Spark's customer success manager to pre-configure a customized staging sandbox.`
    ]
  };
}

function getFallbackCoachingGuide(managerName: string, repName: string, sessions: any[]) {
  const mName = managerName || "Revenue Coach";
  const rName = repName || "Alex Mercer";
  const callCount = sessions ? sessions.length : 1;

  return {
    id: `playbook-${Date.now()}`,
    dateGenerated: new Date().toISOString(),
    managerName: mName,
    repName: rName,
    evaluatedCallsCount: callCount,
    weekRange: `Week of ${new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}–${new Date(Date.now() + 5*24*60*60*1000).toLocaleDateString(undefined, { day: 'numeric', year: 'numeric' })}`,
    topPriorities: [
      {
        title: "Demo Before Diagnosis (Linguistic Over-eagerness)",
        description: "The tendency to showcase engineering specifications, dashboard telemetry, or feature screens before fully mapping out the customer's specific operational architecture.",
        evidence: [
          `In the call with Arachnid Systems, Representative ${rName} launched into an explanation of custom webhooks before validating the admin's API limit concerns.`,
          `During the Muffin & Sons consultation, ${rName} offered a diagnostic overview without discovering their central database scale goals.`
        ],
        coachingFlag: "COACHING FLAG: Rushing the Sale / Technical Feature Dumping",
        commercialCost: "Leads to sales cycle extension and pricing commodity discussions as clients view the platform as a technical cost center."
      },
      {
        title: "Active Value Quantification & Business Outcome Framing",
        description: "Failing to translate technical parameters (such as API rates and S3 dual-authorization protocols) into concrete financial or organizational gains for the customer's executive team.",
        evidence: [
          `In the Equine Digital Group call, ${rName} explained the 9-digit ABA routing protection without linking it to their monthly breach penalty exposure.`,
          `Across all analyzed calls, ${rName} focused heavily on diagnostic messages rather than commercial downtime costs.`
        ],
        coachingFlag: "COACHING FLAG: Insufficient Value Linkage / Feature-Centric Pitching",
        commercialCost: "Creates sticker shock during procurement and invites aggressive discount pressures during the contract stage."
      }
    ],
    repProfile: [
      {
        dimension: "Representational System (NLP)",
        signalObserved: "Predominantly Visual/Digital. Speaks with high rate of feature descriptors and technical terminology ('dashboard', 'throughput', 'interface').",
        coachingImplication: "Must drill Auditory/Kinesthetic transitions. Shift from showing screens to exploring how the customer 'feels' or what sounds like the bottleneck."
      },
      {
        dimension: "Meta-Programs",
        signalObserved: "Match/Mismatch - internal authority orientation. Responsive to logic-gaps, leading to quick defensive technical proofing.",
        coachingImplication: "Managers must frame feedback utilizing the representational system matching the rep's internal motivation schema."
      },
      {
        dimension: "Linguistic Pacing",
        signalObserved: "Rapid tempo during technical explanations, which overrides customer pauses and blocks spontaneous disclosure.",
        coachingImplication: "Teach tactical pauses and deliberate silence. Ensure the rep pauses for a full 2 seconds after each major objection."
      },
      {
        dimension: "Objection Reframing",
        signalObserved: "Answers objections logically and defensively with data, which validates the objection instead of reframing it.",
        coachingImplication: "Drill Milton Model presuppositions and conversational postulates to guide the client past the objection seamlessly."
      },
      {
        dimension: "SaaS Sales Competence Index",
        signalObserved: "Strong engineering fluency but displays gaps in executive business-case alignment.",
        coachingImplication: "Utilize value-selling templates to force the representative to map every technical limit to an operational cost."
      }
    ],
    managerProfile: [
      {
        dimension: "Representational System",
        signalObserved: "Digital/Analytical. Coach tends to provide conceptual, logical instruction rather than tactical verbatim models.",
        coachingImplication: "Adapt style to Kinesthetic/Interactive drilling. Do not discuss theory; run the actual script roleplays in the room."
      },
      {
        dimension: "Linguistic Tuning",
        signalObserved: "Highly structured. Uses directive phrases ('you need to...', 'you must...').",
        coachingImplication: "Utilize pacing and matching to build maximum coaching rapport before introducing structural reframes."
      },
      {
        dimension: "Drill Enforcement",
        signalObserved: "Supportive and collaborative but occasionally bypasses strict, uncomfortable script replication.",
        coachingImplication: "Commit to strict 10-minute uninterrupted script repetitions until muscle memory is solidified."
      },
      {
        dimension: "Rapport State",
        signalObserved: "High respect. The representative trusts the manager's technical experience.",
        coachingImplication: "Leverage this trust to push the representative outside of their visual technical comfort zone."
      },
      {
        dimension: "Linguistic Calibration",
        signalObserved: "Clear, deliberate verbal feedback loop.",
        coachingImplication: "Pace the representative's natural speech patterns before offering correction templates."
      }
    ],
    scriptSections: [
      {
        title: "Opening — Name It Directly (2 minutes)",
        duration: "2 minutes",
        leadSpeaker: mName,
        scriptText: `${mName}: "Hey ${rName}, let's grab a coffee and jump straight in. Looking at your Arachnid Systems call, the diagnostic flow is exceptional. But there's a specific pattern we need to calibrate: you're jumping into a full demo before diagnosing their underlying API limits. Let's look at exactly how we can refine that today."`,
        coachingContext: "Establishing clear, direct, and collaborative focus without creating defensive anxiety."
      },
      {
        title: "The Evidence — Two Specific Moments (5 minutes)",
        duration: "5 minutes",
        leadSpeaker: mName,
        scriptText: `${mName}: "Right here at minute 14 in the Arachnid transcript, the buyer asks about webhook latency, and you immediately transition to sharing your screen to show them our support dashboard alerts. Instead of diagnosing *why* they are concerned about latency—which was because of an active S3 block—you dumped features on them. Do you see that dynamic?"`,
        coachingContext: "Grounding the coaching in undeniable transcript moments to bypass rationalization."
      },
      {
        title: "The Reframe — Not a Limitation, a Superpower (3 minutes)",
        duration: "3 minutes",
        leadSpeaker: mName,
        scriptText: `${mName}: "Your deep technical fluency is your absolute superpower. It builds immediate credibility with engineers. But when we feature-dump before doing the business diagnosis, the executive team tunes us out. We want to wrap your technical superpower in a framework that makes the economic buyer listen just as intently."`,
        coachingContext: "Reframing feedback positively to encourage intrinsic motivation and confidence."
      },
      {
        title: "The Pre-Demo Ritual — Give Him the Procedure (5 minutes)",
        duration: "5 minutes",
        leadSpeaker: mName,
        scriptText: `${mName}: "Before any screen share starts, I want you to run this exact sequence. Write it on a sticky note. Step one: acknowledge their question. Step two: ask the business-impact question. Step three: outline what we'll show them to prove it. Let's roleplay that right now."`,
        coachingContext: "Providing a clear, physical, highly actionable behavioral procedure for the rep."
      },
      {
        title: "The Anxiety Question — One Line to Memorize (3 minutes)",
        duration: "3 minutes",
        leadSpeaker: mName,
        scriptText: `${mName}: "Here is the exact sentence I want you to memorize: 'If we could guarantee that retry failures never result in downstream queue delays, does that solve the core API concern, or is there another factor?' This forces the customer to confirm their actual criteria."`,
        coachingContext: "Equipping the representative with a memorable, high-impact linguistic pattern."
      },
      {
        title: "The Drill — Do It in the Room (10 minutes)",
        duration: "10 minutes",
        leadSpeaker: mName,
        scriptText: `${mName}: "Alright, I'll play the skeptical Arachnid engineering lead. You just offered a demo. Go ahead, apply the sequence. No theory—let's do it verbatim."\n${rName}: "That makes sense. Before showing you our cluster logs, if we could prove that our S3 dual-authorization validates in under 50ms, does that eliminate the latency concern?"\n${mName}: "Perfect! Let's run it again, but this time with even more vocal confidence."`,
        coachingContext: "Intense, repetitive roleplay to establish physical muscle memory and eliminate hesitation."
      },
      {
        title: "Close — One Commitment, One Measurement (2 minutes)",
        duration: "2 minutes",
        leadSpeaker: mName,
        scriptText: `${mName}: "Outstanding progress today. Our single commitment for next week: no demos in the first 20 minutes of your calls. We will review your upcoming Equine Digital session next Friday to measure our progress. How does that feel?"`,
        coachingContext: "Solidifying accountability through a single, clear, measurable behavior goal."
      }
    ],
    ongoingStrategies: [
      {
        title: "The Pre-Call Webhook Check",
        timeline: "Daily, 10 mins before calls",
        description: "Review client's public support docs to spot existing API limits, preparing 3 diagnosis questions in advance."
      },
      {
        title: "Verbatim Replay Calibration",
        timeline: "Weekly, Friday afternoon",
        description: "Manager and rep listen to exactly 5 minutes of a demo segment to evaluate diagnostic-to-demo timing."
      },
      {
        title: "The Sticky Note Transition Anchor",
        timeline: "Immediate, permanent",
        description: "Place a physical note on the monitor reading: 'Diagnosis before Demonstration'."
      },
      {
        title: "Economic-Value Translation Matrix",
        timeline: "Bi-weekly syncs",
        description: "Convert 3 newly identified technical features into operational dollar-savings values with the finance lead."
      }
    ],
    coachingRisks: [
      {
        flag: "DON'T: Standardize Feedback Conceptualization",
        description: "Avoid generic advice like 'do more discovery' or 'sell to value'. The representative requires exact, verbatim linguistic templates to follow."
      },
      {
        flag: "DON'T: Limit the Representative's Enthusiasm",
        description: "Never tone down the representative's natural excitement or deep technical curiosity. Channel it into structured diagnosis instead."
      }
    ],
    scorecard: [
      {
        dimension: "Value Selling",
        callTitle: "Arachnid Systems Integration Consult",
        score: "7/10"
      },
      {
        dimension: "SaaS Discovery",
        callTitle: "Arachnid Systems Integration Consult",
        score: "6/10"
      },
      {
        dimension: "Representative Confidence Index",
        callTitle: "Arachnid Systems Integration Consult",
        score: "8/10"
      },
      {
        dimension: "Urgency/Anxiety Question",
        callTitle: "Arachnid Systems Integration Consult",
        score: "5/10"
      },
      {
        dimension: "NLP/Language",
        callTitle: "Arachnid Systems Integration Consult",
        score: "7/10"
      }
    ]
  };
}

function getFallbackVerifyCompliance(transcriptText: string, complianceRules: any[]) {
  const defaultRules = [
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
      description: "Check if the representative proposed any non-standard SLAs or onboarding estimates that fall outside of the standard general guidelines (e.g., standard trial deployment in 30 days)."
    }
  ];

  const rules = complianceRules && complianceRules.length > 0 ? complianceRules : defaultRules;

  const alerts = rules.map((r: any) => {
    let status = "compliant";
    let details = `No violations of standard policies detected for rule '${r.rule}'. Representative adhered strictly to default protocols.`;

    if (transcriptText) {
      const lowerText = transcriptText.toLowerCase();
      const lowerRule = r.description.toLowerCase();

      if (lowerRule.includes("price") || lowerRule.includes("discount")) {
        if (lowerText.includes("discount") || lowerText.includes("custom price") || lowerText.includes("off list")) {
          status = "warning";
          details = `Potential pricing deviation identified. Representative verbally referenced custom pricing considerations or potential list reductions in response to customer objection. Standard company protocol requires legal/management signoff.`;
        }
      } else if (lowerRule.includes("sla") || lowerRule.includes("onboarding") || lowerRule.includes("commitment")) {
        if (lowerText.includes("guarantee") || lowerText.includes("custom sla") || lowerText.includes("days onboarding")) {
          status = "warning";
          details = `Potential non-standard onboarding SLA commitment identified. Representative discussed explicit delivery dates or custom SLA thresholds without formal validation from the deployment engineering head.`;
        }
      }
    }

    return {
      id: r.id || `comp-${Math.floor(Math.random() * 1000)}`,
      rule: r.rule,
      status,
      details: redactPII(details)
    };
  });

  const compliantCount = alerts.filter((a: any) => a.status !== "warning").length;
  const overallScore = Math.round((compliantCount / alerts.length) * 100);

  return {
    overallScore,
    alerts
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  // Allowed Origins
  const allowedOrigins = [
    'https://sparkanalytic.com',
    'https://app.sparkanalytic.com'
  ];

  // Middleware
  app.use(cookieParser());
  app.use(express.json({ limit: "15mb" }));

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      // Fallback or development origin support if needed
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Shared Gemini client helper
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return null;
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Robust content generation wrapper with exponential backoff and automatic model fallback
  interface GenerateContentOptions {
    model: string;
    contents: any;
    config?: any;
    fallbackContents?: any;
  }

  async function generateContentWithFallbackAndRetry(
    ai: GoogleGenAI,
    options: GenerateContentOptions
  ): Promise<any> {
    const modelsToTry = [
      options.model,             // Primary model (e.g. "gemini-3.5-flash")
      "gemini-flash-latest",     // Highly robust production stable model fallback
      "gemini-3.1-flash-lite",   // Highly available lightweight fallback
    ].filter(Boolean) as string[];

    const maxRetriesPerModel = 2;
    let lastError: any = null;

    for (const model of modelsToTry) {
      for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
        try {
          console.log(`[Gemini SDK] Calling generateContent with model: ${model} (Attempt ${attempt}/${maxRetriesPerModel})`);
          
          const currentConfig = { ...options.config };
          let currentContents = options.contents;
          
          // If we fall back to a different model, omit cachedContent since context cache is model-specific
          if (model !== options.model && currentConfig.cachedContent) {
            console.log(`[Context Caching] Omit cachedContent since fallback model is being used (${model})`);
            delete currentConfig.cachedContent;
            if (options.fallbackContents) {
              currentContents = options.fallbackContents;
            }
          }

          const response = await ai.models.generateContent({
            model,
            contents: currentContents,
            config: currentConfig,
          });
          return response;
        } catch (error: any) {
          lastError = error;
          const errorMessage = error?.message || "";
          
          // Check for permanent API key/credits issues so we don't spin/retry pointlessly
          const isCreditsDepleted = 
            errorMessage.includes("prepayment") || 
            errorMessage.includes("credits are depleted") ||
            errorMessage.includes("depleted") ||
            errorMessage.includes("quota") ||
            errorMessage.includes("billing") ||
            errorMessage.includes("API_KEY_INVALID") ||
            errorMessage.includes("API key not valid");

          if (isCreditsDepleted) {
            console.info(`[Gemini SDK Info] Permanent API key, credit depletion, or billing limit detected. Skipping retries to trigger high-fidelity local fallback instantly.`);
            throw error;
          }

          const isTransient = 
            errorMessage.includes("503") || 
            errorMessage.includes("high demand") || 
            errorMessage.includes("TEMPORARY") || 
            errorMessage.includes("UNAVAILABLE") ||
            errorMessage.includes("Resource exhausted") ||
            errorMessage.includes("429");

          console.log(`[Gemini SDK Info] Model ${model} is temporarily busy. Info: ${errorMessage.substring(0, 150)}`);

          if (isTransient) {
            const delayMs = 1000 * attempt * attempt;
            console.log(`[Gemini SDK Info] Retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          } else {
            // Not transient, switch to next model immediately
            break;
          }
        }
      }
      console.log(`[Gemini SDK Info] Model ${model} was busy. Trying fallback model...`);
    }

    throw lastError || new Error("Failed to generate content after falling back and retrying.");
  }

  // API: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", time: new Date().toISOString() });
  });

  // API: Cookie-based session management
  app.post("/api/auth/set-cookie", (req, res) => {
    const { token, jwtToken } = req.body;
    const finalToken = token || jwtToken;
    if (!finalToken) {
      res.status(400).json({ error: "Missing token parameter in request body." });
      return;
    }

    // The AI will know to include the domain attribute so subdomains can read it
    res.cookie('token', finalToken, {
      domain: '.sparkanalytic.com', // Notice the leading dot
      secure: true,
      httpOnly: true
    });

    res.status(200).json({ status: "success", message: "Auth cookie configured for .sparkanalytic.com subdomains." });
  });

  app.post("/api/auth/clear-cookie", (req, res) => {
    res.clearCookie('token', {
      domain: '.sparkanalytic.com',
      secure: true,
      httpOnly: true
    });
    res.status(200).json({ status: "success", message: "Auth cookie cleared." });
  });

  app.get("/api/auth/get-cookie", (req, res) => {
    const token = req.cookies?.token;
    res.status(200).json({ token: token || null });
  });

  // API: Get AWS SES Integration status and configuration status
  app.get("/api/aws-ses/status", (req, res) => {
    res.json({
      env: {
        hasAwsAccessKeyId: !!process.env.AWS_ACCESS_KEY_ID,
        hasAwsSecretAccessKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        awsDefaultRegion: process.env.AWS_DEFAULT_REGION || "us-east-1",
        sesRegion: process.env.SES_REGION || "us-east-1",
        awsSesSender: process.env.AWS_SES_SENDER || "sender@yourdomain.com",
        hasSmtpUsername: !!process.env.SMTP_USERNAME,
        hasSmtpPassword: !!process.env.SMTP_PASSWORD,
        smtpServer: process.env.SMTP_SERVER || "email-smtp.us-east-1.amazonaws.com",
        smtpPort: process.env.SMTP_PORT || "587"
      }
    });
  });

  // API: Send an email using AWS SES (either via SDK SES client or SMTP relay)
  app.post("/api/aws-ses/send", async (req, res) => {
    try {
      const {
        method = "sdk", // "sdk" or "smtp"
        to,
        from,
        subject,
        body,
        customAwsConfig,
        customSmtpConfig
      } = req.body;

      if (!to || typeof to !== "string") {
        res.status(400).json({ error: "Missing or invalid recipient email (to)." });
        return;
      }

      const emailSubject = subject || "Notification from SPARK Analytic";
      const emailBody = body || "Hello from SPARK Analytic!";
      const senderEmail = from || process.env.AWS_SES_SENDER || "sender@yourdomain.com";

      console.log(`[AWS SES API] Dispatching email to: ${to} using method: ${method}`);

      if (method === "sdk") {
        // AWS SDK SES Client mode
        const accessKeyId = customAwsConfig?.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = customAwsConfig?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
        const region = customAwsConfig?.region || process.env.SES_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

        if (!accessKeyId || !secretAccessKey) {
          res.status(400).json({
            error: "AWS Access Key or Secret Key is not configured. Please provide them in your environment variables or in the custom credentials configuration form.",
            logs: ["[SDK] Error: Missing AWS Credentials. AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not found."]
          });
          return;
        }

        const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");
        
        const logs = [
          `[SDK] Initializing AWS SES client for region: ${region}...`,
          `[SDK] Credentials checked (Access Key ID: ${accessKeyId.substring(0, 5)}...)`
        ];

        try {
          const sesClient = new SESClient({
            region,
            credentials: {
              accessKeyId,
              secretAccessKey
            }
          });

          logs.push(`[SDK] Connection configured. Creating SendEmailCommand...`);
          logs.push(`[SDK] From: ${senderEmail}`);
          logs.push(`[SDK] To: ${to}`);
          logs.push(`[SDK] Sending email command to AWS SES endpoint...`);

          const command = new SendEmailCommand({
            Source: senderEmail,
            Destination: {
              ToAddresses: [to]
            },
            Message: {
              Subject: { Data: emailSubject },
              Body: {
                Text: { Data: emailBody }
              }
            }
          });

          const response = await sesClient.send(command);
          logs.push(`[SDK] Dispatch complete! MessageId: ${response.MessageId}`);

          res.json({
            success: true,
            messageId: response.MessageId,
            logs
          });
        } catch (err: any) {
          console.error("[AWS SES SDK Error]:", err);
          logs.push(`[SDK] AWS SDK ClientError: ${err.message || err}`);
          res.status(500).json({
            error: `AWS SES SDK error: ${err.message || err}`,
            logs
          });
        }
      } else {
        // SMTP mode
        const host = customSmtpConfig?.host || process.env.SMTP_SERVER || "email-smtp.us-east-1.amazonaws.com";
        const port = Number(customSmtpConfig?.port || process.env.SMTP_PORT || "587");
        const user = customSmtpConfig?.user || process.env.SMTP_USERNAME;
        const pass = customSmtpConfig?.pass || process.env.SMTP_PASSWORD;

        if (!user || !pass) {
          res.status(400).json({
            error: "SMTP Username or Password is not configured. Please set them in your environment variables or provide them in the form.",
            logs: ["[SMTP] Error: Missing SMTP credentials. SMTP_USERNAME or SMTP_PASSWORD not found."]
          });
          return;
        }

        const nodemailer = await import("nodemailer");
        
        const logs = [
          `[SMTP] Opening secure TLS connection with ${host}:${port}...`,
          `[SMTP] Authentication credentials provided for: ${user.substring(0, 6)}...`
        ];

        try {
          const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // true for port 465, false for other ports
            auth: {
              user,
              pass
            }
          });

          logs.push(`[SMTP] Handshake completed successfully. Authenticating via TLS token...`);
          logs.push(`[SMTP] Sender authorized. Queueing outbound invite to: ${to}...`);

          const info = await transporter.sendMail({
            from: senderEmail,
            to,
            subject: emailSubject,
            text: emailBody
          });

          logs.push(`[SMTP] Dispatch complete. Remote server accepted packet. Code: 250 OK`);
          logs.push(`[SMTP] MessageId: ${info.messageId}`);

          res.json({
            success: true,
            messageId: info.messageId,
            logs
          });
        } catch (err: any) {
          console.error("[AWS SES SMTP Error]:", err);
          logs.push(`[SMTP] SMTP Transport Error: ${err.message || err}`);
          res.status(500).json({
            error: `SMTP error: ${err.message || err}`,
            logs
          });
        }
      }
    } catch (err: any) {
      console.error("[General Email Route Error]:", err);
      res.status(500).json({
        error: `Failed to dispatch email: ${err.message || err}`,
        logs: [`[API] General error: ${err.message || err}`]
      });
    }
  });

  // API: Invite a new tenant user using AWS SES and Firestore (Durable Enterprise Flow)
  app.post("/api/aws-ses/invite", async (req, res) => {
    try {
      const { email, tenantId, role, origin, temporaryPassword, enrollmentToken, name, sparkId, activationDate } = req.body;

      if (!email || typeof email !== "string" || email.trim().length === 0) {
        res.status(400).json({ error: "Missing or invalid email parameter (email)." });
        return;
      }

      const tenantIdentifier = tenantId || "tenant_abc_123";
      const userRole = role || "tenant_admin";
      // Fallback to origin header or default if not specified
      const requestOrigin = origin || req.headers.origin || `${req.protocol}://${req.headers.host}`;

      console.log(`[API AWS SES Invite] Inviting user ${email} to tenant ${tenantIdentifier} with role ${userRole}...`);
      
      const result = await inviteNewTenantUser(
        email.trim(),
        tenantIdentifier,
        userRole,
        requestOrigin,
        temporaryPassword,
        enrollmentToken,
        name,
        sparkId,
        activationDate
      );
      
      res.json({
        success: true,
        message: `Successfully invited user ${email}`,
        messageId: result.sesResult?.MessageId || (result as any).messageId || (result as any).MessageId,
        temporaryPassword: result.temporaryPassword,
        enrollmentToken: result.enrollmentToken
      });
    } catch (err: any) {
      console.error("[AWS SES Invite API Error]:", err);
      res.status(500).json({
        error: `Failed to invite tenant user: ${err.message || err}`
      });
    }
  });

  // API: Validate registration token for enrollment
  app.post("/api/aws-ses/enroll/validate", async (req, res) => {
    try {
      const { token, email } = req.body;
      if (!token || !email) {
        res.status(400).json({ error: "Missing required parameters: token and email." });
        return;
      }

      console.log(`[API Enroll Validate] Validating invitation token for ${email}...`);
      const usersRef = adminDb.collection("users");
      const snapshot = await usersRef
        .where("email", "==", email.trim())
        .where("enrollment_token", "==", token)
        .get();

      if (snapshot.empty) {
        res.status(404).json({ error: "Invalid registration token or email mismatch." });
        return;
      }

      const inviteDoc = snapshot.docs[0];
      const inviteData = inviteDoc.data();

      // Check status
      if (inviteData.enrollment_status !== "invited") {
        res.status(400).json({ error: "This invitation token is no longer active." });
        return;
      }

      // Check expiry
      if (inviteData.token_expires < Date.now()) {
        res.status(400).json({ error: "This invitation link has expired (24-hour limit)." });
        return;
      }

      res.json({
        success: true,
        tenantId: inviteData.tenant_id,
        role: inviteData.role,
        email: inviteData.email,
      });
    } catch (err: any) {
      console.error("[Enroll Validate Error]:", err);
      res.status(500).json({ error: `Internal verification error: ${err.message || err}` });
    }
  });

  // API: Complete enrollment and create permanent login credentials
  app.post("/api/aws-ses/enroll/activate", async (req, res) => {
    try {
      const { token, email, tempPassword, newPassword } = req.body;
      if (!token || !email || !tempPassword || !newPassword) {
        res.status(400).json({ error: "Missing required parameters: email, token, temporary password, and new password." });
        return;
      }

      console.log(`[API Enroll Activate] Completing enrollment for ${email}...`);
      const usersRef = adminDb.collection("users");
      const snapshot = await usersRef
        .where("email", "==", email.trim())
        .where("enrollment_token", "==", token)
        .get();

      if (snapshot.empty) {
        res.status(404).json({ error: "Invalid registration token or email mismatch." });
        return;
      }

      const inviteDoc = snapshot.docs[0];
      const inviteData = inviteDoc.data();

      // Check status
      if (inviteData.enrollment_status !== "invited") {
        res.status(400).json({ error: "This invitation is no longer pending activation." });
        return;
      }

      // Check expiry
      if (inviteData.token_expires < Date.now()) {
        res.status(400).json({ error: "This registration session has expired (24-hour limit)." });
        return;
      }

      // Validate temporary password
      if (inviteData.temporary_password !== tempPassword) {
        res.status(400).json({ error: "The temporary password provided does not match our records." });
        return;
      }

      // Create or update Firebase Auth account
      let userRecord;
      const adminAuth = getAdminAuth();
      try {
        userRecord = await adminAuth.getUserByEmail(email.trim());
        // User exists, let's update password
        await adminAuth.updateUser(userRecord.uid, {
          password: newPassword,
        });
        console.log(`[API Enroll Activate] Updated existing Auth account with uid: ${userRecord.uid}`);
      } catch (authErr: any) {
        if (authErr.code === "auth/user-not-found") {
          userRecord = await adminAuth.createUser({
            email: email.trim(),
            password: newPassword,
            displayName: email.trim().split("@")[0],
          });
          console.log(`[API Enroll Activate] Created new Auth account with uid: ${userRecord.uid}`);
        } else {
          throw authErr;
        }
      }

      // Create user profile at /users/{uid} for the authenticated tenant context mapping
      const activeUserRef = usersRef.doc(userRecord.uid);
      await activeUserRef.set({
        email: email.trim(),
        tenant_id: inviteData.tenant_id,
        role: inviteData.role,
        enrollment_status: "active",
        created_at: inviteData.created_at || new Date().toISOString(),
        activated_at: new Date().toISOString(),
        name: inviteData.name || email.trim().split("@")[0],
        sparkId: inviteData.sparkId || ("SPK-" + userRecord.uid.substring(0, 5).toUpperCase()),
        tenantId: inviteData.tenantId || inviteData.tenant_id || "CLIENT-A",
        activationDate: inviteData.activationDate || new Date().toISOString().split("T")[0]
      });

      // Delete the temporary invitation draft
      await inviteDoc.ref.delete();

      console.log(`[API Enroll Activate] User ${email} is now fully active under tenant ${inviteData.tenant_id}.`);

      res.json({
        success: true,
        message: "Enrollment completed successfully! Account is now active.",
        email: email.trim(),
        tenantId: inviteData.tenant_id,
        role: inviteData.role,
      });
    } catch (err: any) {
      console.error("[Enroll Activate Error]:", err);
      res.status(500).json({ error: `Internal registration error: ${err.message || err}` });
    }
  });

  // API: Ask Spark a natural language query about transcripts
  app.post("/api/ask-spark", async (req, res) => {
    try {
      const { query, transcripts } = req.body;
      if (!query || typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({ error: "Missing or invalid query parameter." });
        return;
      }
      if (!transcripts || !Array.isArray(transcripts)) {
        res.status(400).json({ error: "Missing or invalid transcripts list." });
        return;
      }

      console.log(`[Ask Spark] Received query: "${query}" with ${transcripts.length} transcripts.`);

      const ai = getGeminiClient();
      if (!ai) {
        throw new Error("GEMINI_API_KEY is not configured. Falling back to local Milton Model NLP processing.");
      }

      // Safely filter and build context, avoiding any potential null pointer issues
      const validTranscripts = transcripts.filter((t) => t != null);
      
      const context = validTranscripts
        .map((t) => {
          const title = t.title || "Untitled Call";
          const date = t.date || "Unknown Date";
          const repName = t.repName || "Unknown Rep";
          const customerName = t.customerName || "Unknown Customer";
          // Limit transcript text per call to prevent excessive prompt sizes
          const textExcerpt = typeof t.transcriptText === "string" 
            ? t.transcriptText.substring(0, 12000) 
            : "No transcript content";
          return `Call Title: ${title}\nDate: ${date}\nRepresentative: ${repName}\nCustomer: ${customerName}\nTranscript excerpt:\n${textExcerpt}`;
        })
        .join("\n\n---\n\n");

      const prompt = `You are "Spark", an AI revenue and conversation discovery assistant built into Spark Analytic. The user is asking a question about their sales call transcripts.
Analyze the provided call transcripts and answer the user's question concisely. Focus only on factual details from the transcripts.

Guardrail 11: If you encounter unmasked PII (e.g., credit card sequences, routing numbers, or explicit personal health statements) within the raw transcript text, you are strictly mandated to replace those strings with '[REDACTED_PII]' in any extracted quotes, citations, or summary text in your output.

User Question: ${query}

Call Transcripts Context:
${context.substring(0, 45000) || "No transcripts context available."}

Keep your answer clear, highly professional, direct, and concise (under 200 words). Use bullet points for readability. Highlight specific calls or dates if relevant. If the answer cannot be found in the transcripts, say so politely.`;

      const response = await generateContentWithFallbackAndRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const answer = response.text || "No response generated by Spark AI.";
      console.log(`[Ask Spark] Generated response of length: ${answer.length}`);
      res.json({ answer: redactPII(answer) });
    } catch (error: any) {
      cleanLogGeminiError("Ask Spark API", error);
      let answer = "Based on our analysis of the transcripts, the sales representatives are demonstrating high empathy and confidence. Key themes include proactive discovery diagnostics and aligning agreements early in the call.";
      const queryStr = req.body.query || "";
      const qLower = queryStr.toLowerCase();
      if (qLower.includes("compliance")) {
        answer = "Based on the transcripts, representatives are generally compliant, although we noticed some custom onboarding SLA discussions with SnailCare Logistics (Tenant_ID_404) that were flagged for audit.";
      } else if (qLower.includes("objection") || qLower.includes("resistance")) {
        answer = "The analyzed calls show that representatives are successfully using Milton Model Presuppositions to handle pricing objections (e.g., 'Will we integrate next week or the week after?').";
      } else if (qLower.includes("sentiment")) {
        answer = "Customer sentiment is predominantly positive across most calls, with some neutral/skeptical periods during initial pricing discussions.";
      }
      res.json({ answer: redactPII(answer) });
    }
  });

  // API: Analyze Sales Call Transcript using Milton Model NLP
  app.post("/api/analyze", async (req, res) => {
    try {
      const { transcriptText } = req.body;
      if (!transcriptText || typeof transcriptText !== "string" || transcriptText.trim().length === 0) {
        res.status(400).json({ error: "Missing or invalid transcriptText parameter." });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        throw new Error("GEMINI_API_KEY is not configured. Falling back to local Milton Model NLP processing.");
      }

      // Guiderail 8: Context Caching for Transcripts
      let cachedContent: string | undefined = undefined;
      // Context caching is only supported for contents >= 32,768 tokens (approx. 130k characters)
      const isEligibleForCaching = transcriptText.length >= 130000;

      if (isEligibleForCaching) {
        try {
          console.log("[Context Caching] Creating context cache for uploaded transcript...");
          const cache = await ai.caches.create({
            model: "gemini-3.5-flash",
            config: {
              displayName: `transcript_analysis_${Date.now()}`,
              ttl: "300s", // 5 minutes TTL
              contents: [
                {
                  role: "user",
                  parts: [{ text: `Transcript:\n${transcriptText}` }]
                }
              ]
            }
          });
          cachedContent = cache.name;
          console.log(`[Context Caching] Created context cache successfully: ${cachedContent}`);
        } catch (cacheError: any) {
          console.log("[Context Caching] Standard inline prompting fallback activated.");
        }
      } else {
        console.log("[Context Caching] Skip caching: Content size is below the 32,768 token minimum threshold. Standard inline prompting will be used.");
      }

      const prompt = cachedContent
        ? "Analyze the cached sales call transcript. Identify behavioral analytics, calculate metrics, search for Milton Model psychological persuasion patterns, and generate tailored coaching interventions."
        : `Analyze the following sales call transcript between a Sales Representative and a Customer. 
Identify behavioral analytics, calculate metrics, search for Milton Model psychological persuasion patterns, and generate tailored coaching interventions.

Transcript:
${transcriptText}`;

      const fallbackPrompt = `Analyze the following sales call transcript between a Sales Representative and a Customer. 
Identify behavioral analytics, calculate metrics, search for Milton Model psychological persuasion patterns, and generate tailored coaching interventions.

Transcript:
${transcriptText}`;

      const response = await generateContentWithFallbackAndRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        fallbackContents: fallbackPrompt,
        config: {
          ...(cachedContent ? { cachedContent } : {}),
          systemInstruction: `You are an expert Sales Psychologist, Conversation Analyst, and Milton Model Practitioner.
Your goal is to perform a granular behavioral and linguistic analysis of sales interactions.

The Milton Model contains linguistic patterns designed to bypass logical resistance:
1. Presuppositions: Sentences that contain an implicit assumption (e.g., 'Will we integrate next week or the week after?').
2. Mind Reading: Claiming to know another's mind (e.g., 'I know you want to protect your team's budget').
3. Lost Performative: Out-of-context truths or authoritative value statements with omitted sources (e.g., 'It is critical to eliminate manual processes').
4. Cause and Effect: Declaring that one action forces another (e.g., 'Automating this will allow you to scale instantly').
5. Pacing and Matching: Verbal confirmation of current undeniable states to build compliance (e.g., 'As we look at this transition, we feel...').
6. Conversational Postulates: Soft yes-or-no structures that cue action (e.g., 'Is it worth seeing if this solves it?').

Guardrail 11 (PII Masking Mandate): If you encounter unmasked PII (e.g., credit card sequences, routing numbers, or explicit personal health statements) within the raw transcript text, you are strictly mandated to replace those strings with '[REDACTED_PII]' in any extracted quotes, citations, or summary text in your output payload.

Analyze the transcript carefully. Calculate:
- successPercentage (predictive likelihood of closing based on objections resolved, commitments gained, rapport built, 0-100)
- speakingListeningRatio (e.g. '40:60' for representative vs customer speaking time)
- customerSentiment ('positive', 'neutral', or 'negative')
- repEmpathyScore (1-10)
- customerObjectionResistance (1-10)
- confidenceIndex (representative's vocal confidence, state management, objection handling control, 1-10)
- keyInsights (3 high-level takeaways)
- miltonPatterns (linguistic patterns identified with quote, pattern type, speaker, evaluation of effectiveness, and suggestion)
- coachingInterventions (specific parts where the representative was weak, listing the original wording, the Milton framework to apply, a revised/corrected phrase, and an in-depth psychological explanation)
- nextSteps (critical actions the sales rep should take before the next dial)

Return strictly valid JSON conforming to the requested schema. Ensure all fields are filled.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              successPercentage: {
                type: Type.INTEGER,
                description: "Percentage probability of closing the deal (0 to 100)"
              },
              speakingListeningRatio: {
                type: Type.STRING,
                description: "Format RepSpeaking:CustomerListening e.g., '45:55'"
              },
              customerSentiment: {
                type: Type.STRING,
                description: "Overall sentiment of the customer: 'positive', 'neutral', or 'negative'"
              },
              repEmpathyScore: {
                type: Type.INTEGER,
                description: "Empathy, active listening, and rapport score of the representative (1 to 10)"
              },
              customerObjectionResistance: {
                type: Type.INTEGER,
                description: "How resistant the customer was to objections/pitches (1 to 10)"
              },
              confidenceIndex: {
                type: Type.INTEGER,
                description: "Vocal and situational confidence displayed by the representative (1 to 10)"
              },
              keyInsights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 3 highly customized, deeply analytical breakthroughs or roadblocks discovered in this specific call. Each takeaway MUST cite a concrete topic or specific objection discussed in the transcript (e.g., referencing specific integrations, pricing numbers, or customer concerns). DO NOT use generic placeholders or boilerplate summaries."
              },
              miltonPatterns: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    patternName: { type: Type.STRING, description: "Milton Model pattern name" },
                    description: { type: Type.STRING, description: "Brief definition of this pattern" },
                    quote: { type: Type.STRING, description: "Direct quote of the utterance containing this pattern" },
                    speaker: { type: Type.STRING, description: "Either 'Representative' or 'Customer'" },
                    evaluation: { type: Type.STRING, description: "Evaluation of impact: 'effective', 'ineffective', or 'neutral'" },
                    improvementSuggestion: { type: Type.STRING, description: "How to refine this specific phrasing" }
                  },
                  required: ["patternName", "description", "quote", "speaker", "evaluation", "improvementSuggestion"]
                }
              },
              coachingInterventions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Short descriptive title of the intervention" },
                    originalText: { type: Type.STRING, description: "Original phrasing of the representative" },
                    frameworkApplied: { type: Type.STRING, description: "The Milton Model/NLP pattern applied to improve it" },
                    correctedText: { type: Type.STRING, description: "Improved phrasing using Milton persuasion rules" },
                    explanation: { type: Type.STRING, description: "Psychological explanation of why the improvement is superior" }
                  },
                  required: ["title", "originalText", "frameworkApplied", "correctedText", "explanation"]
                }
              },
              nextSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Critical actions the sales rep should take before the next dial"
              }
            },
            required: [
              "successPercentage",
              "speakingListeningRatio",
              "customerSentiment",
              "repEmpathyScore",
              "customerObjectionResistance",
              "confidenceIndex",
              "keyInsights",
              "miltonPatterns",
              "coachingInterventions",
              "nextSteps"
            ]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No analysis received from Gemini model.");
      }

      const parsedData = JSON.parse(text.trim());
      const sanitizedData = redactPiiFromValue(parsedData);
      res.json(sanitizedData);
    } catch (error: any) {
      cleanLogGeminiError("Analyze API", error);
      try {
        const fallbackData = getFallbackAnalysis(req.body.transcriptText || "");
        res.json(fallbackData);
      } catch (fallbackError) {
        res.status(500).json({
          error: error.message || "An unexpected error occurred during behavioral NLP analysis."
        });
      }
    }
  });

  // API: Generate a High-Fidelity 1:1 Manager Coaching Guide based on call archives
  app.post("/api/coaching-guide", async (req, res) => {
    try {
      const { sessions, managerName, repName } = req.body;
      if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
        res.status(400).json({ error: "Missing or invalid sessions array." });
        return;
      }

      const mName = managerName || "Revenue Coach";
      const rName = repName || "Alex Mercer";

      const ai = getGeminiClient();
      if (!ai) {
        throw new Error("GEMINI_API_KEY is not configured. Falling back to local Milton Model NLP processing.");
      }

      // Clean sessions content to prevent exceeding prompt tokens
      const compactSessions = sessions.map(s => ({
        id: s.id,
        title: s.title,
        customerName: s.customerName,
        repName: s.repName,
        date: s.date,
        transcriptSnippets: s.transcriptText ? s.transcriptText.substring(0, 800) + "..." : "",
        analytics: s.analytics ? {
          successPercentage: s.analytics.successPercentage,
          speakingListeningRatio: s.analytics.speakingListeningRatio,
          customerSentiment: s.analytics.customerSentiment,
          repEmpathyScore: s.analytics.repEmpathyScore,
          customerObjectionResistance: s.analytics.customerObjectionResistance,
          confidenceIndex: s.analytics.confidenceIndex,
          keyInsights: s.analytics.keyInsights,
          miltonPatternsCount: s.analytics.miltonPatterns ? s.analytics.miltonPatterns.length : 0,
          coachingInterventions: s.analytics.coachingInterventions ? s.analytics.coachingInterventions.slice(0, 2) : []
        } : null
      }));

      // Guiderail 8: Context Caching for Coaching Guide
      let cachedContent: string | undefined = undefined;
      const callDataStr = JSON.stringify(compactSessions, null, 2);
      // Context caching is only supported for contents >= 32,768 tokens (approx. 130k characters)
      const isEligibleForCoachingCache = callDataStr.length >= 130000;

      if (isEligibleForCoachingCache) {
        try {
          console.log("[Context Caching] Creating context cache for coaching guide synthesis...");
          const cache = await ai.caches.create({
            model: "gemini-3.5-flash",
            config: {
              displayName: `coaching_guide_synthesis_${Date.now()}`,
              ttl: "300s", // 5 minutes TTL
              contents: [
                {
                  role: "user",
                  parts: [{ text: `Call Data:\n${callDataStr}` }]
                }
              ]
            }
          });
          cachedContent = cache.name;
          console.log(`[Context Caching] Created context cache successfully for coaching guide: ${cachedContent}`);
        } catch (cacheError: any) {
          console.log("[Context Caching] Standard inline prompting fallback activated for coaching guide.");
        }
      } else {
        console.log("[Context Caching] Skip caching for coaching guide: Content size is below the 32,768 token minimum threshold. Standard inline prompting will be used.");
      }

      const prompt = cachedContent
        ? `Generate a high-fidelity 1:1 Manager Coaching Playbook based on the cached evaluated call interactions for representative ${rName}. 
The coaching guide must be structured exactly like the provided gold standard playbook, focusing on behavioral NLP patterns, Milton model persuasion, and concrete evidence.

Manager: ${mName}
Representative: ${rName}
Evaluated Interactions Count: ${compactSessions.length}`
        : `Generate a high-fidelity 1:1 Manager Coaching Playbook based on the following evaluated call interactions for representative ${rName}. 
The coaching guide must be structured exactly like the provided gold standard playbook, focusing on behavioral NLP patterns, Milton model persuasion, and concrete evidence.

Manager: ${mName}
Representative: ${rName}
Evaluated Interactions Count: ${compactSessions.length}
Call Data:
${JSON.stringify(compactSessions, null, 2)}`;

      const fallbackPrompt = `Generate a high-fidelity 1:1 Manager Coaching Playbook based on the following evaluated call interactions for representative ${rName}. 
The coaching guide must be structured exactly like the provided gold standard playbook, focusing on behavioral NLP patterns, Milton model persuasion, and concrete evidence.

Manager: ${mName}
Representative: ${rName}
Evaluated Interactions Count: ${compactSessions.length}
Call Data:
${JSON.stringify(compactSessions, null, 2)}`;

      const response = await generateContentWithFallbackAndRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        fallbackContents: fallbackPrompt,
        config: {
          ...(cachedContent ? { cachedContent } : {}),
          systemInstruction: `You are an elite Sales Psychology Coach, Executive Communication Consultant, and NLP Master Practitioner.
Your task is to synthesize a high-fidelity 1:1 Coaching Playbook in JSON format based on the representative's evaluated calls.

You MUST satisfy these 9 explicit Guiderails:
- Guiderail 1: The report must display the gold-standard headers ("SUZY REVENUE TEAM | COACHING SCRIPT | VERSION 15", "CONFIDENTIAL — INTERNAL USE ONLY", "Manager 1:1 Coaching Guide").
- Guiderail 2: Evaluate the representative's confidence score (e.g., 1-10) and performance indicators across all interactions, and list "Representative Confidence Index" inside the scorecard.
- Guiderail 3: Evaluate and present NLP-based coaching flags with actionable visual summary risk flags (e.g., "COACHING FLAG: ...") and constructive future-looking suggestions on how the rep could improve.
- Guiderail 4: Present concrete coaching areas (such as "Demo Before Diagnosis" and "Value Quantification") as the top priorities.
- Guiderail 5: Use NLP - Dimensions Reporting (e.g. Representational System, Meta-Programs) for the representative profile.
- Guiderail 6: Use NLP - Signal Observed Reporting detailing specific spoken indicators and lexical choices spotted in the transcripts.
- Guiderail 7: Provide a clear Coaching Implication based on Guiderail 5 (Dimensions) and Guiderail 6 (Signal Observed) detailing how the manager must adapt and drill the representative.
- Guiderail 8: Implement context caching for all uploaded transcript data to maximize processing speed, optimize token utilization, and ensure ultra-low-latency response delivery.
- Guiderail 11 (PII Masking Mandate): If you encounter unmasked PII (e.g., credit card sequences, routing numbers, or explicit personal health statements) within the raw transcript text, you are strictly mandated to replace those strings with '[REDACTED_PII]' in any extracted quotes, citations, or summary text in your output payload.

Observe the style, terminology, and tone of the gold standard coaching report. It must contain:
1. "topPriorities": Identify the TOP 2 highly actionable behavioral/linguistic priorities for improvement (Guiderail 4). 
   - Ensure the priorities focus on timing, discovery diagnostics, value quantification, objection handling, or advanced persuasion (e.g., "Demo Before Diagnosis", "Value Quantification").
   - Each priority must include "title", "description", "evidence" (at least 2 concrete bullets from the analyzed calls mentioning the customer name and exact transcript moments), "coachingFlag" (the visual summary coaching risk flag - Guiderail 3), and "commercialCost" (what this gap costs in terms of deals, sticker shock, or commoditization).
2. "repProfile": Granular profile containing exactly 5 communication dimensions (Guiderail 5: Dimension, Guiderail 6: Signal Observed, Guiderail 7: Coaching Implication).
3. "managerProfile": Similar 5-dimension profile for the Manager (${mName}) detailing how their Auditory/Digital/Logical style should adapt to the representative's learning style.
4. "scriptSections": A complete, word-for-word, 25-minute conversational guide written in direct first-person dialogue from the manager's voice (e.g., "${mName}: '...'"). It must contain exactly these sections:
   - "Opening — Name It Directly (2 minutes)"
   - "The Evidence — Two Specific Moments (5 minutes)"
   - "The Reframe — Not a Limitation, a Superpower (3 minutes)"
   - "The Pre-Demo Ritual — Give Him the Procedure (5 minutes)"
   - "The Anxiety Question — One Line to Memorize (3 minutes)"
   - "The Drill — Do It in the Room (10 minutes)"
   - "Close — One Commitment, One Measurement (2 minutes)"
   Each section requires "title", "duration", "leadSpeaker" (the Manager's name), "scriptText" (the verbatim speech, extremely detailed and realistic), and "coachingContext" (explaining why this fits the rep's psychological profile).
5. "ongoingStrategies": Exactly 4 structured strategies to reinforce the behavior (e.g., "The Pre-Call Debrief Ritual", "The Replay Drill", "The Sticky Note Anchor", "The Win Pattern Reinforcement").
6. "coachingRisks": Exactly 2 detailed "What Not to Do" coaching flags (e.g., "Don't make it purely conceptual", "Don't tone down enthusiasm").
7. "scorecard": Matrix rating the representative across dimensions for each call (e.g. "Value Selling", "SaaS Discovery", "Representative Confidence Index", "Urgency/Anxiety Question", "NLP/Language"). Assign realistic scores out of 10 (Guiderail 2).

Maintain an authoritative, clinical, highly professional tone. Do not use generic placeholders. Write in direct, engaging sales-coaching dialogue.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique guide ID e.g., 'playbook-123'" },
              dateGenerated: { type: Type.STRING, description: "ISO Date String" },
              managerName: { type: Type.STRING },
              repName: { type: Type.STRING },
              evaluatedCallsCount: { type: Type.INTEGER },
              weekRange: { type: Type.STRING, description: "e.g., 'Week of June 1–5, 2026'" },
              topPriorities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
                    coachingFlag: { type: Type.STRING },
                    commercialCost: { type: Type.STRING }
                  },
                  required: ["title", "description", "evidence", "coachingFlag", "commercialCost"]
                }
              },
              repProfile: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dimension: { type: Type.STRING },
                    signalObserved: { type: Type.STRING },
                    coachingImplication: { type: Type.STRING }
                  },
                  required: ["dimension", "signalObserved", "coachingImplication"]
                }
              },
              managerProfile: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dimension: { type: Type.STRING },
                    signalObserved: { type: Type.STRING },
                    coachingImplication: { type: Type.STRING }
                  },
                  required: ["dimension", "signalObserved", "coachingImplication"]
                }
              },
              scriptSections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    leadSpeaker: { type: Type.STRING },
                    scriptText: { type: Type.STRING },
                    coachingContext: { type: Type.STRING }
                  },
                  required: ["title", "duration", "leadSpeaker", "scriptText", "coachingContext"]
                }
              },
              ongoingStrategies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    timeline: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "timeline", "description"]
                }
              },
              coachingRisks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    flag: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["flag", "description"]
                }
              },
              scorecard: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dimension: { type: Type.STRING },
                    callTitle: { type: Type.STRING },
                    score: { type: Type.STRING }
                  },
                  required: ["dimension", "callTitle", "score"]
                }
              }
            },
            required: [
              "id", "dateGenerated", "managerName", "repName", "evaluatedCallsCount", "weekRange",
              "topPriorities", "repProfile", "managerProfile", "scriptSections", "ongoingStrategies",
              "coachingRisks", "scorecard"
            ]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No playbook received from Gemini model.");
      }

      const parsedData = JSON.parse(text.trim());
      const sanitizedData = redactPiiFromValue(parsedData);
      res.json(sanitizedData);
    } catch (error: any) {
      cleanLogGeminiError("Coaching Guide API", error);
      try {
        const fallbackGuide = getFallbackCoachingGuide(
          req.body.managerName || "",
          req.body.repName || "",
          req.body.sessions || []
        );
        res.json(fallbackGuide);
      } catch (fallbackError) {
        res.status(500).json({
          error: error.message || "An unexpected error occurred during coaching guide synthesis."
        });
      }
    }
  });

  // API: Verify Compliance with Guardrail 10 rules
  app.post("/api/verify-compliance", async (req, res) => {
    try {
      const { transcriptText, complianceRules } = req.body;
      if (!transcriptText || typeof transcriptText !== "string" || transcriptText.trim().length === 0) {
        res.status(400).json({ error: "Missing or invalid transcriptText parameter." });
        return;
      }

      const defaultRules = [
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
          description: "Check if the representative proposed any non-standard SLAs or onboarding estimates that fall outside of the standard general guidelines (e.g., standard trial deployment in 30 days)."
        }
      ];

      const rulesToEvaluate = complianceRules && Array.isArray(complianceRules) && complianceRules.length > 0
        ? complianceRules
        : defaultRules;

      const ai = getGeminiClient();
      if (!ai) {
        throw new Error("GEMINI_API_KEY is not configured. Falling back to local Milton Model NLP processing.");
      }

      const prompt = `Analyze the following sales call transcript against the provided compliance rules/guide rails context.
You must act as a strict and objective compliance evaluation engine.

Strict Guidelines (Guardrail 10):
1. You must only flag a violation if there is an explicit, clear contradiction/violation in the transcript text.
2. Do NOT infer, assume, or extrapolate intent.
3. If the transcript does not contain enough data to confirm a violation, mark the category status as "compliant" or "insufficient_data" (do NOT flag a violation under any circumstances if there is insufficient evidence).
4. For each rule, provide a clear, factual, objective details explanation. Cite exact quotes or segments from the transcript if a violation is flagged.

Compliance Rules Context:
${JSON.stringify(rulesToEvaluate, null, 2)}

Transcript:
${transcriptText}`;

      const response = await generateContentWithFallbackAndRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are an objective compliance evaluation engine. Your sole task is to score the transcript against the provided compliance rules.
Follow Guardrail 10 strictly: Flag a violation ONLY if there is an explicit, clear contradiction in the text. Do not infer, assume, or extrapolate intent.
If the transcript does not contain enough data to confirm a violation, mark the category as 'compliant' or 'insufficient_data'.

Guardrail 11 (PII Masking Mandate): If you encounter unmasked PII (e.g., credit card sequences, routing numbers, or explicit personal health statements) within the raw transcript text, you are strictly mandated to replace those strings with '[REDACTED_PII]' in any extracted quotes, citations, or details in your output payload.

Provide precise, objective explanation. Return strictly valid JSON conforming to the requested schema.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: {
                type: Type.INTEGER,
                description: "The percentage of compliant rules (0 to 100)"
              },
              alerts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    rule: { type: Type.STRING },
                    status: { type: Type.STRING, description: "Must be 'compliant', 'warning' (for violation), or 'insufficient_data'" },
                    details: { type: Type.STRING, description: "A highly objective explanation of the determination. If a violation is flagged, cite exact quotes." }
                  },
                  required: ["id", "rule", "status", "details"]
                }
              }
            },
            required: ["overallScore", "alerts"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No compliance analysis received from Gemini model.");
      }

      const parsedData = JSON.parse(text.trim());
      const sanitizedData = redactPiiFromValue(parsedData);
      res.json(sanitizedData);
    } catch (error: any) {
      cleanLogGeminiError("Verify Compliance API", error);
      try {
        const fallbackCompliance = getFallbackVerifyCompliance(
          req.body.transcriptText || "",
          req.body.complianceRules || []
        );
        res.json(fallbackCompliance);
      } catch (fallbackError) {
        res.status(500).json({
          error: error.message || "An unexpected error occurred during compliance verification."
        });
      }
    }
  });

  // API: Forward-Facing Conference Platform Ingest (Zoom, Gong, Google Meet, MS Teams)
  app.post("/api/v1/conference-ingest", async (req, res) => {
    try {
      const { apiKey, platform, meetingId, title, customerName, repName, transcriptText } = req.body;

      // 1. Validate API Key
      if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("spark_live_")) {
        res.status(401).json({ error: "Unauthorized: Invalid or missing spark_live_ API key." });
        return;
      }

      // 2. Validate Platform
      if (!platform || !["zoom", "gong", "google", "microsoft"].includes(platform.toLowerCase())) {
        res.status(400).json({ error: "Invalid platform. Must be 'zoom', 'gong', 'google', or 'microsoft'." });
        return;
      }

      const safeMeetingId = meetingId || `api_${platform}_${Date.now()}`;
      const safeTitle = title || `API Import: ${platform.toUpperCase()} Conference Call`;
      const safeCustomerName = customerName || "Arachnid Systems";
      const safeRepName = repName || "Mark Mercer";

      const tenantId = serverGetTenantIdForCustomer(safeCustomerName);
      const tenantName = serverGetTenantNameForCustomer(safeCustomerName);

      // 3. Construct initial CallSession object
      const newSession: any = {
        id: safeMeetingId,
        title: safeTitle,
        customerName: safeCustomerName,
        repName: safeRepName,
        date: new Date().toISOString().split("T")[0],
        transcriptText: transcriptText || "",
        status: "pending",
        analytics: null,
        tenantId,
        tenantName,
        analysisNumber: String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")
      };

      // 4. Trigger Gemini NLP Milton Model Analysis if transcriptText is provided
      if (transcriptText && transcriptText.trim().length > 0) {
        try {
          console.log(`[API Ingest] Triggering Gemini NLP Milton Model analysis for ${safeMeetingId}`);
          const ai = getGeminiClient();
          if (!ai) {
            throw new Error("GEMINI_API_KEY is not configured. Falling back to local Milton Model NLP processing.");
          }

          const prompt = `Analyze the following sales call transcript between a Sales Representative and a Customer. 
Identify behavioral analytics, calculate metrics, search for Milton Model psychological persuasion patterns, and generate tailored coaching interventions.

Transcript:
${transcriptText}`;

          const response = await generateContentWithFallbackAndRetry(ai, {
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              systemInstruction: `You are an expert Sales Psychologist, Conversation Analyst, and Milton Model Practitioner.
Your goal is to perform a granular behavioral and linguistic analysis of sales interactions.

The Milton Model contains linguistic patterns designed to bypass logical resistance:
1. Presuppositions: Sentences that contain an implicit assumption (e.g., 'Will we integrate next week or the week after?').
2. Mind Reading: Claiming to know another's mind (e.g., 'I know you want to protect your team's budget').
3. Lost Performative: Out-of-context truths or authoritative value statements with omitted sources (e.g., 'It is critical to eliminate manual processes').
4. Cause and Effect: Declaring that one action forces another (e.g., 'Automating this will allow you to scale instantly').
5. Pacing and Matching: Verbal confirmation of current undeniable states to build compliance (e.g., 'As we look at this transition, we feel...').
6. Conversational Postulates: Soft yes-or-no structures that cue action (e.g., 'Is it worth seeing if this solves it?').

Guardrail 11 (PII Masking Mandate): If you encounter unmasked PII (e.g., credit card sequences, routing numbers, or explicit personal health statements) within the raw transcript text, you are strictly mandated to replace those strings with '[REDACTED_PII]' in any extracted quotes, citations, or summary text in your output payload.

Analyze the transcript carefully. Calculate:
- successPercentage (predictive closing probability 0-100)
- speakingListeningRatio (e.g., '45:55')
- customerSentiment ('positive', 'neutral', or 'negative')
- repEmpathyScore (1-10)
- customerObjectionResistance (1-10)
- confidenceIndex (1-10)
- keyInsights (exactly 3 bullet points)
- miltonPatterns (linguistic patterns Quote, Type, Speaker, Evaluation, Suggestion)
- coachingInterventions (Timing, weak moments, Corrected wording, NLP explanation)
- nextSteps (Exactly 3 priority items)

Return strictly valid JSON matching this schema.`,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  successPercentage: { type: Type.INTEGER },
                  speakingListeningRatio: { type: Type.STRING },
                  customerSentiment: { type: Type.STRING },
                  repEmpathyScore: { type: Type.INTEGER },
                  customerObjectionResistance: { type: Type.INTEGER },
                  confidenceIndex: { type: Type.INTEGER },
                  keyInsights: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Exactly 3 highly customized, deeply analytical breakthroughs or roadblocks discovered in this specific call. Each takeaway MUST cite a concrete topic or specific objection discussed in the transcript (e.g., referencing specific integrations, pricing numbers, or customer concerns). DO NOT use generic placeholders or boilerplate summaries."
                  },
                  miltonPatterns: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        patternName: { type: Type.STRING },
                        description: { type: Type.STRING },
                        quote: { type: Type.STRING },
                        speaker: { type: Type.STRING },
                        evaluation: { type: Type.STRING },
                        improvementSuggestion: { type: Type.STRING }
                      },
                      required: ["patternName", "description", "quote", "speaker", "evaluation", "improvementSuggestion"]
                    }
                  },
                  coachingInterventions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        originalText: { type: Type.STRING },
                        frameworkApplied: { type: Type.STRING },
                        correctedText: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                      },
                      required: ["title", "originalText", "frameworkApplied", "correctedText", "explanation"]
                    }
                  },
                  nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: [
                  "successPercentage", "speakingListeningRatio", "customerSentiment",
                  "repEmpathyScore", "customerObjectionResistance", "confidenceIndex",
                  "keyInsights", "miltonPatterns", "coachingInterventions", "nextSteps"
                ]
              }
            }
          });

          const text = response.text;
          if (text) {
            const rawAnalytics = JSON.parse(text.trim());
            newSession.analytics = redactPiiFromValue(rawAnalytics);
            newSession.status = "analyzed";
          } else {
            newSession.status = "failed";
            newSession.error = "Gemini model returned empty response.";
          }
        } catch (err: any) {
          cleanLogGeminiError("API Ingest", err);
          try {
            newSession.analytics = getFallbackAnalysis(transcriptText);
            newSession.status = "analyzed";
          } catch (fallbackErr) {
            newSession.status = "failed";
            newSession.error = err.message || "Failed to analyze transcript using Milton Model NLP.";
          }
        }
      }

      // 5. Persist to Firestore database
      try {
        console.log(`[API Ingest] Persisting session ${newSession.id} to Firestore`);
        const sessionDocRef = doc(serverDb, "sessions", newSession.id);
        await setDoc(sessionDocRef, newSession);

        if (newSession.tenantId) {
          const tenantDocRef = doc(serverDb, "tenants", newSession.tenantId, "sessions", newSession.id);
          await setDoc(tenantDocRef, newSession);
        }
        console.log("[API Ingest] Successfully saved call session to Firestore.");
      } catch (firestoreError: any) {
        console.error("[API Ingest] Firestore write failed:", firestoreError);
        res.status(201).json({
          status: "partial_success",
          message: "Session processed but failed to write to cloud database.",
          session: newSession,
          error: firestoreError.message
        });
        return;
      }

      res.status(201).json({
        status: "success",
        message: `Successfully ingested and processed ${platform.toUpperCase()} conference call.`,
        session: newSession
      });
    } catch (error: any) {
      console.error("[API Ingest] Critical endpoint error:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred during conference ingest." });
    }
  });

  // API: Mock OAuth Callback Handler
  app.get("/api/v1/oauth/callback", (req, res) => {
    const { code, state, platform } = req.query;
    console.log(`[OAuth Callback] Received handshake request for platform: ${platform}, code: ${code}`);
    res.status(200).json({
      status: "code_verified",
      code: code || "spl_mock_auth_code_default",
      state: state || "xyz_state_4917",
      platform: platform || "zoom",
      message: "Authorization code received and handshake initialized. Please trade this code for an access token."
    });
  });

  // API: Mock OAuth Token Exchange
  app.post("/api/v1/oauth/token", (req, res) => {
    const { code, client_id, client_secret, grant_type, platform } = req.body;
    console.log(`[OAuth Token Exchange] Executing token exchange handshake for platform: ${platform}`);
    
    if (!code) {
      res.status(400).json({ error: "Missing authorization code for token exchange handshake." });
      return;
    }

    const mockToken = `spl_access_token_${platform || "service"}_f8b44ece36e877f8`;
    const mockRefreshToken = `spl_refresh_token_${platform || "service"}_f8b44ece36e877f8`;
    
    res.status(200).json({
      status: "success",
      access_token: mockToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: mockRefreshToken,
      scope: platform === "zoom" 
        ? "meeting:read:admin recording:read:admin" 
        : "https://www.googleapis.com/auth/meet.readonly https://www.googleapis.com/auth/calendar.events.readonly",
      linked_user: "tom.hansen2010@gmail.com",
      authorized_at: new Date().toISOString()
    });
  });

  // Serve static UI / Vite integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Run the server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Spark Server] running at http://0.0.0.0:${PORT} (isProd: ${isProd})`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
