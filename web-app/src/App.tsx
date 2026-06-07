import { Router, Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "./lib/auth";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Customers from "./pages/Customers";
import Workers from "./pages/Workers";
import Invoices from "./pages/Invoices";
import Escalations from "./pages/Escalations";
import Decisions from "./pages/Decisions";
import Dispatch from "./pages/Dispatch";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

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
        </Switch>
      </Layout>
    </Router>
  );
}
