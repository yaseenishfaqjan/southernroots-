import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Zap, Scissors, Trees, Layers, Droplets, Wind, ChevronRight,
  ChevronLeft, CheckCircle2, BrainCircuit, Ruler, DollarSign, CalendarDays, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { servicesList, customerFormSchema, type CustomerFormValues, DEMO_SCENARIOS } from "@/lib/mock-data";
import { PropertyMap } from "@/components/PropertyMap";

const STEPS = ["Address", "Satellite Scan", "Select Services", "AI Quote", "Your Info", "Confirmed"];

const SERVICE_ICONS: Record<string, React.ElementType> = {
  scissors: Scissors, trees: Trees, layers: Layers, droplets: Droplets, wind: Wind,
};

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
        <span className="text-sm font-medium text-primary">{STEPS[step]}</span>
      </div>
      <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
    </div>
  );
}

// ── Step 0: Address ────────────────────────────────────────────────────────
function AddressStep({ onNext, demoAddress }: { onNext: (a: string) => void; demoAddress?: string }) {
  const [address, setAddress] = useState(demoAddress ?? "");
  const samples = ["1824 Peachtree Rd NW, Atlanta, GA", "562 Magnolia Dr, Savannah, GA", "3310 Piedmont Ave, Augusta, GA"];
  return (
    <motion.div key="step0" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Enter the property address</h2>
        <p className="text-muted-foreground">AI will locate the property and measure the lawn from satellite imagery.</p>
      </div>
      <div className="space-y-2">
        <Label>Street Address</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input data-testid="input-address" className="pl-9 h-12" placeholder="e.g. 1428 Oak Street, Atlanta, GA"
            value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sample addresses</p>
        {samples.map((s) => (
          <button key={s} onClick={() => setAddress(s)}
            className="w-full text-left text-sm px-3 py-2.5 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground">
            <MapPin className="inline h-3.5 w-3.5 mr-1.5 text-primary" />{s}
          </button>
        ))}
      </div>
      <Button size="lg" className="w-full h-12 rounded-xl" disabled={!address.trim()} onClick={() => onNext(address)} data-testid="btn-analyze">
        Analyze Property <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </motion.div>
  );
}

