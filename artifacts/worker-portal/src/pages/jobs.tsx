import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiBase } from "@/lib/api";
import {
  MapPin, Phone, ChevronRight, Briefcase, DollarSign,
  TrendingUp, Clock, CheckCircle2, Loader2, Wifi, WifiOff,
  AlertTriangle, Star, Zap
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const ACCEPT_WINDOW_SECS = 30;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "Awaiting Accept", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  accepted:    { label: "Accepted",        color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  en_route:    { label: "En Route",        color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  arrived:     { label: "On Site",         color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  in_progress: { label: "In Progress",     color: "text-primary",    bg: "bg-primary/5 border-primary/20" },
  complete:    { label: "Complete",        color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  declined:    { label: "Declined",        color: "text-gray-500",   bg: "bg-gray-50 border-gray-200" },
};

function CountdownTimer({ assignedAt, onExpire }: { assignedAt: string; onExpire: () => void }) {
  const [secs, setSecs] = useState(() => {
    const elapsed = Math.floor((Date.now() - new Date(assignedAt).getTime()) / 1000);
    return Math.max(0, ACCEPT_WINDOW_SECS - elapsed);
  });
  const fired = useRef(false);

  useEffect(() => {
    if (secs <= 0) {
      if (!fired.current) { fired.current = true; onExpire(); }
      return;
    }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, onExpire]);

  const pct = (secs / ACCEPT_WINDOW_SECS) * 100;
  const color = secs > 15 ? "#16a34a" : secs > 8 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="22" fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="26" cy="26" r="22" fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 138.2} 138.2`}
          transform="rotate(-90 26 26)"
          style={{ transition: "stroke-dasharray 0.8s ease, stroke 0.5s ease" }}
        />
        <text x="26" y="30" textAnchor="middle" fontSize="13" fontWeight="bold" fill={color}>{secs}</text>
      </svg>
      <span className="text-xs font-medium" style={{ color }}>sec left</span>
    </div>
  );
}

export default function Jobs() {
  const { workerId } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => { if (!workerId) setLocation("/"); }, [workerId, setLocation]);

  // Profile + online status
  const { data: profile } = useQuery({
    queryKey: ["worker-profile", workerId],
    queryFn: async () => {
      const r = await fetch(`${apiBase()}/worker/profile/${workerId}`);
      return r.json();
    },
    enabled: !!workerId,
    refetchInterval: 30000,
  });

  const toggleOnlineMut = useMutation({
    mutationFn: async (isOnline: boolean) => {
      const r = await fetch(`${apiBase()}/worker/profile/${workerId}/toggle-online`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline }),
      });
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["worker-profile", workerId] });
    },
  });

  // Jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["workerJobs", workerId],
    queryFn: async () => {
      const r = await fetch(`${apiBase()}/worker/jobs/${workerId}`);
      return r.json() as Promise<any[]>;
    },
    enabled: !!workerId,
    refetchInterval: 10000,
  });

  // Earnings
  const { data: earnings } = useQuery({
    queryKey: ["workerEarnings", workerId],
    queryFn: async () => {
      const r = await fetch(`${apiBase()}/worker/earnings/${workerId}`);
      return r.json();
    },
    enabled: !!workerId,
    refetchInterval: 60000,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workerJobs", workerId] }),
  });

  const handleAccept = (assignmentId: number) => {
    updateStatus.mutate({ assignmentId, status: "accepted" }, {
      onSuccess: () => toast({ title: "Job accepted!", description: "Navigate to the job site." }),
    });
  };

  const handleDecline = (assignmentId: number) => {
    updateStatus.mutate({ assignmentId, status: "declined" }, {
      onSuccess: () => toast({ title: "Job declined", variant: "destructive" }),
    });
  };

  if (!workerId) return null;

  const pending = jobs?.filter((j) => j.assignment?.status === "pending") ?? [];
  const active = jobs?.filter((j) => ["accepted", "en_route", "arrived", "in_progress"].includes(j.assignment?.status)) ?? [];
  const done = jobs?.filter((j) => ["complete", "declined"].includes(j.assignment?.status)) ?? [];

  const isOnline = profile?.isOnline ?? false;

  return (
    <Layout title="My Dashboard">
      {/* Online Toggle */}
      <div className={`mx-0 mb-4 rounded-2xl border-2 p-4 flex items-center justify-between transition-colors ${isOnline ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200"}`}>
        <div className="flex items-center gap-3">
          {isOnline ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-gray-400" />}
          <div>
            <p className="font-bold text-gray-900">{isOnline ? "You're Online" : "You're Offline"}</p>
            <p className="text-xs text-muted-foreground">{isOnline ? "Receiving job requests" : "Not accepting new jobs"}</p>
          </div>
        </div>
        <Switch
          checked={isOnline}
          onCheckedChange={(v) => toggleOnlineMut.mutate(v)}
          className="data-[state=checked]:bg-green-600"
        />
      </div>

      {/* Stats strip */}
      {earnings && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-xl border p-3 text-center">
            <DollarSign className="w-4 h-4 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-green-700">${earnings.monthEarned.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </div>
          <div className="bg-white rounded-xl border p-3 text-center">
            <Briefcase className="w-4 h-4 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-bold">{earnings.totalJobs}</div>
            <div className="text-xs text-muted-foreground">Jobs done</div>
          </div>
          <div className="bg-white rounded-xl border p-3 text-center">
            <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <div className="text-lg font-bold">{profile?.rating ?? "—"}</div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="font-medium">Loading jobs...</p>
        </div>
      )}

      {/* Pending — Acceptance Required */}
      {pending.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> New Request ({pending.length})
          </h2>
          {pending.map((job) => (
            <Card key={job.id} className="border-2 border-amber-300 bg-amber-50/60 shadow-md overflow-hidden mb-3">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-gray-900">{job.customerName}</span>
                      {job.urgency === "urgent" && <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">URGENT</Badge>}
                      {job.urgency === "surge" && <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]"><Zap className="w-2.5 h-2.5 mr-0.5" />SURGE</Badge>}
                    </div>
                    <Badge variant="outline" className="text-xs">{job.serviceType}</Badge>
                  </div>
                  {job.assignment?.assignedAt && (
                    <CountdownTimer
                      assignedAt={job.assignment.assignedAt}
                      onExpire={() => qc.invalidateQueries({ queryKey: ["workerJobs", workerId] })}
                    />
                  )}
                </div>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">{job.address}</span>
                  </div>
                  {job.preferredTime && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{job.preferredTime}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm font-bold text-green-700">
                    <DollarSign className="w-4 h-4 shrink-0" />
                    <span>You earn: ${job.assignment?.subPay?.toFixed(2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-600 h-11"
                    onClick={() => handleDecline(job.assignment.id)}
                    disabled={updateStatus.isPending}
                  >
                    Decline
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white h-11 font-bold"
                    onClick={() => handleAccept(job.assignment.id)}
                    disabled={updateStatus.isPending}
                  >
                    Accept Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Active jobs */}
      {active.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wide mb-2">Active Jobs ({active.length})</h2>
          {active.map((job) => {
            const cfg = STATUS_CONFIG[job.assignment?.status] ?? STATUS_CONFIG.pending;
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className={`border-2 mb-3 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform ${cfg.bg}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">{job.customerName}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.color} bg-white/70`}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{job.address}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{job.serviceType}</span>
                      <div className="flex items-center gap-1 text-green-700 font-bold text-sm">
                        <DollarSign className="w-3.5 h-3.5" />${job.assignment?.subPay?.toFixed(2)}
                      </div>
                    </div>
                    {job.assignment?.etaMinutes != null && (
                      <div className="mt-2 text-xs font-medium text-purple-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ETA: {job.assignment.etaMinutes} min
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* No active jobs */}
      {!isLoading && pending.length === 0 && active.length === 0 && (
        <Card className="p-8 text-center bg-white border-dashed border-2 border-gray-200 mb-4">
          <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700">No active jobs</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isOnline ? "Waiting for new job requests…" : "Go online to receive jobs."}
          </p>
        </Card>
      )}

      {/* Completed */}
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Recent ({done.length})</h2>
          {done.slice(0, 5).map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card key={job.id} className="border mb-2 overflow-hidden cursor-pointer hover:border-gray-300 transition-colors">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700 truncate">{job.customerName}</span>
                      {job.assignment?.status === "complete" && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{job.serviceType}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-green-700">${job.assignment?.subPay?.toFixed(0)}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
