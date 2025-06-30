import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAutoRefresh } from "@/hooks/use-realtime";
import UnifiedDashboard from "@/pages/unified-dashboard";
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
    <Switch>
      <Route path="/" component={UnifiedDashboard} />
      <Route path="/landing" component={Landing} />
      <Route component={NotFound} />
    </Switch>
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
