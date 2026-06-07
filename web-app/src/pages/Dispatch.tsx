import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, MessageSquare, RefreshCw, Briefcase, HardHat } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { api, formatDate, formatMoney } from "../lib/api";
import { useToast } from "../lib/toast";

interface Job {
  id: number;
  serviceType: string;
  status: string;
  scheduledDate: string | null;
  priceCents: number;
  customerName?: string;
  address?: string;
}

interface Worker {
  id: number;
  name: string;
  specialty: string | null;
  activeJobCount: number;
  status: string;
  rating: number | null;
}

interface DispatchStatus {
  lastDispatchAt: string | null;
  lastBriefingAt: string | null;
  jobsDispatched: number;
  workersNotified: number;
}

export default function Dispatch() {
  const qc = useQueryClient();
  const toast = useToast();

  const { data: unassignedJobs, isLoading: loadingJobs } = useQuery<Job[]>({
    queryKey: ["jobs-unassigned"],
    queryFn: () => api.get("/jobs?status=new"),
    refetchInterval: 30_000,
  });

  const { data: workers, isLoading: loadingWorkers } = useQuery<Worker[]>({
    queryKey: ["workers-active"],
    queryFn: () => api.get("/workers?status=active"),
  });

  const { data: dispatchStatus, isLoading: loadingStatus } =
    useQuery<DispatchStatus>({
      queryKey: ["dispatch-status"],
      queryFn: () => api.get("/agents/dispatch/status"),
      refetchInterval: 15_000,
    });

  const triggerDispatch = useMutation({
    mutationFn: () => api.post("/agents/dispatch/trigger"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs-unassigned"] });
      qc.invalidateQueries({ queryKey: ["workers-active"] });
      qc.invalidateQueries({ queryKey: ["dispatch-status"] });
      toast("Dispatch agent ran — crews assigned");
    },
    onError: () => toast("Dispatch run failed", "error"),
  });

  const triggerBriefing = useMutation({
    mutationFn: () => api.post("/agents/briefing/trigger"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dispatch-status"] });
      toast("Owner briefing generated");
    },
    onError: () => toast("Briefing failed", "error"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispatch</h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered job assignment and crew briefing
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => triggerDispatch.mutate()}
            disabled={triggerDispatch.isPending}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {triggerDispatch.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Run AI Dispatch
          </button>
          <button
            onClick={() => triggerBriefing.mutate()}
            disabled={triggerBriefing.isPending}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {triggerBriefing.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            Send Briefing
          </button>
        </div>
      </div>

      {/* Status bar */}
      {!loadingStatus && dispatchStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Last Dispatch
            </p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {dispatchStatus.lastDispatchAt
                ? formatDate(dispatchStatus.lastDispatchAt)
                : "Never"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Last Briefing
            </p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {dispatchStatus.lastBriefingAt
                ? formatDate(dispatchStatus.lastBriefingAt)
                : "Never"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Jobs Dispatched
            </p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {dispatchStatus.jobsDispatched}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Workers Notified
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {dispatchStatus.workersNotified}
            </p>
          </div>
        </div>
      )}

      {/* Success / error feedback */}
      {triggerDispatch.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
          AI Dispatch completed — jobs have been assigned to the best available
          workers.
        </div>
      )}
      {triggerBriefing.isSuccess && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          Morning briefing sent — all active crew members have been notified.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned Jobs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-200 flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Briefcase className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Unassigned Jobs
              </h2>
              <p className="text-xs text-gray-500">
                {unassignedJobs?.length ?? 0} awaiting assignment
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {loadingJobs && (
              <div className="px-5 py-6 text-center text-gray-400 text-sm">
                Loading...
              </div>
            )}
            {unassignedJobs?.map((job) => (
              <div key={job.id} className="px-5 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {job.serviceType.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {job.customerName ?? `Job #${job.id}`}
                    </p>
                    {job.address && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {job.address}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(job.scheduledDate)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatMoney(job.priceCents)}
                    </p>
                    <StatusBadge status={job.status} />
                  </div>
                </div>
              </div>
            ))}
            {!loadingJobs && !unassignedJobs?.length && (
              <div className="px-5 py-8 text-center">
                <div className="text-green-500 text-2xl mb-2">✓</div>
                <p className="text-sm text-gray-400">
                  All jobs are assigned
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Active Workers */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-200 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <HardHat className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Active Workers
              </h2>
              <p className="text-xs text-gray-500">
                {workers?.filter((w) => w.status === "active").length ?? 0}{" "}
                crew members available
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {loadingWorkers && (
              <div className="px-5 py-6 text-center text-gray-400 text-sm">
                Loading...
              </div>
            )}
            {workers?.map((w) => (
              <div
                key={w.id}
                className="px-5 py-4 hover:bg-gray-50 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{w.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {w.specialty?.replace(/_/g, " ") ?? "General"}
                    {w.rating !== null && (
                      <span className="ml-2 text-yellow-500">
                        ★ {w.rating.toFixed(1)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Active jobs</p>
                    <p
                      className={`text-lg font-bold ${
                        w.activeJobCount >= 4
                          ? "text-red-500"
                          : w.activeJobCount >= 2
                          ? "text-orange-500"
                          : "text-green-600"
                      }`}
                    >
                      {w.activeJobCount}
                    </p>
                  </div>
                  <StatusBadge status={w.status} />
                </div>
              </div>
            ))}
            {!loadingWorkers && !workers?.length && (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No active workers found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
