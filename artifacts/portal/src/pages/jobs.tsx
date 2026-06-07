import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { 
  useListJobs, 
  getListJobsQueryKey, 
  useGetJob,
  getGetJobQueryKey,
  useAssignJob,
  useUpdateJob,
  useUpdateAssignment,
  useListSubcontractors,
  getListSubcontractorsQueryKey,
  useGetInvoiceByJob,
  useUpdateInvoiceStatus,
  type Job
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { 
  Briefcase, 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Phone, 
  Calendar,
  DollarSign,
  User,
  FileText,
  Receipt,
  CheckCircle2,
  Star,
  Zap,
  Navigation,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { JobStatusBadge, AssignmentStatusBadge } from "@/components/jobs/status-badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

function JobDetailSheet({ 
  jobId, 
  open, 
  onOpenChange 
}: { 
  jobId: number | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: job, isLoading } = useGetJob(jobId || 0, {
    query: {
      enabled: !!jobId && open,
      queryKey: getGetJobQueryKey(jobId || 0)
    }
  });

  const { data: subs } = useListSubcontractors({
    query: {
      enabled: open && job?.status === "new",
      queryKey: getListSubcontractorsQueryKey()
    }
  });

  const showInvoice = job?.status === "complete" || job?.status === "paid";
  const { data: invoice, refetch: refetchInvoice } = useGetInvoiceByJob(jobId || 0, {
    query: {
      enabled: !!jobId && open && showInvoice,
      retry: false
    }
  });

  const assignJob = useAssignJob();
  const updateJob = useUpdateJob();
  const updateAssignment = useUpdateAssignment();
  const updateInvoiceStatus = useUpdateInvoiceStatus();

  const [selectedSubId, setSelectedSubId] = useState<string>("");
  const [subPay, setSubPay] = useState<string>("");
  const [customerPrice, setCustomerPrice] = useState<string>("");

  // Matching engine state
  const [matchedContractors, setMatchedContractors] = useState<any[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchedJobId, setMatchedJobId] = useState<number | null>(null);
  const [surgeMultiplier, setSurgeMultiplier] = useState<number | null>(null);
  const [dispatchingId, setDispatchingId] = useState<number | null>(null);

  const BASE_URL = typeof import.meta.env.BASE_URL === "string"
    ? import.meta.env.BASE_URL.replace(/\/$/, "")
    : "";

  const fetchMatches = async (jid: number) => {
    setMatchLoading(true);
    setMatchedContractors([]);
    setMatchedJobId(jid);
    try {
      const [matchRes, surgeRes] = await Promise.all([
        fetch(`${BASE_URL}/../api/matching/contractors-near/${jid}`),
        fetch(`${BASE_URL}/../api/matching/surge-price/${jid}`),
      ]);
      const matchData = await matchRes.json();
      const surgeData = await surgeRes.json();
      setMatchedContractors(matchData.contractors || []);
      setSurgeMultiplier(parseFloat(surgeData.multiplier) || 1.0);
    } catch {
      toast({ title: "Failed to load nearby contractors", variant: "destructive" });
    } finally {
      setMatchLoading(false);
    }
  };

  const handleAutoDispatch = async (jid: number) => {
    setDispatchingId(-1);
    try {
      const r = await fetch(`${BASE_URL}/../api/matching/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: jid }),
      });
      const data = await r.json();
      if (data.success) {
        toast({ title: "Auto-dispatched!", description: `Job sent to ${data.contractorName}` });
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jid) });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        setMatchedContractors([]);
      } else {
        toast({ title: "No available contractors", description: data.message || "Try again later", variant: "destructive" });
      }
    } catch {
      toast({ title: "Dispatch failed", variant: "destructive" });
    } finally {
      setDispatchingId(null);
    }
  };

  const handleManualDispatch = async (jid: number, contractorId: number, contractorName: string) => {
    setDispatchingId(contractorId);
    try {
      const r = await fetch(`${BASE_URL}/../api/matching/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: jid, contractorId }),
      });
      const data = await r.json();
      if (data.success) {
        toast({ title: "Dispatched!", description: `Job sent to ${contractorName}` });
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jid) });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        setMatchedContractors([]);
      } else {
        toast({ title: "Failed to dispatch", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Dispatch failed", variant: "destructive" });
    } finally {
      setDispatchingId(null);
    }
  };

  // Load matches when sheet opens for a new job
  useEffect(() => {
    if (open && jobId && job?.status === "new" && matchedJobId !== jobId) {
      fetchMatches(jobId);
    }
    if (!open) {
      setMatchedContractors([]);
      setMatchedJobId(null);
      setSurgeMultiplier(null);
    }
  }, [open, jobId, job?.status]);

  const handleAssign = () => {
    if (!job || !selectedSubId || !subPay) return;

    assignJob.mutate({
      id: job.id,
      data: {
        subcontractorId: parseInt(selectedSubId),
        subPay: parseFloat(subPay),
        customerPrice: customerPrice ? parseFloat(customerPrice) : undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Job Assigned", description: "Subcontractor has been notified." });
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(job.id) });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Failed to assign job", description: err.message || "An error occurred", variant: "destructive" });
      }
    });
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (!job) return;
    
    updateJob.mutate({
      id: job.id,
      data: { status: newStatus }
    }, {
      onSuccess: () => {
        toast({ title: "Status Updated", description: `Job marked as ${newStatus}.` });
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(job.id) });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
      }
    });
  };

  const handleAssignmentStatusUpdate = (newStatus: string) => {
    if (!job || !job.assignment) return;
    
    const isComplete = newStatus === "complete";
    updateAssignment.mutate({
      id: job.assignment.id,
      data: { 
        status: newStatus,
        completedAt: isComplete ? new Date().toISOString() : undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Assignment Updated", description: `Assignment marked as ${newStatus}.` });
        queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(job.id) });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        
        // Also update job status if assignment is complete
        if (isComplete && job.status === "in_progress") {
          handleStatusUpdate("complete");
        } else if (newStatus === "in_progress" && job.status === "assigned") {
          handleStatusUpdate("in_progress");
        }
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {isLoading || !job ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="pt-8 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : (
          <>
            <SheetHeader className="pb-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <SheetTitle className="text-xl">{job.customerName}</SheetTitle>
                  <SheetDescription>{job.serviceType} {job.planName ? `(${job.planName})` : ''}</SheetDescription>
                </div>
                <JobStatusBadge status={job.status} />
              </div>
            </SheetHeader>

            <div className="py-6 space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Customer Details</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{job.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{job.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Created {format(new Date(job.createdAt), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>

              {job.notes && (
                <div className="space-y-2 text-sm">
                  <h3 className="font-semibold text-muted-foreground uppercase tracking-wider">Notes</h3>
                  <p className="bg-muted p-3 rounded-md text-foreground">{job.notes}</p>
                </div>
              )}

              <Separator />

              {job.status === "new" && !job.assignment ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Zap className="w-4 h-4" /> Matching Engine
                    </h3>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => fetchMatches(job.id)}
                      disabled={matchLoading}
                    >
                      {matchLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refresh"}
                    </Button>
                  </div>

                  {/* Surge badge */}
                  {surgeMultiplier != null && surgeMultiplier > 1.05 && (
                    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-md px-3 py-2 text-xs font-semibold text-orange-800">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Surge Pricing Active — {surgeMultiplier.toFixed(2)}x multiplier
                    </div>
                  )}

                  {/* Auto-dispatch button */}
                  <Button
                    className="w-full gap-2"
                    onClick={() => handleAutoDispatch(job.id)}
                    disabled={dispatchingId !== null || matchLoading}
                    variant="default"
                  >
                    {dispatchingId === -1 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {dispatchingId === -1 ? "Dispatching…" : "Auto-Dispatch Best Match"}
                  </Button>

                  {/* Contractor cards */}
                  {matchLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" /> Finding nearby contractors…
                    </div>
                  )}

                  {!matchLoading && matchedContractors.length === 0 && matchedJobId === job.id && (
                    <p className="text-xs text-muted-foreground text-center py-3">No online contractors found nearby.</p>
                  )}

                  <div className="space-y-2">
                    {matchedContractors.map((c: any) => (
                      <div key={c.id} className={`border rounded-lg p-3 text-sm ${c.isOnline ? "bg-white" : "bg-muted/40 opacity-75"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold truncate">{c.name}</span>
                              <span className={`w-2 h-2 rounded-full shrink-0 ${c.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                              {c.isOnline ? (
                                <span className="text-xs text-green-700 font-medium">Online</span>
                              ) : (
                                <span className="text-xs text-gray-500">Offline</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-0.5">
                                <Navigation className="w-3 h-3" />
                                {typeof c.distanceMiles === "number" ? `${c.distanceMiles.toFixed(1)} mi` : "? mi"}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                ~{c.etaMinutes ?? "?"} min
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {typeof c.rating === "number" ? c.rating.toFixed(1) : c.rating ?? "—"}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3" />
                                {c.completionRate != null ? `${Math.round(parseFloat(c.completionRate) * 100)}%` : "—"}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={c.isOnline ? "default" : "outline"}
                            className="shrink-0 text-xs h-7 px-2"
                            disabled={dispatchingId !== null || !c.isOnline}
                            onClick={() => handleManualDispatch(job.id, c.id, c.name)}
                          >
                            {dispatchingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                          </Button>
                        </div>
                        {c.specialty && (
                          <p className="text-xs text-muted-foreground mt-1.5 truncate">{c.specialty}</p>
                        )}
                        {c.score != null && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <div className="h-1.5 rounded-full bg-muted flex-1 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min(100, Math.round(parseFloat(c.score) * 20))}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">Score {parseFloat(c.score).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : job.assignment ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Assignment Details</h3>
                    <AssignmentStatusBadge status={job.assignment.status} />
                  </div>
                  
                  <div className="grid gap-3 p-4 bg-muted/30 rounded-lg border text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1"><User className="h-4 w-4"/> Subcontractor</span>
                      <span className="font-medium">{job.assignment.subName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4"/> Sub Payout</span>
                      <span className="font-medium text-destructive">{formatCurrency(job.assignment.subPay)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Customer Price</span>
                      <span className="font-medium">{job.customerPrice ? formatCurrency(job.customerPrice) : 'N/A'}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between items-center font-bold text-primary">
                      <span>Owner Profit</span>
                      <span>{formatCurrency(job.assignment.ownerProfit)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h3 className="font-semibold text-sm">Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {job.assignment.status === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => handleAssignmentStatusUpdate("in_progress")} disabled={updateAssignment.isPending}>
                          Mark In Progress
                        </Button>
                      )}
                      {job.assignment.status === "in_progress" && (
                        <Button variant="default" size="sm" onClick={() => handleAssignmentStatusUpdate("complete")} disabled={updateAssignment.isPending}>
                          Mark Complete
                        </Button>
                      )}
                      {job.status === "complete" && (
                        <Button
                          variant="outline"
                          className="col-span-2 border-green-500 text-green-700 hover:bg-green-50"
                          disabled={updateJob.isPending || updateInvoiceStatus.isPending}
                          onClick={() => {
                            handleStatusUpdate("paid");
                            if (invoice) {
                              updateInvoiceStatus.mutate(
                                { id: invoice.id, data: { status: "paid" } },
                                {
                                  onSuccess: () => {
                                    refetchInvoice();
                                    toast({ title: "Invoice marked paid", description: "Customer payment recorded." });
                                  },
                                }
                              );
                            }
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Mark Customer Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {showInvoice && invoice && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm uppercase tracking-wider flex items-center gap-1">
                      <Receipt className="w-4 h-4" /> Invoice
                    </h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      invoice.status === "paid" ? "bg-green-100 text-green-800" :
                      invoice.status === "sent" ? "bg-blue-50 text-blue-800" :
                      "bg-yellow-50 text-yellow-800"
                    }`}>
                      {invoice.status === "paid" ? "Paid" : invoice.status === "sent" ? "Sent" : "Draft"}
                    </span>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg text-sm space-y-1.5">
                    <div className="text-xs text-muted-foreground font-mono mb-2">{invoice.invoiceNumber}</div>
                    {invoice.lineItems.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-muted-foreground truncate pr-2">{item.description}</span>
                        <span className="font-medium shrink-0">${item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-foreground">
                      <span>Total</span>
                      <span className="text-primary">${invoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                  {invoice.sentAt && (
                    <p className="text-xs text-muted-foreground">Sent: {format(new Date(invoice.sentAt), "MMM d, yyyy h:mm a")}</p>
                  )}
                  {invoice.paidAt && (
                    <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Paid: {format(new Date(invoice.paidAt), "MMM d, yyyy h:mm a")}
                    </p>
                  )}
                </div>
              )}

              {showInvoice && !invoice && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    Invoice not yet generated (worker hasn't completed job in app)
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function Jobs() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: jobs, isLoading } = useListJobs(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
    { query: { queryKey: getListJobsQueryKey(statusFilter !== "all" ? { status: statusFilter } : undefined) } }
  );

  const filteredJobs = jobs?.filter(job => 
    job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openJobDetail = (id: number) => {
    setSelectedJobId(id);
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispatch Board</h1>
          <p className="text-sm text-gray-500">Manage jobs and subcontractor assignments.</p>
        </div>
        <Button onClick={() => setLocation("/jobs/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Lead
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search customer, address, or service..." 
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New Leads</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))
        ) : filteredJobs && filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <Card 
              key={job.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm"
              onClick={() => openJobDetail(job.id)}
            >
              <CardContent className="p-0">
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <h3 className="font-semibold text-lg text-foreground">{job.customerName}</h3>
                      <JobStatusBadge status={job.status} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground gap-2 sm:gap-6">
                      <div className="flex items-center">
                        <MapPin className="mr-1.5 h-4 w-4" />
                        {job.address}
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="mr-1.5 h-4 w-4" />
                        {job.serviceType}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-4 sm:pt-0">
                    {job.assignment ? (
                      <div className="text-sm flex flex-col items-end">
                        <span className="font-medium text-foreground">{job.assignment.subName}</span>
                        <span className="text-muted-foreground">{formatCurrency(job.assignment.subPay)}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                        Needs Assignment
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(job.createdAt), "MMM d")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No jobs found</h3>
            <p className="mt-1 text-muted-foreground">Try adjusting your filters or create a new lead.</p>
            <Button className="mt-6" variant="outline" onClick={() => setLocation("/jobs/new")}>
              Create Job
            </Button>
          </div>
        )}
      </div>

      <JobDetailSheet 
        jobId={selectedJobId} 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
      />
    </div>
  );
}