import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { api } from "../lib/api";

interface PlanCard {
  key: string;
  name: string;
  monthly: number;
  blurb: string;
}
interface BillingStatus {
  plan: string;
  status: string;
  trialEndsAt: string | null;
  hasSubscription: boolean;
  billingConfigured: boolean;
  plans: PlanCard[];
}

export default function Billing() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    api.get<BillingStatus>("/billing/status").then(setStatus).catch(() => setStatus(null));
  }, []);

  async function choose(plan: string) {
    setBusy(plan);
    setNote(null);
    try {
      const r = await api.post<{ url?: string }>("/billing/checkout", { plan });
      if (r.url) window.location.href = r.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setNote(/503/.test(msg) ? "Billing isn't configured yet — add your Stripe keys to enable upgrades." : "Could not start checkout.");
    } finally {
      setBusy(null);
    }
  }

  async function manage() {
    setBusy("portal");
    try {
      const r = await api.post<{ url?: string }>("/billing/portal", {});
      if (r.url) window.location.href = r.url;
    } catch {
      setNote("Could not open the billing portal.");
    } finally {
      setBusy(null);
    }
  }

  if (!status) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  const trialLeft = status.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(status.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Current plan</div>
            <div className="text-lg font-semibold capitalize text-gray-900">{status.plan}</div>
            {status.plan === "trial" && trialLeft !== null && (
              <div className="text-sm text-gray-500">{trialLeft} days left in trial</div>
            )}
          </div>
          {status.hasSubscription && (
            <button
              onClick={manage}
              disabled={busy === "portal"}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Manage billing
            </button>
          )}
        </div>
        {!status.billingConfigured && (
          <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Billing is in setup mode. Add your Stripe keys to enable paid plans.
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {status.plans.map((p) => {
          const current = status.plan === p.key;
          return (
            <div key={p.key} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5">
              <div className="text-lg font-semibold text-gray-900">{p.name}</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                ${p.monthly.toLocaleString()}
                <span className="text-sm font-normal text-gray-500">/mo</span>
              </div>
              <p className="mt-2 flex-1 text-sm text-gray-600">{p.blurb}</p>
              <button
                onClick={() => choose(p.key)}
                disabled={current || busy === p.key}
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {busy === p.key && <Loader2 className="h-4 w-4 animate-spin" />}
                {current ? (
                  <>
                    <Check className="h-4 w-4" /> Current
                  </>
                ) : (
                  "Choose plan"
                )}
              </button>
            </div>
          );
        })}
      </div>

      {note && <div className="mt-4 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">{note}</div>}
    </div>
  );
}
