import { useState, useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Leaf,
  Zap,
  Truck,
  MessageSquare,
  Receipt,
  BarChart3,
  TrendingUp,
  HeartHandshake,
  Check,
  ArrowRight,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

// Scroll-reveal wrapper
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

const AGENTS = [
  { icon: Zap, name: "Quote Agent", desc: "Measures the lawn from satellite imagery and sends an accurate, priced quote in seconds — before your competitor even calls back." },
  { icon: Truck, name: "Dispatch Agent", desc: "Assigns crews and optimizes routes every morning based on location, skills, and workload." },
  { icon: MessageSquare, name: "Communication Agent", desc: "Reads and replies to every customer text, reschedules jobs, and escalates only the edge cases." },
  { icon: Receipt, name: "Billing Agent", desc: "Auto-invoices completed jobs, sends payment links, and runs a polite overdue-reminder ladder." },
  { icon: BarChart3, name: "Briefing Agent", desc: "Emails you a sharp daily summary of revenue, jobs, leads, and anything that needs attention." },
  { icon: TrendingUp, name: "Upsell Agent", desc: "Spots upsell opportunities and reaches out with personalized offers at the right moment." },
  { icon: HeartHandshake, name: "Churn Agent", desc: "Scores every customer's churn risk and sends win-back offers before they leave." },
];

const STEPS = [
  { n: "01", title: "A lead comes in", desc: "From your site, a text, or a call — the lead lands in the system instantly." },
  { n: "02", title: "AI quotes it in seconds", desc: "The Quote Agent measures the property, prices the job, and sends a branded quote automatically." },
  { n: "03", title: "Crews dispatched & paid", desc: "Accepted jobs are scheduled, crews routed, work invoiced, and payments collected — hands-free." },
];

const PLANS = [
  { name: "Starter", price: 299, blurb: "Solo operator", features: ["AI quoting + dashboard", "Up to 100 customers", "Email + SMS notifications", "1 user"], popular: false },
  { name: "Growth", price: 999, blurb: "2–10 crews", features: ["Everything in Starter", "All 7 autonomous agents", "Crew dispatch & routing", "Unlimited customers", "5 users"], popular: true },
  { name: "Enterprise", price: 2999, blurb: "Multi-location", features: ["Everything in Growth", "Multi-location support", "Priority support", "Custom integrations", "Unlimited users"], popular: false },
];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all ${
        scrolled ? "bg-white/80 backdrop-blur-md border-b border-gray-200" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="#top" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">Southern Roots Turf</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
          <a href="#how" className="text-sm text-gray-600 hover:text-gray-900">How it works</a>
          <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">Sign in</Link>
          <Link
            href="/signup"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            Start free trial
          </Link>
        </nav>
        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-gray-200 bg-white px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <a href="#features" onClick={() => setOpen(false)} className="text-sm text-gray-700">Features</a>
            <a href="#how" onClick={() => setOpen(false)} className="text-sm text-gray-700">How it works</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="text-sm text-gray-700">Pricing</a>
            <Link href="/login" className="text-sm font-medium text-gray-700">Sign in</Link>
            <Link href="/signup" className="rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white">Start free trial</Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-white pt-32 pb-20">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-green-200/40 blur-3xl" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700"
          >
            <Sparkles className="h-4 w-4" /> AI-native field-service platform
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl"
          >
            The AI employee that runs your{" "}
            <span className="text-green-600">lawn care business</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-5 max-w-xl text-lg text-gray-600"
          >
            Southern Roots Turf quotes leads in seconds, dispatches crews, chases payments,
            and wins back customers — autonomously. You do the work; the AI runs the back office.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700"
            >
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              See how it works
            </a>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="mt-4 text-sm text-gray-500"
          >
            14-day free trial · No credit card required · Cancel anytime
          </motion.p>
        </div>

        {/* Animated quote card mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl shadow-green-900/10">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900">AI Quote generated</span>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">in 4s</span>
            </div>
            <div className="space-y-3 py-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Property</span><span className="font-medium text-gray-900">42 Oak St · 4,200 sqft</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Lawn Mowing</span><span className="font-medium text-gray-900">$220/mo</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fertilization</span><span className="font-medium text-gray-900">$96/mo</span></div>
              <div className="mt-2 flex justify-between border-t border-gray-100 pt-3"><span className="font-semibold text-gray-900">Monthly total</span><span className="text-lg font-bold text-green-600">$316/mo</span></div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
              "Hi Sarah! Based on your 4,200 sqft lawn, your quote is $316/mo. Reply YES to book! — Southern Roots Turf"
            </div>
          </div>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-4 -top-4 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-lg"
          >
            <div className="text-xs text-gray-500">Today's revenue</div>
            <div className="text-lg font-bold text-gray-900">$2,340 <span className="text-sm font-medium text-green-600">↑18%</span></div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { v: "$150B", l: "US lawn care market" },
    { v: "600k+", l: "businesses, mostly software-less" },
    { v: "7", l: "autonomous AI agents" },
    { v: "<60s", l: "from lead to quote" },
  ];
  return (
    <section className="border-y border-gray-100 bg-white py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 md:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.l} delay={i * 0.08}>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">{s.v}</div>
              <div className="mt-1 text-sm text-gray-500">{s.l}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Your day shouldn't be spent on admin
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Quoting, scheduling, dispatching, chasing payments, answering texts — the back office
            eats the time you should spend growing. Southern Roots Turf hands all of it to AI agents,
            so a solo operator can run like a 20-person company.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Seven agents. One autonomous business.</h2>
            <p className="mt-4 text-lg text-gray-600">Each agent owns a part of your operation and runs it 24/7 — no human input for standard work.</p>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a, i) => (
            <Reveal key={a.name} delay={(i % 3) * 0.08}>
              <div className="group h-full rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-green-200 hover:shadow-xl hover:shadow-green-900/5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600 transition group-hover:bg-green-600 group-hover:text-white">
                  <a.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{a.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{a.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function How() {
  return (
    <section id="how" className="bg-gray-900 py-24 text-white">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From lead to paid — on autopilot</h2>
            <p className="mt-4 text-lg text-gray-300">Three steps. Zero busywork.</p>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
                <div className="text-4xl font-extrabold text-green-400">{s.n}</div>
                <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Simple, scale-with-you pricing</h2>
            <p className="mt-4 text-lg text-gray-600">Start free for 14 days. No credit card required.</p>
          </div>
        </Reveal>
        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-7 ${
                  p.popular ? "border-green-600 bg-white shadow-2xl shadow-green-900/10 ring-1 ring-green-600" : "border-gray-200 bg-white"
                }`}
              >
                {p.popular && (
                  <span className="mb-4 self-start rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">Most popular</span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.blurb}</p>
                <div className="mt-4 text-4xl font-extrabold text-gray-900">
                  ${p.price.toLocaleString()}<span className="text-base font-medium text-gray-500">/mo</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-7 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    p.popular ? "bg-green-600 text-white hover:bg-green-700" : "border border-gray-300 text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  Start free trial
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-green-600 py-20">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to run your business on autopilot?</h2>
          <p className="mt-4 text-lg text-green-50">Set up in minutes. Your first AI quote goes out today.</p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3 text-base font-semibold text-green-700 shadow-lg transition hover:bg-green-50"
          >
            Start your free trial <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600">
            <Leaf className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Southern Roots Turf</span>
        </div>
        <p className="text-sm text-gray-500">© 2026 Southern Roots Turf. AI-native lawn care platform.</p>
        <div className="flex gap-5 text-sm text-gray-500">
          <a href="#features" className="hover:text-gray-900">Features</a>
          <a href="#pricing" className="hover:text-gray-900">Pricing</a>
          <Link href="/login" className="hover:text-gray-900">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Problem />
        <Features />
        <How />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
