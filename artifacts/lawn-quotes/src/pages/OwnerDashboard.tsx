import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  TrendingUp, TrendingDown, Users, Navigation, DollarSign, Cpu, Zap,
  Map, ArrowRight, BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { DASHBOARD_KPIS, REVENUE_BY_NEIGHBORHOOD, WEEKLY_REVENUE, MAINTENANCE_CUSTOMERS, NEIGHBORHOOD_LEADS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface KpiCardProps { label: string; value: string | number; change: string; up: boolean; icon: React.ElementType; color?: string }
function KpiCard({ label, value, change, up, icon: Icon, color = "bg-primary/10 text-primary" }: KpiCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}><Icon className="h-5 w-5" /></div>
        <div className={cn("flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
          up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {change}
        </div>
      </div>
      <p className="text-2xl font-bold">{typeof value === "number" && label.toLowerCase().includes("revenue") ? `$${value.toLocaleString()}` : value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

const hotLeads = [...NEIGHBORHOOD_LEADS].sort((a, b) => b.priority - a.priority).slice(0, 4);
const overdueCustomers = MAINTENANCE_CUSTOMERS.filter((c) => c.paymentStatus === "overdue");

export default function OwnerDashboard() {
  const k = DASHBOARD_KPIS;

  return (
    <div className="min-h-screen bg-zinc-50 pb-28">
      {/* Header */}
      <div className="bg-white border-b px-6 py-5">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><BrainCircuit className="h-6 w-6 text-primary" />Owner Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Today — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <Button asChild size="sm" className="gap-2" data-testid="btn-get-quote"><Link href="/quote"><Zap className="h-3.5 w-3.5" />New Quote</Link></Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard label="Quotes Generated" value={k.quotesGenerated.value} change={k.quotesGenerated.change} up={k.quotesGenerated.up} icon={Zap} color="bg-primary/10 text-primary" />
          <KpiCard label="Recurring Customers" value={k.recurringCustomers.value} change={k.recurringCustomers.change} up={k.recurringCustomers.up} icon={Users} color="bg-blue-100 text-blue-700" />
          <KpiCard label="Route Efficiency" value={k.routeEfficiency.value} change={k.routeEfficiency.change} up={k.routeEfficiency.up} icon={Navigation} color="bg-violet-100 text-violet-700" />
          <KpiCard label="Monthly Recurring Revenue" value={k.mrr.value} change={k.mrr.change} up={k.mrr.up} icon={DollarSign} color="bg-emerald-100 text-emerald-700" />
          <KpiCard label="Crew Utilization" value={k.crewUtilization.value} change={k.crewUtilization.change} up={k.crewUtilization.up} icon={Cpu} color="bg-orange-100 text-orange-700" />
          <KpiCard label="Upsell Opportunities" value={k.upsellOpportunities.value} change={k.upsellOpportunities.change} up={k.upsellOpportunities.up} icon={TrendingUp} color="bg-rose-100 text-rose-700" />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Weekly revenue chart */}
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold">Revenue — Last 7 Days</h2>
                <p className="text-sm text-muted-foreground">Daily revenue vs. quotes generated</p>
              </div>
              <Badge variant="outline" className="text-xs">Live</Badge>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={WEEKLY_REVENUE} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="rev" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis yAxisId="qt" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, name) => name === "revenue" ? [`$${v}`, "Revenue"] : [v, "Quotes"]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="rev" dataKey="revenue" fill="hsl(142.1,76.2%,36.3%)" radius={[4, 4, 0, 0]} name="revenue" />
                <Bar yAxisId="qt"  dataKey="quotes"  fill="#93c5fd" radius={[4, 4, 0, 0]} name="quotes" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by neighborhood */}
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Revenue by Neighborhood</h2>
              <Map className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {REVENUE_BY_NEIGHBORHOOD.map((n, i) => {
                const pct = Math.round((n.revenue / REVENUE_BY_NEIGHBORHOOD[0].revenue) * 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{n.name}</span>
                      <span className="text-muted-foreground">${n.revenue.toLocaleString()} · {n.customers} cx</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.1, duration: 0.6 }} className="h-full rounded-full" style={{ background: n.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between text-sm">
              <span className="text-muted-foreground">Total MRR</span>
              <span className="font-bold text-emerald-600">${REVENUE_BY_NEIGHBORHOOD.reduce((acc, n) => acc + n.revenue, 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top leads */}
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Top AI Leads</h2>
              <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
                <Link href="/leads">View All <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
            <div className="space-y-2.5">
              {hotLeads.map((lead) => (
                <div key={lead.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: lead.priority >= 90 ? "#16a34a" : lead.priority >= 75 ? "#2563eb" : "#d97706" }}>
                    {lead.priority}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{lead.address}</p>
                    <p className="text-xs text-muted-foreground">{lead.opportunity} · {lead.yardSqFt.toLocaleString()} sq ft</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs flex-shrink-0" asChild data-testid={`btn-quote-${lead.id}`}>
                    <Link href="/quote">Quote</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue / action items */}
          <div className="bg-white rounded-2xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Action Items</h2>
              <Badge variant="destructive" className="text-xs">{overdueCustomers.length} overdue</Badge>
            </div>
            <div className="space-y-2.5">
              {overdueCustomers.map((cx) => (
                <div key={cx.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${cx.id}&backgroundColor=fee2e2`} alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{cx.name}</p>
                    <p className="text-xs text-red-600">Payment overdue · ${cx.mrr}/mo</p>
                  </div>
                  <Button size="sm" variant="destructive" className="text-xs flex-shrink-0">Remind</Button>
                </div>
              ))}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-sm font-medium text-amber-900">11 upsell opportunities detected</p>
                <p className="text-xs text-amber-700 mt-0.5">Customers with only 1 service who match multi-service profiles</p>
                <Button size="sm" variant="outline" className="mt-2 text-xs border-amber-300 text-amber-800 hover:bg-amber-100" asChild>
                  <Link href="/leads">View Upsell Pipeline <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
