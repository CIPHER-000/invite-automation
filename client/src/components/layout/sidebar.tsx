import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Calendar,
  BarChart3,
  Megaphone,
  Clock,
  Settings,
  Users,
  Mail,
  Key,
  LogOut,
  FileText,
  Server,
  HelpCircle,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/shady5_no_bg_cropped_strict_1751311214067.png";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    name: "Inbox Setup",
    href: "/inboxes",
    icon: Mail,
  },
  {
    name: "Scheduling Logic",
    href: "/scheduling",
    icon: Calendar,
  },
  {
    name: "Data Enrichment",
    href: "/prospect-validation",
    icon: Search,
  },
  {
    name: "Activity Log",
    href: "/activity-log",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <aside className="fixed left-0 top-0 w-64 bg-white shadow-lg border-r border-gray-200 h-screen flex-shrink-0 z-10 flex flex-col">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200 flex justify-center">
        <img src={logoPath} alt="Logo" className="w-40 h-auto object-contain max-w-full" />
      </div>
      
      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href} asChild>
              <a
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                  isActive
                    ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Help Center and User Info */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        {/* Help Center Button */}
        <Link href="/help-center" asChild>
          <a
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium w-full",
              location === "/help-center"
                ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <HelpCircle size={20} />
            <span>Help Center</span>
          </a>
        </Link>
        
        {/* User Info and Logout */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">Logged in as:</p>
            <p className="text-sm font-medium text-gray-700 truncate">{user?.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
