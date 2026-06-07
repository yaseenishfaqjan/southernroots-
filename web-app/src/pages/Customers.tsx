import { useQuery } from "@tanstack/react-query";
import StatusBadge from "../components/StatusBadge";
import { api, formatMoney, formatDate } from "../lib/api";

interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  tier: string;
  mrrCents: number;
  churnRiskScore: number | null;
  createdAt: string;
  address: string | null;
  notes: string | null;
}

function ChurnRiskBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-300 text-xs">—</span>;
  const pct = Math.round(score * 100);
  const color =
    pct >= 70
      ? "bg-red-500"
      : pct >= 40
      ? "bg-yellow-400"
      : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{pct}%</span>
    </div>
  );
}

export default function Customers() {
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => api.get("/customers?sort=mrr"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {customers?.length ?? 0} customers · sorted by MRR
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {[
                "Name",
                "Phone",
                "Email",
                "Tier",
                "MRR",
                "Churn Risk",
                "Member Since",
              ].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  Loading customers...
                </td>
              </tr>
            )}
            {customers?.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {c.name}
                    </p>
                    {c.address && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.address}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {c.phone ?? "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {c.email ?? "—"}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={c.tier} />
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  {formatMoney(c.mrrCents)}
                  <span className="text-gray-400 font-normal">/mo</span>
                </td>
                <td className="px-6 py-4">
                  <ChurnRiskBar score={c.churnRiskScore} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(c.createdAt)}
                </td>
              </tr>
            ))}
            {!isLoading && !customers?.length && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  No customers yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
