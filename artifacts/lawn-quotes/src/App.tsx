import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DemoBar } from "@/components/DemoBar";
import Home from "@/pages/Home";
import QuoteWizard from "@/pages/QuoteWizard";
import RouteOptimization from "@/pages/RouteOptimization";
import MaintenanceDashboard from "@/pages/MaintenanceDashboard";
import NeighborhoodLeadMap from "@/pages/NeighborhoodLeadMap";
import OwnerDashboard from "@/pages/OwnerDashboard";

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/quote" component={QuoteWizard} />
          <Route path="/route" component={RouteOptimization} />
          <Route path="/maintenance" component={MaintenanceDashboard} />
          <Route path="/leads" component={NeighborhoodLeadMap} />
          <Route path="/dashboard" component={OwnerDashboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <DemoBar />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
