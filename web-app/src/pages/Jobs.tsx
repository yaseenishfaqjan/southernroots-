import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, Calendar, DollarSign, FileText, User } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { TableSkeleton } from "../components/Skeleton";
import { api, formatMoney, formatDate } from "../lib/api";
import { useToast } from "../lib/toast";

const NEXT_STATUS: Record<string, { label: string; to: string }[]> = {
  new: [{ label: "Assign", to: "assigned" }],
  assigned: [{ label: "Start", to: "in_progress" }],
  in_progress: [{ label: "Mark Complete", to: "complete" }],
};

function JobDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ["job", id],
    queryFn: () => api.get(`/jobs/${id}`),
  });

  const patch = useMutation({
    mutationFn: (status: string) => api.patch(`/jobs/${id}`, { status }),
    onSuccess: (_d, status) => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job", id] });
      toast(`Job marked ${status.replace(/_/g, " ")}`);
    },
    onError: () => toast("Could not update the job", "error"),
  });

  const actions = job ? NEXT_STATUS[job.status] ?? [] : [];

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-black/30" />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.25 }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">Job #{id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
        </div>
        {isLoading || !job ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-green-600" /></div>
        ) : (
          <div className="space-y-6 p-5">
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold text-gray-900">{job.serviceType.replace(/_/g, " ")}</div>
              <StatusBadge status={job.status} />
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-gray-400" /> {formatMoney(job.priceCents)}</div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /> {job.scheduledDate ? `Scheduled ${formatDate(job.scheduledDate)}` : "Not scheduled"}</div>
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /> Customer #{job.customerId}</div>
              {job.notes && <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 text-gray-400" /> {job.notes}</div>}
              <div className="text-xs text-gray-400">Created {formatDate(job.createdAt)}</div>
            </div>
            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                {actions.map((a) => (
                  <button
                    key={a.to}
                    onClick={() => patch.mutate(a.to)}
                    disabled={patch.isPending}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    {patch.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {a.label}
                  </button>
                ))}
                {job.status !== "cancelled" && job.status !== "complete" && job.status !== "paid" && (
                  <button
                    onClick={() => patch.mutate("cancelled")}
                    disabled={patch.isPending}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Cancel job
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
}

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
  const toast = useToast();
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
      toast("Job created");
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
  const [selectedId, setSelectedId] = useState<number | null>(null);
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
      <AnimatePresence>
        {selectedId && <JobDrawer id={selectedId} onClose={() => setSelectedId(null)} />}
      </AnimatePresence>

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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[640px]">
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
            {isLoading && <TableSkeleton rows={5} cols={6} />}
            {jobs?.map((job) => (
              <tr key={job.id} onClick={() => setSelectedId(job.id)} className="cursor-pointer hover:bg-gray-50">
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
                        onClick={(e) => { e.stopPropagation(); patchJob.mutate({ id: job.id, data: { status: "complete" } }); }}
                        disabled={patchJob.isPending}
                        className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        Mark Complete
                      </button>
                    )}
                    {job.status === "new" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); patchJob.mutate({ id: job.id, data: { status: "assigned" } }); }}
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
