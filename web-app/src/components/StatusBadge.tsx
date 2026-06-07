const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  assigned: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-orange-100 text-orange-700",
  complete: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
  open: "bg-red-100 text-red-700",
  in_review: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  sent: "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-700",
  draft: "bg-gray-100 text-gray-600",
  standard: "bg-gray-100 text-gray-700",
  premium: "bg-purple-100 text-purple-700",
  suspended: "bg-red-100 text-red-700",
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
};

export default function StatusBadge({ status }: { status?: string | null }) {
  const s = status && status.length > 0 ? status : "—";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusColors[s] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {s.replace(/_/g, " ")}
    </span>
  );
}
