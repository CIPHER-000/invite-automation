import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { useAutoRefresh } from "@/hooks/use-realtime";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import Campaigns from "@/pages/campaigns";
import CreateCampaignPage from "@/components/campaigns/create-campaign-page";
import Accounts from "@/pages/accounts";
import Activity from "@/pages/activity";
import ActivityLog from "@/pages/activity-log";
import InboxManagement from "@/pages/inbox-management";
import UnifiedInboxManagement from "@/pages/unified-inbox-management";
import Settings from "@/pages/settings";
import ServiceAccountSetup from "@/pages/service-account-setup";
import InboxSetup from "@/pages/oauth-calendar";
import HelpCenter from "@/pages/help-center";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import SchedulingDashboard from "@/pages/scheduling-dashboard";
import CampaignScheduling from "@/pages/campaign-scheduling";
import ProspectValidation from "@/pages/prospect-validation";
import ConfirmationEmails from "@/pages/confirmation-emails";
import ResponseIntelligence from "@/pages/response-intelligence";
import InviteTimeline from "@/pages/invite-timeline";
import { Loader2 } from "lucide-react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Auto-refresh key data when window gains focus - only when authenticated
  useAutoRefresh(isAuthenticated ? [
    "/api/dashboard/stats",
    "/api/campaigns",
    "/api/accounts",
    "/api/activity",
  ] : []);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication page if not logged in
  if (!isAuthenticated) {
    return <Auth />;
  }

  // Show authenticated app
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
              <Route path="/campaigns/new" component={CreateCampaignPage} />
              <Route path="/campaigns/:id/scheduling" component={CampaignScheduling} />
              <Route path="/scheduling" component={SchedulingDashboard} />
              <Route path="/prospect-validation" component={ProspectValidation} />
              <Route path="/confirmation-emails" component={ConfirmationEmails} />
              <Route path="/response-intelligence" component={ResponseIntelligence} />
              <Route path="/invites/:inviteId/timeline" component={InviteTimeline} />
              <Route path="/accounts" component={ServiceAccountSetup} />
              <Route path="/inbox-setup" component={InboxSetup} />
              <Route path="/inbox-management" component={InboxManagement} />
              <Route path="/inboxes" component={UnifiedInboxManagement} />
              <Route path="/activity-log" component={ActivityLog} />
              <Route path="/activity">
                <Redirect to="/activity-log" />
              </Route>
              <Route path="/settings" component={Settings} />
              <Route path="/help-center" component={HelpCenter} />
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
