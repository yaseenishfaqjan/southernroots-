// ─── Shared domain types consumed by both api-server and frontend apps ───────

export type CustomerTier = "standard" | "premium" | "suspended";
export type JobStatus = "new" | "assigned" | "in_progress" | "complete" | "paid" | "cancelled";
export type AssignmentStatus = "pending" | "in_progress" | "complete";
export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type EscalationStatus = "open" | "in_review" | "resolved";
export type AgentName = "quote" | "dispatch" | "communication" | "billing" | "briefing" | "upsell" | "churn";

export interface QuoteService {
  name: string;
  price: number; // dollars (for display)
  description: string;
}

export interface DashboardSummary {
  totalRevenueCentsThisMonth: number;
  mrrCents: number;
  jobsCompletedThisWeek: number;
  newLeadsThisWeek: number;
  quoteConversionRate: number; // 0–1
  crewUtilization: number; // 0–1
  outstandingInvoicesCount: number;
  outstandingInvoicesCents: number;
  staleLeadsCount: number;
  openEscalationsCount: number;
  churnRiskCount: number;
}

export interface WorkerWithLoad {
  id: number;
  name: string;
  phone: string;
  specialty: string;
  rating: number;
  completionRate: number;
  currentJobCount: number;
  isActive: boolean;
  todayJobCount: number;
}

export interface JobWithCustomer {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  status: JobStatus;
  scheduledDate: string | null;
  completedAt: string | null;
  priceCents: number;
  notes: string | null;
  workerName: string | null;
  createdAt: string;
}

export interface UpsellOpportunity {
  customerId: number;
  customerName: string;
  phone: string;
  trigger: string;
  suggestedService: string;
  estimatedRevenueCents: number;
  churnRisk: number;
}