// ── Step 1: Satellite Scan ─────────────────────────────────────────────────
function SatelliteStep({ address, onNext, autoAdvance }: { address: string; onNext: () => void; autoAdvance?: boolean }) {
  const [phase, setPhase] = useState<"loading" | "scanning" | "done">("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPhase("scanning"), 500);
    const iv = setInterval(() => setProgress((p) => {
      if (p >= 100) { clearInterval(iv); setPhase("done"); return 100; }
      return p + (autoAdvance ? 8 : 3);
    }), 60);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, [autoAdvance]);

  useEffect(() => {
    if (autoAdvance && phase === "done") {
      const t = setTimeout(onNext, 700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [autoAdvance, phase, onNext]);

  return (
    <motion.div key="step1" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1">Satellite scan in progress</h2>
        <p className="text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" />{address}</p>
      </div>
      <div className="relative rounded-2xl border-2 overflow-hidden" style={{ height: 320 }} data-testid="satellite-map">
        <PropertyMap address={address} phase={phase} progress={progress} />
        <div className="absolute top-3 left-3 z-[600]">
          <Badge variant={phase === "done" ? "default" : "secondary"} className="shadow">
            {phase === "loading" && "Loading satellite..."}
            {phase === "scanning" && `AI scanning… ${progress}%`}
            {phase === "done" && "✓ Scan complete"}
          </Badge>
        </div>
        <div className="absolute bottom-3 right-3 z-[600] bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <div className="w-6 h-px bg-white" /> 50 ft
        </div>
      </div>
      {phase !== "done" && (
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">{phase === "loading" ? "Fetching imagery…" : "Measuring turf boundaries…"}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      {phase === "done" && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-primary/10 border border-primary/20">
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
          <div><p className="font-semibold text-sm text-primary">Property located</p><p className="text-xs text-muted-foreground">Measurement confidence: 94%</p></div>
        </div>
      )}
      <Button size="lg" className="w-full h-12 rounded-xl" disabled={phase !== "done"} onClick={onNext} data-testid="btn-select-services">
        Select Services <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </motion.div>
  );
}

// ── Step 2: Service Selection ─────────────────────────────────────────────
function ServicesStep({ selected, onChange, onNext, onBack }: { selected: string[]; onChange: (s: string[]) => void; onNext: () => void; onBack: () => void }) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <motion.div key="step2" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1">Select services</h2>
        <p className="text-muted-foreground">Choose everything you need. AI will price each by your lawn's exact size.</p>
      </div>
      <div className="grid gap-2.5">
        {servicesList.map((svc, i) => {
          const Icon = SERVICE_ICONS[svc.icon] ?? Scissors;
          const on = selected.includes(svc.id);
          return (
            <motion.button key={svc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => toggle(svc.id)} data-testid={`card-service-${svc.id}`}
              className={cn("flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all w-full",
                on ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30")}>
              <div className={cn("p-2.5 rounded-lg flex-shrink-0", on ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between"><span className="font-semibold text-sm">{svc.name}</span><span className="text-xs text-primary font-medium">from ${svc.priceMin}</span></div>
                <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>
              </div>
              <div className={cn("w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all", on ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                {on && <CheckCircle2 className="w-full h-full text-white p-0.5" />}
              </div>
            </motion.button>
          );
        })}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack} className="flex-1 h-12 rounded-xl"><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
        <Button size="lg" onClick={onNext} disabled={selected.length === 0} className="flex-1 h-12 rounded-xl" data-testid="btn-see-quote">See AI Quote <BrainCircuit className="ml-2 h-4 w-4" /></Button>
      </div>
    </motion.div>
  );
}

// ── Step 3: AI Quote Output ───────────────────────────────────────────────
function QuoteOutputStep({ selected, lawnSqFt, drivewaySqFt, onNext, onBack }: {
  selected: string[]; lawnSqFt: number; drivewaySqFt: number; onNext: (oneTime: number, monthly: number) => void; onBack: () => void;
}) {
  const selectedSvcs = servicesList.filter((s) => selected.includes(s.id));
  const lineItems = selectedSvcs.map((s) => ({ ...s, price: Math.max(s.priceMin, Math.round(s.basePrice * lawnSqFt)) }));
  const oneTimeTotal = lineItems.reduce((acc, s) => acc + s.price, 0) - (lineItems.length >= 3 ? 35 : lineItems.length >= 2 ? 20 : 0);
  const monthlyRecurring = selectedSvcs.filter((s) => s.monthlyMin > 0).reduce((acc, s) => acc + Math.max(s.monthlyMin, Math.round(s.basePrice * lawnSqFt * 4.3)), 0);
  const suggestedPackage = lineItems.length >= 4 ? "Full-Service Estate Plan" : lineItems.length >= 2 ? "Home Care Bundle" : "Single-Service Plan";

  const AIRow = ({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) => (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border">
      <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0"><Icon className="h-4 w-4 text-primary" /></div>
      <div className="flex-1 min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="font-bold text-sm">{value}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>
    </div>
  );

  return (
    <motion.div key="step3" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="bg-primary p-2 rounded-lg"><BrainCircuit className="h-5 w-5 text-white" /></div>
        <div><h2 className="text-2xl font-bold leading-tight">AI Quote Ready</h2><p className="text-xs text-muted-foreground">Calculated from satellite data</p></div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <AIRow icon={Ruler} label="Estimated Lawn Area" value={`${lawnSqFt.toLocaleString()} sq ft`} sub="Measured via satellite" />
        <AIRow icon={Layers} label="Driveway / Sidewalk" value={`${drivewaySqFt.toLocaleString()} sq ft`} sub="Hard surface area" />
        <AIRow icon={BrainCircuit} label="Suggested Package" value={suggestedPackage} />
        <AIRow icon={Zap} label="Confidence Score" value="94%" sub="High confidence" />
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Price Breakdown</span>
        </div>
        <div className="divide-y">
          {lineItems.map((item) => (
            <div key={item.id} className="flex justify-between px-4 py-3">
              <div><p className="font-medium text-sm">{item.name}</p></div>
              <span className="font-semibold">${item.price}</span>
            </div>
          ))}
          {lineItems.length >= 2 && (
            <div className="flex justify-between px-4 py-3 text-primary text-sm font-medium">
              <span>Bundle discount</span><span>-${lineItems.length >= 3 ? 35 : 20}</span>
            </div>
          )}
        </div>
        <div className="px-4 py-4 bg-muted/10 border-t grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-0.5">One-Time Visit</p>
            <p className="text-2xl font-bold text-primary" data-testid="text-one-time-price">${oneTimeTotal}</p>
          </div>
          <div className="text-center border-l">
            <p className="text-xs text-muted-foreground mb-0.5">Monthly Plan</p>
            <p className="text-2xl font-bold" data-testid="text-monthly-price">{monthlyRecurring > 0 ? `$${monthlyRecurring}/mo` : "N/A"}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
        <Shield className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <p className="text-xs text-emerald-800"><strong>Price Lock Guarantee</strong> — this price is locked for 30 days. No surprises.</p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack} className="flex-1 h-12 rounded-xl"><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
        <Button size="lg" onClick={() => onNext(oneTimeTotal, monthlyRecurring)} className="flex-1 h-12 rounded-xl" data-testid="btn-book-service">Book Service <ChevronRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </motion.div>
  );
}

import { Shield } from "lucide-react";

// ── Step 4: Customer Info ──────────────────────────────────────────────────
function CustomerInfoStep({ demoCustomer, onNext, onBack }: {
  demoCustomer?: typeof DEMO_SCENARIOS[0]["customer"]; onNext: (d: CustomerFormValues) => void; onBack: () => void;
}) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { name: demoCustomer?.name ?? "", email: demoCustomer?.email ?? "", phone: demoCustomer?.phone ?? "", startDate: demoCustomer?.startDate, notes: demoCustomer?.notes ?? "" },
  });
  return (
    <motion.div key="step4" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1">Almost done</h2>
        <p className="text-muted-foreground">We'll text you within 2 hours to confirm your appointment.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem className="col-span-2"><FormLabel>Full Name</FormLabel><FormControl><Input {...field} placeholder="Sarah Jenkins" className="h-11" data-testid="input-name" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} placeholder="(404) 555-0192" className="h-11" type="tel" data-testid="input-phone" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} placeholder="sarah@email.com" className="h-11" type="email" data-testid="input-email" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="startDate" render={({ field }) => (
            <FormItem className="flex flex-col"><FormLabel>Preferred Start Date</FormLabel>
              <Popover><PopoverTrigger asChild><FormControl>
                <Button variant="outline" className={cn("h-11 pl-3 text-left font-normal", !field.value && "text-muted-foreground")} data-testid="btn-date-picker">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, "PPP") : "Pick a date"}
                </Button>
              </FormControl></PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(d) => d < new Date()} initialFocus /></PopoverContent>
              </Popover><FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem><FormLabel>Notes (optional)</FormLabel><FormControl><Textarea {...field} placeholder="Gate code, pets, parking notes…" rows={2} data-testid="input-notes" /></FormControl><FormMessage /></FormItem>
          )} />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" size="lg" onClick={onBack} className="flex-1 h-12 rounded-xl"><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
            <Button type="submit" size="lg" className="flex-1 h-12 rounded-xl" data-testid="btn-confirm">Confirm Booking <CheckCircle2 className="ml-2 h-4 w-4" /></Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}

