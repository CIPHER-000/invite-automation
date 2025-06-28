import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Calendar,
  BarChart3,
  Megaphone,
  Clock,
  Settings,
  Users,
  Mail
} from "lucide-react";

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
    name: "Google Accounts",
    href: "/accounts",
    icon: Users,
  },
  {
    name: "Multi-Provider Accounts",
    href: "/accounts-enhanced",
    icon: Mail,
  },
  {
    name: "Activity Log",
    href: "/activity",
    icon: Clock,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-slate-200 fixed h-full z-10">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Calendar className="text-white" size={16} />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Campaign Auto</h1>
        </div>
      </div>
      
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href} asChild>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
