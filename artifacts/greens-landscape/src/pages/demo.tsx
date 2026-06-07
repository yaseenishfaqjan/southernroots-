import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Phone,
  Zap,
  Navigation,
  CheckCircle2,
  Star,
  Clock,
  ArrowRight,
  Leaf,
  Receipt,
  Users,
  BarChart3,
  Smartphone,
  CreditCard,
  Play,
  ChevronRight,
  Wifi,
  WifiOff,
  MapPin,
  TrendingUp,
  ShieldCheck,
  ExternalLink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const PORTALS = {
  client: `${BASE}/../client-portal`,
  worker: `${BASE}/../worker-portal`,
  dispatch: `${BASE}/../portal`,
};

const CONTRACTORS = [
  { id: 1, name: "Marcus Webb",    specialty: "Landscaping",              rating: 4.8, online: true,  completionRate: 96, emoji: "🌿" },
  { id: 2, name: "Devon Price",    specialty: "Pressure Washing",          rating: 4.6, online: true,  completionRate: 91, emoji: "💧" },
  { id: 3, name: "Ricky Tate",     specialty: "Landscaping & Maintenance", rating: 4.9, online: false, completionRate: 98, emoji: "✂️" },
  { id: 4, name: "Jayla Simmons",  specialty: "Pressure Washing",          rating: 4.7, online: true,  completionRate: 88, emoji: "🚿" },
  { id: 5, name: "Carlos Mendez",  specialty: "Landscaping",               rating: 4.5, online: false, completionRate: 94, emoji: "🌱" },
];

const DEMO_CUSTOMER = {
  name: "Robert Castillo",
  phone: "(770) 555-0129",
  jobId: 9,
  service: "Lawn Mowing",
  status: "in_progress",
};