// ── Step 5: Confirmation ───────────────────────────────────────────────────
function ConfirmationStep({ address, selected, oneTime, monthly, customer }: {
  address: string; selected: string[]; oneTime: number; monthly: number; customer: CustomerFormValues | null;
}) {
  const [, setLocation] = useLocation();
  const confNum = useRef(`BCAI-${Math.floor(10000 + Math.random() * 90000)}`).current;
  const svcs = servicesList.filter((s) => selected.includes(s.id));
  return (
    <motion.div key="step5" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }} className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
      </motion.div>
      <div>
        <h2 className="text-2xl font-bold mb-1">You're booked!</h2>
        <p className="text-muted-foreground">Confirmation sent to {customer?.phone || "your phone"}. We'll see you soon.</p>
      </div>
      <div className="rounded-2xl border bg-card p-5 text-left space-y-3">
        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Confirmation #</span><Badge className="font-mono" data-testid="text-confirmation">{confNum}</Badge></div>
        <div className="divide-y text-sm">
          <div className="flex justify-between py-2.5"><span className="text-muted-foreground">Address</span><span className="font-medium text-right max-w-[55%]">{address}</span></div>
          <div className="flex justify-between py-2.5"><span className="text-muted-foreground">Services</span><span className="font-medium text-right">{svcs.map((s) => s.name).join(", ")}</span></div>
          {customer?.startDate && <div className="flex justify-between py-2.5"><span className="text-muted-foreground">Start Date</span><span className="font-medium">{format(customer.startDate, "PPP")}</span></div>}
          <div className="flex justify-between py-2.5"><span className="text-muted-foreground">One-time price</span><span className="font-bold text-primary text-lg">${oneTime}</span></div>
          {monthly > 0 && <div className="flex justify-between py-2.5"><span className="text-muted-foreground">Monthly plan</span><span className="font-bold">${monthly}/mo</span></div>}
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="lg" className="flex-1 h-12 rounded-xl" onClick={() => setLocation("/maintenance")} data-testid="btn-view-plan">View Maintenance Plan</Button>
        <Button size="lg" className="flex-1 h-12 rounded-xl" onClick={() => setLocation("/")} data-testid="btn-back-home">Back to Home</Button>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function QuoteWizard() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const isDemo = params.get("demo") === "1";
  const startStep = Math.min(5, Math.max(0, Number(params.get("step") ?? "0")));
  const scenIdx = Math.min(DEMO_SCENARIOS.length - 1, Math.max(0, Number(params.get("scenario") ?? "0")));
  const sc = DEMO_SCENARIOS[scenIdx];

  const [step, setStep] = useState(startStep);
  const [address, setAddress] = useState(isDemo ? sc.address : "");
  const [selectedServices, setSelectedServices] = useState<string[]>(isDemo ? sc.services : []);
  const [lawnSqFt] = useState(isDemo ? sc.lawnSqFt : 5420);
  const [drivewaySqFt] = useState(isDemo ? sc.drivewaySqFt : 680);
  const [oneTime, setOneTime] = useState(0);
  const [monthly, setMonthly] = useState(0);
  const [customer, setCustomer] = useState<CustomerFormValues | null>(isDemo ? { ...sc.customer } : null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background py-10 px-4 pb-28">
      <div className="max-w-xl mx-auto">
        {isDemo && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/25 rounded-xl text-sm">
            <BrainCircuit className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="font-semibold text-primary">Demo mode</span>
            <span className="text-muted-foreground">— {sc.label}</span>
          </motion.div>
        )}
        <StepIndicator step={step} />
        <div className="bg-card rounded-2xl border shadow-sm p-6 min-h-[480px]">
          <AnimatePresence mode="wait">
            {step === 0 && <AddressStep demoAddress={isDemo ? sc.address : undefined} onNext={(a) => { setAddress(a); setStep(1); }} />}
            {step === 1 && <SatelliteStep address={address || sc.address} onNext={() => setStep(2)} autoAdvance={isDemo} />}
            {step === 2 && <ServicesStep selected={selectedServices} onChange={setSelectedServices} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
            {step === 3 && <QuoteOutputStep selected={selectedServices} lawnSqFt={lawnSqFt} drivewaySqFt={drivewaySqFt} onNext={(o, m) => { setOneTime(o); setMonthly(m); setStep(4); }} onBack={() => setStep(2)} />}
            {step === 4 && <CustomerInfoStep demoCustomer={isDemo ? sc.customer : undefined} onNext={(d) => { setCustomer(d); setStep(5); }} onBack={() => setStep(3)} />}
            {step === 5 && <ConfirmationStep address={address || sc.address} selected={selectedServices} oneTime={oneTime} monthly={monthly} customer={customer} />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
