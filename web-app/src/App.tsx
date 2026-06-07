import { Router, Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "./lib/auth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Customers from "./pages/Customers";
import Workers from "./pages/Workers";
import Invoices from "./pages/Invoices";
import Escalations from "./pages/Escalations";
import Decisions from "./pages/Decisions";
import Dispatch from "./pages/Dispatch";
import Billing from "./pages/Billing";

export default function App() {
  const { user, loading } = useAuth();

  // Public, no-auth pages reachable from email links.
  const path = window.location.pathname;
  if (path === "/reset-password") return <ResetPassword />;
  if (path === "/verify-email") return <VerifyEmail />;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  // Logged out → public marketing site + auth screens.
  if (!user) {
    return (
      <Router>
        <Switch>
          <Route path="/login">{() => <Login initialMode="login" />}</Route>
          <Route path="/signup">{() => <Login initialMode="signup" />}</Route>
          <Route path="/" component={Landing} />
          <Route component={Landing} />
        </Switch>
      </Router>
    );
  }

  // Logged in → the owner dashboard.
  return (
    <Router>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/customers" component={Customers} />
          <Route path="/workers" component={Workers} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/escalations" component={Escalations} />
          <Route path="/ai/decisions" component={Decisions} />
          <Route path="/dispatch" component={Dispatch} />
          <Route path="/billing" component={Billing} />
        </Switch>
      </Layout>
    </Router>
  );
}
