import { useQuery } from "@tanstack/react-query";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
  useGetRecentJobs,
} from "@workspace/api-client-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { JobStatusBadge } from "@/components/jobs/status-badge";
import { Link, useLocation } from "wouter";
import {
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Plus,
  ArrowRight,
  Activity,
  Leaf,
  Zap,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { brand } from "@workspace/brand";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const STATUS_COLORS: Record<string, string> = {
  new: "#f59e0b",
  assigned: "#3b82f6",
  in_progress: "#8b5cf6",
  complete: "#10b981",
  paid: "#059669",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New Leads",
  assigned: "Assigned",
  in_progress: "In Progress",
  complete: "Complete",
  paid: "Paid",
};

const SERVICE_COLORS = ["#16a34a", "#15803d", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "default",
  alert = false,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color?: "default" | "green" | "blue" | "amber" | "red" | "purple";
  alert?: boolean;
}) {
  const colorMap = {
    default: "bg-gray-100 text-gray-600",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <Card className={`relative overflow-hidden ${alert ? "border-amber-300 bg-amber-50/40" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold tracking-tight ${color === "green" ? "text-green-700" : color === "red" ? "text-red-600" : "text-foreground"}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {alert && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400 rounded-b" />
        )}
      </CardContent>
    </Card>
  );
}

function PipelineBar({ pipeline }: { pipeline: { status: string; jobs: number }[] }) {
  const total = pipeline.reduce((s, p) => s + p.jobs, 0) || 1;

  return (
    <div className="space-y-3">
      {pipeline.map(({ status, jobs }) => (
        <div key={status} className="flex items-center gap-3">
          <div className="w-24 text-xs font-medium text-right text-muted-foreground shrink-0">
            {STATUS_LABELS[status]}
          </div>
          <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
              style={{
                width: `${Math.max((jobs / total) * 100, jobs > 0 ? 8 : 0)}%`,
                backgroundColor: STATUS_COLORS[status],
              }}
            >
              {jobs > 0 && (
                <span className="text-white text-xs font-bold">{jobs}</span>
              )}
            </div>
          </div>
          <div className="w-8 text-xs text-muted-foreground shrink-0">{jobs === 0 ? "—" : ""}</div>
        </div>
      ))}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="text-xs">
            {p.name}: {p.name === "Revenue" ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });

  const { data: recentJobs, isLoading: loadingJobs } = useGetRecentJobs();

  const { data: charts, isLoading: loadingCharts } = useQuery({
    queryKey: ["dashboard-charts"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.BASE_URL.replace(/\/$/, "")}/../api/dashboard/charts`
      );
      if (!res.ok) throw new Error("Failed to load chart data");
      return res.json() as Promise<{
        byService: { name: string; jobs: number; revenue: number }[];
        pipeline: { status: string; jobs: number }[];
        bySub: { name: string; jobs: number; pay: number }[];
      }>;
    },
  });

  const today = format(new Date(), "EEEE, MMMM d");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, Dispatch</h1>
          <p className="text-sm text-gray-500 mt-0.5">{today} · {brand.name} Operations</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Link href="/jobs">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Activity className="w-4 h-4" />
              Dispatch Board
            </Button>
          </Link>
          <Link href="/jobs/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              New Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Alert banners */}
      {summary && (summary.staleLeads > 0 || summary.pendingEscalations > 0 || summary.unreadNotifications > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {summary.staleLeads > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex-1">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  {summary.staleLeads} stale lead{summary.staleLeads > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-amber-700">Unassigned for 48+ hours — needs action</p>
              </div>
              <Link href="/jobs?status=new">
                <Button variant="outline" size="sm" className="border-amber-300 text-amber-800 hover:bg-amber-100 shrink-0">
                  View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          )}
          {summary.pendingEscalations > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex-1">
              <Zap className="w-5 h-5 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">
                  {summary.pendingEscalations} open escalation{summary.pendingEscalations > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-red-700">Requires your attention</p>
              </div>
            </div>
          )}
          {summary.unreadNotifications > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex-1">
              <Bell className="w-5 h-5 text-blue-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">
                  {summary.unreadNotifications} unread notification{summary.unreadNotifications > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-blue-700">Activity updates waiting</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(summary.totalRevenue)}
            subtitle="All jobs"
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Owner Profit"
            value={formatCurrency(summary.totalOwnerProfit)}
            subtitle="Your take-home"
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Sub Payouts"
            value={formatCurrency(summary.totalSubPay)}
            subtitle="Paid to crew"
            icon={Users}
            color="blue"
          />
          <StatCard
            title="New Leads"
            value={summary.newJobs}
            subtitle={summary.staleLeads > 0 ? `${summary.staleLeads} stale` : "Awaiting dispatch"}
            icon={Briefcase}
            color={summary.staleLeads > 0 ? "amber" : "default"}
            alert={summary.staleLeads > 0}
          />
          <StatCard
            title="Active Jobs"
            value={(summary as any).inProgressJobs !== undefined ? summary.assignedJobs + (summary as any).inProgressJobs : summary.assignedJobs}
            subtitle="Assigned + in progress"
            icon={Activity}
            color="purple"
          />
          <StatCard
            title="Completed"
            value={summary.completedJobs}
            subtitle="Done or paid"
            icon={CheckCircle2}
            color="green"
          />
        </div>
      ) : null}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Service */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Revenue by Service Type</CardTitle>
            <CardDescription>Total revenue across all service categories</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCharts ? (
              <Skeleton className="h-52 w-full" />
            ) : charts && charts.byService.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={charts.byService}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={130}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                    {charts.byService.map((_, i) => (
                      <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Job Pipeline</CardTitle>
            <CardDescription>How jobs are distributed across stages</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCharts ? (
              <Skeleton className="h-52 w-full" />
            ) : charts ? (
              <div className="pt-2">
                <PipelineBar pipeline={charts.pipeline} />
                <Separator className="my-4" />
                <div className="grid grid-cols-5 gap-1 text-center">
                  {charts.pipeline.map(({ status, jobs }) => (
                    <div key={status}>
                      <div
                        className="text-lg font-bold"
                        style={{ color: STATUS_COLORS[status] }}
                      >
                        {jobs}
                      </div>
                      <div className="text-xs text-muted-foreground leading-tight">
                        {STATUS_LABELS[status]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Crew Workload + Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crew Workload */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Crew Workload</CardTitle>
            <CardDescription>Jobs assigned per subcontractor</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCharts ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : charts && charts.bySub.length > 0 ? (
              <div className="space-y-3">
                {charts.bySub.map((sub, i) => (
                  <div key={sub.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {sub.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium truncate">{sub.name}</p>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {sub.jobs} job{sub.jobs !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.max((sub.jobs / (charts.bySub[0]?.jobs || 1)) * 100, sub.jobs > 0 ? 10 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No crew data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest 10 jobs across all statuses</CardDescription>
            </div>
            <Link href="/jobs">
              <Button variant="ghost" size="sm" className="text-primary gap-1 -mr-2">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loadingJobs ? (
              <div className="space-y-px">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="px-6 py-3">
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : recentJobs && recentJobs.length > 0 ? (
              <div className="divide-y">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => setLocation("/jobs")}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {job.customerName}
                        </p>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                          #{job.id}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {job.serviceType} · {job.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {job.customerPrice && (
                        <span className="text-sm font-semibold text-foreground hidden sm:block">
                          {formatCurrency(job.customerPrice)}
                        </span>
                      )}
                      <JobStatusBadge status={job.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Briefcase className="mx-auto h-10 w-10 opacity-20 mb-3" />
                <p className="text-sm">No recent jobs</p>
                <Link href="/jobs/new">
                  <Button variant="outline" size="sm" className="mt-4 gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add first job
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
