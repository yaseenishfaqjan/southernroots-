import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary" className="bg-gray-200 text-gray-800 hover:bg-gray-200 font-bold px-3 py-1 text-sm border-gray-300">Pending</Badge>;
    case "in_progress":
      return <Badge className="bg-blue-600 text-white hover:bg-blue-600 font-bold px-3 py-1 text-sm shadow-sm border-blue-700">In Progress</Badge>;
    case "complete":
    case "completed":
      return <Badge className="bg-green-600 text-white hover:bg-green-600 font-bold px-3 py-1 text-sm shadow-sm border-green-700">Completed</Badge>;
    default:
      return <Badge variant="outline" className="font-bold px-3 py-1 text-sm">{status}</Badge>;
  }
}
