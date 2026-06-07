import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { AppSwitcher } from "@/components/AppSwitcher";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Jobs from "@/pages/jobs";
import JobDetail from "@/pages/job-detail";
import Earnings from "@/pages/earnings";

const queryClient = new QueryClient();

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/jobs" component={Jobs} />
        <Route path="/jobs/:jobId" component={JobDetail} />
        <Route path="/earnings" component={Earnings} />
        <Route component={NotFound} />
      </Switch>
      <AppSwitcher />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
