import { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useCreateInvoice } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  MapPin, Phone, CheckCircle2, Loader2, Navigation, ClipboardList,
  Info, FileText, Briefcase, DollarSign, Send, Zap, Clock, Star,
  AlertTriangle, TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiBase } from "@/lib/api";

type InvoiceLineItem = { description: string; quantity: number; unitPrice: number; amount: number; };

function buildLineItems(job: any): InvoiceLineItem[] {
  const price = job.customerPrice ?? 0;
  const items: InvoiceLineItem[] = [
    { description: `${job.serviceType} — ${job.address}`, quantity: 1, unitPrice: price, amount: price },
  ];
  if (job.notes) {
    items.push({ description: `Special instructions: ${job.notes}`, quantity: 0, unitPrice: 0, amount: 0 });
  }
  return items.filter((i) => i.quantity > 0);
}

const FLOW_STEPS = [
  { status: "pending",     label: "Awaiting Accept" },
  { status: "accepted",    label: "Accepted" },
  { status: "en_route",    label: "En Route" },
  { status: "arrived",     label: "On Site" },
  { status: "complete",    label: "Complete" },
];

function StatusFlow({ current }: { current: string }) {
  const idx = FLOW_STEPS.findIndex((s) => s.status === current);
  return (
    <div className="flex items-center gap-1 py-2">
      {FLOW_STEPS.map((step, i) => (
        <div key={step.status} className="flex items-center flex-1">
          <div className={`flex flex-col items-center flex-1 ${i <= idx ? "text-primary" : "text-gray-300"}`}>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
              i < idx ? "bg-primary border-primary text-white" :
              i === idx ? "bg-white border-primary text-primary" :
              "bg-white border-gray-200 text-gray-300"
            }`}>
              {i < idx ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-[9px] font-semibold mt-1 text-center leading-tight w-12 ${i <= idx ? "text-primary" : "text-gray-300"}`}>
              {step.label}
            </span>
          </div>
          {i < FLOW_STEPS.length - 1 && (
            <div className={`h-0.5 flex-shrink-0 w-2 ${i < idx ? "bg-primary" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function InvoicePreviewDialog({ open, job, assignment, onClose, onSend, loading, invoiceSent }: {
  open: boolean; job: any; assignment: any; onClose: () => void; onSend: () => void; loading: boolean; invoiceSent: boolean;
}) {
  const lineItems = buildLineItems(job);
  const subtotal = job.customerPrice ?? 0;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-4">
        {invoiceSent ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-bold">Invoice Sent!</h2>
            <p className="text-muted-foreground text-sm">The customer will receive an invoice for ${subtotal.toFixed(2)}. Great work!</p>
            <Button className="w-full" onClick={onClose}>Back to Jobs</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Job Complete — Review Invoice
              </DialogTitle>
              <DialogDescription>Confirm details before sending to {job.customerName}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider border-b pb-2">
                  <span>Description</span><span>Amount</span>
                </div>
                {lineItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-foreground pr-4">{item.description}</span>
                    <span className="font-bold shrink-0">${item.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between font-bold text-base">
                  <span>Total Due</span><span className="text-primary">${subtotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                <strong>Collect on-site?</strong> Collect cash now, or send the invoice for online payment.
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 border-green-400 text-green-700 hover:bg-green-50" onClick={onSend} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <DollarSign className="w-4 h-4 mr-1" />} Collected Cash
              </Button>
              <Button className="flex-1 gap-2" onClick={onSend} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />} Send Invoice
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const NEXT_STATUS: Record<string, { status: string; label: string; className: string }> = {
  pending:  { status: "accepted",    label: "Accept Job",        className: "bg-blue-600 hover:bg-blue-700 text-white" },
  accepted: { status: "en_route",    label: "I'm En Route",      className: "bg-purple-600 hover:bg-purple-700 text-white" },
  en_route: { status: "arrived",     label: "I've Arrived",      className: "bg-indigo-600 hover:bg-indigo-700 text-white" },
  arrived:  { status: "complete",    label: "Complete & Invoice", className: "bg-green-600 hover:bg-green-700 text-white" },
};

export default function JobDetail() {
  const [, params] = useRoute("/jobs/:jobId");
  const jobId = parseInt(params?.jobId || "0", 10);
  const { workerId } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  useEffect(() => { if (!workerId) setLocation("/"); }, [workerId, setLocation]);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["workerJobs", workerId],
    queryFn: async () => {
      const r = await fetch(`${apiBase()}/worker/jobs/${workerId}`);
      return r.json() as Promise<any[]>;
    },
    enabled: !!workerId,
    refetchInterval: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ assignmentId, status }: { assignmentId: number; status: string }) => {
      const r = await fetch(`${apiBase()}/worker/assignments/${assignmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workerJobs", workerId] }),
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const createInvoice = useCreateInvoice();

  if (!workerId || isNaN(jobId)) return null;

  const job = jobs?.find((j: any) => j.id === jobId);
  const assignment = job?.assignment;

  if (isLoading) {
    return (
      <Layout title="Job Details" showBack backHref="/jobs">
        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      </Layout>
    );
  }

  if (!job || !assignment) {
    return (
      <Layout title="Job Details" showBack backHref="/jobs">
        <Card className="p-8 text-center border-dashed">
          <h3 className="font-bold text-lg">Job not found</h3>
          <p className="text-muted-foreground mt-1">This job may have been reassigned.</p>
        </Card>
      </Layout>
    );
  }

  const handleAdvanceStatus = () => {
    const next = NEXT_STATUS[assignment.status];
    if (!next) return;
    if (next.status === "complete") {
      updateStatus.mutate({ assignmentId: assignment.id, status: "complete" }, {
        onSuccess: () => setShowInvoiceDialog(true),
      });
    } else {
      updateStatus.mutate({ assignmentId: assignment.id, status: next.status }, {
        onSuccess: () => toast({ title: `Status updated to ${next.status.replace("_", " ")}` }),
      });
    }
  };

  const handleSendInvoice = () => {
    const lineItems = buildLineItems(job);
    const subtotal = job.customerPrice ?? 0;
    createInvoice.mutate({
      data: { jobId: job.id, customerName: job.customerName, customerPhone: job.phone, serviceType: job.serviceType, lineItems, subtotal, total: subtotal },
    }, {
      onSuccess: () => {
        setInvoiceSent(true);
        queryClient.invalidateQueries({ queryKey: ["workerJobs", workerId] });
      },
      onError: () => toast({ title: "Failed to send invoice", variant: "destructive" }),
    });
  };

  const isComplete = ["complete", "declined"].includes(assignment.status);
  const nextAction = NEXT_STATUS[assignment.status];
  const surgeActive = job.surgePriceMultiplier && job.surgePriceMultiplier > 1.0;

  return (
    <Layout title="Job Details" showBack backHref="/jobs">
      <div className="space-y-4 pb-28">
        {/* Header card */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className={`h-1.5 w-full ${surgeActive ? "bg-orange-400" : "bg-primary"}`} />
          <div className="p-5 bg-white space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{job.customerName}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">{job.serviceType}</Badge>
                  {job.urgency === "urgent" && <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">URGENT</Badge>}
                  {surgeActive && <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs"><Zap className="w-3 h-3 mr-0.5" />SURGE x{job.surgePriceMultiplier}</Badge>}
                  {job.preferredTime && <Badge variant="secondary" className="text-xs"><Clock className="w-2.5 h-2.5 mr-1" />{job.preferredTime}</Badge>}
                </div>
              </div>
            </div>

            {/* Status flow */}
            <StatusFlow current={assignment.status} />

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button variant="outline" className="h-12" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(job.address)}`, "_blank")}>
                <Navigation className="mr-2 h-5 w-5 text-primary" /> Directions
              </Button>
              <Button variant="outline" className="h-12" onClick={() => window.open(`tel:${job.phone}`, "_self")}>
                <Phone className="mr-2 h-5 w-5 text-primary" /> Call
              </Button>
            </div>
          </div>
        </Card>

        {/* Details */}
        <Card className="shadow-sm">
          <CardContent className="p-0 divide-y">
            <div className="flex items-start p-4">
              <MapPin className="h-5 w-5 text-gray-400 mr-3 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Address</p>
                <p className="text-sm font-medium text-gray-900">{job.address}</p>
              </div>
            </div>
            <div className="flex items-start p-4">
              <Phone className="h-5 w-5 text-gray-400 mr-3 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Phone</p>
                <a href={`tel:${job.phone}`} className="text-sm font-medium text-primary">{job.phone}</a>
              </div>
            </div>
            <div className="flex items-start p-4">
              <DollarSign className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Your Pay</p>
                <p className="text-lg font-black text-green-700">${assignment.subPay?.toFixed(2)}</p>
              </div>
              {job.customerPrice && (
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">Collect</p>
                  <p className="text-sm font-bold">${job.customerPrice.toFixed(2)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {job.notes && (
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Job Notes</p>
              </div>
              <p className="text-sm font-medium text-amber-900">{job.notes}</p>
            </CardContent>
          </Card>
        )}

        {isComplete && (
          <Card className="border-green-200 bg-green-50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
              <div>
                <p className="font-bold text-green-800">Job Complete!</p>
                <p className="text-sm text-green-700">Invoice was sent to the customer.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-20">
        <div className="max-w-md mx-auto">
          {nextAction && (
            <Button
              className={`w-full h-14 text-base font-bold rounded-xl shadow-lg ${nextAction.className}`}
              onClick={handleAdvanceStatus}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {nextAction.label}
            </Button>
          )}
          {isComplete && (
            <div className="flex items-center justify-center h-14 bg-gray-100 rounded-xl text-gray-600 font-bold border-2 border-gray-200">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" /> Job Done
            </div>
          )}
        </div>
      </div>

      <InvoicePreviewDialog
        open={showInvoiceDialog}
        job={job}
        assignment={assignment}
        onClose={() => { setShowInvoiceDialog(false); if (invoiceSent) setLocation("/jobs"); }}
        onSend={handleSendInvoice}
        loading={createInvoice.isPending}
        invoiceSent={invoiceSent}
      />
    </Layout>
  );
}
