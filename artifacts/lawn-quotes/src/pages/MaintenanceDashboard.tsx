import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, DollarSign, Bell, BellOff, AlertCircle, CheckCircle2, Users, TrendingUp, Clock, Search, MapPin } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MAINTENANCE_CUSTOMERS } from "@/lib/mock-data";

type Freq = "all" | "Weekly" | "Bi-weekly" | "Monthly" | "overdue";

const FREQ_TABS: { key: Freq; label: string }[] = [
  { key: "all",       label: "All Customers" },
  { key: "Weekly",    label: "Weekly" },
  { key: "Bi-weekly", label: "Bi-weekly" },
  { key: "Monthly",   label: "Monthly" },
  { key: "overdue",   label: "Overdue" },
];

export default function MaintenanceDashboard() {
  const [activeTab, setActiveTab] = useState<Freq>("all");
  const [search, setSearch] = useState("");

  const filtered = MAINTENANCE_CUSTOMERS.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.address.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" ? true : activeTab === "overdue" ? c.paymentStatus === "overdue" : c.frequency === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalMRR = MAINTENANCE_CUSTOMERS.reduce((acc, c) => acc + c.mrr, 0);
  const overdueCount = MAINTENANCE_CUSTOMERS.filter((c) => c.paymentStatus === "overdue").length;
  const dueTodayCount = MAINTENANCE_CUSTOMERS.filter((c) => isToday(c.nextDate)).length;
  const reminderOnCount = MAINTENANCE_CUSTOMERS.filter((c) => c.reminderEnabled).length;

  return (
    <div className="min-h-screen bg-zinc-50 pb-28">
      {/* Header */}
      <div className="bg-white border-b px-6 py-5">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            Recurring Maintenance
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Service schedules, billing status, and automated reminders.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Users,       label: "Active Customers",  value: MAINTENANCE_CUSTOMERS.length.toString(), color: "text-foreground" },
            { icon: DollarSign,  label: "Monthly Revenue",   value: `$${totalMRR.toLocaleString()}`,          color: "text-emerald-600" },
            { icon: AlertCircle, label: "Overdue Payments",  value: overdueCount.toString(),                  color: overdueCount > 0 ? "text-red-600" : "text-foreground" },
            { icon: Clock,       label: "Due Today",         value: dueTodayCount.toString(),                 color: dueTodayCount > 0 ? "text-amber-600" : "text-foreground" },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
                <kpi.icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{kpi.label}</span>
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Reminder bar */}
        <div className="bg-white rounded-2xl border p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold">{reminderOnCount} / {MAINTENANCE_CUSTOMERS.length} customers</p>
              <p className="text-xs text-muted-foreground">Auto-reminders active</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-bold">${(totalMRR * 12).toLocaleString()} / year</p>
              <p className="text-xs text-muted-foreground">Projected annual revenue</p>
            </div>
          </div>
          <div className="ml-auto">
            <Button size="sm" className="gap-2 whitespace-nowrap" data-testid="btn-send-reminders">
              <Bell className="h-3.5 w-3.5" />
              Send All Reminders
            </Button>
          </div>
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {FREQ_TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} data-testid={`tab-${tab.key}`}
                className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.key ? "bg-primary text-white" : "bg-white border text-muted-foreground hover:border-primary/40")}>
                {tab.label}
                {tab.key === "overdue" && overdueCount > 0 && (
                  <span className="ml-1.5 bg-red-100 text-red-700 text-xs px-1.5 rounded-full">{overdueCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers…" className="pl-9 h-9 w-full sm:w-64" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search" />
          </div>
        </div>

        {/* Customer cards */}
        <div className="grid gap-3">
          {filtered.map((cx, i) => {
            const isOverdue = cx.paymentStatus === "overdue";
            const isDueToday = isToday(cx.nextDate);
            const isPastDue = isPast(cx.nextDate) && !isDueToday;

            return (
              <motion.div key={cx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={cn("bg-white rounded-2xl border overflow-hidden hover:shadow-sm transition-shadow", isOverdue && "border-red-200")}>

                {/* Top section: avatar + name + reminder toggle */}
                <div className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-primary/10">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${cx.id}&backgroundColor=d1fae5`} alt="" className="w-full h-full" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name row + status badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-base leading-tight">{cx.name}</span>
                      <span className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                        cx.frequency === "Weekly" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                        cx.frequency === "Bi-weekly" ? "border-blue-200 bg-blue-50 text-blue-700" :
                        "border-purple-200 bg-purple-50 text-purple-700"
                      )}>{cx.frequency}</span>
                      {isDueToday && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Due Today</span>}
                      {isPastDue && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Past Due</span>}
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{cx.address}</span>
                    </div>

                    {/* Services */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cx.services.map((svc) => (
                        <span key={svc} className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium">{svc}</span>
                      ))}
                    </div>
                  </div>

                  {/* Reminder toggle — top right */}
                  <div className={cn(
                    "flex items-center gap-1 border rounded-lg px-2.5 py-1.5 flex-shrink-0 cursor-pointer",
                    cx.reminderEnabled ? "border-primary/30 bg-primary/5" : "border-zinc-200 bg-zinc-50"
                  )}>
                    {cx.reminderEnabled
                      ? <Bell className="h-3.5 w-3.5 text-primary" />
                      : <BellOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className={cn("text-xs font-semibold", cx.reminderEnabled ? "text-primary" : "text-muted-foreground")}>
                      {cx.reminderEnabled ? "Reminder On" : "Reminder Off"}
                    </span>
                  </div>
                </div>

                {/* Bottom stats row */}
                <div className={cn("grid grid-cols-3 border-t divide-x text-center", isOverdue && "border-red-100 divide-red-100")}>
                  <div className="py-2.5 px-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Next Visit</p>
                    <p className={cn("text-sm font-bold mt-0.5",
                      isDueToday ? "text-amber-600" : isPastDue ? "text-red-600" : "text-foreground")}>
                      {isDueToday ? "Today" : format(cx.nextDate, "MMM d")}
                    </p>
                  </div>
                  <div className="py-2.5 px-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Monthly</p>
                    <p className="text-sm font-bold text-emerald-600 mt-0.5">${cx.mrr}</p>
                  </div>
                  <div className="py-2.5 px-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Payment</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      {isOverdue
                        ? <><AlertCircle className="h-3.5 w-3.5 text-red-500" /><span className="text-xs font-bold text-red-600">Overdue</span></>
                        : <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="text-xs font-bold text-emerald-600">Paid</span></>}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No customers match this filter.</p>
              <p className="text-sm mt-1">Try a different tab or clear your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
