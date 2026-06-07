import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { api, formatMoney, formatDate } from "../lib/api";

const STATUS_TABS = ["all", "sent", "paid", "overdue", "draft"] as const;

interface Invoice {
  id: number;
  customerId: number;
  customerName?: string;
  amountCents: number;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  jobId: number | null;
}

export default function Invoices() {
  const [status, setStatus] = useState<string>("all");
  const qc = useQueryClient();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices", status],
    queryFn: () =>
      api.get(`/invoices${status !== "all" ? `?status=${status}` : ""}`),
  });

  const resend = useMutation({
    mutationFn: (id: number) => api.post(`/invoices/${id}/resend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const totalAmount =
    invoices?.reduce((sum, inv) => sum + inv.amountCents, 0) ?? 0;
  const overdueCount =
    invoices?.filter((inv) => inv.status === "overdue").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            {invoices?.length ?? 0} invoices ·{" "}
            {overdueCount > 0 && (
              <span className="text-red-500 font-medium">
                {overdueCount} overdue ·{" "}
              </span>
            )}
            Total: {formatMoney(totalAmount)}
          </p>
        </div>
      </div>

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
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["#", "Customer", "Amount", "Status", "Due Date", "Actions"].map(
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
                  Loading invoices...
                </td>
              </tr>
            )}
            {invoices?.map((inv) => (
              <tr
                key={inv.id}
                className={`hover:bg-gray-50 ${
                  inv.status === "overdue" ? "bg-red-50" : ""
                }`}
              >
                <td className="px-6 py-4 text-sm text-gray-500">
                  #{inv.id}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {inv.customerName ?? `Customer #${inv.customerId}`}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  {formatMoney(inv.amountCents)}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={inv.status} />
                </td>
                <td
                  className={`px-6 py-4 text-sm ${
                    inv.status === "overdue"
                      ? "text-red-600 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {formatDate(inv.dueDate)}
                </td>
                <td className="px-6 py-4">
                  {(inv.status === "sent" || inv.status === "overdue") && (
                    <button
                      onClick={() => resend.mutate(inv.id)}
                      disabled={resend.isPending}
                      className="flex items-center gap-1.5 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      Resend
                    </button>
                  )}
                  {inv.status === "paid" && (
                    <span className="text-xs text-gray-400">
                      Paid {formatDate(inv.paidAt)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && !invoices?.length && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
