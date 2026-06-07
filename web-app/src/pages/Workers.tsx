import { useQuery } from "@tanstack/react-query";
import StatusBadge from "../components/StatusBadge";
import { api } from "../lib/api";

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

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-gray-300 text-xs">—</span>;
  const stars = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={
            s <= stars ? "text-yellow-400" : "text-gray-200"
          }
        >
          ★
        </span>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function Workers() {
  const { data: workers, isLoading } = useQuery<Worker[]>({
    queryKey: ["workers"],
    queryFn: () => api.get("/workers"),
  });

  const activeCount = workers?.filter((w) => w.status === "active").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workers</h1>
        <p className="text-sm text-gray-500 mt-1">
          {activeCount} active crew members
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {[
                "Name",
                "Phone",
                "Specialty",
                "Rating",
                "Completion Rate",
                "Active Jobs",
                "Today",
                "Status",
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
                  colSpan={8}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  Loading workers...
                </td>
              </tr>
            )}
            {workers?.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {w.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {w.phone ?? "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {w.specialty
                    ? w.specialty.replace(/_/g, " ")
                    : "—"}
                </td>
                <td className="px-6 py-4">
                  <StarRating rating={w.rating} />
                </td>
                <td className="px-6 py-4">
                  {w.completionRate !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${Math.round(w.completionRate * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {Math.round(w.completionRate * 100)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                    {w.activeJobCount}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {w.todayJobCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {w.todayJobCount} today
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={w.status} />
                </td>
              </tr>
            ))}
            {!isLoading && !workers?.length && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  No workers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
