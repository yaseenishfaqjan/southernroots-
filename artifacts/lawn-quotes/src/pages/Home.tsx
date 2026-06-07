import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Map, CalendarCheck, Navigation, Users, Zap, Shield, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: BrainCircuit,
    color: "bg-emerald-100 text-emerald-700",
    title: "AI Property Analysis",
    desc: "Enter any address. Our AI pulls satellite data and measures exact lawn square footage in seconds — no on-site visit needed.",
    link: "/quote",
    cta: "Try It Now",
  },
  {
    icon: Navigation,
    color: "bg-blue-100 text-blue-700",
    title: "Crew Route Optimization",
    desc: "Automatically sequence daily jobs for minimum drive time. Save fuel, fit more stops, and keep customers on schedule.",
    link: "/route",
    cta: "View Route Demo",
  },
  {
    icon: CalendarCheck,
    color: "bg-violet-100 text-violet-700",
    title: "Recurring Maintenance",
    desc: "Track weekly, bi-weekly, and monthly plans in one dashboard. Auto-reminders fire before every visit.",
    link: "/maintenance",
    cta: "View Customers",
  },
  {
    icon: Map,
    color: "bg-orange-100 text-orange-700",
    title: "Neighborhood Lead Map",
    desc: "AI scores every yard within a radius. Large overgrown lawns, dirty driveways, high-income blocks — all surfaced automatically.",
    link: "/leads",
    cta: "Browse Leads",
  },
  {
    icon: TrendingUp,
    color: "bg-rose-100 text-rose-700",
    title: "Owner Dashboard",
    desc: "Live KPIs — MRR, quotes, crew utilization, upsell pipeline — in one clean view. Know your numbers at a glance.",
    link: "/dashboard",
    cta: "Open Dashboard",
  },
  {
    icon: Users,
    color: "bg-teal-100 text-teal-700",
    title: "Automated Follow-Up",
    desc: "Missed quote? Overdue payment? Blue Collar AI fires texts and emails automatically via GoHighLevel or Twilio integration.",
    link: "/quote",
    cta: "Learn More",
  },
];

const STATS = [
  { label: "Average time to quote", value: "28 sec" },
  { label: "Route time saved per day", value: "41 min" },
  { label: "Recurring revenue tracked", value: "$8,240" },
  { label: "AI lead score accuracy", value: "93%" },
];

const HOW_IT_WORKS = [
  { step: "01", icon: Map, title: "Enter the Address", desc: "Type in any property address. AI locates it on satellite maps and measures the turf area instantly." },
  { step: "02", icon: BrainCircuit, title: "AI Builds the Quote", desc: "Services, lawn size, driveway area, and seasonal factors combine into a guaranteed one-time and monthly price." },
  { step: "03", icon: Shield, title: "Book & Route", desc: "Customer books in one click. The job appears on the crew's optimized route for the day — zero admin work." },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-28 overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, hsl(142,76%,36%) 0%, transparent 60%), radial-gradient(circle at 75% 20%, hsl(217,91%,60%) 0%, transparent 50%)" }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5" /> Blue Collar AI — Lawn Intelligence Center
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                AI-Powered Lawn Care Estimates{" "}
                <span className="text-emerald-400">in Seconds.</span>
              </h1>
              <p className="text-lg text-zinc-400 mb-10 leading-relaxed max-w-xl">
                Measure any property from satellite. Build accurate quotes automatically. Route your crews efficiently. Turn every yard on the block into a recurring customer.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="h-13 px-8 text-base rounded-full font-semibold" asChild data-testid="btn-hero-quote">
                  <Link href="/quote">Get Instant Lawn Quote <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="h-13 px-8 text-base rounded-full border-zinc-600 text-zinc-200 hover:bg-zinc-800 hover:text-white" asChild data-testid="btn-hero-dashboard">
                  <Link href="/dashboard">View Owner Dashboard</Link>
                </Button>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-zinc-800 bg-zinc-700 flex items-center justify-center overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i + 10}&backgroundColor=374151`} alt="" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 text-yellow-400">{[...Array(5)].map((_,i)=><Star key={i} className="h-3.5 w-3.5 fill-current"/>)}</div>
                  <p className="text-xs text-zinc-500 mt-0.5">Trusted by 500+ lawn care businesses</p>
                </div>
              </div>
            </motion.div>

            {/* Stats card grid */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="grid grid-cols-2 gap-4">
              {STATS.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-6 backdrop-blur">
                  <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
                  <p className="text-sm text-zinc-400">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ───────────────────────────────────────────────── */}
      <section className="py-24 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything a lawn company needs</h2>
            <p className="text-muted-foreground text-lg">Six tools built for the field — not a generic CRM.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl border p-6 hover:shadow-md transition-shadow group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">{f.desc}</p>
                <Link href={f.link} className="text-sm font-semibold text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  {f.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg">From address to booked job in under 60 seconds.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-8 left-[17%] right-[17%] h-px bg-border" />
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-5 shadow-lg shadow-primary/20">
                  <step.icon className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-bold text-primary/60 tracking-widest uppercase mb-2">Step {step.step}</span>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hero Image ─────────────────────────────────────────────────── */}
      <section className="py-0">
        <div className="relative h-72 overflow-hidden">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-lawn.png`}
            alt="Perfectly manicured lawn"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 to-transparent flex items-center">
            <div className="container mx-auto px-4">
              <p className="text-white text-2xl font-bold max-w-md">The yard every homeowner wants. The system every crew needs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-5">Start quoting smarter today.</h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">No Google Maps API key needed for the demo. Click "Get Instant Quote" and see the full AI workflow in action.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="h-13 px-8 text-base rounded-full font-semibold" asChild data-testid="btn-bottom-quote">
              <Link href="/quote">Get Instant Lawn Quote</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-8 text-base rounded-full border-white/40 text-white hover:bg-white/10" asChild data-testid="btn-bottom-dashboard">
              <Link href="/dashboard">View Owner Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
