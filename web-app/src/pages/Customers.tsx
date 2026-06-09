import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, Users, Phone, Mail, MapPin } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { TableSkeleton } from "../components/Skeleton";
import { api, formatMoney, formatDate } from "../lib/api";
import { useToast } from "../lib/toast";

interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  tier: string;
  mrr: number;
  churnRisk: number | null;
  createdAt: string;
  address: string | null;
}

interface CustomerJob {
  id: number;
  serviceType: string;
  status: string;
  priceCents: number;
  scheduledDate: string | null;
}
interface CustomerInvoice {
  id: number;
  amountCents: number;
  status: string;
  dueDate: string | null;
}
interface CustomerDetail extends Customer {
  jobs: CustomerJob[];
  invoices: CustomerInvoice[];
}

function ChurnRiskBar({ score }: { score: number | null }) {
  if (score === null || score === undefined) return <span className="text-gray-300 text-xs">—</span>;
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-yellow-400" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{pct}%</span>
    </div>
  );
}

function CustomerDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, isLoading } = useQuery<CustomerDetail>({
    queryKey: ["customer", id],
    queryFn: () => api.get(`/customers/${id}`),
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.25 }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">{data?.name ?? "Customer"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
        </div>

        {isLoading || !data ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-green-600" /></div>
        ) : (
          <div className="space-y-6 p-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={data.tier} />
              <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                {formatMoney(data.mrr ?? 0)}/mo
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              {data.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {data.phone}</div>}
              {data.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {data.email}</div>}
              {data.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /> {data.address}</div>}
              <div className="text-xs text-gray-400">Customer since {formatDate(data.createdAt)}</div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Jobs</h3>
                <span className="text-xs text-gray-400">{data.jobs?.length ?? 0}</span>
              </div>
              {data.jobs?.length ? (
                <div className="space-y-2">
                  {data.jobs.map((j) => (
                    <div key={j.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{j.serviceType.replace(/_/g, " ")}</div>
                        <div className="text-xs text-gray-500">{formatDate(j.scheduledDate)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">{formatMoney(j.priceCents)}</span>
                        <StatusBadge status={j.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No jobs yet.</p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Invoices</h3>
                <span className="text-xs text-gray-400">{data.invoices?.length ?? 0}</span>
              </div>
              {data.invoices?.length ? (
                <div className="space-y-2">
                  {data.invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{formatMoney(inv.amountCents)}</div>
                        <div className="text-xs text-gray-500">Due {formatDate(inv.dueDate)}</div>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No invoices yet.</p>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}

function NewCustomerModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", tier: "standard" });
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const create = useMutation({
    mutationFn: () =>
      api.post("/customers", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim(),
        tier: form.tier,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast("Customer added");
      onClose();
    },
    onError: () => setError("Could not add the customer. Check the fields."),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.phone || !form.address) {
      setError("Name, phone, and address are required.");
      return;
    }
    create.mutate();
  }

  const field = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">New Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={field} placeholder="Sarah Johnson" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={field} placeholder="+1 404 555 1234" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tier</label>
              <select value={form.tier} onChange={(e) => set("tier", e.target.value)} className={field}>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={field} placeholder="sarah@email.com (optional)" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} className={field} placeholder="42 Oak St, Atlanta, GA" />
          </div>
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={create.isPending} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Add customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const [showNew, setShowNew] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => api.get("/customers?sort=mrr"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{customers?.length ?? 0} customers</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Customer
        </button>
      </div>

      {showNew && <NewCustomerModal onClose={() => setShowNew(false)} />}
      <AnimatePresence>
        {selectedId && <CustomerDrawer id={selectedId} onClose={() => setSelectedId(null)} />}
      </AnimatePresence>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Name", "Phone", "Email", "Tier", "MRR", "Churn Risk", "Member Since"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <TableSkeleton rows={5} cols={7} />}
            {customers?.map((c) => (
              <tr key={c.id} onClick={() => setSelectedId(c.id)} className="cursor-pointer hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  {c.address && <p className="text-xs text-gray-400 mt-0.5">{c.address}</p>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.phone ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.email ?? "—"}</td>
                <td className="px-6 py-4"><StatusBadge status={c.tier} /></td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  {formatMoney(c.mrr ?? 0)}<span className="text-gray-400 font-normal">/mo</span>
                </td>
                <td className="px-6 py-4"><ChurnRiskBar score={c.churnRisk} /></td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
            {!isLoading && !customers?.length && (
              <tr>
                <td colSpan={7} className="px-6 py-12">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No customers yet</p>
                    <p className="mt-1 text-sm text-gray-500">Add your first customer to start quoting and scheduling.</p>
                    <button onClick={() => setShowNew(true)} className="mt-4 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                      <Plus className="h-4 w-4" /> Add your first customer
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
