import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, AlertTriangle } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { api, formatDate } from "../lib/api";
import { useToast } from "../lib/toast";

interface Escalation {
  id: number;
  jobId: number | null;
  customerId: number | null;
  customerName?: string;
  reason: string;
  status: string;
  notes: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export default function Escalations() {
  const qc = useQueryClient();
  const toast = useToast();

  const { data: escalations, isLoading } = useQuery<Escalation[]>({
    queryKey: ["escalations"],
    queryFn: () => api.get("/escalations"),
  });

  const resolve = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/escalations/${id}`, { status: "resolved" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["escalations"] });
      toast("Escalation resolved");
    },
    onError: () => toast("Could not resolve the escalation", "error"),
  });

  const openCount =
    escalations?.filter((e) => e.status === "open").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Escalations</h1>
        <p className="text-sm text-gray-500 mt-1">
          {openCount > 0 ? (
            <span className="text-red-500 font-medium">
              {openCount} open issue{openCount !== 1 ? "s" : ""} requiring
              attention
            </span>
          ) : (
            "No open escalations — all clear"
          )}
        </p>
      </div>

      {openCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{openCount} escalation{openCount !== 1 ? "s" : ""}</strong>{" "}
            {openCount !== 1 ? "need" : "needs"} your attention. Review and
            resolve each one to keep customers happy.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["#", "Customer", "Reason", "Status", "Created", "Actions"].map(
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
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  Loading escalations...
                </td>
              </tr>
            )}
            {escalations?.map((esc) => (
              <tr
                key={esc.id}
                className={`hover:bg-gray-50 ${
                  esc.status === "open" ? "bg-red-50/40" : ""
                }`}
              >
                <td className="px-6 py-4 text-sm text-gray-500">
                  #{esc.id}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {esc.customerName ?? (esc.customerId ? `Customer #${esc.customerId}` : "—")}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm text-gray-900">{esc.reason}</p>
                    {esc.notes && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {esc.notes}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={esc.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(esc.createdAt)}
                </td>
                <td className="px-6 py-4">
                  {esc.status === "open" && (
                    <button
                      onClick={() => resolve.mutate(esc.id)}
                      disabled={resolve.isPending}
                      className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Resolve
                    </button>
                  )}
                  {esc.status === "resolved" && (
                    <span className="text-xs text-gray-400">
                      Resolved {formatDate(esc.resolvedAt)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && !escalations?.length && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  No escalations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
