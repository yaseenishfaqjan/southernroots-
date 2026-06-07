import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Loader2 } from "lucide-react";
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

const SERVICE_TYPES = [
  "mowing",
  "landscaping",
  "pressure_washing",
  "aeration",
  "hedges",
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

interface Customer {
  id: number;
  name: string;
}

function NewJobModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => api.get("/customers"),
  });

  const [customerId, setCustomerId] = useState("");
  const [serviceType, setServiceType] = useState<string>("mowing");
  const [price, setPrice] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      api.post("/jobs", {
        customerId: Number(customerId),
        serviceType,
        priceCents: Math.round(parseFloat(price || "0") * 100),
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      onClose();
    },
    onError: () => setError("Could not create the job. Check the fields and try again."),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customerId) {
      setError("Please choose a customer.");
      return;
    }
    create.mutate();
  }

  const field = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">New Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Customer</label>
            {customers && customers.length === 0 ? (
              <p className="text-sm text-gray-500">
                No customers yet — add one on the Customers page first.
              </p>
            ) : (
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={field} required>
                <option value="">Select a customer…</option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Service</label>
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={field}>
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price ($)</label>
              <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={field} placeholder="0.00" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Scheduled date</label>
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={field} rows={2} placeholder="Optional" />
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Jobs() {
  const [status, setStatus] = useState<string>("all");
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();

  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["jobs", status],
    queryFn: () =>
      api.get(`/jobs${status !== "all" ? `?status=${status}` : ""}`),
  });

  const patchJob = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.patch(`/jobs/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Job
        </button>
      </div>

      {showNew && <NewJobModal onClose={() => setShowNew(false)} />}

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
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {jobs?.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">#{job.id}</td>
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
                        onClick={() => patchJob.mutate({ id: job.id, data: { status: "complete" } })}
                        disabled={patchJob.isPending}
                        className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        Mark Complete
                      </button>
                    )}
                    {job.status === "new" && (
                      <button
                        onClick={() => patchJob.mutate({ id: job.id, data: { status: "assigned" } })}
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
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
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
