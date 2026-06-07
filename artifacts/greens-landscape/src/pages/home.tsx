import { useState, useRef } from "react";
import { brand } from "@workspace/brand";
import { motion } from "framer-motion";
import { 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Leaf, 
  Droplets, 
  CalendarDays,
  Menu,
  X,
  Star,
  ArrowRight,
  ClipboardList,
  Sparkles,
  Shield,
  Zap,
  ArrowUpRight,
  Navigation,
  Receipt,
  BarChart3,
  Users,
  Smartphone,
  CreditCard,
  TrendingUp,
  Clock,
  ShieldCheck,
  Wifi,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { AppSwitcher } from "@/components/AppSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const COMPANY_NAME = brand.name;
const PHONE = brand.phone;
const PHONE_HREF = brand.phoneHref;
const LOCATION = brand.location;

const mockLeads = [
  { name: "John Carter", service: "Driveway Wash", status: "Quote Sent", statusColor: "text-accent" },
  { name: "Ashley Moore", service: "Lawn Care", status: "Scheduled", statusColor: "text-secondary" },
  { name: "Mike Daniels", service: "House Wash", status: "New Lead", statusColor: "text-primary" },
];

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [mobilePortalsOpen, setMobilePortalsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", address: "", notes: "" });

  function openPlanModal(plan: string) {
    setSelectedPlan(plan);
    setSubmitted(false);
    setFormData({ name: "", phone: "", address: "", notes: "" });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  const Logo = ({ className = "" }: { className?: string }) => (
    <img src="/logo.png" alt={brand.logoAlt} className={`h-20 w-auto object-contain ${className}`} />
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background selection:bg-secondary/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <Logo className="hidden sm:block" />
            <Logo className="sm:hidden" />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm font-bold tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors" data-testid="link-services">Services</a>
            <a href="#plans" className="text-sm font-bold tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors" data-testid="link-plans">Plans</a>
            <a href="#results" className="text-sm font-bold tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors" data-testid="link-results">Results</a>
            <a href="#reviews" className="text-sm font-bold tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors" data-testid="link-reviews">Reviews</a>
            <a href="#faq" className="text-sm font-bold tracking-wide uppercase text-muted-foreground hover:text-primary transition-colors" data-testid="link-faq">FAQ</a>

            {/* Portals dropdown */}
            <div className="relative" onMouseEnter={() => setPortalsOpen(true)} onMouseLeave={() => setPortalsOpen(false)}>
              <button className="flex items-center gap-1 text-sm font-bold tracking-wide uppercase text-secondary hover:text-primary transition-colors" data-testid="btn-portals">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block animate-pulse" />
                Demo Portals
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${portalsOpen ? "rotate-180" : ""}`} />
              </button>
              {portalsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white border border-border rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-3 py-2 border-b bg-muted/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Demo Portals</p>
                  </div>
                  <a href="/client-portal" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 group transition-colors">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">Client Portal</p>
                      <p className="text-xs text-muted-foreground">Track your service</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <a href="/worker-portal" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 group transition-colors">
                    <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">Worker Portal</p>
                      <p className="text-xs text-muted-foreground">Crew job management</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <a href="/portal" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 group transition-colors">
                    <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center shrink-0">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">Dispatch Portal</p>
                      <p className="text-xs text-muted-foreground">Operations dashboard</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <div className="border-t">
                    <a href="/demo" className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/10 group transition-colors">
                      <div className="w-8 h-8 bg-secondary/20 text-secondary rounded-lg flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">Full Demo Story</p>
                        <p className="text-xs text-muted-foreground">See the whole flow</p>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 ml-4">
              <a href={PHONE_HREF} className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-colors" data-testid="link-phone">
                <Phone className="w-4 h-4 text-primary" />
                <span>{PHONE}</span>
              </a>
              <Button className="rounded-none bg-primary hover:bg-primary/90 text-white font-bold" asChild data-testid="button-nav-quote">
                <a href="#quote">Get an Estimate</a>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t p-4 bg-background flex flex-col gap-2 shadow-xl absolute w-full z-50">
            <a href="#services" className="px-4 py-3 font-bold uppercase tracking-wide hover:bg-muted" onClick={() => setIsMobileMenuOpen(false)}>Services</a>
            <a href="#plans" className="px-4 py-3 font-bold uppercase tracking-wide hover:bg-muted" onClick={() => setIsMobileMenuOpen(false)}>Plans</a>
            <a href="#results" className="px-4 py-3 font-bold uppercase tracking-wide hover:bg-muted" onClick={() => setIsMobileMenuOpen(false)}>Results</a>
            <a href="#reviews" className="px-4 py-3 font-bold uppercase tracking-wide hover:bg-muted" onClick={() => setIsMobileMenuOpen(false)}>Reviews</a>
            <a href="#faq" className="px-4 py-3 font-bold uppercase tracking-wide hover:bg-muted" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a>

            {/* Portals section */}
            <div className="border-t border-b my-1">
              <button
                className="w-full px-4 py-3 flex items-center justify-between font-bold uppercase tracking-wide text-secondary"
                onClick={() => setMobilePortalsOpen(!mobilePortalsOpen)}
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block animate-pulse" />
                  Demo Portals
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobilePortalsOpen ? "rotate-180" : ""}`} />
              </button>
              {mobilePortalsOpen && (
                <div className="pb-2 flex flex-col gap-1">
                  <a href="/client-portal" target="_blank" rel="noopener noreferrer" className="mx-2 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Client Portal</p>
                      <p className="text-xs text-muted-foreground">Track your service</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                  </a>
                  <a href="/worker-portal" target="_blank" rel="noopener noreferrer" className="mx-2 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors">
                    <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Worker Portal</p>
                      <p className="text-xs text-muted-foreground">Crew job management</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                  </a>
                  <a href="/portal" target="_blank" rel="noopener noreferrer" className="mx-2 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center shrink-0">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Dispatch Portal</p>
                      <p className="text-xs text-muted-foreground">Operations dashboard</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                  </a>
                  <a href="/demo" className="mx-2 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-8 h-8 bg-secondary/20 text-secondary rounded-lg flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Full Demo Story</p>
                      <p className="text-xs text-muted-foreground">See the whole flow</p>
                    </div>
                  </a>
                </div>
              )}
            </div>

            <a href={PHONE_HREF} className="px-4 py-3 flex items-center gap-2 font-bold bg-muted/50">
              <Phone className="w-4 h-4 text-primary" />
              <span>{PHONE}</span>
            </a>
            <Button className="w-full mt-2 rounded-none font-bold" asChild>
              <a href="#quote" onClick={() => setIsMobileMenuOpen(false)}>Get an Estimate</a>
            </Button>
          </div>
        )}
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center pt-20 pb-32 overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/hero.png" 
              alt="Freshly maintained property exterior" 
              className="w-full h-full object-cover opacity-75 scale-105"
              data-testid="img-hero"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
          </div>

          <div className="container relative z-10 mx-auto px-4">
            <motion.div 
              className="max-w-4xl"
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-3 mb-8">
                <div className="bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest px-3 py-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Now Scheduling
                </div>
                <span className="text-white/90 text-sm font-semibold flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-secondary" /> {LOCATION}
                </span>
              </motion.div>
              
              <motion.h1 
                variants={fadeIn}
                className="text-6xl md:text-8xl lg:text-[7rem] font-display font-black text-white leading-[0.95] tracking-tighter mb-8 uppercase"
                data-testid="text-hero-title"
              >
                Spotless <br/>
                <span className="text-secondary italic font-serif lowercase pr-4">and</span> Lush
              </motion.h1>
              
              <motion.p 
                variants={fadeIn}
                className="text-xl lg:text-2xl text-white/80 mb-12 max-w-2xl leading-snug font-medium"
                data-testid="text-hero-subtitle"
              >
                Fast quotes. AI-matched crews. Live job tracking. We handle the heavy lifting — and every step is visible — so your property looks its absolute best.
              </motion.p>
              
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg h-16 px-10 rounded-none bg-secondary text-secondary-foreground hover:bg-white transition-colors" asChild data-testid="button-hero-quote">
                  <a href="#quote">
                    Get an Estimate <ArrowUpRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="text-lg h-16 px-10 rounded-none bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white" asChild data-testid="button-hero-call">
                  <a href={PHONE_HREF}>
                    <Phone className="mr-2 w-5 h-5" /> Call {PHONE}
                  </a>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Value Prop Banner */}
        <section className="bg-secondary text-secondary-foreground border-y-4 border-primary py-8 relative z-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <Zap className="w-10 h-10 shrink-0" />
                <div>
                  <h3 className="font-display font-black text-xl uppercase tracking-wide">Smart dispatch</h3>
                  <p className="font-medium opacity-90">AI matches the best crew near you instantly.</p>
                </div>
              </div>
              <div className="w-full md:w-px h-[1px] md:h-12 bg-primary/20" />
              <div className="flex flex-col md:flex-row items-center gap-4">
                <Navigation className="w-10 h-10 shrink-0" />
                <div>
                  <h3 className="font-display font-black text-xl uppercase tracking-wide">Live tracking</h3>
                  <p className="font-medium opacity-90">See your crew's status in real time — no guessing.</p>
                </div>
              </div>
              <div className="w-full md:w-px h-[1px] md:h-12 bg-primary/20" />
              <div className="flex flex-col md:flex-row items-center gap-4">
                <CreditCard className="w-10 h-10 shrink-0" />
                <div>
                  <h3 className="font-display font-black text-xl uppercase tracking-wide">Pay online</h3>
                  <p className="font-medium opacity-90">Digital invoices. Secure payments. Zero paperwork.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-32 bg-background relative">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
              <div className="max-w-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-primary w-12" />
                  <span className="text-primary font-bold uppercase tracking-widest text-sm">Our Expertise</span>
                </div>
                <h2 className="text-4xl lg:text-6xl font-display font-black uppercase tracking-tight text-foreground leading-none" data-testid="text-services-title">
                  Everything your exterior needs.
                </h2>
              </div>
              <p className="text-xl text-muted-foreground max-w-md font-medium">
                Expert care for your property from the soil up. We handle the heavy lifting so you don't have to.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-x-8 gap-y-16">
              {/* Service 1 */}
              <div className="group relative">
                <div className="aspect-[4/5] overflow-hidden mb-6 bg-muted">
                  <img 
                    src="/images/landscaping.png" 
                    alt="Professional lawn care and landscaping" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale-[0.2] group-hover:grayscale-0"
                    data-testid="img-service-1"
                  />
                  <div className="absolute top-4 right-4 bg-white text-primary p-3 shadow-xl">
                    <Leaf className="w-8 h-8" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-display font-black uppercase tracking-tight mb-4 group-hover:text-primary transition-colors">Landscaping</h3>
                  <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                    Weekly mowing, hedge trimming, mulch installs, and full property cleanups done on schedule.
                  </p>
                  <ul className="space-y-3 border-t border-border pt-6">
                    <li className="flex items-center gap-3 font-semibold"><CheckCircle2 className="w-5 h-5 text-secondary" /> Lawn Mowing</li>
                    <li className="flex items-center gap-3 font-semibold"><CheckCircle2 className="w-5 h-5 text-secondary" /> Hedge Trimming</li>
                    <li className="flex items-center gap-3 font-semibold"><CheckCircle2 className="w-5 h-5 text-secondary" /> Mulch & Cleanups</li>
                  </ul>
                </div>
              </div>

              {/* Service 2 */}
              <div className="group relative">
                <div className="aspect-[4/5] overflow-hidden mb-6 bg-muted">
                  <img 
                    src="/images/pressure-washing.png" 
                    alt="Pressure washing driveway and exterior" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale-[0.2] group-hover:grayscale-0"
                    data-testid="img-service-2"
                  />
                  <div className="absolute top-4 right-4 bg-primary text-white p-3 shadow-xl">
                    <Droplets className="w-8 h-8" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-display font-black uppercase tracking-tight mb-4 group-hover:text-primary transition-colors">Pressure Washing</h3>
                  <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                    Driveways, homes, patios, and walkways restored with professional-grade cleaning.
                  </p>
                  <ul className="space-y-3 border-t border-border pt-6">
                    <li className="flex items-center gap-3 font-semibold"><CheckCircle2 className="w-5 h-5 text-secondary" /> Driveways & Walkways</li>
                    <li className="flex items-center gap-3 font-semibold"><CheckCircle2 className="w-5 h-5 text-secondary" /> House Washing</li>
                    <li className="flex items-center gap-3 font-semibold"><CheckCircle2 className="w-5 h-5 text-secondary" /> Patios & Fences</li>
                  </ul>
                </div>
              </div>

              {/* Service 3 */}
              <div className="group relative">
                <div className="aspect-[4/5] overflow-hidden mb-6 bg-muted">
                  <img 
                    src="/images/maintenance.png" 
                    alt="Ongoing yard maintenance plan" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale-[0.2] group-hover:grayscale-0"
                    data-testid="img-service-3"
                  />
                  <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground p-3 shadow-xl">
                    <CalendarDays className="w-8 h-8" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-display font-black uppercase tracking-tight mb-4 group-hover:text-primary transition-colors">Maintenance</h3>
                  <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                    Monthly service plans so customers never have to think about their yard again.
                  </p>
                  <ul className="space-y-3 border-t border-border pt-6">
                    <li className="flex items-center gap-3 font-semibold"><CheckCircle2 className="w-5 h-5 text-secondary" /> Weekly / Bi-weekly</li>
                    <li className="flex items-center gap-3 font-semibold"><CheckCircle2 className="w-5 h-5 text-secondary" /> Scheduled Cleanups</li>
                    <li className="flex items-center gap-3 font-semibold"><CheckCircle2 className="w-5 h-5 text-secondary" /> Priority Service</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Service Tags */}
            <div className="mt-32 pt-12 border-t flex flex-col md:flex-row gap-8 items-start md:items-center">
              <p className="text-sm font-bold text-foreground uppercase tracking-widest whitespace-nowrap">Common Requests</p>
              <div className="flex flex-wrap gap-2">
                {["Lawn Mowing", "Hedge Trimming", "Mulch Installation", "Yard Cleanup", "Leaf Removal", "Driveway Washing", "House Washing", "Patio Cleaning"].map((tag) => (
                  <a
                    key={tag}
                    href="#quote"
                    className="px-4 py-2 bg-muted text-sm font-bold uppercase tracking-wide hover:bg-primary hover:text-white transition-colors"
                    data-testid={`tag-${tag.toLowerCase().replace(/ /g, '-')}`}
                  >
                    {tag}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Membership Plans Section */}
        <section id="plans" className="py-32 bg-muted relative">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto mb-20">
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="h-px bg-primary w-8" />
                <span className="text-primary font-bold uppercase tracking-widest text-sm">Membership Plans</span>
                <div className="h-px bg-primary w-8" />
              </div>
              <h2 className="text-4xl lg:text-6xl font-display font-black uppercase tracking-tight mb-8" data-testid="text-plans-title">
                Set it and forget it.
              </h2>
              <p className="text-xl text-muted-foreground font-medium">
                Lock in a plan and your property stays sharp year-round — no follow-ups, no missed appointments, no surprises. All plans include free estimates and priority scheduling.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">

              {/* Starter Plan */}
              <div className="bg-background p-8 lg:p-10 border-t-8 border-muted-foreground shadow-xl" data-testid="card-plan-starter">
                <div className="flex justify-between items-start mb-8 border-b pb-8">
                  <div>
                    <h3 className="font-display font-black text-2xl uppercase tracking-wide mb-2">Starter</h3>
                    <p className="text-sm font-semibold text-muted-foreground">Small to mid-size yards</p>
                  </div>
                  <div className="w-12 h-12 bg-muted flex items-center justify-center rounded-full">
                    <Leaf className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-start gap-1">
                    <span className="text-5xl font-display font-black tracking-tighter">$99</span>
                    <span className="text-muted-foreground font-bold mt-2">/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">Billed monthly — cancel anytime</p>
                </div>

                <ul className="space-y-4 mb-10">
                  {[
                    "Bi-weekly lawn mowing & edging",
                    "Debris blowdown after every visit",
                    "Seasonal yard cleanup (2x/year)",
                    "Free on-site estimate",
                    "Priority scheduling",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span className="font-medium text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="outline" size="lg" className="w-full h-14 rounded-none font-bold uppercase tracking-wide border-2 hover:bg-primary hover:text-white hover:border-primary" onClick={() => openPlanModal("Starter — $99/mo")} data-testid="button-plan-starter">
                  Get Started
                </Button>
              </div>

              {/* Property Pro Plan — Most Popular */}
              <div className="bg-primary text-primary-foreground p-8 lg:p-10 border-t-8 border-secondary shadow-2xl relative lg:-mt-8" data-testid="card-plan-pro">
                <div className="absolute top-0 right-8 -translate-y-1/2">
                  <span className="bg-secondary text-secondary-foreground font-black uppercase tracking-widest text-xs px-4 py-2 shadow-lg">
                    Most Popular
                  </span>
                </div>

                <div className="flex justify-between items-start mb-8 border-b border-primary-foreground/20 pb-8">
                  <div>
                    <h3 className="font-display font-black text-2xl uppercase tracking-wide mb-2">Property Pro</h3>
                    <p className="text-sm font-semibold text-primary-foreground/80">Most homeowners & rentals</p>
                  </div>
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-full">
                    <Zap className="w-5 h-5 text-secondary" />
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-start gap-1">
                    <span className="text-5xl font-display font-black tracking-tighter text-white">$179</span>
                    <span className="text-primary-foreground/70 font-bold mt-2">/mo</span>
                  </div>
                  <p className="text-sm text-primary-foreground/70 mt-2 font-medium">Save up to 20% compared to one-off</p>
                </div>

                <ul className="space-y-4 mb-10">
                  {[
                    "Weekly lawn mowing & edging",
                    "Monthly hedge & shrub trimming",
                    "Quarterly driveway or patio wash",
                    "Seasonal cleanup (spring & fall)",
                    "Mulch refresh (1x/year)",
                    "Priority scheduling & fast response",
                    "Free on-site estimate",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                      <span className="font-medium text-white/90">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button size="lg" className="w-full h-14 rounded-none font-bold uppercase tracking-wide bg-secondary text-secondary-foreground hover:bg-white transition-colors" onClick={() => openPlanModal("Property Pro — $179/mo")} data-testid="button-plan-pro">
                  Get Started
                </Button>
              </div>

              {/* Full Property Plan */}
              <div className="bg-background p-8 lg:p-10 border-t-8 border-foreground shadow-xl" data-testid="card-plan-full">
                <div className="flex justify-between items-start mb-8 border-b pb-8">
                  <div>
                    <h3 className="font-display font-black text-2xl uppercase tracking-wide mb-2">Full Property</h3>
                    <p className="text-sm font-semibold text-muted-foreground">Larger homes & estates</p>
                  </div>
                  <div className="w-12 h-12 bg-muted flex items-center justify-center rounded-full">
                    <Shield className="w-5 h-5 text-foreground" />
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-start gap-1">
                    <span className="text-5xl font-display font-black tracking-tighter">$299</span>
                    <span className="text-muted-foreground font-bold mt-2">/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">Complete exterior management</p>
                </div>

                <ul className="space-y-4 mb-10">
                  {[
                    "Weekly mowing, edging & trimming",
                    "Bi-monthly hedge & shrub care",
                    "Monthly pressure wash — driveway + house/patio",
                    "Mulch installation (2x/year)",
                    "Spring & fall full property cleanup",
                    "Leaf removal (in season)",
                    "Dedicated account contact",
                    "Same-week scheduling guarantee",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-foreground shrink-0" />
                      <span className="font-medium text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="outline" size="lg" className="w-full h-14 rounded-none font-bold uppercase tracking-wide border-2 border-foreground hover:bg-foreground hover:text-white" onClick={() => openPlanModal("Full Property — $299/mo")} data-testid="button-plan-full">
                  Get Started
                </Button>
              </div>
            </div>

            {/* Plan footnote */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-3 bg-white border px-8 py-4 text-sm font-bold uppercase tracking-wide shadow-sm">
                <Sparkles className="w-5 h-5 text-primary" />
                All plans include free estimates, no contracts, and can be customized.
              </div>
            </div>
          </div>
        </section>

        {/* Before & After Results */}
        <section id="results" className="py-32 bg-foreground text-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20">
              <div className="max-w-2xl">
                <h2 className="text-4xl lg:text-6xl font-display font-black uppercase tracking-tight mb-6" data-testid="text-results-title">The Proof.</h2>
                <p className="text-xl text-white/70 font-medium">The difference speaks for itself. Here's what a single visit from our crew can do for a property.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { label: "Driveway Restoration", img: "/images/pressure-washing.png", badge: "Pressure Washing" },
                { label: "Lawn Transformation", img: "/images/landscaping.png", badge: "Landscaping" },
                { label: "Full Property Cleanup", img: "/images/maintenance.png", badge: "Maintenance" },
              ].map((item, i) => (
                <div key={i} className="group relative bg-white/5 border border-white/10" data-testid={`card-result-${i}`}>
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={item.img}
                      alt={item.label}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest px-3 py-1">
                        {item.badge}
                      </span>
                    </div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <p className="text-white font-display font-bold text-2xl leading-tight">{item.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-32 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="h-px bg-primary w-8" />
                <span className="text-primary font-bold uppercase tracking-widest text-sm">The Process</span>
                <div className="h-px bg-primary w-8" />
              </div>
              <h2 className="text-4xl lg:text-6xl font-display font-black uppercase tracking-tight mb-6" data-testid="text-tracking-title">From request to done — all tracked.</h2>
              <p className="text-muted-foreground text-xl font-medium max-w-2xl mx-auto">We built the same smart dispatch tech as rideshare apps, just for your lawn and driveway.</p>
            </div>

            <div className="relative">
              <div className="hidden md:block absolute top-10 left-1/2 -translate-x-1/2 w-[75%] h-0.5 bg-gradient-to-r from-secondary via-primary to-secondary opacity-30" />
              <div className="grid md:grid-cols-4 gap-8">
                {[
                  { step: "01", icon: <ClipboardList className="w-7 h-7" />, title: "You Request", desc: "Fill out the form or call us. Your job is instantly in the dispatch system." },
                  { step: "02", icon: <Zap className="w-7 h-7" />, title: "We Match", desc: "Our engine scores nearby crews by rating, distance, and availability — then sends the best one." },
                  { step: "03", icon: <Navigation className="w-7 h-7" />, title: "You Track", desc: "Get a live status portal. Watch your job move from assigned → en route → in progress → done." },
                  { step: "04", icon: <CreditCard className="w-7 h-7" />, title: "You Pay Online", desc: "Digital invoice lands in your portal. Pay securely, rate the crew, done." },
                ].map((item, i) => (
                  <div key={i} className="relative text-center" data-testid={`row-lead-${i}`}>
                    <div className="w-20 h-20 bg-primary text-white flex items-center justify-center mx-auto mb-6 relative z-10">
                      {item.icon}
                    </div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[5rem] font-display font-black text-muted/30 leading-none select-none">{item.step}</div>
                    <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-3">{item.title}</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Platform Showcase */}
        <section className="py-32 bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
              <div className="max-w-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-primary w-12" />
                  <span className="text-primary font-bold uppercase tracking-widest text-sm">Built-in Technology</span>
                </div>
                <h2 className="text-4xl lg:text-6xl font-display font-black uppercase tracking-tight text-foreground leading-none">
                  Three portals. One system.
                </h2>
              </div>
              <p className="text-xl text-muted-foreground max-w-md font-medium">
                We run on the same kind of platform that powers rideshare and delivery apps — except built for outdoor services.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Client Portal */}
              <div className="bg-background border-2 border-primary/20 p-8 shadow-lg relative overflow-hidden group hover:border-primary transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full" />
                <div className="w-14 h-14 bg-primary text-white flex items-center justify-center mb-6">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-4">Client Portal</h3>
                <p className="text-muted-foreground mb-6 font-medium leading-relaxed">You get a private link. Enter your phone + Job ID. See exactly where your job stands, ETA included.</p>
                <ul className="space-y-3 border-t pt-6">
                  {[
                    { icon: <Navigation className="w-4 h-4 text-primary" />, text: "Real-time job status" },
                    { icon: <Clock className="w-4 h-4 text-primary" />, text: "Live crew ETA" },
                    { icon: <Receipt className="w-4 h-4 text-primary" />, text: "Digital invoice & online payment" },
                    { icon: <Star className="w-4 h-4 text-amber-500" />, text: "Rate your crew after service" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 font-semibold text-sm">
                      {item.icon} {item.text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Worker App */}
              <div className="bg-background border-2 border-secondary/30 p-8 shadow-lg relative overflow-hidden group hover:border-secondary transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full" />
                <div className="w-14 h-14 bg-secondary text-secondary-foreground flex items-center justify-center mb-6">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-4">Contractor App</h3>
                <p className="text-muted-foreground mb-6 font-medium leading-relaxed">Our crew members go online, get matched to nearby jobs, accept within 30 seconds, and walk through a live status flow.</p>
                <ul className="space-y-3 border-t pt-6">
                  {[
                    { icon: <Wifi className="w-4 h-4 text-secondary" />, text: "Online / offline toggle" },
                    { icon: <Zap className="w-4 h-4 text-secondary" />, text: "30-second job accept timer" },
                    { icon: <TrendingUp className="w-4 h-4 text-secondary" />, text: "Earnings & stats dashboard" },
                    { icon: <ShieldCheck className="w-4 h-4 text-secondary" />, text: "Completion rate & trust score" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 font-semibold text-sm">
                      {item.icon} {item.text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dispatch Board */}
              <div className="bg-background border-2 border-foreground/10 p-8 shadow-lg relative overflow-hidden group hover:border-foreground/30 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/3 rounded-bl-full" />
                <div className="w-14 h-14 bg-foreground text-background flex items-center justify-center mb-6">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-4">Dispatch Command</h3>
                <p className="text-muted-foreground mb-6 font-medium leading-relaxed">Our dispatch team sees every job, every crew member, revenue charts, and surge pricing — all live from one board.</p>
                <ul className="space-y-3 border-t pt-6">
                  {[
                    { icon: <Zap className="w-4 h-4 text-foreground" />, text: "AI matching engine" },
                    { icon: <BarChart3 className="w-4 h-4 text-foreground" />, text: "Revenue & pipeline charts" },
                    { icon: <TrendingUp className="w-4 h-4 text-foreground" />, text: "Surge pricing detection" },
                    { icon: <ClipboardList className="w-4 h-4 text-foreground" />, text: "Auto-dispatch or manual control" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 font-semibold text-sm">
                      {item.icon} {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "30s", label: "Avg. job accept time" },
                { value: "4.8★", label: "Average crew rating" },
                { value: "100%", label: "Jobs tracked live" },
                { value: "$0", label: "Paperwork. Ever." },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-4xl md:text-5xl font-display font-black tracking-tight mb-2 text-secondary">{stat.value}</p>
                  <p className="text-white/70 font-bold uppercase tracking-widest text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews" className="py-32 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mb-20">
              <h2 className="text-4xl lg:text-6xl font-display font-black uppercase tracking-tight mb-6" data-testid="text-reviews-title">Word on the street.</h2>
              <p className="text-xl text-muted-foreground font-medium">Real feedback from homeowners, realtors, and repeat clients across Georgia.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "They turned my driveway from black to brand new in one visit. Highly recommend.",
                  author: "Homeowner — McDonough"
                },
                {
                  quote: "Perfect for getting listings cleaned up fast before showings.",
                  author: "Realtor — Atlanta"
                },
                {
                  quote: "I use them monthly. Never have to follow up. Always done right.",
                  author: "Repeat Customer"
                }
              ].map((review, i) => (
                <div key={i} className="bg-background p-10 border-l-4 border-secondary shadow-lg relative" data-testid={`card-review-${i}`}>
                  <div className="flex gap-1 mb-8 text-secondary">
                    {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="w-6 h-6 fill-current" />)}
                  </div>
                  <p className="text-xl font-serif italic text-foreground leading-relaxed mb-8">"{review.quote}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary text-white flex items-center justify-center font-display font-black text-xl">
                      {review.author[0]}
                    </div>
                    <span className="font-bold text-foreground uppercase tracking-wide text-sm">{review.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="mb-16">
              <h2 className="text-4xl lg:text-5xl font-display font-black uppercase tracking-tight mb-6" data-testid="text-faq-title">Frequently Asked Questions</h2>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="border-2 px-6 bg-card">
                <AccordionTrigger className="text-left font-bold text-xl hover:no-underline py-6" data-testid="faq-trigger-1">Do you offer free estimates?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-lg leading-relaxed pb-6 font-medium">
                  Yes — request a quote online below or call us directly. For larger custom jobs we schedule a quick on-site visit at no charge.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-2 px-6 bg-card">
                <AccordionTrigger className="text-left font-bold text-xl hover:no-underline py-6" data-testid="faq-trigger-2">How does live tracking work?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-lg leading-relaxed pb-6 font-medium">
                  After booking, you receive a Job ID. Visit the Client Portal, enter your phone number and Job ID, and see your job's live status — assigned, en route, in progress, or complete — along with crew ETA.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-2 px-6 bg-card">
                <AccordionTrigger className="text-left font-bold text-xl hover:no-underline py-6" data-testid="faq-trigger-3">How does the matching engine choose a crew?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-lg leading-relaxed pb-6 font-medium">
                  Our dispatch engine scores every available crew member by their distance to your property, star rating, and completion rate — then routes the best match within seconds. You always get an experienced, nearby pro.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="border-2 px-6 bg-card">
                <AccordionTrigger className="text-left font-bold text-xl hover:no-underline py-6" data-testid="faq-trigger-4">How do I pay my invoice?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-lg leading-relaxed pb-6 font-medium">
                  Once your job is complete, your invoice appears directly in your Client Portal. Pay securely online with a card in seconds — no checks, no cash, no phone calls needed.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5" className="border-2 px-6 bg-card">
                <AccordionTrigger className="text-left font-bold text-xl hover:no-underline py-6" data-testid="faq-trigger-5">Do you work on residential and commercial properties?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-lg leading-relaxed pb-6 font-medium">
                  Yes. We handle homeowner jobs, rental properties, and commercial service requests across Georgia and surrounding areas.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA / Quote Form Section */}
        <section id="quote" className="py-32 bg-primary text-white relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div>
                <h2 className="text-5xl lg:text-7xl font-display font-black uppercase tracking-tight mb-8 leading-none" data-testid="text-cta-title">
                  Let's get to work.
                </h2>
                <p className="text-2xl text-white/80 mb-12 font-medium leading-relaxed">
                  Fast quotes. Clean work. We respond quickly and get the job done right the first time.
                </p>

                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 flex items-center justify-center shrink-0">
                      <Phone className="w-8 h-8 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">Call Direct</p>
                      <a href={PHONE_HREF} className="text-3xl font-display font-black hover:text-secondary transition-colors" data-testid="link-cta-phone">{PHONE}</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-8 h-8 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">Service Area</p>
                      <span className="text-xl font-bold">{LOCATION}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="bg-white text-foreground p-8 lg:p-12 shadow-2xl">
                <h3 className="text-3xl font-display font-black uppercase tracking-tight mb-8" data-testid="text-form-title">Request an Estimate</h3>
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                    <Input placeholder="John Smith" className="bg-muted border-0 h-14 rounded-none text-lg font-medium" data-testid="input-name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone</label>
                    <Input placeholder="(678) 555-0000" type="tel" className="bg-muted border-0 h-14 rounded-none text-lg font-medium" data-testid="input-phone" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Address</label>
                    <Input placeholder="123 Main St, Atlanta, GA" className="bg-muted border-0 h-14 rounded-none text-lg font-medium" data-testid="input-address" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Service Needed</label>
                    <Select>
                      <SelectTrigger className="bg-muted border-0 h-14 rounded-none text-lg font-medium" data-testid="select-service">
                        <SelectValue placeholder="Select Service" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="pressure-washing">Pressure Washing</SelectItem>
                        <SelectItem value="landscaping">Landscaping</SelectItem>
                        <SelectItem value="maintenance">Maintenance Plan</SelectItem>
                        <SelectItem value="other">Multiple / Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Details</label>
                    <Textarea 
                      placeholder="Tell us about your property..." 
                      className="bg-muted border-0 min-h-[120px] rounded-none text-lg font-medium resize-y" 
                      data-testid="input-details"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full mt-4 h-16 rounded-none text-lg font-bold uppercase tracking-wide bg-primary hover:bg-primary/90" data-testid="button-submit-quote">
                    Send Request
                  </Button>
                  <p className="text-sm text-center text-muted-foreground font-medium mt-6">We usually respond within 24 hours.</p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="mb-6">
                <Logo className="text-3xl text-white" />
              </div>
              <p className="text-white/60 text-lg max-w-sm mb-6 font-medium leading-relaxed">
                Georgia's smart outdoor services platform. AI-matched crews, live job tracking, digital invoicing, and online payments — all in one system.
              </p>
              <p className="text-white/60 font-medium">{LOCATION}</p>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-widest text-white mb-6">Services</h4>
              <ul className="space-y-4 font-medium text-white/60">
                <li><a href="#services" className="hover:text-secondary transition-colors">Landscaping</a></li>
                <li><a href="#services" className="hover:text-secondary transition-colors">Pressure Washing</a></li>
                <li><a href="#services" className="hover:text-secondary transition-colors">Maintenance Plans</a></li>
                <li><a href="#services" className="hover:text-secondary transition-colors">Seasonal Cleanups</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-widest text-white mb-6">Platform</h4>
              <ul className="space-y-4 font-medium text-white/60">
                <li><a href={PHONE_HREF} className="hover:text-secondary transition-colors">{PHONE}</a></li>
                <li><a href="#quote" className="hover:text-secondary transition-colors">Request a Quote</a></li>
                <li><span className="opacity-50">Client Portal</span></li>
                <li><span className="opacity-50">Contractor App</span></li>
                <li><span className="opacity-50">Dispatch Board</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-white/40">
            <p>&copy; {new Date().getFullYear()} Southern Roots Turf. All rights reserved.</p>
            <p className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-secondary" /> Powered by smart dispatch technology.</p>
          </div>
        </div>
      </footer>

      {/* Lead Capture Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md rounded-none border-0 p-0 overflow-hidden" data-testid="modal-lead-capture">
          {!submitted ? (
            <>
              <div className="bg-primary text-white p-6 md:p-8">
                <DialogTitle className="text-3xl font-display font-black uppercase tracking-tight mb-2">Get Started</DialogTitle>
                <DialogDescription className="text-white/80 font-medium text-base">
                  You selected: <span className="font-bold text-secondary">{selectedPlan}</span>
                  <br />
                  Fill in your info and we'll reach out to schedule your first visit.
                </DialogDescription>
              </div>

              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5" data-testid="form-plan-modal">
                <div className="space-y-2">
                  <Label htmlFor="modal-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                  <Input
                    id="modal-name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-muted border-0 h-12 rounded-none font-medium"
                    data-testid="modal-input-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modal-phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                  <Input
                    id="modal-phone"
                    placeholder="(678) 555-0000"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="bg-muted border-0 h-12 rounded-none font-medium"
                    data-testid="modal-input-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modal-address" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Property Address</Label>
                  <Input
                    id="modal-address"
                    placeholder="123 Main St, Atlanta, GA"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    className="bg-muted border-0 h-12 rounded-none font-medium"
                    data-testid="modal-input-address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modal-notes" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Anything else? <span className="normal-case tracking-normal opacity-70">(optional)</span></Label>
                  <Textarea
                    id="modal-notes"
                    placeholder="Special requests, best time to reach you..."
                    className="resize-none min-h-[80px] bg-muted border-0 rounded-none font-medium"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    data-testid="modal-input-notes"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full h-14 rounded-none font-bold uppercase tracking-wide mt-4" data-testid="modal-button-submit">
                  Send My Info
                </Button>

                <p className="text-xs text-center font-bold text-muted-foreground uppercase tracking-wider mt-4">
                  We'll call you within 24 hours.
                </p>
              </form>
            </>
          ) : (
            <div className="p-10 text-center space-y-6" data-testid="modal-success">
              <div className="w-20 h-20 bg-secondary flex items-center justify-center mx-auto rounded-full">
                <CheckCircle2 className="w-10 h-10 text-secondary-foreground" />
              </div>
              <DialogTitle className="text-4xl font-display font-black uppercase tracking-tight">You're all set.</DialogTitle>
              <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                We received your info for the <span className="font-bold text-foreground">{selectedPlan}</span> plan. Expect a call within 24 hours to schedule your first visit.
              </p>
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Need to reach us now?
                </p>
                <a href={PHONE_HREF} className="text-xl font-black text-foreground hover:text-primary">{PHONE}</a>
              </div>
              <Button className="mt-8 w-full h-14 rounded-none font-bold uppercase tracking-wide" onClick={() => setModalOpen(false)} data-testid="modal-button-close">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AppSwitcher />
    </div>
  );
}
