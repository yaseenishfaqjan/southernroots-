import { useEffect, useState, useCallback } from "react";
import { Leaf, Loader2, MapPin, Play, CheckCircle2, Calendar } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { api, formatMoney, formatDate } from "../lib/api";

interface WJob {
  id: number;
  serviceType: string;
  status: string;
  priceCents: number;
  scheduledDate: string | null;
  notes: string | null;
  customerName: string | null;
  address: string | null;
}
interface WorkerData {
  worker: { name: string };
  orgName: string;
  jobs: WJob[];
}

function tokenFromUrl(): string {
  const m = window.location.pathname.match(/\/w\/([^/]+)/);
  return m ? m[1] : "";
}

export default function WorkerPortal() {
  const [token] = useState(tokenFromUrl);
  const [data, setData] = useState<WorkerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .get<WorkerData>(`/public/worker/${token}`)
      .then(setData)
      .catch(() => setError("This link isn't valid. Ask your manager for a new one."))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function update(jobId: number, status: string) {
    setBusy(jobId);
    setError(null);
    try {
      await api.post(`/public/worker/${token}/jobs/${jobId}`, { status });
      load();
    } catch {
      setError("Couldn't update the job. Try again.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-center text-gray-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-green-600 px-5 py-4 text-white shadow">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Leaf className="h-5 w-5" />
          <div>
            <div className="text-xs opacity-90">{data?.orgName}</div>
            <div className="text-base font-semibold">Hi {data?.worker.name} 👋</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Today's jobs</h1>
          <span className="text-sm text-gray-500">{data?.jobs.length ?? 0}</span>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {data && data.jobs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            🎉 No open jobs right now. Enjoy the break!
          </div>
        ) : (
          <div className="space-y-3">
            {data?.jobs.map((j) => (
              <div key={j.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-semibold capitalize text-gray-900">{j.serviceType.replace(/_/g, " ")}</div>
                    <div className="text-sm text-gray-600">{j.customerName ?? `Job #${j.id}`}</div>
                  </div>
                  <StatusBadge status={j.status} />
                </div>
                {j.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(j.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center gap-1.5 text-sm text-blue-600"
                  >
                    <MapPin className="h-4 w-4" /> {j.address}
                  </a>
                )}
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {j.scheduledDate ? formatDate(j.scheduledDate) : "Unscheduled"}</span>
                  <span className="font-medium text-gray-900">{formatMoney(j.priceCents)}</span>
                </div>
                {j.notes && <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">{j.notes}</p>}

                <div className="mt-4">
                  {(j.status === "new" || j.status === "assigned") && (
                    <button
                      onClick={() => update(j.id, "in_progress")}
                      disabled={busy === j.id}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {busy === j.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />} Start job
                    </button>
                  )}
                  {j.status === "in_progress" && (
                    <button
                      onClick={() => update(j.id, "complete")}
                      disabled={busy === j.id}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-base font-semibold text-white hover:bg-black disabled:opacity-60"
                    >
                      {busy === j.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />} Mark complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
