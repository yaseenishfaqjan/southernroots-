import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Loader2, HardHat } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { TableSkeleton } from "../components/Skeleton";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";

interface Worker {
  id: number;
  name: string;
  phone: string | null;
  specialty: string | null;
  rating: number | null;
  completionRate: number | null;
  activeJobCount: number;
  todayJobCount: number;
  status: string;
}

const SPECIALTIES = ["general", "landscaping", "pressure_washing", "aeration"] as const;

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-gray-300 text-xs">—</span>;
  const stars = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= stars ? "text-yellow-400" : "text-gray-200"}>★</span>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function NewWorkerModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", phone: "", email: "", specialty: "general", homeAddress: "" });
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: () =>
      api.post("/workers", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        specialty: form.specialty,
        homeAddress: form.homeAddress.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workers"] });
      toast("Crew member added");
      onClose();
    },
    onError: () => setError("Could not add the crew member. Check the fields."),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.phone) {
      setError("Name and phone are required.");
      return;
    }
    create.mutate();
  }

  const field = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">New Crew Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={field} placeholder="Marcus Webb" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={field} placeholder="+1 404 555 1234" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Specialty</label>
              <select value={form.specialty} onChange={(e) => set("specialty", e.target.value)} className={field}>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={field} placeholder="marcus@email.com (optional)" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Home address</label>
            <input value={form.homeAddress} onChange={(e) => set("homeAddress", e.target.value)} className={field} placeholder="For route optimization (optional)" />
          </div>
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={create.isPending} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Add crew member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Workers() {
  const [showNew, setShowNew] = useState(false);
  const { data: workers, isLoading } = useQuery<Worker[]>({
    queryKey: ["workers"],
    queryFn: () => api.get("/workers"),
  });

  const activeCount = workers?.filter((w) => w.status === "active").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workers</h1>
          <p className="text-sm text-gray-500 mt-1">{activeCount} active crew members</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Crew Member
        </button>
      </div>

      {showNew && <NewWorkerModal onClose={() => setShowNew(false)} />}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Name", "Phone", "Specialty", "Rating", "Completion Rate", "Active Jobs", "Today", "Status"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <TableSkeleton rows={5} cols={8} />}
            {workers?.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{w.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{w.phone ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{w.specialty ? w.specialty.replace(/_/g, " ") : "—"}</td>
                <td className="px-6 py-4"><StarRating rating={w.rating} /></td>
                <td className="px-6 py-4">
                  {w.completionRate !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.round(w.completionRate * 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{Math.round(w.completionRate * 100)}%</span>
                    </div>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">{w.activeJobCount}</span>
                </td>
                <td className="px-6 py-4">
                  {w.todayJobCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{w.todayJobCount} today</span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-4"><StatusBadge status={w.status} /></td>
              </tr>
            ))}
            {!isLoading && !workers?.length && (
              <tr>
                <td colSpan={8} className="px-6 py-12">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <HardHat className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No crew members yet</p>
                    <p className="mt-1 text-sm text-gray-500">Add your crew so the dispatch agent can assign and route jobs.</p>
                    <button onClick={() => setShowNew(true)} className="mt-4 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                      <Plus className="h-4 w-4" /> Add your first crew member
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
