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
  Key
} from "lucide-react";
import logoPath from "@assets/shady5_no_bg_cropped_strict_1751121425277.png";

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
    name: "Service Account Setup",
    href: "/accounts",
    icon: Key,
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
      {/* Logo/Brand Section */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <img src={logoPath} alt="Shady 5.0" className="w-8 h-8" />
          <div>
            <h1 className="font-bold text-lg text-slate-900">Shady 5.0</h1>
            <p className="text-xs text-slate-500">Calendar Automation</p>
          </div>
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
