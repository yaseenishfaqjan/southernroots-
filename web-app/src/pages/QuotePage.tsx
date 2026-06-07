import { useEffect, useState } from "react";
import { Leaf, Loader2, CheckCircle2 } from "lucide-react";
import { api, formatMoney } from "../lib/api";

interface QuoteService {
  name: string;
  price: number;
  description?: string;
  unit?: string;
}
interface PublicQuote {
  id: number;
  services: QuoteService[] | null;
  totalCents: number;
  status: string;
  customerName: string | null;
  orgName: string | null;
}

function quoteIdFromUrl(): number {
  const m = window.location.pathname.match(/\/quote\/(\d+)/);
  return m ? Number(m[1]) : 0;
}

export default function QuotePage() {
  const [id] = useState(quoteIdFromUrl);
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PublicQuote>(`/public/quotes/${id}`)
      .then((q) => {
        setQuote(q);
        if (q.status === "accepted") setAccepted(true);
      })
      .catch(() => setError("We couldn't find this quote."))
      .finally(() => setLoading(false));
  }, [id]);

  async function accept() {
    setAccepting(true);
    setError(null);
    try {
      await api.post(`/public/quotes/${id}/accept`);
      setAccepted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-600">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{quote?.orgName ?? "Southern Roots Turf"}</h1>
        </div>

        {error && !quote ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">{error}</div>
        ) : accepted ? (
          <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Quote accepted — thank you!</h2>
            <p className="mt-2 text-sm text-gray-600">
              We've scheduled your service. You'll hear from {quote?.orgName ?? "us"} shortly.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Hi {quote?.customerName ?? "there"}, here's your personalized lawn care quote:
            </p>
            <div className="mt-5 divide-y divide-gray-100">
              {(quote?.services ?? []).map((s, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{s.name}</div>
                    {s.description && <div className="text-xs text-gray-500">{s.description}</div>}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    ${s.price}
                    {s.unit === "monthly" ? "/mo" : ""}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-green-600">{formatMoney(quote?.totalCents ?? 0)}/mo</span>
            </div>

            {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <button
              onClick={accept}
              disabled={accepting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {accepting && <Loader2 className="h-4 w-4 animate-spin" />}
              Accept this quote
            </button>
            <p className="mt-3 text-center text-xs text-gray-400">No commitment — cancel anytime.</p>
          </div>
        )}
      </div>
    </div>
  );
}
