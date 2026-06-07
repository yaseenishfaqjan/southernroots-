import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiBase } from "@/lib/api";
import {
  DollarSign,
  Briefcase,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";

interface Assignment {
  id: number;
  jobId: number;
  subcontractorId: number;
  subName?: string | null;
  subPay: number;
  ownerProfit: number;
  status: string;
  assignedAt: string;
  completedAt?: string | null;
}

interface Job {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  serviceType: string;
  customerPrice?: number | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  assignment?: Assignment | null;
}

interface EarningRow {
  job: Job;
  completedAt: string;
  pay: number;
}

function getThisWeekRange() {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

export default function Earnings() {
  const [, setLocation] = useLocation();
  const { workerId } = useAuth();

  useEffect(() => {
    if (!workerId) setLocation("/");
  }, [workerId, setLocation]);

  const { data: jobs, isLoading, isError } = useQuery<Job[]>({
    queryKey: ["workerJobs", workerId],
    queryFn: async () => {
      const r = await fetch(`${apiBase()}/worker/jobs/${workerId}`);
      if (!r.ok) throw new Error("Failed to load jobs");
      return r.json() as Promise<Job[]>;
    },
    enabled: !!workerId,
  });

  const { start, end } = getThisWeekRange();

  const completedThisWeek: EarningRow[] = (jobs ?? [])
    .filter((j) => {
      if (j.status !== "complete" && j.assignment?.status !== "complete") return false;
      const dateStr = j.assignment?.completedAt ?? j.assignment?.assignedAt ?? j.createdAt;
      try {
        const date = typeof dateStr === "string" ? parseISO(dateStr) : new Date(dateStr);
        return isWithinInterval(date, { start, end });
      } catch {
        return false;
      }
    })
    .map((j) => ({
      job: j,
      completedAt: j.assignment?.completedAt ?? j.assignment?.assignedAt ?? j.createdAt,
      // subPay comes from DB already in dollars; customerPrice is in cents
      pay: j.assignment?.subPay ?? (j.customerPrice ? (j.customerPrice * 0.7) / 100 : 0),
    }));

  const totalPay = completedThisWeek.reduce((sum, row) => sum + row.pay, 0);
  const weekLabel = `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-green-600 text-white shadow-md">
        <div className="flex h-16 items-center px-4 gap-2">
          <Link href="/jobs">
            <span className="p-2 -ml-2 rounded-full active:bg-black/10 flex items-center justify-center">
              <ChevronLeft className="w-6 h-6" />
            </span>
          </Link>
          <h1 className="flex-1 text-center text-lg font-bold">This Week's Earnings</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 p-4 pb-12 w-full max-w-md mx-auto space-y-4">
        {/* Week header */}
        <div className="text-center pt-2">
          <p className="text-sm text-gray-500 font-medium">{weekLabel}</p>
        </div>

        {/* Summary card */}
        <div className="bg-green-600 text-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-100">Total Earnings</p>
              <p className="text-3xl font-bold">${totalPay.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
            <Briefcase className="w-4 h-4 text-green-200" />
            <span className="text-sm text-green-100">
              {completedThisWeek.length} job{completedThisWeek.length !== 1 ? "s" : ""} completed this week
            </span>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Couldn't load jobs</p>
              <p className="text-red-600 text-xs mt-0.5">Please try again later.</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && completedThisWeek.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-1">No completed jobs this week</h3>
            <p className="text-sm text-gray-400">Jobs you complete will appear here.</p>
            <Link href="/jobs">
              <span className="mt-4 inline-block text-sm text-green-600 font-medium hover:underline">
                View today's jobs
              </span>
            </Link>
          </div>
        )}

        {/* Earnings list */}
        {completedThisWeek.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
              Completed Jobs
            </h2>
            {completedThisWeek.map((row) => (
              <div
                key={row.job.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm"
              >
                {/* Icon */}
                <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {row.job.serviceType}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{row.job.address}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(parseISO(row.completedAt), "EEE, MMM d")}
                  </p>
                </div>

                {/* Pay */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-green-700 text-base">${row.pay.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">your cut</p>
                </div>
              </div>
            ))}

            {/* Total row */}
            <div className="bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="font-semibold">Week Total</span>
              </div>
              <span className="font-bold text-xl text-green-400">${totalPay.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Note */}
        <p className="text-xs text-gray-400 text-center px-4 pb-2">
          Earnings reflect your 70% share. Paid out every Friday.
        </p>
      </div>
    </div>
  );
}
