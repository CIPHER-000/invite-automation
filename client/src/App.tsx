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
import ServiceAccountSetup from "@/pages/service-account-setup";
import InboxSetup from "@/pages/oauth-calendar";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";

function Router() {
  // Auto-refresh key data when window gains focus
  useAutoRefresh([
    "/api/dashboard/stats",
    "/api/campaigns",
    "/api/accounts",
    "/api/activity",
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64">
          <div className="p-8">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/landing" component={Landing} />
              <Route path="/campaigns" component={Campaigns} />
              <Route path="/accounts" component={ServiceAccountSetup} />
              <Route path="/inbox-setup" component={InboxSetup} />
              <Route path="/activity" component={Activity} />
              <Route path="/settings" component={Settings} />
              <Route path="/service-account" component={ServiceAccountSetup} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
      </div>
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
