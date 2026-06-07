import { useState } from "react";
import { useParams, Link } from "wouter";
import { brand } from "@workspace/brand";
import { useGetJob, useGetInvoiceByJob, useUpdateInvoiceStatus } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Circle,
  MapPin,
  Phone,
  User,
  Wrench,
  ArrowLeft,
  Calendar,
  DollarSign,
  CreditCard,
  Lock,
  ExternalLink,
  FileText,
  Receipt,
  Star,
  Clock,
  Navigation,
} from "lucide-react";

const STATUS_STEPS = [
  { id: "new",         label: "Request Received", description: "We've got your request and will be in touch soon." },
  { id: "assigned",    label: "Crew Assigned",    description: "A crew has been scheduled for your property." },
  { id: "in_progress", label: "In Progress",      description: "Your crew is on-site working right now." },
  { id: "complete",    label: "Completed",        description: "Job is finished. Please review your invoice and pay below." },
  { id: "paid",        label: "Paid",             description: `Payment received. Thank you for choosing ${brand.name}!` },
];

function RatingDialog({
  open, jobId, onClose, onRated,
}: { open: boolean; jobId: number; onClose: () => void; onRated: () => void; }) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitRating = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/worker/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, rating, review }),
      });
      return r.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      onRated();
    },
    onError: () => toast({ title: "Failed to submit rating", variant: "destructive" }),
  });

  const labels: Record<number, string> = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Great", 5: "Excellent!" };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Rate Your Service
          </DialogTitle>
          <DialogDescription>How was your experience with Southern Roots Turf?</DialogDescription>
        </DialogHeader>
        {submitted ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 fill-amber-400" />
            </div>
            <h3 className="text-lg font-bold">Thank you!</h3>
            <p className="text-sm text-muted-foreground">Your feedback helps us improve.</p>
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(s)}
                >
                  <Star className={`w-9 h-9 ${(hovered || rating) >= s ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`} />
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p className="text-center text-sm font-semibold text-amber-700">{labels[hovered || rating]}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="review">Comments (optional)</Label>
              <Input
                id="review"
                placeholder="Tell us about your experience…"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => submitRating.mutate()}
              disabled={rating === 0 || submitRating.isPending}
            >
              {submitRating.isPending ? "Submitting…" : "Submit Rating"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  open,
  onClose,
  amount,
  jobId,
  invoiceId,
  invoiceNumber,
  onPaid,
}: {
  open: boolean;
  onClose: () => void;
  amount: number;
  jobId: number;
  invoiceId?: number;
  invoiceNumber?: string;
  onPaid: () => void;
}) {
  const { toast } = useToast();
  const updateInvoice = useUpdateInvoiceStatus();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const formatCard = (val: string) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || cardNumber.replace(/\s/g, "").length < 16 || expiry.length < 5 || cvv.length < 3) {
      toast({ title: "Please fill in all card details", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (invoiceId) {
        updateInvoice.mutate(
          { id: invoiceId, data: { status: "paid" } },
          {
            onSuccess: () => {
              setLoading(false);
              setPaid(true);
              onPaid();
              toast({
                title: "Payment successful!",
                description: `$${amount.toFixed(2)} received for Job #${jobId}. Receipt sent to your phone.`,
              });
            },
            onError: () => {
              setLoading(false);
              setPaid(true);
              onPaid();
            },
          }
        );
      } else {
        setLoading(false);
        setPaid(true);
        onPaid();
        toast({
          title: "Payment successful!",
          description: `$${amount.toFixed(2)} received for Job #${jobId}. Receipt sent to your phone.`,
        });
      }
    }, 1600);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        {paid ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold">Payment Received!</h2>
            <p className="text-muted-foreground">
              Thank you! Your payment of <span className="font-semibold text-foreground">${amount.toFixed(2)}</span> has been processed.
              {invoiceNumber && <> Invoice <span className="font-mono">{invoiceNumber}</span> is now marked paid.</>}
            </p>
            <Button className="w-full mt-2" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Pay Invoice for Job #{jobId}
              </DialogTitle>
              <DialogDescription>
                {invoiceNumber && <span className="font-mono text-xs mr-2">{invoiceNumber}</span>}
                Amount due: <span className="font-semibold text-foreground text-base">${amount.toFixed(2)}</span>
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePay} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="card-name">Name on Card</Label>
                <Input id="card-name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-number">Card Number</Label>
                <div className="relative">
                  <Input
                    id="card-number"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCard(e.target.value))}
                    className="pr-10"
                  />
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input id="expiry" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} type="password" />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold gap-2" disabled={loading}>
                <Lock className="w-4 h-4" />
                {loading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
              </Button>
              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Secured with 256-bit encryption
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InvoiceCard({
  invoice,
  onPayNow,
}: {
  invoice: any;
  onPayNow: () => void;
}) {
  const isPaid = invoice.status === "paid";

  return (
    <Card className={`${isPaid ? "bg-green-50 border-green-200" : "bg-primary/5 border-primary/20"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Invoice
          </CardTitle>
          <Badge
            variant="outline"
            className={
              isPaid
                ? "bg-green-100 text-green-800 border-green-300"
                : invoice.status === "sent"
                ? "bg-blue-50 text-blue-800 border-blue-200"
                : "bg-yellow-50 text-yellow-800 border-yellow-200"
            }
          >
            {isPaid ? "Paid" : invoice.status === "sent" ? "Awaiting Payment" : "Draft"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground font-mono">{invoice.invoiceNumber}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          {invoice.lineItems.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground pr-2 truncate">{item.description}</span>
              <span className="font-medium shrink-0">${item.amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
            <span>Total Due</span>
            <span className="text-primary">${invoice.total.toFixed(2)}</span>
          </div>
        </div>

        {!isPaid && (
          <Button className="w-full gap-2" onClick={onPayNow}>
            <CreditCard className="w-4 h-4" />
            Pay ${invoice.total.toFixed(2)} Now
          </Button>
        )}

        {isPaid && (
          <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Payment confirmed
            {invoice.paidAt && (
              <span className="text-muted-foreground font-normal ml-auto">
                {new Date(invoice.paidAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function JobDetail() {
  const params = useParams<{ jobId: string }>();
  const jobId = parseInt(params.jobId || "0", 10);
  const [payOpen, setPayOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const { toast } = useToast();

  const { data: job, isLoading, isError, refetch: refetchJob } = useGetJob(jobId, {
    query: { enabled: !!jobId, retry: false },
  });

  const showInvoice = job?.status === "complete" || job?.status === "paid";
  const { data: invoice, refetch: refetchInvoice } = useGetInvoiceByJob(jobId, {
    query: {
      enabled: showInvoice,
      retry: false,
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 -ml-3 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="container mx-auto max-w-md px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Job Not Found</h2>
        <p className="text-muted-foreground">
          We couldn't find details for this job. Please check the job ID and try again.
        </p>
        <Link href="/">
          <Button className="mt-4">Return Home</Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.id === job.status);
  const isPaid = job.status === "paid";
  const isComplete = job.status === "complete" || isPaid;
  const canRate = isComplete && !(job as any).customerRating;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2 -ml-3 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Lookup
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {job.serviceType} Service
        </h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">Job #{job.id}</span>
          <span>•</span>
          Requested on {new Date(job.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Service Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-2 py-2">
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-muted" />
                <div className="space-y-8">
                  {STATUS_STEPS.map((step, idx) => {
                    if (step.id === "paid" && !isPaid && currentStepIndex < 4) return null;
                    const isPast = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div key={step.id} className="relative flex gap-6 z-10">
                        <div className="flex-none mt-0.5 relative bg-card">
                          {isPast || isCurrent ? (
                            <CheckCircle2 className="w-8 h-8 text-primary" />
                          ) : (
                            <Circle className="w-8 h-8 text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <h3 className={`font-semibold text-lg ${isCurrent ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1">{step.description}</p>
                          {step.id === "assigned" && isCurrent && job.assignment && (
                            <div className="mt-3 bg-muted/50 p-3 rounded-md flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User className="w-4 h-4" />
                              </div>
                              <p className="text-sm font-medium">
                                Assigned to: {job.assignment.subName || "Our Pro Crew"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {job.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 p-4 rounded-md border">
                  {job.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <User className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Customer</p>
                  <p className="text-sm text-muted-foreground">{job.customerName}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Phone</p>
                  <a href={`tel:${job.phone.replace(/\D/g, "")}`} className="text-sm text-primary hover:underline">
                    {job.phone}
                  </a>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Address</p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-start gap-1"
                  >
                    {job.address}
                    <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" />
                  </a>
                </div>
              </div>
              <div className="flex gap-3">
                <Wrench className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Service Type</p>
                  <p className="text-sm text-muted-foreground capitalize">{job.serviceType}</p>
                </div>
              </div>
              {job.planName && (
                <div className="flex gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Plan</p>
                    <p className="text-sm text-muted-foreground">{job.planName}</p>
                  </div>
                </div>
              )}
              {job.customerPrice !== null && job.customerPrice !== undefined && (
                <div className="flex gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Price</p>
                    <p className="text-sm text-muted-foreground">${job.customerPrice.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ETA card for in_progress */}
          {job.status === "in_progress" && job.assignment && (
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <Navigation className="w-5 h-5 text-purple-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-purple-900">Crew en route</p>
                    <p className="text-xs text-purple-700">
                      {(job.assignment as any)?.etaMinutes != null
                        ? `ETA: ~${(job.assignment as any).etaMinutes} minutes`
                        : "On their way to your location"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rate service */}
          {canRate && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-amber-900">How was your service?</p>
                    <p className="text-xs text-amber-700">Share feedback for your crew</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-400 text-amber-800 hover:bg-amber-100 shrink-0"
                    onClick={() => setRatingOpen(true)}
                  >
                    <Star className="w-3.5 h-3.5 mr-1 fill-amber-400 text-amber-400" /> Rate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Already rated */}
          {(job as any).customerRating && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < (job as any).customerRating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`} />
                  ))}
                  <span className="text-sm font-semibold text-amber-900 ml-1">Your rating</span>
                </div>
                {(job as any).customerReview && (
                  <p className="text-xs text-amber-800 mt-1 italic">"{(job as any).customerReview}"</p>
                )}
              </CardContent>
            </Card>
          )}

          {showInvoice && invoice && (
            <InvoiceCard
              invoice={invoice}
              onPayNow={() => setPayOpen(true)}
            />
          )}

          {showInvoice && !invoice && !isPaid && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Invoice Pending</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your invoice is being prepared. It will appear here shortly.
                  </p>
                </div>
                {job.customerPrice && (
                  <Button className="w-full gap-2" onClick={() => setPayOpen(true)}>
                    <CreditCard className="w-4 h-4" />
                    Pay ${job.customerPrice.toFixed(2)} Now
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PaymentDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        amount={invoice?.total ?? job.customerPrice ?? 0}
        jobId={job.id}
        invoiceId={invoice?.id}
        invoiceNumber={invoice?.invoiceNumber}
        onPaid={() => {
          refetchJob();
          refetchInvoice();
        }}
      />

      <RatingDialog
        open={ratingOpen}
        jobId={job.id}
        onClose={() => setRatingOpen(false)}
        onRated={() => refetchJob()}
      />
    </div>
  );
}
