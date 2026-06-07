import { Badge } from "@/components/ui/badge";

export function JobStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    new: { label: "New Lead", variant: "destructive" },
    assigned: { label: "Assigned", variant: "secondary" },
    in_progress: { label: "In Progress", variant: "default" },
    complete: { label: "Complete", variant: "outline" },
    paid: { label: "Paid", variant: "outline" },
  };

  const info = statusMap[status] || { label: status, variant: "outline" };

  return (
    <Badge variant={info.variant} className={status === "complete" ? "bg-green-100 text-green-800 border-green-200" : status === "paid" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}>
      {info.label}
    </Badge>
  );
}

export function AssignmentStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pending", variant: "secondary" },
    in_progress: { label: "Working", variant: "default" },
    complete: { label: "Done", variant: "outline" },
  };

  const info = statusMap[status] || { label: status, variant: "outline" };

  return (
    <Badge variant={info.variant} className={status === "complete" ? "bg-green-100 text-green-800 border-green-200" : ""}>
      {info.label}
    </Badge>
  );
}