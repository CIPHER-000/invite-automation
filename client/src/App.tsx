import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { useAutoRefresh } from "@/hooks/use-realtime";
import Dashboard from "@/pages/dashboard";
import Campaigns from "@/pages/campaigns";
import Accounts from "@/pages/accounts";
import Activity from "@/pages/activity";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  // Auto-refresh key data when window gains focus
  useAutoRefresh([
    "/api/dashboard/stats",
    "/api/campaigns",
    "/api/accounts",
    "/api/activity",
  ]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/activity" component={Activity} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
