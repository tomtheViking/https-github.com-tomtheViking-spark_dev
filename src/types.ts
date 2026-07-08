export interface MiltonPatternMatch {
  patternName: string;
  description: string;
  quote: string;
  speaker: 'Representative' | 'Customer';
  evaluation: 'effective' | 'ineffective' | 'neutral';
  improvementSuggestion: string;
}

export interface CoachingIntervention {
  title: string;
  originalText: string;
  frameworkApplied: string;
  correctedText: string;
  explanation: string;
}

export interface CallAnalytics {
  successPercentage: number; // 0 to 100
  speakingListeningRatio: string; // e.g. "40:60"
  customerSentiment: 'positive' | 'neutral' | 'negative';
  repEmpathyScore: number; // 1 to 10
  customerObjectionResistance: number; // 1 to 10
  confidenceIndex: number; // 1 to 10
  keyInsights: string[];
  miltonPatterns: MiltonPatternMatch[];
  coachingInterventions: CoachingIntervention[];
  nextSteps: string[];
}

export interface CustomerFeedback {
  id: string;
  timestamp: string;
  author: string;
  type: 'question' | 'objection' | 'comment';
  message: string;
}

export interface ClientConfiguration {
  months: number;
  users: number;
  coachingEnabled: boolean;
  diagnosticsEnabled: boolean;
  totalMonthlyCost: number;
}

export interface CallSession {
  id: string;
  title: string;
  customerName: string;
  repName: string;
  date: string;
  transcriptText: string;
  analytics: CallAnalytics | null;
  status: 'pending' | 'analyzed' | 'failed';
  error?: string;
  customerFeedback?: CustomerFeedback[];
  clientConfig?: ClientConfiguration;
  analysisNumber?: string;
  tenantId?: string;
  tenantName?: string;
}

export interface MetricTrendPoint {
  date: string;
  successPercentage: number;
  empathyScore: number;
  confidenceIndex: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  authorizedAccess: string;
  status: 'Active' | 'Offline';
}

export interface SupportTicket {
  id: string;
  title: string;
  tenantId: string;
  tenantName: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "Open" | "In Progress" | "Resolved";
  customerMessage: string;
  createdAt: string;
  matchingTelemetryIds: string[];
  resolvedAt?: string;
}


