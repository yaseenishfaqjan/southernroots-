import { Router, Switch, Route } from "wouter";
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
