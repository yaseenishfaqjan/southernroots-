import { useState, type FormEvent } from "react";
import { Leaf, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { api } from "../lib/api";

function slugFromUrl(): string {
  const m = window.location.pathname.match(/\/q\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

const SERVICES = ["Lawn Mowing", "Fertilization", "Landscaping", "Aeration", "Hedge Trimming", "Pressure Washing"];

export default function LeadForm() {
  const [slug] = useState(slugFromUrl);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/public/leads/${encodeURIComponent(slug)}`, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim(),
        servicesWanted: picked,
      });
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(/404/.test(msg) ? "This quote link isn't valid." : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Get your free lawn quote</h1>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-green-700">
            <Sparkles className="h-4 w-4" /> AI-measured & priced in seconds
          </p>
        </div>

        {done ? (
          <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">You're all set!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Our AI is measuring your lawn right now. Your personalized quote is on its way to your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Your name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className={field} required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={field} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={field} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Property address</label>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className={field} placeholder="Street, City, State" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">What do you need?</label>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggle(s)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      picked.includes(s) ? "border-green-600 bg-green-50 text-green-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Get my free quote
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
