import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Zap,
  BarChart3,
  Truck,
  Receipt,
  TrendingUp,
  HeartHandshake,
  MessageSquare,
  Brain,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { api, formatDate } from "../lib/api";

interface AiDecision {
  id: number;
  agent: string;
  input: unknown;
  output: unknown;
  reasoning: string | null;
  executedAt: string;
  success?: boolean;
}

const AGENT_META: Record<string, { label: string; icon: LucideIcon; bg: string; fg: string }> = {
  quote: { label: "Quote Agent", icon: Zap, bg: "bg-green-100", fg: "text-green-700" },
  briefing: { label: "Briefing Agent", icon: BarChart3, bg: "bg-blue-100", fg: "text-blue-700" },
  dispatch: { label: "Dispatch Agent", icon: Truck, bg: "bg-purple-100", fg: "text-purple-700" },
  billing: { label: "Billing Agent", icon: Receipt, bg: "bg-orange-100", fg: "text-orange-700" },
  upsell: { label: "Upsell Agent", icon: TrendingUp, bg: "bg-pink-100", fg: "text-pink-700" },
  churn: { label: "Churn Agent", icon: HeartHandshake, bg: "bg-red-100", fg: "text-red-700" },
  communication: { label: "Communication Agent", icon: MessageSquare, bg: "bg-indigo-100", fg: "text-indigo-700" },
};

// Turn an agent's structured input/output into one clean human sentence.
function summarize(d: AiDecision): string {
  const input = (d.input ?? {}) as Record<string, unknown>;
  const output = (d.output ?? {}) as Record<string, unknown>;
  switch (d.agent) {
    case "quote": {
      const addr = typeof input.address === "string" ? input.address : null;
      const pricing = output.pricing as { totalMonthly?: number } | undefined;
      const total = pricing?.totalMonthly;
      return addr
        ? `Measured & quoted ${addr.split(",")[0]}${total ? ` — $${total}/mo` : ""}`
        : "Generated a customer quote";
    }
    case "briefing":
      return "Generated the daily owner briefing";
    case "dispatch":
      return "Assigned crews and optimized routes";
    case "billing":
      return "Created and sent an invoice";
    case "upsell": {
      const sent = output.sent as number | undefined;
      return sent != null ? `Sent ${sent} personalized upsell email${sent === 1 ? "" : "s"}` : "Scanned for upsell opportunities";
    }
    case "churn":
      return "Scored churn risk and sent win-back outreach";
    case "communication":
      return "Replied to a customer message";
    default:
      return "Ran an autonomous action";
  }
}

function DecisionCard({ d }: { d: AiDecision }) {
  const [open, setOpen] = useState(false);
  const meta = AGENT_META[d.agent] ?? { label: d.agent, icon: Brain, bg: "bg-gray-100", fg: "text-gray-700" };
  const Icon = meta.icon;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.fg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.bg} ${meta.fg}`}>{meta.label}</span>
            <span className="flex-shrink-0 text-xs text-gray-400">{formatDate(d.executedAt)}</span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-gray-900">{summarize(d)}</p>
          {d.reasoning && <p className="mt-1 text-sm leading-relaxed text-gray-500">{d.reasoning}</p>}
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} /> Technical details
          </button>
          {open && (
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
              {JSON.stringify({ input: d.input, output: d.output }, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Decisions() {
  const { data: decisions, isLoading } = useQuery<AiDecision[]>({
    queryKey: ["ai-decisions"],
    queryFn: async () => {
      const r = await api.get<{ data: AiDecision[] } | AiDecision[]>("/ai/decisions");
      return Array.isArray(r) ? r : r.data;
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Activity</h1>
        <p className="mt-1 text-sm text-gray-500">
          Everything your AI agents have done automatically — live feed, refreshes every 30s
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      )}

      {!isLoading && !decisions?.length && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <Brain className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No AI activity yet</p>
          <p className="mt-1 text-sm text-gray-500">When a lead comes in or an agent runs, you'll see it here.</p>
        </div>
      )}

      <div className="space-y-3">
        {decisions?.map((d) => (
          <DecisionCard key={d.id} d={d} />
        ))}
      </div>
    </div>
  );
}
