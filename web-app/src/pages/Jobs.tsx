import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { api, formatMoney, formatDate } from "../lib/api";

const STATUS_TABS = [
  "all",
  "new",
  "assigned",
  "in_progress",
  "complete",
  "paid",
  "cancelled",
] as const;

interface Job {
  id: number;
  customerId: number;
  serviceType: string;
  status: string;
  scheduledDate: string | null;
  completedAt: string | null;
  priceCents: number;
  notes: string | null;
  createdAt: string;
}

export default function Jobs() {
  const [status, setStatus] = useState<string>("all");
  const qc = useQueryClient();

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["jobs", status],
    queryFn: () =>
      api.get(`/jobs${status !== "all" ? `?status=${status}` : ""}`),
  });

  const patchJob = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Record<string, unknown>;
    }) => api.patch(`/jobs/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" /> New Job
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              status === s
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s === "all" ? "All" : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["#", "Service", "Status", "Scheduled", "Price", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  Loading...
                </td>
              </tr>
            )}
            {jobs?.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">
                  #{job.id}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {job.serviceType.replace(/_/g, " ")}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(job.scheduledDate)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {formatMoney(job.priceCents)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {job.status === "in_progress" && (
                      <button
                        onClick={() =>
                          patchJob.mutate({
                            id: job.id,
                            data: { status: "complete" },
                          })
                        }
                        disabled={patchJob.isPending}
                        className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        Mark Complete
                      </button>
                    )}
                    {job.status === "new" && (
                      <button
                        onClick={() =>
                          patchJob.mutate({
                            id: job.id,
                            data: { status: "assigned" },
                          })
                        }
                        disabled={patchJob.isPending}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !jobs?.length && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  No jobs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