const STORY_STEPS = [
  {
    time: "10:02 AM",
    actor: "Customer",
    icon: <Phone className="w-5 h-5" />,
    color: "bg-blue-500",
    title: "Sandra Collins calls in",
    detail: "She needs her driveway pressure-washed before a showing. Submits online or calls our line.",
    badge: "New Lead",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    time: "10:02 AM",
    actor: "System",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "bg-slate-700",
    title: "Job enters the dispatch board",
    detail: "Job #20 created instantly. Dispatcher sees it flagged as \"Needs Assignment\" on the board.",
    badge: "Auto-logged",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
  },
  {
    time: "10:02 AM",
    actor: "AI Engine",
    icon: <Zap className="w-5 h-5" />,
    color: "bg-violet-600",
    title: "Matching engine scores the crew",
    detail: "Engine checks all online contractors within 10 miles — ranks by distance, rating, and completion rate. Devon Price wins: 4.6★, 2.3 mi away, online.",
    badge: "Best Match: Devon Price",
    badgeColor: "bg-violet-100 text-violet-800 border-violet-200",
  },
  {
    time: "10:02 AM",
    actor: "Dispatcher",
    icon: <Zap className="w-5 h-5" />,
    color: "bg-primary",
    title: "Auto-dispatched in 1 click",
    detail: "Dispatcher hits \"Auto-Dispatch\" — job instantly assigned to Devon at 70/30 split. No calls, no texts.",
    badge: "Dispatched",
    badgeColor: "bg-green-100 text-green-800 border-green-200",
  },
  {
    time: "10:03 AM",
    actor: "Worker",
    icon: <Navigation className="w-5 h-5" />,
    color: "bg-amber-500",
    title: "Devon's app lights up — 30 seconds to accept",
    detail: "Devon sees the job card with address, service type, and payout. Taps Accept. Status updates to en_route.",
    badge: "Accepted ✓",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    time: "10:04 AM",
    actor: "Customer",
    icon: <Smartphone className="w-5 h-5" />,
    color: "bg-blue-500",
    title: "Sandra opens her Client Portal",
    detail: "She enters her phone + Job ID. Sees: \"Crew En Route — ETA ~9 min\". Live status updates as Devon moves through the flow.",
    badge: "Live Tracking",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    time: "10:47 AM",
    actor: "Worker",
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: "bg-green-600",
    title: "Devon marks the job complete",
    detail: "Works through the status steps in-app: En Route → Arrived → In Progress → Complete. Job closes out.",
    badge: "Job Complete",
    badgeColor: "bg-green-100 text-green-800 border-green-200",
  },
  {
    time: "10:48 AM",
    actor: "Customer",
    icon: <CreditCard className="w-5 h-5" />,
    color: "bg-blue-500",
    title: "Invoice appears — Sandra pays online",
    detail: "Client portal shows the invoice immediately. She pays by card in 30 seconds. Rating prompt appears.",
    badge: "Paid + Rated ⭐⭐⭐⭐⭐",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
];

export default function Demo() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [workerPickerOpen, setWorkerPickerOpen] = useState(false);

  const Logo = () => (
    <img src="/logo.png" alt="Southern Roots Turf" className="h-16 w-auto object-contain" />
  );

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Logo />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">← Back to Site</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-foreground text-background py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest px-4 py-2 mb-8">
            <Play className="w-3 h-3 fill-current" /> Live Demo
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-black uppercase tracking-tight leading-none mb-6">
            Watch the whole thing happen.
          </h1>
          <p className="text-xl text-white/70 font-medium max-w-2xl mx-auto mb-10">
            One customer. One phone call. Eight minutes from lead to dispatched crew — fully automated. Follow the story below, then step into any portal yourself.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#story" className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground font-bold px-6 py-3 text-sm uppercase tracking-wide hover:bg-white transition-colors">
              <Play className="w-4 h-4 fill-current" /> Follow the Story
            </a>
            <a href="#access" className="inline-flex items-center gap-2 bg-white/10 text-white font-bold px-6 py-3 text-sm uppercase tracking-wide hover:bg-white/20 transition-colors border border-white/20">
              Jump to Portal Access <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Story Timeline */}
      <section id="story" className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-display font-black uppercase tracking-tight mb-3">The Sandra Collins Story</h2>
            <p className="text-muted-foreground font-medium">Pressure washing job. Tuesday morning. From first contact to paid invoice.</p>
          </div>

          <div className="relative">
            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-border" />
            <div className="space-y-4">
              {STORY_STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative flex gap-5 cursor-pointer group`}
                  onClick={() => setActiveStep(activeStep === i ? null : i)}
                >
                  <div className={`w-14 h-14 ${step.color} text-white rounded-full flex items-center justify-center shrink-0 z-10 shadow-md group-hover:scale-105 transition-transform`}>
                    {step.icon}
                  </div>
                  <div className={`flex-1 bg-background border rounded-xl p-4 shadow-sm transition-all ${activeStep === i ? "border-primary shadow-md" : "hover:border-muted-foreground/30"}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{step.time}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs font-bold text-muted-foreground">{step.actor}</span>
                        </div>
                        <h3 className="font-bold text-base leading-tight">{step.title}</h3>
                      </div>
                      <span className={`text-xs font-bold border px-2 py-1 rounded-full shrink-0 ${step.badgeColor}`}>{step.badge}</span>
                    </div>
                    <AnimatePresence>
                      {activeStep === i && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="text-sm text-muted-foreground mt-3 leading-relaxed overflow-hidden"
                        >
                          {step.detail}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    {activeStep !== i && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{step.detail}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8 font-medium">Click any step to expand details.</p>
        </div>
      </section>

      {/* Portal Access */}
      <section id="access" className="py-20 px-4 bg-background border-t">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-display font-black uppercase tracking-tight mb-3">Try it yourself — pick a role</h2>
            <p className="text-muted-foreground font-medium max-w-lg mx-auto">Every portal is live with real demo data. Enter as a customer, a worker, or the dispatcher.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Customer */}
            <div className="border-2 border-blue-200 bg-blue-50 rounded-2xl p-6 flex flex-col">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl uppercase tracking-tight mb-1">Customer</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1">Track a live in-progress job, see ETA, and access the invoice.</p>

              <div className="bg-white rounded-xl border p-3 mb-4 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Name</span>
                  <span className="font-bold">{DEMO_CUSTOMER.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Phone</span>
                  <span className="font-bold font-mono">{DEMO_CUSTOMER.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Job ID</span>
                  <span className="font-bold font-mono">#{DEMO_CUSTOMER.jobId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Service</span>
                  <span className="font-bold">{DEMO_CUSTOMER.service}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Status</span>
                  <span className="text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">In Progress</span>
                </div>
              </div>

              <a href={PORTALS.client} target="_blank" rel="noopener noreferrer">
                <Button className="w-full gap-2 bg-blue-500 hover:bg-blue-600 text-white">
                  <ExternalLink className="w-4 h-4" /> Open Client Portal
                </Button>
              </a>
              <p className="text-xs text-center text-muted-foreground mt-2">Enter the phone + job ID above to track</p>
            </div>

            {/* Worker */}
            <div className="border-2 border-amber-200 bg-amber-50 rounded-2xl p-6 flex flex-col">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl uppercase tracking-tight mb-1">Worker</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1">Log in as one of our 5 crew members. See pending jobs, accept, and work through the status flow.</p>

              <div className="space-y-2 mb-4">
                {CONTRACTORS.map((c) => (
                  <div key={c.id} className="bg-white rounded-xl border p-2.5 flex items-center gap-2.5">
                    <span className="text-xl">{c.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-tight truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.specialty}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${c.online ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className="text-xs font-bold text-amber-700">★{c.rating}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setWorkerPickerOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Choose & Log In
              </button>
              <p className="text-xs text-center text-muted-foreground mt-2">Pick a crew member to enter as</p>
            </div>

            {/* Dispatcher */}
            <div className="border-2 border-slate-200 bg-slate-50 rounded-2xl p-6 flex flex-col">
              <div className="w-12 h-12 bg-slate-800 text-white rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-display font-black text-xl uppercase tracking-tight mb-1">Dispatcher</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1">View the full operations board — all jobs, revenue charts, crew workload, and the matching engine.</p>

              <div className="bg-white rounded-xl border p-3 mb-4 text-sm space-y-1.5">
                {[
                  { label: "New leads", value: "7 jobs", color: "text-orange-600" },
                  { label: "Active jobs", value: "9 jobs", color: "text-blue-600" },
                  { label: "Completed", value: "9 jobs", color: "text-green-600" },
                  { label: "Online crew", value: "3 of 5", color: "text-primary" },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between">
                    <span className="text-muted-foreground font-medium">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>

              <a href={PORTALS.dispatch} target="_blank" rel="noopener noreferrer">
                <Button className="w-full gap-2 bg-slate-800 hover:bg-slate-900 text-white">
                  <ExternalLink className="w-4 h-4" /> Open Dispatch Board
                </Button>
              </a>
              <p className="text-xs text-center text-muted-foreground mt-2">No login needed — open access</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech callout */}
      <section className="py-16 bg-primary text-white px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { icon: <Zap className="w-6 h-6" />, stat: "< 30s", label: "Dispatch time" },
              { icon: <Star className="w-6 h-6" />, stat: "4.8★", label: "Avg crew rating" },
              { icon: <ShieldCheck className="w-6 h-6" />, stat: "96%", label: "Completion rate" },
              { icon: <CreditCard className="w-6 h-6" />, stat: "100%", label: "Digital payments" },
            ].map((s, i) => (
              <div key={i}>
                <div className="flex justify-center mb-2 text-secondary">{s.icon}</div>
                <p className="text-3xl font-display font-black tracking-tight text-secondary">{s.stat}</p>
                <p className="text-white/70 font-bold uppercase tracking-widest text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Worker Picker Modal */}
      <AnimatePresence>
        {workerPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setWorkerPickerOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-background rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b">
                <div>
                  <h3 className="font-display font-black text-xl uppercase">Pick a Worker</h3>
                  <p className="text-xs text-muted-foreground">You'll enter their jobs view</p>
                </div>
                <button onClick={() => setWorkerPickerOpen(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {CONTRACTORS.map((c) => (
                  <a
                    key={c.id}
                    href={`${PORTALS.worker}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      localStorage.setItem("workerId", c.id.toString());
                      setWorkerPickerOpen(false);
                    }}
                    className="flex items-center gap-4 p-3 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <span className="text-3xl">{c.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold leading-tight">{c.name}</p>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${c.online ? "bg-green-500" : "bg-gray-400"}`} />
                        <span className={`text-xs font-semibold ${c.online ? "text-green-700" : "text-gray-500"}`}>
                          {c.online ? "Online" : "Offline"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.specialty}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-amber-600">★ {c.rating}</span>
                        <span className="text-xs text-muted-foreground">{c.completionRate}% completion</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </a>
                ))}
              </div>
              <div className="p-4 pt-0">
                <p className="text-xs text-center text-muted-foreground">After clicking, enter the Worker Portal and go directly to your jobs.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
