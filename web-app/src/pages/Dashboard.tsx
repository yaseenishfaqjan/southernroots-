import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Users,
  BarChart2,
  Wrench,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import KpiCard from "../components/KpiCard";
import StatusBadge from "../components/StatusBadge";
import { api, formatMoney, formatDate } from "../lib/api";

interface Summary {
  totalRevenueCentsThisMonth: number;
  mrrCents: number;
  jobsCompletedThisWeek: number;
  newLeadsThisWeek: number;
  quoteConversionRate: number;
  crewUtilization: number;
  outstandingInvoicesCount: number;
  outstandingInvoicesCents: number;
  staleLeadsCount: number;
  openEscalationsCount: number;
  churnRiskCount: number;
}

interface KpiSnapshot {
  date: string;
  totalRevenueCents: number;
  jobsCompleted: number;
  crewUtilization: number;
  mrrCents: number;
}

interface Job {
  id: number;
  serviceType: string;
  status: string;
  scheduledDate: string | null;
  priceCents: number;
  customerName?: string;
}

export default function Dashboard() {
  const { data: summary, isLoading } = useQuery<Summary>({
    queryKey: ["dashboard-summary"],
    queryFn: () => api.get("/dashboard/summary"),
    refetchInterval: 60_000,
  });

  const { data: history } = useQuery<KpiSnapshot[]>({
    queryKey: ["kpi-history"],
    queryFn: () => api.get("/dashboard/kpis/history"),
  });

  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["jobs-recent"],
    queryFn: () => api.get("/jobs?limit=8"),
  });

  const chartData = (history ?? []).slice(-14).map((k) => ({
    date: new Date(k.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: k.totalRevenueCents / 100,
    jobs: k.jobsCompleted,
    utilization: Math.round(k.crewUtilization * 100),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Real-time business overview — all AI agents active
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Revenue (MTD)"
          value={formatMoney(summary?.totalRevenueCentsThisMonth ?? 0)}
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
          trend="up"
        />
        <KpiCard
          title="MRR"
          value={formatMoney(summary?.mrrCents ?? 0)}
          subtitle="Monthly recurring"
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <KpiCard
          title="Jobs (This Week)"
          value={String(summary?.jobsCompletedThisWeek ?? 0)}
          icon={<Briefcase className="w-5 h-5" />}
          color="purple"
        />
        <KpiCard
          title="New Leads"
          value={String(summary?.newLeadsThisWeek ?? 0)}
          subtitle="This week"
          icon={<Users className="w-5 h-5" />}
          color="orange"
        />
        <KpiCard
          title="Quote Conversion"
          value={`${Math.round((summary?.quoteConversionRate ?? 0) * 100)}%`}
          icon={<BarChart2 className="w-5 h-5" />}
          color="green"
        />
        <KpiCard
          title="Crew Utilization"
          value={`${Math.round((summary?.crewUtilization ?? 0) * 100)}%`}
          icon={<Wrench className="w-5 h-5" />}
          color="blue"
          trend={(summary?.crewUtilization ?? 0) >= 0.75 ? "up" : "down"}
        />
        <KpiCard
          title="Outstanding Invoices"
          value={formatMoney(summary?.outstandingInvoicesCents ?? 0)}
          subtitle={`${summary?.outstandingInvoicesCount ?? 0} invoices`}
          icon={<FileText className="w-5 h-5" />}
          color="orange"
        />
        <KpiCard
          title="Churn Risk Alerts"
          value={String(summary?.churnRiskCount ?? 0)}
          subtitle={`${summary?.openEscalationsCount ?? 0} open escalations`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
          trend={(summary?.churnRiskCount ?? 0) > 3 ? "down" : "neutral"}
        />
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Revenue — Last 14 Days
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id="colorRevenue"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#16a34a"
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="95%"
                    stopColor="#16a34a"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(v: number) => [
                  `$${v.toLocaleString()}`,
                  "Revenue",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#16a34a"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            Recent Jobs
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(jobs ?? []).map((job) => (
            <div
              key={job.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {job.serviceType.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {job.customerName ?? `Job #${job.id}`} ·{" "}
                  {formatDate(job.scheduledDate)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-900">
                  {formatMoney(job.priceCents)}
                </span>
                <StatusBadge status={job.status} />
              </div>
            </div>
          ))}
          {!jobs?.length && (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              No jobs yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
