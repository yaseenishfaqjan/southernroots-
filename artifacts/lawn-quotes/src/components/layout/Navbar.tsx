import { Link, useLocation } from "wouter";
import { BrainCircuit, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/quote",       label: "Get Quote" },
  { href: "/route",       label: "Route" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/leads",       label: "Leads" },
  { href: "/dashboard",   label: "Dashboard" },
];

export function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" data-testid="link-home">
          <div className="bg-primary p-1.5 rounded-lg">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">Blue Collar AI</span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Lawn Intelligence</span>
          </div>
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                location === href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              data-testid={`link-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {label}
            </Link>
          ))}
          <Button size="sm" className="ml-3 rounded-full px-5" asChild data-testid="btn-nav-quote">
            <Link href="/quote">Get Instant Quote</Link>
          </Button>
        </nav>

        {/* Mobile */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="btn-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex items-center gap-2 mb-8 mt-2">
                <div className="bg-primary p-1.5 rounded-lg"><BrainCircuit className="h-4 w-4 text-white" /></div>
                <span className="font-bold">Blue Collar AI</span>
              </div>
              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link key={href} href={href} className="text-base font-medium px-2 py-2 rounded-md hover:bg-muted transition-colors">
                    {label}
                  </Link>
                ))}
                <Button asChild className="w-full mt-4 rounded-full">
                  <Link href="/quote">Get Instant Quote</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
